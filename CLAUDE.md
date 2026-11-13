# CLAUDE.md: Projeto Sincor SC

Guia para qualquer sessão do Claude (Claude Code no terminal, VS Code, web). Leia **inteiro** antes de mexer em qualquer
arquivo. Ele resume o escopo, o que já foi feito, as decisões tomadas e as regras de qualidade do projeto.

---

## 0. Antes de começar (obrigatório, nesta ordem)

1. **Leia este arquivo inteiro**, depois `docs/BRIEFING.md` (requisitos vivos) e `prototipo/README.md` (como testar,
   medições, conteúdo real × provisório). Não comece a codar sem ter lido os três.
2. **Carregue as skills do Richard antes de propor ou escrever qualquer coisa** (ferramenta Skill):
   - `anthropic-skills:partner-senior` (sempre primeiro: postura e roteamento entre as demais);
   - `anthropic-skills:frontend-senior` (qualquer interface: página, seção, componente, redesign);
   - `anthropic-skills:performance-senior` (tudo que roda no navegador);
   - `anthropic-skills:seo-senior` (páginas públicas);
   - `anthropic-skills:code-security-senior` (todo código: CSP, formulários, login, APIs);
   - `anthropic-skills:copywriting` (só quando for escrever ou reescrever texto; ver regra de conteúdo na seção 6.6).
   Leia também as referências que cada skill indica para o caso (ex.: `references/nao-parecer-ia.md` do frontend-senior).
3. **Planeje antes de fazer.** Leia o código existente da área que vai mudar, diga em poucas linhas o que vai fazer e por
   quê, antecipe riscos (desempenho, acessibilidade, SEO, quebra da outra versão). "Fazer por fazer" é o que este cliente
   mais rejeita.
4. **Veja o resultado.** Toda mudança visual é conferida com captura de tela (Playwright, Chromium já instalado) em pelo
   menos 390 px e 1440 px antes de ser entregue. Nunca entregue layout que você não viu renderizado.

O usuário (Richard) vende e executa soluções digitais completas, é extremamente detalhista e quer um parceiro sênior:
zero complacência, apontar caminho melhor quando existir, antecipar falhas, ser direto. Responda em **português**.

---

## 1. Cliente e contexto

- **Cliente:** Sincor SC, Sindicato dos Corretores de Seguros e de Resseguros e das Empresas Corretoras de Seguros e de
  Resseguros no Estado de Santa Catarina. 65 anos em 2026.
- **Sede:** R. Dr. Luiz de Freitas Melro, 395, salas 902 a 904, Centro, Blumenau/SC, 89010-921.
  (47) 3326-8894 · administrativo@sincor-sc.com.br.
- **Site atual:** https://sincor-sc.com.br/ (amador, pesado, banner com texto embutido em imagem, contraste ruim).
- **Referência de estrutura:** Sincor SP, https://sincor.org.br/. A meta é **superar o Sincor SP** em estética, UX,
  desempenho e SEO.
- **Inspiração visual da versão Telão:** onovomercado (parede curva de miniaturas). Inspiração, nunca cópia.
- **Marca:** azul-marinho `#13264a` e dourado `#c6a15b` (HEX estimados de print; confirmar no manual da marca). Logo
  atual do protótipo é composição tipográfica provisória.

## 2. Escopo completo do projeto

### Páginas (11)
1. Home (destaques, notícias, eventos, CTAs)
2. Sobre Nós
3. Seja Corretor Associado (benefícios PF × PJ + formulário de adesão)
4. Diretoria e Delegados (mapa interativo por região de SC)
5. Comissões (filtro por especialidade)
6. Calendário de Eventos (inscrição integrada)
7. Notícias do Mercado (blog dinâmico)
8. Seguradoras Parceiras
9. Certificado Digital
10. Seguro de Vida
11. Revistas (acervo com download)

### Funcionalidades
- **Área do associado:** login próprio, cadastro único, painel do associado, conteúdo privado (circulares, documentos).
- **Votação Melhores do Ano:** login + código único por associado, 1 voto por categoria garantido no banco, auditoria.
- **Eventos:** inscrição com confirmação por e-mail.
- **Carteira digital:** PWA com QR Code assinado e página pública de validação (impede falsificação por print).
- **CMS/Admin:** notícias sem desenvolvedor, categorias, busca, eventos, revistas, associados; Home alimentada sozinha.
- **Obrigatórios:** responsivo, SEO on-page (meta, URLs amigáveis, schema), GA4 com eventos de conversão só após
  consentimento LGPD, redirecionamentos 301 das URLs antigas.

