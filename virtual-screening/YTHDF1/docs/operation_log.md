# Operation Log

Date: 2026-07-09

Working directory:

```text
/home/ashgrey/Github/Playground/virtual-screening/YTHDF1
```

## 1. Project Scaffold

Created the YTHDF1 virtual-screening project layout:

```text
config/
data/
docs/
results/
scripts/
workflows/
```

Added the initial pipeline design:

```text
README.md
config/pipeline.yaml
docs/decision_log.md
docs/software_versions.tsv
docs/data_requirements.md
```

## 2. Environment Check

Checked installed tools and created:

```text
scripts/check_environment.sh
```

Observed working tools:

```text
python            3.14.6
uv                0.11.27
openbabel         3.2.0
vina              AutoDock Vina 1.2.7 at /home/ashgrey/.opt/bin/vina-1.2.7
smina             Oct 15 2019, based on AutoDock Vina 1.1.2
gromacs           2026.1-dev, CPU build
rdkit             2026.03.3 through uv project env
meeko             0.7.1 through uv project env
```

Unavailable or skipped:

```text
gnina             skipped, CUDA unavailable
openmm            skipped, local yay install failed
fpocket           skipped, local compile unavailable
```

Important adjustment:

- `fpocket` is not required for this focused workflow because the YTH pocket can
  be defined from ligand-bound YTH-domain structures.
- `gnina` and `openmm` were removed from the required path.
- Vina is configured by explicit binary path, not `PATH`.

## 3. Python Project Setup

Initialized a local `uv` project:

```bash
UV_CACHE_DIR=.uv-cache uv init --bare
```

Added dependencies:

```bash
UV_CACHE_DIR=.uv-cache uv add rdkit meeko pandas numpy scipy scikit-learn pyyaml biopython
UV_CACHE_DIR=.uv-cache uv add gemmi
```

Reason for `gemmi`:

- Meeko `0.7.1` imports `gemmi` at runtime.

Generated files:

```text
pyproject.toml
uv.lock
.venv/
.uv-cache/
```

## 4. Validation Ligand Collection

Created a validation seed list:

```text
data/ligands/validation_seed_compounds.tsv
```

Created a PubChem fetch script:

```text
scripts/fetch_pubchem_validation_ligands.py
```

Fetched validation ligands from PubChem PUG-REST and added one manual
structure-derived control:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/fetch_pubchem_validation_ligands.py
```

Outputs:

```text
data/ligands/validation_controls.smi
data/ligands/validation_controls_metadata.tsv
```

Validation:

```text
RDKit parsed 26/26 SMILES successfully.
```

Note:

- Initial PubChem request used older field names
  `CanonicalSMILES,IsomericSMILES`; PubChem returned blank values.
- Script was corrected to request `SMILES,ConnectivitySMILES`.
- `jvf_7qkn` was added as a manual validation control using the SMILES assigned
  from the `7QKN/JVF` crystallographic ligand:
  `CCN(CC)CCNC(=O)c1ccccc1S`.

## 5. Ligand Preparation

Created ligand preparation workflow:

```text
scripts/prepare_ligands.py
workflows/ligand_preparation.md
```

Ran:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/prepare_ligands.py
```

Preparation behavior:

- RDKit parses SMILES.
- Hydrogens are added.
- ETKDGv3 generates 3D conformers.
- MMFF94 minimizes when parameters are available.
- UFF is fallback.
- Meeko writes ligand PDBQT files.

Outputs:

```text
data/ligands/validation_prepared/validation_prepared.sdf
data/ligands/validation_prepared/ligand_prep_report.tsv
data/ligands/validation_prepared/sdf/*.sdf
data/ligands/validation_prepared/pdbqt/*.pdbqt
```

Result:

```text
Prepared 26/26 ligands.
```

Issue fixed:

- RDKit `EmbedParameters` in this environment does not expose `maxAttempts`.
- Removed direct `params.maxAttempts` assignment and kept fallback embedding
  with `maxAttempts`.

## 6. Receptor Search And Selection

Queried PDBe best structures for UniProt `Q9BYJ9`.

Candidate YTHDF1 structures found:

```text
4RCI    YTHDF1 YTH domain, apo, 1.97 A
7QKN    YTHDF1 YTH domain with ebsulfur derivative compound 7, 2.15 A
7QL7    YTHDF1 YTH domain with ebsulfur derivative compound 9, 2.3 A
7YYE    YTHDF1 YTH-domain mutant
7YYJ    YTHDF1 YTH-domain mutant
7YYF    YTHDF1 YTH-domain mutant
7YZ8    YTHDF1 YTH-domain mutant
```

Queried RCSB for m6A/YTH reference structures.

Important reference found:

```text
6ZD7    YTHDC1 mutant complex with m6A ligand 6MD
```

Created receptor/reference preparation script:

```text
scripts/prepare_receptor_reference.py
docs/receptor_selection.md
```

## 7. Receptor And Grid Preparation

