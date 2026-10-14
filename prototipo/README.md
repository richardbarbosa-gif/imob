# Sincor SC: protótipo da Home

Protótipo navegável da nova Home do **Sincor SC**, para aprovação do cliente.
Estrutura inspirada no Sincor SP, com a identidade visual (azul-marinho e dourado) e os textos do site atual do Sincor SC.

## Como testar no seu PC

1. Baixe o arquivo **`dist/sincor-sc-home.html`**.
2. Dê dois cliques. Abre no Chrome, Edge, Firefox ou Safari, sem instalar nada.
3. Com internet, o **ticker de cotações** carrega dados reais. Sem internet, a página funciona normalmente e o ticker mostra "Cotações indisponíveis no momento".

> Abra sempre o arquivo de `dist/`. O `src/index.html` aberto por duplo clique fica sem a fonte, porque o navegador
> bloqueia fontes externas em arquivos locais (CORS). O arquivo de `dist/` já leva a fonte embutida.

### O que dá para testar

- **Ticker de mercado** no topo: Ibovespa, dólar, euro, libra, peso argentino, bitcoin, Selic, CDI e IPCA. Verde na alta,
  vermelho na queda, destaque quando um valor muda, atualização a cada minuto. Pausa com o mouse em cima ou pelo botão.
- **Tamanho do texto** (A−, A, A+) na barra superior e no menu do celular, padrão de portal institucional.
- **Menu completo com todas as abas.** No desktop os menus abrem ao passar o mouse; no celular, pelo botão de menu.
- **Destaques** (3 slides): a barra dourada mostra o tempo de cada slide; pausa com o mouse em cima; setas, segmentos e arrastar com o dedo.
- **Área do Associado** (tela de login, protótipo) e **busca** (clique na barra ou aperte `/`).
- **"Adicionar à agenda"** no jantar de 65 anos: baixa um `.ics` de verdade.
- **Filtro de notícias** por categoria e **contagem regressiva** para o evento.
- **Links para páginas internas**: mostram o aviso "disponível na próxima etapa" em vez de abrir uma página quebrada.

## Ticker de cotações: como funciona

| Indicador | Fonte | Observação |
|---|---|---|
| Dólar, euro, libra, peso argentino, bitcoin | [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas) | Grátis, sem chave, cache de 1 min, teto de 100 mil requisições/mês |
| Selic (meta), CDI, IPCA 12 meses | [Banco Central, SGS](https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom) (séries 432, 4389 e 13522) | Oficial e grátis; muda no máximo 1x por dia |
| Ibovespa | [brapi](https://brapi.dev/docs) (`^BVSP`) | **Exige token** (há plano grátis); a brapi pede que o token fique no servidor |

**No protótipo** o navegador chama essas APIs direto. Consequências conhecidas:

- O **Ibovespa provavelmente não aparece**, porque a brapi exige token. O código já trata o erro e só omite o item.
- Se o Banco Central bloquear chamadas diretas do navegador (CORS), Selic, CDI e IPCA também ficam de fora.
- Nada é inventado: sem dado real, o item não aparece. O último dado bom fica em cache local e aparece marcado como "Último dado às…".

**Em produção** (recomendado): um processo no servidor busca tudo a cada minuto e publica um JSON próprio. O site lê só esse
arquivo: basta preencher `data-feed` no `<aside class="ticker">`. Assim o token fica protegido, o limite das APIs não estoura
com o número de visitantes e uma API fora do ar não derruba o ticker. Pode ser feito com **n8n** (Schedule → HTTP Request →
Code → gravar o JSON no Storage/CDN) ou com uma Edge Function do Supabase.

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

IDs aceitos: `IBOV`, `USD`, `EUR`, `GBP`, `ARS`, `BTC`, `SELIC`, `CDI`, `IPCA`.

> Cotação da B3 **em tempo real** é dado licenciado e pago. Fontes gratuitas trazem dados com atraso (15 a 30 min). Por isso
> o rodapé informa "com atraso, apenas informativos", como fazem os grandes portais.

## Qualidade medida

| Medição | Celular | Desktop |
|---|---|---|
| Lighthouse (Performance / Acessibilidade / Boas práticas / SEO)* | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| LCP / TBT / CLS | 1,5 s / 20–40 ms / 0 (4G simulado, mediana de 3 rodadas) | 0,4 s / 0 ms / 0 |
| Peso total transferido | 91 KB | 91 KB |
| axe-core (WCAG 2.2 AA) | 0 violações | 0 violações |

\*Medido no modo produção (arquivos separados, ticker lendo JSON próprio, sem o `noindex` do protótipo).

Também foram testados: larguras de 360 a 1440 px sem rolagem horizontal, navegação por teclado, foco visível,
`prefers-reduced-motion` (sem rolagem automática), leitores de tela e os três cenários do ticker (tudo no ar, Ibovespa negado, tudo fora do ar).

## Estrutura

```
prototipo/
├── dist/sincor-sc-home.html   ← arquivo único para testar (gerado)
├── src/                        ← código-fonte
│   ├── index.html
│   └── assets/{css,js,fonts,img}
├── tools/generate.mjs          ← gera os SVGs embutidos (ícones, selo 65 anos, certificado, ponte, mapa, QR)
└── build.mjs                   ← gera o arquivo único de dist/ (CSS, JS e fonte embutidos, CSP por hash)
```

Para editar: altere `src/` e rode `node build.mjs` (Node 18+). Se mexer em ícones ou ilustrações:
`cd tools && npm install && npm run generate`.

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
- [ ] **Fotos**: é o que mais falta para o site parecer 100% real. Ver lista abaixo.
- [ ] **Eventos** além do jantar (curso, palestra, encontro), **notícias**, **vídeos** e **capa da revista**: exemplos.
- [ ] **Carteira digital** no celular: mockup da funcionalidade futura.
- [ ] **Redes sociais**: links `#`. Faltam as URLs oficiais.
- [ ] **Ibovespa no ticker**: depende do token da brapi no servidor (ver acima).

### Fotos que mais valorizam a página

1. Jantar ou premiação de anos anteriores (destaques, notícias e TV).
2. Diretoria reunida, em ambiente profissional.
3. Fachada ou recepção da sede em Blumenau ("Visite o Sincor SC").
4. Corretores em eventos e cursos (agenda e notícias).
5. Capas reais da revista, se existirem.

Ideal: fotos horizontais com pelo menos 1600 px de largura. Eu converto para AVIF/WebP e gero os tamanhos certos.

A ilustração do slide 3 é original, inspirada na Ponte Hercílio Luz. O mapa de SC usa a base
[svg-maps](https://github.com/VictorCazanave/svg-maps) (CC BY 4.0), com crédito exibido na página.

## Antes de publicar (checklist técnico)

- [ ] Remover `<meta name="robots" content="noindex, nofollow">`; ele existe para o protótipo não ser indexado.
- [ ] Publicar o JSON de cotações no servidor e preencher `data-feed` (token da brapi fica só no servidor).
- [ ] Gerar `og-image.png` (1200×630) para o link aparecer bonito no WhatsApp.
- [ ] Redirecionamentos 301 das URLs antigas para as novas, para não perder posições no Google.
- [ ] GA4 com Consent Mode, disparando só após o aceite de cookies (o banner já existe).
- [ ] Enviar a CSP por cabeçalho HTTP no servidor, incluindo em `connect-src` só o domínio do JSON de cotações.