### Arquitetura proposta para o sistema (depende de conversa com o cliente)
| Tema | Proposta |
|---|---|
| Front-end | Astro (HTML estático por padrão; ilhas interativas só onde precisa). O protótipo migra seção por seção. |
| Back-end | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Hospedagem | Vercel ou Cloudflare Pages com o domínio do cliente |
| Cotações | Processo no servidor (n8n ou Edge Function) publica um JSON próprio a cada minuto; o site lê só esse JSON (`data-feed`) |

## 3. O que já foi feito (estado atual)

> **Atualização de 21/10/2026: o cliente escolheu outro código.** A Home oficial passa a ser `site/index.html`
> (HTML + Tailwind, layout "portal" no estilo Sincor SP, enviado pelo Richard). **Todo trabalho novo é nele.**
> As versões Clássica e Telão abaixo ficam como histórico e como fonte de material (as maquetes 3D em
> `prototipo/src-telao/assets/img/3d/` e as ilustrações SVG podem substituir as imagens de banco do novo código).
> O `site/index.html` foi versionado exatamente como recebido; as regras deste arquivo valem para ele daqui em diante.
>
> Alterações já feitas no `site/index.html` (21/10): barra de cotações no topo, que corre em loop (Ibovespa, Dólar, Euro,
> Libra, Bitcoin, Selic, CDI, IPCA; sobe = verde ▲, cai = vermelho ▼; código portado da Clássica). O Ibovespa só aparece
> com `data-brapi-token` preenchido; em produção, `data-feed` com o JSON próprio. Selic do rodapé lê o mesmo dado.
> Convenções Coletivas e Ouvidoria em dourado com brilho no hover. Menu no padrão Sobre Nós, Associe-se, Benefícios,
> Eventos, Notícias, Revistas, Sincor SC TV, Contato, com painéis (hover, clique, teclado) e sanfona no celular. Favicon.
> Corrigido também o cabeçalho, que no celular empurrava o botão do menu para fora da tela.
> Faixa de empresas parceiras logo abaixo do menu (substituiu o banner "AD"): carrossel contínuo com Porto, Grupo HDI,
> Bradesco Seguros, Tokio Marine, Maxpar, ENS e Allianz, marcas autorizadas pelas empresas. **Logos só oficiais**, enviados
> pelo cliente ou pelas empresas: nunca redesenhar marca. Enquanto não chegam, o cartão mostra o nome em texto neutro;
> Logos tratados por `site/tools/logos.py` (fundo transparente, recorte, mesma área visual, WebP sem perda em 2x; o
> script imprime o width/height para o `<img>`). As 7 marcas estão com logo oficial: Porto, HDI Seguros, Bradesco
> Seguros, Tokio Marine Seguradora, Maxpar Assistências, ENS (sem o slogan) e Allianz.
> Selo de 65 anos ao lado do logo (SVG inline, sem imagem): medalha com borda serrilhada dourada, "65" em Cinzel,
> "ANOS" e fita com "1961 – 2026"; 66 px de altura com margem negativa, para não aumentar o cabeçalho.
>
> **Associe-se (23/10):** todos os botões "Associe-se" da Home levam a `site/seja-associado.html` (escolha PF/PJ), que leva às
> fichas `seja-associado-pessoa-fisica.html` e `seja-associado-pessoa-juridica.html` (mesmos campos do site oficial,
> organizados em 6 blocos). O envio vai para `site/enviar-adesao.php` (PHP da Hostinger): valida tudo de novo (CPF/CNPJ
> com dígito, datas, tipo real do anexo), barra robôs (campo-isca, tempo mínimo, 5 envios/h por IP), não grava dados e
> manda o e-mail com anexo para administrativo@sincor-sc.com.br via `mail()`. CEP preenche o endereço (ViaCEP).
> **Estrutura do site:** CSS/JS compartilhados em `site/assets/css/site.css`, `site/assets/js/site.js` (menus, cotações,
> parceiros, modais) e `tailwind-config.js`; só da Home em `home.js`; das fichas em `adesao.css`/`adesao.js`.
> Cabeçalho e rodapé: a Home é a fonte (entre `<!-- layout:topo -->` e `<!-- layout:rodape -->`); depois de mexer neles,
> rode `node site/tools/sync-layout.mjs` para copiar às outras páginas (os links `#secao` viram `index.html#secao`).
> As páginas internas não têm a barra de cotações nem a faixa de parceiros (foco no formulário).
>
> **Banners, selo, cartão, eventos e política (11/11):** seção "Destaques" na Home (logo abaixo dos parceiros) com os
> 3 banners do cliente em carrossel (moldura 16:5; arte de outro formato aparece inteira sobre a própria arte desfocada;
> legenda em HTML com o texto da arte; barra de progresso = relógio da troca, pausa no hover/foco/botão/fora da tela).
> Imagens em `site/imagens/` (WebP em várias larguras, geradas por `site/tools/imagens.py`). Destinos: Cartão do
> Empresário → `cartao-do-empresario.html` (passo a passo do informativo do Sincor + pedido com usuários, fotos e
> documentos); Selo → `selo-corretor-associado.html` (campos e termo da página original); Melhores do Ano → pasta de
> fotos no Google Drive. `eventos.html`: eventos do site original (links externos mantidos) + Melhores do Ano 2026,
> separados em próximos e realizados (o script reclassifica pela data). `politica-de-privacidade.html`: texto do site
> oficial (só a grafia corrigida). Redes sociais com as URLs oficiais. Formulários: `assets/js/formulario.js` (comum),
> envio por `enviar-adesao.php` e `enviar-solicitacao.php` sobre a biblioteca `inc/formularios.php` (bloqueada ao acesso
> direto). Pendente: contraste e alvos de toque de trechos originais da Home (24 itens no axe, anteriores a esta etapa).

