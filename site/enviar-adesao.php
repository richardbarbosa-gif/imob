<?php
/**
 * Recebe a ficha de adesão (Pessoa Física ou Pessoa Jurídica) e envia por e-mail ao Sincor SC.
 *
 * - Não grava nenhum dado pessoal no servidor: valida, monta o e-mail (com o anexo) e envia.
 * - Valida tudo de novo aqui; a validação do navegador só ajuda quem preenche.
 * - Proteções contra robôs: campo-isca, tempo mínimo de preenchimento e limite de envios por hora.
 * - Envio pela função mail() da hospedagem. Para trocar o destino, mude DESTINO.
 */
declare(strict_types=1);

const DESTINO = 'administrativo@sincor-sc.com.br';
const LIMITE_POR_HORA = 5;      // envios por endereço IP
const TEMPO_MINIMO = 5;         // segundos: pessoas levam minutos; robôs, menos de 1

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Referrer-Policy: same-origin');

function responder(int $status, array $dados): void
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'mensagem' => 'Use o formulário do site para enviar a ficha.']);
}

// Só aceita envios do próprio site
$host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origem !== '' && strtolower((string) parse_url($origem, PHP_URL_HOST)) !== $host) {
    responder(403, ['ok' => false, 'mensagem' => 'Envio não autorizado.']);
}

// Arquivo maior que o limite do servidor chega com o POST vazio
if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    responder(413, ['ok' => false, 'mensagem' => 'O arquivo anexado é grande demais. Envie uma versão menor.']);
}

