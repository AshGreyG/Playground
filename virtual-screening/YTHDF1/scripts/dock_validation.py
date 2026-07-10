#!/usr/bin/env python3
"""Dock prepared validation ligands against the prepared YTHDF1 receptor."""

from __future__ import annotations

import argparse
import csv
import os
import re
import subprocess
import sys
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
CONFIG_FILE = ROOT / "config" / "pipeline.yaml"
DEFAULT_LIGAND_DIR = ROOT / "data" / "ligands" / "validation_prepared" / "pdbqt"
DEFAULT_RECEPTOR = ROOT / "data" / "receptors" / "ythdf1_7qkn_chainA.pdbqt"
DEFAULT_BOX = ROOT / "data" / "receptors" / "ythdf1_7qkn_chainA_vina_box.txt"
DEFAULT_OUTDIR = ROOT / "results" / "docking" / "validation_7qkn"
VINA_RESULT_RE = re.compile(r"^REMARK VINA RESULT:\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)")
SMINA_AFFINITY_RE = re.compile(r"^REMARK minimizedAffinity\s+([+-]?\d+(?:\.\d+)?)")


def load_config() -> dict:
    return yaml.safe_load(CONFIG_FILE.read_text())


def parse_vina_results(pdbqt_file: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    mode = 0
    for line in pdbqt_file.read_text(errors="replace").splitlines():
        match = VINA_RESULT_RE.match(line)
        if match:
            mode += 1
            rows.append(
                {
                    "mode": str(mode),
                    "affinity_kcal_mol": match.group(1),
                    "rmsd_lb": match.group(2),
                    "rmsd_ub": match.group(3),
                }
            )
            continue

        match = SMINA_AFFINITY_RE.match(line)
        if match:
            mode += 1
            rows.append(
                {
                    "mode": str(mode),
                    "affinity_kcal_mol": match.group(1),
                    "rmsd_lb": "",
                    "rmsd_ub": "",
                }
            )
    return rows


def command_for_engine(
    engine: str,
    binary: str,
    receptor: Path,
    ligand: Path,
    box: Path,
    out_pose: Path,
    log_file: Path,
    exhaustiveness: int,
    num_modes: int,
    cpu: int,
) -> list[str]:
    return [
        binary,
        "--receptor",
        str(receptor),
        "--ligand",
        str(ligand),
        "--config",
        str(box),
        "--out",
        str(out_pose),
        "--exhaustiveness",
        str(exhaustiveness),
        "--num_modes",
        str(num_modes),
        "--cpu",
        str(cpu),
    ]


def run_docking(args: argparse.Namespace) -> int:
    config = load_config()
    binaries = config["docking"]["binaries"]
    engines = args.engines or config["docking"]["primary_engines"]
    ligand_files = sorted(args.ligand_dir.glob("*.pdbqt"))
    if not ligand_files:
        raise ValueError(f"No ligand PDBQT files found in {args.ligand_dir}")

    all_rows: list[dict[str, str]] = []
    failures = 0

    for engine in engines:
        binary = binaries[engine]
        engine_dir = args.outdir / engine
        pose_dir = engine_dir / "poses"
        log_dir = engine_dir / "logs"
        pose_dir.mkdir(parents=True, exist_ok=True)
        log_dir.mkdir(parents=True, exist_ok=True)

        engine_rows: list[dict[str, str]] = []
        for ligand in ligand_files:
            compound_id = ligand.stem
            out_pose = pose_dir / f"{compound_id}.pdbqt"
            log_file = log_dir / f"{compound_id}.log"
            cmd = command_for_engine(
                engine,
                binary,
                args.receptor,
                ligand,
                args.box,
                out_pose,
                log_file,
                args.exhaustiveness,
                args.num_modes,
                args.cpu,
            )
            result = subprocess.run(
                cmd,
                cwd=ROOT,
                env=os.environ.copy(),
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
            )
            log_file.write_text(
                "COMMAND\n"
                + " ".join(cmd)
                + "\n\nSTDOUT\n"
                + result.stdout
                + "\n\nSTDERR\n"
                + result.stderr
            )
            if result.returncode != 0:
                failures += 1
                row = {
                    "engine": engine,
                    "compound_id": compound_id,
                    "mode": "",
                    "affinity_kcal_mol": "",
                    "rmsd_lb": "",
                    "rmsd_ub": "",
                    "pose_file": str(out_pose.relative_to(ROOT)),
                    "log_file": str(log_file.relative_to(ROOT)),
                    "status": "failed",
                    "message": (result.stderr or result.stdout).replace("\n", " ")[:1000],
                }
                engine_rows.append(row)
                all_rows.append(row)
                continue

            parsed_rows = parse_vina_results(out_pose)
            if not parsed_rows:
                failures += 1
                row = {
                    "engine": engine,
                    "compound_id": compound_id,
                    "mode": "",
                    "affinity_kcal_mol": "",
                    "rmsd_lb": "",
                    "rmsd_ub": "",
                    "pose_file": str(out_pose.relative_to(ROOT)),
                    "log_file": str(log_file.relative_to(ROOT)),
                    "status": "failed",
                    "message": "No REMARK VINA RESULT lines found in output pose file.",
                }
                engine_rows.append(row)
                all_rows.append(row)
                continue

            for parsed in parsed_rows:
                row = {
                    "engine": engine,
                    "compound_id": compound_id,
                    **parsed,
                    "pose_file": str(out_pose.relative_to(ROOT)),
                    "log_file": str(log_file.relative_to(ROOT)),
                    "status": "ok",
                    "message": "",
                }
                engine_rows.append(row)
                all_rows.append(row)

        write_rows(engine_dir / "scores.tsv", engine_rows)

    write_rows(args.outdir / "combined_scores.tsv", all_rows)
    write_best_scores(args.outdir / "best_scores.tsv", all_rows)
    ok_ligands = len({row["compound_id"] for row in all_rows if row["status"] == "ok"})
    print(f"Docked {ok_ligands}/{len(ligand_files)} ligands across {len(engines)} engine(s)")
    print(f"Wrote combined scores: {(args.outdir / 'combined_scores.tsv').relative_to(ROOT)}")
    print(f"Wrote best scores: {(args.outdir / 'best_scores.tsv').relative_to(ROOT)}")
    return 0 if failures == 0 else 2


def write_rows(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "engine",
        "compound_id",
        "mode",
        "affinity_kcal_mol",
        "rmsd_lb",
        "rmsd_ub",
        "pose_file",
        "log_file",
        "status",
        "message",
    ]
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter="\t")
        writer.writeheader()
        writer.writerows(rows)


