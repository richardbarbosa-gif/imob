<?php
/**
 * MODELO da configuração de SMTP dos formulários. NÃO coloque a senha neste arquivo do repositório.
 *
 * Como usar (na Hostinger):
 * 1. Copie este arquivo com o nome sincor-smtp.php para a pasta do site, AO LADO da public_html
 *    (Gerenciador de Arquivos: domains/<domínio>/sincor-smtp.php). Fora da public_html ninguém acessa pelo navegador.
 * 2. Preencha com uma caixa de e-mail real do domínio (ex.: site@sincor-sc.com.br). Com o domínio apontado e os
 *    registros SPF, DKIM e DMARC ativos, o e-mail chega na caixa de entrada.
 * 3. Envie uma ficha de teste. Se o SMTP falhar, o site usa o mail() da hospedagem e registra o erro no log.
 *
 * Exemplos de servidor: Hostinger Email (smtp.hostinger.com, 465); Google Workspace ou Gmail com senha de app
 * (smtp.gmail.com, 465). O remetente precisa ser a própria caixa autenticada.
 */
return [
    'host'      => 'smtp.hostinger.com',
    'porta'     => 465,                          // 465 (SSL) ou 587 (STARTTLS)
    'usuario'   => 'site@sincor-sc.com.br',
    'senha'     => 'TROQUE-PELA-SENHA-DA-CAIXA',
    'remetente' => 'site@sincor-sc.com.br',      // igual ao usuário (ou um alias dele)
    'nome'      => 'Site Sincor SC',
    // 'destino' => 'outro@exemplo.com.br',      // opcional, só para teste; o padrão é administrativo@sincor-sc.com.br
];
