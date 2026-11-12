# Converte as capas das revistas (as mesmas da página Publicações do site original) para WebP 3:4.
# Uso: python3 site/tools/capas.py PASTA_COM_AS_CAPAS site/imagens/revistas
# As capas do original têm proporções diferentes (A4, 3:4, capturas de tela): todas viram 3:4, cortando o excesso
# nas laterais (ou embaixo, nas A4), sem nunca ampliar. Gera 360 px (grade) e 720 px (tela retina e destaque).
import os, sys
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
QUALIDADE = 82
TETO_KB = 150  # orçamento do projeto por imagem: a qualidade desce até caber
# arquivo baixado do site original -> nome final (ordem da página original: 1.png é a primeira capa)
CAPAS = {
    '1.png': 'revista-16-junho-2026', '2.png': 'revista-15-maio-2026', '3.png': 'revista-14-dezembro-2025',
    '4.png': 'revista-13-2025', '5.jpg': 'revista-12-2025', '6.jpg': 'revista-11-2025', '7.png': 'revista-10-2024',
    '8.jpg': 'revista-09-2024', '9.jpg': 'revista-08-2024', '10.jpg': 'revista-07-dezembro-2023',
    '11.jpg': 'revista-04-2022', '12.jpg': 'cartilha-lgpd-cnc-2023', '13.jpg': 'revista-06-outubro-2023',
    '14.jpg': 'revista-05-agosto-2023', '15.png': 'brasesul-2018',
}

os.makedirs(OUT, exist_ok=True)
for arquivo, nome in CAPAS.items():
    im = Image.open(os.path.join(SRC, arquivo)).convert('RGB')
    w, h = im.size
    if w / h > 3 / 4:   # mais larga: corta as laterais por igual
        nw = round(h * 3 / 4); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:               # mais alta (A4): corta embaixo, onde ficam as chamadas menores
        im = im.crop((0, 0, w, round(w * 4 / 3)))
    for largura in (360, 720):
        lw = min(largura, im.width)
        out = os.path.join(OUT, f'{nome}-{largura}.webp')
        r = im.resize((lw, round(lw * 4 / 3)), Image.LANCZOS)
        q = QUALIDADE
        while True:
            r.save(out, 'WEBP', quality=q, method=6)
            if os.path.getsize(out) <= TETO_KB * 1024 or q <= 60:
                break
            q -= 4
        print(f'{os.path.basename(out)}: {lw}x{round(lw * 4 / 3)}, {os.path.getsize(out) / 1024:.1f} KB')
