#!/usr/bin/env python3
"""Analyze docked validation poses for YTHDF1 pocket occupancy and contacts."""

from __future__ import annotations

import argparse
import csv
import math
from dataclasses import dataclass
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RECEPTOR = ROOT / "data" / "receptors" / "ythdf1_7qkn_chainA.pdb"
DEFAULT_REFERENCE_LIGAND = ROOT / "data" / "receptors" / "transferred_7qkn_jvf_on_7qkn_chainA.pdb"
DEFAULT_DOCKING_DIR = ROOT / "results" / "docking" / "validation_7qkn"
DEFAULT_SCORES = DEFAULT_DOCKING_DIR / "consensus_validation_scores.tsv"
DEFAULT_OUT = DEFAULT_DOCKING_DIR / "pose_contact_summary.tsv"

POLAR_ELEMENTS = {"N", "O", "S"}
HYDROPHOBIC_ELEMENTS = {"C", "S"}


@dataclass(frozen=True)
class Atom:
    name: str
    residue_name: str
    chain_id: str
    residue_id: int
    element: str
    x: float
    y: float
    z: float

    @property
    def residue_key(self) -> str:
        return f"{self.chain_id}:{self.residue_name}{self.residue_id}"


def distance(a: Atom, b: Atom) -> float:
    return math.dist((a.x, a.y, a.z), (b.x, b.y, b.z))


def centroid(atoms: list[Atom]) -> tuple[float, float, float]:
    if not atoms:
        raise ValueError("Cannot compute centroid of an empty atom list")
    return (
        sum(atom.x for atom in atoms) / len(atoms),
        sum(atom.y for atom in atoms) / len(atoms),
        sum(atom.z for atom in atoms) / len(atoms),
    )


def centroid_distance(atoms: list[Atom], center: tuple[float, float, float]) -> float:
    own = centroid(atoms)
    return math.dist(own, center)


def parse_pdb_atoms(path: Path, hetatm: bool | None = None) -> list[Atom]:
    atoms: list[Atom] = []
    for line in path.read_text(errors="replace").splitlines():
        record = line[:6].strip()
        if record not in {"ATOM", "HETATM"}:
            continue
        if hetatm is True and record != "HETATM":
            continue
        if hetatm is False and record != "ATOM":
            continue
        element = line[76:78].strip() or line[12:16].strip()[0]
        if element.upper() == "H":
            continue
        atoms.append(
            Atom(
                name=line[12:16].strip(),
                residue_name=line[17:20].strip(),
                chain_id=line[21].strip() or "_",
                residue_id=int(line[22:26]),
                element=element.upper()[0],
                x=float(line[30:38]),
                y=float(line[38:46]),
                z=float(line[46:54]),
            )
        )
    return atoms


def parse_first_model_pdbqt(path: Path) -> list[Atom]:
    atoms: list[Atom] = []
    in_first_model = False
    saw_model = False
    for line in path.read_text(errors="replace").splitlines():
        if line.startswith("MODEL"):
            if saw_model:
                break
            saw_model = True
            in_first_model = True
            continue
        if line.startswith("ENDMDL") and in_first_model:
            break
        if not line.startswith(("ATOM", "HETATM")):
            continue
        if saw_model and not in_first_model:
            continue
        atom_type = line[77:].strip().split()
        element = atom_type[-1] if atom_type else line[12:16].strip()[0]
        element = "".join(ch for ch in element if ch.isalpha()).upper()[:1]
        if element == "H":
            continue
        atoms.append(
            Atom(
                name=line[12:16].strip(),
                residue_name=line[17:20].strip() or "UNL",
                chain_id=line[21].strip() or "_",
                residue_id=int(line[22:26]),
                element=element,
                x=float(line[30:38]),
                y=float(line[38:46]),
                z=float(line[46:54]),
            )
        )
    return atoms


def contact_summary(
    ligand_atoms: list[Atom],
    receptor_atoms: list[Atom],
    reference_pocket_residues: set[str],
    cutoff: float,
) -> dict[str, object]:
    contact_residues: set[str] = set()
    polar_contacts = 0
    hydrophobic_contacts = 0
    min_distance = float("inf")

    for ligand_atom in ligand_atoms:
        for receptor_atom in receptor_atoms:
            d = distance(ligand_atom, receptor_atom)
            if d < min_distance:
                min_distance = d
            if d > cutoff:
                continue
            contact_residues.add(receptor_atom.residue_key)
            if d <= 3.5 and ligand_atom.element in POLAR_ELEMENTS and receptor_atom.element in POLAR_ELEMENTS:
                polar_contacts += 1
            if ligand_atom.element in HYDROPHOBIC_ELEMENTS and receptor_atom.element in HYDROPHOBIC_ELEMENTS:
                hydrophobic_contacts += 1

    overlap = contact_residues & reference_pocket_residues
    return {
        "contact_residue_count": len(contact_residues),
        "reference_overlap_count": len(overlap),
        "reference_overlap_fraction": len(overlap) / len(reference_pocket_residues) if reference_pocket_residues else 0.0,
        "polar_contact_count": polar_contacts,
        "hydrophobic_contact_count": hydrophobic_contacts,
        "min_heavy_atom_distance": min_distance,
        "contact_residues": ",".join(sorted(contact_residues)),
        "reference_overlap_residues": ",".join(sorted(overlap)),
    }


