<?php
/**
 * Recebe as solicitações do Selo Corretor Associado e do Cartão do Empresário e envia por e-mail ao Sincor SC.
 * Validação, proteções e envio ficam em inc/formularios.php (comum a todos os formulários).
 */
declare(strict_types=1);
define('SINCOR_FORM', true);
require __DIR__ . '/inc/formularios.php';

$tipo = $_POST['tipo'] ?? '';
if (!in_array($tipo, ['selo', 'cartao'], true)) {
    responder(400, ['ok' => false, 'mensagem' => 'Formulário inválido.']);
}
$envio = iniciar_envio($tipo);

$valores = [];
$erros = [];
$anexos = [];
$blocos = [];
$aceite = ['aceite' => ['Aceite', true, 3, 'aceite']];

if ($tipo === 'selo') {
    // Mesmos campos da página original do Sincor SC (selo-corretor-associado)
    $campos = [
        'nome'      => ['Nome da corretora (PJ) ou do corretor (PF)', true, 150, null],
        'documento' => ['CNPJ ou CPF', true, 18, 'cpfcnpj'],
        'telefone'  => ['Telefone', true, 15, 'telefone'],
        'email'     => ['E-mail', true, 120, 'email'],
    ];
    validar_campos($campos + $aceite, $valores, $erros);
    if ($erros) responder(422, ['ok' => false, 'mensagem' => 'Confira os campos destacados.', 'erros' => $erros]);

    foreach ($campos as $nome => [$rotulo]) $blocos['Dados do solicitante'][] = [$rotulo, $valores[$nome]];
    $blocos['Autorização de uso do selo'] = [
        ['Termo', 'Eu, corretor de seguros inscrito na SUSEP, enquanto associado e com obrigações em dia, poderei utilizar o selo eletrônico com a logomarca do Sincor-SC em site, mídias sociais, correspondências, cartão de visita etc. Importante registrar que me comprometo a não usar tal logomarca de forma indevida, onde possa acarretar ônus ou danos à imagem desta instituição, e desde já isento o Sincor-SC de qualquer responsabilidade jurídica que, porventura, venha a ser questionada na Justiça.'],
        ['Aceite do termo e da Política de Privacidade', 'Sim, aceitou'],
    ];
    $assunto = ['Solicitação do Selo Corretor Associado', $valores['nome']];
} else {
    $REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'];
    $VINCULOS = ['Sócio(a)', 'Dependente'];
    $corretora = [
        'corretora'       => ['Nome da corretora', true, 150, null],
        'cnpj'            => ['CNPJ', true, 18, 'cnpj'],
        'regime'          => ['Regime tributário', true, 20, $REGIMES],
        'colaboradores'   => ['Número de colaboradores', true, 6, 'inteiro'],
        'data_associacao' => ['Data de associação ao Sincor SC', false, 10, 'passada'],
    ];
    $contato = [
        'responsavel' => ['Nome de quem faz o pedido', true, 120, null],
        'telefone'    => ['Telefone', true, 15, 'telefone'],
        'email'       => ['E-mail', true, 120, 'email'],
    ];
    $final = ['observacoes' => ['Observações', false, 1500, null]] + $aceite;
    validar_campos($corretora + $contato + $final, $valores, $erros);

    // Usuários do cartão (sócios e dependentes): de 1 a 8, cada um com nome, CPF, vínculo e foto
    $usuarios = is_array($_POST['usuarios'] ?? null) ? $_POST['usuarios'] : [];
    $usuarios = array_slice($usuarios, 0, 8, true);
    if (!$usuarios) $erros['usuarios[0][nome]'] = 'Informe pelo menos um usuário do cartão.';
    $camposUsuario = [
        'nome'    => ['Nome completo', true, 120, null],
        'cpf'     => ['CPF', true, 14, 'cpf'],
        'vinculo' => ['Vínculo', true, 20, $VINCULOS],
    ];
    $foto = ['rotulo' => 'Foto do usuário', 'prefixo' => 'foto', 'max_mb' => 3, 'obrigatorio' => true,
             'tipos' => ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp']];
    $listaUsuarios = [];
    foreach ($usuarios as $k => $dados) {
        if (!is_array($dados) || !preg_match('/^\d{1,3}$/', (string) $k)) continue;
        validar_campos($camposUsuario, $valores, $erros, $dados, "usuarios[$k]");
        $listaUsuarios[] = $k;
        if ($a = ler_anexo("foto_$k", $foto, $valores["usuarios[$k][nome]"] ?: "usuario-$k", $erros)) $anexos[] = $a;
    }
    $docs = [
        'cartao_cnpj' => ['rotulo' => 'Cartão CNPJ', 'prefixo' => 'cartao-cnpj', 'max_mb' => 5, 'obrigatorio' => true],
        'contrato'    => ['rotulo' => 'Contrato social ou última alteração', 'prefixo' => 'contrato-social', 'max_mb' => 10, 'obrigatorio' => true],
    ];
    foreach ($docs as $campo => $cfg) {
        $cfg['tipos'] = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
        if ($a = ler_anexo($campo, $cfg, $valores['corretora'] ?: 'corretora', $erros)) $anexos[] = $a;
    }
    conferir_tamanho_anexos($anexos, $erros);
    if ($erros) {
        responder(422, ['ok' => false, 'mensagem' => $erros['_anexos'] ?? 'Confira os campos destacados.', 'erros' => array_diff_key($erros, ['_anexos' => 1])]);
    }

    foreach ($corretora as $nome => [$rotulo]) {
        $blocos['Corretora'][] = [$rotulo, $nome === 'data_associacao' ? exibir_data($valores[$nome]) : $valores[$nome]];
    }
    foreach ($contato as $nome => [$rotulo]) $blocos['Quem faz o pedido'][] = [$rotulo, $valores[$nome]];
    foreach ($listaUsuarios as $i => $k) {
        $blocos['Usuários do cartão'][] = ['Usuário ' . ($i + 1), "{$valores["usuarios[$k][nome]"]} · CPF {$valores["usuarios[$k][cpf]"]} · {$valores["usuarios[$k][vinculo]"]}"];
    }
    $n = count($listaUsuarios);
    $blocos['Usuários do cartão'][] = ['Valor (R$ 20,00 por usuário)', $n . ($n === 1 ? ' usuário' : ' usuários') . ' = R$ ' . number_format($n * 20, 2, ',', '.')];
    $blocos['Finalização'] = [
        ['Observações', $valores['observacoes']],
        ['Aceite da Política de Privacidade', 'Sim, aceitou'],
    ];
    $assunto = ['Pedido do Cartão do Empresário', $valores['corretora']];
}

if (!enviar_email($assunto[0], $assunto[1], $envio['protocolo'], $blocos, $anexos, $valores['email'])) {
    responder(502, ['ok' => false, 'mensagem' => 'Não foi possível enviar agora. Tente de novo em alguns minutos ou fale com a gente pelo (47) 3326-8894.']);
}
registrar_envio($envio['limite']);
responder(200, ['ok' => true, 'protocolo' => $envio['protocolo']]);