> **Cache e "O que temos de novo" (12/11):** a hospedagem guarda CSS/JS por 7 dias; todo `assets/css|js` entra com
> `?v=<hash>` (`node site/tools/versionar.mjs`, **rodar antes de cada publicação**), senão quem já visitou vê o HTML novo
> com CSS velho e a página quebra. O carrossel "O que temos de novo" foi refeito: troca **manual** (setas, abas, deslizar;
> o de campanhas acima já é automático), slide 1 = Melhores do Ano 2026 com 4 fotos reais do Drive passando no fundo
> (pausa, só na tela, `site/tools/fotos.py`, WebP ≤ 150 KB, sem EXIF), slide 2 = Brasesul 2027, slide 3 = Cartão do
> Empresário. Saíram as fotos de banco, o "Inscreva-se"/"Votar" do jantar e os eventos fictícios da seção de eventos
> (agora com os dados reais de `eventos.html`). **Ao passar a data de um evento, atualize a Home junto com eventos.html.**

> **Revistas (12/11):** 4º banner de campanha ("Leia a versão on-line das revistas", mesma arte do site original) leva a
> `site/revistas.html`: destaque da edição mais recente + edições anteriores + especiais, cada capa abre a revista no
> leitor FlipHTML5 (links da página Publicações do original, em nova aba). **Fonte única: `site/tools/revistas.json`.**
> Nova edição = capa em `tools/capas.py` (3:4, WebP ≤ 150 KB) + uma linha no JSON + `node site/tools/revistas.mjs`
> (reescreve entre `<!-- revistas:x -->` a página e a vitrine `#revistas` da Home) + `node site/tools/versionar.mjs`.
> Menu "Revistas" (desktop e celular, todas as páginas) aponta para `revistas.html`; saiu o botão falso "Baixar PDF".
> A confirmar com o cliente: no original, a capa do Brasesul 2018 aponta para `AF_Revista_Sincor_05_baixa` (mantido).

> **SUSEP e barra de cotações (12/11):** 5º banner de campanha com a arte da SUSEP enviada pelo cliente (1024x572, aparece
> inteira na moldura 16:5) e atalho "Consulta SUSEP" no painel "Acesso rápido do corretor", ambos para
> https://www2.susep.gov.br/safe/Corretores/pesquisa (nova aba). Barra de cotações: a AwesomeAPI gratuita passou a ter
> cota por conexão (responde 429 "QuotaExceeded"); sem moedas sobravam 2 itens que cabiam na tela e a barra ficava parada.
> Agora a barra **sempre rola** (repete a lista até passar da largura), moedas a cada 3 min com reserva no Frankfurter
> (referência do BCE; 30 min sem chamar a AwesomeAPI após um 429; Bitcoin só pela AwesomeAPI) e CDI/IPCA com reserva na
> BrasilAPI. Em produção, o ideal continua sendo o JSON próprio (`data-feed`) publicado pelo servidor.

