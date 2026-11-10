/* ==========================================================================
   FLUYAN — presença digital: Estúdio, calendário de conteúdo, página editável
   ========================================================================== */
(function () {
  'use strict';
  var A = window.A, T = A.telas = A.telas || {};
  var esc = A.esc, i = A.i;
  var FORMATOS = [['carrossel', 'Carrossel', 'gallery-horizontal'], ['post', 'Post', 'square'], ['stories', 'Stories', 'smartphone'], ['video', 'Vídeo curto', 'clapperboard']];
  var SUGESTOES = ['Carrossel com 5 sinais de que é hora de fazer o check-up anual', 'Vídeo de 30 segundos sobre mitos e verdades da pressão alta',
    'Stories explicando como se preparar para a primeira consulta', 'Post sobre a importância do sono para a saúde do coração'];
  function medico() { return A.S.dados.medicos[0] || {}; }

  /* ================================================================ ESTÚDIO */
  var est = { formato: 'carrossel', ultimo: null };
  T.estudio = function (el) {
    el.innerHTML = '<div class="topo"><div><h1>Estúdio</h1><p>Descreva o conteúdo. O Claude cria, você revisa e baixa o arquivo final e o editável.</p></div><div class="acoes"><span class="chip c-sa" id="uso">' + i('gauge') + ' ...</span></div></div>' +
      '<div class="estudio"><div class="cartao"><div class="campo"><span>Formato</span><div class="opcoes">' + FORMATOS.map(function (f) {
        return '<button class="opcao' + (f[0] === est.formato ? ' on' : '') + '" data-f="' + f[0] + '">' + i(f[2]) + f[1] + '</button>'; }).join('') + '</div></div>' +
      A.campo('O que você quer criar?', 'pedido', '', { area: true, ph: 'Ex.: carrossel sobre os 5 sinais de que é hora de fazer o check-up' }) +
      '<div id="dur" ' + (est.formato === 'video' ? '' : 'hidden') + '>' + A.campo('Duração do vídeo', 'duracao_s', '30', { opcoes: [['15', '15 segundos'], ['30', '30 segundos'], ['60', '60 segundos'], ['90', '90 segundos']] }) +
      A.campo('Transcrição de um vídeo seu (opcional)', 'transcricao', '', { area: true, ajuda: 'Cole o texto de um vídeo que você gravou para o Estúdio sugerir o corte. A transcrição automática chega na próxima etapa.' }) + '</div>' +
      '<button class="btn btn-p" id="criar" style="width:100%">' + i('sparkles') + 'Criar com o Claude</button>' +
      '<div class="sep"></div><p class="peq muted" style="margin:0 0 8px">Ideias para começar</p><div class="opcoes">' + SUGESTOES.map(function (s) { return '<button class="opcao peq" data-sug="' + esc(s) + '" style="font-weight:500;text-align:left">' + esc(s) + '</button>'; }).join('') + '</div>' +
      '<div class="caixa in" style="margin:16px 0 0">' + i('shield-check') + '<span>O Estúdio segue as regras de publicidade médica do CFM, não inventa dados e não usa informações de pacientes. Todo conteúdo passa pela sua aprovação.</span></div></div>' +
      '<div id="resultado">' + (est.ultimo ? '' : '<div class="cartao">' + A.vazio('wand-sparkles', 'Seu conteúdo aparece aqui', 'Com a prévia, os alertas de publicidade e os botões para baixar.') + '</div>') + '</div></div>';
    A.api('usoEstudio').then(function (u) { var c = el.querySelector('#uso'); if (c) { c.innerHTML = i('gauge') + ' ' + u.pecas + '/' + u.limites.pecas + ' peças · ' + u.videos + '/' + u.limites.videos + ' vídeos no mês'; A.icones(); } }).catch(function () { });
    el.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { est.formato = b.dataset.f; el.querySelectorAll('[data-f]').forEach(function (x) { x.classList.toggle('on', x === b); }); el.querySelector('#dur').hidden = est.formato !== 'video'; }; });
    el.querySelectorAll('[data-sug]').forEach(function (b) { b.onclick = function () { el.querySelector('[name=pedido]').value = b.dataset.sug; var f = /v[ií]deo/i.test(b.dataset.sug) ? 'video' : (/stories/i.test(b.dataset.sug) ? 'stories' : (/^post/i.test(b.dataset.sug) ? 'post' : 'carrossel')); el.querySelector('[data-f="' + f + '"]').click(); }; });
    el.querySelector('#criar').onclick = function () {
      var b = this, dd = A.form(el.querySelector('.estudio .cartao')); dd.formato = est.formato; dd.canal = est.formato === 'video' ? 'reels' : 'instagram';
      b.disabled = true; b.innerHTML = '<span class="carregando"></span> Criando...';
      el.querySelector('#resultado').innerHTML = '<div class="cartao">' + A.vazio('loader', 'O Claude está criando', 'Planejando o conteúdo e conferindo as regras de publicidade médica.') + '</div>'; A.icones();
      A.api('estudio', dd).then(function (cnt) { est.ultimo = cnt.id; return A.recarregar().then(function () { mostrarConteudo(el.querySelector('#resultado'), cnt.id); }); })
        .catch(function (e) { el.querySelector('#resultado').innerHTML = '<div class="cartao"><div class="caixa al">' + i('circle-alert') + '<span>' + esc(e.message) + '</span></div></div>'; A.icones(); })
        .then(function () { b.disabled = false; b.innerHTML = i('sparkles') + 'Criar com o Claude'; A.icones(); });
    };
    if (est.ultimo && A.porId('conteudos', est.ultimo)) mostrarConteudo(el.querySelector('#resultado'), est.ultimo);
  };

  /** Prévia + alertas + exportações de um conteúdo (usado no Estúdio e no calendário). */
  function mostrarConteudo(box, id) {
    var c = A.porId('conteudos', id); if (!c) return;
    var p = A.json(c.corpo, {}), alertas = A.json(c.alertas, []), video = p.tipo === 'video' || !!p.cenas, temLam = p.laminas && p.laminas.length;
    var st = A.STATUS_CNT[c.status] || [c.status, 'c-ne'];
    box.innerHTML = '<div class="cartao"><header><div><h2 style="font-size:18px;font-family:var(--mf-fonte-titulo);font-weight:500">' + esc(c.titulo) + '</h2><span class="peq muted">' + esc(c.formato) + ' · ' + esc(c.canal) + '</span></div><span class="chip ponto ' + st[1] + '">' + st[0] + '</span></header>' +
      (alertas.length ? '<div class="caixa al">' + i('triangle-alert') + '<span><b>Publicidade médica:</b> ' + alertas.map(esc).join(' ') + '</span></div>' : '<div class="caixa ok">' + i('shield-check') + '<span>Nenhum alerta automático de publicidade médica. Revise o conteúdo clínico mesmo assim.</span></div>') +
      (temLam ? '<div class="palco" id="palco"></div>' : '') +
      (video ? '<div class="cenas">' + p.cenas.map(function (s) { return '<div class="cena"><span class="tempo">' + fmt(s.inicio_s) + '–' + fmt(s.fim_s) + '</span><div>' + (s.titulo_tela ? '<b>' + esc(s.titulo_tela) + '</b><br>' : '') + esc(s.fala) + (s.visual ? '<small>Imagem: ' + esc(s.visual) + '</small>' : '') + '</div></div>'; }).join('') + '</div>' : '') +
      (!temLam && !video ? '<p style="white-space:pre-wrap">' + esc(p.texto || '') + '</p>' : '') +
      (p.legenda ? '<div class="sep"></div><b class="peq">Legenda</b><p style="margin:6px 0">' + esc(p.legenda) + '</p><p class="peq" style="color:var(--mf-petroleo-2);margin:0">' + (p.hashtags || []).map(function (h) { return '#' + esc(String(h).replace(/^#/, '')); }).join(' ') + '</p>' : '') +
      (p.observacoes_revisao && p.observacoes_revisao.length ? '<div class="sep"></div><b class="peq">Para conferir antes de aprovar</b><ul class="peq muted" style="margin:6px 0 0;padding-left:18px">' + p.observacoes_revisao.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="sep"></div><div class="exportar">' +
      (temLam ? '<button class="btn btn-s btn-pq" data-x="png">' + i('image') + 'Imagens finais</button><button class="btn btn-s btn-pq" data-x="pptx">' + i('pen-tool') + 'Editável no Canva</button>' : '') +
      (video ? '<button class="btn btn-s btn-pq" data-x="capcut">' + i('clapperboard') + 'Projeto do CapCut</button><button class="btn btn-s btn-pq" data-x="srt">' + i('captions') + 'Legendas SRT</button>' : '') +
      '<button class="btn btn-s btn-pq" data-x="docx">' + i('file-text') + (video ? 'Roteiro DOCX' : 'Copy DOCX') + '</button>' +
      (p.legenda ? '<button class="btn btn-g btn-pq" data-x="copiar">' + i('copy') + 'Copiar legenda</button>' : '') + '</div>' +
      '<div class="sep"></div><div class="linha-f">' + acoesStatus(c) + '</div></div>';
    A.icones();
    if (temLam) { var palco = box.querySelector('#palco'); p.laminas.forEach(function (l, n) { A.exportar.lamina(p, n, medico()).then(function (cv) { cv.setAttribute('aria-label', 'Lâmina ' + (n + 1)); palco.appendChild(cv); }); }); }
    box.querySelectorAll('[data-x]').forEach(function (b) { b.onclick = function () {
      var x = b.dataset.x, m = medico(), pr;
      if (x === 'copiar') return A.copiar(p.legenda + '\n\n' + (p.hashtags || []).map(function (h) { return '#' + String(h).replace(/^#/, ''); }).join(' '));
      if (x === 'png') pr = A.exportar.png(p, m);
      if (x === 'pptx') pr = A.exportar.pptx(p, m).then(function () { A.aviso('No Canva: Criar design > Importar arquivo > escolha o .pptx.'); });
      if (x === 'docx') pr = A.exportar.docx([{ conteudo: c, plano: p }], m, c.titulo);
      if (x === 'srt') return A.exportar.srt(p);
      if (x === 'capcut') return dialogoCapcut(p, m);
      b.disabled = true; pr.catch(function (e) { A.aviso(e.message, true); }).then(function () { b.disabled = false; });
    }; });
    box.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { mudarStatus(c, b.dataset.st, box); }; });
  }
  A.mostrarConteudo = mostrarConteudo;
  function fmt(s) { s = Number(s) || 0; return Math.floor(s / 60) + ':' + ('0' + Math.round(s % 60)).slice(-2); }
  var PROX = { ideia: [['producao', 'Começar produção']], producao: [['revisao', 'Enviar para revisão']], revisao: [['aprovado', 'Aprovar'], ['reprovado', 'Reprovar'], ['producao', 'Voltar para produção']],
    aprovado: [['agendado', 'Marcar como agendado'], ['publicado', 'Marcar como publicado']], agendado: [['publicado', 'Marcar como publicado']], reprovado: [['producao', 'Refazer']], publicado: [['arquivado', 'Arquivar']], arquivado: [['ideia', 'Reabrir']] };
  function acoesStatus(c) {
    var pode = A.S.dados.eu.papel === 'titular' || A.S.dados.eu.papel === 'medico';
    return (PROX[c.status] || []).filter(function (x) { return x[0] !== 'aprovado' || pode; }).map(function (x, n) { return '<button class="btn ' + (n === 0 ? 'btn-p' : 'btn-s') + ' btn-pq" data-st="' + x[0] + '">' + x[1] + '</button>'; }).join('');
  }
  function mudarStatus(c, st, box) {
    var dados = { id: c.id, status: st };
    var pr = st === 'aprovado' && A.json(c.alertas, []).length
      ? A.perguntar('Aprovar com alertas?', 'Este conteúdo tem alertas de publicidade médica. Para aprovar mesmo assim, registre a justificativa. Ela fica guardada com o seu nome.', { rotulo: 'Justificativa', obrigatorio: true, confirmar: 'Aprovar' })
      : Promise.resolve('');
    pr.then(function (j) { if (j === null) return; if (j) dados.justificativa = j; return enviar(); });
    function enviar() { return A.api('conteudoStatus', dados).then(function () { A.aviso(st === 'aprovado' ? 'Aprovado. Fica registrado com seu nome.' : 'Status atualizado.'); return A.recarregar(); })
      .then(function () { if (box) mostrarConteudo(box, c.id); }).catch(function (e) { A.aviso(e.message, true); }); }
  }
  function dialogoCapcut(p, m) {
    var cfg = A.store.get('fluyan_capcut', { pasta: 'C:/Users/SEU-USUARIO/AppData/Local/CapCut/User Data/Projects/com.lveditor.draft', dados: 'C:/Users/SEU-USUARIO/AppData/Local/CapCut' });
    A.modal({ titulo: 'Projeto do CapCut', corpo: '<p class="muted" style="margin-top:0">O projeto abre no CapCut para computador com textos, tempos e fundos editáveis. Informe as pastas do CapCut neste computador (o Fluyan lembra da próxima vez).</p>' +
      A.campo('Pasta de rascunhos do CapCut', 'pasta', cfg.pasta, { ajuda: 'No CapCut: Configurações > Projetos > Local do rascunho.' }) +
      A.campo('Pasta de dados do CapCut', 'dados', cfg.dados, { ajuda: 'Normalmente C:/Users/SEU-USUARIO/AppData/Local/CapCut' }) +
      '<div class="caixa in">' + i('info') + '<span>O CapCut do celular não abre rascunhos de computador. Nesse caso, use as legendas SRT e o roteiro.</span></div>',
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: i('download') + 'Baixar projeto', classe: 'btn-p', acao: function (f, el) {
        var d = A.form(el); if (/SEU-USUARIO/.test(d.pasta + d.dados)) return A.aviso('Troque SEU-USUARIO pelo nome do seu usuário do Windows.', true);
        A.store.set('fluyan_capcut', d);
        return A.exportar.capcut(p, m, d.pasta, d.dados).then(function () { f(); A.aviso('Baixado. Descompacte dentro da pasta de rascunhos e abra o CapCut.'); });
      } }] });
  }

  /* ================================================================ CONTEÚDO */
  var cntFiltro = 'ativos';
  T.conteudo = function (el) {
    var d = A.S.dados, lista = (d.conteudos || []).slice().sort(function (a, b) { return (a.data_planejada || '9') < (b.data_planejada || '9') ? -1 : 1; });
    var colunas = [['ideia', 'producao'], ['revisao'], ['aprovado', 'agendado'], ['publicado']], nomes = ['Ideias e produção', 'Em revisão', 'Aprovados', 'Publicados'];
    el.innerHTML = '<div class="topo"><div><h1>Calendário de conteúdo</h1><p>Nada é publicado sem a sua aprovação.</p></div><div class="acoes">' +
      '<button class="btn btn-s" id="docx-mes">' + i('file-text') + 'Baixar copys do mês</button><a class="btn btn-p" href="#estudio">' + i('sparkles') + 'Criar no Estúdio</a></div></div>' +
      (lista.length ? '<div class="funil">' + colunas.map(function (cols, n) {
        var itens = lista.filter(function (c) { return cols.indexOf(c.status) >= 0; });
        return '<div class="coluna"><header><span>' + nomes[n] + '</span><span class="muted">' + itens.length + '</span></header>' + itens.map(function (c) {
          var al = A.json(c.alertas, []).length;
          return '<div class="ficha" style="cursor:pointer" data-c="' + c.id + '"><b>' + esc(c.titulo) + '</b><small>' + esc(c.formato) + (c.data_planejada ? ' · ' + A.fmtData(c.data_planejada) : '') + '</small>' +
            (al ? '<div style="margin-top:6px"><span class="chip c-al">' + al + ' alerta' + (al > 1 ? 's' : '') + '</span></div>' : '') + '</div>'; }).join('') + '</div>';
      }).join('') + '</div>' : '<div class="cartao">' + A.vazio('calendar-range', 'Nenhum conteúdo ainda', 'Crie o primeiro no Estúdio.', '<a class="btn btn-p btn-pq" href="#estudio" style="margin-top:12px">Abrir o Estúdio</a>') + '</div>');
    el.querySelectorAll('[data-c]').forEach(function (f) { f.onclick = function () {
      var m = A.modal({ titulo: 'Conteúdo', largo: true, corpo: '<div id="cx"></div>' + A.campo('Data planejada', 'data_planejada', (A.porId('conteudos', f.dataset.c) || {}).data_planejada, { tipo: 'date' }),
        botoes: [{ rotulo: 'Salvar data', acao: function (fe, mm) { var c = A.porId('conteudos', f.dataset.c); return A.api('conteudo', { id: c.id, titulo: c.titulo, formato: c.formato, canal: c.canal, corpo: A.json(c.corpo, {}), data_planejada: A.form(mm).data_planejada }).then(function () { fe(); return A.atualizar(); }); } }],
        aoFechar: function () { A.atualizar(); } });
      mostrarConteudo(m.el.querySelector('#cx'), f.dataset.c);
    }; });
    el.querySelector('#docx-mes').onclick = function () {
      var mes = A.hoje().slice(0, 7), sel = lista.filter(function (c) { return (c.data_planejada || c.criado_em).slice(0, 7) === mes && c.status !== 'arquivado'; });
      if (!sel.length) sel = lista;
      A.exportar.docx(sel.map(function (c) { return { conteudo: c, plano: A.json(c.corpo, {}) }; }), medico(), 'Conteúdos de ' + mes.split('-').reverse().join('/')).catch(function (e) { A.aviso(e.message, true); });
    };
  };

  /* ================================================================ MINHA PÁGINA */
  var ROTULO_BLOCO = { capa: ['Capa', 'image'], sobre: ['Sobre', 'user-round'], servicos: ['Atendimentos', 'stethoscope'], agendar: ['Agendamento', 'calendar-check'], locais: ['Locais', 'map-pin'],
    planos: ['Acompanhamentos', 'package'], faq: ['Perguntas frequentes', 'circle-help'], texto: ['Texto livre', 'type'], contato: ['Contato', 'message-circle'] };
  var pag = null;
  T.pagina = function (el) {
    var m = medico(), link = A.urlBase() + '/m/?m=' + encodeURIComponent(m.slug || '') + (A.ehDemo() ? '&demo=1' : '');
    el.innerHTML = '<div class="topo"><div><h1>Minha página</h1><p>Sua página profissional com agendamento. Edite os blocos, reordene e publique.</p></div><div class="acoes">' +
      '<a class="btn btn-s" href="' + esc(link) + '" target="_blank" rel="noopener">' + i('external-link') + 'Ver página</a><button class="btn btn-p" id="publicar">' + i('upload') + 'Publicar</button></div></div>' +
      (!m.registro ? '<div class="caixa al">' + i('triangle-alert') + '<span>Preencha o número do registro no conselho em <a href="#perfil">Perfil</a>. Sem ele a página não é publicada.</span></div>' : '') +
      '<div class="grade g2" style="align-items:start"><div class="cartao"><header><h2>Blocos</h2><button class="btn btn-s btn-pq" id="add">' + i('plus') + 'Adicionar bloco</button></header><div id="blocos"><span class="carregando"></span></div>' +
      '<div class="sep"></div><div class="entre"><span class="peq muted" id="st-pag"></span><button class="btn btn-s btn-pq" id="salvar">Salvar rascunho</button></div></div>' +
      '<div class="cartao" style="padding:10px"><div class="entre" style="padding:6px 8px 10px"><b class="peq">Prévia no celular</b><button class="btn btn-g btn-pq" id="copiar-link">' + i('link') + 'Copiar link</button></div>' +
      '<iframe id="previa" title="Prévia da página" style="width:100%;height:720px;border:1px solid var(--mf-linha);border-radius:18px;background:#fff" src="' + esc(link) + '&previa=1"></iframe></div></div>';
    el.querySelector('#copiar-link').onclick = function () { A.copiar(link.replace('&demo=1', '')); };
    A.api('pagina').then(function (r) { pag = r; desenhar(); el.querySelector('#st-pag').textContent = r.status === 'publicada' ? 'Publicada em ' + A.fmtDataCurta(r.publicado_em) : 'Ainda não publicada'; });
    function desenhar() {
      var box = el.querySelector('#blocos');
      box.innerHTML = pag.blocos.map(function (b, n) {
        var r = ROTULO_BLOCO[b.tipo] || [b.tipo, 'square'];
        return '<div style="border:1px solid var(--mf-linha);border-radius:14px;padding:12px;margin-bottom:8px;' + (b.visivel ? '' : 'opacity:.55') + '" data-n="' + n + '">' +
          '<div class="entre"><b class="linha-f">' + i(r[1]) + r[0] + '</b><span class="linha-f">' +
          '<button class="btn btn-g btn-icone" data-a="sobe" aria-label="Subir">' + i('arrow-up') + '</button><button class="btn btn-g btn-icone" data-a="desce" aria-label="Descer">' + i('arrow-down') + '</button>' +
          '<button class="btn btn-g btn-icone" data-a="ver" aria-label="Mostrar ou ocultar">' + i(b.visivel ? 'eye' : 'eye-off') + '</button><button class="btn btn-g btn-icone" data-a="rm" aria-label="Remover">' + i('trash-2') + '</button></span></div>' +
          '<input class="entrada" data-c="titulo" value="' + esc(b.titulo) + '" placeholder="' + (b.tipo === 'capa' ? 'Título da capa (vazio = seu nome)' : 'Título do bloco') + '" style="margin-top:8px">' +
          (['capa', 'sobre', 'texto', 'agendar', 'servicos', 'contato'].indexOf(b.tipo) >= 0 ? '<textarea class="entrada" data-c="texto" rows="2" placeholder="' + (b.tipo === 'sobre' ? 'Vazio = usa a apresentação do seu perfil' : 'Texto (opcional)') + '" style="margin-top:8px;min-height:60px">' + esc(b.texto) + '</textarea>' : '') +
          (b.tipo === 'faq' ? (b.itens || []).map(function (it, k) { return '<div style="margin-top:8px"><input class="entrada" data-faq="' + k + '|p" value="' + esc(it.p) + '" placeholder="Pergunta"><textarea class="entrada" data-faq="' + k + '|r" rows="2" style="margin-top:4px;min-height:52px" placeholder="Resposta">' + esc(it.r) + '</textarea></div>'; }).join('') +
            '<button class="btn btn-g btn-pq" data-a="faq" style="margin-top:6px">' + i('plus') + 'Pergunta</button>' : '') + '</div>';
      }).join('');
      A.icones();
      box.querySelectorAll('[data-n]').forEach(function (cx) {
        var n = Number(cx.dataset.n), b = pag.blocos[n];
        cx.querySelectorAll('[data-c]').forEach(function (inp) { inp.oninput = function () { b[inp.dataset.c] = inp.value; }; });
        cx.querySelectorAll('[data-faq]').forEach(function (inp) { inp.oninput = function () { var x = inp.dataset.faq.split('|'); b.itens[Number(x[0])][x[1]] = inp.value; }; });
        cx.querySelectorAll('[data-a]').forEach(function (bt) { bt.onclick = function () {
          var a = bt.dataset.a;
          if (a === 'sobe' && n > 0) pag.blocos.splice(n - 1, 0, pag.blocos.splice(n, 1)[0]);
          if (a === 'desce' && n < pag.blocos.length - 1) pag.blocos.splice(n + 1, 0, pag.blocos.splice(n, 1)[0]);
          if (a === 'ver') b.visivel = !b.visivel;
          if (a === 'rm') pag.blocos.splice(n, 1);
          if (a === 'faq') { b.itens = b.itens || []; b.itens.push({ p: '', r: '' }); }
          desenhar();
        }; });
      });
    }
    function salvar(publicar, just) {
      return A.api('paginaSalvar', { blocos: pag.blocos, publicar: publicar, justificativa: just }).then(function (r) {
        A.aviso(publicar ? 'Página publicada.' : 'Rascunho salvo.' + (r.alertas.length ? ' Há alertas de publicidade médica.' : ''));
        if (publicar) el.querySelector('#st-pag').textContent = 'Publicada agora';
        var f = el.querySelector('#previa'); f.src = f.src;
      });
    }
    el.querySelector('#salvar').onclick = function () { salvar(false).catch(function (e) { A.aviso(e.message, true); }); };
    el.querySelector('#publicar').onclick = function () {
      salvar(true).catch(function (e) {
        if (e.codigo !== 'alertas') return A.aviso(e.message, true);
        A.perguntar('Publicar com alertas?', e.message + ' Para publicar mesmo assim, registre a justificativa.', { rotulo: 'Justificativa', obrigatorio: true, confirmar: 'Publicar' })
          .then(function (j) { if (j) salvar(true, j).catch(function (x) { A.aviso(x.message, true); }); });
      });
    };
    el.querySelector('#add').onclick = function () {
      var mm = A.modal({ titulo: 'Adicionar bloco', corpo: '<div class="opcoes">' + Object.keys(ROTULO_BLOCO).map(function (k) { return '<button class="opcao" data-t="' + k + '">' + i(ROTULO_BLOCO[k][1]) + ROTULO_BLOCO[k][0] + '</button>'; }).join('') + '</div>' });
      mm.el.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { pag.blocos.push({ tipo: b.dataset.t, visivel: true, titulo: ROTULO_BLOCO[b.dataset.t][0], texto: '', itens: b.dataset.t === 'faq' ? [{ p: '', r: '' }] : [] }); mm.fechar(); desenhar(); }; });
    };
  };
})();