def analyze(args: argparse.Namespace) -> int:
    receptor_atoms = parse_pdb_atoms(args.receptor, hetatm=False)
    reference_atoms = parse_pdb_atoms(args.reference_ligand, hetatm=True)
    reference_center = centroid(reference_atoms)
    reference_contacts = contact_summary(reference_atoms, receptor_atoms, set(), args.contact_cutoff)
    reference_pocket_residues = set(str(reference_contacts["contact_residues"]).split(","))
    reference_pocket_residues.discard("")

    score_table = pd.read_csv(args.scores, sep="\t")
    rows: list[dict[str, object]] = []

    for engine in args.engines:
        pose_dir = args.docking_dir / engine / "poses"
        for pose_file in sorted(pose_dir.glob("*.pdbqt")):
            ligand_atoms = parse_first_model_pdbqt(pose_file)
            if not ligand_atoms:
                continue
            summary = contact_summary(ligand_atoms, receptor_atoms, reference_pocket_residues, args.contact_cutoff)
            center_distance = centroid_distance(ligand_atoms, reference_center)
            rows.append(
                {
                    "engine": engine,
                    "compound_id": pose_file.stem,
                    "pose_file": str(pose_file.relative_to(ROOT)),
                    "ligand_centroid_distance_to_reference": center_distance,
                    "within_reference_center_cutoff": center_distance <= args.center_cutoff,
                    **summary,
                }
            )

    contact_df = pd.DataFrame(rows)
    merged = contact_df.merge(score_table, on="compound_id", how="left")
    merged["pose_quality_flag"] = (
        (merged["within_reference_center_cutoff"])
        & (merged["reference_overlap_fraction"] >= args.min_overlap_fraction)
        & (merged["polar_contact_count"] >= args.min_polar_contacts)
    )
    merged = merged.sort_values(
        ["pose_quality_flag", "mean_rank", "reference_overlap_fraction", "ligand_centroid_distance_to_reference"],
        ascending=[False, True, False, True],
    )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    merged.to_csv(args.out, sep="\t", index=False, float_format="%.4f", quoting=csv.QUOTE_MINIMAL)
    compound_summary = summarize_by_compound(merged)
    compound_summary_file = args.out.with_name("pose_quality_by_compound.tsv")
    compound_summary.to_csv(compound_summary_file, sep="\t", index=False, float_format="%.4f")

    reference_file = args.out.with_name("reference_pocket_residues.tsv")
    with reference_file.open("w", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow(["reference_ligand", "contact_cutoff_angstrom", "residue"])
        for residue in sorted(reference_pocket_residues):
            writer.writerow([args.reference_ligand.name, args.contact_cutoff, residue])

    print(f"Reference pocket residues: {len(reference_pocket_residues)}")
    print(f"Wrote pose contact summary: {args.out.relative_to(ROOT)}")
    print(f"Wrote compound pose summary: {compound_summary_file.relative_to(ROOT)}")
    print(f"Wrote reference pocket residues: {reference_file.relative_to(ROOT)}")
    display_cols = [
        "engine",
        "compound_id",
        "mean_rank",
        "ligand_centroid_distance_to_reference",
        "reference_overlap_fraction",
        "polar_contact_count",
        "pose_quality_flag",
    ]
    print(merged[display_cols].head(12).to_string(index=False))
    return 0


def summarize_by_compound(merged: pd.DataFrame) -> pd.DataFrame:
    grouped = merged.groupby("compound_id", as_index=False).agg(
        engines_tested=("engine", "nunique"),
        engines_passing=("pose_quality_flag", "sum"),
        best_mean_rank=("mean_rank", "min"),
        best_score=("best_score", "min"),
        best_ligand_efficiency=("best_ligand_efficiency", "min"),
        min_centroid_distance=("ligand_centroid_distance_to_reference", "min"),
        max_reference_overlap_fraction=("reference_overlap_fraction", "max"),
        max_polar_contacts=("polar_contact_count", "max"),
        max_hydrophobic_contacts=("hydrophobic_contact_count", "max"),
    )
    grouped["passes_both_engines"] = grouped["engines_passing"] == grouped["engines_tested"]
    return grouped.sort_values(
        ["passes_both_engines", "best_mean_rank", "min_centroid_distance"],
        ascending=[False, True, True],
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receptor", type=Path, default=DEFAULT_RECEPTOR)
    parser.add_argument("--reference-ligand", type=Path, default=DEFAULT_REFERENCE_LIGAND)
    parser.add_argument("--docking-dir", type=Path, default=DEFAULT_DOCKING_DIR)
    parser.add_argument("--scores", type=Path, default=DEFAULT_SCORES)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--engines", nargs="+", default=["vina", "smina"], choices=["vina", "smina"])
    parser.add_argument("--contact-cutoff", type=float, default=4.0)
    parser.add_argument("--center-cutoff", type=float, default=6.0)
    parser.add_argument("--min-overlap-fraction", type=float, default=0.35)
    parser.add_argument("--min-polar-contacts", type=int, default=1)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.receptor = args.receptor if args.receptor.is_absolute() else ROOT / args.receptor
    args.reference_ligand = args.reference_ligand if args.reference_ligand.is_absolute() else ROOT / args.reference_ligand
    args.docking_dir = args.docking_dir if args.docking_dir.is_absolute() else ROOT / args.docking_dir
    args.scores = args.scores if args.scores.is_absolute() else ROOT / args.scores
    args.out = args.out if args.out.is_absolute() else ROOT / args.out
    return analyze(args)


if __name__ == "__main__":
    raise SystemExit(main())
