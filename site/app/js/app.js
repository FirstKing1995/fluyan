/* ==========================================================================
   FLUYAN — casca do painel: entrada, áreas, menus e rotas
   Depois de entrar, a pessoa vê a tela inicial com poucas ÁREAS grandes.
   Cada área abre só as telas dela, em abas. Perfis com poucas telas
   (clínica parceira, administrador) usam menu direto.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.A;
  A.telas = A.telas || {};

  var TODOS = ['titular', 'medico', 'secretaria', 'clinica'];
  var TELAS = {
    inicio: { rotulo: 'Início', icone: 'house', papeis: ['titular', 'medico', 'secretaria'] },
    agenda: { rotulo: 'Agenda', icone: 'calendar-days', papeis: TODOS },
    pacientes: { rotulo: 'Pacientes', icone: 'users-round', papeis: ['titular', 'medico', 'secretaria'] },
    estudio: { rotulo: 'Estúdio', icone: 'sparkles', papeis: ['titular', 'medico'] },
    conteudo: { rotulo: 'Calendário de conteúdo', icone: 'calendar-range', papeis: ['titular', 'medico'] },
    pagina: { rotulo: 'Minha página', icone: 'panels-top-left', papeis: ['titular', 'medico'] },
    locais: { rotulo: 'Locais e clínicas', icone: 'building-2', papeis: ['titular', 'medico'] },
    servicos: { rotulo: 'Serviços e planos', icone: 'stethoscope', papeis: ['titular', 'medico'] },
    equipe: { rotulo: 'Equipe e acessos', icone: 'user-cog', papeis: ['titular'] },
    perfil: { rotulo: 'Minha conta', icone: 'circle-user-round', papeis: TODOS.concat(['admin']) },
    financeiro: { rotulo: 'Financeiro e indicadores', icone: 'wallet', papeis: ['titular', 'medico', 'secretaria'] },
    admin: { rotulo: 'Clientes', icone: 'briefcase-medical', papeis: ['admin'] },
    auditoria: { rotulo: 'Auditoria', icone: 'scroll-text', papeis: ['admin'] }
  };
  var AREAS = [
    { id: 'atender', rotulo: 'Atender', icone: 'calendar-days', desc: 'A agenda de todos os locais e o cadastro dos seus pacientes.', telas: ['agenda', 'pacientes'] },
    { id: 'divulgar', rotulo: 'Divulgar', icone: 'megaphone', desc: 'Conteúdos criados pelo Estúdio e a sua página com agendamento.', telas: ['estudio', 'conteudo', 'pagina'] },
    { id: 'organizar', rotulo: 'Organizar', icone: 'sliders-horizontal', desc: 'Locais, horários, serviços, equipe e o seu perfil profissional.', telas: ['locais', 'servicos', 'equipe', 'perfil'] },
    { id: 'resultados', rotulo: 'Resultados', icone: 'trending-up', desc: 'Receitas, comparecimento e ocupação dos próximos dias.', telas: ['financeiro'] }
  ];
  var ultima = {}, telaAnterior = '';

  function papel() { return A.S.dados.eu.papel; }
  function pode(t) { return !!TELAS[t] && TELAS[t].papeis.indexOf(papel()) >= 0; }
  function ehMedico() { return papel() === 'titular' || papel() === 'medico'; }
  /** Áreas visíveis para o papel. O perfil só entra em "Organizar" para médicos (perfil profissional). */
  A.areasDoPapel = function () {
    return AREAS.map(function (a) {
      return { id: a.id, rotulo: a.rotulo, icone: a.icone, desc: a.desc, telas: a.telas.filter(function (t) { return pode(t) && (t !== 'perfil' || ehMedico()); }) };
    }).filter(function (a) { return a.telas.length; });
  };
  A.rotuloTela = function (t) { return t === 'perfil' && ehMedico() ? 'Perfil profissional' : TELAS[t].rotulo; };
  A.iconeTela = function (t) { return TELAS[t].icone; };
  function guiado() { return pode('inicio') && A.areasDoPapel().length >= 2; }
  function telasDiretas() { return Object.keys(TELAS).filter(function (t) { return t !== 'inicio' && pode(t); }).sort(function (a, b) { return (a === 'perfil') - (b === 'perfil'); }); }

  /* -------------------------------------------------------------- entrar */
  function telaEntrar(msg) {
    var demo = A.ehDemo();
    var raiz = document.getElementById('raiz');
    raiz.innerHTML = '<div class="entrar"><section class="lado">' +
      '<a class="marca" href="../">' + A.simbolo(40, 'var(--mf-petroleo-2)') + '<span class="nome" style="color:#fff">Fluyan</span></a>' +
      '<div><h1>Seu consultório <em>em ordem</em>, sua presença em dia.</h1><p class="some-movel">Agenda com clínicas parceiras, pacientes, página profissional e um estúdio que cria seus conteúdos com revisão médica.</p></div>' +
      '<small class="some-movel" style="color:#7F9493">Dados de pacientes tratados conforme a LGPD.</small></section>' +
      '<section class="form"><div><h2>Entrar</h2><p class="muted" style="margin:0 0 22px">Use o e-mail e a senha do seu acesso.</p>' +
      (msg ? '<div class="caixa al">' + A.i('circle-alert') + '<span>' + A.esc(msg) + '</span></div>' : '') +
      '<form id="f-entrar">' + A.campo('E-mail', 'email', '', { tipo: 'email', req: true, attrs: ' autocomplete="username"' }) +
      A.campo('Senha', 'senha', '', { tipo: 'password', req: true, attrs: ' autocomplete="current-password"' }) +
      '<button class="btn btn-p" style="width:100%">' + A.i('log-in') + 'Entrar</button></form>' +
      (demo ? '<div class="sep"></div><p class="peq muted" style="margin:0">Demonstração com dados fictícios. Entre como:</p><div class="demo-botoes">' +
        window.DEMO_CONTAS.map(function (c, i) { return '<button class="btn btn-s" data-demo="' + i + '">' + A.i(c.icone) + A.esc(c.rotulo) + '</button>'; }).join('') +
        '</div><button class="btn btn-g btn-pq" id="reiniciar-demo" style="margin-top:10px">' + A.i('rotate-ccw') + 'Recomeçar a demonstração</button>' : '') +
      '</div></section></div>';
    A.icones();
    var f = document.getElementById('f-entrar');
    f.onsubmit = function (e) { e.preventDefault(); entrar(A.form(f)); };
    raiz.querySelectorAll('[data-demo]').forEach(function (b) { b.onclick = function () { var c = window.DEMO_CONTAS[b.dataset.demo]; entrar({ email: c.email, senha: c.senha }); }; });
    var rd = document.getElementById('reiniciar-demo'); if (rd) rd.onclick = function () { window.DEMO.reiniciar(); };
  }
  function entrar(d) {
    return A.api('entrar', d).then(function (r) { A.store.set('fluyan_token', r.token); if (!A.S.autoEntrou || A.S.dados) location.hash = ''; A.iniciar(); }).catch(function (e) { A.aviso(e.message, true); });
  }

  /* --------------------------------------------------------------- convite */
  function telaConvite(codigo) {
    var raiz = document.getElementById('raiz');
    raiz.innerHTML = '<div class="entrar"><section class="lado"><a class="marca" href="../">' + A.simbolo(40, 'var(--mf-petroleo-2)') + '<span class="nome" style="color:#fff">Fluyan</span></a>' +
      '<div><h1>Você foi <em>convidado</em>.</h1><p>Crie sua senha para acessar a agenda e as informações liberadas para você.</p></div><span></span></section>' +
      '<section class="form"><div><h2>Aceitar convite</h2><p class="muted" style="margin:0 0 22px">Se você já tem conta, use a mesma senha.</p><form id="f-conv">' +
      A.campo('Seu nome', 'nome', '', {}) + A.campo('Crie uma senha', 'senha', '', { tipo: 'password', req: true, ajuda: 'Mínimo de 8 caracteres.', attrs: ' autocomplete="new-password" minlength="8"' }) +
      '<button class="btn btn-p" style="width:100%">Aceitar e entrar</button></form></div></section></div>';
    A.icones();
    document.getElementById('f-conv').onsubmit = function (e) {
      e.preventDefault(); var d = A.form(e.target); d.codigo = codigo;
      A.api('aceitarConvite', d).then(function (r) { A.store.set('fluyan_token', r.token); history.replaceState(null, '', location.pathname); A.iniciar(); }).catch(function (x) { A.aviso(x.message, true); });
    };
  }

  /* ----------------------------------------------------------------- casca */
  function item(nav, href, icone, rotulo) { return '<a class="item" href="#' + href + '" data-nav="' + nav + '">' + A.i(icone) + '<span>' + rotulo + '</span></a>'; }
  function casca() {
    var d = A.S.dados, eu = d.eu, g = guiado(), areas = A.areasDoPapel();
    var itens = g ? [['inicio', 'inicio', 'house', 'Início']].concat(areas.map(function (a) { return [a.id, a.id, a.icone, a.rotulo]; }))
      : telasDiretas().map(function (t) { return [t, t, TELAS[t].icone, TELAS[t].rotulo]; });
    var movel = itens.slice(0, 5);
    if (g && movel.length < 5 && !ehMedico()) movel.push(['perfil', 'perfil', 'circle-user-round', 'Conta']);
    document.getElementById('raiz').innerHTML =
      (A.ehDemo() ? '<div class="demo-faixa">Demonstração com dados fictícios. Nada aqui é real. <a href="#" id="sair-demo">Sair</a></div>' : '') +
      '<div class="casca"><nav class="lateral" aria-label="Menu principal"><a class="marca" href="#' + itens[0][1] + '">' + A.simbolo(32, 'var(--mf-petroleo-2)') + '<span class="nome">Fluyan</span></a>' +
      itens.map(function (x) { return item(x[0], x[1], x[2], x[3]); }).join('') +
      '<div class="rodape"><b>' + A.esc(eu.nome) + '</b><small>' + A.esc(A.PAPEL[eu.papel]) + (d.tenant ? ' · ' + A.esc(d.tenant.nome) : '') + '</small>' +
      (g ? '<a class="item conta" href="#perfil" data-nav="perfil">' + A.i('circle-user-round') + '<span>Minha conta</span></a>' : '') +
      '<button id="sair">' + A.i('log-out') + 'Sair</button></div></nav>' +
      '<main class="area" id="conteudo" tabindex="-1"></main></div>' +
      '<nav class="barra-movel" aria-label="Menu">' + movel.map(function (x) { return '<a href="#' + x[1] + '" data-nav="' + x[0] + '">' + A.i(x[2]) + '<span>' + x[3].split(' ')[0] + '</span></a>'; }).join('') + '</nav>';
    document.getElementById('sair').onclick = A.sair;
    var sd = document.getElementById('sair-demo'); if (sd) sd.onclick = function (e) { e.preventDefault(); A.sair(); };
  }
  A.sair = function () { A.api('sair').catch(function () { }).then(function () { A.store.del('fluyan_token'); A.S.dados = null; location.hash = ''; telaEntrar(); }); };

  /* ----------------------------------------------------------------- rotas */
  A.ir = function () {
    if (!A.S.dados) return;
    var g = guiado(), areas = A.areasDoPapel();
    var h = (location.hash || '').replace('#', '').split('/')[0];
    var entrada = areas.filter(function (a) { return a.id === h; })[0];
    if (entrada) { // endereço de área: abre a última tela usada nela
      h = entrada.telas.indexOf(ultima[entrada.id]) >= 0 ? ultima[entrada.id] : entrada.telas[0];
      history.replaceState(null, '', '#' + h);
    }
    if (!pode(h)) { h = g ? 'inicio' : telasDiretas()[0]; history.replaceState(null, '', '#' + h); }
    var area = g ? areas.filter(function (a) { return a.telas.indexOf(h) >= 0; })[0] : null;
    if (area) ultima[area.id] = h;
    A.S.tela = h;
    var chave = g ? (area ? area.id : h) : h;
    document.querySelectorAll('[data-nav]').forEach(function (a) { var on = a.dataset.nav === chave; a.classList.toggle('ativo', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });

    var el = document.getElementById('conteudo'), sub = '';
    if (g && h !== 'inicio') {
      sub = '<nav class="subnav" aria-label="Você está em"><a class="volta" href="#inicio">' + A.i('arrow-left') + 'Início</a>' +
        (area ? '<span class="onde">' + A.i(area.icone) + area.rotulo + '</span>' +
          (area.telas.length > 1 ? '<div class="abas-area" role="tablist">' + area.telas.map(function (t) {
            return '<a href="#' + t + '" role="tab" aria-selected="' + (t === h) + '"' + (t === h ? ' class="on"' : '') + '>' + A.i(TELAS[t].icone) + A.rotuloTela(t) + '</a>'; }).join('') + '</div>' : '')
          : '<span class="onde">' + A.i(TELAS[h].icone) + TELAS[h].rotulo + '</span>') + '</nav>';
    }
    el.innerHTML = sub + '<div id="tela"></div>';
    var tela = el.querySelector('#tela');
    try { (A.telas[h] || function (e) { e.innerHTML = A.vazio('construction', 'Em construção', 'Esta tela chega na próxima etapa.'); })(tela); }
    catch (e) { console.error(e); tela.innerHTML = A.vazio('circle-alert', 'Algo deu errado', e.message); }
    A.icones();
    if (h !== telaAnterior) { window.scrollTo(0, 0); telaAnterior = h; }
  };
  /** Recarrega os dados e redesenha a tela atual. */
  A.atualizar = function () { return A.recarregar().then(A.ir); };

  A.iniciar = function () {
    var conv = (location.hash.match(/^#convite=([\w-]+)/) || [])[1];
    if (conv) return telaConvite(conv);
    var auto = A.ehDemo() && new URLSearchParams(location.search).get('entrar');
    if (auto !== null && auto !== false && window.DEMO_CONTAS && window.DEMO_CONTAS[auto] && !A.S.autoEntrou) { // link direto da demonstração: ?demo=1&entrar=0
      A.S.autoEntrou = true; A.store.del('fluyan_token');
      return entrar({ email: window.DEMO_CONTAS[auto].email, senha: window.DEMO_CONTAS[auto].senha });
    }
    if (!A.store.get('fluyan_token')) return telaEntrar();
    ultima = {}; telaAnterior = '';
    A.recarregar().then(function () { casca(); A.ir(); }).catch(function (e) { telaEntrar(e.codigo === 'sessao' ? '' : e.message); });
  };
  window.addEventListener('hashchange', function () { if (/^#convite=/.test(location.hash)) A.iniciar(); else A.ir(); });
  document.addEventListener('DOMContentLoaded', A.iniciar);
})();
