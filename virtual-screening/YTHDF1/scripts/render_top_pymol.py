#!/usr/bin/env python3
"""Render top docking poses with receptor pocket and polar contacts in PyMOL."""

from __future__ import annotations

import argparse
import csv
import subprocess
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RECEPTOR = ROOT / "data" / "receptors" / "ythdf1_7qkn_chainA.pdb"
DEFAULT_SHORTLIST = ROOT / "results" / "docking" / "chembl_pilot_100" / "final_shortlist.tsv"
DEFAULT_CONTACTS = ROOT / "results" / "docking" / "chembl_pilot_100" / "pose_contact_summary.tsv"
DEFAULT_OUTDIR = ROOT / "results" / "docking" / "chembl_pilot_100" / "figures"


def first_model_pdbqt_to_pdb(pdbqt: Path, pdb: Path) -> None:
    lines: list[str] = []
    saw_model = False
    for line in pdbqt.read_text(errors="replace").splitlines():
        if line.startswith("MODEL"):
            if saw_model:
                break
            saw_model = True
            continue
        if line.startswith("ENDMDL") and saw_model:
            break
        if not line.startswith(("ATOM", "HETATM")):
            continue
        record = "HETATM" + line[6:66] + "           " + pdb_element(line) + "\n"
        lines.append(record)
    lines.append("END\n")
    pdb.parent.mkdir(parents=True, exist_ok=True)
    pdb.write_text("".join(lines))


def pdb_element(line: str) -> str:
    atom_type = line[77:].strip().split()
    raw = atom_type[-1] if atom_type else line[12:16].strip()[0]
    letters = "".join(char for char in raw if char.isalpha()).upper()
    if letters == "A":
        return "C "
    if letters.startswith("CL"):
        return "CL"
    if letters.startswith("BR"):
        return "BR"
    return (letters[:1] or "C").rjust(2)


def pymol_script(
    receptor: Path,
    ligand_pdb: Path,
    png: Path,
    pse: Path
) -> str:
    script = f"""
reinitialize
load {receptor}, receptor
load {ligand_pdb}, ligand
hide everything
bg_color white
set ray_opaque_background, on
set antialias, 2
set orthoscopic, on
set cartoon_fancy_helices, on

remove solvent
show cartoon, receptor
color gray80, receptor
select pocket, byres (receptor within 4.0 of ligand)
show sticks, pocket
color gray65, pocket
show sticks, ligand
color tv_orange, ligand
set stick_radius, 0.18, ligand
set stick_radius, 0.14, pocket

distance polar_contacts, (pocket and elem N+O+S), (ligand and elem N+O+S), 3.6, mode=2
set dash_color, yellow, polar_contacts
set dash_width, 3.0
set dash_gap, 0.25
hide labels, polar_contacts

label (pocket and name CA), "%s%s" % (resn, resi)
set label_size, 16
set label_color, black

orient ligand
zoom (ligand or pocket), 5

png {png}, width=1800, height=1400, dpi=300, ray=1
save {pse}
quit
"""
    print(script)
    return script


def choose_pose_rows(shortlist: Path, contacts: Path, top: int, engine: str | None) -> pd.DataFrame:
    short = pd.read_csv(shortlist, sep="\t").head(top)
    contact = pd.read_csv(contacts, sep="\t")
    contact = contact[contact["compound_id"].isin(short["compound_id"])]
    contact = contact[contact["pose_quality_flag"] == True]  # noqa: E712 - pandas comparison.
    if engine:
        contact = contact[contact["engine"] == engine]
    contact = contact.merge(short[["compound_id", "best_mean_rank", "best_score"]], on="compound_id", how="left")
    contact = contact.sort_values(
        ["best_mean_rank", "ligand_centroid_distance_to_reference", "reference_overlap_fraction"],
        ascending=[True, True, False],
    )
    return contact.drop_duplicates("compound_id", keep="first").head(top)


def render(args: argparse.Namespace) -> int:
    args.outdir.mkdir(parents=True, exist_ok=True)
    ligand_dir = args.outdir / "ligands_pdb"
    pml_dir = args.outdir / "pml"
    pse_dir = args.outdir / "pse"
    for directory in (ligand_dir, pml_dir, pse_dir):
        directory.mkdir(parents=True, exist_ok=True)

    rows = choose_pose_rows(args.shortlist, args.contacts, args.top, args.engine)
    index_rows: list[dict[str, str]] = []
    for rank, row in enumerate(rows.itertuples(index=False), start=1):
        compound_id = row.compound_id
        pose_file = ROOT / row.pose_file
        ligand_pdb = ligand_dir / f"{rank:02d}_{compound_id}_{row.engine}.pdb"
        png = args.outdir / f"{rank:02d}_{compound_id}_{row.engine}.png"
        pml = pml_dir / f"{rank:02d}_{compound_id}_{row.engine}.pml"
        pse = pse_dir / f"{rank:02d}_{compound_id}_{row.engine}.pse"
        first_model_pdbqt_to_pdb(pose_file, ligand_pdb)
        pml.write_text(
            pymol_script(
                args.receptor,
                ligand_pdb,
                png,
                pse
            )
        )
        result = subprocess.run(
            ["pymol", "-cq", str(pml)],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        index_rows.append(
            {
                "rank": str(rank),
                "compound_id": compound_id,
                "engine": row.engine,
                "png": str(png.relative_to(ROOT)),
                "pse": str(pse.relative_to(ROOT)),
                "pml": str(pml.relative_to(ROOT)),
                "status": "ok" if result.returncode == 0 and png.exists() else "failed",
                "message": (result.stderr or result.stdout).replace("\n", " ")[:500],
            }
        )

    index_file = args.outdir / "rendered_figures.tsv"
    with index_file.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["rank", "compound_id", "engine", "png", "pse", "pml", "status", "message"], delimiter="\t")
        writer.writeheader()
        writer.writerows(index_rows)

    print(f"Wrote figure index: {index_file.relative_to(ROOT)}")
    for row in index_rows:
        print(f"{row['rank']} {row['compound_id']} {row['engine']} {row['status']} {row['png']}")
    return 0 if all(row["status"] == "ok" for row in index_rows) else 2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receptor", type=Path, default=DEFAULT_RECEPTOR)
    parser.add_argument("--shortlist", type=Path, default=DEFAULT_SHORTLIST)
    parser.add_argument("--contacts", type=Path, default=DEFAULT_CONTACTS)
    parser.add_argument("--outdir", type=Path, default=DEFAULT_OUTDIR)
    parser.add_argument("--top", type=int, default=10)
    parser.add_argument("--engine", choices=["vina", "smina"], help="Force a specific engine pose")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.receptor = args.receptor if args.receptor.is_absolute() else ROOT / args.receptor
    args.shortlist = args.shortlist if args.shortlist.is_absolute() else ROOT / args.shortlist
    args.contacts = args.contacts if args.contacts.is_absolute() else ROOT / args.contacts
    args.outdir = args.outdir if args.outdir.is_absolute() else ROOT / args.outdir
    return render(args)


if __name__ == "__main__":
    raise SystemExit(main())
