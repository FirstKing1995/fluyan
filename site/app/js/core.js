/* ==========================================================================
   FLUYAN — núcleo da interface: API, estado, utilitários e componentes
   ========================================================================== */
(function () {
  'use strict';
  var A = window.A = {};
  var CFG = window.FLUYAN_CONFIG || {};

  /* ---------------------------------------------------------- armazenamento */
  A.store = {
    get: function (k, p) { try { var v = localStorage.getItem(k); return v === null ? p : JSON.parse(v); } catch (e) { return p; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }
  };

  var qs = new URLSearchParams(location.search);
  if (qs.get('demo') === '1') A.store.set('fluyan_modo', 'demo');
  if (qs.get('demo') === '0') A.store.del('fluyan_modo');
  A.ehDemo = function () { return !CFG.API_URL || A.store.get('fluyan_modo') === 'demo'; };

  /* ---------------------------------------------------------------- API */
  A.api = function (acao, dados) {
    var req = { acao: acao, token: A.store.get('fluyan_token', ''), dados: dados || {} };
    var p = A.ehDemo()
      ? new Promise(function (ok) { setTimeout(function () { ok(window.DEMO.processar(req)); }, acao === 'estudio' ? 900 : 60); })
      : fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(req) })
        .then(function (r) { return r.json(); })
        .catch(function () { return { ok: false, erro: 'Sem conexão com o servidor. Confira sua internet.' }; });
    return p.then(function (r) {
      if (r.ok) return r.dados;
      if (r.codigo === 'sessao' || r.codigo === 'suspenso') { A.store.del('fluyan_token'); if (acao !== 'entrar') { A.aviso(r.erro, true); A.iniciar(); } }
      var e = new Error(r.erro || 'Erro'); e.codigo = r.codigo; throw e;
    });
  };

  /* -------------------------------------------------------------- estado */
  A.S = { dados: null, tela: 'inicio' };
  A.recarregar = function () { return A.api('carregar').then(function (d) { A.S.dados = d; return d; }); };

  /* --------------------------------------------------------- utilitários */
  A.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  A.norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  A.brl = function (c) { return (Number(c || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
  A.centavos = function (v) { var s = String(v || '').replace(/[R$\s.]/g, '').replace(',', '.'); var n = Number(s); return isFinite(n) ? Math.round(n * 100) : 0; };
  A.reais = function (c) { return c ? (Number(c) / 100).toFixed(2).replace('.', ',') : ''; };
  A.hoje = function () { return (A.S.dados && A.S.dados.agora || new Date().toISOString()).slice(0, 10); };
  A.somarDias = function (d, n) { var p = d.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10); };
  var DSEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], DSEML = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  A.DIAS = DSEML;
  A.dsem = function (d) { var p = d.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); };
  A.fmtData = function (d, longo) {
    if (!d) return '—'; d = d.slice(0, 10); var p = d.split('-');
    return longo ? DSEML[A.dsem(d)] + ', ' + Number(p[2]) + ' de ' + ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][Number(p[1]) - 1]
      : DSEM[A.dsem(d)] + ' ' + p[2] + '/' + MESES[Number(p[1]) - 1];
  };
  A.fmtDataCurta = function (d) { if (!d) return '—'; var p = d.slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
  A.hora = function (iso) { return String(iso || '').slice(11, 16); };
  A.fone = function (w) { w = String(w || ''); if (w.length === 11) return '(' + w.slice(0, 2) + ') ' + w.slice(2, 7) + '-' + w.slice(7); if (w.length === 10) return '(' + w.slice(0, 2) + ') ' + w.slice(2, 6) + '-' + w.slice(6); return w; };
  A.iniciais = function (n) { return String(n || '?').replace(/^(dra?|dr)\.?\s+/i, '').split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0); }).join('').toUpperCase(); };
  A.porId = function (lista, id) { return (A.S.dados[lista] || []).filter(function (x) { return x.id === id; })[0] || null; };
  A.json = function (v, p) { if (v && typeof v === 'object') return v; try { return v ? JSON.parse(v) : p; } catch (e) { return p; } };
  A.wa = function (numero, texto) { var n = String(numero || '').replace(/\D/g, ''); if (n && n.length <= 11) n = '55' + n; return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto || ''); };
  A.urlBase = function () { return location.href.split('/app/')[0]; };

  A.STATUS_AG = {
    reservado_temp: ['Reservando', 'c-ne'], pendente: ['Pendente', 'c-al'], confirmado: ['Confirmado', 'c-ok'], em_atendimento: ['Em atendimento', 'c-in'],
    concluido: ['Concluído', 'c-sa'], cancelado: ['Cancelado', 'c-ne'], reagendamento_solicitado: ['Alteração pedida', 'c-al'], nao_compareceu: ['Não compareceu', 'c-er']
  };
  A.chipAg = function (s) { var x = A.STATUS_AG[s] || [s, 'c-ne']; return '<span class="chip ponto ' + x[1] + '">' + x[0] + '</span>'; };
  A.ETAPAS = { novo: 'Novo contato', interessado: 'Interessado', aguardando: 'Aguardando agendamento', agendado: 'Agendado', ativo: 'Paciente ativo',
    acompanhamento: 'Acompanhamento', inativo: 'Inativo', arquivado: 'Arquivado' };
  A.STATUS_CNT = { ideia: ['Ideia', 'c-ne'], producao: ['Em produção', 'c-in'], revisao: ['Revisão', 'c-al'], aprovado: ['Aprovado', 'c-ok'], agendado: ['Agendado', 'c-sa'],
    publicado: ['Publicado', 'c-ok'], reprovado: ['Reprovado', 'c-er'], arquivado: ['Arquivado', 'c-ne'], falha: ['Falha', 'c-er'] };
  A.PAPEL = { titular: 'Titular', medico: 'Médico', secretaria: 'Secretária', clinica: 'Clínica parceira', admin: 'Administrador' };

  /* ---------------------------------------------------------- componentes */
  A.icones = function () { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } }); };
  A.i = function (nome) { return '<i data-lucide="' + nome + '"></i>'; };
  A.simbolo = function (tam, cor) {
    return '<svg width="' + tam + '" height="' + tam + '" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="15" fill="' + (cor || 'var(--mf-petroleo)') +
      '"/><path d="M24 13v22M13 24h6.5c4.2 0 5.6-6 9.8-6H35" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };
  var avisoT;
  A.aviso = function (msg, erro) {
    var el = document.querySelector('.aviso'); if (el) el.remove();
    el = document.createElement('div'); el.className = 'aviso' + (erro ? ' erro' : ''); el.setAttribute('role', 'status');
    el.innerHTML = A.i(erro ? 'circle-alert' : 'check') + '<span>' + A.esc(msg) + '</span>';
    document.body.appendChild(el); A.icones();
    clearTimeout(avisoT); avisoT = setTimeout(function () { el.remove(); }, erro ? 5200 : 3200);
  };
  /** Modal genérico. o = {titulo, corpo (html), botoes:[{rotulo, classe, acao(fechar, el)}], largo, aoAbrir(el)} */
  A.modal = function (o) {
    var fundo = document.createElement('div'); fundo.className = 'fundo';
    fundo.innerHTML = '<div class="modal' + (o.largo ? ' largo' : '') + '" role="dialog" aria-modal="true" aria-label="' + A.esc(o.titulo) + '">' +
      '<header><h2>' + A.esc(o.titulo) + '</h2><button class="btn btn-g btn-icone" data-fechar aria-label="Fechar">' + A.i('x') + '</button></header>' +
      '<div class="corpo">' + o.corpo + '</div><footer></footer></div>';
    var rodape = fundo.querySelector('footer');
    function fechar() { fundo.remove(); document.removeEventListener('keydown', esc); if (o.aoFechar) o.aoFechar(); }
    function esc(e) { if (e.key === 'Escape') fechar(); }
    (o.botoes || []).forEach(function (b) {
      var bt = document.createElement('button'); bt.className = 'btn ' + (b.classe || 'btn-s'); bt.innerHTML = b.rotulo;
      bt.onclick = function () {
        var r = b.acao ? b.acao(fechar, fundo) : fechar();
        if (r && r.then) { bt.disabled = true; r.then(function () { bt.disabled = false; }, function (e) { bt.disabled = false; A.aviso(e.message, true); }); }
      };
      rodape.appendChild(bt);
    });
    if (!rodape.children.length) rodape.remove();
    fundo.addEventListener('mousedown', function (e) { if (e.target === fundo) fechar(); });
    fundo.querySelector('[data-fechar]').onclick = fechar;
    document.addEventListener('keydown', esc);
    document.body.appendChild(fundo); A.icones();
    var foco = fundo.querySelector('input, select, textarea'); if (foco) setTimeout(function () { foco.focus(); }, 50);
    if (o.aoAbrir) o.aoAbrir(fundo, fechar);
    return { el: fundo, fechar: fechar };
  };
  A.confirmar = function (titulo, texto, rotulo, perigo) {
    return new Promise(function (ok) {
      A.modal({ titulo: titulo, corpo: '<p class="muted" style="margin:0">' + A.esc(texto) + '</p>', botoes: [
        { rotulo: 'Voltar', acao: function (f) { f(); ok(false); } },
        { rotulo: rotulo || 'Confirmar', classe: perigo ? 'btn-perigo' : 'btn-p', acao: function (f) { f(); ok(true); } }] });
    });
  };
  /** Lê os campos [name] de um elemento em objeto. Checkbox = booleano; name terminado em [] = lista. */
  A.form = function (el) {
    var o = {};
    el.querySelectorAll('[name]').forEach(function (c) {
      var n = c.name;
      if (n.slice(-2) === '[]') { n = n.slice(0, -2); o[n] = o[n] || []; if (c.checked) o[n].push(c.value); return; }
      o[n] = c.type === 'checkbox' ? c.checked : c.value;
    });
    return o;
  };
  A.campo = function (rotulo, nome, valor, extra) {
    extra = extra || {};
    var attrs = ' name="' + nome + '" id="f-' + nome + '"' + (extra.req ? ' required' : '') + (extra.ph ? ' placeholder="' + A.esc(extra.ph) + '"' : '') + (extra.attrs || '');
    var ctl;
    if (extra.opcoes) ctl = '<select' + attrs + '>' + extra.opcoes.map(function (op) { var v = Array.isArray(op) ? op[0] : op, r = Array.isArray(op) ? op[1] : op; return '<option value="' + A.esc(v) + '"' + (String(v) === String(valor) ? ' selected' : '') + '>' + A.esc(r) + '</option>'; }).join('') + '</select>';
    else if (extra.area) ctl = '<textarea' + attrs + '>' + A.esc(valor) + '</textarea>';
    else ctl = '<input type="' + (extra.tipo || 'text') + '" value="' + A.esc(valor == null ? '' : valor) + '"' + attrs + '>';
    return '<label class="campo' + (extra.classe ? ' ' + extra.classe : '') + '" for="f-' + nome + '"><span>' + A.esc(rotulo) + '</span>' + ctl + (extra.ajuda ? '<small>' + A.esc(extra.ajuda) + '</small>' : '') + '</label>';
  };
  A.vazio = function (icone, titulo, texto, botao) {
    return '<div class="vazio">' + A.i(icone) + '<b>' + A.esc(titulo) + '</b><div>' + A.esc(texto) + '</div>' + (botao || '') + '</div>';
  };
  A.copiar = function (texto) {
    (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject()).then(function () { A.aviso('Copiado.'); }, function () { window.prompt('Copie:', texto); });
  };
  A.baixar = function (nome, blob) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  var scripts = {};
  A.carregarScript = function (url) {
    return scripts[url] || (scripts[url] = new Promise(function (ok, erro) {
      var s = document.createElement('script'); s.src = url; s.onload = ok; s.onerror = function () { delete scripts[url]; erro(new Error('Não foi possível carregar um componente. Confira sua internet.')); };
      document.head.appendChild(s);
    }));
  };
})();
