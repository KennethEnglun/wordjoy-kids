# 字學貓 shared animation regeneration — delivery QA

Run: `20261025T101647Z`

Exports: seven actions × four transparent 512×640 RGBA lossless WebPs, plus the referenced Memory static mascot.
Identity source: approved fishing master, fishing sheets, and fixed palette recorded in `run-manifest.json`.

## Checks

- All 28 animation frames pass `identity_head_ratio` within 0.95–1.05. Run values: 0.99–1.01; all other actions are also within range.
- All seven action sheets pass `row_baseline` (0 px spread). Shared `scale_frames` profile is 1.3597733711, canvas 512×640, stance anchor (256, 606), torso-x root lock.
- All selected sheet spill reports have zero cross-cell components, visible cross-cell pixels, sheet-edge cuts, or empty cells. Remaining `safe_frame` warnings mean the subjects sit within 15% of a cell edge; each affected report counts four cells. The already approved fishing idle/cheer/cast/fish source reports also note alpha haze; alpha hygiene was applied during processing. Cheer source reports 23 solid pixels near cell boundaries; QC found no crossing component.
- Run's leg alternation check is `needs-visual-review` (no clear near/far lead pair); phase coverage detects both contact and flight in both half-cycles. The selected visual is retained with this advisory. Its `near_duplicates` warning flags frames 1/3 (best-shift IoU 0.9578).

## Non-failing frame advisories

- Run: torso x drift 5.03 px before shared root-lock alignment; frames 1/3 near-duplicate warning (IoU 0.9578).
- Cheer: near-duplicate pairs 1/4, 2/3, 2/4; torso x drift 19.01 px before root lock.
- Chef: torso x drift 29.07 px before root lock. Head-ratio QC uses the full chubby-head band (0.55) and passes all frames at 0.959–1.00.
- Think: frame 3 identity residual 2.03 against 1.5 threshold; torso x drift 32.55 px before root lock.
- Fish: near-duplicate pairs 1/2 and 2/3; torso x drift 11.69 px before root lock.
- Idle and cast frame checks have no warnings.

Detailed machine reports, previews, source prompts, and processing metadata are retained alongside the exports. `exports/webp-manifest.json` records lossless pixel round-trip checks for all 29 WebPs.
