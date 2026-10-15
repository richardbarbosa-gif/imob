# Maquetes 3D (versão Telão)

As imagens da parede de telas, dos destaques, da agenda, dos benefícios, das notícias, da TV e da revista
são **maquetes 3D criadas para o projeto** (nada de banco de imagens): cenas em Three.js, com luz de
canhão, oclusão de ambiente, profundidade de campo e granulação fotográfica.

| Arquivo | Função |
|---|---|
| `kit.js` | Câmera, pós-processamento, materiais (branco maquete, dourado, base laqueada) e peças (torre de vidro, árvore, telhado, canhão de luz) |
| `scenes.js` | As 19 cenas: `torre`, `escritorio`, `casa`, `enxaimel`, `condominio`, `skyline`, `chave`, `escudo`, `planta`, `planta_b`, `documento`, `reuniao`, `reuniao_b`, `monitor`, `trofeu`, `redoma`, `auditorio`, `auditorio_b`, `clinica` |
| `render.html` | Página que monta uma cena (`?scene=nome&scale=1`) |
| `shoot.cjs` | Fotografa as cenas em PNG 1440×900 |
| `export_webp.py` | Gera os WebP do site (640, 960 e 1280 px) |

## Como gerar de novo

```bash
cd prototipo/tools/3d && npm install && npx playwright install chromium
cd ../.. && npx http-server -p 8080 .          # servir a pasta prototipo/ (o render usa a fonte de src/)
# em outro terminal, dentro de prototipo/tools/3d:
mkdir -p png && SCALE=1 node shoot.cjs http://127.0.0.1:8080/tools/3d ./png torre auditorio clinica
python export_webp.py ./png                    # grava em src-telao/assets/img/3d
```

`SCALE=0.5` renderiza em metade da resolução, bom para testar enquadramento e luz rapidamente.
