# Trata os logos oficiais dos parceiros: fundo transparente, recorte, equilíbrio visual e WebP sem perda.
# Uso: python3 site/tools/logos.py PASTA_COM_OS_ORIGINAIS site/assets/parceiros
# Para incluir uma marca, acrescente uma linha em LOGOS e copie o width/height impresso para o <img> no HTML.
import os, sys, json
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
# arquivo de origem, nome do arquivo final, nome oficial (alt), recorte opcional (x0, x1) antes do trim
LOGOS = [
    ('6.webp',  'allianz',          'Allianz',              None),
    ('7.webp',  'bradesco-seguros', 'Bradesco Seguros',     None),
    ('8.png',   'ens',              'ENS',                  (0, 640)),   # sem o slogan: ilegível no tamanho do cartão
    ('9.png',   'hdi-seguros',      'HDI Seguros',          None),
    ('10.png',  'maxpar',           'Maxpar Assistências',  None),
]
AREA = 2700          # área visual igual para todas as marcas (px² CSS)
MAX_W, MAX_H = 124, 40
SCALE = 2            # arquivo no dobro do tamanho de exibição (telas retina)

def white_to_alpha(rgba):
    """'Cor para alfa' contra o branco: preserva a borda suavizada sem halo."""
    a = rgba.astype(np.float64)
    rgb, alpha0 = a[..., :3], a[..., 3] / 255.0
    alpha = (255.0 - rgb).max(axis=2) / 255.0
    safe = np.where(alpha > 0, alpha, 1)
    color = 255.0 - (255.0 - rgb) / safe[..., None]
    out = np.dstack([np.clip(color, 0, 255), alpha * alpha0 * 255.0])
    return out.round().astype(np.uint8)

meta = []
for src, slug, name, crop in LOGOS:
    im = Image.open(f'{SRC}/{src}').convert('RGBA')
    if crop: im = im.crop((crop[0], 0, crop[1], im.height))
    arr = np.array(im)
    if (arr[..., 3] < 250).sum() < arr[..., 3].size * 0.05:   # fundo opaco (branco): vira transparente
        arr = white_to_alpha(arr)
    ys, xs = np.where(arr[..., 3] > 8)
    pad = 2
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad + 1, arr.shape[1]), min(ys.max() + pad + 1, arr.shape[0]))
    im = Image.fromarray(arr).crop(box)
    ratio = im.width / im.height
    w, h = (AREA * ratio) ** .5, (AREA / ratio) ** .5
    k = min(1, MAX_W / w, MAX_H / h)
    w, h = round(w * k), round(h * k)
    final = im.resize((w * SCALE, h * SCALE), Image.LANCZOS)
    path = f'{OUT}/{slug}.webp'
    final.save(path, 'WEBP', lossless=True, method=6, quality=100)
    meta.append({'slug': slug, 'name': name, 'w': w, 'h': h, 'file_kb': round(os.path.getsize(path) / 1024, 1), 'src_px': f'{im.width}x{im.height}'})
print(json.dumps(meta, ensure_ascii=False, indent=1))