$protocolo = date('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(2)));

// Robôs: campo-isca preenchido ou envio rápido demais. Responde "ok" para não ensinar o robô, e não envia nada.
if (trim((string) ($_POST['empresa_site'] ?? '')) !== '' || (int) ($_POST['tempo'] ?? 0) < TEMPO_MINIMO) {
    responder(200, ['ok' => true, 'protocolo' => $protocolo]);
}

// Limite de envios por IP (só o hash do IP, apagado depois de 1 hora)
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$arquivoLimite = sys_get_temp_dir() . '/sincor-adesao-' . hash('sha256', $ip . __FILE__) . '.json';
$agora = time();
$envios = is_file($arquivoLimite) ? (json_decode((string) file_get_contents($arquivoLimite), true) ?: []) : [];
$envios = array_values(array_filter($envios, fn($t) => is_int($t) && $t > $agora - 3600));
if (count($envios) >= LIMITE_POR_HORA) {
    responder(429, ['ok' => false, 'mensagem' => 'Muitos envios em pouco tempo. Tente de novo mais tarde ou ligue para (47) 3326-8894.']);
}

/* ------------------------------------------------------------------ */
/* Campos                                                              */
/* ------------------------------------------------------------------ */
$tipo = $_POST['tipo'] ?? '';
if (!in_array($tipo, ['pf', 'pj'], true)) {
    responder(400, ['ok' => false, 'mensagem' => 'Tipo de ficha inválido.']);
}

$SEXOS = ['Masculino', 'Feminino'];
$ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Separado(a)', 'Viúvo(a)'];
$UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

// nome => [rótulo, obrigatório, tamanho máximo, regra]
$pessoa = [
    'cpf'          => ['CPF', true, 14, 'cpf'],
    'nascimento'   => ['Data de nascimento', true, 10, 'nascimento'],
    'sexo'         => ['Sexo', true, 20, 'sexo'],
    'estado_civil' => ['Estado civil', true, 20, 'estado_civil'],
    'conjuge'      => ['Nome do cônjuge', false, 120, null],
];
$documentos = [
    'rg'         => ['Nº do RG', true, 20, null],
    'rg_orgao'   => ['Órgão emissor', true, 20, null],
    'rg_data'    => ['Data de expedição', true, 10, 'passada'],
    'titulo'     => ['Nº do título de eleitor', false, 14, 'numero'],
    'zona'       => ['Nº da zona', false, 6, 'numero'],
    'secao'      => ['Nº da seção', false, 6, 'numero'],
    'domicilio'  => ['Domicílio eleitoral', false, 80, null],
    'reservista' => ['Certificado de reservista', false, 40, null],
];
$filiacao = [
    'pai' => ['Nome do pai', true, 120, null],
    'mae' => ['Nome da mãe', true, 120, null],
];
$endereco = [
    'cep'      => ['CEP', false, 9, 'cep'],
    'endereco' => ['Endereço', false, 150, null],
    'bairro'   => ['Bairro', false, 80, null],
    'cidade'   => ['Cidade', false, 80, null],
    'estado'   => ['Estado', false, 2, 'uf'],
    'telefone' => ['Telefone', true, 15, 'telefone'],
    'email'    => ['E-mail', true, 120, 'email'],
];
$final = [
    'observacoes' => ['Observações', false, 1500, null],
    'autoriza'    => ['Autoriza a divulgação do e-mail para seguradoras', true, 3, 'sim_nao'],
    'aceite'      => ['Aceite da Política de Privacidade', true, 3, 'aceite'],
];

if ($tipo === 'pf') {
    $titulo = 'Pessoa Física';
    $secoes = [
        'Dados pessoais'     => ['nome' => ['Nome completo', true, 120, null]] + $pessoa,
        'Registro SUSEP'     => ['susep' => ['Nº SUSEP', true, 30, null], 'susep_data' => ['Data de concessão SUSEP', true, 10, 'passada']],
        'Documentos'         => $documentos,
        'Filiação'           => $filiacao,
        'Endereço e contato' => $endereco,
        'Finalização'        => $final,
    ];
    $anexo = ['rotulo' => 'Foto 3x4 digital', 'prefixo' => 'foto-3x4', 'max_mb' => 5,
              'tipos' => ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp']];
    $campoNome = 'nome';
} else {
    $titulo = 'Pessoa Jurídica';
    $secoes = [
        'Dados da corretora'        => [
            'corretora'  => ['Nome da corretora', true, 150, null],
            'cnpj'       => ['CNPJ', false, 18, 'cnpj'],
            'susep'      => ['Nº SUSEP', true, 30, null],
            'susep_data' => ['Data de concessão SUSEP', true, 10, 'passada'],
        ],
        'Responsável técnico'       => ['responsavel' => ['Nome do responsável técnico', true, 120, null]] + $pessoa,
        'Documentos do responsável' => $documentos,
        'Filiação do responsável'   => $filiacao,
        'Endereço e contato'        => $endereco,
        'Finalização'               => $final,
    ];
    $anexo = ['rotulo' => 'Contrato social da corretora', 'prefixo' => 'contrato-social', 'max_mb' => 10,
              'tipos' => ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png']];
    $campoNome = 'corretora';
}

/* ------------------------------------------------------------------ */
/* Validação                                                           */
/* ------------------------------------------------------------------ */
function soDigitos(string $v): string { return preg_replace('/\D/', '', $v); }

function cpfValido(string $v): bool
{
    $d = soDigitos($v);
    if (strlen($d) !== 11 || preg_match('/^(\d)\1{10}$/', $d)) return false;
    for ($n = 9; $n <= 10; $n++) {
        $soma = 0;
        for ($i = 0; $i < $n; $i++) $soma += (int) $d[$i] * ($n + 1 - $i);
        $dv = ($soma * 10) % 11;
        if (($dv === 10 ? 0 : $dv) !== (int) $d[$n]) return false;
    }
    return true;
}

function cnpjValido(string $v): bool
{
    $d = soDigitos($v);
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

function dataValida(string $v): ?DateTimeImmutable
{
    $dt = DateTimeImmutable::createFromFormat('!Y-m-d', $v);
    return ($dt && $dt->format('Y-m-d') === $v) ? $dt : null;
}

$valores = [];
$erros = [];
foreach ($secoes as $campos) {
    foreach ($campos as $nome => [$rotulo, $obrigatorio, $max, $regra]) {
        $bruto = $_POST[$nome] ?? '';
        $v = is_string($bruto) ? trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $bruto) ?? '') : '';
        if ($v === '') {
            if ($obrigatorio) $erros[$nome] = in_array($regra, ['sim_nao', 'aceite', 'sexo', 'estado_civil'], true) ? 'Escolha uma opção.' : 'Preencha este campo.';
            $valores[$nome] = '';
            continue;
        }
        if (mb_strlen($v) > $max) { $erros[$nome] = "Use no máximo $max caracteres."; continue; }
        $hoje = new DateTimeImmutable('today');
        $erro = match ($regra) {
            'cpf'          => cpfValido($v) ? null : 'CPF inválido. Confira os números.',
            'cnpj'         => cnpjValido($v) ? null : 'CNPJ inválido. Confira os números.',
            'email'        => filter_var($v, FILTER_VALIDATE_EMAIL) ? null : 'Informe um e-mail válido.',
            'telefone'     => in_array(strlen(soDigitos($v)), [10, 11], true) ? null : 'Informe o telefone com DDD.',
            'cep'          => strlen(soDigitos($v)) === 8 ? null : 'O CEP tem 8 números.',
            'numero'       => ctype_digit($v) ? null : 'Use só números.',
            'uf'           => in_array($v, $UFS, true) ? null : 'Estado inválido.',
            'sexo'         => in_array($v, $SEXOS, true) ? null : 'Escolha uma opção.',
            'estado_civil' => in_array($v, $ESTADOS_CIVIS, true) ? null : 'Escolha uma opção.',
            'sim_nao'      => in_array($v, ['sim', 'nao'], true) ? null : 'Escolha Sim ou Não.',
            'aceite'       => $v === 'sim' ? null : 'É preciso aceitar para enviar a ficha.',
            'passada'      => ($d = dataValida($v)) && $d <= $hoje ? null : 'Informe uma data válida, que não seja no futuro.',
            'nascimento'   => ($d = dataValida($v)) && $d->diff($hoje)->y >= 16 && $d->diff($hoje)->y <= 110 && $d <= $hoje ? null : 'Confira a data de nascimento.',
            default        => null,
        };
        if ($erro) { $erros[$nome] = $erro; continue; }
        $valores[$nome] = $v;
    }
}

// Anexo (opcional)
$arquivo = null;
$upload = $_FILES['arquivo'] ?? null;
if ($upload && ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    if ($upload['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($upload['tmp_name'])) {
        $erros['arquivo'] = in_array($upload['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? "Arquivo acima de {$anexo['max_mb']} MB. Envie uma versão menor."
            : 'Não foi possível receber o arquivo. Tente de novo.';
    } elseif ($upload['size'] > $anexo['max_mb'] * 1024 * 1024) {
        $erros['arquivo'] = "Arquivo acima de {$anexo['max_mb']} MB. Envie uma versão menor.";
    } else {
        // O tipo vem do conteúdo do arquivo, não do nome nem do que o navegador declarou
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']) ?: '';
        if (!isset($anexo['tipos'][$mime])) {
            $erros['arquivo'] = 'Formato não aceito. Use ' . strtoupper(implode(', ', array_unique($anexo['tipos']))) . '.';
        } else {
            $base = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $valores[$campoNome] ?? '') ?: ''), '-')) ?: 'associado';
            $arquivo = [
                'nome' => $anexo['prefixo'] . '-' . substr($base, 0, 60) . '.' . $anexo['tipos'][$mime],
                'mime' => $mime,
                'conteudo' => (string) file_get_contents($upload['tmp_name']),
            ];
        }
    }
}

if ($erros) {
    responder(422, ['ok' => false, 'mensagem' => 'Confira os campos destacados.', 'erros' => $erros]);
}

/* ------------------------------------------------------------------ */
/* E-mail                                                              */
/* ------------------------------------------------------------------ */
$h = fn(string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$exibir = function (string $nome, string $v): string {
    if ($v === '') return '—';
    if ($nome === 'autoriza') return $v === 'sim' ? 'Sim' : 'Não';
    if ($nome === 'aceite') return 'Sim, aceitou';
    if (in_array($nome, ['nascimento', 'rg_data', 'susep_data'], true) && ($d = dataValida($v))) return $d->format('d/m/Y');
    return $v;
};

$nomePrincipal = $valores[$campoNome];
$enviadoEm = (new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo')))->format('d/m/Y \à\s H:i');

$texto = "Nova ficha de adesão: $titulo\nProtocolo: $protocolo\nEnviada em: $enviadoEm\n";
$html = '<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b">'
      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0"><tr><td align="center">'
      . '<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">'
      . '<tr><td style="background:#071d49;padding:22px 28px;color:#ffffff">'
      . '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#f1c266;font-weight:bold">Sincor SC · Ficha de adesão</div>'
      . '<div style="font-size:20px;font-weight:bold;margin-top:6px">' . $h($titulo) . ': ' . $h($nomePrincipal) . '</div>'
      . '<div style="font-size:13px;color:#c9d3e6;margin-top:6px">Protocolo ' . $h($protocolo) . ' · enviada em ' . $h($enviadoEm) . '</div>'
      . '</td></tr><tr><td style="padding:8px 28px 24px">';

foreach ($secoes as $secao => $campos) {
    $texto .= "\n== $secao ==\n";
    $html .= '<div style="margin-top:18px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8a5d0f;font-weight:bold;border-bottom:2px solid #f1c266;padding-bottom:6px">' . $h($secao) . '</div>'
           . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">';
    foreach ($campos as $nome => [$rotulo]) {
        $v = $exibir($nome, $valores[$nome] ?? '');
        $texto .= "$rotulo: $v\n";
        $html .= '<tr><td style="padding:7px 12px 7px 0;color:#64748b;width:42%;vertical-align:top;border-bottom:1px solid #f1f5f9">' . $h($rotulo) . '</td>'
               . '<td style="padding:7px 0;font-weight:bold;color:#0f172a;vertical-align:top;border-bottom:1px solid #f1f5f9">' . nl2br($h($v)) . '</td></tr>';
    }
    $html .= '</table>';
}
$anexoInfo = $arquivo ? "Anexo: {$arquivo['nome']}" : "{$anexo['rotulo']}: não enviado";
$texto .= "\n$anexoInfo\n\nPara responder, use \"Responder\": a resposta vai para o e-mail informado na ficha.\n";
$html .= '<p style="margin-top:20px;font-size:13px;color:#475569">' . $h($anexoInfo) . '</p>'
       . '<p style="margin-top:4px;font-size:12px;color:#94a3b8">Para responder, use "Responder": a resposta vai para o e-mail informado na ficha.</p>'
       . '</td></tr></table></td></tr></table></body></html>';

// Cabeçalhos: remetente do próprio domínio do site; "Responder" vai para quem preencheu
$dominio = preg_replace('/^www\./', '', $host);
if (!preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $dominio)) $dominio = 'sincor-sc.com.br';
$remetente = "nao-responda@$dominio";
$replyTo = str_replace(["\r", "\n"], '', $valores['email']);
$codifica = fn(string $v): string => '=?UTF-8?B?' . base64_encode($v) . '?=';
$assunto = $codifica("Ficha de adesão ($titulo): $nomePrincipal [$protocolo]");

$limite = 'sincor-' . bin2hex(random_bytes(12));
$alt = 'sincor-alt-' . bin2hex(random_bytes(12));
$cabecalhos = implode("\r\n", [
    'MIME-Version: 1.0',
    'From: ' . $codifica('Site Sincor SC') . " <$remetente>",
    "Reply-To: $replyTo",
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
if ($arquivo) {
    $corpo .= "--$limite\r\n"
            . "Content-Type: {$arquivo['mime']}; name=\"{$arquivo['nome']}\"\r\n"
            . "Content-Transfer-Encoding: base64\r\n"
            . "Content-Disposition: attachment; filename=\"{$arquivo['nome']}\"\r\n\r\n"
            . chunk_split(base64_encode($arquivo['conteudo'])) . "\r\n";
}
$corpo .= "--$limite--\r\n";

$enviado = mail(DESTINO, $assunto, $corpo, $cabecalhos, '-f' . $remetente);
if (!$enviado) {
    error_log("Sincor SC: falha no envio da ficha $protocolo");
    responder(502, ['ok' => false, 'mensagem' => 'Não foi possível enviar a ficha agora. Tente de novo em alguns minutos ou fale com a gente pelo (47) 3326-8894.']);
}

$envios[] = $agora;
@file_put_contents($arquivoLimite, json_encode($envios), LOCK_EX);
responder(200, ['ok' => true, 'protocolo' => $protocolo]);
