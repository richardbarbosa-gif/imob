# Converte as fotos do evento (originais da câmera, ~7 MB cada) para WebP nos tamanhos que o site usa.
# Uso: python3 site/tools/fotos.py PASTA_COM_OS_ORIGINAIS site/imagens/fotos
# Os originais vêm da pasta pública do Melhores do Ano 2026 no Google Drive:
#   jantar1.jpg = "SINCOR - melhores do ano 2026 (1).jpg", jantar2 = (3), jantar3 = (19), jantar4 = (22)
# Gera 960 px (celular e tela comum) e 1440 px (tela retina: o cartão tem no máximo ~830 px de largura). Os dados EXIF (câmera, data) não são copiados.
import os, sys
from PIL import Image, ImageOps

SRC, OUT = sys.argv[1], sys.argv[2]
QUALIDADE = 78  # foto de fundo sob camada azul: acima disso o arquivo cresce sem diferença visível
TETO_KB = 150   # orçamento do projeto por imagem: a qualidade desce até caber (foto com muito detalhe, como o painel de logos)
FOTOS = {f'jantar{n}.jpg': f'melhores-do-ano-2026-{n}' for n in range(1, 5)}
LARGURAS = [960, 1440]

os.makedirs(OUT, exist_ok=True)
for arquivo, nome in FOTOS.items():
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, arquivo))).convert('RGB')
    for w in LARGURAS:
        w = min(w, im.width)
        out = os.path.join(OUT, f'{nome}-{w}.webp')
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        q = QUALIDADE
        while True:
            r.save(out, 'WEBP', quality=q, method=6)
            if os.path.getsize(out) <= TETO_KB * 1024 or q <= 60:
                break
            q -= 3
        print(f'{os.path.basename(out)}: {r.width}x{r.height}, qualidade {q}, {os.path.getsize(out) / 1024:.1f} KB')
