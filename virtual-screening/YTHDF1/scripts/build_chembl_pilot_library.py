#!/usr/bin/env python3
"""Stream-filter a ChEMBL SDF into a focused pilot screening library."""

from __future__ import annotations

import argparse
import csv
import gzip
import random
import sys
from pathlib import Path

from rdkit import Chem
from rdkit.Chem import Crippen, Descriptors, Lipinski, rdMolDescriptors


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = Path("/home/ashgrey/Documents/Database/chembl_37.sdf.gz")
DEFAULT_OUT_SMI = ROOT / "data" / "ligands" / "chembl_pilot_1k.smi"
DEFAULT_OUT_META = ROOT / "data" / "ligands" / "chembl_pilot_1k_metadata.tsv"
DEFAULT_REPORT = ROOT / "data" / "ligands" / "chembl_pilot_1k_filter_report.tsv"

FOCUS_SMARTS = {
    "purine": "n1cnc2[nH]cnc12",
    "pyrimidine": "n1cccnc1",
    "quinazoline": "n1cnc2ccccc12",
    "benzimidazole": "c1ccc2[nH]cnc2c1",
    "indazole": "c1ccc2[nH]ncc2c1",
    "xanthine_like": "O=c1[nH]c(=O)n2cncc12",
    "heteroaromatic_ring": "[a;!c]",
}

REACTIVE_SMARTS = {
    "acid_chloride": "C(=O)Cl",
    "sulfonyl_chloride": "S(=O)(=O)Cl",
    "isocyanate": "N=C=O",
    "isothiocyanate": "N=C=S",
    "aldehyde": "[CX3H1](=O)[#6]",
    "epoxide": "C1OC1",
    "azide": "N=[N+]=[N-]",
}

ALLOWED_ELEMENTS = {1, 6, 7, 8, 9, 15, 16, 17, 35, 53}


def compile_smarts(patterns: dict[str, str]) -> dict[str, Chem.Mol]:
    return {name: Chem.MolFromSmarts(smarts) for name, smarts in patterns.items()}


FOCUS_PATTERNS = compile_smarts(FOCUS_SMARTS)
REACTIVE_PATTERNS = compile_smarts(REACTIVE_SMARTS)


def molecule_id(mol: Chem.Mol, fallback: int) -> str:
    for prop in ("chembl_id", "ChEMBL ID", "chembl_molecule_id", "_Name"):
        if mol.HasProp(prop):
            value = mol.GetProp(prop).strip()
            if value:
                return value
    return f"chembl_record_{fallback}"


def salts_or_fragments(mol: Chem.Mol) -> bool:
    fragments = Chem.GetMolFrags(mol, asMols=True, sanitizeFrags=False)
    return len(fragments) != 1


def focus_tags(mol: Chem.Mol) -> list[str]:
    return [name for name, pattern in FOCUS_PATTERNS.items() if pattern is not None and mol.HasSubstructMatch(pattern)]


def reactive_tags(mol: Chem.Mol) -> list[str]:
    return [name for name, pattern in REACTIVE_PATTERNS.items() if pattern is not None and mol.HasSubstructMatch(pattern)]


def allowed_elements(mol: Chem.Mol) -> bool:
    return all(atom.GetAtomicNum() in ALLOWED_ELEMENTS for atom in mol.GetAtoms())


def properties(mol: Chem.Mol) -> dict[str, float | int]:
    return {
        "heavy_atoms": mol.GetNumHeavyAtoms(),
        "mw": Descriptors.MolWt(mol),
        "clogp": Crippen.MolLogP(mol),
        "tpsa": rdMolDescriptors.CalcTPSA(mol),
        "hbd": Lipinski.NumHDonors(mol),
        "hba": Lipinski.NumHAcceptors(mol),
        "rotatable_bonds": Lipinski.NumRotatableBonds(mol),
        "ring_count": rdMolDescriptors.CalcNumRings(mol),
        "aromatic_ring_count": rdMolDescriptors.CalcNumAromaticRings(mol),
    }


def passes_filters(mol: Chem.Mol) -> tuple[bool, str, dict[str, float | int], list[str]]:
    if salts_or_fragments(mol):
        return False, "salt_or_multiple_fragments", {}, []
    if not allowed_elements(mol):
        return False, "disallowed_element", {}, []
    tags = focus_tags(mol)
    if not tags:
        return False, "no_focus_substructure", {}, []
    liabilities = reactive_tags(mol)
    if liabilities:
        return False, "reactive_" + ",".join(liabilities), {}, tags
    props = properties(mol)
    if not (150 <= props["mw"] <= 450):
        return False, "mw_out_of_range", props, tags
    if not (-1.5 <= props["clogp"] <= 4.5):
        return False, "clogp_out_of_range", props, tags
    if props["tpsa"] > 130:
        return False, "tpsa_too_high", props, tags
    if props["hbd"] > 5:
        return False, "hbd_too_high", props, tags
    if props["hba"] > 10:
        return False, "hba_too_high", props, tags
    if props["rotatable_bonds"] > 8:
        return False, "too_many_rotatable_bonds", props, tags
    if props["ring_count"] < 1:
        return False, "no_ring", props, tags
    return True, "pass", props, tags


