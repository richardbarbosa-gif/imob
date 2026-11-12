# Converte os banners e as imagens de eventos enviados pelo cliente para WebP, nos tamanhos que o site usa.
# Uso: python3 site/tools/imagens.py PASTA_COM_OS_ORIGINAIS site/imagens
# Banners: uma versão por largura (srcset) + uma miniatura desfocada para o fundo do banner de outra proporção.
import os, sys
from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
QUALIDADE = 86  # acima disso o arquivo cresce sem ganho visível no texto dos banners

# arquivo original -> (nome final, larguras geradas)
BANNERS = {
    '20.jpg': ('cartao_empresario', [640, 1280]),
    '21.jpg': ('corretor_associado', [800, 1280, 2000]),
    '22.jpg': ('melhores_do_ano', [800, 1280, 2000]),
    # Mesma arte do banner do site original (Banner_revistas_sincor_1920x600px-scaled.jpg, 2560x800), 16:5
    'revistas_digitais.jpg': ('revistas_digitais', [800, 1280, 2000]),
    # Arte da SUSEP enviada pelo cliente (1024x572, 16:9): aparece inteira na moldura 16:5, sobre o fundo desfocado
    'susep_registro.webp': ('susep_registro', [640, 1024]),
}
# Artes de outra proporção: ganham um fundo (a própria arte, ampliada e desfocada) para a moldura 16:5
COM_FUNDO = {'cartao_empresario', 'susep_registro'}
EVENTOS = {
    'Captura-de-tela-2026-04-17-154452.png': 'congresso-brasileiro-2026',
    'Captura-de-tela-2026-07-23-145251.png': 'encontro-da-mulher-2026',
    'Captura-de-tela-2026-07-23-150008.png': 'brasesul-2027',
}

def salvar(im, caminho):
    im.save(caminho, 'WEBP', quality=QUALIDADE, method=6)
    print(f'{os.path.relpath(caminho, OUT)}: {im.width}x{im.height}, {os.path.getsize(caminho) / 1024:.1f} KB')

for arquivo, (nome, larguras) in BANNERS.items():
    if not os.path.exists(os.path.join(SRC, arquivo)):
        print(f'(sem {arquivo} em {SRC}: mantido o que já está em {OUT})')
        continue
    im = Image.open(os.path.join(SRC, arquivo)).convert('RGB')
    for w in larguras:
        w = min(w, im.width)  # nunca amplia: só reduz
        salvar(im.resize((w, round(im.height * w / im.width)), Image.LANCZOS), os.path.join(OUT, f'{nome}-{w}.webp'))
    if nome in COM_FUNDO:
        # Fundo para a moldura 16:5: a própria arte, ampliada na altura e desfocada aqui (sem filtro no navegador,
        # que apaga as bordas e custa processamento no celular)
        fundo = im.resize((400, 125), Image.LANCZOS).filter(ImageFilter.GaussianBlur(14))
        salvar(fundo, os.path.join(OUT, f'{nome}-fundo.webp'))

def fundo_16x9(im, caminho):
    # Fundo desfocado para a moldura 16:9 dos cartões de evento (a arte aparece inteira por cima, sem corte)
    salvar(im.resize((320, 180), Image.LANCZOS).filter(ImageFilter.GaussianBlur(12)), caminho)

for arquivo, nome in EVENTOS.items():
    if not os.path.exists(os.path.join(SRC, 'eventos', arquivo)):
        continue
    im = Image.open(os.path.join(SRC, 'eventos', arquivo)).convert('RGB')
    salvar(im, os.path.join(OUT, 'eventos', f'{nome}.webp'))
    fundo_16x9(im, os.path.join(OUT, 'eventos', f'{nome}-fundo.webp'))

# O banner do Melhores do Ano também vira cartão na página de eventos
if os.path.exists(os.path.join(SRC, '22.jpg')):
    fundo_16x9(Image.open(os.path.join(SRC, '22.jpg')).convert('RGB'), os.path.join(OUT, 'eventos', 'melhores-do-ano-2026-fundo.webp'))
