/* ==========================================================================
   FLUYAN — cadastros: locais e vínculos, serviços e planos, equipe, perfil, admin
   ========================================================================== */
(function () {
  'use strict';
  var A = window.A, T = A.telas = A.telas || {};
  var esc = A.esc, i = A.i;
  var TIPO_LOCAL = { propria: 'Consultório próprio', parceira: 'Clínica parceira', online: 'Teleconsulta' };

  /* ================================================================ LOCAIS */
  T.locais = function (el) {
    var d = A.S.dados;
    el.innerHTML = '<div class="topo"><div><h1>Locais e clínicas</h1><p>Onde você atende, em quais dias, com mínimo e máximo de consultas.</p></div><div class="acoes">' +
      '<button class="btn btn-p" id="novo-local">' + i('plus') + 'Novo local</button></div></div><div class="grade">' +
      d.locais.filter(function (l) { return l.status === 'ativo'; }).map(function (l) {
        var vs = d.vinculos.filter(function (v) { return v.local_id === l.id && v.status !== 'encerrado'; });
        var acessos = (d.equipe || []).filter(function (e) { return e.papel === 'clinica' && e.local_id === l.id; });
        return '<div class="cartao"><header><div class="linha-f">' + i(l.tipo === 'online' ? 'video' : (l.tipo === 'propria' ? 'house-plus' : 'building-2')) +
          '<h2 style="font-size:17px">' + esc(l.nome) + '</h2><span class="chip c-ne">' + TIPO_LOCAL[l.tipo] + '</span></div>' +
          '<div class="linha-f"><button class="btn btn-g btn-pq" data-editar="' + l.id + '">Editar</button>' +
          (l.tipo === 'parceira' && d.eu.papel === 'titular' ? '<button class="btn btn-s btn-pq" data-convidar="' + l.id + '">' + i('key-round') + 'Acesso da clínica</button>' : '') + '</div></header>' +
          (l.endereco ? '<p class="muted peq" style="margin:-6px 0 12px">' + esc(l.endereco) + (l.cidade ? ', ' + esc(l.cidade) : '') + '</p>' : '') +
          (vs.length ? vs.map(function (v) { return resumoVinculo(v, d); }).join('') : '<div class="caixa in">' + i('info') + '<span>Defina dias, horários e serviços deste local para ele aparecer na agenda.</span></div>') +
          '<div class="linha-f" style="margin-top:12px">' + (vs.length ? '' : '<button class="btn btn-p btn-pq" data-vinculo="|' + l.id + '">' + i('calendar-cog') + 'Configurar horários</button>') +
          (acessos.length ? '<span class="peq muted">' + i('key-round') + ' ' + acessos.map(function (a) { return esc(a.nome || a.email) + (a.status === 'convidado' ? ' (convite enviado)' : ''); }).join(', ') + '</span>' : '') + '</div></div>';
      }).join('') + '</div>';
    el.querySelector('#novo-local').onclick = function () { editarLocal(null); };
    el.querySelectorAll('[data-editar]').forEach(function (b) { b.onclick = function () { editarLocal(b.dataset.editar); }; });
    el.querySelectorAll('[data-vinculo]').forEach(function (b) { b.onclick = function () { var x = b.dataset.vinculo.split('|'); editarVinculo(x[0], x[1]); }; });
    el.querySelectorAll('[data-convidar]').forEach(function (b) { b.onclick = function () { convidarClinica(b.dataset.convidar); }; });
  };
  function resumoVinculo(v, d) {
    var regras = d.regras.filter(function (r) { return r.vinculo_id === v.id; }).sort(function (a, b) { return a.dia_semana - b.dia_semana; });
    var srvs = v.servicos.split(',').map(function (id) { var s = A.porId('servicos', id); return s ? s.nome : ''; }).filter(Boolean);
    var med = d.medicos.length > 1 ? (A.porId('medicos', v.doctor_id) || {}).nome_publico + ' · ' : '';
    return '<div style="border:1px solid var(--mf-linha);border-radius:14px;padding:14px;margin-bottom:8px"><div class="entre"><div><b>' + esc(med) +
      (regras.map(function (r) { return A.DIAS[r.dia_semana] + ' ' + r.inicio + '–' + r.fim + (Number(r.max_consultas) ? ' (mín. ' + (r.min_consultas || 0) + ', máx. ' + r.max_consultas + ')' : ''); }).join(' · ') || 'Sem dias definidos') +
      '</b><br><small class="muted">' + esc(srvs.join(', ')) + ' · ' + (v.confirmacao === 'manual' ? 'confirmação manual' : 'confirmação automática') + (v.publico === 'sim' ? ' · na página pública' : '') +
      (v.status !== 'ativo' ? ' · <b>' + v.status + '</b>' : '') + '</small></div><button class="btn btn-s btn-pq" data-vinculo="' + v.id + '|' + v.local_id + '">Ajustar</button></div></div>';
  }
  function editarLocal(id) {
    var l = id ? A.porId('locais', id) : { nome: '', tipo: 'parceira' };
    A.modal({ titulo: id ? 'Editar local' : 'Novo local', corpo: '<div class="campos">' + A.campo('Nome', 'nome', l.nome, { req: true, ph: 'Ex.: Clínica Vida' }) +
      A.campo('Tipo', 'tipo', l.tipo, { opcoes: Object.keys(TIPO_LOCAL).map(function (k) { return [k, TIPO_LOCAL[k]]; }) }) + '</div>' +
      A.campo('Endereço', 'endereco', l.endereco, {}) + '<div class="campos">' + A.campo('Cidade', 'cidade', l.cidade, {}) + A.campo('Telefone', 'telefone', l.telefone, { tipo: 'tel' }) + '</div>' +
      A.campo('Responsável na clínica', 'responsavel', l.responsavel, {}),
      botoes: (id ? [{ rotulo: 'Arquivar', classe: 'btn-perigo', acao: function (f, el) { var dd = A.form(el); dd.id = id; dd.status = 'arquivado'; return A.api('local', dd).then(function () { f(); return A.atualizar(); }); } }] : [])
        .concat([{ rotulo: 'Cancelar' }, { rotulo: 'Salvar', classe: 'btn-p', acao: function (f, el) { var dd = A.form(el); if (id) dd.id = id; return A.api('local', dd).then(function (loc) { f(); A.aviso('Local salvo.'); return A.atualizar().then(function () { if (!id) editarVinculo('', loc.id); }); }); } }]) });
  }
  function editarVinculo(vid, localId) {
    var d = A.S.dados, v = vid ? A.porId('vinculos', vid) : { servicos: '', confirmacao: 'automatica', publico: 'sim', antecedencia_min_h: 2, antecedencia_max_dias: 60, cancelar_ate_h: 24, dia_padrao: 'confirmada', status: 'ativo' };
    var l = A.porId('locais', localId), regras = vid ? d.regras.filter(function (r) { return r.vinculo_id === vid; }) : [];
    var docId = v.doctor_id || (d.medicos[0] || {}).id;
    var srvs = d.servicos.filter(function (s) { return s.status === 'ativo' && s.doctor_id === docId; });
    if (!srvs.length) { A.aviso('Cadastre um serviço primeiro.', true); location.hash = 'servicos'; return; }
    var ativos = v.servicos.split(',');
    var linhasRegra = [1, 2, 3, 4, 5, 6, 0].map(function (dia) {
      var r = regras.filter(function (x) { return Number(x.dia_semana) === dia; })[0];
      return '<div class="regra' + (r ? '' : ' off') + '" data-dia="' + dia + '"><label class="check" style="margin:0"><input type="checkbox" data-liga' + (r ? ' checked' : '') + '> ' + A.DIAS[dia] + '</label>' +
        '<input class="entrada" type="time" data-c="inicio" value="' + (r ? r.inicio : '08:00') + '" aria-label="Início">' +
        '<input class="entrada" type="time" data-c="fim" value="' + (r ? r.fim : '12:00') + '" aria-label="Fim">' +
        '<input class="entrada" type="number" min="0" data-c="min_consultas" value="' + (r ? r.min_consultas : '') + '" placeholder="mín." aria-label="Mínimo de consultas">' +
        '<input class="entrada" type="number" min="0" data-c="max_consultas" value="' + (r ? r.max_consultas : '') + '" placeholder="máx." aria-label="Máximo de consultas"></div>';
    }).join('');
    A.modal({ titulo: 'Horários · ' + (l ? l.nome : ''), largo: true, corpo:
      (d.medicos.length > 1 && !vid ? A.campo('Médico', 'doctor_id', docId, { opcoes: d.medicos.map(function (m) { return [m.id, m.nome_publico]; }) }) : '') +
      '<div class="campo"><span>Serviços atendidos neste local</span><div class="opcoes">' + srvs.map(function (s) {
        return '<label class="opcao"><input type="checkbox" name="servicos[]" value="' + s.id + '"' + (ativos.indexOf(s.id) >= 0 || !vid ? ' checked' : '') + ' style="accent-color:var(--mf-petroleo)"> ' + esc(s.nome) + '</label>'; }).join('') + '</div></div>' +
      '<div class="campo"><span>Dias e horários</span><div class="regra peq muted" style="border:0"><span></span><span>Início</span><span>Fim</span><span>Mínimo</span><span>Máximo</span></div>' + linhasRegra +
      '<small>Mínimo: número de consultas para o dia valer a pena (o sistema avisa quando estiver abaixo, não cancela nada). Máximo: o sistema nunca passa deste número.</small></div>' +
      '<div class="campos">' + A.campo('Confirmação', 'confirmacao', v.confirmacao, { opcoes: [['automatica', 'Automática'], ['manual', 'Manual (você confirma cada pedido)']] }) +
      A.campo('Novas datas começam como', 'dia_padrao', v.dia_padrao, { opcoes: [['confirmada', 'Confirmadas'], ['provisoria', 'Provisórias']] }) +
      A.campo('Antecedência mínima (horas)', 'antecedencia_min_h', v.antecedencia_min_h, { tipo: 'number' }) + A.campo('Agenda aberta até (dias à frente)', 'antecedencia_max_dias', v.antecedencia_max_dias, { tipo: 'number' }) +
      A.campo('Cancelamento sem pedido até (horas antes)', 'cancelar_ate_h', v.cancelar_ate_h, { tipo: 'number' }) +
      A.campo('Situação', 'status', v.status, { opcoes: [['ativo', 'Ativo'], ['pausado', 'Pausado'], ['encerrado', 'Encerrado']] }) + '</div>' +
      '<label class="check"><input type="checkbox" name="publico"' + (v.publico === 'sim' ? ' checked' : '') + '> Mostrar este local na minha página para pacientes agendarem</label>',
      aoAbrir: function (el) {
        el.querySelectorAll('[data-liga]').forEach(function (c) { c.onchange = function () { c.closest('.regra').classList.toggle('off', !c.checked); }; });
      },
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Salvar', classe: 'btn-p', acao: function (f, el) {
        var dd = A.form(el); if (vid) dd.id = vid; dd.local_id = localId; if (!dd.doctor_id) dd.doctor_id = docId;
        dd.regras = [].map.call(el.querySelectorAll('.regra[data-dia]'), function (r) {
          if (!r.querySelector('[data-liga]').checked) return null;
          var o = { dia_semana: Number(r.dataset.dia) }; r.querySelectorAll('[data-c]').forEach(function (x) { o[x.dataset.c] = x.value; }); return o;
        }).filter(Boolean);
        return A.api('vinculo', dd).then(function () { f(); A.aviso('Horários salvos.'); return A.atualizar(); });
      } }] });
  }
  function convidarClinica(localId) {
    var l = A.porId('locais', localId);
    A.modal({ titulo: 'Acesso da ' + l.nome, corpo: '<p class="muted" style="margin-top:0">A clínica recebe um link de uso único, válido por 7 dias. Com ele, cria a própria senha e passa a ver só os seus horários neste local. Ela não vê prontuário, financeiro nem pacientes de outros locais.</p>' +
      '<div class="campos">' + A.campo('Nome de quem vai usar', 'nome', 'Recepção ' + l.nome, {}) + A.campo('E-mail', 'email', '', { tipo: 'email', req: true }) + '</div>',
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Gerar convite', classe: 'btn-p', acao: function (f, el) {
        var dd = A.form(el); dd.papel = 'clinica'; dd.local_id = localId;
        return A.api('convidar', dd).then(function (r) { f(); mostrarConvite(r, dd); return A.atualizar(); });
      } }] });
  }
  function mostrarConvite(r, dd) {
    var link = A.urlBase() + '/app/#convite=' + r.codigo;
    A.modal({ titulo: 'Convite pronto', corpo: '<p class="muted" style="margin-top:0">Envie este link para ' + esc(dd.email) + '. Ele vale até ' + A.fmtDataCurta(r.expira_em) + ' e só pode ser usado uma vez.</p>' +
      '<input class="entrada" readonly value="' + esc(link) + '">',
      botoes: [{ rotulo: i('copy') + 'Copiar link', acao: function () { A.copiar(link); } },
        { rotulo: i('send') + 'Enviar por WhatsApp', classe: 'btn-p', acao: function () { window.open(A.wa('', 'Seu acesso à Fluyan: ' + link), '_blank'); } }] });
  }
  A.mostrarConvite = mostrarConvite;

  /* ================================================================ SERVIÇOS */
  T.servicos = function (el) {
    var d = A.S.dados;
    el.innerHTML = '<div class="topo"><div><h1>Serviços e planos</h1><p>O que você oferece, com duração e modalidade. Os planos reúnem serviços em acompanhamento.</p></div><div class="acoes">' +
      '<button class="btn btn-s" id="novo-plano">' + i('package') + 'Novo plano</button><button class="btn btn-p" id="novo-srv">' + i('plus') + 'Novo serviço</button></div></div>' +
      '<div class="grade g2"><div class="cartao"><h2>Serviços</h2>' + (d.servicos.length ? '<ul class="lista">' + d.servicos.map(function (s) {
        return '<li class="clicavel" data-s="' + s.id + '">' + i(s.modalidade === 'online' ? 'video' : 'stethoscope') + '<span class="meio"><b>' + esc(s.nome) + '</b><small>' + s.duracao_min + ' min · ' +
          ({ presencial: 'presencial', online: 'online', ambas: 'presencial ou online' }[s.modalidade]) + (Number(s.preco_centavos) ? ' · ' + A.brl(s.preco_centavos) + (s.mostra_preco === 'sim' ? '' : ' (oculto na página)') : '') + '</small></span>' +
          (s.status === 'ativo' ? '' : '<span class="chip c-ne">Inativo</span>') + '</li>'; }).join('') + '</ul>' : A.vazio('stethoscope', 'Nenhum serviço', 'Comece pela sua consulta principal.')) + '</div>' +
      '<div class="cartao"><h2>Planos e acompanhamentos</h2>' + (d.planos.length ? '<ul class="lista">' + d.planos.map(function (p) {
        var itens = A.json(p.itens, []).map(function (x) { var s = A.porId('servicos', x.servico_id); return x.quantidade + 'x ' + (s ? s.nome : ''); }).join(', ');
        return '<li class="clicavel" data-p="' + p.id + '">' + i('package') + '<span class="meio"><b>' + esc(p.nome) + '</b><small>' + esc(itens) + ' · ' + p.validade_dias + ' dias' + (Number(p.preco_centavos) ? ' · ' + A.brl(p.preco_centavos) : '') + '</small></span></li>'; }).join('') + '</ul>' :
        A.vazio('package', 'Nenhum plano', 'Planos reúnem consultas e retornos com validade.')) +
      '<div class="caixa in" style="margin:12px 0 0">' + i('scale') + '<span>Planos são serviços profissionais, não plano de saúde. Revise termos e cancelamento com assessoria jurídica antes de vender.</span></div></div></div>';
    el.querySelector('#novo-srv').onclick = function () { editarServico(null); };
    el.querySelector('#novo-plano').onclick = function () { editarPlano(null); };
    el.querySelectorAll('[data-s]').forEach(function (li) { li.onclick = function () { editarServico(li.dataset.s); }; });
    el.querySelectorAll('[data-p]').forEach(function (li) { li.onclick = function () { editarPlano(li.dataset.p); }; });
  };
  function editarServico(id) {
    var s = id ? A.porId('servicos', id) : { nome: '', duracao_min: 30, modalidade: 'presencial', intervalo_apos_min: 0, mostra_preco: 'nao', status: 'ativo' };
    A.modal({ titulo: id ? 'Editar serviço' : 'Novo serviço', corpo: A.campo('Nome', 'nome', s.nome, { req: true, ph: 'Ex.: Consulta presencial' }) +
      '<div class="campos">' + A.campo('Duração (minutos)', 'duracao_min', s.duracao_min, { tipo: 'number' }) + A.campo('Intervalo depois (minutos)', 'intervalo_apos_min', s.intervalo_apos_min, { tipo: 'number' }) +
      A.campo('Modalidade', 'modalidade', s.modalidade, { opcoes: [['presencial', 'Presencial'], ['online', 'Online'], ['ambas', 'As duas']] }) + A.campo('Preço (R$)', 'preco', A.reais(s.preco_centavos), { ph: '0,00' }) + '</div>' +
      '<label class="check"><input type="checkbox" name="mostra_preco"' + (s.mostra_preco === 'sim' ? ' checked' : '') + '> Mostrar o preço na página pública</label>' +
      A.campo('Descrição', 'descricao', s.descricao, { area: true }) + A.campo('Orientações ao paciente', 'orientacoes', s.orientacoes, { area: true, ph: 'Ex.: traga seus exames recentes' }) +
      A.campo('Situação', 'status', s.status, { opcoes: [['ativo', 'Ativo'], ['inativo', 'Inativo']] }),
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Salvar', classe: 'btn-p', acao: function (f, el) {
        var dd = A.form(el); if (id) dd.id = id; dd.preco_centavos = A.centavos(dd.preco);
        return A.api('servico', dd).then(function () { f(); A.aviso('Serviço salvo.'); return A.atualizar(); });
      } }] });
  }
  function editarPlano(id) {
    var d = A.S.dados, p = id ? A.porId('planos', id) : { nome: '', validade_dias: 180, itens: '[]', status: 'ativo' }, itens = A.json(p.itens, []);
    A.modal({ titulo: id ? 'Editar plano' : 'Novo plano', largo: true, corpo: '<div class="campos">' + A.campo('Nome', 'nome', p.nome, { req: true }) + A.campo('Público indicado', 'publico', p.publico, {}) +
      A.campo('Validade (dias)', 'validade_dias', p.validade_dias, { tipo: 'number' }) + A.campo('Preço (R$)', 'preco', A.reais(p.preco_centavos), {}) + '</div>' +
      '<div class="campo"><span>Serviços incluídos</span>' + d.servicos.filter(function (s) { return s.status === 'ativo'; }).map(function (s) {
        var it = itens.filter(function (x) { return x.servico_id === s.id; })[0];
        return '<div class="entre" style="padding:6px 0"><span>' + esc(s.nome) + '</span><input class="entrada" type="number" min="0" max="99" data-item="' + s.id + '" value="' + (it ? it.quantidade : 0) + '" style="width:90px"></div>'; }).join('') + '</div>' +
      A.campo('Descrição', 'descricao', p.descricao, { area: true }) + '<div class="campos">' + A.campo('Formas de pagamento', 'forma_pagamento', p.forma_pagamento, {}) +
      A.campo('Situação', 'status', p.status, { opcoes: [['ativo', 'Ativo'], ['inativo', 'Inativo']] }) + '</div>' + A.campo('Política de cancelamento', 'politica_cancelamento', p.politica_cancelamento, { area: true }),
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Salvar', classe: 'btn-p', acao: function (f, el) {
        var dd = A.form(el); if (id) dd.id = id; dd.preco_centavos = A.centavos(dd.preco);
        dd.itens = [].map.call(el.querySelectorAll('[data-item]'), function (x) { return { servico_id: x.dataset.item, quantidade: Number(x.value) }; }).filter(function (x) { return x.quantidade > 0; });
        return A.api('plano', dd).then(function () { f(); A.aviso('Plano salvo.'); return A.atualizar(); });
      } }] });
  }

  /* ================================================================ EQUIPE */
  T.equipe = function (el) {
    var d = A.S.dados, lim = d.tenant.limites;
    el.innerHTML = '<div class="topo"><div><h1>Equipe e acessos</h1><p>Plano ' + esc(d.tenant.limites.nome) + ': até ' + lim.usuarios + ' acessos e ' + lim.medicos + ' médico(s).</p></div>' +
      '<div class="acoes"><button class="btn btn-p" id="convidar">' + i('user-plus') + 'Convidar</button></div></div>' +
      '<div class="cartao"><ul class="lista">' + d.equipe.map(function (e) {
        var l = e.local_id ? A.porId('locais', e.local_id) : null;
        return '<li><span class="avatar">' + esc(A.iniciais(e.nome || e.email)) + '</span><span class="meio"><b>' + esc(e.nome || e.email) + '</b><small>' + esc(e.email) + (l ? ' · ' + esc(l.nome) : '') +
          (e.ultimo_acesso ? ' · último acesso ' + A.fmtDataCurta(e.ultimo_acesso) : '') + '</small></span><span class="chip ' + (e.status === 'ativo' ? 'c-sa' : 'c-al') + '">' + A.PAPEL[e.papel] + (e.status === 'convidado' ? ' · convidado' : '') + '</span>' +
          (e.id && e.papel !== 'titular' ? '<button class="btn btn-g btn-pq" data-rm="' + e.id + '">Remover</button>' : '') + '</li>';
      }).join('') + '</ul></div>' +
      '<div class="caixa in" style="margin-top:14px">' + i('shield-check') + '<span>Secretárias veem agenda, pacientes (cadastro) e financeiro. Clínicas parceiras veem só os horários e pacientes do próprio local. Nenhum dos dois acessa informações clínicas.</span></div>';
    el.querySelector('#convidar').onclick = function () {
      A.modal({ titulo: 'Convidar para a equipe', corpo: A.campo('Papel', 'papel', 'secretaria', { opcoes: [['secretaria', 'Secretária'], ['medico', 'Médico (agenda e página próprias)'], ['clinica', 'Clínica parceira']] }) +
        '<div class="campos">' + A.campo('Nome', 'nome', '', { req: true }) + A.campo('E-mail', 'email', '', { tipo: 'email', req: true }) + '</div>' +
        '<div id="local-cv" hidden>' + A.campo('Clínica', 'local_id', '', { opcoes: d.locais.filter(function (l) { return l.tipo === 'parceira'; }).map(function (l) { return [l.id, l.nome]; }) }) + '</div>',
        aoAbrir: function (m) { var s = m.querySelector('[name=papel]'); s.onchange = function () { m.querySelector('#local-cv').hidden = s.value !== 'clinica'; }; },
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Gerar convite', classe: 'btn-p', acao: function (f, m) { var dd = A.form(m); return A.api('convidar', dd).then(function (r) { f(); mostrarConvite(r, dd); return A.atualizar(); }); } }] });
    };
    el.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () {
      A.confirmar('Remover acesso', 'A pessoa deixa de entrar imediatamente. Os registros feitos por ela continuam.', 'Remover', true).then(function (ok) { if (ok) A.api('removerAcesso', { id: b.dataset.rm }).then(A.atualizar); });
    }; });
  };

  /* ================================================================ PERFIL */
  T.perfil = function (el) {
    var d = A.S.dados, eu = d.eu, m = (eu.papel === 'titular' || eu.papel === 'medico') ? d.medicos[0] : null;
    el.innerHTML = '<div class="topo"><div><h1>' + (m ? 'Perfil profissional' : 'Minha conta') + '</h1><p>' + (m ? 'Dados profissionais usados na sua página e no Estúdio.' : 'Seu acesso ao Fluyan.') + '</p></div></div><div class="grade ' + (m ? 'g2' : '') + '" style="align-items:start">' +
      (m ? '<form class="cartao" id="f-perfil"><h2>Dados profissionais</h2><div class="campos">' + A.campo('Nome completo', 'nome_completo', m.nome_completo, {}) + A.campo('Nome na página', 'nome_publico', m.nome_publico, { ph: 'Ex.: Dra. Helena Duarte' }) +
        A.campo('Conselho', 'conselho', m.conselho, { opcoes: ['CRM', 'CRN', 'CRP', 'CREFITO', 'CRO', 'COREN'] }) + A.campo('Número do registro', 'registro', m.registro, { req: true }) +
        A.campo('UF', 'uf', m.uf, { attrs: ' maxlength="2"' }) + A.campo('RQE (se especialista)', 'rqe', m.rqe, {}) + A.campo('Especialidade', 'especialidade', m.especialidade, {}) +
        A.campo('Áreas de atuação', 'subespecialidades', m.subespecialidades, {}) + '</div>' + A.campo('Apresentação', 'apresentacao', m.apresentacao, { area: true }) +
        A.campo('Formação', 'formacao', m.formacao, { area: true, ajuda: 'Apenas títulos que você pode comprovar.' }) + '<div class="campos">' +
        A.campo('WhatsApp de contato', 'whatsapp', m.whatsapp, { tipo: 'tel' }) + A.campo('Instagram', 'instagram', m.instagram, { ph: 'sem @' }) +
        A.campo('Foto (endereço https)', 'foto_url', m.foto_url, {}) + A.campo('Cor de destaque', 'cor', m.cor || '#0F5257', { tipo: 'color' }) + '</div>' +
        '<div class="sep"></div><h2 style="margin-bottom:12px">Para o Estúdio</h2>' + A.campo('Tom de voz', 'tom_de_voz', m.tom_de_voz, { ph: 'Ex.: acolhedor, direto, sem jargões' }) +
        A.campo('Público que você quer atender', 'publico_alvo', m.publico_alvo, { area: true }) + A.campo('Temas que você não quer abordar', 'temas_evitar', m.temas_evitar, { area: true }) +
        '<button class="btn btn-p">Salvar perfil</button></form>' : '') +
      '<form class="cartao" id="f-senha"><h2>Senha</h2><p class="muted peq" style="margin-top:-6px">' + esc(eu.email) + ' · ' + A.PAPEL[eu.papel] + '</p>' + A.campo('Senha atual', 'atual', '', { tipo: 'password' }) +
      A.campo('Nova senha', 'nova', '', { tipo: 'password', ajuda: 'Mínimo de 8 caracteres. Trocar a senha encerra as outras sessões.' }) + '<div class="entre"><button class="btn btn-s">Trocar senha</button><button type="button" class="btn btn-g" id="sair-conta">' + i('log-out') + 'Sair da conta</button></div></form></div>';
    el.querySelector('#sair-conta').onclick = A.sair;
    var fp = el.querySelector('#f-perfil');
    if (fp) fp.onsubmit = function (e) { e.preventDefault(); var dd = A.form(fp); dd.id = m.id; A.api('perfil', dd).then(function () { A.aviso('Perfil salvo.'); A.atualizar(); }).catch(function (x) { A.aviso(x.message, true); }); };
    var fs = el.querySelector('#f-senha');
    fs.onsubmit = function (e) { e.preventDefault(); A.api('trocarSenha', A.form(fs)).then(function () { A.aviso('Senha trocada. Entre de novo.'); A.store.del('fluyan_token'); setTimeout(A.iniciar, 900); }).catch(function (x) { A.aviso(x.message, true); }); };
  };

  /* ================================================================ ADMIN */
  T.admin = function (el) {
    var d = A.S.dados, ts = d.tenants, P = d.planos;
    var receita = ts.filter(function (t) { return t.status === 'ativo'; }).reduce(function (s, t) { return s + (P[t.plano] ? P[t.plano].preco : 0); }, 0);
    el.innerHTML = '<div class="topo"><div><h1>Clientes da plataforma</h1><p>Assinaturas, planos e consumo do Estúdio por cliente.</p></div><div class="acoes"><button class="btn btn-p" id="novo-ten">' + i('plus') + 'Novo cliente</button></div></div>' +
      '<div class="grade g4" style="margin-bottom:14px">' + ['ativo', 'suspenso'].map(function (s) { return '<div class="cartao kpi"><small>Clientes ' + (s === 'ativo' ? 'ativos' : 'suspensos') + '</small><b>' + ts.filter(function (t) { return t.status === s; }).length + '</b></div>'; }).join('') +
      '<div class="cartao kpi"><small>Receita mensal recorrente</small><b>' + A.brl(receita) + '</b><span>sem Enterprise</span></div><div class="cartao kpi"><small>Custo do Estúdio</small><b>' + A.brl(ts.reduce(function (s, t) { return s + t.ia_custo; }, 0)) + '</b><span>acumulado</span></div></div>' +
      '<div class="cartao rolar-x"><table class="tabela"><thead><tr><th>Cliente</th><th>Tipo</th><th>Plano</th><th>Acessos</th><th>Estúdio</th><th>Situação</th><th></th></tr></thead><tbody>' +
      ts.map(function (t) {
        return '<tr><td><b>' + esc(t.nome) + '</b><br><small class="muted">desde ' + A.fmtDataCurta(t.criado_em) + '</small></td><td>' + (t.tipo === 'clinica' ? 'Clínica' : 'Individual') + '</td>' +
          '<td><select class="entrada" data-plano="' + t.id + '" style="min-height:36px;padding:4px 10px">' + Object.keys(P).map(function (k) { return '<option value="' + k + '"' + (k === t.plano ? ' selected' : '') + '>' + P[k].nome + '</option>'; }).join('') + '</select></td>' +
          '<td>' + t.usuarios + '</td><td>' + A.brl(t.ia_custo) + '</td><td><span class="chip ponto ' + (t.status === 'ativo' ? 'c-ok' : 'c-er') + '">' + t.status + '</span></td>' +
          '<td><button class="btn btn-s btn-pq" data-st="' + t.id + '|' + (t.status === 'ativo' ? 'suspenso' : 'ativo') + '">' + (t.status === 'ativo' ? 'Suspender' : 'Reativar') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    el.querySelectorAll('[data-plano]').forEach(function (s) { s.onchange = function () { A.api('adminPlano', { id: s.dataset.plano, plano: s.value }).then(function () { A.aviso('Plano alterado.'); A.atualizar(); }); }; });
    el.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () {
      var x = b.dataset.st.split('|'), susp = x[1] === 'suspenso';
      A.perguntar(susp ? 'Suspender este cliente?' : 'Reativar este cliente?', susp ? 'O acesso de toda a equipe dele é bloqueado na hora.' : 'O acesso volta a funcionar imediatamente.', { rotulo: 'Justificativa (fica na auditoria)', obrigatorio: true, perigo: susp, confirmar: susp ? 'Suspender' : 'Reativar' })
        .then(function (just) { if (just === null) return; return A.api('adminStatusTenant', { id: x[0], status: x[1], justificativa: just }).then(function () { A.aviso('Situação alterada.'); A.atualizar(); }); }).catch(function (e) { A.aviso(e.message, true); });
    }; });
    el.querySelector('#novo-ten').onclick = function () {
      A.modal({ titulo: 'Novo cliente', corpo: '<div class="campos">' + A.campo('Nome do cliente', 'nome', '', { req: true, ph: 'Ex.: Consultório Dr. Paulo' }) + A.campo('Tipo', 'tipo', 'individual', { opcoes: [['individual', 'Médico individual'], ['clinica', 'Clínica']] }) +
        A.campo('Plano', 'plano', 'profissional', { opcoes: Object.keys(P).map(function (k) { return [k, P[k].nome]; }) }) + A.campo('Nome do titular', 'tnome', '', {}) + A.campo('E-mail do titular', 'temail', '', { tipo: 'email' }) +
        A.campo('Senha provisória', 'tsenha', '', { ajuda: 'Mínimo de 8 caracteres. Peça para trocar no primeiro acesso.' }) + '</div>',
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Criar', classe: 'btn-p', acao: function (f, m) {
          var x = A.form(m); return A.api('adminCriarTenant', { nome: x.nome, tipo: x.tipo, plano: x.plano, titular: { nome: x.tnome, email: x.temail, senha: x.tsenha, medico: true } }).then(function () { f(); A.aviso('Cliente criado.'); return A.atualizar(); });
        } }] });
    };
  };
  T.auditoria = function (el) {
    el.innerHTML = '<div class="topo"><div><h1>Auditoria</h1><p>Ações sensíveis em toda a plataforma.</p></div></div><div class="cartao"><span class="carregando"></span></div>';
    A.api('adminAuditoria').then(function (l) {
      el.querySelector('.cartao').innerHTML = '<div class="rolar-x"><table class="tabela"><thead><tr><th>Quando</th><th>Ação</th><th>Entidade</th><th>Resumo</th><th>Justificativa</th></tr></thead><tbody>' +
        l.map(function (a) { return '<tr><td>' + A.fmtDataCurta(a.criado_em) + ' ' + A.hora(a.criado_em) + '</td><td>' + esc(a.acao) + '</td><td>' + esc(a.entidade) + '</td><td>' + esc(a.resumo) + '</td><td>' + esc(a.justificativa) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    });
  };
})();
