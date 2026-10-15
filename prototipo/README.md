# Sincor SC: protótipo da Home

Protótipo navegável da nova Home do **Sincor SC**, para aprovação do cliente. Há **duas propostas de layout** com o
mesmo texto (o do site atual do Sincor SC), a mesma paleta e as mesmas abas, para o cliente comparar:

| Versão | Arquivo para testar | Linguagem |
|---|---|---|
| **Clássica** | `dist/sincor-sc-home.html` | Clara, institucional, inspirada no Sincor SP. Destaques em carrossel, ticker com Ibovespa, moedas, Selic, CDI e IPCA |
| **Telão** | `dist/sincor-sc-home-telao.html` | Escura (preto + azul-marinho + dourado + branco). Parede curva de telas com maquetes 3D, canhões de luz, barra superior só com Dólar e Selic |

## Como testar no seu PC

1. Baixe o arquivo da versão desejada, na pasta **`dist/`**.
2. Dê dois cliques. Abre no Chrome, Edge, Firefox ou Safari, sem instalar nada.
3. Com internet, as cotações carregam dados reais. Sem internet, a página funciona normalmente e o espaço das cotações
   mostra "Cotações indisponíveis no momento" (Clássica) ou um traço (Telão).

> Abra sempre o arquivo de `dist/`. O `index.html` das pastas `src/` e `src-telao/` aberto por duplo clique fica sem a
> fonte, porque o navegador bloqueia fontes externas em arquivos locais (CORS). Os arquivos de `dist/` já levam fonte e
> imagens embutidas.

### O que dá para testar (nas duas versões)

- **Menu completo com todas as abas.** No desktop os menus abrem ao passar o mouse; no celular, pelo botão de menu.
- **Destaques** (3 banners): a barra dourada mostra o tempo de cada um; pausa com o mouse em cima; setas, botões e arrastar com o dedo.
- **Tamanho do texto** (A−, A, A+) na barra superior e no menu do celular.
- **Área do Associado** (tela de login, protótipo) e **busca** (clique na lupa ou aperte `/`).
- **"Adicionar à agenda"** no jantar de 65 anos: baixa um `.ics` de verdade. **Contagem regressiva** para o evento.
- **Filtro de notícias** por categoria.
- **Links para páginas internas**: mostram o aviso "disponível na próxima etapa" em vez de abrir uma página quebrada.

Só na versão Telão:

- **Telão**: as colunas de telas correm em sentidos alternados, como um painel de LED curvo. O telão "liga" logo depois
  que o título aparece (o título nunca espera pelas imagens).
- **Benefícios**: ao passar o mouse (ou o foco do teclado) por um benefício, a tela ao lado troca a maquete.
- **Sincor SC TV** em um monitor curvo.

Com "reduzir movimento" ativado no sistema, o telão, os canhões de luz e a troca automática dos destaques ficam parados.

## Versão Telão: decisões de design

- **Paleta**: o azul-marinho (`#13264a`) e o dourado (`#c6a15b`) da marca, sobre um preto azulado (`#05070b`, nunca
  `#000`). O verde aparece só nos indicadores de mercado, como pedido.
- **Assinatura**: a parede de telas curva. É geometria 3D de verdade (CSS `perspective` + colunas girando em torno do
  espectador), por isso as colunas laterais ficam maiores e as bordas formam o arco de um monitor curvo. Cada tela é uma
  miniatura com título, como uma vitrine de conteúdo, e todos os títulos vêm de seções, produtos e eventos do próprio site.
- **Canhões de luz**: dois fachos varrem a parede devagar e um terceiro, fixo, ilumina o título.
- **Imagens**: 19 maquetes 3D feitas para o projeto, todas de imobiliária e escritório (torres, casas, enxaimel de
  Blumenau, condomínio, plantas, salas de reunião, auditório do jantar de 65 anos). Mesma direção de arte em todas:
  maquete branca, detalhes dourados, base laqueada, noite. Código das cenas em `tools/3d/`.
- **Contido no resto**: seções com o mesmo texto da versão Clássica, sem efeitos competindo com o telão.

## Indicadores de mercado

### Versão Telão: Dólar e Selic

