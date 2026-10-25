from __future__ import annotations
import json
from pathlib import Path
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).parent
OUT = ROOT / 'exports'
OUT.mkdir(exist_ok=True)

SOURCES = {
    'fishing_v2_bg_lake.webp': ('raw_lake.png', (780, 1688), 'cover'),
    'fishing_v2_pier.webp': ('asf_pier/clean.png', (640, 280), 'fit'),
    'fishing_v2_bucket.webp': ('asf_props/sheet-1.png', (256, 256), 'fit'),
    'fishing_v2_bobber.webp': ('asf_props/sheet-2.png', (96, 96), 'fit'),
    'fishing_v2_bait_bag.webp': ('asf_props/sheet-3.png', (128, 128), 'fit'),
    'fishing_v2_rod_icon.webp': ('asf_props/sheet-4.png', (96, 96), 'fit'),
    'fishing_v2_fish_common.webp': ('asf_fish_common/clean.png', (256, 160), 'fit'),
    'fishing_v2_fish_striped.webp': ('asf_fish_striped/clean.png', (256, 160), 'fit'),
    'fishing_v2_fish_blue.webp': ('asf_fish_blue/clean.png', (256, 160), 'fit'),
    'fishing_v2_fish_spotted.webp': ('asf_fish_spotted/clean.png', (256, 160), 'fit'),
    'fishing_v2_fish_rare_big.webp': ('asf_fish_rare_big/clean.png', (320, 200), 'fit'),
    'fishing_v2_fish_icon_small.webp': ('asf_fish_icon_small/clean.png', (96, 96), 'fit'),
    'fishing_v2_fx_ripple.webp': ('asf_fx/fx-1.png', (320, 320), 'fit'),
    'fishing_v2_fx_splash.webp': ('asf_fx/fx-2.png', (320, 320), 'fit'),
    'fishing_v2_fx_sparkle.webp': ('asf_fx/fx-3.png', (256, 256), 'fit'),
    'fishing_v2_fx_soft_glow.webp': ('asf_fx/fx-4.png', (512, 512), 'fit'),
    'bot_bunny_avatar.webp': ('asf_bots_v2/sheet-1.png', (96, 96), 'fit'),
    'bot_chick_avatar.webp': ('asf_bots_v2/sheet-2.png', (96, 96), 'fit'),
    'ui_choice_btn_normal.webp': ('asf_buttons/sheet-1.png', (360, 120), 'stretch'),
    'ui_choice_btn_pressed.webp': ('asf_buttons/sheet-2.png', (360, 120), 'stretch'),
    'ui_choice_btn_correct.webp': ('asf_buttons/sheet-3.png', (360, 120), 'stretch'),
    'ui_choice_btn_wrong.webp': ('asf_buttons/sheet-4.png', (360, 120), 'stretch'),
    'ui_cream_panel.webp': ('asf_ui_frames/sheet-1.png', (640, 480), 'stretch'),
    'ui_cta_sage.webp': ('asf_ui_frames/sheet-2.png', (640, 140), 'stretch'),
    'ui_hud_pill_empty.webp': ('asf_ui_frames/sheet-3.png', (512, 128), 'stretch'),
    'ui_coin_icon.webp': ('asf_ui_frames/sheet-4.png', (128, 128), 'fit'),
    'ui_speak_icon.webp': ('asf_speak/clean.png', (96, 96), 'fit'),
}

def read_source(relative: str) -> Image.Image:
    return Image.open(ROOT / relative).convert('RGBA')

def premultiplied_resize(src: Image.Image, size: tuple[int, int]) -> Image.Image:
    arr = np.asarray(src.convert('RGBA')).astype(np.float32)
    alpha = arr[..., 3:4] / 255.0
    premul = arr[..., :3] * alpha
    chans = []
    for channel in [*np.moveaxis(premul, 2, 0), arr[..., 3]]:
        plane = Image.fromarray(np.clip(channel, 0, 255).astype(np.uint8), 'L')
        chans.append(np.asarray(plane.resize(size, Image.Resampling.LANCZOS), dtype=np.float32))
    a = np.clip(chans[3] / 255.0, 0.0, 1.0)
    rgbp = np.stack(chans[:3], axis=-1)
    rgb = np.zeros_like(rgbp)
    valid = a > 1e-5
    rgb[valid] = rgbp[valid] / a[valid, None]
    out = np.dstack((np.clip(rgb, 0, 255), a * 255)).round().astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def alpha_bbox(im: Image.Image, threshold: int = 5):
    a = im.getchannel('A').point(lambda v: 255 if v > threshold else 0)
    return a.getbbox()

