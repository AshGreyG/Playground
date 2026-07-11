# YTHDF1 Screening Decision Log

Use this file to record choices that affect reproducibility.

## Target Structure

- Selected receptor structure(s): PDB `7QKN`, chain `A`, ligand removed;
  PDBQT at `data/receptors/ythdf1_7qkn_chainA.pdbqt`.
- Reason for selection: experimental human YTHDF1 YTH-domain structure in a
  ligand-bound pocket-open state; Meeko receptor preparation succeeded cleanly.
- Apo candidate: PDB `4RCI`, chain `A`; useful later as a second receptor state
  but direct Meeko prep failed due to missing side-chain atoms and alternate
  locations.
- Regions removed: non-chain-A molecules and non-protein records removed from
  the prepared receptor.
- Protonation assumptions: Meeko default receptor preparation; pH-specific
  protonation review still pending before production screening.

## Pocket Definition

- Pocket center source: centroid of `JVF` ligand from `7QKN` chain `A`.
- Grid center: `5.273, -39.129, 14.742`.
- Grid dimensions: `20, 20, 20` A.
- Control ligand or transferred m6A reference: `7QKN/JVF` for first validation;
  `6ZD7/6MD` retained as biological m6A reference, but not used for first grid.
- Validation result: receptor prep succeeded; Vina and smina validation docking
  completed for 25/25 ligands.

## Ligand Library

- Source library: PubChem PUG-REST validation seed compounds.
- Date downloaded: 2026-07-09.
- Initial count: 26, including `jvf_7qkn` from the crystallographic `7QKN`
  ligand.
- Count after standardization: 26 valid RDKit SMILES.
- Count after filtering: no filtering applied; validation controls only.
- Count after state enumeration: one prepared state per compound.

## Docking Settings

- Engine(s): AutoDock Vina `1.2.7` and smina `Oct 15 2019`.
- Receptor states: `7QKN` chain `A`.
- Exhaustiveness: 8 for first validation pass.
- Pose count: 10.
- Random seed policy: engine defaults for first smoke test.

## Shortlist Criteria

- Consensus features used: Vina rank, smina rank, mean rank, raw affinity, and
  ligand efficiency.
- Pose/contact criteria used for validation: ligand centroid within 6 A of the
  `7QKN/JVF` reference centroid, overlap with at least 35 percent of
  reference-pocket residues, and at least one simple polar contact.
- Reference-pocket residues from `7QKN/JVF` at 4 A:
  `ARG404`, `ASP401`, `CYS412`, `ILE410`, `SER405`, `TRP411`.
- Validation pose-quality result: 16/26 compounds passed in both Vina and smina,
  including `jvf_7qkn`.
- ADMET filters used:
- Diversity clustering method:
- Final purchase/synthesis rationale:
