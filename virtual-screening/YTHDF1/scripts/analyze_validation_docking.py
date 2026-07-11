#!/usr/bin/env python3
"""Build a consensus summary from validation docking scores."""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd
from rdkit import Chem


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCORES = ROOT / "results" / "docking" / "validation_7qkn" / "best_scores.tsv"
DEFAULT_SMI = ROOT / "data" / "ligands" / "validation_controls.smi"
DEFAULT_OUT = ROOT / "results" / "docking" / "validation_7qkn" / "consensus_validation_scores.tsv"


def heavy_atom_counts(smi_file: Path) -> pd.DataFrame:
    rows = []
    for line in smi_file.read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        smiles, compound_id = line.split(maxsplit=1)
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            continue
        rows.append(
            {
                "compound_id": compound_id,
                "heavy_atoms": mol.GetNumHeavyAtoms(),
                "input_smiles": smiles,
            }
        )
    return pd.DataFrame(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scores", type=Path, default=DEFAULT_SCORES)
    parser.add_argument("--smiles", type=Path, default=DEFAULT_SMI)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    args.scores = args.scores if args.scores.is_absolute() else ROOT / args.scores
    args.smiles = args.smiles if args.smiles.is_absolute() else ROOT / args.smiles
    args.out = args.out if args.out.is_absolute() else ROOT / args.out

    scores = pd.read_csv(args.scores, sep="\t")
    scores = scores[scores["status"] == "ok"].copy()
    scores["affinity_kcal_mol"] = scores["affinity_kcal_mol"].astype(float)
    scores["engine_rank"] = scores.groupby("engine")["affinity_kcal_mol"].rank(method="min")
    hac = heavy_atom_counts(args.smiles)

    pivot_scores = scores.pivot(index="compound_id", columns="engine", values="affinity_kcal_mol")
    pivot_ranks = scores.pivot(index="compound_id", columns="engine", values="engine_rank")
    summary = pd.DataFrame(index=pivot_scores.index)
    for engine in sorted(scores["engine"].unique()):
        summary[f"{engine}_score"] = pivot_scores[engine]
        summary[f"{engine}_rank"] = pivot_ranks[engine]

    summary["mean_rank"] = pivot_ranks.mean(axis=1)
    summary["best_score"] = pivot_scores.min(axis=1)
    summary["mean_score"] = pivot_scores.mean(axis=1)
    summary = summary.reset_index().merge(hac, on="compound_id", how="left")
    summary["best_ligand_efficiency"] = summary["best_score"] / summary["heavy_atoms"]
    summary["mean_ligand_efficiency"] = summary["mean_score"] / summary["heavy_atoms"]
    summary = summary.sort_values(["mean_rank", "mean_ligand_efficiency"])

    args.out.parent.mkdir(parents=True, exist_ok=True)
    summary.to_csv(args.out, sep="\t", index=False, float_format="%.4f")
    print(f"Wrote consensus summary: {args.out.relative_to(ROOT)}")
    print(summary[["compound_id", "mean_rank", "best_score", "mean_score", "mean_ligand_efficiency"]].head(10).to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