def render_cutout(src: Image.Image, size: tuple[int, int], mode: str, margins=(0.05, 0.05), threshold=5) -> Image.Image:
    src = src.convert('RGBA')
    box = alpha_bbox(src, threshold)
    if box is None:
        raise ValueError(f'No visible alpha for {size}')
    crop = src.crop(box)
    w, h = size
    mx, my = margins
    max_w, max_h = max(1, round(w * (1 - 2 * mx))), max(1, round(h * (1 - 2 * my)))
    if mode == 'stretch':
        scaled = premultiplied_resize(crop, (max_w, max_h))
    else:
        factor = min(max_w / crop.width, max_h / crop.height)
        sw, sh = max(1, round(crop.width * factor)), max(1, round(crop.height * factor))
        scaled = premultiplied_resize(crop, (sw, sh))
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    canvas.alpha_composite(scaled, ((w - scaled.width) // 2, (h - scaled.height) // 2))
    return canvas

def render_cover(src: Image.Image, size: tuple[int, int]) -> Image.Image:
    rgb = src.convert('RGB')
    return ImageOps.fit(rgb, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))

manifest = {'run': '20261025T104133Z/fishing-props', 'route': 'Codex image_gen host_image (local)', 'outputs': {}}
for name, (source, size, mode) in SOURCES.items():
    image = read_source(source)
    if mode == 'cover':
        out = render_cover(image, size)
    else:
        if name.startswith('ui_choice_btn_'):
            margins = (0.035, 0.06)
        elif name == 'ui_cream_panel.webp':
            margins = (0.035, 0.04)
        elif name in {'ui_cta_sage.webp', 'ui_hud_pill_empty.webp'}:
            margins = (0.025, 0.08)
        elif name == 'fishing_v2_pier.webp':
            margins = (0.035, 0.06)
        elif name.startswith('fishing_v2_fish_'):
            margins = (0.035, 0.08)
        elif name.startswith('fishing_v2_fx_'):
            margins = (0.025, 0.025)
        elif name.startswith('bot_'):
            margins = (0.06, 0.06)
        else:
            margins = (0.05, 0.05)
        out = render_cutout(image, size, mode, margins=margins, threshold=5)
    path = OUT / name
    if out.mode == 'RGBA':
        out.save(path, format='WEBP', lossless=True, method=6)
    else:
        out.save(path, format='WEBP', quality=92, method=6)
    manifest['outputs'][name] = {
        'source': source,
        'size': list(size),
        'mode': out.mode,
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'bytes': path.stat().st_size,
    }

(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')

# Review contact sheet, checkerboard behind alpha cutouts.
files = sorted(OUT.glob('*.webp'))
thumb_w, thumb_h, label_h = 190, 150, 40
cols = 5
rows = (len(files) + cols - 1) // cols
preview = Image.new('RGB', (cols * thumb_w, rows * (thumb_h + label_h)), '#f4f1e6')
draw = ImageDraw.Draw(preview)
font = ImageFont.load_default()
for index, path in enumerate(files):
    if path.name == 'fishing_v2_bg_lake.webp':
        continue
    im = Image.open(path).convert('RGBA')
    tile_x = (index % cols) * thumb_w
    tile_y = (index // cols) * (thumb_h + label_h)
    checker = Image.new('RGBA', (thumb_w, thumb_h), '#f4f1e6')
    cd = ImageDraw.Draw(checker)
    sq = 12
    for yy in range(0, thumb_h, sq):
        for xx in range(0, thumb_w, sq):
            if ((xx // sq) + (yy // sq)) % 2:
                cd.rectangle((xx, yy, xx + sq - 1, yy + sq - 1), fill='#e7e4d8')
    thumb = im.copy()
    thumb.thumbnail((thumb_w - 16, thumb_h - 16), Image.Resampling.LANCZOS)
    checker.alpha_composite(thumb, ((thumb_w - thumb.width) // 2, (thumb_h - thumb.height) // 2))
    preview.paste(checker.convert('RGB'), (tile_x, tile_y))
    size = Image.open(path).size
    label = path.stem.replace('fishing_v2_', '').replace('ui_', '')
    draw.text((tile_x + 5, tile_y + thumb_h + 3), f'{label} {size[0]}x{size[1]}', fill='#334238', font=font)
preview.save(ROOT / 'preview_exports.png')
print(json.dumps({'count': len(SOURCES), 'out': str(OUT), 'preview': str(ROOT / 'preview_exports.png')}, indent=2))
