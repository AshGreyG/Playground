# ChEMBL Pilot Screen

Input database:

```text
/home/ashgrey/Documents/chembl_37.sdf.gz
```

Build a focused 1,000-compound pilot library:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/build_chembl_pilot_library.py \
  --target-count 1000 \
  --stop-after-target
```

Outputs:

```text
data/ligands/chembl_pilot_1k.smi
data/ligands/chembl_pilot_1k_metadata.tsv
data/ligands/chembl_pilot_1k_filter_report.tsv
```

Prepare ligands:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/prepare_ligands.py \
  --input data/ligands/chembl_pilot_1k.smi \
  --outdir data/ligands/chembl_pilot_1k_prepared
```

Dock:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/dock_validation.py \
  --ligand-dir data/ligands/chembl_pilot_1k_prepared/pdbqt \
  --outdir results/docking/chembl_pilot_1k \
  --exhaustiveness 8 \
  --num-modes 10 \
  --cpu 4
```

Consensus ranking:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/analyze_validation_docking.py \
  --scores results/docking/chembl_pilot_1k/best_scores.tsv \
  --smiles data/ligands/chembl_pilot_1k.smi \
  --out results/docking/chembl_pilot_1k/consensus_scores.tsv
```

Pose/contact filtering:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/analyze_pose_contacts.py \
  --docking-dir results/docking/chembl_pilot_1k \
  --scores results/docking/chembl_pilot_1k/consensus_scores.tsv \
  --out results/docking/chembl_pilot_1k/pose_contact_summary.tsv
```

For 5,000 or 10,000 compounds, change `--target-count` and output paths. Expect
CPU docking runtime to scale roughly linearly.
