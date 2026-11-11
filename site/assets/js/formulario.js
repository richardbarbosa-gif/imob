// Formulários do site (fichas de adesão, selo e cartão do empresário): máscaras, endereço pelo CEP, listas de pessoas,
// validação acessível e envio. O servidor valida tudo de novo: esta validação só existe para ajudar quem preenche.
// Configuração pelo HTML: data-mask, data-valida, data-label (nome curto no resumo de erros), data-msg (mensagem de
// obrigatório) e, nas listas, data-repetidor / data-repetidor-modelo / data-repetidor-add.
(function initFormulario(form) {
  if (!form) return;
  const startedAt = Date.now();
  const summary = form.querySelector('[data-error-summary]');
  const statusEl = form.querySelector('[data-form-status]');
  const submitBtn = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const submitTexto = submitLabel.textContent;
  const success = document.querySelector('[data-success]');
  const digits = v => String(v || '').replace(/\D/g, '');

  /* ---------- Máscaras ---------- */
  const MASKS = {
    cpf: v => digits(v).slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2'),
    cnpj: v => digits(v).slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2'),
    // Até 11 números é CPF; a partir do 12º vira CNPJ
    cpfcnpj: v => (digits(v).length <= 11 ? MASKS.cpf(v) : MASKS.cnpj(v)),
    cep: v => digits(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
    telefone: v => {
      const d = digits(v).slice(0, 11);
      if (d.length <= 2) return d.length ? `(${d}` : '';
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    },
    numero: v => digits(v)
  };

  /* ---------- Regras ---------- */
  function cpfValido(v) {
    const d = digits(v);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    const dv = n => {
      let soma = 0;
      for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
  }
  function cnpjValido(v) {
    const d = digits(v);
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    const dv = n => {
      let soma = 0;
      let peso = n - 7;
      for (let i = 0; i < n; i++) {
        soma += Number(d[i]) * peso--;
        if (peso < 2) peso = 9;
      }
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
  }
  const hoje = () => new Date().toISOString().slice(0, 10);
  const anos = iso => {
    const n = new Date(`${iso}T12:00:00`);
    const h = new Date();
    let a = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--;
    return a;
  };
  const RULES = {
    cpf: v => (cpfValido(v) ? '' : 'CPF inválido. Confira os números.'),
    cnpj: v => (cnpjValido(v) ? '' : 'CNPJ inválido. Confira os números.'),
    cpfcnpj: v => {
      const n = digits(v).length;
      if (n === 11) return cpfValido(v) ? '' : 'CPF inválido. Confira os números.';
      if (n === 14) return cnpjValido(v) ? '' : 'CNPJ inválido. Confira os números.';
      return 'Informe um CPF (11 números) ou um CNPJ (14 números).';
    },
    email: v => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Informe um e-mail válido, como nome@exemplo.com.br.'),
    telefone: v => ([10, 11].includes(digits(v).length) ? '' : 'Informe o telefone com DDD.'),
    cep: v => (digits(v).length === 8 ? '' : 'O CEP tem 8 números.'),
    passada: v => (v <= hoje() ? '' : 'A data não pode ser no futuro.'),
    nascimento: v => { const a = anos(v); return a >= 16 && a <= 110 ? '' : 'Confira a data de nascimento.'; },
    inteiro: v => (/^\d{1,6}$/.test(v) ? '' : 'Use só números.')
  };

  const groupOf = el => form.querySelector(`#f-${el.name.replace(/[[\]]+/g, '-').replace(/-$/, '')}`);
  const labelOf = el => {
    // Campo de uma pessoa da lista: "Usuário 2 · CPF"
    const pessoa = el.closest('.pessoa');
    if (pessoa) return `${pessoa.querySelector('.pessoa__title').textContent.trim()} · ${form.querySelector(`label[for="${el.id}"]`).firstChild.textContent.trim()}`;
    if (el.dataset.label) return el.dataset.label;
    if (el.type === 'radio') {
      const group = groupOf(el);
      return group && group.dataset.label ? group.dataset.label : group.querySelector('legend').firstChild.textContent.trim();
    }
    const label = form.querySelector(`label[for="${el.id}"]`);
    return label ? label.firstChild.textContent.trim() : el.name;
  };

  function check(el) {
    if (el.type === 'radio') {
      const marcado = form.querySelector(`input[name="${CSS.escape(el.name)}"]:checked`);
      return el.required && !marcado ? (el.dataset.msg || 'Escolha uma opção.') : '';
    }
    if (el.type === 'checkbox') return el.required && !el.checked ? (el.dataset.msg || 'É preciso aceitar para enviar.') : '';
    if (el.type === 'file') {
      const file = el.files && el.files[0];
      if (!file) return el.required ? (el.dataset.msg || 'Anexe o arquivo.') : '';
      const tipos = el.accept.split(',').map(s => s.trim());
      if (!tipos.includes(file.type)) return `Formato não aceito. ${form.querySelector(`#${el.id}-dica`).textContent}`;
      if (file.size > Number(el.dataset.maxMb) * 1024 * 1024) return `Arquivo acima de ${el.dataset.maxMb} MB. Envie uma versão menor.`;
      return '';
    }
    const v = el.value.trim();
    if (!v) {
      if (!el.required) return '';
      return el.dataset.msg || (el.tagName === 'SELECT' ? 'Escolha uma opção.' : 'Preencha este campo.');
    }
    const rule = el.dataset.valida;
    return rule ? RULES[rule](v) : '';
  }

  function setError(el, msg) {
    const isRadio = el.type === 'radio';
    const group = isRadio ? groupOf(el) : null;
    const errorEl = form.querySelector(`#${isRadio ? group.id : el.id}-erro`);
    const targets = isRadio ? [...form.querySelectorAll(`input[name="${CSS.escape(el.name)}"]`)] : [el];
    const box = isRadio ? group : form.querySelector(`#${el.id}-box`);
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
    targets.forEach(t => {
      if (msg) t.setAttribute('aria-invalid', 'true'); else t.removeAttribute('aria-invalid');
      const ids = new Set((t.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
      if (msg) ids.add(errorEl.id); else ids.delete(errorEl.id);
      if (ids.size) t.setAttribute('aria-describedby', [...ids].join(' ')); else t.removeAttribute('aria-describedby');
    });
    if (box) { if (msg) box.setAttribute('aria-invalid', 'true'); else box.removeAttribute('aria-invalid'); }
  }

  const ignorados = ['tipo', 'empresa_site'];
  const controls = () => [...form.elements].filter(el => el.name && !ignorados.includes(el.name) && el.type !== 'submit' && el.type !== 'button');
  // Um representante por grupo de rádio
  const uniqueControls = () => controls().filter((el, i, all) => el.type !== 'radio' || all.findIndex(o => o.name === el.name) === i);

  // Liga máscara e validação a um campo (também aos campos criados depois, nas listas)
  function bind(el) {
    if (el.dataset.bound) return;
    el.dataset.bound = '1';
    if (el.dataset.mask) el.addEventListener('input', () => { el.value = MASKS[el.dataset.mask](el.value); });
    const ev = ['radio', 'checkbox', 'file'].includes(el.type) || el.tagName === 'SELECT' ? 'change' : 'blur';
    // Campo vazio só acusa erro no envio: passar por ele com Tab não deve pintar de vermelho
    el.addEventListener(ev, () => { if (ev === 'change' || el.value.trim() || el.getAttribute('aria-invalid') === 'true') setError(el, check(el)); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') setError(el, check(el)); });
  }
  controls().forEach(bind);

  /* ---------- Endereço pelo CEP (ViaCEP) ---------- */
  const cep = form.elements.cep;
  if (cep) {
    const cepStatus = form.querySelector('#f-cep-status');
    const CAMPOS = { endereco: 'logradouro', bairro: 'bairro', cidade: 'localidade', estado: 'uf' };
    let ultimoCep = '';
    Object.keys(CAMPOS).forEach(name => {
      const el = form.elements[name];
      if (el) el.addEventListener('input', () => { delete el.dataset.auto; });
    });
    const preencher = (name, valor) => {
      const el = form.elements[name];
      if (!el || !valor || (el.value && !el.dataset.auto)) return; // nunca apaga o que a pessoa digitou
      el.value = valor;
      el.dataset.auto = '1';
      setError(el, '');
    };
    const buscarCep = async d => {
      cepStatus.removeAttribute('data-tone');
      cepStatus.textContent = 'Buscando endereço…';
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: ctrl.signal });
        const dados = await res.json();
        if (d !== ultimoCep) return;
        if (dados.erro) { cepStatus.textContent = 'CEP não encontrado. Preencha o endereço abaixo.'; return; }
        Object.entries(CAMPOS).forEach(([name, chave]) => preencher(name, dados[chave]));
        cepStatus.dataset.tone = 'ok';
        cepStatus.textContent = 'Endereço preenchido pelo CEP. Confira e acrescente o número.';
      } catch {
        cepStatus.textContent = 'Não foi possível buscar o CEP agora. Preencha o endereço abaixo.';
      } finally {
        clearTimeout(timer);
      }
    };
    cep.addEventListener('input', () => {
      const d = digits(cep.value);
      if (d.length === 8 && d !== ultimoCep) { ultimoCep = d; buscarCep(d); }
      if (d.length < 8) { ultimoCep = ''; cepStatus.textContent = ''; }
    });
  }

  /* ---------- Listas de pessoas (ex.: usuários do Cartão do Empresário) ---------- */
  form.querySelectorAll('[data-repetidor]').forEach(lista => {
    const modelo = form.querySelector(`[data-repetidor-modelo="${lista.dataset.repetidor}"]`);
    const addBtn = form.querySelector(`[data-repetidor-add="${lista.dataset.repetidor}"]`);
    const max = Number(lista.dataset.max) || 8;
    const total = form.querySelector(`[data-repetidor-total="${lista.dataset.repetidor}"]`);
    const preco = Number(lista.dataset.precoUnitario) || 0;
    const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    let proximo = lista.children.length;

    function atualizar() {
      const n = lista.children.length;
      [...lista.children].forEach((item, i) => {
        item.querySelector('[data-repetidor-num]').textContent = String(i + 1);
        item.querySelector('[data-repetidor-remove]').hidden = n === 1;
      });
      addBtn.hidden = n >= max;
      if (total) total.textContent = `${n} ${n === 1 ? 'usuário' : 'usuários'} × ${brl(preco)} = ${brl(n * preco)}`;
    }
    function ligar(item) {
      item.querySelectorAll('input, select, textarea').forEach(bind);
      item.querySelector('[data-repetidor-remove]').addEventListener('click', () => {
        const anterior = item.previousElementSibling || item.nextElementSibling;
        item.remove();
        atualizar();
        (anterior.querySelector('input') || addBtn).focus();
      });
    }
    addBtn.addEventListener('click', () => {
      const html = modelo.innerHTML.replace(/__i__/g, String(proximo++));
      const tpl = document.createElement('template');
      tpl.innerHTML = html; // o modelo é HTML fixo da própria página, nunca dado de terceiros
      const item = tpl.content.firstElementChild;
      lista.append(item);
      ligar(item);
      atualizar();
      item.querySelector('input').focus();
    });
    [...lista.children].forEach(ligar);
    atualizar();
  });

  /* ---------- Resumo de erros e mensagens ---------- */
  function showSummary(invalids) {
    summary.replaceChildren();
    const h = document.createElement('h3');
    h.textContent = invalids.length === 1 ? 'Falta corrigir 1 campo:' : `Faltam corrigir ${invalids.length} campos:`;
    const ul = document.createElement('ul');
    invalids.forEach(({ el, msg }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${el.id}`;
      a.textContent = `${labelOf(el)}: ${msg}`;
      a.addEventListener('click', ev => { ev.preventDefault(); el.focus(); el.scrollIntoView({ block: 'center' }); });
      li.append(a);
      ul.append(li);
    });
    summary.append(h, ul);
    summary.hidden = false;
    summary.focus();
  }
  function setStatus(tone, msg) {
    if (tone) statusEl.dataset.tone = tone; else statusEl.removeAttribute('data-tone');
    statusEl.textContent = msg;
  }
  function busy(on) {
    submitBtn.disabled = on;
    submitLabel.textContent = on ? 'Enviando…' : submitTexto;
  }

  /* ---------- Envio ---------- */
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    setStatus('', '');
    const invalids = uniqueControls()
      .map(el => ({ el, msg: check(el) }))
      .filter(({ el, msg }) => { setError(el, msg); return msg; });
    if (invalids.length) { showSummary(invalids); return; }
    summary.hidden = true;

    if (location.protocol === 'file:') {
      setStatus('info', 'Tudo certo com o preenchimento. O envio só funciona no site publicado: aqui, com o arquivo aberto no computador, nada é enviado.');
      return;
    }

    const dados = new FormData(form);
    dados.set('tempo', String(Math.round((Date.now() - startedAt) / 1000)));
    busy(true);
    setStatus('loading', 'Enviando…');
    try {
      const res = await fetch(form.action, { method: 'POST', body: dados, headers: { Accept: 'application/json' } });
      let json = null;
      try { json = await res.json(); } catch { /* resposta sem JSON */ }
      if (res.ok && json && json.ok) {
        form.hidden = true;
        success.querySelector('[data-protocolo]').textContent = json.protocolo || '';
        success.hidden = false;
        success.focus();
        success.scrollIntoView({ block: 'start', behavior: 'smooth' });
        return;
      }
      if (json && json.erros) {
        const lista = Object.entries(json.erros)
          .map(([name, msg]) => {
            const campo = form.elements[name];
            const el = campo && campo instanceof RadioNodeList ? campo[0] : campo;
            return { el, msg };
          })
          .filter(i => i.el);
        lista.forEach(({ el, msg }) => setError(el, msg));
        if (lista.length) { setStatus('', ''); showSummary(lista); return; }
      }
      setStatus('error', (json && json.mensagem) || 'Não foi possível enviar agora. Tente de novo em alguns minutos ou fale com a gente pelo (47) 3326-8894.');
    } catch {
      setStatus('error', 'Sem conexão com o servidor. Confira a sua internet e tente de novo.');
    } finally {
      busy(false);
    }
  });
})(document.querySelector('form[data-formulario]'));
