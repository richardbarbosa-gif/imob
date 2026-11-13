<?php
/**
 * Biblioteca comum dos formulários do site (incluída pelos arquivos enviar-*.php; sozinha não responde nada).
 *
 * - Não grava nenhum dado pessoal no servidor: valida, monta o e-mail (com anexos) e envia.
 * - Valida tudo de novo aqui; a validação do navegador só ajuda quem preenche.
 * - Proteções contra robôs: campo-isca, tempo mínimo de preenchimento e limite de envios por hora.
 * - Envio por SMTP autenticado quando existe o arquivo sincor-smtp.php fora da pasta pública (ver config_smtp());
 *   sem ele, pela função mail() da hospedagem, que pode cair no spam. Para trocar o destino, mude DESTINO.
 */
declare(strict_types=1);

if (!defined('SINCOR_FORM')) {
    http_response_code(404);
    exit;
}

const DESTINO = 'administrativo@sincor-sc.com.br';
const LIMITE_POR_HORA = 5;            // envios por endereço IP, por formulário
const TEMPO_MINIMO = 5;               // segundos: pessoas levam minutos; robôs, menos de 1
const ANEXOS_MAX_MB = 20;             // soma dos anexos de um envio (e-mails acima de ~25 MB costumam ser recusados)
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function responder(int $status, array $dados): void
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Checagens comuns antes de ler os campos. Devolve o protocolo e o controle de limite do formulário.
 * Robô (campo-isca preenchido ou envio rápido demais) recebe "ok" para não aprender nada, e nada é enviado.
 */
function iniciar_envio(string $formulario): array
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    header('Referrer-Policy: same-origin');

    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        responder(405, ['ok' => false, 'mensagem' => 'Use o formulário do site para enviar.']);
    }
    // Só aceita envios do próprio site
    $host = host_do_site();
    $origem = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origem !== '' && strtolower((string) parse_url($origem, PHP_URL_HOST)) !== $host) {
        responder(403, ['ok' => false, 'mensagem' => 'Envio não autorizado.']);
    }
    // Arquivo maior que o limite do servidor chega com o POST vazio
    if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        responder(413, ['ok' => false, 'mensagem' => 'Os arquivos anexados são grandes demais. Envie versões menores.']);
    }

    $protocolo = date('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(2)));
    if (trim((string) ($_POST['empresa_site'] ?? '')) !== '' || (int) ($_POST['tempo'] ?? 0) < TEMPO_MINIMO) {
        responder(200, ['ok' => true, 'protocolo' => $protocolo]);
    }

    // Limite de envios por IP (só o hash do IP, descartado depois de 1 hora)
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $arquivo = sys_get_temp_dir() . "/sincor-$formulario-" . hash('sha256', $ip . __FILE__) . '.json';
    $agora = time();
    $envios = is_file($arquivo) ? (json_decode((string) file_get_contents($arquivo), true) ?: []) : [];
    $envios = array_values(array_filter($envios, fn($t) => is_int($t) && $t > $agora - 3600));
    if (count($envios) >= LIMITE_POR_HORA) {
        responder(429, ['ok' => false, 'mensagem' => 'Muitos envios em pouco tempo. Tente de novo mais tarde ou ligue para (47) 3326-8894.']);
    }
    return ['protocolo' => $protocolo, 'limite' => ['arquivo' => $arquivo, 'envios' => $envios]];
}

function registrar_envio(array $limite): void
{
    $limite['envios'][] = time();
    @file_put_contents($limite['arquivo'], json_encode($limite['envios']), LOCK_EX);
}

function host_do_site(): string
{
    return strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
}

/* ------------------------------------------------------------------ */
/* Validação                                                           */
/* ------------------------------------------------------------------ */
function so_digitos(string $v): string { return preg_replace('/\D/', '', $v); }

function cpf_valido(string $v): bool
{
    $d = so_digitos($v);
    if (strlen($d) !== 11 || preg_match('/^(\d)\1{10}$/', $d)) return false;
    for ($n = 9; $n <= 10; $n++) {
        $soma = 0;
        for ($i = 0; $i < $n; $i++) $soma += (int) $d[$i] * ($n + 1 - $i);
        $dv = ($soma * 10) % 11;
        if (($dv === 10 ? 0 : $dv) !== (int) $d[$n]) return false;
    }
    return true;
}

