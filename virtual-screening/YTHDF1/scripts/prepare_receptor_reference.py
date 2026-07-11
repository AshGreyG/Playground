#!/usr/bin/env python3
"""Download receptor/reference structures and transfer a pocket-ligand center."""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from urllib.request import urlopen

import yaml
from Bio import Align
from Bio.PDB import PDBIO, PDBParser, Select, Superimposer
from Bio.PDB.Polypeptide import protein_letters_3to1


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "structures"
RECEPTOR_DIR = ROOT / "data" / "receptors"
CONFIG_FILE = ROOT / "config" / "pipeline.yaml"


@dataclass(frozen=True)
class ResidueCA:
    residue: object
    chain_id: str
    resid: int
    aa: str


class ChainProteinSelect(Select):
    def __init__(self, chain_id: str) -> None:
        self.chain_id = chain_id

    def accept_chain(self, chain) -> bool:  # noqa: ANN001 - Bio.PDB signature
        return chain.id == self.chain_id

    def accept_residue(self, residue) -> bool:  # noqa: ANN001 - Bio.PDB signature
        hetflag = residue.id[0]
        resname = residue.resname.upper()
        return hetflag == " " and resname in protein_letters_3to1

    def accept_atom(self, atom) -> bool:  # noqa: ANN001 - Bio.PDB signature
        return atom.element != "H"


class ResidueSelect(Select):
    def __init__(self, residue) -> None:  # noqa: ANN001 - Bio.PDB object
        self.target = residue

    def accept_residue(self, residue) -> bool:  # noqa: ANN001 - Bio.PDB signature
        return residue is self.target


def download_pdb(pdb_id: str, outdir: Path) -> Path:
    outdir.mkdir(parents=True, exist_ok=True)
    out = outdir / f"{pdb_id.upper()}.pdb"
    if out.exists() and out.stat().st_size > 0:
        return out
    url = f"https://files.rcsb.org/download/{pdb_id.upper()}.pdb"
    with urlopen(url, timeout=60) as response:
        out.write_bytes(response.read())
    return out


def chain_ca_sequence(structure, chain_id: str) -> list[ResidueCA]:  # noqa: ANN001 - Bio.PDB object
    chain = structure[0][chain_id]
    residues: list[ResidueCA] = []
    for residue in chain:
        resname = residue.resname.upper()
        if residue.id[0] != " " or resname not in protein_letters_3to1 or "CA" not in residue:
            continue
        residues.append(
            ResidueCA(
                residue=residue,
                chain_id=chain_id,
                resid=int(residue.id[1]),
                aa=protein_letters_3to1[resname],
            )
        )
    return residues


def aligned_ca_pairs(target: list[ResidueCA], reference: list[ResidueCA], mode: str) -> tuple[list, list, str, str]:
    target_seq = "".join(item.aa for item in target)
    reference_seq = "".join(item.aa for item in reference)
    # converts two `ResidueCA` sequences into two amino acids sequences for
    # easy comparison

    aligner = Align.PairwiseAligner()
    aligner.mode = mode
    # mode is "global" or "local"
    aligner.match_score = 2
    aligner.mismatch_score = -1
    aligner.open_gap_score = -10
    aligner.extend_gap_score = -0.5
    alignment = aligner.align(target_seq, reference_seq)[0]

    target_atoms = []
    reference_atoms = []
    # alignment.aligned is a tuple (target_blocks, reference_blocks)
    # each block is a tuple of internal (start, end)

    for target_block, reference_block in zip(*alignment.aligned, strict=True):
        target_start, target_end = target_block
        reference_start, reference_end = reference_block
        length = min(target_end - target_start, reference_end - reference_start)

        for offset in range(length):
            target_res = target[target_start + offset]
            reference_res = reference[reference_start + offset]
            target_atoms.append(target_res.residue["CA"])
            reference_atoms.append(reference_res.residue["CA"])

    return target_atoms, reference_atoms, target_seq, reference_seq


def find_ligand_residue(structure, ligand_name: str):  # noqa: ANN001 - Bio.PDB object
    for residue in structure.get_residues():
        if residue.resname.upper() == ligand_name.upper():
            return residue
    raise ValueError(f"Could not find ligand residue {ligand_name}")


def residue_centroid(residue) -> tuple[float, float, float]:  # noqa: ANN001 - Bio.PDB object
    coords = [atom.coord for atom in residue if atom.element != "H"]
    if not coords:
        raise ValueError(f"No heavy atoms found for residue {residue.resname}")
    center = sum(coords) / len(coords)
    return tuple(float(value) for value in center)


def save_selected_pdb(structure, path: Path, selector: Select) -> None:  # noqa: ANN001 - Bio.PDB object
    io = PDBIO()
    io.set_structure(structure)
    io.save(str(path), selector)


