# Data Requirements

This project needs a small validation dataset before a production screen. The
first goal is to validate receptor preparation, grid placement, docking, and
pose filtering around the YTHDF1 YTH-domain m6A pocket.

## Required Now

### 1. Receptor Structure

We need one of these:

- preferred: an experimental YTHDF1 YTH-domain structure
- acceptable: a close YTH-domain homolog bound to m6A/RNA, used to transfer the
  pocket center onto YTHDF1
- fallback: AlphaFold `Q9BYJ9` YTH-domain model aligned to an m6A-bound homolog

Needed files:

- receptor PDB file in `data/receptors/`
- notes identifying chain, residue range, removed regions, and pocket source

### 2. Pocket Reference

We need coordinates for the m6A-recognition pocket.

Preferred sources:

- bound m6A or m6A-containing RNA coordinates from a structure
- transferred m6A coordinates from an aligned homolog
- manually selected aromatic-cage center after structural inspection

`fpocket` is not required for this focused workflow.

### 3. Validation Ligand Set

Before screening a large library, use 20-100 compounds:

- positive/control-like molecules:
  m6A, adenosine, adenine, N6-methyladenine, and related nucleobase/nucleoside
  analogs
- negative/property controls:
  similar-size heterocycles that should not reproduce the expected m6A-pocket
  contact pattern
- a few purchasable fragments or lead-like compounds if you already have them

Accepted input formats:

- `.smi` with `SMILES ID`
- `.sdf`
- `.csv` with at least `smiles` and `compound_id`

Place the file at:

```text
data/ligands/validation_controls.smi
```

### 4. Screening Library

This is needed after validation passes.

Good choices:

- focused nucleobase/heterocycle library
- purchasable lead-like or fragment-like library from Enamine, ZINC, ChemDiv,
  MolPort, or an internal source
- ChEMBL-derived compounds filtered for clean, purchasable, lead-like chemistry

Minimum columns:

- compound ID
- SMILES
- vendor/source, if available

Recommended size for first pilot:

- 1,000-10,000 compounds

Recommended size for production:

- only after validation; depends on compute budget

## Optional Later

### Decoy Set

Useful for calibration and enrichment testing.

Needed fields:

- decoy ID
- SMILES
- matched property group or source

### Experimental Availability Data

Useful for final shortlist:

- vendor
- catalog ID
- price or availability
- purity
- delivery time

### Known Inhibitors Or Literature Compounds

If you know published YTHDF1/YTH-domain binders, add them to validation even if
they are weak. They help calibrate pose expectations.

## Current Local Software Constraints

- Use `/home/ashgrey/.opt/bin/vina-1.2.7` for AutoDock Vina.
- Use `smina` from `PATH`.
- Skip GNINA because CUDA is unavailable.
- Skip OpenMM because local installation failed; use GROMACS only for optional
  late-stage MD.
- Skip `fpocket`; define the m6A pocket from structure/alignment instead.
- Fix RDKit/Meeko before ligand PDBQT preparation.