function cnpj_valido(string $v): bool
{
    $d = so_digitos($v);
    if (strlen($d) !== 14 || preg_match('/^(\d)\1{13}$/', $d)) return false;
    foreach ([12, 13] as $n) {
        $soma = 0;
        $peso = $n - 7;
        for ($i = 0; $i < $n; $i++) {
            $soma += (int) $d[$i] * $peso--;
            if ($peso < 2) $peso = 9;
        }
        $r = $soma % 11;
        if (($r < 2 ? 0 : 11 - $r) !== (int) $d[$n]) return false;
    }
    return true;
}

function data_valida(string $v): ?DateTimeImmutable
{
    $dt = DateTimeImmutable::createFromFormat('!Y-m-d', $v);
    return ($dt && $dt->format('Y-m-d') === $v) ? $dt : null;
}

/** Lê e limpa um valor enviado (sem caracteres de controle). */
function valor_enviado(mixed $bruto): string
{
    return is_string($bruto) ? trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $bruto) ?? '') : '';
}

/**
 * Valida um valor por regra. Regra é o nome de uma regra ou a lista de opções aceitas.
 * Devolve a mensagem de erro, ou null quando está certo.
 */
function erro_da_regra(string|array|null $regra, string $v): ?string
{
    if (is_array($regra)) return in_array($v, $regra, true) ? null : 'Escolha uma opção.';
    $hoje = new DateTimeImmutable('today');
    return match ($regra) {
        'cpf'        => cpf_valido($v) ? null : 'CPF inválido. Confira os números.',
        'cnpj'       => cnpj_valido($v) ? null : 'CNPJ inválido. Confira os números.',
        'cpfcnpj'    => match (strlen(so_digitos($v))) {
            11 => cpf_valido($v) ? null : 'CPF inválido. Confira os números.',
            14 => cnpj_valido($v) ? null : 'CNPJ inválido. Confira os números.',
            default => 'Informe um CPF (11 números) ou um CNPJ (14 números).',
        },
        'email'      => filter_var($v, FILTER_VALIDATE_EMAIL) ? null : 'Informe um e-mail válido.',
        'telefone'   => in_array(strlen(so_digitos($v)), [10, 11], true) ? null : 'Informe o telefone com DDD.',
        'cep'        => strlen(so_digitos($v)) === 8 ? null : 'O CEP tem 8 números.',
        'numero'     => ctype_digit($v) ? null : 'Use só números.',
        'inteiro'    => preg_match('/^\d{1,6}$/', $v) ? null : 'Use só números.',
        'uf'         => in_array($v, UFS, true) ? null : 'Estado inválido.',
        'sim_nao'    => in_array($v, ['sim', 'nao'], true) ? null : 'Escolha Sim ou Não.',
        'aceite'     => $v === 'sim' ? null : 'É preciso aceitar para enviar.',
        'passada'    => ($d = data_valida($v)) && $d <= $hoje ? null : 'Informe uma data válida, que não seja no futuro.',
        'nascimento' => ($d = data_valida($v)) && $d <= $hoje && $d->diff($hoje)->y >= 16 && $d->diff($hoje)->y <= 110 ? null : 'Confira a data de nascimento.',
        default      => null,
    };
}

/**
 * Valida campos simples. $campos: nome => [rótulo, obrigatório, tamanho máximo, regra].
 * Acumula em $valores e $erros (chave = nome do campo, como no formulário).
 */
