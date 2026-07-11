# Receptor Selection

## Prepared Validation Receptor

Prepared validation receptor: human YTHDF1 YTH domain, PDB `7QKN`, chain `A`,
with ligand removed before receptor PDBQT preparation.

Rationale:

- experimental human YTHDF1 YTH-domain structure
- ligand-bound pocket-open conformation
- receptor preparation succeeded cleanly with Meeko
- provides a practical first validation receptor for the CPU docking workflow

## Apo Receptor Candidate

Primary receptor: human YTHDF1 YTH domain, PDB `4RCI`, chain `A`.

Rationale:

- experimental human YTHDF1 YTH-domain structure
- X-ray diffraction, 1.97 A resolution
- maps to UniProt `Q9BYJ9` residues 361-559
- apo structure is useful later, but direct Meeko preparation failed because the
  deposited model has missing side-chain atoms and alternate locations across
  multiple residues. Do not use `--allow_bad_res` blindly for the first run.

## Pocket Reference

Current pocket reference: YTHDF1 YTH domain with compound 7, PDB `7QKN`,
chain `A`, ligand `JVF`.

Rationale:

- same-protein YTHDF1 pocket reference
- alignment to the prepared receptor is exact when using the same chain
- ligand centroid defines the validation docking box

Previous m6A transfer attempt:

- `6ZD7` contains `6MD` m6A, but global transfer to `4RCI` gave a poor 12.27 A
  CA RMSD. Keep it as a biological reference, not as the first grid source.

## Local Files

```text
data/raw/structures/4RCI.pdb
data/raw/structures/6ZD7.pdb
data/raw/structures/7QKN.pdb
data/receptors/ythdf1_7qkn_chainA.pdb
data/receptors/ythdf1_7qkn_chainA.pdbqt
data/receptors/ythdf1_7qkn_chainA_vina_box.txt
data/receptors/ythdf1_7qkn_chainA_7qkn_jvf_grid.json
data/receptors/ythdf1_4rci_chainA.pdb
data/receptors/transferred_6zd7_6md_on_4rci.pdb
data/receptors/ythdf1_4rci_grid.json
data/receptors/ythdf1_4rci_6zd7_alignment_summary.tsv
```

## Notes

YTHDF1 ligand-bound structures `7QKN` and `7QL7` are useful for pocket-open
screening. The first validation run uses `7QKN`; `4RCI` can be repaired and
added later as a second receptor state.

`fpocket` is not required for this stage because the biological pocket is known
and can be transferred from an m6A-bound YTH-domain structure.
