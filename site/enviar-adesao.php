<?php
/**
 * Recebe a ficha de adesão (Pessoa Física ou Pessoa Jurídica) e envia por e-mail ao Sincor SC.
 * Validação, proteções e envio ficam em inc/formularios.php (comum a todos os formulários).
 */
declare(strict_types=1);
define('SINCOR_FORM', true);
require __DIR__ . '/inc/formularios.php';

$envio = iniciar_envio('adesao');

$tipo = $_POST['tipo'] ?? '';
if (!in_array($tipo, ['pf', 'pj'], true)) {
    responder(400, ['ok' => false, 'mensagem' => 'Tipo de ficha inválido.']);
}

$SEXOS = ['Masculino', 'Feminino'];
$ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Separado(a)', 'Viúvo(a)'];

// nome => [rótulo, obrigatório, tamanho máximo, regra]
$pessoa = [
    'cpf'          => ['CPF', true, 14, 'cpf'],
    'nascimento'   => ['Data de nascimento', true, 10, 'nascimento'],
    'sexo'         => ['Sexo', true, 20, $SEXOS],
    'estado_civil' => ['Estado civil', true, 20, $ESTADOS_CIVIS],
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
    'cep'      => ['CEP', true, 9, 'cep'],
    'endereco' => ['Endereço', true, 150, null],
    'bairro'   => ['Bairro', true, 80, null],
    'cidade'   => ['Cidade', true, 80, null],
    'estado'   => ['Estado', true, 2, 'uf'],
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
            'cnpj'       => ['CNPJ', true, 18, 'cnpj'],
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

$valores = [];
$erros = [];
foreach ($secoes as $campos) validar_campos($campos, $valores, $erros);
$arquivo = ler_anexo('arquivo', $anexo, $valores[$campoNome] ?? '', $erros);
if ($erros) {
    responder(422, ['ok' => false, 'mensagem' => 'Confira os campos destacados.', 'erros' => $erros]);
}

$blocos = [];
foreach ($secoes as $secao => $campos) {
    foreach ($campos as $nome => [$rotulo]) {
        $v = $valores[$nome];
        $v = match (true) {
            $nome === 'autoriza' => $v === 'sim' ? 'Sim' : 'Não',
            $nome === 'aceite' => 'Sim, aceitou',
            in_array($nome, ['nascimento', 'rg_data', 'susep_data'], true) => exibir_data($v),
            default => $v,
        };
        $blocos[$secao][] = [$rotulo, $v];
    }
}
$blocos['Finalização'][] = [$anexo['rotulo'], $arquivo ? $arquivo['nome'] : 'não enviado'];

if (!enviar_email("Ficha de adesão ($titulo)", $valores[$campoNome], $envio['protocolo'], $blocos, $arquivo ? [$arquivo] : [], $valores['email'])) {
    responder(502, ['ok' => false, 'mensagem' => 'Não foi possível enviar a ficha agora. Tente de novo em alguns minutos ou fale com a gente pelo (47) 3326-8894.']);
}
registrar_envio($envio['limite']);
responder(200, ['ok' => true, 'protocolo' => $envio['protocolo']]);