def update_pipeline_config(
    center: tuple[float, float, float],
    target_pdb: str,
    target_chain: str,
    reference_pdb: str,
    reference_chain: str,
    reference_ligand: str,
    receptor_pdb: Path,
) -> None:
    data = yaml.safe_load(CONFIG_FILE.read_text())
    data["receptor"]["selected_structures"] = [
        {
            "pdb_id": target_pdb.upper(),
            "chain": target_chain,
            "role": "primary apo YTHDF1 YTH-domain receptor",
            "file": str(receptor_pdb.relative_to(ROOT)),
        },
        {
            "pdb_id": reference_pdb.upper(),
            "chain": reference_chain,
            "role": f"pocket reference containing ligand {reference_ligand.upper()}",
            "file": str((RAW_DIR / f"{reference_pdb.upper()}.pdb").relative_to(ROOT)),
        },
    ]
    data["pocket"]["grid"]["center_xyz"] = [round(value, 3) for value in center]
    data["pocket"]["grid"]["size_xyz_angstrom"] = [20.0, 20.0, 20.0]
    data["pocket"]["center_source"] = (
        f"{reference_pdb.upper()} {reference_ligand.upper()} ligand centroid transferred onto "
        f"{target_pdb.upper()} chain {target_chain} by YTH-domain CA alignment"
    )
    CONFIG_FILE.write_text(yaml.safe_dump(data, sort_keys=False))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target-pdb", default="4RCI")
    parser.add_argument("--target-chain", default="A")
    parser.add_argument("--reference-pdb", default="6ZD7")
    parser.add_argument("--reference-chain", default="A")
    parser.add_argument("--reference-ligand", default="6MD")
    parser.add_argument("--alignment-mode", choices=["global", "local"], default="local")
    args = parser.parse_args()
    # --reference-pdb is the complex like protein YTHDC1 and m6A

    target_file = download_pdb(args.target_pdb, RAW_DIR)
    reference_file = download_pdb(args.reference_pdb, RAW_DIR)

    parser = PDBParser(QUIET=True)
    target_structure = parser.get_structure(args.target_pdb, target_file)
    reference_structure = parser.get_structure(args.reference_pdb, reference_file)

    target_ca = chain_ca_sequence(target_structure, args.target_chain)
    reference_ca = chain_ca_sequence(reference_structure, args.reference_chain)

    print("Target CA:")
    print(f"{"".join(residue.aa for residue in target_ca)}")
    print("Reference CA:")
    print(f"{"".join(residue.aa for residue in reference_ca)}")

    target_atoms, reference_atoms, target_seq, reference_seq = aligned_ca_pairs(
        target_ca,
        reference_ca,
        args.alignment_mode,
    )

    superimposer = Superimposer()
    superimposer.set_atoms(target_atoms, reference_atoms)
    superimposer.apply(reference_structure.get_atoms())

    print(f"CA alignment pairs: {len(target_atoms)}; RMSD: {superimposer.rms:.3f} A")

    ligand = find_ligand_residue(reference_structure, args.reference_ligand)
    center = residue_centroid(ligand)

    RECEPTOR_DIR.mkdir(parents=True, exist_ok=True)
    target_slug = f"{args.target_pdb.lower()}_chain{args.target_chain}"
    reference_slug = f"{args.reference_pdb.lower()}_{args.reference_ligand.lower()}"
    receptor_pdb = RECEPTOR_DIR / f"ythdf1_{target_slug}.pdb"
    transferred_ligand_pdb = RECEPTOR_DIR / f"transferred_{reference_slug}_on_{target_slug}.pdb"
    grid_json = RECEPTOR_DIR / f"ythdf1_{target_slug}_{reference_slug}_grid.json"
    alignment_tsv = RECEPTOR_DIR / f"ythdf1_{target_slug}_{args.reference_pdb.lower()}_alignment_summary.tsv"

    save_selected_pdb(target_structure, receptor_pdb, ChainProteinSelect(args.target_chain))
    save_selected_pdb(reference_structure, transferred_ligand_pdb, ResidueSelect(ligand))
    grid_json.write_text(
        json.dumps(
            {
                "target_pdb": args.target_pdb.upper(),
                "target_chain": args.target_chain,
                "reference_pdb": args.reference_pdb.upper(),
                "reference_chain": args.reference_chain,
                "reference_ligand": args.reference_ligand,
                "alignment_mode": args.alignment_mode,
                "alignment_ca_pairs": len(target_atoms),
                "alignment_rmsd_angstrom": round(float(superimposer.rms), 3),
                "center_xyz": [round(value, 3) for value in center],
                "size_xyz_angstrom": [20.0, 20.0, 20.0],
            },
            indent=2,
        )
        + "\n"
    )

    with alignment_tsv.open("w", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow(
            ["target_pdb", "target_chain", "reference_pdb", "reference_chain", "alignment_mode", "ca_pairs", "rmsd_angstrom"]
        )
        writer.writerow(
            [
                args.target_pdb.upper(),
                args.target_chain,
                args.reference_pdb.upper(),
                args.reference_chain,
                args.alignment_mode,
                len(target_atoms),
                f"{superimposer.rms:.3f}",
            ]
        )

    update_pipeline_config(
        center,
        args.target_pdb,
        args.target_chain,
        args.reference_pdb,
        args.reference_chain,
        args.reference_ligand,
        receptor_pdb,
    )

    print(f"Wrote receptor: {receptor_pdb.relative_to(ROOT)}")
    print(f"Wrote transferred ligand reference: {transferred_ligand_pdb.relative_to(ROOT)}")
    print(f"Wrote grid config: {grid_json.relative_to(ROOT)}")
    print(f"Transferred center: {center[0]:.3f}, {center[1]:.3f}, {center[2]:.3f}")
    print(f"CA alignment pairs: {len(target_atoms)}; RMSD: {superimposer.rms:.3f} A")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
