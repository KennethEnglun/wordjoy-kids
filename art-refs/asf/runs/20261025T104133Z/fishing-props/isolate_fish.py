from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.optimize import linear_sum_assignment

ROOT = Path(__file__).parent
SOURCE = ROOT / 'raw_fish_v2.png'
OUT = ROOT / 'isolated-fish'
OUT.mkdir(exist_ok=True)
NAMES = ['common', 'striped', 'blue', 'spotted', 'rare_big', 'icon_small']
im = Image.open(SOURCE).convert('RGBA')
a = np.asarray(im.getchannel('A'))
labels, count = ndimage.label(a > 16, structure=np.ones((3, 3), dtype=bool))
objects = []
for label_id, sl in enumerate(ndimage.find_objects(labels), start=1):
    if sl is None:
        continue
    ys, xs = sl
    area = int(np.count_nonzero(labels[sl] == label_id))
    if area < 10000:
        continue
    cy = (ys.start + ys.stop) / 2
    cx = (xs.start + xs.stop) / 2
    objects.append({'label': label_id, 'area': area, 'center': [cx, cy], 'bbox': [xs.start, ys.start, xs.stop, ys.stop]})
if len(objects) != len(NAMES):
    raise SystemExit(f'Expected six fish components, found {len(objects)}: {objects}')
centers = np.array([[256, 256], [768, 256], [1280, 256], [256, 768], [768, 768], [1280, 768]], dtype=float)
actual = np.array([o['center'] for o in objects], dtype=float)
rows, cols = linear_sum_assignment(np.linalg.norm(centers[:, None, :] - actual[None, :, :], axis=2))
assignment = {int(r): objects[int(c)] for r, c in zip(rows, cols)}
source_rgba = np.asarray(im)
report = {'source': str(SOURCE), 'source_size': list(im.size), 'threshold': 16, 'assets': {}}
for index, name in enumerate(NAMES):
    obj = assignment[index]
    x0, y0, x1, y1 = obj['bbox']
    fringe = 10
    x0, y0 = max(0, x0 - fringe), max(0, y0 - fringe)
    x1, y1 = min(im.width, x1 + fringe), min(im.height, y1 + fringe)
    crop = source_rgba[y0:y1, x0:x1].copy()
    # Keep the owned fish component, including its semi-transparent edge pixels.
    yy, xx = np.mgrid[y0:y1, x0:x1]
    owner = labels[y0:y1, x0:x1] == obj['label']
    dist = ndimage.distance_transform_edt(~owner)
    crop[..., 3][(dist > fringe) & (crop[..., 3] < 64)] = 0
    piece = Image.fromarray(crop, 'RGBA')
    side = max(piece.size)
    pad = max(16, round(side * 0.14))
    canvas = Image.new('RGBA', (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    canvas.alpha_composite(piece, ((canvas.width - piece.width) // 2, (canvas.height - piece.height) // 2))
    path = OUT / f'fish_{name}.png'
    canvas.save(path)
    report['assets'][name] = {'component_area': obj['area'], 'component_center': obj['center'], 'bbox': obj['bbox'], 'isolated_size': list(canvas.size), 'file': path.name}
(ROOT / 'isolated-fish.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
