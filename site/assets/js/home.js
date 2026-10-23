// Só da Home: carrossel de destaques, notícias, regiões e comissões
// Carrossel Hero
const slides = [
  {
    tag: 'Convite Oficial • Mercado Segurador Catarinense',
    sub: 'Prêmio Melhores do Ano 2026 • Jantar de Comemoração',
    title: 'Sincor-SC completa <span class="gold-foil-text">65 anos de história</span> com noite de gala no Teatro Carlos Gomes',
    img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85',
    btn: 'INSCREVA-SE AQUI!'
  },
  {
    tag: 'Benefícios Exclusivos PF e PJ',
    sub: 'Fortaleça sua Corretora em Santa Catarina',
    title: 'Certificado Digital, Assessoria Jurídica e <span class="gold-foil-text">Carteira Digital Mobile ID</span>',
    img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85',
    btn: 'CONHECER BENEFÍCIOS'
  },
  {
    tag: 'Capacitação & Eventos Regionais',
    sub: 'Agenda Executiva Sincor-SC 2026',
    title: 'Encontros presenciais em <span class="gold-foil-text">Blumenau, Florianópolis, Joinville, Criciúma e Chapecó</span>',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85',
    btn: 'VER AGENDA DE EVENTOS'
  }
];
let curSlide = 0;
function setHeroSlide(i) {
  curSlide = (i + slides.length) % slides.length;
  const s = slides[curSlide];
  document.getElementById('heroTag').textContent = s.tag;
  document.getElementById('heroSubhead').textContent = s.sub;
  document.getElementById('heroTitle').innerHTML = s.title;
  document.getElementById('heroBgImg').src = s.img;
  document.getElementById('heroBtnLabel').textContent = s.btn;
  const dots = document.getElementById('heroDots').children;
  for (let d = 0; d < dots.length; d++) {
    dots[d].className = d === curSlide
      ? 'w-7 h-2 rounded-full bg-sincor-gold transition-all'
      : 'w-2 h-2 rounded-full bg-white/40 hover:bg-white transition-all';
  }
}
function changeHeroSlide(dir) { setHeroSlide(curSlide + dir); }

// Notícias Dinâmicas (CMS)
const newsItems = [
  {
    cat: 'EVENTOS',
    date: '13/10/2026',
    title: 'Jantar de 65 Anos do Sincor-SC e Prêmio Melhores do Ano reunirá mercado segurador no Teatro Carlos Gomes',
    desc: 'Cerimônia acontece no dia 05/11/26 às 19h30 em Blumenau/SC. Corretores associados já podem realizar inscrição e votar.',
    img: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=700&q=80'
  },
  {
    cat: 'MERCADO SC',
    date: '10/10/2026',
    title: 'Procura por Seguros Corporativos, Vida e Responsabilidade Civil cresce em Santa Catarina em 2026',
    desc: 'Corretores catarinenses ampliam consultoria especializada para pequenas, médias e grandes empresas do Estado.',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80'
  },
  {
    cat: 'INSTITUCIONAL',
    date: '05/10/2026',
    title: 'Sincor-SC disponibiliza Convenções Coletivas atualizadas e atendimento jurídico para corretoras associadas',
    desc: 'Documentos oficiais podem ser consultados diretamente na Área do Associado ou solicitados à sede em Blumenau.',
    img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=700&q=80'
  }
];

function renderNews(cat = 'all', q = '') {
  const box = document.getElementById('newsContainer');
  const list = newsItems.filter(n => (cat === 'all' || n.cat === cat) && n.title.toLowerCase().includes(q.toLowerCase()));
  box.innerHTML = list.map(n => `
    <article class="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-editorial hover:shadow-editorial-hover transition flex flex-col justify-between">
      <div>
        <div class="h-44 overflow-hidden">
          <img src="${n.img}" alt="${n.title}" class="w-full h-full object-cover hover:scale-105 transition duration-500" />
        </div>
        <div class="p-5">
          <div class="flex items-center gap-2.5 mb-2">
            <span class="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sincor-900 text-white">${n.cat}</span>
            <span class="text-[11px] font-semibold text-slate-400">${n.date}</span>
          </div>
          <h3 class="text-sm sm:text-base font-extrabold text-sincor-900 leading-snug">${n.title}</h3>
          <p class="text-xs text-slate-600 mt-2 leading-relaxed">${n.desc}</p>
        </div>
      </div>
      <div class="px-5 pb-5">
        <a href="#noticias" class="text-xs font-extrabold text-sincor-goldDark hover:underline">Ler notícia completa →</a>
      </div>
    </article>
  `).join('');
}
renderNews();

function filterNews(cat) {
  document.querySelectorAll('.news-tab-btn').forEach(b => {
    b.className = b.dataset.cat === cat
      ? 'news-tab-btn px-3 py-1.5 rounded-lg text-xs font-extrabold bg-sincor-900 text-white transition'
      : 'news-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200/70 text-slate-700 hover:bg-slate-300 transition';
  });
  renderNews(cat);
}

document.getElementById('globalSearchInput')?.addEventListener('input', e => renderNews('all', e.target.value));

// Regiões SC
const regData = {
  vale: { label: 'Sede Estadual • Vale do Itajaí', cities: 'Blumenau, Itajaí, Balneário Camboriú, Brusque e Rio do Sul', addr: 'Rua Dr. Luiz de Freitas Melro, 395 - salas 902 à 904 - Centro, Blumenau - SC, 89010-921' },
  floripa: { label: 'Delegacia Regional • Grande Florianópolis', cities: 'Florianópolis, São José, Palhoça e Biguaçu', addr: 'Representação institucional e eventos técnicos na Capital.' },
  norte: { label: 'Delegacia Regional • Norte SC', cities: 'Joinville, Jaraguá do Sul, São Francisco do Sul e Mafra', addr: 'Atendimento às corretoras da macrorregião Norte.' },
  sul: { label: 'Delegacia Regional • Sul SC', cities: 'Criciúma, Tubarão, Araranguá e Laguna', addr: 'Encontros regionais e suporte sindical no Sul catarinense.' },
  oeste: { label: 'Delegacia Regional • Oeste SC', cities: 'Chapecó, Concórdia, Joaçaba e São Miguel do Oeste', addr: 'Foco em agronegócio, transportes e desenvolvimento regional.' }
};
function selectRegion(r) {
  document.getElementById('regLabel').textContent = regData[r].label;
  document.getElementById('regCities').textContent = regData[r].cities;
  document.getElementById('regAddress').textContent = regData[r].addr;
  document.querySelectorAll('.reg-pill').forEach(b => {
    b.className = b.dataset.reg === r
      ? 'reg-pill px-3.5 py-2 rounded-lg text-xs font-extrabold bg-sincor-900 text-white transition'
      : 'reg-pill px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition';
  });
}

function filterComm(v) {
  document.querySelectorAll('#commContainer > div').forEach(d => {
    d.classList.toggle('hidden', v !== 'all' && d.dataset.c !== v);
  });
}