> **Institucional, SUSEP e limpeza (13/11):**
> - **Páginas novas com o texto do site original** (só o visual é nosso; ortografia corrigida a pedido do cliente, sem mudar o sentido):
>   `quem-somos.html` (história, missão e visão, princípios), `diretoria.html` (Diretoria Executiva, suplentes,
>   Conselho Fiscal e suplentes, delegados e suplentes junto à Fenacor, Assessoria Jurídica, Diretores Regionais) e
>   `convencoes-coletivas.html` (2017 a 2026, piso regional, observação da carta de oposição de Florianópolis).
>   Cada uma termina em "Veja também" (Estatuto, Regimento interno e as outras páginas).
> - **Dados em JSON, gerados por `node site/tools/institucional.mjs`:** `tools/diretoria.json` (27 entradas, fotos em
>   `imagens/diretoria/<nome>.webp`, 320 px) e `tools/convencoes.json` (35 PDFs + 10 itens só de texto, como
>   "Aguardando Assinatura"). O mesmo JSON alimenta o bloco "Diretoria Executiva" da Home (`<!-- inst:home-diretoria -->`),
>   que substituiu a seção de "delegacias regionais" do código recebido, que era **inventada**.
> - **Documentos oficiais hospedados no nosso site** (`site/documentos/`, 37 PDFs, 66 MB, cópias exatas conferidas por
>   hash, nomes originais): convenções em `documentos/convencoes/<ano>/`, `ESTATUTO-SOCIAL-AGE_20190819_Sincor_SC.pdf`
>   e `Regimento_Interno-Sincor_SC.pdf`. Motivo: na troca de domínio os links do WordPress antigo deixam de existir.
>   **Nunca editar nem recomprimir esses PDFs.** Nova convenção: PDF na pasta do ano + linha no JSON + gerador.
> - Menu "Sobre Nós", rodapé, barra superior ("Convenções Coletivas"), cartões da Home e atalho "Circulares & CCT"
>   apontam para as páginas novas; "Estatuto Social" abre o PDF em nova aba.
> - **Diretores Regionais:** o original mostra só as 9 regiões, sem nomes. Mostramos só as regiões até o cliente enviar.
> - **Banner SUSEP refeito em HTML** (texto real, "CLIQUE AQUI E CONSULTE" no padrão das artes do cliente) com a **marca
>   oficial vigente da SUSEP** (nova marca apresentada pela autarquia em dez/2025, recortada da imagem oficial do gov.br,
>   `imagens/marcas/susep-*.webp`, sem alteração, sobre o fundo claro original #f7f7f7). A arte com cara de IA saiu.
> - **Sem setas nos botões** (pedido do cliente: "cara de IA"): removidas de todos os botões/CTAs, do rodapé (›) e dos
>   geradores. Ficam só as setas de navegação de carrossel e o ▾ dos menus.
> - Pendências de conteúdo: "Comissões Técnicas" da Home (Automóvel, Vida, Ramos) veio no código recebido e **não existe
>   no site original**; ainda não confirmado com o cliente. Os cartões "Acesso Rápido" da Home ainda usam fotos de banco.

> **Revisão de português (13/11):** Quem somos (meses em minúscula, vírgulas, "todo o Estado", "assembleia", "à classe",
> "defensora do lema", "clientes"), Diretoria (Camboriú, Jaraguá do Sul, Vale do Itajaí, "junto à Fenacor"), Convenções
> ("Resumo da Convenção", "aguardando assinatura", "Sindicato dos Securitários", "Sr.", vírgulas na observação), termo do
> Selo ("de forma indevida, que possa acarretar", também no e-mail do `enviar-solicitacao.php`) e Eventos ("corretores de
> seguros"). Todos os links de "Diretoria e Delegados" (menus, rodapé, cartão da Home) levam a `diretoria.html`.

> **CSS compilado, e-mail por SMTP, subpáginas e auditoria (13/11, 2ª parte):**
> - **Tailwind não vem mais do CDN.** O `cdn.tailwindcss.com` montava o CSS no navegador do visitante a cada visita
>   (JS pesado, tela sem estilo por um instante, nota baixa no Lighthouse). Agora o CSS é compilado uma vez em
>   `site/assets/css/tailwind.css` (30 KB, 6 KB com gzip), mesma versão do CDN (3.4.17), linkado **por último** no
>   `<head>`, na mesma posição em que o CDN injetava. Comparação elemento por elemento em 12 páginas × 2 larguras:
>   idêntico (só uma borda âmbar com 1/255 de diferença de arredondamento). Lighthouse celular, mediana de 3, servidor
>   local: Home 71 → 85 (LCP 4,5 → 3,5 s, TBT 284 → 0 ms); Quem somos 90 → 97 (LCP 2,9 → 2,1 s).
>   **Classe nova do Tailwind no HTML só funciona depois de recompilar:** `cd site/tools && npm install` (uma vez) e
>   `npm run publicar` (= compila o CSS + `versionar.mjs`). O tema (cores `sincor-*`, fontes, sombras) está em
>   `site/tools/tailwind.config.cjs`; o antigo `tailwind-config.js` saiu.
> - **E-mail dos formulários:** `inc/formularios.php` envia por **SMTP autenticado** (PHPMailer 6.12.0 em
>   `inc/PHPMailer/`) quando existe `sincor-smtp.php` **fora da public_html** (modelo em `site/tools/sincor-smtp.exemplo.php`;
>   senha nunca no repositório). Sem o arquivo, ou se o SMTP falhar, cai no `mail()` da hospedagem (agora com `Date`,
>   `Message-ID` e `Auto-Submitted`), sem perder a ficha. Testado: SMTP com TLS verificado, senha errada, certificado
>   falso e configuração incompleta. **Hoje a conta Hostinger não tem nenhuma caixa de e-mail** e o domínio é temporário:
>   o `mail()` continua sujeito a spam até existir uma caixa real com SPF/DKIM (no domínio do Sincor, ou um Gmail com
>   senha de app como solução provisória).
> - **Subpáginas com acabamento novo (só `paginas.css`; a Home não carrega esse arquivo):** assinatura = a "asa" do logo
>   do Sincor (as duas curvas, dourada e branca) grande e translúcida no topo de cada página, no lugar do facho de luz
>   borrado, com filete dourado na base; títulos de seção com losango dourado; princípios com numeral em medalhão
>   marinho; Missão/Visão com acento dourado e a asa no cartão escuro; "Veja também" com ícone marinho/dourado;
>   Diretoria em formato de medalhão (faixa creme atrás da foto, aro dourado; presidente com faixa marinho e selo
>   dourado); ano aberto das Convenções com acento dourado. Conferido em 360 a 1920 px sem rolagem lateral; axe sem
>   violação nova (o único alerta das subpáginas é o "SC" dourado do logo, isento por ser logotipo).
> - **Auditoria original × nosso (13/11):** Quem somos, Diretoria (27 nomes), Convenções (45 itens, 35 PDFs conferidos
>   por tamanho, Estatuto e Regimento por hash), Política, Selo e fichas conferidos; diferenças só de ortografia.
>   **Achados, não alterados, aguardando o Richard:** (1) o original publicou a **Revista Nº 17, outubro/2026**
>   (`fliphtml5.com/vhxlb/RevistaSincor_Outubro26_Sepradas/`), que falta em `revistas.html` e na vitrine da Home;
>   (2) no original, **CNPJ** (ficha PJ) e **CEP, endereço, bairro, cidade e estado** (PF e PJ) são obrigatórios; aqui
>   estão opcionais; (3) Eventos: o local "Hotel Sibara Spa & Convenções" do Encontro da Mulher não está no original
>   (a cidade, Balneário Camboriú, a imprensa confirma); a imprensa cita 11 e 12/09, o original só 12/09;
>   (4) Home, herdado do código recebido: "+ R$ 4,8 Mil"/"+ R$ 9,5 Mil" sem fonte, títulos de vídeos da TV e a lista
>   "Seguradoras Parceiras" (inclui "HDI / YELUM", "MAPFRE / SULAMÉRICA") não batem com o material do cliente;
>   (5) "aos nossos filhos" virou "para os nossos filhos" em Quem somos (troca de estilo, não de erro).

Fase atual: **site oficial em construção em `site/`** (HTML + Tailwind compilado + PHP na Hostinger, sem banco de dados
por enquanto), publicado na prévia `lightcoral-dolphin-948661.hostingersite.com`, que o Richard manda ao cliente a cada
entrega. O conteúdo chega aos poucos; cada material novo entra quando o cliente envia. As versões abaixo (`prototipo/`)
são histórico das propostas de Home.

| Versão | Código | Arquivo único para testar | Linguagem |
|---|---|---|---|
| **Clássica** | `prototipo/src/` | `prototipo/dist/sincor-sc-home.html` | Clara, institucional, estrutura do Sincor SP. Carrossel de destaques com ilustrações SVG (selo 65 anos, certificado, ponte Hercílio Luz), ticker com Ibovespa, moedas, Selic, CDI e IPCA |
| **Telão** (preferida mais recente) | `prototipo/src-telao/` | `prototipo/dist/sincor-sc-home-telao.html` | Branca com faixas em azul-marinho. Topo em azul profundo com **parede curva de telas** (CSS 3D real) mostrando 19 maquetes 3D, colunas correndo em sentidos alternados, **canhões de luz**; título em serifada (Source Serif 4); barra superior só com **Dólar e Selic em verde**; banners com setas laterais; Google Maps |

### Detalhes da versão Telão (aprovada pelo cliente com ajustes já aplicados)
- **Topo:** fundo azul profundo (não branco: os canhões de luz precisam de fundo escuro). Parede de telas = colunas com
  `rotateY` em torno do espectador (`perspective`), colunas laterais maiores e bordas em arco, como monitor curvo.
  Cada tela tem título vindo de seções/produtos do site (lista `SCREENS` em `prototipo/tools/generate.mjs`).
  O telão "liga" depois que o título pinta (imagens só após `requestIdleCallback`), **sempre em movimento** (mais devagar
  com "reduzir movimento", pedido do cliente) e com **botão de pausa** (WCAG 2.2.2).
- **Banners (destaques):** 4 slides (Melhores do Ano, Brasesul 2027, Certificado Digital, Associe-se), setas laterais,
  barra de progresso que é o relógio da troca automática, pausa no hover/foco.
- **Seções:** acesso rápido, agenda (evento principal com maquete do troféu + lista), benefícios (lista numerada + tela
  que troca a maquete no hover/foco), área do associado (celular com carteira digital), notícias com filtro, Sincor SC TV
  em monitor curvo, revista, visite (Google Maps incorporado), newsletter e rodapé.
- **Tema:** tokens claros em `:root`; blocos azuis (`.statusbar, .hero, .site-header:not(.is-stuck), .slide,
  .event-feature, .benefits, .magazine, .site-footer`) redefinem os mesmos tokens para o escuro. Mude cores **pelos
  tokens**, nunca com hex solto.

### Imagens 3D
19 maquetes criadas para o projeto (Three.js, renderizadas no Chromium sem tela): torre, escritório, casa, enxaimel,
condomínio, skyline, chave, escudo, planta (2 ângulos), documento, reunião (2), monitor, troféu, redoma, auditório (2),
clínica. Direção de arte única: maquete branca, detalhes dourados, base laqueada, noite, luz de palco. Código em
`prototipo/tools/3d/` (ver o README de lá). São **ilustrativas**: não representam a sede nem imóveis reais.

### Medições atuais (manter ou melhorar)
| | Clássica | Telão |
|---|---|---|
| Lighthouse celular (Perf/A11y/BP/SEO) | 100/100/100/100 | 99/100/100/100 |
| LCP celular | 1,5 s | 2,0 s |
| axe-core WCAG 2.2 AA | 0 violações | 0 violações |
| Largura 360–1920 px | sem rolagem lateral | sem rolagem lateral |

## 4. Estrutura e comandos

**Site oficial (`site/`):**
- `cd site/tools && npm install` (uma vez por sessão nova) e, **antes de cada publicação**, `npm run publicar`
  (compila `assets/css/tailwind.css` e versiona CSS/JS com `?v=<hash>`).
- Cabeçalho/rodapé: `node site/tools/sync-layout.mjs`; revistas: `node site/tools/revistas.mjs`; diretoria e
  convenções: `node site/tools/institucional.mjs`.
- Publicar na Hostinger: subir `site/` sem `tools/` nem `.hostinger/` (ver `site/.hostinger/site.json`) para a
  `public_html` da prévia, depois conferir a prévia no ar. `sincor-smtp.php` fica fora da `public_html` e não é sobrescrito.

**Protótipos (histórico):**

```
docs/BRIEFING.md              requisitos vivos e decisões
prototipo/
├── src/                      versão Clássica (index.html, assets/css/styles.css, assets/js/main.js)
├── src-telao/                versão Telão (index.html, assets/css/telao.css, assets/js/telao.js, img/3d/*.webp)
├── dist/                     arquivos únicos gerados (abrem com dois cliques, sem servidor)
├── build.mjs                 gera dist/: CSS, JS, fontes e imagens embutidos + CSP por hash
└── tools/
    ├── generate.mjs          injeta SVGs gerados entre <!-- gen:x --> (sprite de ícones, selo, ponte, mapa, QR, parede de telas)
    └── 3d/                   cenas Three.js das maquetes e exportação para WebP
```

- Build das duas versões: `cd prototipo && node build.mjs` (ou `node build.mjs telao` / `node build.mjs classica`).
- Regerar SVGs/ícones/parede: `cd prototipo/tools && npm install && npm run generate`.
  Ícones vêm do `lucide-static` e só entram no sprite os usados no HTML (`<use href="#i-nome"/>`).
- **Nunca edite à mão** o conteúdo entre `<!-- gen:x -->` e `<!-- /gen:x -->`: é sobrescrito pelo gerador.
- **Nunca edite `dist/` à mão**: é saída do build. Sempre rode o build depois de mudar `src*/` e confira o `dist/`.
- Mudar uma versão não pode quebrar a outra: depois do build, confirme que o `dist/` da versão não tocada saiu idêntico.

## 5. Stack e restrições técnicas

- HTML5 + CSS + JavaScript puro, sem frameworks e sem dependências em runtime. Mobile-first.
- `site/`: Tailwind **compilado** (nunca voltar ao CDN), PHP só para os formulários (`enviar-*.php` + `inc/`).
  Fontes ainda pelo Google Fonts (próximo ganho de desempenho: hospedar as fontes no próprio site).
- Fontes self-hosted (Schibsted Grotesk; Source Serif 4 recortada só para o título do Telão), `font-display: swap`,
  fallback com métricas ajustadas.
- **CSP por hash** no build: **proibido** atributo `style=""` no HTML (o build falha de propósito) e proibido script
  inline extra sem atualizar o build. Estilo dinâmico via CSSOM (`el.style.setProperty`) é permitido.
- Domínios externos permitidos estão em `connect-src`/`frame-src` do `build.mjs`. Novo domínio = atualizar a CSP.
- Dados de terceiros entram no DOM com `textContent`/criação de nós, **nunca `innerHTML`**.
- `localStorage` sempre dentro de try/catch (navegação privada).

## 6. Regras de qualidade

### 6.1 Nada de página genérica ou com "cara de IA"
- Escolhas vêm do **mundo do cliente** (seguros, patrimônio, Santa Catarina, 65 anos, gala), não do template padrão.
- Evite os clichês: creme + serifa + terracota; quase-preto + acento ácido; "jornal de filetes"; gradiente roxo; blobs;
  glassmorphism em tudo; emoji como ícone; ícone em círculo colorido em grade de 3; texto em gradiente; "Unlock the power".
- **Um elemento de assinatura** por página (na Home Telão: o telão curvo + canhões de luz). O resto fica disciplinado.
  Antes de entregar, "tire um acessório": corte efeito que não serve ao conteúdo.
- Imagens: maquetes 3D do projeto ou fotos reais do cliente. **Nunca** banco de imagens genérico nem imagem gerada com
  cara de IA. Ilustrações SVG próprias quando fizer sentido.
- Detalhes de acabamento: tipografia com hierarquia clara (escala com `clamp`), números tabulares em dados, estados de
  hover/foco pensados, microcopy específica.
- O cliente achou "cara de IA" e "cara de página de vendas" em títulos grandes demais e pesados: prefira tom
  **institucional**.
- **Nada de setas (→, ↗, ›) em botões e links de ação** (o cliente considera "cara de IA"). Setas só em controles
  de navegação (anterior/próximo de carrossel) e ▾ de menu.

### 6.2 UX
- Mobile-first, testado de 360 a 1920 px, sem rolagem horizontal.
- Menus com teclado (Enter abre, Tab entra, Esc fecha e devolve o foco), atalho `/` para busca, diálogos nativos `<dialog>`.
- Tudo que se move sozinho tem pausa; troca automática pausa no hover e no foco; respeite `prefers-reduced-motion`
  (exceção documentada, pedido do cliente: o telão, a barra de cotações e a faixa de parceiros continuam com
  "reduzir movimento", mais lentos. **Cotações e faixa de parceiros não têm botão de pausa** (pedido do cliente em
  12/11, ciente de que a WCAG 2.2.2 pede um): rodam sempre, só seguram sob o mouse/foco e fora da tela. PCs antigos com Windows em "melhor desempenho" ativam essa
  preferência sem o usuário saber, e o carrossel parado pareceu defeito).
- Links de páginas ainda inexistentes mostram aviso, nunca levam a página quebrada.
- Formulários com rótulo visível, `autocomplete` correto, mensagens de status com `role="status"`.

### 6.3 Desempenho (orçamento)
- Lighthouse celular ≥ 95 em todas as categorias (meta 100); LCP ≤ 2,5 s em 4G simulado; CLS ≤ 0,05; TBT ≤ 150 ms.
- O LCP deve ser **texto** (título), nunca imagem decorativa; imagens decorativas carregam depois do primeiro quadro.
- Imagens em WebP (ou AVIF) no tamanho certo; nada acima de ~150 KB por imagem.
- Animações só com `transform`/`opacity`; animações contínuas pausadas fora da tela (`data-animate` + IntersectionObserver).
- Sem listener de `scroll` para estado visual (use sentinelas com IntersectionObserver); sem ler layout logo após
  mutar o DOM (forced reflow).
- Seções abaixo da dobra com `content-visibility: auto` (atenção: capturas de página inteira saem em branco; capture
  seção por seção).
- Meça com Lighthouse em modo produção (arquivos separados, compressão, mediana de 3 rodadas) antes de afirmar números.

### 6.4 SEO
- HTML semântico, um `h1` por página, hierarquia de títulos correta, `lang="pt-BR"`.
- `title` e `meta description` únicos, canonical, Open Graph e Twitter Card, JSON-LD (`WorkersUnion`, `WebSite`,
  `Event`; nas internas, `BreadcrumbList` e o que couber).
- URLs amigáveis em minúsculas com hífen (`/seja-associado`, `/eventos/melhores-do-ano-2026`).
- Texto nunca embutido em imagem (o site atual erra nisso).
- O protótipo usa `noindex`; remover só na publicação oficial, junto com sitemap.xml, robots.txt e redirecionamentos 301.

### 6.5 Acessibilidade (piso, não diferencial)
- WCAG 2.2 AA: axe-core com 0 violações nas duas larguras; contraste AA (dourado sobre branco só em `--gold-ink`).
- Foco sempre visível; alvos de toque ≥ 44 px; `sr-only` para contexto de leitor de tela; nome acessível contém o texto
  visível (WCAG 2.5.3); decoração com `aria-hidden`.

### 6.6 Conteúdo
- **Conteúdo copiado do site original mantém o sentido e as informações exatas** (pedido do cliente: "não erre que é
  grave"). **Erros de português podem e devem ser corrigidos** (acentos, crase, maiúsculas indevidas, vírgulas, "onde"
  fora de lugar), autorizado pelo cliente em 13/11, sem mudar o sentido. Nomes de pessoas nunca são alterados.
- **Use o texto real do Sincor SC.** Não invente fatos, números, depoimentos, parceiros nem datas. Exemplos provisórios
  (eventos menores, notícias, vídeos) estão marcados no README e devem continuar marcados.
- Cotações: nada inventado. Sem dado real, o item mostra traço/"indisponível". Dados com atraso e sinalizados como
  informativos.

### 6.7 Segurança
- CSP restritiva, `rel="noopener noreferrer"` em links externos, nenhum segredo no front (token da brapi só no servidor).
- Formulários do protótipo não enviam nada; quando houver back-end: validação no servidor, RLS no Supabase, LGPD.

## 7. Dados de mercado

- **Clássica:** AwesomeAPI (USD, EUR, GBP, ARS, BTC), Banco Central SGS (432 Selic meta, 4389 CDI, 13522 IPCA 12m),
  brapi (Ibovespa, exige token no servidor).
- **Telão:** só Dólar (AwesomeAPI) e Selic (BCB 432, com BrasilAPI de reserva). Valores em verde (pedido do cliente);
  a variação do dia fica vermelha com ▼ quando cai (não exibir queda como alta).
- Produção: JSON próprio via `data-feed`; contrato no `prototipo/README.md`.

## 8. Definição de pronto (checklist antes de entregar)

- [ ] Skills carregadas e este arquivo lido
- [ ] Build rodado; `dist/` atualizado; a outra versão saiu idêntica
- [ ] Capturas conferidas em 390 e 1440 px (e 360/768/1024/1920 sem rolagem lateral)
- [ ] axe-core 0 violações; teclado testado no que mudou
- [ ] Lighthouse dentro do orçamento quando a mudança afeta carregamento
- [ ] Nenhum `style=""`, nenhum `innerHTML` com dado externo, CSP atualizada se entrou domínio novo
- [ ] README e `docs/BRIEFING.md` atualizados quando muda escopo, decisão ou medição
- [ ] Commit em português (`feat:`, `fix:`, `docs:`, `chore:`), descrevendo o porquê

## 9. Pendências do cliente

1. Confirmar HEX da paleta e enviar o logo em SVG
2. Fotos (diretoria, eventos, sede); foto da fachada permitiria uma maquete 3D da sede real
3. Acesso à hospedagem atual e ao DNS (hoje com a Guerra Comunicação)
4. ~~URLs oficiais das redes sociais~~ (feito em 11/11)
5. Conteúdo das páginas internas (ou autorização para reaproveitar o atual)
6. Nomes dos Diretores Regionais (o original só lista as 9 regiões); confirmar se as "Comissões Técnicas" da Home existem; seguradoras parceiras
7. Regras da votação Melhores do Ano
8. Base de associados (formato e campos) para importação
9. Decisão sobre banco de dados e hospedagem do sistema
