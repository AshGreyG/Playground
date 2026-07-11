# Render Docking Figures

Use PyMOL to render receptor-ligand pictures with pocket residues and polar
contacts.

Render the top 10 ChEMBL pilot hits:

```bash
cd /home/ashgrey/Github/Playground/virtual-screening/YTHDF1
UV_CACHE_DIR=.uv-cache uv run python scripts/render_top_pymol.py --top 10
```

Outputs:

```text
results/docking/chembl_pilot_100/figures/
  rendered_figures.tsv
  *.png
  ligands_pdb/*.pdb
  pml/*.pml
  pse/*.pse
```

Each figure shows:

- YTHDF1 receptor cartoon
- receptor pocket residues within 4 A of the docked ligand as sticks
- ligand as orange sticks
- PyMOL polar contacts as yellow dashed lines
- pocket residue labels

To force one engine:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/render_top_pymol.py --top 10 --engine vina
UV_CACHE_DIR=.uv-cache uv run python scripts/render_top_pymol.py --top 10 --engine smina
```