| Indicador | Fonte | Observação |
|---|---|---|
| Dólar comercial | [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas) (`USD-BRL`) | Grátis, sem chave; atualiza a cada minuto. Valor em verde; a variação do dia fica verde na alta e vermelha na queda |
| Selic (meta Copom) | [Banco Central, SGS 432](https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom); reserva: [BrasilAPI](https://brasilapi.com.br/docs#tag/TAXAS) | Se o Banco Central bloquear a chamada direta do navegador (CORS), a página tenta a BrasilAPI |

### Versão Clássica: ticker completo

| Indicador | Fonte | Observação |
|---|---|---|
| Dólar, euro, libra, peso argentino, bitcoin | [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas) | Grátis, sem chave, cache de 1 min, teto de 100 mil requisições/mês |
| Selic (meta), CDI, IPCA 12 meses | [Banco Central, SGS](https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom) (séries 432, 4389 e 13522) | Oficial e grátis; muda no máximo 1x por dia |
| Ibovespa | [brapi](https://brapi.dev/docs) (`^BVSP`) | **Exige token** (há plano grátis); a brapi pede que o token fique no servidor |

**No protótipo** o navegador chama essas APIs direto. Nada é inventado: sem dado real, o item não aparece (ou mostra o
traço). O último dado bom fica em cache local e aparece marcado como "Último dado às…". Na Clássica, o **Ibovespa
provavelmente não aparece**, porque a brapi exige token.

**Em produção** (recomendado, nas duas versões): um processo no servidor busca tudo a cada minuto e publica um JSON
próprio. O site lê só esse arquivo: basta preencher `data-feed` (no `<aside class="ticker">` da Clássica ou no
`<aside class="quotes">` do Telão). Assim o token fica protegido, o limite das APIs não estoura com o número de
visitantes e uma API fora do ar não derruba o indicador. Pode ser feito com **n8n** (Schedule → HTTP Request → Code →
gravar o JSON no Storage/CDN) ou com uma Edge Function do Supabase.

Contrato do JSON (`change` em % do dia; omitir quando não houver variação, como na Selic):

```json
{
  "updatedAt": "2026-10-14T17:32:00-03:00",
  "items": [
    { "id": "IBOV", "value": 145320.55, "change": -0.84 },
    { "id": "USD", "value": 5.4262, "change": 0.36 },
    { "id": "SELIC", "value": 14.25 }
  ]
}
```

IDs aceitos: `IBOV`, `USD`, `EUR`, `GBP`, `ARS`, `BTC`, `SELIC`, `CDI`, `IPCA` (a versão Telão usa só `USD` e `SELIC`).

> Cotação da B3 **em tempo real** é dado licenciado e pago. Fontes gratuitas trazem dados com atraso (15 a 30 min). Por isso
> o rodapé informa "com atraso, apenas informativos", como fazem os grandes portais.

## Qualidade medida

| Medição | Clássica | Telão |
|---|---|---|
| Lighthouse celular (Desempenho / Acessibilidade / Boas práticas / SEO)* | 100 / 100 / 100 / 100 | 99 / 100 / 100 / 100 |
| Lighthouse desktop* | 100 / 100 / 100 / 100 | 99 / 100 / 100 / 100 |
| LCP celular / TBT / CLS (4G simulado, mediana de 3 rodadas) | 1,5 s / 20–40 ms / 0 | 1,8 s / 70–100 ms / 0,002 |
| Peso transferido no celular | 91 KB | 294 KB (inclui as maquetes 3D visíveis) |
| axe-core (WCAG 2.2 AA) | 0 violações | 0 violações |
| Arquivo único de `dist/` | 227 KB | 595 KB (imagens embutidas) |

\*Medido no modo produção (arquivos separados, com compressão, cotações lendo o JSON próprio, sem o `noindex` do protótipo).

Também foram testados nas duas: larguras de 360 a 1920 px sem rolagem horizontal, navegação por teclado (menus, busca,
login, destaques), foco visível, `prefers-reduced-motion` e os cenários das cotações (tudo no ar, fonte principal fora,
tudo fora do ar).

No Telão, o desempenho vem de três escolhas: o título é o maior elemento da primeira dobra (texto, não imagem); as imagens
do telão só são pedidas depois que ele aparece; e as seções abaixo da dobra usam `content-visibility`, então o navegador
só calcula o que está perto da tela.

## Estrutura

```
prototipo/
├── dist/
│   ├── sincor-sc-home.html         ← versão Clássica, arquivo único (gerado)
│   └── sincor-sc-home-telao.html   ← versão Telão, arquivo único (gerado)
├── src/                            ← código da Clássica
├── src-telao/                      ← código do Telão
│   ├── index.html
│   └── assets/{css,js,fonts,img/3d}
├── tools/
│   ├── generate.mjs                ← gera os SVGs embutidos nas duas versões (ícones, selo, ponte, mapa, QR, parede de telas)
│   └── 3d/                         ← cenas 3D das maquetes (Three.js) e exportação para WebP
└── build.mjs                       ← gera os arquivos únicos de dist/ (CSS, JS, fonte e imagens embutidos, CSP por hash)
```

Para editar: altere `src/` ou `src-telao/` e rode `node build.mjs` (Node 18+; gera as duas) ou `node build.mjs telao`.
Se mexer em ícones, ilustrações ou nos títulos das telas do telão (lista `SCREENS` em `tools/generate.mjs`):
`cd tools && npm install && npm run generate`. Para gerar novas maquetes: ver `tools/3d/README.md`.

Stack: HTML5, CSS e JavaScript puros, sem frameworks. Fonte Schibsted Grotesk (self-hosted, OFL). As seções viram
componentes Astro sem retrabalho quando o sistema (login, votação, CMS) entrar.

## Conteúdo: real × provisório

**Real (do site atual do Sincor SC):** telefone, e-mail e endereço em Blumenau; nome jurídico; evento *Melhores do Ano 2026 /
Jantar de 65 anos* (05/11/26, 19:30, Teatro Carlos Gomes, traje esporte fino); "Não deixe para depois, seja um associado
Sincor SC"; os 6 benefícios com seus textos (com a concordância corrigida para "têm"); Diretoria, Estatuto, Cursos,
Contribuição e Convenções Coletivas; os links do rodapé.

**Provisório (substituir antes de publicar):**

- [ ] **Paleta**: HEX estimados a partir do print (`#13264a` marinho, `#c6a15b` dourado). Confirmar no manual da marca. Ficam em `:root`, no início do CSS.
- [ ] **Logo**: composição tipográfica provisória. Trocar pelo SVG oficial.
- [ ] **Fotos**: na Clássica é o que mais falta para o site parecer 100% real (ver lista abaixo). No Telão as maquetes 3D
      cumprem esse papel, mas são **ilustrativas**: não representam a sede nem imóveis reais.
- [ ] **Eventos** além do jantar (curso, palestra, encontro), **notícias**, **vídeos** e **capa da revista**: exemplos.
- [ ] **Carteira digital** no celular: mockup da funcionalidade futura.
- [ ] **Redes sociais**: links `#`. Faltam as URLs oficiais.
- [ ] **Ibovespa no ticker** (Clássica): depende do token da brapi no servidor (ver acima).

### Fotos que mais valorizam a página

1. Jantar ou premiação de anos anteriores (destaques, notícias e TV).
2. Diretoria reunida, em ambiente profissional.
3. Fachada ou recepção da sede em Blumenau ("Visite o Sincor SC").
4. Corretores em eventos e cursos (agenda e notícias).
5. Capas reais da revista, se existirem.

Ideal: fotos horizontais com pelo menos 1600 px de largura. Eu converto para AVIF/WebP e gero os tamanhos certos.

A ilustração do slide 3 da Clássica é original, inspirada na Ponte Hercílio Luz. O mapa de SC usa a base
[svg-maps](https://github.com/VictorCazanave/svg-maps) (CC BY 4.0), com crédito exibido na página.

## Antes de publicar (checklist técnico)

- [ ] Remover `<meta name="robots" content="noindex, nofollow">`; ele existe para o protótipo não ser indexado.
- [ ] Publicar o JSON de cotações no servidor e preencher `data-feed` (token da brapi fica só no servidor).
- [ ] Gerar `og-image.png` (1200×630) para o link aparecer bonito no WhatsApp.
- [ ] Redirecionamentos 301 das URLs antigas para as novas, para não perder posições no Google.
- [ ] GA4 com Consent Mode, disparando só após o aceite de cookies (o banner já existe).
- [ ] Enviar a CSP por cabeçalho HTTP no servidor, incluindo em `connect-src` só o domínio do JSON de cotações.
- [ ] Servir imagens com cache longo e compressão (Brotli/gzip) para HTML, CSS e JS.
