# Sincor SC: protótipo da Home

Protótipo navegável da nova Home do **Sincor SC**, para aprovação do cliente.
Estrutura inspirada no Sincor SP, com a identidade visual (azul-marinho e dourado) e os textos do site atual do Sincor SC.

## Como testar no seu PC

1. Baixe o arquivo **`dist/sincor-sc-home.html`**.
2. Dê dois cliques. Abre no Chrome, Edge, Firefox ou Safari, **sem instalar nada e sem internet**.

> Abra sempre o arquivo de `dist/`. O `src/index.html` aberto por duplo clique fica sem a fonte, porque o navegador
> bloqueia fontes externas em arquivos locais (CORS). O arquivo de `dist/` já leva a fonte embutida.

### O que dá para testar

- **Menu completo com todas as abas.** No desktop os menus abrem ao passar o mouse; no celular, pelo botão de menu.
- **Carrossel de destaques** (3 slides): setas, bolinhas, arrastar com o dedo e pausar.
- **Área do Associado**: abre a tela de login (protótipo, não envia nada).
- **Busca**: clique na barra ou aperte `/` no teclado.
- **"Adicionar à agenda"** no jantar de 65 anos: baixa um `.ics` de verdade.
- **Filtro de notícias** por categoria.
- **Contagem regressiva** para o evento, calculada pela data real.
- **Links para páginas internas**: mostram o aviso "disponível na próxima etapa" em vez de abrir uma página quebrada.

## Qualidade medida

| Medição | Celular | Desktop |
|---|---|---|
| Lighthouse Performance | 100 | 100 |
| Lighthouse Acessibilidade | 100 | 100 |
| Lighthouse Boas práticas | 100 | 100 |
| Lighthouse SEO | 63 com o `noindex` do protótipo; 100 sem ele | |
| LCP / CLS / TBT | 1,4 s / 0 / 0 ms (4G simulado) | 0,3 s / 0 / 0 ms |
| Peso total da página | 69 KB | |
| axe-core (WCAG 2.2 AA) | 0 violações | 0 violações |

Larguras testadas: 360, 390, 768, 1024 e 1440 px, sem rolagem horizontal. Também foram testados navegação por teclado, foco visível,
`prefers-reduced-motion` e leitores de tela (rótulos e landmarks).

## Estrutura

```
prototipo/
├── dist/sincor-sc-home.html   ← arquivo único para testar (gerado)
├── src/                        ← código-fonte
│   ├── index.html
│   └── assets/{css,js,fonts,img}
├── tools/generate.mjs          ← gera os SVGs embutidos (ícones, selo 65 anos, ponte, mapa, QR)
└── build.mjs                   ← gera o arquivo único de dist/
```

Para editar: altere `src/` e rode `node build.mjs` (Node 18+). Se mexer em ícones ou ilustrações:
`cd tools && npm install && npm run generate`.

Stack: HTML5 + CSS + JavaScript puro, sem frameworks. As seções viram componentes Astro sem retrabalho quando o sistema
(login, votação, CMS) entrar na próxima fase.

## Conteúdo: real × provisório

**Real (do site atual do Sincor SC):** telefone, e-mail e endereço em Blumenau; nome jurídico; evento *Melhores do Ano 2026 /
Jantar de 65 anos* (05/11/26, 19:30, Teatro Carlos Gomes, traje esporte fino); "Não deixe para depois, seja um associado
Sincor SC"; os 6 benefícios com seus textos (com a concordância corrigida para "têm"); os cards Diretoria, Estatuto, Cursos
e Contribuição; os links do rodapé.

**Provisório (substituir antes de publicar):**

- [ ] **Paleta**: HEX estimados a partir do print (`#13264a` marinho, `#c6a15b` dourado). Confirmar no manual da marca. Ficam em `:root`, no início do CSS.
- [ ] **Logo**: composição tipográfica provisória. Trocar pelo SVG oficial.
- [ ] **Eventos** além do jantar (curso, palestra, encontro): exemplos.
- [ ] **Notícias** (3): exemplos baseados em conteúdos reais do SC.
- [ ] **Vídeos** da Sincor SC TV e **capa da revista**: ilustrativos.
- [ ] **Carteira digital** no celular: mockup da funcionalidade futura.
- [ ] **Redes sociais**: links `#`. Faltam as URLs oficiais.
- [ ] **Imagens**: as miniaturas são ilustrações em CSS e viram fotos (AVIF/WebP) quando chegarem.

A ilustração do slide 3 é original, inspirada na Ponte Hercílio Luz. O mapa de SC usa a base
[svg-maps](https://github.com/VictorCazanave/svg-maps) (CC BY 4.0), com crédito exibido na página.

## Antes de publicar (checklist técnico)

- [ ] Remover `<meta name="robots" content="noindex, nofollow">`; ele existe para o protótipo não ser indexado.
- [ ] Gerar `og-image.png` (1200×630) para o link aparecer bonito no WhatsApp.
- [ ] Redirecionamentos 301 das URLs antigas para as novas, para não perder posições no Google.
- [ ] GA4 com Consent Mode, disparando só após o aceite de cookies (o banner já existe).
- [ ] Enviar a CSP por cabeçalho HTTP no servidor (o arquivo de `dist/` já usa CSP por hash).
