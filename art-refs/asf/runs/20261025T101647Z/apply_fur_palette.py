#!/usr/bin/env python3
"""Grade only the locked grey-fur palette classes against the approved ZXM master.

This keeps the generated pose, alpha, fur texture and all non-fur colours
intact. Fur hue/chroma is mapped to the exact locked base colour while OKLab
lightness is linearly fitted to the approved master's fur range.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SCRIPT_DIR = Path("/workspace/refs/agent-sprite-forge/skills/generate2dsprite/scripts")
sys.path.insert(0, str(SCRIPT_DIR))
from forge_palette import from_oklab, to_oklab  # noqa: E402


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def rgb_from_hex(value: str) -> tuple[int, int, int]:
    return tuple(int(value[i:i + 2], 16) for i in (1, 3, 5))


def grey_fur_mask(rgba: np.ndarray, palette_rgb: np.ndarray, palette_lab: np.ndarray) -> np.ndarray:
    visible = rgba[..., 3] > 0
    flat = rgba[..., :3].reshape(-1, 3)
    unique, inverse = np.unique(flat, axis=0, return_inverse=True)
    labs = to_oklab(unique).astype(np.float64)
    dist = np.sum((labs[:, None, :] - palette_lab[None, :, :]) ** 2, axis=2)
    nearest = dist.argmin(axis=1)
    color_is_fur = np.isin(nearest, np.arange(6))
    return visible & color_is_fur[inverse].reshape(rgba.shape[:2])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input-dir", required=True, type=Path)
    ap.add_argument("--reference", required=True, type=Path)
    ap.add_argument("--palette", required=True, type=Path)
    ap.add_argument("--prefix", default="")
    ap.add_argument("--output-dir", required=True, type=Path)
    args = ap.parse_args()

    if args.output_dir.exists():
        raise SystemExit(f"error: {args.output_dir} already exists; choose a new --output-dir")
    files = sorted(args.input_dir.glob("sheet-[1-4].png"))
    if len(files) != 4:
        raise SystemExit(f"error: expected four sheet-*.png inputs, found {len(files)}")

    palette = json.loads(args.palette.read_text(encoding="utf-8"))
    palette_rgb = np.array([rgb_from_hex(c["hex"]) for c in palette["colors"]], dtype=np.uint8)
    palette_lab = to_oklab(palette_rgb).astype(np.float64)
    ref_rgba = np.array(Image.open(args.reference).convert("RGBA"))
    ref_mask = grey_fur_mask(ref_rgba, palette_rgb, palette_lab)
    ref_rgb = ref_rgba[..., :3][ref_mask]
    if len(ref_rgb) < 1000:
        raise SystemExit("error: approved master has too few pixels assigned to the locked fur ramp")
    ref_lab = to_oklab(ref_rgb).astype(np.float64)
    reference_l_sorted = np.sort(ref_lab[:, 0], kind="stable")
    locked_base = np.array(rgb_from_hex("#B9B4AE"), dtype=np.uint8)
    locked_lab = to_oklab(locked_base).astype(np.float64)

    loaded = [(p, np.array(Image.open(p).convert("RGBA"))) for p in files]
    src_ls = []
    masks = []
    for _, rgba in loaded:
        mask = grey_fur_mask(rgba, palette_rgb, palette_lab)
        masks.append(mask)
        if mask.any():
            src_ls.append(to_oklab(rgba[..., :3][mask]).astype(np.float64)[:, 0])
    if not src_ls:
        raise SystemExit("error: no frame pixels match the locked warm-grey fur ramp")
    source_l = np.concatenate(src_ls)
    source_l_sorted = np.sort(source_l, kind="stable")
    if len(source_l_sorted) < 1000:
        raise SystemExit("error: too few frame pixels match the locked warm-grey fur ramp")

    args.output_dir.mkdir(parents=True)
    report = {
        "schema": "wordjoy.zxm_fur_palette_grade.v1",
        "method": "OKLab lightness range fit to approved master; hue/chroma locked to #B9B4AE",
        "reference": {"path": str(args.reference), "sha256": sha256(args.reference), "fur_pixels": int(len(ref_rgb))},
        "palette": {"path": str(args.palette), "sha256": sha256(args.palette), "fur_ramp_indices": list(range(6)), "base": "#B9B4AE"},
        "frames": [],
    }
    n_source = len(source_l_sorted)
    target_center = float(np.median(reference_l_sorted))
    target_low, target_high = np.quantile(reference_l_sorted, [0.05, 0.95])
    source_center = float(np.median(source_l_sorted))
    source_low, source_high = np.quantile(source_l_sorted, [0.05, 0.95])
    lightness_scale = float((target_high - target_low) / max(1e-8, source_high - source_low))
    for (src, rgba), mask in zip(loaded, masks):
        before = rgba[..., :3][mask]
        if not len(before):
            raise SystemExit(f"error: {src.name} has no visible pixels in the locked fur ramp")
        lab = to_oklab(before).astype(np.float64)
        lightness = lab[:, 0]
        target_l = target_center + (lightness - source_center) * lightness_scale
        target_lab = np.column_stack((target_l, np.full(len(target_l), locked_lab[1]), np.full(len(target_l), locked_lab[2])))
        out = rgba.copy()
        graded_rgb = np.asarray(from_oklab(target_lab), dtype=np.float64)
        out[..., :3][mask] = np.clip(np.rint(graded_rgb), 0, 255).astype(np.uint8)
        target = args.output_dir / (f"{args.prefix}{len(report['frames']) + 1}.png" if args.prefix else src.name)
        Image.fromarray(out, mode="RGBA").save(target, format="PNG", optimize=True)
        after = out[..., :3][mask]
        report["frames"].append({
            "input": {"path": str(src), "sha256": sha256(src)},
            "output": {"path": str(target), "sha256": sha256(target)},
            "fur_pixels": int(mask.sum()),
            "median_rgb_before": [int(x) for x in np.median(before, axis=0)],
            "median_rgb_after": [int(x) for x in np.median(after, axis=0)],
            "mean_rgb_after": [round(float(x), 2) for x in np.mean(after, axis=0)],
        })
    report["source_fur_pixels"] = int(n_source)
    report["luminance_fit"] = {"source_median": source_center, "target_median": target_center, "scale": lightness_scale, "source_p05_p95": [float(source_low), float(source_high)], "target_p05_p95": [float(target_low), float(target_high)]}
    report["locked_base_lab"] = [round(float(x), 8) for x in locked_lab]
    report["reference_fur_luminance_percentiles"] = [round(float(x), 6) for x in np.quantile(reference_l_sorted, [0.05, 0.25, 0.5, 0.75, 0.95])]
    (args.output_dir / "palette-grade.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "pass", "output_dir": str(args.output_dir), "frames": len(files), "fur_pixels": n_source, "palette": str(args.palette)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
