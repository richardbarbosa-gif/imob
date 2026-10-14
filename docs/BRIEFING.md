# Briefing do projeto — Sincor SC

> Registro vivo dos requisitos. Toda decisão de arquitetura deve rastrear até aqui.
> Última atualização: 2026-10-14

## 1. Contexto

- **Cliente**: Sincor SC — Sindicato dos Corretores de Seguros de Santa Catarina.
- **Site atual**: https://sincor-sc.com.br/ — pesado, escuro, aparência amadora.
- **Benchmark**: Sincor SP — https://sincor.org.br/ (usabilidade e design limpo).
- **Objetivo**: ficar no nível do Sincor SP **e superá-lo** em estética, UX, performance e SEO.
- **Ordem de execução**: começar pela Home (protótipo para aprovação). As demais páginas vêm depois.
- **Textos**: usar os do site atual do Sincor SC.

### Dados reais levantados (prints de 14/10/2026)

- **Sede**: R. Dr. Luiz de Freitas Melro, 395, salas 902 a 904, Centro, **Blumenau/SC**, 89010-921.
- **Contato**: (47) 3326-8894 · administrativo@sincor-sc.com.br.
- **Nome jurídico**: Sindicato dos Corretores de Seguros e de Resseguros e das Empresas Corretoras de Seguros e de Resseguros no Estado de Santa Catarina.
- **Paleta**: azul-marinho + dourado (HEX estimados: `#13264a` / `#c6a15b`, a confirmar no manual da marca).
- **Evento em destaque**: Melhores do Ano 2026, jantar de 65 anos do Sincor-SC, 05/11/26, 19:30, Teatro Carlos Gomes, traje esporte fino.
- **Site atual**: desenvolvido pela Guerra Comunicação; banner é imagem com texto embutido (ilegível no celular, invisível ao Google);
  a seção "Últimas Notícias" está vazia e repete o subtítulo de Benefícios; botão dourado com texto branco reprova em contraste.
- **Sincor SP (benchmark)**: destaques em carrossel, faixa "seja associado", agenda com evento principal, revista, notícias,
  TV, cursos, depoimentos, app do associado, newsletter e rodapé completo.

## 2. Páginas (11 listadas)

1. Home — destaques, notícias, eventos, CTA
2. Sobre Nós
3. Seja Corretor Associado — tabela de benefícios PF vs PJ + formulário de adesão
4. Diretoria e Delegados — mapa interativo por região de SC
5. Comissões — filtro por especialidade
6. Calendário de Eventos — inscrição integrada
7. Notícias do Mercado — blog dinâmico
8. Seguradoras Parceiras
9. Certificado Digital
10. Seguro de Vida
11. Revistas — acervo com download

## 3. Funcionalidades

### Área do associado
- Login próprio, base única de cadastro, painel do associado
- Votação "Melhores do Ano" com código único por associado (anti-fraude)
- Inscrição em eventos com confirmação por e-mail
- Conteúdo privado (circulares, documentos)

### CMS / Admin
- Publicação de notícias sem desenvolvedor, categorias, busca
- Home alimentada automaticamente
- Painel admin para atualizações simples (notícias, eventos, revistas, associados)

### Carteira digital
- Identidade visual Sincor, dados preenchidos do cadastro
- Otimizada para celular (uso como identificação)

## 4. Requisitos técnicos obrigatórios

- Responsivo (desktop, tablet, mobile)
- SEO on-page: meta tags, URLs amigáveis, schema markup
- Google Analytics com eventos de conversão (com consentimento LGPD)
- Login de membros, formulário de adesão, calendário com inscrição
- Votação autenticada por código
- CMS para blog, painel admin

## 5. Decisões

**Fase atual (protótipo da Home)**: HTML5 + CSS + JavaScript puro, entregue como arquivo único que abre com dois cliques.
Código em `prototipo/` (ver `prototipo/README.md`).

**Fase do sistema (propostas, dependem da conversa com o cliente sobre banco de dados e hospedagem):**

| Tema | Proposta | Motivo |
|------|----------|--------|
| Front-end | Astro (HTML estático por padrão, componentes interativos só onde necessário); o protótipo migra sem retrabalho | Performance e SEO máximos; páginas públicas saem como HTML puro |
| Back-end | Supabase (PostgreSQL + Auth + Storage + RLS) | Login, votação, inscrições e cadastro único sem servidor próprio |
| Hospedagem | Vercel ou Cloudflare Pages (domínio do cliente mantido) | Preview por versão, CDN global, HTTPS; hospedagem compartilhada não roda o sistema |
| Votação | Login + código único, 1 voto por categoria garantido no banco, trilha de auditoria | Anti-fraude verificável |
| Carteira | PWA com QR Code assinado + página pública de validação | Impede falsificação por print |
| Migração | Redirecionamentos 301 de todas as URLs antigas | Preservar ranqueamento atual no Google |

## 6. Pendências do cliente

1. Confirmar os HEX da paleta e enviar o logo em vetor (SVG)
2. Imagens (fotos de diretoria, eventos, sede)
3. Acesso ao painel da hospedagem atual e ao DNS do domínio (hoje com a Guerra Comunicação)
4. URLs oficiais das redes sociais (Facebook, Instagram, LinkedIn)
5. Conteúdo textual das páginas (ou autorização para reaproveitar o atual)
6. Lista de delegados por região, comissões, seguradoras parceiras
7. Regras da votação (categorias, período, quem vota, quem apura)
8. Base atual de associados (formato, campos) para importação
