# YTHDF1 Virtual Screening Pipeline

This directory contains a target-focused virtual screening design for human
YTHDF1, an m6A reader protein. The primary screening hypothesis is to identify
small molecules that bind the C-terminal YTH domain m6A-recognition pocket and
disrupt RNA/m6A reader engagement.

The pipeline is designed to be reproducible first, then scalable. Start with a
small validation run before spending compute on a large library.

## 1. Target Definition

Goal: define an experimentally defensible receptor model and binding site.

Inputs:

- UniProt sequence: human YTHDF1, UniProt `Q9BYJ9`
- Experimental structures: search RCSB PDB for YTHDF1 or close YTH-domain
  homologs with m6A, RNA, or ligand-bound structures
- Predicted structures: AlphaFold model for `Q9BYJ9`, used only when the local
  YTH domain geometry has high confidence and no suitable crystal/NMR structure
  is available

Recommended target strategy:

1. Prefer a YTHDF1 experimental structure of the YTH domain if available.
2. If only apo YTHDF1 is available, align it to an m6A-bound YTH-domain homolog
   to transfer the pocket center.
3. If no suitable YTHDF1 structure exists, use the AlphaFold YTH domain model
   and validate the pocket against homologous m6A-bound structures.
4. Exclude low-confidence/disordered N-terminal regions from docking.

Decision gate:

- Continue only if the m6A pocket is stable after preparation and the aromatic
  cage / polar recognition features remain geometrically plausible.

## 2. Receptor Preparation

Goal: generate multiple receptor states instead of relying on one rigid model.

Steps:

1. Select YTH-domain coordinates and remove irrelevant chains, waters, ions, and
   crystallization additives unless they mediate the m6A pocket.
2. Add hydrogens, assign protonation states near pH 7.4, and inspect histidines,
   acidic/basic residues, and buried polar atoms.
3. Repair missing side chains or loops only when they affect the pocket.
4. Minimize hydrogens and local side chains with backbone restraints.
5. Generate a small receptor ensemble:
   - experimental apo structure, if available
   - experimental m6A/homolog-aligned model, if needed
   - AlphaFold or refined model, only as a secondary state
   - optional short MD snapshots clustered by pocket RMSD

Outputs:

- `data/receptors/ythdf1_yth_state_*.pdb`
- `data/receptors/ythdf1_yth_state_*.pdbqt`
- receptor-preparation log with all assumptions

## 3. Binding-Site Definition

Goal: center docking on the m6A-recognition pocket, not the whole protein.

Primary pocket definition:

- Use the centroid of bound m6A, RNA m6A base, or transferred m6A coordinates
  from a structural homolog.

Fallback pocket definition:

- Use a pocket detector, then select the cavity matching the YTH-domain aromatic
  cage and known m6A reader site.

Grid policy:

- Use a tight primary grid around the m6A base pocket for focused screening.
- Use a larger secondary grid only for fragment-like or induced-fit follow-up.
- Record grid center and dimensions in `config/pipeline.yaml`.

Decision gate:

- Redocking or cross-docking must recover the m6A/base pose or a known control
  interaction pattern before production screening.

## 4. Ligand Library Design

Goal: screen compounds that are chemically plausible for the YTH m6A pocket.

Suggested library tiers:

- Tier 0 validation:
  known m6A, adenosine, methylated nucleobase analogs, and property-matched
  decoys for calibration.
- Tier 1 focused:
  nucleobase mimetics, aromatic heterocycles, RNA-reader inhibitor-like
  fragments, and compounds with H-bond donor/acceptor patterns compatible with
  the m6A pocket.
- Tier 2 broad:
  purchasable lead-like molecules from Enamine/ZINC/ChEMBL subsets.
- Tier 3 analog expansion:
  close analogs of experimentally attractive Tier 1/2 hits.

Preparation rules:

1. Salt-strip, normalize, and deduplicate by canonical SMILES/InChIKey.
2. Filter obvious liabilities before docking:
   PAINS, aggregators if available, reactive groups, unstable motifs, extreme
   charge, and metals.
3. Generate relevant protonation/tautomer states at pH 7.4.
4. Generate 3D conformers and retain stereochemistry metadata.
5. Keep a parent-child table so every docked state maps back to the source
   compound.

Outputs:

- `data/ligands/library_raw.smi`
- `data/ligands/library_standardized.smi`
- `data/ligands/library_prepared.sdf`
- `data/ligands/library_prepared.pdbqt`
- `data/ligands/ligand_state_map.tsv`

