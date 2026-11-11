// Eventos: a página sai do servidor já separada em próximos e realizados; aqui ela se mantém certa com o passar
// do tempo (evento cuja data final já passou desce para "realizados", do mais recente para o mais antigo).
(function initEventos() {
  const proximos = document.querySelector('[data-eventos="proximos"]');
  const realizados = document.querySelector('[data-eventos="realizados"]');
  const vazio = document.querySelector('[data-eventos-vazio]');
  if (!proximos || !realizados) return;
  const hoje = new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso de quem visita
  [...proximos.children].forEach(li => {
    if (li.querySelector('[data-evento-fim]').dataset.eventoFim < hoje) realizados.prepend(li);
  });
  const fim = li => li.querySelector('[data-evento-fim]').dataset.eventoFim;
  [...realizados.children].sort((a, b) => fim(b).localeCompare(fim(a))).forEach(li => realizados.append(li));
  vazio.hidden = proximos.children.length > 0;
})();