function validar_campos(array $campos, array &$valores, array &$erros, ?array $origem = null, string $prefixo = ''): void
{
    $origem ??= $_POST;
    foreach ($campos as $nome => [$rotulo, $obrigatorio, $max, $regra]) {
        $chave = $prefixo === '' ? $nome : "{$prefixo}[{$nome}]";
        $v = valor_enviado($origem[$nome] ?? '');
        $valores[$chave] = '';
        if ($v === '') {
            if ($obrigatorio) $erros[$chave] = (is_array($regra) || in_array($regra, ['sim_nao', 'aceite'], true)) ? 'Escolha uma opção.' : 'Preencha este campo.';
            continue;
        }
        if (mb_strlen($v) > $max) { $erros[$chave] = "Use no máximo $max caracteres."; continue; }
        if ($erro = erro_da_regra($regra, $v)) { $erros[$chave] = $erro; continue; }
        $valores[$chave] = $v;
    }
}

/**
 * Lê um anexo. $cfg: ['rotulo', 'prefixo', 'max_mb', 'tipos' => [mime => extensão], 'obrigatorio'].
 * O tipo vem do conteúdo do arquivo, não do nome nem do que o navegador declarou.
 * Devolve o anexo pronto para o e-mail, ou null (sem arquivo ou com erro, que vai para $erros).
 */
function ler_anexo(string $campo, array $cfg, string $nomeBase, array &$erros): ?array
{
    $upload = $_FILES[$campo] ?? null;
    if (!$upload || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        if (!empty($cfg['obrigatorio'])) $erros[$campo] = 'Anexe o arquivo.';
        return null;
    }
    if ($upload['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($upload['tmp_name'])) {
        $erros[$campo] = in_array($upload['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? "Arquivo acima de {$cfg['max_mb']} MB. Envie uma versão menor."
            : 'Não foi possível receber o arquivo. Tente de novo.';
        return null;
    }
    if ($upload['size'] > $cfg['max_mb'] * 1024 * 1024) {
        $erros[$campo] = "Arquivo acima de {$cfg['max_mb']} MB. Envie uma versão menor.";
        return null;
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']) ?: '';
    if (!isset($cfg['tipos'][$mime])) {
        $erros[$campo] = 'Formato não aceito. Use ' . strtoupper(implode(', ', array_unique($cfg['tipos']))) . '.';
        return null;
    }
    $base = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nomeBase) ?: ''), '-')) ?: 'arquivo';
    return [
        'rotulo' => $cfg['rotulo'],
        'nome' => $cfg['prefixo'] . '-' . substr($base, 0, 60) . '.' . $cfg['tipos'][$mime],
        'mime' => $mime,
        'conteudo' => (string) file_get_contents($upload['tmp_name']),
    ];
}

function exibir_data(string $v): string
{
    return ($d = data_valida($v)) ? $d->format('d/m/Y') : $v;
}

/* ------------------------------------------------------------------ */
/* E-mail                                                              */
/* ------------------------------------------------------------------ */
/**
 * Envia o e-mail para o Sincor SC.
 * $blocos: título da seção => lista de [rótulo, valor já formatado para leitura].
 * $anexos: lista de anexos de ler_anexo(). "Responder" vai para $replyTo (e-mail de quem preencheu).
 */
