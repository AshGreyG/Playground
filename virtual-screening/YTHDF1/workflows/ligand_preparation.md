# Ligand Preparation

This stage converts `SMILES compound_id` input into docking-ready files.

Default validation input:

```text
data/ligands/validation_controls.smi
```

Run:

```bash
cd /home/ashgrey/Github/Playground/virtual-screening/YTHDF1
UV_CACHE_DIR=.uv-cache uv run python scripts/prepare_ligands.py
```

Outputs:

```text
data/ligands/validation_prepared/
  validation_prepared.sdf
  ligand_prep_report.tsv
  sdf/
    <compound_id>.sdf
  pdbqt/
    <compound_id>.pdbqt
```

Preparation details:

- RDKit parses SMILES and preserves the original `compound_id`.
- Hydrogens are added before 3D embedding.
- ETKDGv3 generates an initial 3D conformer.
- MMFF94 is used for minimization when parameters are available.
- UFF is used as fallback.
- Meeko writes ligand PDBQT files for Vina/smina.

Review `ligand_prep_report.tsv` before docking. Any failed ligand should be
fixed or removed before production screening.
