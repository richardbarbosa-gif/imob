# Briefing do projeto — Sincor SC

> Registro vivo dos requisitos. Toda decisão de arquitetura deve rastrear até aqui.
> Última atualização: 2026-10-14

## 1. Contexto

- **Cliente**: Sincor SC — Sindicato dos Corretores de Seguros de Santa Catarina.
- **Site atual**: https://sincor-sc.com.br/ — pesado, escuro, aparência amadora.
- **Benchmark**: Sincor SP — https://sincor.org.br/ (usabilidade e design limpo).
- **Objetivo**: ficar no nível do Sincor SP **e superá-lo** em estética, UX, performance e SEO.
- **Ordem de execução**: começar pela Home.

> Pendente: análise direta dos dois sites (bloqueada pela política de rede do ambiente de desenvolvimento).

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

## 5. Decisões propostas (aguardando aprovação)

| Tema | Proposta | Motivo |
|------|----------|--------|
| Front-end | Astro (HTML estático por padrão, componentes interativos só onde necessário) | Performance e SEO máximos; páginas públicas saem como HTML puro |
| Back-end | Supabase (PostgreSQL + Auth + Storage + RLS) | Login, votação, inscrições e cadastro único sem servidor próprio |
| Hospedagem | Vercel ou Cloudflare Pages (domínio do cliente mantido) | Preview por versão, CDN global, HTTPS; hospedagem compartilhada não roda o sistema |
| Votação | Login + código único, 1 voto por categoria garantido no banco, trilha de auditoria | Anti-fraude verificável |
| Carteira | PWA com QR Code assinado + página pública de validação | Impede falsificação por print |
| Migração | Redirecionamentos 301 de todas as URLs antigas | Preservar ranqueamento atual no Google |

## 6. Pendências do cliente

1. Paleta de cores / manual de marca / logo em vetor (SVG)
2. Imagens (fotos de diretoria, eventos, sede)
3. Acesso ao painel da hospedagem atual e ao DNS do domínio
4. Conteúdo textual das páginas (ou autorização para reaproveitar o atual)
5. Lista de delegados por região, comissões, seguradoras parceiras
6. Regras da votação (categorias, período, quem vota, quem apura)
7. Base atual de associados (formato, campos) para importação
