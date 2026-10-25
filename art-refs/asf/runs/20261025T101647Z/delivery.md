# 字學貓 shared animation regeneration — delivery QA

Run: `20261025T101647Z`

Exports: seven actions × four transparent 512×640 RGBA lossless WebPs, plus the referenced Memory static mascot. The three newly generated actions use the approved master plus ASF fixed-palette fur grading; idle, cheer, cast, and fish split the approved fishing sheets.

## Required identity and alignment checks

- Every `identity_head_ratio` check passes within `[0.95, 1.05]`. Values by action are in `qc/delivery-summary.json`; chef uses the 0.55 full-head band for its large chubby head and hat.
- All seven final frame sets pass `row_baseline`: value `0.0`, threshold `0.5` px. `scale_frames` uses scale `1.3597733711048159`, canvas `512×640`, stance anchor `(256, 606)`, torso-x root lock, and row baseline.
- All selected source spill reports have zero `cross_cell_components`, `cross_cell_visible`, `sheet_edge`, and `empty_cells`. No QC report has a FAIL.
- All 29 WebP outputs pass pixel-exact lossless round-trip checks.

## Selected QA advisories

Every non-pass check from the selected source spill and frame QC reports is listed below with its report path, value, and threshold.

### Source spill

- `qc/idle-source-spill/sheet-qc.json`: `safe_frame` value `4`, threshold `0`; `faint_specks` value `{"floor_px":3681,"detached_components":0}`, threshold `0`.
- `qc/cheer-source-spill/sheet-qc.json`: `boundary_band` value `23`, threshold `0`; `safe_frame` value `4`, threshold `0`; `faint_specks` value `{"floor_px":4062,"detached_components":0}`, threshold `0`.
- `qc/cast-source-spill/sheet-qc.json`: `safe_frame` value `4`, threshold `0`; `faint_specks` value `{"floor_px":3886,"detached_components":0}`, threshold `0`.
- `qc/fish-source-spill/sheet-qc.json`: `safe_frame` value `4`, threshold `0`; `faint_specks` value `{"floor_px":3936,"detached_components":0}`, threshold `0`.
- `qc/run-mirror-spill/sheet-qc.json`: `safe_frame` value `4`, threshold `0`.
- `qc/chef-palette-spill/sheet-qc.json`: `safe_frame` value `4`, threshold `0`.
- `qc/think-palette-spill/sheet-qc.json`: `safe_frame` value `4`, threshold `0`.

`safe_frame` means the subject is within 15% of a cell edge. Alpha haze from the approved fishing sources is cleaned during processing; the cheer boundary band has no crossing components.

### Final frame sets

- `qc/frames/cheer/sheet-qc.json`: `near_duplicates` value `[[0,3],[1,2],[1,3]]`, threshold `0.95`; `torso_drift` value `19.01`, threshold `2.0` px.
- `qc/frames/chef-head55/sheet-qc.json`: `near_duplicates` value `[[0,3]]`, threshold `0.95`.
- `qc/frames/think/sheet-qc.json`: `identity_residual` value `{"0":0.47,"1":1.47,"2":2.11,"3":0.53}`, threshold `1.5`, frame `[2]`; `near_duplicates` value `[[0,3]]`, threshold `0.95`.
- `qc/frames/fish/sheet-qc.json`: `near_duplicates` value `[[0,1],[1,2]]`, threshold `0.95`; `torso_drift` value `11.69`, threshold `2.0` px.
- Idle, run, and cast final frame QC reports have no warnings.

Full QA envelopes, processing metadata, generation jobs/prompts, corrected raw sheets, scaled PNG frames, and previews accompany the exports. `exports/webp-manifest.json` records the hashes and lossless checks.
