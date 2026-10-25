from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


RUN = Path("art-refs/asf/runs/20261025T101647Z")
ANIM = Path("public/art/games/anim")
MEMORY = Path("public/art/games/memory/memory_mascot_think.webp")
SOURCES = {
    "idle": RUN / "scaled/idle/frames",
    "run": RUN / "scaled/run-final/frames",
    "cheer": RUN / "scaled/cheer/frames",
    "chef": RUN / "scaled/chef/frames",
    "think": RUN / "scaled/think/frames",
    "cast": RUN / "scaled/cast/frames",
    "fish": RUN / "scaled/fish/frames",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for block in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


records = []
for action, source_dir in SOURCES.items():
    for index in range(1, 5):
        source = source_dir / f"zxm-{action}-{index}.png"
        if action == "run":
            source = source_dir / f"zxm-run-final-{index}.png"
        target = ANIM / f"zxm_{action}_{index:02d}.webp"
        with Image.open(source) as opened:
            frame = opened.convert("RGBA")
        if frame.size != (512, 640):
            raise ValueError(f"{source}: expected 512x640, got {frame.size}")
        frame.save(target, "WEBP", lossless=True, method=6, exact=True)
        with Image.open(target) as exported:
            if exported.size != (512, 640) or exported.mode != "RGBA":
                raise ValueError(f"{target}: expected 512x640 RGBA, got {exported.size} {exported.mode}")
            if exported.tobytes() != frame.tobytes():
                raise ValueError(f"{target}: lossless WebP round-trip differs from source PNG")
        records.append({
            "action": action,
            "frame": index,
            "source": str(source),
            "target": str(target),
            "size": [512, 640],
            "mode": "RGBA",
            "source_sha256": sha256(source),
            "target_sha256": sha256(target),
            "bytes": target.stat().st_size,
            "lossless_roundtrip": True,
        })

think_source = SOURCES["think"] / "zxm-think-1.png"
with Image.open(think_source) as opened:
    memory_frame = opened.convert("RGBA")
memory_frame.save(MEMORY, "WEBP", lossless=True, method=6, exact=True)
with Image.open(MEMORY) as exported:
    if exported.size != (512, 640) or exported.mode != "RGBA":
        raise ValueError(f"{MEMORY}: expected 512x640 RGBA, got {exported.size} {exported.mode}")
    if exported.tobytes() != memory_frame.tobytes():
        raise ValueError(f"{MEMORY}: lossless WebP round-trip differs from source PNG")

records.append({
    "action": "memory_static",
    "frame": 1,
    "source": str(think_source),
    "target": str(MEMORY),
    "size": [512, 640],
    "mode": "RGBA",
    "source_sha256": sha256(think_source),
    "target_sha256": sha256(MEMORY),
    "bytes": MEMORY.stat().st_size,
    "lossless_roundtrip": True,
})

manifest = RUN / "exports/webp-manifest.json"
manifest.parent.mkdir(parents=True, exist_ok=True)
manifest.write_text(json.dumps({
    "schema": "wordjoy.zxm_animation_webp_exports.v1",
    "format": "lossless RGBA WebP",
    "canvas_px": [512, 640],
    "count": len(records),
    "files": records,
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": "pass", "count": len(records), "manifest": str(manifest)}))