def write_best_scores(path: Path, rows: list[dict[str, str]]) -> None:
    best: dict[tuple[str, str], dict[str, str]] = {}
    for row in rows:
        if row["status"] != "ok":
            continue
        key = (row["engine"], row["compound_id"])
        affinity = float(row["affinity_kcal_mol"])
        if key not in best or affinity < float(best[key]["affinity_kcal_mol"]):
            best[key] = row
    write_rows(path, sorted(best.values(), key=lambda item: (item["engine"], float(item["affinity_kcal_mol"]))))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ligand-dir", type=Path, default=DEFAULT_LIGAND_DIR)
    parser.add_argument("--receptor", type=Path, default=DEFAULT_RECEPTOR)
    parser.add_argument("--box", type=Path, default=DEFAULT_BOX)
    parser.add_argument("--outdir", type=Path, default=DEFAULT_OUTDIR)
    parser.add_argument("--engines", nargs="+", choices=["vina", "smina"])
    parser.add_argument("--exhaustiveness", type=int, default=8)
    parser.add_argument("--num-modes", type=int, default=10)
    parser.add_argument("--cpu", type=int, default=4)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.ligand_dir = args.ligand_dir if args.ligand_dir.is_absolute() else ROOT / args.ligand_dir
    args.receptor = args.receptor if args.receptor.is_absolute() else ROOT / args.receptor
    args.box = args.box if args.box.is_absolute() else ROOT / args.box
    args.outdir = args.outdir if args.outdir.is_absolute() else ROOT / args.outdir
    try:
        return run_docking(args)
    except Exception as exc:  # noqa: BLE001 - command-line failure reporting.
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