function enviar_email(string $tipo, string $titulo, string $protocolo, array $blocos, array $anexos, string $replyTo): bool
{
    $h = fn(string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $enviadoEm = (new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo')))->format('d/m/Y \à\s H:i');

    $texto = "$tipo: $titulo\nProtocolo: $protocolo\nEnviado em: $enviadoEm\n";
    $html = '<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b">'
          . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0"><tr><td align="center">'
          . '<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">'
          . '<tr><td style="background:#071d49;padding:22px 28px;color:#ffffff">'
          . '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#f1c266;font-weight:bold">Sincor SC · ' . $h($tipo) . '</div>'
          . '<div style="font-size:20px;font-weight:bold;margin-top:6px">' . $h($titulo) . '</div>'
          . '<div style="font-size:13px;color:#c9d3e6;margin-top:6px">Protocolo ' . $h($protocolo) . ' · enviado em ' . $h($enviadoEm) . '</div>'
          . '</td></tr><tr><td style="padding:8px 28px 24px">';

    foreach ($blocos as $secao => $linhas) {
        $texto .= "\n== $secao ==\n";
        $html .= '<div style="margin-top:18px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8a5d0f;font-weight:bold;border-bottom:2px solid #f1c266;padding-bottom:6px">' . $h($secao) . '</div>'
               . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">';
        foreach ($linhas as [$rotulo, $valor]) {
            $valor = $valor === '' ? '—' : $valor;
            $texto .= "$rotulo: $valor\n";
            $html .= '<tr><td style="padding:7px 12px 7px 0;color:#64748b;width:42%;vertical-align:top;border-bottom:1px solid #f1f5f9">' . $h($rotulo) . '</td>'
                   . '<td style="padding:7px 0;font-weight:bold;color:#0f172a;vertical-align:top;border-bottom:1px solid #f1f5f9">' . nl2br($h($valor)) . '</td></tr>';
        }
        $html .= '</table>';
    }
    $listaAnexos = $anexos ? 'Anexos: ' . implode(', ', array_map(fn($a) => "{$a['nome']} ({$a['rotulo']})", $anexos)) : 'Sem anexos.';
    $texto .= "\n$listaAnexos\n\nPara responder, use \"Responder\": a resposta vai para o e-mail informado no formulário.\n";
    $html .= '<p style="margin-top:20px;font-size:13px;color:#475569">' . $h($listaAnexos) . '</p>'
           . '<p style="margin-top:4px;font-size:12px;color:#94a3b8">Para responder, use "Responder": a resposta vai para o e-mail informado no formulário.</p>'
           . '</td></tr></table></td></tr></table></body></html>';

    $replyTo = str_replace(["\r", "\n"], '', $replyTo);
    $assunto = "$tipo: $titulo [$protocolo]";

    // 1º caminho: SMTP autenticado (caixa de e-mail real, com SPF/DKIM do domínio). É o que tira o e-mail do spam.
    $smtp = config_smtp();
    if ($smtp !== null) {
        if (enviar_por_smtp($smtp, $assunto, $html, $texto, $anexos, $replyTo, $protocolo)) return true;
        error_log("Sincor SC: SMTP falhou no envio $protocolo; tentando mail() da hospedagem");
    }

    // 2º caminho (reserva): mail() da hospedagem, com remetente do próprio domínio do site
    $dominio = preg_replace('/^www\./', '', host_do_site());
    if (!preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $dominio)) $dominio = 'sincor-sc.com.br';
    $remetente = "nao-responda@$dominio";
    $codifica = fn(string $v): string => '=?UTF-8?B?' . base64_encode($v) . '?=';
    $assunto = $codifica($assunto);

    $limite = 'sincor-' . bin2hex(random_bytes(12));
    $alt = 'sincor-alt-' . bin2hex(random_bytes(12));
    // Date e Message-ID próprios: e-mail sem eles soma pontos nos filtros de spam
    $cabecalhos = implode("\r\n", [
        'MIME-Version: 1.0',
        'Date: ' . date(DATE_RFC2822),
        'Message-ID: <' . $protocolo . '.' . bin2hex(random_bytes(6)) . "@$dominio>",
        'From: ' . $codifica('Site Sincor SC') . " <$remetente>",
        "Reply-To: $replyTo",
        'Auto-Submitted: auto-generated',
        'X-Mailer: Sincor SC',
        "Content-Type: multipart/mixed; boundary=\"$limite\"",
    ]);
    $corpo = "--$limite\r\n"
           . "Content-Type: multipart/alternative; boundary=\"$alt\"\r\n\r\n"
           . "--$alt\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
           . chunk_split(base64_encode($texto)) . "\r\n"
           . "--$alt\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
           . chunk_split(base64_encode($html)) . "\r\n"
           . "--$alt--\r\n";
    foreach ($anexos as $a) {
        $corpo .= "--$limite\r\n"
                . "Content-Type: {$a['mime']}; name=\"{$a['nome']}\"\r\n"
                . "Content-Transfer-Encoding: base64\r\n"
                . "Content-Disposition: attachment; filename=\"{$a['nome']}\"\r\n\r\n"
                . chunk_split(base64_encode($a['conteudo'])) . "\r\n";
    }
    $corpo .= "--$limite--\r\n";

    $ok = mail(DESTINO, $assunto, $corpo, $cabecalhos, '-f' . $remetente);
    if (!$ok) error_log("Sincor SC: falha no envio $protocolo ($tipo)");
    return $ok;
}

/**
 * Lê a configuração de SMTP de um arquivo FORA da pasta pública (nunca vai para o GitHub nem para o navegador):
 * na Hostinger, ao lado da public_html (domains/<domínio>/sincor-smtp.php). Modelo em tools/sincor-smtp.exemplo.php.
 * Sem o arquivo (ou incompleto), devolve null e o envio usa o mail() da hospedagem.
 */
function config_smtp(): ?array
{
    $arquivo = dirname(__DIR__, 2) . '/sincor-smtp.php';
    if (!is_file($arquivo)) return null;
    $cfg = include $arquivo;
    if (!is_array($cfg)) return null;
    foreach (['host', 'porta', 'usuario', 'senha'] as $chave) {
        if (empty($cfg[$chave])) {
            error_log("Sincor SC: sincor-smtp.php sem '$chave'; usando mail()");
            return null;
        }
    }
    return $cfg;
}

/** Envia por SMTP autenticado (PHPMailer). Devolve false em qualquer falha, sem expor detalhes ao visitante. */
function enviar_por_smtp(array $cfg, string $assunto, string $html, string $texto, array $anexos, string $replyTo, string $protocolo): bool
{
    require_once __DIR__ . '/PHPMailer/Exception.php';
    require_once __DIR__ . '/PHPMailer/PHPMailer.php';
    require_once __DIR__ . '/PHPMailer/SMTP.php';

    $m = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $m->isSMTP();
        $m->Host = (string) $cfg['host'];
        $m->Port = (int) $cfg['porta'];
        $m->SMTPAuth = true;
        $m->Username = (string) $cfg['usuario'];
        $m->Password = (string) $cfg['senha'];
        // 465 = SSL direto; 587 = STARTTLS. Certificado sempre verificado.
        $m->SMTPSecure = (int) $cfg['porta'] === 465
            ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $m->Timeout = 20;
        $m->CharSet = PHPMailer\PHPMailer\PHPMailer::CHARSET_UTF8;
        $m->Encoding = PHPMailer\PHPMailer\PHPMailer::ENCODING_BASE64;
        $m->XMailer = 'Sincor SC';

        // O remetente precisa ser a própria caixa autenticada (ou um alias dela), senão o SPF/DKIM não alinham
        $m->setFrom((string) ($cfg['remetente'] ?? $cfg['usuario']), (string) ($cfg['nome'] ?? 'Site Sincor SC'), false);
        $m->addAddress((string) ($cfg['destino'] ?? DESTINO));
        if (filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $m->addReplyTo($replyTo);
        $m->MessageID = '<' . $protocolo . '.' . bin2hex(random_bytes(6)) . '@' . substr(strrchr($m->From, '@') ?: '@sincor-sc.com.br', 1) . '>';
        $m->addCustomHeader('Auto-Submitted', 'auto-generated');

        $m->isHTML(true);
        $m->Subject = $assunto;
        $m->Body = $html;
        $m->AltBody = $texto;
        foreach ($anexos as $a) {
            $m->addStringAttachment($a['conteudo'], $a['nome'], PHPMailer\PHPMailer\PHPMailer::ENCODING_BASE64, $a['mime']);
        }
        return $m->send();
    } catch (Throwable $e) {
        $motivo = substr(preg_replace('/[^\x20-\x7E]+/', ' ', $m->ErrorInfo) ?? '', 0, 300);
        error_log("Sincor SC: falha no SMTP $protocolo: $motivo");
        return false;
    }
}

/** Recusa o envio quando a soma dos anexos passa do limite do e-mail. */
function conferir_tamanho_anexos(array $anexos, array &$erros): void
{
    $total = array_sum(array_map(fn($a) => strlen($a['conteudo']), $anexos));
    if ($total > ANEXOS_MAX_MB * 1024 * 1024) {
        $erros['_anexos'] = 'Os anexos somam mais de ' . ANEXOS_MAX_MB . ' MB. Envie fotos e documentos menores.';
    }
}