def add_to_reservoir(
    reservoir: list[dict[str, object]],
    row: dict[str, object],
    seen: int,
    target_count: int,
    rng: random.Random
) -> None:
    if len(reservoir) < target_count:
        reservoir.append(row)
        return
    replacement = rng.randrange(seen)
    if replacement < target_count:
        reservoir[replacement] = row


def build_library(args: argparse.Namespace) -> int:
    rng = random.Random(args.seed)
    seen_pass = 0
    parsed = 0
    invalid = 0
    reason_counts: dict[str, int] = {}
    selected: list[dict[str, object]] = []
    selected_smiles: set[str] = set()

    with gzip.open(args.input, "rb") as handle:
        supplier = Chem.ForwardSDMolSupplier(handle, sanitize=True, removeHs=True)
        for idx, mol in enumerate(supplier, start=1):
            if mol is None:
                invalid += 1
                continue
            parsed += 1
            if args.max_records and parsed > args.max_records:
                break

            ok, reason, props, tags = passes_filters(mol)
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
            if not ok:
                continue

            smiles = Chem.MolToSmiles(mol, isomericSmiles=True)
            if smiles in selected_smiles:
                reason_counts["duplicate_smiles"] = reason_counts.get("duplicate_smiles", 0) + 1
                continue

            seen_pass += 1
            selected_smiles.add(smiles)
            compound_id = molecule_id(mol, idx)
            row: dict[str, object] = {
                "compound_id": compound_id,
                "smiles": smiles,
                "focus_tags": ",".join(tags),
                **props,
            }
            add_to_reservoir(selected, row, seen_pass, args.target_count, rng)

            if args.stop_after_target and len(selected) >= args.target_count:
                break

            if parsed % args.progress_every == 0:
                print(f"parsed={parsed} pass={seen_pass} selected={len(selected)}", file=sys.stderr)

    args.out_smi.parent.mkdir(parents=True, exist_ok=True)
    with args.out_smi.open("w") as handle:
        for row in selected:
            handle.write(f"{row['smiles']} {row['compound_id']}\n")

    with args.out_meta.open("w", newline="") as handle:
        fieldnames = [
            "compound_id",
            "smiles",
            "focus_tags",
            "heavy_atoms",
            "mw",
            "clogp",
            "tpsa",
            "hbd",
            "hba",
            "rotatable_bonds",
            "ring_count",
            "aromatic_ring_count",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter="\t")
        writer.writeheader()
        writer.writerows(selected)

    with args.report.open("w", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow(["metric", "value"])
        writer.writerow(["parsed_records", parsed])
        writer.writerow(["invalid_records", invalid])
        writer.writerow(["passing_unique_records_seen", seen_pass])
        writer.writerow(["selected_records", len(selected)])
        writer.writerow(["seed", args.seed])
        writer.writerow(["target_count", args.target_count])
        writer.writerow(["max_records", args.max_records or "all"])
        writer.writerow(["stop_after_target", args.stop_after_target])
        for reason, count in sorted(reason_counts.items()):
            writer.writerow([f"filter_reason:{reason}", count])

    print(f"Wrote pilot SMILES: {args.out_smi.relative_to(ROOT)}")
    print(f"Wrote metadata: {args.out_meta.relative_to(ROOT)}")
    print(f"Wrote filter report: {args.report.relative_to(ROOT)}")
    print(f"Selected {len(selected)} compounds from {parsed} parsed records")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--target-count", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=20260710)
    parser.add_argument("--max-records", type=int, default=0, help="0 means scan all records")
    parser.add_argument("--stop-after-target", action="store_true", help="Stop once target count is reached")
    parser.add_argument("--progress-every", type=int, default=100000)
    parser.add_argument("--out-smi", type=Path, default=DEFAULT_OUT_SMI)
    parser.add_argument("--out-meta", type=Path, default=DEFAULT_OUT_META)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.out_smi = args.out_smi if args.out_smi.is_absolute() else ROOT / args.out_smi
    args.out_meta = args.out_meta if args.out_meta.is_absolute() else ROOT / args.out_meta
    args.report = args.report if args.report.is_absolute() else ROOT / args.report
    return build_library(args)


if __name__ == "__main__":
    raise SystemExit(main())
