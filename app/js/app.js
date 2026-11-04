/* ==========================================================================
   FLUYAN — casca do painel: entrada, menu por papel e rotas
   ========================================================================== */
(function () {
  'use strict';
  var A = window.A;
  A.telas = A.telas || {};

  var MENU = [
    { id: 'inicio', rotulo: 'Início', icone: 'layout-dashboard', papeis: ['titular', 'medico', 'secretaria'] },
    { id: 'agenda', rotulo: 'Agenda', icone: 'calendar-days', papeis: ['titular', 'medico', 'secretaria', 'clinica'] },
    { id: 'pacientes', rotulo: 'Pacientes', icone: 'users-round', papeis: ['titular', 'medico', 'secretaria'] },
    { id: 'locais', rotulo: 'Locais e clínicas', icone: 'building-2', papeis: ['titular', 'medico'] },
    { id: 'servicos', rotulo: 'Serviços e planos', icone: 'stethoscope', papeis: ['titular', 'medico'] },
    { grupo: 'Presença digital', papeis: ['titular', 'medico'] },
    { id: 'estudio', rotulo: 'Estúdio', icone: 'sparkles', papeis: ['titular', 'medico'] },
    { id: 'conteudo', rotulo: 'Conteúdo', icone: 'calendar-range', papeis: ['titular', 'medico'] },
    { id: 'pagina', rotulo: 'Minha página', icone: 'panels-top-left', papeis: ['titular', 'medico'] },
    { grupo: 'Gestão', papeis: ['titular', 'medico', 'secretaria'] },
    { id: 'financeiro', rotulo: 'Financeiro', icone: 'wallet', papeis: ['titular', 'medico', 'secretaria'] },
    { id: 'equipe', rotulo: 'Equipe e acessos', icone: 'user-cog', papeis: ['titular'] },
    { id: 'perfil', rotulo: 'Perfil', icone: 'badge-check', papeis: ['titular', 'medico', 'secretaria', 'clinica'] },
    { id: 'admin', rotulo: 'Clientes', icone: 'briefcase-medical', papeis: ['admin'] },
    { id: 'auditoria', rotulo: 'Auditoria', icone: 'scroll-text', papeis: ['admin'] }
  ];
  function menuDoPapel() { var p = A.S.dados.eu.papel; return MENU.filter(function (m) { return m.papeis.indexOf(p) >= 0; }); }

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
    return A.api('entrar', d).then(function (r) { A.store.set('fluyan_token', r.token); A.iniciar(); }).catch(function (e) { A.aviso(e.message, true); });
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
  function casca() {
    var d = A.S.dados, eu = d.eu, itens = menuDoPapel();
    var nav = itens.map(function (m) {
      if (m.grupo) return '<div class="grupo">' + m.grupo + '</div>';
      return '<a class="item" href="#' + m.id + '" data-tela="' + m.id + '">' + A.i(m.icone) + m.rotulo + '</a>';
    }).join('');
    var principais = itens.filter(function (m) { return m.id; }).slice(0, 4);
    document.getElementById('raiz').innerHTML =
      (A.ehDemo() ? '<div class="demo-faixa">Demonstração com dados fictícios. Nada aqui é real. <a href="#" id="sair-demo">Sair</a></div>' : '') +
      '<div class="casca"><nav class="lateral" aria-label="Menu principal"><a class="marca" href="#inicio">' + A.simbolo(32, 'var(--mf-petroleo-2)') + '<span class="nome">Fluyan</span></a>' + nav +
      '<div class="rodape"><b>' + A.esc(eu.nome) + '</b><small>' + A.esc(A.PAPEL[eu.papel]) + (d.tenant ? ' · ' + A.esc(d.tenant.nome) : '') + '</small><br>' +
      '<button id="sair">' + A.i('log-out') + 'Sair</button></div></nav>' +
      '<main class="area" id="conteudo" tabindex="-1"></main></div>' +
      '<nav class="barra-movel" aria-label="Menu">' + principais.map(function (m) { return '<a href="#' + m.id + '" data-tela="' + m.id + '">' + A.i(m.icone) + '<span>' + m.rotulo.split(' ')[0] + '</span></a>'; }).join('') +
      (itens.filter(function (m) { return m.id; }).length > 4 ? '<button id="mais">' + A.i('menu') + '<span>Mais</span></button>' : '') + '</nav>';
    document.getElementById('sair').onclick = sair;
    var sd = document.getElementById('sair-demo'); if (sd) sd.onclick = function (e) { e.preventDefault(); sair(); };
    var mais = document.getElementById('mais');
    if (mais) mais.onclick = function () {
      var m = A.modal({ titulo: 'Menu', corpo: '<ul class="lista">' + itens.filter(function (x) { return x.id; }).map(function (x) {
        return '<li class="clicavel" data-ir="' + x.id + '">' + A.i(x.icone) + '<span class="meio"><b>' + x.rotulo + '</b></span>' + A.i('chevron-right') + '</li>'; }).join('') +
        '<li class="clicavel" data-ir="sair">' + A.i('log-out') + '<span class="meio"><b>Sair</b></span></li></ul>' });
      m.el.querySelectorAll('[data-ir]').forEach(function (li) { li.onclick = function () { m.fechar(); if (li.dataset.ir === 'sair') sair(); else location.hash = li.dataset.ir; }; });
    };
  }
  function sair() { A.api('sair').catch(function () { }).then(function () { A.store.del('fluyan_token'); A.S.dados = null; location.hash = ''; telaEntrar(); }); }

  /* ----------------------------------------------------------------- rotas */
  A.ir = function () {
    if (!A.S.dados) return;
    var itens = menuDoPapel().filter(function (m) { return m.id; });
    var tela = (location.hash || '').replace('#', '').split('/')[0];
    if (!itens.some(function (m) { return m.id === tela; })) tela = itens[0].id;
    A.S.tela = tela;
    document.querySelectorAll('[data-tela]').forEach(function (a) { a.classList.toggle('ativo', a.dataset.tela === tela); });
    var el = document.getElementById('conteudo');
    try { (A.telas[tela] || function (e) { e.innerHTML = A.vazio('construction', 'Em construção', 'Esta tela chega na próxima etapa.'); })(el); }
    catch (e) { console.error(e); el.innerHTML = A.vazio('circle-alert', 'Algo deu errado', e.message); }
    A.icones();
    window.scrollTo(0, 0);
  };
  /** Recarrega os dados e redesenha a tela atual. */
  A.atualizar = function () { return A.recarregar().then(A.ir); };

  A.iniciar = function () {
    var conv = (location.hash.match(/^#convite=([\w-]+)/) || [])[1];
    if (conv) return telaConvite(conv);
    if (!A.store.get('fluyan_token')) return telaEntrar();
    A.recarregar().then(function () { casca(); A.ir(); }).catch(function (e) { telaEntrar(e.codigo === 'sessao' ? '' : e.message); });
  };
  window.addEventListener('hashchange', function () { if (/^#convite=/.test(location.hash)) A.iniciar(); else A.ir(); });
  document.addEventListener('DOMContentLoaded', A.iniciar);
})();
