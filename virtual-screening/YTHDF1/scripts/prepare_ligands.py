#!/usr/bin/env python3
"""Prepare ligand SMILES into 3D SDF and PDBQT files for docking."""

from __future__ import annotations

import argparse
import csv
import shutil
import subprocess
import sys
from pathlib import Path

from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "ligands" / "validation_controls.smi"
DEFAULT_OUTDIR = ROOT / "data" / "ligands" / "validation_prepared"


def read_smiles(path: Path) -> list[tuple[str, str]]:
    ligands: list[tuple[str, str]] = []
    with path.open() as handle:
        for line_no, line in enumerate(handle, start=1):
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            parts = stripped.split(maxsplit=1)
            if len(parts) != 2:
                raise ValueError(f"{path}:{line_no}: expected 'SMILES compound_id'")
            ligands.append((parts[0], parts[1].strip()))
    return ligands


def molecule_from_smiles(smiles: str, compound_id: str) -> Chem.Mol:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"RDKit could not parse {compound_id}: {smiles}")
    mol = Chem.AddHs(mol)
    mol.SetProp("_Name", compound_id)
    mol.SetProp("compound_id", compound_id)
    mol.SetProp("input_smiles", smiles)
    mol.SetProp("canonical_smiles", Chem.MolToSmiles(Chem.RemoveHs(mol), isomericSmiles=True))
    mol.SetProp("molecular_weight", f"{Descriptors.MolWt(mol):.4f}")
    return mol


def embed_and_minimize(mol: Chem.Mol, seed: int, max_attempts: int) -> tuple[Chem.Mol, str]:
    params = AllChem.ETKDGv3()
    params.randomSeed = seed
    status = AllChem.EmbedMolecule(mol, params)
    if status != 0:
        status = AllChem.EmbedMolecule(mol, randomSeed=seed, useRandomCoords=True, maxAttempts=max_attempts)
    if status != 0:
        raise ValueError(f"3D embedding failed for {mol.GetProp('compound_id')}")

    if AllChem.MMFFHasAllMoleculeParams(mol):
        AllChem.MMFFOptimizeMolecule(mol, maxIters=1000)
        return mol, "MMFF94"

    AllChem.UFFOptimizeMolecule(mol, maxIters=1000)
    return mol, "UFF"


def write_single_sdf(mol: Chem.Mol, path: Path) -> None:
    writer = Chem.SDWriter(str(path))
    if writer is None:
        raise OSError(f"Could not open SDF writer for {path}")
    writer.write(mol)
    writer.close()


def run_meeko(input_sdf: Path, output_pdbqt: Path) -> subprocess.CompletedProcess[str]:
    cmd = [
        "uv",
        "run",
        "mk_prepare_ligand.py",
        "-i",
        str(input_sdf),
        "-o",
        str(output_pdbqt),
    ]
    return subprocess.run(
        cmd,
        cwd=ROOT,
        env={"UV_CACHE_DIR": ".uv-cache"},
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


def prepare_ligands(input_smi: Path, outdir: Path, seed: int, max_attempts: int) -> int:
    sdf_dir = outdir / "sdf"
    pdbqt_dir = outdir / "pdbqt"
    for directory in (sdf_dir, pdbqt_dir):
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir(parents=True, exist_ok=True)

    combined_sdf = outdir / "validation_prepared.sdf"
    report_path = outdir / "ligand_prep_report.tsv"
    outdir.mkdir(parents=True, exist_ok=True)

    ligands = read_smiles(input_smi)
    combined_writer = Chem.SDWriter(str(combined_sdf))
    report_rows: list[dict[str, str]] = []
    failures = 0

    for index, (smiles, compound_id) in enumerate(ligands, start=1):
        row = {
            "compound_id": compound_id,
            "input_smiles": smiles,
            "sdf": "",
            "pdbqt": "",
            "minimizer": "",
            "status": "ok",
            "message": "",
        }
        try:
            mol = molecule_from_smiles(smiles, compound_id)
            mol, minimizer = embed_and_minimize(mol, seed + index, max_attempts)
            mol.SetProp("minimizer", minimizer)

            sdf_path = sdf_dir / f"{compound_id}.sdf"
            pdbqt_path = pdbqt_dir / f"{compound_id}.pdbqt"
            write_single_sdf(mol, sdf_path)
            combined_writer.write(mol)

            result = run_meeko(sdf_path, pdbqt_path)
            if result.returncode != 0:
                raise RuntimeError((result.stderr or result.stdout).strip())

            row["sdf"] = str(sdf_path.relative_to(ROOT))
            row["pdbqt"] = str(pdbqt_path.relative_to(ROOT))
            row["minimizer"] = minimizer
        except Exception as exc:  # noqa: BLE001 - report per-ligand failures.
            failures += 1
            row["status"] = "failed"
            row["message"] = str(exc).replace("\n", " ")[:1000]
        report_rows.append(row)

    combined_writer.close()

    with report_path.open("w", newline="") as handle:
        fieldnames = ["compound_id", "input_smiles", "sdf", "pdbqt", "minimizer", "status", "message"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter="\t")
        writer.writeheader()
        writer.writerows(report_rows)

    ok_count = len(report_rows) - failures
    print(f"Prepared {ok_count}/{len(report_rows)} ligands")
    print(f"Wrote combined SDF: {combined_sdf.relative_to(ROOT)}")
    print(f"Wrote PDBQT files: {pdbqt_dir.relative_to(ROOT)}")
    print(f"Wrote report: {report_path.relative_to(ROOT)}")
    return 0 if failures == 0 else 2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Input .smi file")
    parser.add_argument("--outdir", type=Path, default=DEFAULT_OUTDIR, help="Output directory")
    parser.add_argument("--seed", type=int, default=61453, help="Base random seed for RDKit embedding")
    parser.add_argument("--max-attempts", type=int, default=1000, help="Maximum RDKit embedding attempts")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_smi = args.input if args.input.is_absolute() else ROOT / args.input
    outdir = args.outdir if args.outdir.is_absolute() else ROOT / args.outdir
    try:
        return prepare_ligands(input_smi, outdir, args.seed, args.max_attempts)
    except Exception as exc:  # noqa: BLE001 - command-line failure reporting.
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