Current validation-stage command:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/prepare_ligands.py
```

## 5. Primary Docking

Goal: rapidly reduce the library while avoiding single-engine bias.

Recommended engines:

- AutoDock Vina or smina for high-throughput primary docking.
- CPU-only default: run both Vina and smina, then use cross-engine and
  cross-receptor consensus as the main robustness check.
- GNINA is optional only. Do not make it a required gate on machines without
  CUDA.

Primary docking settings:

- Exhaustiveness: low-to-medium for broad screening; increase for validation
  and shortlisted compounds.
- Poses per ligand state: 10-20.
- Receptor states: all prepared receptor ensemble members.
- Keep full pose files and a normalized score table.

Outputs:

- `results/docking/{engine}/{receptor_state}/poses.sdf`
- `results/docking/{engine}/{receptor_state}/scores.tsv`
- `results/docking/combined_scores.tsv`

Decision gate:

- Retain compounds that rank consistently across receptor states or engines,
  not only the single best raw docking score.

## 6. Pose Filtering

Goal: remove high-scoring poses that are chemically implausible.

Pose filters:

- Occupies the m6A pocket rather than drifting to a neighboring groove.
- Preserves at least one plausible polar contact pattern expected for m6A
  recognition.
- Has aromatic or heteroaromatic packing compatible with the YTH aromatic cage.
- Avoids severe clashes after local minimization.
- Does not depend entirely on unsatisfied buried charge.

Outputs:

- `results/shortlist/pose_filtered.tsv`
- `results/shortlist/pose_filtered.sdf`

## 7. Rescoring And Consensus Ranking

Goal: rank hits by robust agreement across methods.

Recommended rescoring:

- Re-dock the top 5-10 percent at higher exhaustiveness with Vina and smina.
- Re-score top poses with ligand efficiency, contact fingerprints, strain/clash
  checks, and cross-receptor rank stability.
- Optional MM/GBSA or MM/PBSA for a smaller, visually inspected subset if a
  working local workflow is available.
- Optional short MD stability check for the top 20-50 compounds using GROMACS.
  OpenMM is not required for this pipeline.

Consensus features:

- best docking score per receptor state
- median rank across receptor states
- cross-engine rank agreement
- high-exhaustiveness redocking rank
- pocket-contact fingerprint similarity to m6A/control pose
- ligand efficiency
- novelty/diversity cluster
- ADMET/developability flags

Output:

- `results/shortlist/consensus_ranked_hits.tsv`

Decision gate:

- Promote compounds only if they combine acceptable docking, credible pose,
  chemical tractability, and availability/synthesizability.

## 8. ADMET And Developability Filtering

Goal: remove compounds that are unlikely to be useful experimental probes.

Recommended filters:

- molecular weight, cLogP, TPSA, HBD/HBA, rotatable bonds
- pan-assay/reactive/toxicophore alerts
- aqueous solubility proxy
- cell permeability proxy if cellular assays are planned
- commercial availability or synthetic accessibility

Do not over-filter early fragments. Apply fragment-specific thresholds when the
library is fragment-like.

Output:

- `results/admet/admet_flags.tsv`

## 9. Final Shortlist

Goal: produce a practical experimental purchase/synthesis list.

Recommended deliverables:

- Top 50 computational hits with structures, source IDs, ranks, and flags.
- Top 20 diverse representatives after clustering.
- Top 5-10 high-confidence compounds for immediate assay purchase.
- A negative-control set with similar properties but poor m6A-pocket poses.

Final report fields:

- compound ID
- parent SMILES
- vendor/source
- receptor state
- docking score
- consensus rank
- key contacts
- ADMET flags
- cluster ID
- rationale

## 10. Experimental Validation Plan

Recommended assays:

1. Orthogonal biophysical binding screen:
   DSF, MST, SPR, ITC, or nanoDSF using purified YTHDF1 YTH domain.
2. RNA-competition assay:
   fluorescence polarization or AlphaScreen with an m6A-containing RNA probe.
3. Selectivity panel:
   compare against YTHDF2/YTHDF3 or other YTH-domain readers if the goal is
   YTHDF1 selectivity.
4. Cellular follow-up:
   only after direct binding and RNA-competition evidence.

Hit confirmation criteria:

- reproducible dose response
- no aggregation/interference signal
- direct binding or competition confirmed by an orthogonal assay
- structure-activity trend across analogs

## 11. Suggested Repository Layout

```text
virtual-screening/YTHDF1/
  README.md
  config/
    pipeline.yaml
  data/
    raw/
    processed/
    receptors/
    ligands/
    decoys/
  docs/
  results/
    docking/
    rescoring/
    admet/
    shortlist/
    figures/
  scripts/
  workflows/
```

## 12. Minimal Execution Roadmap

Phase 1: setup and validation

1. Fill `config/pipeline.yaml` with selected structure IDs, pocket center, and
   grid size.
2. Prepare one receptor state and a 20-100 compound validation set.
3. Redock/cross-dock controls and inspect poses.
4. Tune grid and preparation settings.

Phase 2: pilot screen

1. Prepare 1,000-10,000 compounds.
2. Dock against the receptor ensemble.
3. Inspect top 100-300 compounds.
4. Run high-exhaustiveness Vina/smina redocking, contact analysis, and ADMET
   flags.

Phase 3: production screen

1. Freeze receptor, ligand-prep, and scoring settings.
2. Screen the full library.
3. Cluster and consensus-rank the top subset.
4. Produce purchase/synthesis shortlist and controls.

## 13. Recommended Tools

Arch Linux system tools:

```bash
sudo pacman -S uv openbabel
```

Python project setup:

```bash
uv init
uv add rdkit pandas numpy scipy scikit-learn pyyaml biopython
```

Docking/preparation tools to install separately as needed:

- AutoDock Vina
- smina
- GNINA, optional and CUDA-dependent
- Meeko
- Open Babel
- RDKit
- fpocket or equivalent pocket detector
- GROMACS for optional MD; OpenMM is not required

Keep external binary versions in `docs/software_versions.tsv`.

## 14. References And Source Links

- UniProt YTHDF1 entry: https://www.uniprot.org/uniprotkb/Q9BYJ9/entry
- AlphaFold prediction API for `Q9BYJ9`: https://alphafold.ebi.ac.uk/api/prediction/Q9BYJ9
- RCSB PDB search: https://www.rcsb.org/
- AutoDock Vina documentation: https://autodock-vina.readthedocs.io/
- GNINA: https://github.com/gnina/gnina
- RDKit documentation: https://www.rdkit.org/docs/
- Meeko documentation: https://meeko.readthedocs.io/
