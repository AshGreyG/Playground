# Validation Docking

This stage docks the 25 validation ligands against the prepared YTHDF1
`7QKN` chain-A receptor.

Prerequisites:

```text
data/receptors/ythdf1_7qkn_chainA.pdbqt
data/receptors/ythdf1_7qkn_chainA_vina_box.txt
data/ligands/validation_prepared/pdbqt/*.pdbqt
```

Run a moderate first pass:

```bash
cd /home/ashgrey/Github/Playground/virtual-screening/YTHDF1
UV_CACHE_DIR=.uv-cache uv run python scripts/dock_validation.py --exhaustiveness 8 --num-modes 10 --cpu 4
```

Outputs:

```text
results/docking/validation_7qkn/
  combined_scores.tsv
  best_scores.tsv
  vina/
    scores.tsv
    poses/
    logs/
  smina/
    scores.tsv
    poses/
    logs/
```

After the first pass, inspect `best_scores.tsv` and the top poses. If the
workflow is sane, rerun the top subset with higher exhaustiveness.

Build the consensus summary:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/analyze_validation_docking.py
```

Output:

```text
results/docking/validation_7qkn/consensus_validation_scores.tsv
```

Analyze pocket contacts for the best pose from each engine:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/analyze_pose_contacts.py
```

Outputs:

```text
results/docking/validation_7qkn/pose_contact_summary.tsv
results/docking/validation_7qkn/reference_pocket_residues.tsv
results/docking/validation_7qkn/pose_quality_by_compound.tsv
```
