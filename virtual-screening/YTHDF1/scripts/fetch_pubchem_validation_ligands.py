#!/usr/bin/env python3
"""Fetch validation ligand SMILES from PubChem by compound name."""

from __future__ import annotations

import csv
import json
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
SEED_FILE = ROOT / "data" / "ligands" / "validation_seed_compounds.tsv"
SMI_FILE = ROOT / "data" / "ligands" / "validation_controls.smi"
META_FILE = ROOT / "data" / "ligands" / "validation_controls_metadata.tsv"
PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"


def pubchem_properties(name: str) -> dict[str, str]:
    encoded = quote(name, safe="")
    url = (
        f"{PUBCHEM_BASE}/compound/name/{encoded}/property/"
        "SMILES,ConnectivitySMILES,IUPACName,MolecularFormula,MolecularWeight/JSON"
    )
    with urlopen(url, timeout=30) as response:
        data = json.load(response)
    props = data["PropertyTable"]["Properties"][0]
    return {str(key): str(value) for key, value in props.items()}


def main() -> int:
    rows: list[dict[str, str]] = []
    failures: list[tuple[str, str, str]] = []

    with SEED_FILE.open(newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        for row in reader:
            query_name = row["query_name"]
            try:
                props = pubchem_properties(query_name)
            except (HTTPError, URLError, KeyError, TimeoutError) as exc:
                failures.append((row["compound_id"], query_name, repr(exc)))
                continue

            rows.append(
                {
                    **row,
                    "cid": props.get("CID", ""),
                    "canonical_smiles": props.get("ConnectivitySMILES", ""),
                    "isomeric_smiles": props.get("SMILES", ""),
                    "iupac_name": props.get("IUPACName", ""),
                    "molecular_formula": props.get("MolecularFormula", ""),
                    "molecular_weight": props.get("MolecularWeight", ""),
                    "source": "PubChem PUG-REST",
                }
            )
            time.sleep(0.2)

    if not rows:
        for compound_id, query_name, error in failures:
            print(f"FAILED\t{compound_id}\t{query_name}\t{error}", file=sys.stderr)
        return 1

    with SMI_FILE.open("w") as handle:
        for row in rows:
            smiles = row["isomeric_smiles"] or row["canonical_smiles"]
            if not smiles:
                failures.append((row["compound_id"], row["query_name"], "missing SMILES"))
                continue
            handle.write(f"{smiles} {row['compound_id']}\n")

    fieldnames = [
        "compound_id",
        "query_name",
        "group",
        "rationale",
        "cid",
        "canonical_smiles",
        "isomeric_smiles",
        "iupac_name",
        "molecular_formula",
        "molecular_weight",
        "source",
    ]
    with META_FILE.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter="\t")
        writer.writeheader()
        writer.writerows(rows)

    for compound_id, query_name, error in failures:
        print(f"FAILED\t{compound_id}\t{query_name}\t{error}", file=sys.stderr)

    print(f"Wrote {len(rows)} ligands to {SMI_FILE.relative_to(ROOT)}")
    print(f"Wrote metadata to {META_FILE.relative_to(ROOT)}")
    return 0 if not failures else 2


if __name__ == "__main__":
    raise SystemExit(main())
