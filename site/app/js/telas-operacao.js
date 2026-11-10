/* ==========================================================================
   FLUYAN — telas de operação: início, agenda, pacientes, financeiro
   ========================================================================== */
(function () {
  'use strict';
  var A = window.A, T = A.telas = A.telas || {};
  var esc = A.esc, i = A.i;

  function nomeLocal(vinculoId) {
    var v = A.porId('vinculos', vinculoId); if (!v) return '—';
    var l = A.porId('locais', v.local_id); return l ? l.nome : '—';
  }
  function nomePac(id) { var p = A.porId('pacientes', id); return p ? p.nome : 'Paciente'; }
  function nomeSrv(id) { var s = A.porId('servicos', id); return s ? s.nome : 'Serviço'; }
  var ATIVOS = { pendente: 1, confirmado: 1, em_atendimento: 1, reagendamento_solicitado: 1 };

  /* ================================================================ INÍCIO */
  T.inicio = function (el) {
    var d = A.S.dados, hoje = A.hoje(), eu = d.eu;
    var ags = d.agendamentos.filter(function (a) { return ATIVOS[a.status]; });
    var deHoje = ags.filter(function (a) { return a.inicio.slice(0, 10) === hoje; }).sort(ordem);
    var semana = ags.filter(function (a) { var x = a.inicio.slice(0, 10); return x >= hoje && x <= A.somarDias(hoje, 6); }).length;
    var proximo = ags.filter(function (a) { return a.inicio >= d.agora; }).sort(ordem)[0];
    var conteudos = d.conteudos || [], revisar = conteudos.filter(function (c) { return c.status === 'revisao'; });
    var pendentes = ags.filter(function (a) { return a.status === 'pendente'; }).length;
    var alteracoes = ags.filter(function (a) { return a.status === 'reagendamento_solicitado'; }).length;
    var abaixo = d.ocupacao.filter(function (o) { return o.data >= hoje && o.data <= A.somarDias(hoje, 6) && o.abaixo_minimo && o.situacao !== 'fechada'; });
    var aReceber = (d.financeiro || []).filter(function (f) { return f.status === 'pendente'; });
    var somaReceber = aReceber.reduce(function (s, f) { return s + Number(f.valor_centavos); }, 0);
    var medico = d.medicos[0] || {};
    var nomeSaud = eu.papel === 'secretaria' ? eu.nome.split(' ')[0] : (medico.nome_publico || eu.nome);
    var h = Number((d.agora || '').slice(11, 13));
    var saud = h < 12 ? 'Bom dia' : (h < 18 ? 'Boa tarde' : 'Boa noite');
    var passos = primeirosPassos(), areas = A.areasDoPapel();

    /* o que pede uma ação agora: [ícone, título, detalhe, destino, botão] */
    var atencao = [];
    if (alteracoes) atencao.push(['calendar-clock', alteracoes + (alteracoes > 1 ? ' pedidos de alteração' : ' pedido de alteração'), 'Uma clínica ou paciente pediu para mudar o horário.', 'agenda', 'Ver na agenda']);
    if (pendentes) atencao.push(['calendar-check', pendentes + (pendentes > 1 ? ' agendamentos aguardando' : ' agendamento aguardando') + ' confirmação', 'Confirme ou recuse para liberar o horário.', 'agenda', 'Confirmar']);
    if (abaixo.length) atencao.push(['triangle-alert', abaixo.length + (abaixo.length > 1 ? ' dias abaixo do mínimo' : ' dia abaixo do mínimo') + ' nesta semana', abaixo.slice(0, 3).map(function (o) { return A.fmtData(o.data) + ' · ' + nomeLocal(o.vinculo_id) + ' (' + o.ocupacao + ' de ' + o.min + ')'; }).join(' · '), 'agenda', 'Ver dias']);
    if (revisar.length) atencao.push(['sparkles', revisar.length + (revisar.length > 1 ? ' conteúdos esperando' : ' conteúdo esperando') + ' sua revisão', 'Nada é publicado sem a sua aprovação.', 'conteudo', 'Revisar']);
    if (d.financeiro && aReceber.length) atencao.push(['wallet', A.brl(somaReceber) + ' a receber', aReceber.length + ' lançamentos pendentes de consultas concluídas.', 'financeiro', 'Ver lançamentos']);

    var resumo = {
      atender: deHoje.length + (deHoje.length === 1 ? ' consulta hoje' : ' consultas hoje') + ' · ' + semana + ' nos próximos 7 dias',
      divulgar: revisar.length ? revisar.length + ' para revisar · ' + conteudos.length + ' no calendário' : conteudos.length + (conteudos.length === 1 ? ' conteúdo no calendário' : ' conteúdos no calendário'),
      organizar: d.locais.filter(function (l) { return l.status === 'ativo'; }).length + ' locais · ' + d.servicos.filter(function (s) { return s.status === 'ativo'; }).length + ' serviços',
      resultados: d.financeiro ? A.brl(somaReceber) + ' a receber' : ''
    };

    el.innerHTML = '<div class="topo"><div><h1>' + saud + ', ' + esc(nomeSaud) + '</h1><p>' + A.fmtData(hoje, true) +
      (proximo ? ' · próximo atendimento ' + (proximo.inicio.slice(0, 10) === hoje ? 'hoje' : A.fmtData(proximo.inicio)) + ' às ' + A.hora(proximo.inicio) : '') + '</p></div>' +
      '<div class="acoes"><button class="btn btn-p" id="novo-ag">' + i('calendar-plus') + 'Agendar</button></div></div>' +

      (passos.falta.length ? '<div class="cartao passos"><header><h2>Primeiros passos</h2><span class="chip c-sa">' + passos.feitos + ' de ' + passos.total + '</span></header>' +
        '<div class="barra" style="margin-bottom:14px"><i style="width:' + Math.round(passos.feitos / passos.total * 100) + '%"></i></div><ul class="lista">' +
        passos.falta.map(function (p, n) { return '<li class="clicavel" data-ir="' + p[2] + '">' + i(n === 0 ? 'circle-arrow-right' : 'circle') + '<span class="meio"><b>' + p[0] + '</b><small>' + p[1] + '</small></span>' + (n === 0 ? '<span class="chip c-sa">Comece aqui</span>' : i('chevron-right')) + '</li>'; }).join('') + '</ul></div>' : '') +

      '<h2 class="titulo-bloco">O que você quer fazer?</h2><div class="areas">' + areas.map(function (a) {
        return '<div class="area-card"><a class="area-principal" href="#' + a.id + '"><span class="area-ic">' + i(a.icone) + '</span><span class="area-tx"><b>' + a.rotulo + '</b><span>' + a.desc + '</span>' +
          (resumo[a.id] ? '<em>' + esc(resumo[a.id]) + '</em>' : '') + '</span>' + i('arrow-right') + '</a>' +
          '<div class="area-atalhos">' + a.telas.map(function (t) { return '<a href="#' + t + '">' + i(A.iconeTela(t)) + A.rotuloTela(t) + '</a>'; }).join('') + '</div></div>';
      }).join('') + '</div>' +

      '<div class="grade g2" style="margin-top:14px;align-items:start">' +
      '<div class="cartao"><header><h2>Precisa da sua atenção</h2>' + (atencao.length ? '<span class="chip c-al">' + atencao.length + '</span>' : '') + '</header>' +
      (atencao.length ? '<ul class="lista">' + atencao.map(function (x) {
        return '<li><span class="avatar">' + i(x[0]) + '</span><span class="meio"><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></span><a class="btn btn-s btn-pq" href="#' + x[3] + '">' + x[4] + '</a></li>'; }).join('') + '</ul>'
        : A.vazio('circle-check-big', 'Tudo em dia', 'Nenhuma pendência agora.')) + '</div>' +
      '<div class="cartao"><header><h2>Atendimentos de hoje</h2><a class="btn btn-g btn-pq" href="#agenda">Agenda ' + i('arrow-right') + '</a></header>' +
      (deHoje.length ? '<ul class="lista">' + deHoje.slice(0, 6).map(linhaAg).join('') + '</ul>' + (deHoje.length > 6 ? '<p class="peq muted" style="margin:8px 0 0">e mais ' + (deHoje.length - 6) + ' na agenda</p>' : '')
        : A.vazio('coffee', 'Nenhum atendimento hoje', proximo ? 'O próximo é ' + A.fmtData(proximo.inicio) + ' às ' + A.hora(proximo.inicio) + '.' : 'Os próximos aparecem na agenda.')) + '</div></div>';
    el.querySelector('#novo-ag').onclick = function () { novoAgendamento(); };
    el.querySelectorAll('[data-ir]').forEach(function (li) { li.onclick = function () { location.hash = li.dataset.ir; }; });
    ligarAcoesAg(el);
  };
  function kpi(ic, rot, val, sub) { return '<div class="cartao kpi"><small>' + i(ic) + rot + '</small><b>' + val + '</b><span>' + sub + '</span></div>'; }
  function primeirosPassos() {
    var d = A.S.dados, m = d.medicos[0] || {};
    var lista = [
      [!!m.registro, 'Complete seu perfil profissional', 'Registro no conselho e apresentação', 'perfil'],
      [d.servicos.length > 0, 'Cadastre seus serviços', 'Duração, modalidade e preço', 'servicos'],
      [d.vinculos.length > 0, 'Configure locais e horários', 'Clínicas, dias, mínimo e máximo', 'locais'],
      [(d.conteudos || []).length > 0, 'Crie seu primeiro conteúdo', 'O Estúdio prepara para você revisar', 'estudio']
    ];
    if (d.eu.papel === 'secretaria') lista = lista.slice(1, 3);
    return { total: lista.length, feitos: lista.filter(function (x) { return x[0]; }).length, falta: lista.filter(function (x) { return !x[0]; }).map(function (x) { return x.slice(1); }) };
  }
  function barraOcup(o) {
    var pct = o.max ? Math.min(100, o.ocupacao / o.max * 100) : 0, pmin = o.max && o.min ? o.min / o.max * 100 : -10;
    var chip = o.situacao === 'provisoria' ? '<span class="chip c-al">Provisória</span>' : (o.situacao === 'fechada' ? '<span class="chip c-ne">Fechada</span>' : (o.lotado ? '<span class="chip c-er">Lotado</span>' : (o.abaixo_minimo ? '<span class="chip c-al">Abaixo do mínimo</span>' : '')));
    return '<div class="ocup"><span><b>' + A.fmtData(o.data) + '</b><br><small class="muted">' + esc(nomeLocal(o.vinculo_id)) + '</small></span>' +
      '<div><div class="barra"><i style="width:' + pct + '%"></i>' + (pmin >= 0 ? '<span class="min" style="left:' + pmin + '%"></span>' : '') + '</div></div>' +
      '<span class="linha-f" style="justify-content:flex-end">' + chip + '<b style="font-variant-numeric:tabular-nums">' + o.ocupacao + (o.max ? '/' + o.max : '') + '</b></span></div>';
  }
  function ordem(a, b) { return a.inicio < b.inicio ? -1 : 1; }
  function linhaAg(a) {
    return '<li class="clicavel" data-ag="' + a.id + '"><span class="hora">' + A.hora(a.inicio) + '</span><span class="meio"><b>' + esc(nomePac(a.paciente_id)) + '</b><small>' +
      esc(nomeSrv(a.servico_id)) + ' · ' + esc(nomeLocal(a.vinculo_id)) + '</small></span>' + A.chipAg(a.status) + '</li>';
  }
  function ligarAcoesAg(el) { el.querySelectorAll('[data-ag]').forEach(function (li) { li.onclick = function () { detalheAg(li.dataset.ag); }; }); }

  /* ------------------------------------------------- detalhe do agendamento */
  function detalheAg(id) {
    var a = A.porId('agendamentos', id); if (!a) return;
    var p = A.porId('pacientes', a.paciente_id) || {}, papel = A.S.dados.eu.papel, clinica = papel === 'clinica';
    var acoes = clinica ? [['reagendamento_solicitado', 'Pedir alteração', 'btn-s'], ['cancelado', 'Cancelar', 'btn-perigo']]
      : ({ pendente: [['confirmado', 'Confirmar', 'btn-p'], ['cancelado', 'Cancelar', 'btn-perigo']],
        confirmado: [['concluido', 'Concluir', 'btn-p'], ['nao_compareceu', 'Não compareceu', 'btn-s'], ['cancelado', 'Cancelar', 'btn-perigo']],
        reagendamento_solicitado: [['confirmado', 'Manter', 'btn-p'], ['cancelado', 'Cancelar', 'btn-perigo']],
        nao_compareceu: [['confirmado', 'Desfazer falta', 'btn-s']] })[a.status] || [];
    if (!ATIVOS[a.status] && clinica) acoes = [];
    var texto = 'Olá, ' + (p.nome || '').split(' ')[0] + '. Confirmando seu atendimento em ' + A.fmtData(a.inicio, true) + ' às ' + A.hora(a.inicio) + ', ' + nomeLocal(a.vinculo_id) + '. Código ' + a.codigo + '.';
    var botoes = acoes.map(function (x) {
      return { rotulo: x[1], classe: x[2], acao: function (fechar) {
        var pede = x[0] === 'cancelado' || x[0] === 'reagendamento_solicitado';
        var pr = pede ? A.perguntar(x[1] + ' este atendimento?', nomePac(a.paciente_id) + ' · ' + A.fmtData(a.inicio) + ' às ' + A.hora(a.inicio) + '.', { rotulo: 'Motivo (opcional)', confirmar: x[1], perigo: x[0] === 'cancelado' }) : Promise.resolve('');
        return pr.then(function (motivo) {
          if (motivo === null) return;
          return A.api('agStatus', { id: a.id, status: x[0], motivo: motivo }).then(function (r) { fechar(); A.aviso(r.status === 'reagendamento_solicitado' && x[0] === 'cancelado' ? 'Fora do prazo: enviamos como pedido de alteração.' : 'Atualizado.'); return A.atualizar(); });
        });
      } };
    });
    if (!clinica && ATIVOS[a.status]) botoes.unshift({ rotulo: i('calendar-clock') + 'Remarcar', acao: function (fechar) { fechar(); novoAgendamento({ remarcar: a }); } });
    A.modal({ titulo: nomePac(a.paciente_id), corpo:
      '<div class="linha-f" style="margin-bottom:14px">' + A.chipAg(a.status) + (a.excecao_limite ? '<span class="chip c-al">Acima do máximo</span>' : '') + '<span class="chip c-ne">Código ' + esc(a.codigo) + '</span></div>' +
      '<ul class="lista"><li>' + i('calendar') + '<span class="meio"><b>' + A.fmtData(a.inicio, true) + ', ' + A.hora(a.inicio) + ' às ' + A.hora(a.fim) + '</b><small>' + esc(nomeSrv(a.servico_id)) + '</small></span></li>' +
      '<li>' + i('map-pin') + '<span class="meio"><b>' + esc(nomeLocal(a.vinculo_id)) + '</b><small>Origem: ' + esc({ painel: 'painel', clinica: 'clínica parceira', pagina: 'página pública' }[a.origem] || a.origem) + '</small></span></li>' +
      (p.whatsapp ? '<li>' + i('message-circle') + '<span class="meio"><b>' + A.fone(p.whatsapp) + '</b><small>' + (p.consente_whatsapp === 'sim' || clinica ? 'Contato liberado' : 'Sem consentimento de mensagens') + '</small></span>' +
        '<a class="btn btn-s btn-pq" target="_blank" rel="noopener" href="' + A.wa(p.whatsapp, texto) + '">' + i('send') + 'Confirmar</a></li>' : '') +
      (a.motivo ? '<li>' + i('message-square-text') + '<span class="meio"><b>Observação</b><small>' + esc(a.motivo) + '</small></span></li>' : '') + '</ul>',
      botoes: botoes });
  }

  /* ================================================================ AGENDA */
  var agFiltro = { local: '', de: '', vista: 'lista' };
  T.agenda = function (el) {
    var d = A.S.dados, hoje = A.hoje(), clinica = d.eu.papel === 'clinica';
    if (!agFiltro.de) agFiltro.de = hoje;
    var vincs = d.vinculos.filter(function (v) { return v.status === 'ativo'; });
    var dias = []; for (var k = 0; k < 7; k++) dias.push(A.somarDias(agFiltro.de, k));
    var ags = d.agendamentos.filter(function (a) { return a.status !== 'reservado_temp' && a.status !== 'cancelado' && (!agFiltro.local || a.vinculo_id === agFiltro.local); });
    var titulo = clinica ? 'Agenda · ' + esc((d.locais[0] || {}).nome || '') : 'Agenda';
    var medicoInfo = clinica && d.medicos.length ? '<p>' + d.medicos.map(function (m) { return esc(m.nome_publico) + ' · ' + esc(m.especialidade || ''); }).join(' · ') + '</p>' : '<p>Todos os locais, em uma só agenda.</p>';
    el.innerHTML = '<div class="topo"><div><h1>' + titulo + '</h1>' + medicoInfo + '</div><div class="acoes">' +
      (!clinica ? '<button class="btn btn-s" id="bloquear">' + i('calendar-x') + 'Bloquear período</button>' : '') +
      '<button class="btn btn-p" id="novo-ag">' + i('calendar-plus') + 'Agendar</button></div></div>' +
      '<div class="entre" style="margin-bottom:14px;flex-wrap:wrap"><div class="linha-f">' +
      '<button class="btn btn-s btn-icone" id="ant" aria-label="Semana anterior">' + i('chevron-left') + '</button>' +
      '<button class="btn btn-s btn-pq" id="hoje">Hoje</button><button class="btn btn-s btn-icone" id="prox" aria-label="Próxima semana">' + i('chevron-right') + '</button>' +
      '<b style="margin-left:6px">' + A.fmtData(dias[0]) + ' a ' + A.fmtData(dias[6]) + '</b></div>' +
      (vincs.length > 1 ? '<select class="entrada" id="filtro-local" style="width:auto;min-height:38px">' + '<option value="">Todos os locais</option>' +
        vincs.map(function (v) { return '<option value="' + v.id + '"' + (agFiltro.local === v.id ? ' selected' : '') + '>' + esc(nomeLocal(v.id)) + '</option>'; }).join('') + '</select>' : '') + '</div>' +
      '<div class="grade">' + dias.map(function (dia) {
        var doDia = ags.filter(function (a) { return a.inicio.slice(0, 10) === dia; }).sort(ordem);
        var ocups = d.ocupacao.filter(function (o) { return o.data === dia && (!agFiltro.local || o.vinculo_id === agFiltro.local); });
        if (!doDia.length && !ocups.length) return '';
        return '<div class="cartao"><header><h2>' + A.fmtData(dia, true) + (dia === hoje ? ' <span class="chip c-sa">hoje</span>' : '') + '</h2>' +
          '<div class="linha-f">' + ocups.map(function (o) {
            return '<button class="chip ' + (o.situacao === 'provisoria' ? 'c-al' : (o.situacao === 'fechada' ? 'c-ne' : (o.lotado ? 'c-er' : (o.abaixo_minimo ? 'c-al' : 'c-sa')))) + '" style="border:0;cursor:' + (clinica ? 'default' : 'pointer') + '" data-dia="' + o.vinculo_id + '|' + o.data + '">' +
              esc(nomeLocal(o.vinculo_id)) + ' ' + o.ocupacao + (o.max ? '/' + o.max : '') + (o.situacao === 'provisoria' ? ' · provisória' : '') + (o.situacao === 'fechada' ? ' · fechada' : '') + '</button>';
          }).join('') + '</div></header>' +
          (doDia.length ? '<ul class="lista">' + doDia.map(linhaAg).join('') + '</ul>' : '<p class="muted peq" style="margin:0">Nenhum agendamento.</p>') + '</div>';
      }).join('') + '</div>';
    if (!el.querySelector('.cartao')) el.querySelector('.grade').innerHTML = A.vazio('calendar', 'Sem atendimentos nesta semana', clinica ? 'Nenhuma data publicada pelo médico.' : 'Configure horários em Locais e clínicas.');
    el.querySelector('#ant').onclick = function () { agFiltro.de = A.somarDias(agFiltro.de, -7); T.agenda(el); A.icones(); };
    el.querySelector('#prox').onclick = function () { agFiltro.de = A.somarDias(agFiltro.de, 7); T.agenda(el); A.icones(); };
    el.querySelector('#hoje').onclick = function () { agFiltro.de = hoje; T.agenda(el); A.icones(); };
    var fl = el.querySelector('#filtro-local'); if (fl) fl.onchange = function () { agFiltro.local = fl.value; T.agenda(el); A.icones(); };
    el.querySelector('#novo-ag').onclick = function () { novoAgendamento(); };
    var bl = el.querySelector('#bloquear'); if (bl) bl.onclick = bloquear;
    if (!clinica) el.querySelectorAll('[data-dia]').forEach(function (b) { b.onclick = function () { var x = b.dataset.dia.split('|'); ajustarDia(x[0], x[1]); }; });
    ligarAcoesAg(el);
  };

  function ajustarDia(vinculoId, data) {
    var o = A.S.dados.ocupacao.filter(function (x) { return x.vinculo_id === vinculoId && x.data === data; })[0] || {};
    A.modal({ titulo: nomeLocal(vinculoId) + ' · ' + A.fmtData(data), corpo:
      '<p class="muted" style="margin-top:0">Ocupação: <b>' + o.ocupacao + (o.max ? ' de ' + o.max : '') + '</b>' + (o.min ? ' · mínimo ' + o.min : '') + '. Datas provisórias aparecem para a clínica, mas não na sua página pública.</p>' +
      '<div class="campos">' + A.campo('Situação do dia', 'situacao', o.situacao, { opcoes: [['confirmada', 'Confirmada'], ['provisoria', 'Provisória'], ['fechada', 'Fechada (sem novos agendamentos)']] }) +
      A.campo('Observação', 'obs', o.obs, { ph: 'Ex.: aguardando a clínica' }) +
      A.campo('Mínimo neste dia', 'min_consultas', o.min, { tipo: 'number', attrs: ' min="0"' }) + A.campo('Máximo neste dia', 'max_consultas', o.max, { tipo: 'number', attrs: ' min="0"' }) + '</div>',
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Salvar', classe: 'btn-p', acao: function (f, el) {
        var dd = A.form(el); dd.vinculo_id = vinculoId; dd.data = data;
        return A.api('dia', dd).then(function () { f(); A.aviso('Dia atualizado.'); return A.atualizar(); });
      } }] });
  }

  function bloquear() {
    var hoje = A.hoje();
    A.modal({ titulo: 'Bloquear período', corpo: '<p class="muted" style="margin-top:0">Férias, congresso ou imprevisto. Os horários do período saem de todos os canais.</p><div class="campos">' +
      A.campo('Início', 'inicio', hoje + 'T08:00', { tipo: 'datetime-local' }) + A.campo('Fim', 'fim', hoje + 'T18:00', { tipo: 'datetime-local' }) + '</div>' +
      A.campo('Motivo', 'motivo', '', { ph: 'Ex.: congresso' }) + listaBloqueios(),
      botoes: [{ rotulo: 'Fechar' }, { rotulo: 'Bloquear', classe: 'btn-p', acao: function (f, el) { return A.api('excecao', A.form(el)).then(function () { f(); A.aviso('Período bloqueado.'); return A.atualizar(); }); } }],
      aoAbrir: function (el, f) { el.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { A.api('excecaoRemover', { id: b.dataset.rm }).then(function () { f(); A.aviso('Bloqueio removido.'); A.atualizar(); }); }; }); } });
  }
  function listaBloqueios() {
    var ex = (A.S.dados.excecoes || []).filter(function (x) { return x.fim >= A.hoje(); });
    if (!ex.length) return '';
    return '<div class="sep"></div><b class="peq">Bloqueios ativos</b><ul class="lista">' + ex.map(function (x) {
      return '<li><span class="meio"><b>' + esc(x.motivo || 'Bloqueio') + '</b><small>' + x.inicio.replace('T', ' ') + ' até ' + x.fim.replace('T', ' ') + '</small></span><button class="btn btn-g btn-pq" data-rm="' + x.id + '">Remover</button></li>';
    }).join('') + '</ul>';
  }

  /* ------------------------------------------------- novo agendamento */
  function novoAgendamento(opc) {
    opc = opc || {};
    var d = A.S.dados, clinica = d.eu.papel === 'clinica', rem = opc.remarcar;
    var vincs = d.vinculos.filter(function (v) { return v.status === 'ativo'; });
    if (!vincs.length) return A.aviso('Configure um local com horários antes de agendar.', true);
    var st = { vinculo: rem ? rem.vinculo_id : vincs[0].id, servico: rem ? rem.servico_id : '', data: '', hora: '', paciente: '' };
    var m = A.modal({ titulo: rem ? 'Remarcar' : 'Novo agendamento', largo: true, corpo: '<div id="na"></div>', botoes: [{ rotulo: 'Cancelar' }, { rotulo: rem ? 'Remarcar' : 'Agendar', classe: 'btn-p', acao: salvar }] });
    var box = m.el.querySelector('#na');
    function servicosDo(vid) { var v = A.porId('vinculos', vid); return d.servicos.filter(function (s) { return v && v.servicos.split(',').indexOf(s.id) >= 0 && s.status === 'ativo'; }); }
    function desenhar() {
      var srvs = servicosDo(st.vinculo); if (!srvs.some(function (s) { return s.id === st.servico; })) st.servico = srvs[0] ? srvs[0].id : '';
      box.innerHTML = (vincs.length > 1 ? '<div class="campo"><span>Local</span><div class="opcoes">' + vincs.map(function (v) { return '<button class="opcao' + (v.id === st.vinculo ? ' on' : '') + '" data-v="' + v.id + '">' + esc(nomeLocal(v.id)) + '</button>'; }).join('') + '</div></div>' : '') +
        (rem ? '' : '<div class="campo"><span>Serviço</span><div class="opcoes">' + srvs.map(function (s) { return '<button class="opcao' + (s.id === st.servico ? ' on' : '') + '" data-s="' + s.id + '">' + esc(s.nome) + ' <small class="muted">' + s.duracao_min + ' min</small></button>'; }).join('') + '</div></div>') +
        '<div class="campo"><span>Data</span><div class="opcoes" id="dias"><span class="carregando"></span></div></div>' +
        '<div class="campo"><span>Horário</span><div id="horas" class="muted peq">Escolha uma data.</div></div>' +
        (rem ? '' : '<div class="sep"></div><div class="campo"><span>Paciente</span><input class="entrada" id="busca-pac" placeholder="Buscar por nome ou WhatsApp" autocomplete="off"><div id="res-pac" style="margin-top:8px"></div></div>' +
          '<div id="novo-pac" hidden><div class="campos">' + A.campo('Nome completo', 'nome', '', {}) + A.campo('WhatsApp com DDD', 'whatsapp', '', { tipo: 'tel' }) + '</div>' +
          (clinica ? '' : '<label class="check"><input type="checkbox" name="consente_whatsapp"> O paciente autorizou receber mensagens pelo WhatsApp</label>') + '</div>') +
        (!clinica && !rem ? '<div id="excecao" hidden><div class="caixa al">' + i('triangle-alert') + '<span>Dia lotado. Você pode encaixar acima do máximo, com motivo registrado.</span></div>' + A.campo('Motivo do encaixe', 'motivo', '', {}) + '</div>' : '');
      A.icones();
      box.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { st.vinculo = b.dataset.v; st.data = ''; st.hora = ''; desenhar(); }; });
      box.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { st.servico = b.dataset.s; st.data = ''; st.hora = ''; desenhar(); }; });
      carregarDias();
      var bp = box.querySelector('#busca-pac');
      if (bp) { bp.oninput = buscar; buscar(); }
    }
    function carregarDias() {
      var cx = box.querySelector('#dias');
      A.api('dias', { vinculo_id: st.vinculo, servico_id: st.servico, dias: 45 }).then(function (lista) {
        lista = lista.filter(function (x) { return x.situacao !== 'fechada'; });
        if (!lista.length) { cx.innerHTML = '<span class="muted peq">Sem datas abertas para este local.</span>'; return; }
        cx.innerHTML = lista.map(function (x) {
          return '<button class="opcao' + (x.data === st.data ? ' on' : '') + '" data-d="' + x.data + '"' + (!x.livres && clinica ? ' disabled' : '') + ' title="' + x.ocupacao + (x.max ? ' de ' + x.max : '') + ' ocupadas">' +
            A.fmtData(x.data) + ' <small class="muted">' + (x.livres ? x.livres + ' livres' : 'lotado') + (x.situacao === 'provisoria' ? ' · prov.' : '') + '</small></button>';
        }).join('');
        cx.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { st.data = b.dataset.d; st.hora = ''; cx.querySelectorAll('.opcao').forEach(function (o) { o.classList.toggle('on', o === b); }); carregarHoras(); }; });
      });
    }
    function carregarHoras() {
      var cx = box.querySelector('#horas'); cx.innerHTML = '<span class="carregando"></span>';
      var exc = box.querySelector('#excecao'); if (exc) exc.hidden = true;
      A.api('horarios', { vinculo_id: st.vinculo, servico_id: st.servico, data: st.data, ignorar: rem ? rem.id : '' }).then(function (h) {
        if (!h.slots.length) {
          if (h.dia && h.dia.lotado && exc && A.S.dados.eu.papel !== 'secretaria') { exc.hidden = false; st.forcar = true; return horasLotado(cx); }
          cx.innerHTML = '<span class="muted peq">' + esc(h.motivo || 'Sem horários livres.') + '</span>'; return;
        }
        st.forcar = false;
        cx.innerHTML = '<div class="horarios">' + h.slots.map(function (s) { return '<button class="opcao" data-h="' + s + '">' + s + '</button>'; }).join('') + '</div>';
        cx.querySelectorAll('[data-h]').forEach(function (b) { b.onclick = function () { st.hora = b.dataset.h; cx.querySelectorAll('.opcao').forEach(function (o) { o.classList.toggle('on', o === b); }); }; });
      });
    }
    function horasLotado(cx) {
      A.api('horarios', { vinculo_id: st.vinculo, servico_id: st.servico, data: st.data, ignorar_maximo: true }).then(function (h) {
        if (!h.slots.length) { cx.innerHTML = '<span class="muted peq">Sem horários livres.</span>'; return; }
        cx.innerHTML = '<div class="horarios">' + h.slots.map(function (s) { return '<button class="opcao" data-h="' + s + '">' + s + '</button>'; }).join('') + '</div>';
        cx.querySelectorAll('[data-h]').forEach(function (b) { b.onclick = function () { st.hora = b.dataset.h; cx.querySelectorAll('.opcao').forEach(function (o) { o.classList.toggle('on', o === b); }); }; });
      });
    }
    function buscar() {
      var q = A.norm(box.querySelector('#busca-pac').value), res = box.querySelector('#res-pac'), np = box.querySelector('#novo-pac');
      var lista = d.pacientes.filter(function (p) { return !q || A.norm(p.nome).indexOf(q) >= 0 || (p.whatsapp || '').indexOf(q.replace(/\D/g, '') || '@') >= 0; }).slice(0, 6);
      res.innerHTML = '<div class="opcoes">' + lista.map(function (p) { return '<button class="opcao' + (p.id === st.paciente ? ' on' : '') + '" data-p="' + p.id + '">' + esc(p.nome) + '</button>'; }).join('') +
        '<button class="opcao' + (st.paciente === 'novo' ? ' on' : '') + '" data-p="novo">' + i('user-plus') + 'Novo paciente</button></div>';
      A.icones();
      np.hidden = st.paciente !== 'novo';
      res.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { st.paciente = b.dataset.p; buscar(); }; });
    }
    function salvar(fechar) {
      if (!st.data || !st.hora) return A.aviso('Escolha data e horário.', true);
      if (rem) return A.api('remarcar', { id: rem.id, vinculo_id: st.vinculo, data: st.data, hora: st.hora }).then(function () { fechar(); A.aviso('Remarcado.'); return A.atualizar(); });
      if (!st.paciente) return A.aviso('Escolha ou cadastre o paciente.', true);
      var f = A.form(box), dados = { vinculo_id: st.vinculo, servico_id: st.servico, data: st.data, hora: st.hora };
      if (st.paciente === 'novo') dados.paciente = { nome: f.nome, whatsapp: f.whatsapp, consente_whatsapp: f.consente_whatsapp };
      else dados.paciente_id = st.paciente;
      if (st.forcar) { dados.excecao_limite = true; dados.motivo = f.motivo; }
      return A.api('agendar', dados).then(function (ag) { fechar(); A.aviso(ag.status === 'pendente' ? 'Agendamento enviado. Aguarda confirmação.' : 'Agendado para ' + A.fmtData(ag.inicio) + ' às ' + A.hora(ag.inicio) + '.'); return A.atualizar(); });
    }
    desenhar();
  }
  A.novoAgendamento = novoAgendamento;

  /* ================================================================ PACIENTES */
  var pacVista = 'lista', pacBusca = '';
  T.pacientes = function (el) {
    var d = A.S.dados;
    el.innerHTML = '<div class="topo"><div><h1>Pacientes</h1><p>Cadastro administrativo. Informações clínicas não ficam aqui.</p></div><div class="acoes">' +
      '<div class="abas"><button data-v="lista" class="' + (pacVista === 'lista' ? 'on' : '') + '">Lista</button><button data-v="funil" class="' + (pacVista === 'funil' ? 'on' : '') + '">Funil</button></div>' +
      '<button class="btn btn-p" id="novo-pac">' + i('user-plus') + 'Novo paciente</button></div></div><div id="pac-corpo"></div>';
    el.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { pacVista = b.dataset.v; T.pacientes(el); A.icones(); }; });
    el.querySelector('#novo-pac').onclick = function () { fichaPaciente(null); };
    var corpo = el.querySelector('#pac-corpo');
    if (pacVista === 'funil') return funil(corpo);
    corpo.innerHTML = '<div class="cartao"><input class="entrada" id="busca" placeholder="Buscar por nome, WhatsApp ou e-mail" value="' + esc(pacBusca) + '" style="margin-bottom:8px"><ul class="lista" id="lst"></ul></div>';
    var lst = corpo.querySelector('#lst'), busca = corpo.querySelector('#busca');
    function desenhar() {
      var q = A.norm(pacBusca);
      var itens = d.pacientes.filter(function (p) { return p.status !== 'arquivado' && (!q || A.norm(p.nome + ' ' + p.whatsapp + ' ' + p.email).indexOf(q) >= 0); })
        .sort(function (a, b) { return a.nome.localeCompare(b.nome); });
      var prox = {}; d.agendamentos.filter(function (a) { return ATIVOS[a.status] && a.inicio >= d.agora; }).sort(ordem).forEach(function (a) { if (!prox[a.paciente_id]) prox[a.paciente_id] = a; });
      lst.innerHTML = itens.length ? itens.map(function (p) {
        var a = prox[p.id];
        return '<li class="clicavel" data-p="' + p.id + '"><span class="avatar">' + esc(A.iniciais(p.nome)) + '</span><span class="meio"><b>' + esc(p.nome) + '</b><small>' +
          (p.whatsapp ? A.fone(p.whatsapp) : esc(p.email)) + (a ? ' · próxima: ' + A.fmtData(a.inicio) + ' ' + A.hora(a.inicio) : '') + '</small></span><span class="chip c-ne">' + esc(A.ETAPAS[p.etapa] || p.etapa) + '</span></li>';
      }).join('') : '<li>' + A.vazio('users-round', 'Nenhum paciente encontrado', 'Cadastre ou ajuste a busca.') + '</li>';
      A.icones();
      lst.querySelectorAll('[data-p]').forEach(function (li) { li.onclick = function () { fichaPaciente(li.dataset.p); }; });
    }
    busca.oninput = function () { pacBusca = busca.value; desenhar(); };
    desenhar();
  };
  function funil(corpo) {
    var d = A.S.dados, etapas = Object.keys(A.ETAPAS).filter(function (e) { return e !== 'arquivado'; });
    corpo.innerHTML = '<div class="funil">' + etapas.map(function (et) {
      var ps = d.pacientes.filter(function (p) { return p.etapa === et && p.status !== 'arquivado'; });
      return '<div class="coluna" data-etapa="' + et + '"><header><span>' + A.ETAPAS[et] + '</span><span class="muted">' + ps.length + '</span></header>' +
        ps.map(function (p) { return '<div class="ficha" draggable="true" data-p="' + p.id + '"><b>' + esc(p.nome) + '</b><small>' + (p.whatsapp ? A.fone(p.whatsapp) : '') + '</small></div>'; }).join('') + '</div>';
    }).join('') + '</div><p class="peq muted">Arraste os cartões entre as colunas. No celular, toque no paciente para mudar a etapa.</p>';
    corpo.querySelectorAll('.ficha').forEach(function (f) {
      f.ondragstart = function (e) { e.dataTransfer.setData('text/plain', f.dataset.p); };
      f.onclick = function () { fichaPaciente(f.dataset.p); };
    });
    corpo.querySelectorAll('.coluna').forEach(function (c) {
      c.ondragover = function (e) { e.preventDefault(); c.classList.add('sobre'); };
      c.ondragleave = function () { c.classList.remove('sobre'); };
      c.ondrop = function (e) {
        e.preventDefault(); c.classList.remove('sobre');
        var id = e.dataTransfer.getData('text/plain');
        A.api('pacienteEtapa', { id: id, etapa: c.dataset.etapa }).then(A.atualizar).catch(function (x) { A.aviso(x.message, true); });
      };
    });
  }
  function fichaPaciente(id) {
    var p = id ? A.porId('pacientes', id) : { nome: '', whatsapp: '', email: '', etapa: 'novo', consente_whatsapp: 'nao', consente_email: 'nao' };
    var ags = id ? A.S.dados.agendamentos.filter(function (a) { return a.paciente_id === id; }).sort(ordem).reverse() : [];
    var m = A.modal({ titulo: id ? p.nome : 'Novo paciente', largo: !!id, corpo:
      '<div class="' + (id ? 'grade g2' : '') + '"><div><div class="campos">' + A.campo('Nome completo', 'nome', p.nome, { req: true }) + A.campo('Nascimento', 'nascimento', p.nascimento, { tipo: 'date' }) +
      A.campo('WhatsApp com DDD', 'whatsapp', p.whatsapp, { tipo: 'tel' }) + A.campo('E-mail', 'email', p.email, { tipo: 'email' }) + '</div>' +
      A.campo('Responsável legal (se menor ou tutelado)', 'responsavel', p.responsavel, {}) +
      A.campo('Etapa', 'etapa', p.etapa, { opcoes: Object.keys(A.ETAPAS).map(function (k) { return [k, A.ETAPAS[k]]; }) }) +
      '<label class="check"><input type="checkbox" name="consente_whatsapp"' + (p.consente_whatsapp === 'sim' ? ' checked' : '') + '> Autorizou mensagens pelo WhatsApp</label>' +
      '<label class="check"><input type="checkbox" name="consente_email"' + (p.consente_email === 'sim' ? ' checked' : '') + '> Autorizou mensagens por e-mail</label>' +
      A.campo('Notas administrativas', 'notas_adm', p.notas_adm, { area: true, ajuda: 'Apenas assuntos administrativos. Não registre informações clínicas.' }) + '</div>' +
      (id ? '<div><b class="peq">Agendamentos</b><ul class="lista" style="margin-bottom:14px">' + (ags.length ? ags.slice(0, 6).map(function (a) {
        return '<li><span class="meio"><b>' + A.fmtData(a.inicio) + ' · ' + A.hora(a.inicio) + '</b><small>' + esc(nomeSrv(a.servico_id)) + ' · ' + esc(nomeLocal(a.vinculo_id)) + '</small></span>' + A.chipAg(a.status) + '</li>'; }).join('') : '<li class="muted peq">Nenhum.</li>') + '</ul>' +
        '<b class="peq">Linha do tempo</b><ul class="lista" id="hist"><li><span class="carregando"></span></li></ul></div>' : '') + '</div>',
      botoes: (id ? [{ rotulo: i('download') + 'Exportar dados', acao: function () { return A.api('pacienteExportar', { id: id }).then(function (x) { A.baixar('paciente-' + id + '.json', new Blob([JSON.stringify(x, null, 2)], { type: 'application/json' })); }); } },
        { rotulo: i('calendar-plus') + 'Agendar', acao: function (f) { f(); novoAgendamento(); } }] : []).concat([
        { rotulo: 'Salvar', classe: 'btn-p', acao: function (f, el) {
          var dd = A.form(el); if (id) dd.id = id;
          return A.api('paciente', dd).then(function () { f(); A.aviso('Paciente salvo.'); return A.atualizar(); });
        } }]) });
    if (id) A.api('pacienteHistorico', { id: id }).then(function (ev) {
      var h = m.el.querySelector('#hist'); if (!h) return;
      h.innerHTML = ev.slice(0, 12).map(function (e) { return '<li><span class="meio"><b>' + esc(e.resumo) + '</b><small>' + A.fmtDataCurta(e.criado_em) + ' ' + A.hora(e.criado_em) + '</small></span></li>'; }).join('') || '<li class="muted peq">Sem eventos.</li>';
    });
  }

  /* ================================================================ FINANCEIRO */
  T.financeiro = function (el) {
    var d = A.S.dados, f = d.financeiro || [], hoje = A.hoje(), ini = hoje.slice(0, 7);
    var doMes = f.filter(function (x) { return x.data.slice(0, 7) === ini; });
    var soma = function (l, st) { return l.filter(function (x) { return !st || x.status === st; }).reduce(function (s, x) { return s + Number(x.valor_centavos); }, 0); };
    var porLocal = {}; f.forEach(function (x) { var l = A.porId('locais', x.local_id); var k = l ? l.nome : 'Outros'; porLocal[k] = (porLocal[k] || 0) + Number(x.valor_centavos); });
    var concl = d.agendamentos.filter(function (a) { return a.status === 'concluido'; }).length, faltas = d.agendamentos.filter(function (a) { return a.status === 'nao_compareceu'; }).length;
    el.innerHTML = '<div class="topo"><div><h1>Financeiro e indicadores</h1><p>Receitas lançadas a partir das consultas concluídas.</p></div></div>' +
      '<div class="grade g4" style="margin-bottom:14px">' + kpi('wallet', 'Recebido no mês', A.brl(soma(doMes, 'recebido')), 'lançamentos recebidos') + kpi('hourglass', 'A receber', A.brl(soma(f, 'pendente')), 'pendentes') +
      kpi('user-check', 'Comparecimento', concl + faltas ? Math.round(concl / (concl + faltas) * 100) + '%' : '—', concl + ' atendidos, ' + faltas + ' faltas') +
      kpi('users-round', 'Pacientes ativos', d.pacientes.filter(function (p) { return p.etapa === 'ativo' || p.etapa === 'acompanhamento'; }).length, 'no cadastro') + '</div>' +
      '<div class="cartao" style="margin-bottom:14px"><header><h2>Ocupação dos próximos dias</h2><span class="peq muted">mínimo em dourado</span></header>' + (function () { var px = d.ocupacao.filter(function (o) { return o.data >= hoje; }).sort(function (a, b) { return a.data < b.data ? -1 : 1; }).slice(0, 8); return px.length ? px.map(barraOcup).join('') : '<p class="muted peq" style="margin:0">Sem dias de atendimento configurados.</p>'; })() + '</div>' +
      '<div class="grade g2"><div class="cartao"><h2>Receita por local</h2>' + (Object.keys(porLocal).length ? Object.keys(porLocal).map(function (k) {
        var max = Math.max.apply(null, Object.keys(porLocal).map(function (x) { return porLocal[x]; }));
        return '<div class="ocup" style="grid-template-columns:140px 1fr auto"><span>' + esc(k) + '</span><div class="barra"><i style="width:' + (porLocal[k] / max * 100) + '%"></i></div><b>' + A.brl(porLocal[k]) + '</b></div>'; }).join('') : A.vazio('wallet', 'Sem lançamentos', 'Concluir uma consulta com preço gera a receita.')) + '</div>' +
      '<div class="cartao"><h2>Lançamentos recentes</h2><ul class="lista">' + f.slice().sort(function (a, b) { return a.data < b.data ? 1 : -1; }).slice(0, 10).map(function (x) {
        return '<li><span class="meio"><b>' + esc(x.descricao) + '</b><small>' + A.fmtDataCurta(x.data) + '</small></span><b>' + A.brl(x.valor_centavos) + '</b><span class="chip ' + (x.status === 'recebido' ? 'c-ok' : 'c-al') + '">' + (x.status === 'recebido' ? 'Recebido' : 'Pendente') + '</span></li>'; }).join('') + '</ul></div></div>';
  };
})();