First attempted m6A transfer:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/prepare_receptor_reference.py
```

This used:

```text
target:    4RCI chain A
reference: 6ZD7 chain A
ligand:    6MD
```

Result:

```text
CA alignment pairs: 147
RMSD: 12.270 A
```

Decision:

- Do not trust this transferred grid for first validation because the alignment
  was poor.

Next used same-protein YTHDF1 ligand-bound reference:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/prepare_receptor_reference.py \
  --reference-pdb 7QKN \
  --reference-chain A \
  --reference-ligand JVF \
  --alignment-mode local
```

Result:

```text
CA alignment pairs: 182
RMSD: 0.483 A
Transferred center: 41.619, 9.349, 45.920
```

Then selected `7QKN` itself as the first validation receptor:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/prepare_receptor_reference.py \
  --target-pdb 7QKN \
  --target-chain A \
  --reference-pdb 7QKN \
  --reference-chain A \
  --reference-ligand JVF \
  --alignment-mode local
```

Result:

```text
CA alignment pairs: 184
RMSD: 0.000 A
Grid center: 5.273, -39.129, 14.742
Grid size: 20, 20, 20 A
```

Prepared receptor PDBQT:

```bash
UV_CACHE_DIR=.uv-cache uv run mk_prepare_receptor.py \
  --read_pdb data/receptors/ythdf1_7qkn_chainA.pdb \
  -o data/receptors/ythdf1_7qkn_chainA \
  --box_center 5.273 -39.129 14.742 \
  --box_size 20 20 20 \
  -p data/receptors/ythdf1_7qkn_chainA.pdbqt \
  -v data/receptors/ythdf1_7qkn_chainA_vina_box.txt
```

Outputs:

```text
data/receptors/ythdf1_7qkn_chainA.pdb
data/receptors/ythdf1_7qkn_chainA.pdbqt
data/receptors/ythdf1_7qkn_chainA_vina_box.txt
data/receptors/ythdf1_7qkn_chainA.box.pdb
data/receptors/ythdf1_7qkn_chainA_7qkn_jvf_grid.json
```

Issue encountered:

- Direct Meeko preparation of `4RCI` failed due to missing side-chain atoms and
  alternate locations.
- Avoided using `--allow_bad_res` blindly.
- `4RCI` remains a later receptor-state candidate after repair.

## 8. Validation Docking

Created validation docking workflow:

```text
scripts/dock_validation.py
workflows/validation_docking.md
```

Initial run failed because:

- AutoDock Vina `1.2.7` does not accept `--log`.
- smina pose output uses `REMARK minimizedAffinity`, not
  `REMARK VINA RESULT`.

Patched `scripts/dock_validation.py` to:

- write logs from captured stdout/stderr
- parse both Vina and smina output styles

Reran validation docking:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/dock_validation.py \
  --exhaustiveness 8 \
  --num-modes 10 \
  --cpu 4
```

Result:

```text
Docked 26/26 ligands across 2 engine(s)
```

Outputs:

```text
results/docking/validation_7qkn/combined_scores.tsv
results/docking/validation_7qkn/best_scores.tsv
results/docking/validation_7qkn/vina/scores.tsv
results/docking/validation_7qkn/vina/poses/*.pdbqt
results/docking/validation_7qkn/vina/logs/*.log
results/docking/validation_7qkn/smina/scores.tsv
results/docking/validation_7qkn/smina/poses/*.pdbqt
results/docking/validation_7qkn/smina/logs/*.log
```

## 9. Validation Consensus Analysis

Created:

```text
scripts/analyze_validation_docking.py
```

Ran:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/analyze_validation_docking.py
```

Output:

```text
results/docking/validation_7qkn/consensus_validation_scores.tsv
```

Top compounds by mean Vina/smina rank:

```text
amp
guanosine
inosine
cytidine
uridine
xanthine
adenosine
m6A
hypoxanthine
quinoline
```

Interpretation:

- Raw docking favors larger polar nucleosides/nucleotides.
- This is acceptable for a smoke test, but production screening should not use
  raw score alone.
- Next required step is pose/contact inspection and contact-fingerprint
  filtering.

## 10. Pose And Contact Inspection

Created:

```text
scripts/analyze_pose_contacts.py
```

Ran:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/analyze_pose_contacts.py
```

Reference ligand:

```text
data/receptors/transferred_7qkn_jvf_on_7qkn_chainA.pdb
```

Reference-pocket residues within 4 A of `JVF`:

```text
A:ARG404
A:ASP401
A:CYS412
A:ILE410
A:SER405
A:TRP411
```

Pose-quality rule used for validation:

```text
ligand centroid within 6 A of the JVF reference centroid
reference-pocket residue overlap >= 0.35
simple polar contact count >= 1
```

Outputs:

```text
results/docking/validation_7qkn/pose_contact_summary.tsv
results/docking/validation_7qkn/reference_pocket_residues.tsv
results/docking/validation_7qkn/pose_quality_by_compound.tsv
```

Result:

```text
16/26 compounds passed the current pose-quality filter in both Vina and smina.
```

Compounds passing in both engines:

```text
amp
inosine
cytidine
uridine
m6A
adenosine
jvf_7qkn
theobromine
theophylline
n6_methyladenine
caffeine
benzimidazole
n6n6_dimethyladenine
purine
pyrimidine
imidazole
```

