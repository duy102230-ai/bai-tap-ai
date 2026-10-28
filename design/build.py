"""Thêm 'Hải Phòng,' vào dòng ngày tháng của 2 banner và xuất file in (PNG + PDF)."""
from PIL import Image, ImageDraw, ImageFont
import numpy as np

FONT = 'fonts/RobotoCondensed-Bold.ttf'
JOBS = [
    # tên, ảnh gốc, vùng thanh ngày (x0,y0,x1,y1) ở 2560px, chữ cũ, chữ mới
    ('khai-mac', 'src/khai-mac-goc.jpg', (1000, 462, 1560, 508), 'Ngày 31 tháng 10 năm 2026', 'Hải Phòng, ngày 31 tháng 10 năm 2026'),
    ('be-mac', 'src/be-mac-goc.jpg', (860, 790, 1700, 855), 'Ngày 01 tháng 11 năm 2026', 'Hải Phòng, ngày 01 tháng 11 năm 2026'),
]

def text_bbox(arr, box):
    x0, y0, x1, y1 = box
    sub = arr[y0:y1, x0:x1].astype(int)
    dark = (sub[..., 0] < 200) & (sub[..., 1] < 90) & (sub[..., 2] < 90)
    ys, xs = np.where(dark)
    return x0 + xs.min(), y0 + ys.min(), x0 + xs.max(), y0 + ys.max()

def width(font, s, track):
    return sum(font.getlength(c) + track for c in s) - track

def draw_text(img, s, cx, cy_cap, size, track, color, cap_h):
    S = 4
    font = ImageFont.truetype(FONT, size * S)
    w = int(width(font, s, track * S)) + 8 * S
    h = size * S * 2
    layer = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(layer)
    x = 4 * S
    base = int(h * 0.75)
    for c in s:
        d.text((x, base), c, font=font, fill=255, anchor='ls')
        x += font.getlength(c) + track * S
    layer = layer.resize((w // S, h // S), Image.LANCZOS)
    # căn giữa theo ngang, đặt baseline sao cho cap-height giữa tại cy_cap
    px = int(cx - layer.width / 2)
    py = int(cy_cap + cap_h / 2 - (int(h * 0.75)) / S)
    img.paste(Image.new('RGB', layer.size, color), (px, py), layer)

for name, src, box, old, new in JOBS:
    img = Image.open(src).convert('RGB')
    arr = np.array(img)
    bx0, by0, bx1, by1 = text_bbox(arr, box)
    color = tuple(int(v) for v in np.median(arr[by0:by1, bx0:bx1][(arr[by0:by1, bx0:bx1][..., 1] < 70)], axis=0))
    cx = (bx0 + bx1) / 2
    # xoá chữ cũ: nội suy ngang giữa pixel hai bên vùng chữ, theo từng hàng
    pad = 14
    L, R = bx0 - pad, bx1 + pad
    ys = range(by0 - pad, by1 + pad + 1)
    for y in ys:
        a = arr[y, L - 6:L].mean(axis=0)
        b = arr[y, R + 1:R + 7].mean(axis=0)
        t = np.linspace(0, 1, R - L + 1)[:, None]
        arr[y, L:R + 1] = (a * (1 - t) + b * t).astype(np.uint8)
    img = Image.fromarray(arr)
    # chọn cỡ chữ/tracking khớp chữ cũ
    cap_h = by1 - by0  # gồm dấu -> dùng chiều cao 'N' bằng bbox chữ N
    best = None
    for size in range(30, 90):
        f = ImageFont.truetype(FONT, size)
        for track in (0, 1, 2, 3):
            w = width(f, old, track)
            err = abs(w - (bx1 - bx0))
            if best is None or err < best[0]:
                best = (err, size, track)
    _, size, track = best
    f = ImageFont.truetype(FONT, size)
    ncap = f.getbbox('N', anchor='ls')
    ncap_h = -ncap[1]
    # cy: tâm chữ N cũ — tìm đáy chữ 'N' đầu (baseline) từ bbox: baseline ≈ by1 - descender(g,y)
    desc = f.getbbox('y', anchor='ls')[3]
    baseline = by1 - desc
    cy_cap = baseline - ncap_h / 2
    cx_ = cx
    globals()['cx'] = cx_
    draw_text(img, new, cx_, cy_cap, size, track, color, ncap_h)
    print(name, 'font', size, 'track', track, 'color', color, 'bbox', (bx0, by0, bx1, by1))
    img.save(f'out/{name}-HaiPhong.png', dpi=(300, 300))
    img.save(f'out/{name}-HaiPhong.pdf', resolution=300.0)
