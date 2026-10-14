# Briefing do projeto — imob

> Registro vivo dos requisitos. Toda decisão de arquitetura deve rastrear até aqui.
> Última atualização: 2026-10-14

## 1. Requisitos recebidos (v1)

| # | Requisito | Tradução técnica |
|---|-----------|------------------|
| R1 | Site institucional bonito, bem construído, estética apurada | Design system próprio (tokens, tipografia, grid), nada de template |
| R2 | UX impecável | Fluxos testados, acessibilidade WCAG 2.2 AA, estados de erro/vazio/carregando desenhados |
| R3 | Não é site simples: tem **sistema** com login e senha (referência: UOL, Terra) | Aplicação com área pública + área autenticada, arquitetura de software real |
| R4 | Página Home de entrada | Rota pública, estática, otimizada para SEO e conversão |
| R5 | Página de login/senha e criação de conta | Fluxo completo: cadastro, verificação de e-mail, login, recuperação de senha, logout, sessão |
| R6 | Responsivo: celular, tablet, desktop | Mobile-first, breakpoints testados em dispositivos reais |
| R7 | Leve, rápido, desempenho superior | Orçamento de performance com metas mensuráveis (ver §3) |
| R8 | Stack com o que há de mais moderno | Ferramentas atuais **e estáveis** — moderno ≠ beta |

## 2. Princípios de arquitetura (propostos, aguardando validação)

1. **Separar o público do privado na renderização**: páginas públicas estáticas/cacheadas na borda (quase zero JS); área logada dinâmica.
2. **Não reinventar autenticação**: usar biblioteca/provedor auditado. Senha própria só com hash Argon2id, rate limit, bloqueio progressivo, MFA opcional, passkeys.
3. **Segurança e LGPD por padrão**: cookies httpOnly/Secure/SameSite, CSP, consentimento, política de privacidade, exclusão de conta, logs de acesso.
4. **Autorização no banco** (Row Level Security), não só no front.
5. **Tudo versionado, tipado e testado**: TypeScript estrito, CI com lint + typecheck + testes + Lighthouse.

## 3. Metas de performance (propostas)

- LCP < 2,0 s em 4G (p75) · INP < 200 ms · CLS < 0,05
- JS das páginas públicas < 100 KB comprimido
- Lighthouse ≥ 95 em todas as categorias (mobile)

## 4. Perguntas em aberto (bloqueiam a arquitetura)

1. **Negócio**: o repositório se chama `imob` — é imobiliária? Qual empresa/marca?
2. **Quem faz login e para quê?** (cliente final, corretor, proprietário, admin) — define o sistema inteiro.
3. **Perfis e permissões**: há painel administrativo? Quem aprova cadastros?
4. **Métodos de login**: só e-mail+senha, ou também Google/Apple, link mágico, passkey? MFA obrigatório para admin?
5. **Identidade visual**: existe logo, paleta, manual de marca? Referências de sites que gosta?
6. **Conteúdo**: quais páginas públicas além da Home? Quem escreve a copy?
7. **Integrações**: CRM, WhatsApp, portais de imóveis (feeds XML), pagamentos, e-mail transacional?
8. **Infra e orçamento**: domínio já existe? Preferência de hospedagem? Limite de custo mensal?
9. **Prazo** e escopo do MVP.
