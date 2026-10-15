"""Converte os PNG renderizados (1440x900) nos WebP usados pela versão "Telão".
Uso: python export_webp.py <pasta-dos-png> [pasta-de-saída]   (requer Pillow: pip install pillow)
"""
import os
import sys
from PIL import Image

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', '..', 'src-telao', 'assets', 'img', '3d')

# Miniaturas (telão, notícias, TV, revista)
THUMBS = ('torre escritorio casa enxaimel condominio skyline chave escudo planta planta_b documento '
          'reuniao reuniao_b monitor trofeu redoma auditorio auditorio_b clinica').split()
MEDIUM = 'escudo clinica redoma escritorio documento reuniao_b'.split()   # tela dos benefícios
LARGE = 'auditorio documento chave trofeu auditorio_b'.split()           # destaques, agenda e TV

def save(name, width, quality):
    height = round(width / 1.6)
    image = Image.open(os.path.join(SRC, f'{name}.png')).convert('RGB').resize((width, height), Image.LANCZOS)
    path = os.path.join(OUT, f'{name.replace("_", "-")}-{width}.webp')
    image.save(path, 'WEBP', quality=quality, method=6)
    return os.path.getsize(path)

total = sum(save(n, 640, 72) for n in THUMBS) + sum(save(n, 960, 70) for n in MEDIUM) + sum(save(n, 1280, 68) for n in LARGE)
print(f'{len(THUMBS) + len(MEDIUM) + len(LARGE)} arquivos, {total // 1024} KB')