Interpretation:

- m6A and adenosine sit close to the reference ligand center and overlap the
  full reference pocket.
- `jvf_7qkn` is now included in the standard validation set, not only in the
  separate crystal-pose redocking control.
- Larger nucleosides such as AMP, inosine, cytidine, and uridine rank well by
  raw score but have more shifted centroids; these are useful validation
  controls, not necessarily probe-like hits.
- Some small heterocycles pass the pocket occupancy check despite weaker raw
  scores, which is useful for fragment-style screening.

## 11. ChEMBL Pilot Screen

Input database:

```text
/home/ashgrey/Documents/chembl_37.sdf.gz
```

Database size:

```text
889 MB compressed
~8.0 GB uncompressed
```

Created:

```text
scripts/build_chembl_pilot_library.py
workflows/chembl_pilot_screen.md
```

Built a focused 1,000-compound ChEMBL pilot library:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/build_chembl_pilot_library.py \
  --target-count 1000 \
  --stop-after-target \
  --progress-every 25000
```

Outputs:

```text
data/ligands/chembl_pilot_1k.smi
data/ligands/chembl_pilot_1k_metadata.tsv
data/ligands/chembl_pilot_1k_filter_report.tsv
```

Filter result:

```text
Selected 1000 compounds from 4583 parsed ChEMBL records.
```

Prepared the 1,000-compound library:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/prepare_ligands.py \
  --input data/ligands/chembl_pilot_1k.smi \
  --outdir data/ligands/chembl_pilot_1k_prepared
```

Result:

```text
Prepared 1000/1000 ligands.
```

Attempted full 1,000-compound Vina/smina docking:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/dock_validation.py \
  --ligand-dir data/ligands/chembl_pilot_1k_prepared/pdbqt \
  --outdir results/docking/chembl_pilot_1k \
  --exhaustiveness 8 \
  --num-modes 10 \
  --cpu 4
```

Decision:

- Stopped the 1,000-compound docking run after measuring runtime.
- Observed rate was roughly 5 seconds per docking job.
- Full 1,000 compounds across two engines means about 2,000 docking jobs, or
  roughly 2.5-3 hours on this CPU setup.
- The prepared 1,000-compound library remains available for an unattended run.

Completed a 100-compound ChEMBL pilot screen using the first 100 prepared
ligands:

```text
data/ligands/chembl_pilot_100.smi
data/ligands/chembl_pilot_100_prepared/pdbqt/*.pdbqt
```

Docking command:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/dock_validation.py \
  --ligand-dir data/ligands/chembl_pilot_100_prepared/pdbqt \
  --outdir results/docking/chembl_pilot_100 \
  --exhaustiveness 8 \
  --num-modes 10 \
  --cpu 4
```

Docking result:

```text
Vina: 100/100 successful
smina: 98/100 successful
```

smina failures:

```text
CHEMBL443332
CHEMBL503315
```

Reason:

```text
older smina build does not accept Meeko atom type CG0
```

Consensus and pose-contact filtering:

```bash
UV_CACHE_DIR=.uv-cache uv run python scripts/analyze_validation_docking.py \
  --scores results/docking/chembl_pilot_100/best_scores.tsv \
  --smiles data/ligands/chembl_pilot_100.smi \
  --out results/docking/chembl_pilot_100/consensus_scores.tsv

UV_CACHE_DIR=.uv-cache uv run python scripts/analyze_pose_contacts.py \
  --docking-dir results/docking/chembl_pilot_100 \
  --scores results/docking/chembl_pilot_100/consensus_scores.tsv \
  --out results/docking/chembl_pilot_100/pose_contact_summary.tsv
```

Final shortlist:

```text
results/docking/chembl_pilot_100/final_shortlist.tsv
```

Result:

```text
93/100 compounds passed the current both-engine pose-quality filter.
```

Top shortlisted compounds by consensus rank:

```text
CHEMBL498905
CHEMBL266960
CHEMBL4116118
CHEMBL499568
CHEMBL503623
CHEMBL554586
CHEMBL548334
CHEMBL439267
CHEMBL4116102
CHEMBL503469
```

Interpretation:

- The ChEMBL pipeline is operational end to end.
- Runtime, not software correctness, is the limiting factor for 1,000-10,000
  compound CPU docking.
- For a larger run, use the prepared 1,000-compound PDBQT library or generate a
  larger ChEMBL subset, then run docking unattended.

Working stages:

```text
environment check
validation ligand fetch
validation ligand 3D/PDBQT preparation
receptor/grid preparation using 7QKN
Vina/smina validation docking
consensus score analysis
pose/contact inspection
```

Current receptor:

```text
data/receptors/ythdf1_7qkn_chainA.pdbqt
```

Current validation ligand PDBQTs:

```text
data/ligands/validation_prepared/pdbqt/*.pdbqt
```

Current best score table:

```text
results/docking/validation_7qkn/consensus_validation_scores.tsv
```

Recommended next stage:

```text
build a pilot screening input format and run 1,000-10,000 compounds through
the validated ligand-prep, docking, consensus, and pose-contact workflow
```
