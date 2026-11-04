/* ==========================================================================
   FLUYAN — exportações do Estúdio (tudo no navegador do médico)
   O mesmo PLANO gera o arquivo final e o editável:
     peças → PNG (final), ZIP de PNGs, PPTX (editável no Canva), DOCX (copy)
     vídeo → rascunho do CapCut (editável), SRT (legendas), DOCX (roteiro)
   ========================================================================== */
(function () {
  'use strict';
  var A = window.A, X = A.exportar = {};
  var LIBS = {
    zip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    pptx: 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
  };
  var TAM = { '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920] };
  var COR = { tinta: '#10262E', perola: '#F6F5F1', salvia: '#8CC7B5', champanhe: '#C8A96A', texto2: '#4E5F64' };

  function arquivoNome(s) { return A.norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'conteudo'; }
  function assinatura(m) { return [m.nome_publico, (m.conselho || 'CRM') + ' ' + (m.registro || '') + (m.uf ? ' ' + m.uf : ''), m.rqe ? 'RQE ' + m.rqe : ''].filter(function (x) { return x && x.trim(); }).join(' · '); }
  function clarear(hex, f) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; return 'rgb(' + [r, g, b].map(function (c) { return Math.round(c + (255 - c) * f); }).join(',') + ')'; }

  /* ------------------------------------------------------------- canvas */
  function quebrar(ctx, texto, larg) {
    var out = []; String(texto || '').split('\n').forEach(function (par) {
      var linha = ''; par.split(' ').forEach(function (p) { var t = linha ? linha + ' ' + p : p; if (ctx.measureText(t).width > larg && linha) { out.push(linha); linha = p; } else linha = t; });
      out.push(linha);
    }); return out;
  }
  function escrever(ctx, texto, x, y, larg, alt) { var ls = quebrar(ctx, texto, larg); ls.forEach(function (l, n) { ctx.fillText(l, x, y + n * alt); }); return y + ls.length * alt; }
  function iconeImg(nome, cor) {
    return new Promise(function (ok) {
      var L = window.lucide; var pasc = String(nome || '').replace(/(^|-)(\w)/g, function (m, a, c) { return c.toUpperCase(); });
      var def = L && L.icons && (L.icons[pasc] || L.icons[nome]);
      if (!def) return ok(null);
      var el = L.createElement(def); el.setAttribute('stroke', cor); el.setAttribute('width', '96'); el.setAttribute('height', '96'); el.setAttribute('stroke-width', '1.6');
      var img = new Image(); img.onload = function () { ok(img); }; img.onerror = function () { ok(null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(el));
    });
  }
  /** Desenha uma lâmina da peça. Devolve uma Promise<canvas>. */
  X.lamina = function (plano, n, medico) {
    var L = plano.laminas[n], wh = TAM[plano.proporcao] || TAM['4:5'], W = wh[0], H = wh[1];
    var cor = medico.cor && /^#[0-9a-f]{6}$/i.test(medico.cor) ? medico.cor : '#0F5257';
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d');
    var escuro = L.papel !== 'conteudo', fundo = L.papel === 'capa' ? cor : (L.papel === 'fechamento' ? COR.tinta : COR.perola);
    var tinta = escuro ? '#FFFFFF' : COR.tinta, sub = escuro ? 'rgba(255,255,255,.78)' : COR.texto2, acento = escuro ? COR.salvia : cor;
    return Promise.all([document.fonts ? document.fonts.ready : null, iconeImg(L.icone, acento)]).then(function (r) {
      var ic = r[1], M = 88;
      c.fillStyle = fundo; c.fillRect(0, 0, W, H);
      if (escuro) { var g = c.createRadialGradient(W * .9, H * .95, 10, W * .9, H * .95, W * .9); g.addColorStop(0, 'rgba(140,199,181,.28)'); g.addColorStop(1, 'rgba(140,199,181,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
      else { c.fillStyle = clarear(cor, .86); c.beginPath(); c.arc(W - 40, 120, 260, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = sub; c.font = '600 30px "Plus Jakarta Sans", sans-serif'; c.textBaseline = 'top';
      c.fillText(String(medico.nome_publico || '').toUpperCase(), M, M);
      var y = L.papel === 'capa' ? H * .34 : M + 150;
      if (ic) { c.drawImage(ic, M, y - 10, 96, 96); y += 130; }
      if (L.destaque) { c.fillStyle = acento; c.font = '500 132px Fraunces, Georgia, serif'; c.fillText(L.destaque, M, y); y += 160; }
      c.fillStyle = tinta; c.font = '500 ' + (L.papel === 'capa' ? 92 : 74) + 'px Fraunces, Georgia, serif';
      y = escrever(c, L.titulo, M, y, W - M * 2, L.papel === 'capa' ? 104 : 86) + 30;
      c.fillStyle = sub; c.font = '400 40px "Plus Jakarta Sans", sans-serif';
      escrever(c, L.texto, M, y, W - M * 2, 58);
      c.fillStyle = escuro ? 'rgba(255,255,255,.18)' : 'rgba(16,38,46,.12)'; c.fillRect(M, H - M - 56, W - M * 2, 2);
      c.fillStyle = sub; c.font = '500 28px "Plus Jakarta Sans", sans-serif';
      c.fillText(assinatura(medico), M, H - M - 30);
      if (plano.laminas.length > 1) { c.textAlign = 'right'; c.fillText((n + 1) + '/' + plano.laminas.length, W - M, H - M - 30); c.textAlign = 'left'; }
      return cv;
    });
  };
  function blobDe(cv) { return new Promise(function (ok) { cv.toBlob(ok, 'image/png'); }); }

  X.png = function (plano, medico) {
    var nome = arquivoNome(plano.titulo);
    return Promise.all(plano.laminas.map(function (l, n) { return X.lamina(plano, n, medico); })).then(function (cvs) {
      if (cvs.length === 1) return blobDe(cvs[0]).then(function (b) { A.baixar(nome + '.png', b); });
      return A.carregarScript(LIBS.zip).then(function () {
        var z = new window.JSZip();
        return Promise.all(cvs.map(blobDe)).then(function (bs) { bs.forEach(function (b, n) { z.file(nome + '-' + String(n + 1).padStart(2, '0') + '.png', b); }); return z.generateAsync({ type: 'blob' }); })
          .then(function (b) { A.baixar(nome + '-imagens.zip', b); });
      });
    });
  };

  /* --------------------------------------------- PPTX (editável no Canva) */
  X.pptx = function (plano, medico) {
    return A.carregarScript(LIBS.pptx).then(function () {
      var wh = TAM[plano.proporcao] || TAM['4:5'], P = 144, Wi = wh[0] / P, Hi = wh[1] / P, M = 88 / P;
      var cor = (medico.cor || '#0F5257').replace('#', ''), p = new window.PptxGenJS();
      p.defineLayout({ name: 'FLUYAN', width: Wi, height: Hi }); p.layout = 'FLUYAN'; p.title = plano.titulo; p.author = medico.nome_publico || 'Fluyan';
      plano.laminas.forEach(function (L, n) {
        var s = p.addSlide(), escuro = L.papel !== 'conteudo';
        s.background = { color: L.papel === 'capa' ? cor : (L.papel === 'fechamento' ? '10262E' : 'F6F5F1') };
        var tinta = escuro ? 'FFFFFF' : '10262E', sub = escuro ? 'D9E4E2' : '4E5F64', acento = escuro ? '8CC7B5' : cor;
        s.addText(String(medico.nome_publico || '').toUpperCase(), { x: M, y: M, w: Wi - 2 * M, h: .35, fontFace: 'Plus Jakarta Sans', fontSize: 11, bold: true, color: sub, margin: 0 });
        var y = L.papel === 'capa' ? Hi * .34 : M + 1.05;
        if (L.destaque) { s.addText(L.destaque, { x: M, y: y, w: Wi - 2 * M, h: 1.0, fontFace: 'Fraunces', fontSize: 48, color: acento, margin: 0 }); y += 1.1; }
        s.addText(L.titulo, { x: M, y: y, w: Wi - 2 * M, h: 1.9, fontFace: 'Fraunces', fontSize: L.papel === 'capa' ? 34 : 27, color: tinta, valign: 'top', margin: 0 });
        s.addText(L.texto || '', { x: M, y: y + 2.0, w: Wi - 2 * M, h: 2.2, fontFace: 'Plus Jakarta Sans', fontSize: 15, color: sub, valign: 'top', margin: 0, lineSpacingMultiple: 1.2 });
        s.addShape(p.ShapeType.line, { x: M, y: Hi - M - .42, w: Wi - 2 * M, h: 0, line: { color: escuro ? '5E7C80' : 'D5D2CA', width: 1 } });
        s.addText(assinatura(medico), { x: M, y: Hi - M - .32, w: Wi - 2 * M - .8, h: .3, fontFace: 'Plus Jakarta Sans', fontSize: 10, color: sub, margin: 0 });
        if (plano.laminas.length > 1) s.addText((n + 1) + '/' + plano.laminas.length, { x: Wi - M - .8, y: Hi - M - .32, w: .8, h: .3, fontFace: 'Plus Jakarta Sans', fontSize: 10, color: sub, align: 'right', margin: 0 });
      });
      return p.write({ outputType: 'blob' }).then(function (b) { A.baixar(arquivoNome(plano.titulo) + '-editavel-canva.pptx', b); });
    });
  };

  /* -------------------------------------------------------------- DOCX */
  function xmlEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function par(texto, o) {
    o = o || {};
    var rpr = '<w:rPr><w:rFonts w:ascii="' + (o.serif ? 'Georgia' : 'Calibri') + '" w:hAnsi="' + (o.serif ? 'Georgia' : 'Calibri') + '"/>' + (o.b ? '<w:b/>' : '') +
      (o.cor ? '<w:color w:val="' + o.cor + '"/>' : '') + '<w:sz w:val="' + (o.tam || 22) + '"/></w:rPr>';
    return '<w:p><w:pPr><w:spacing w:before="' + (o.antes || 0) + '" w:after="' + (o.depois == null ? 120 : o.depois) + '"/></w:pPr>' +
      String(texto == null ? '' : texto).split('\n').map(function (l, n) { return (n ? '<w:r><w:br/></w:r>' : '') + '<w:r>' + rpr + '<w:t xml:space="preserve">' + xmlEsc(l) + '</w:t></w:r>'; }).join('') + '</w:p>';
  }
  /** pecas: [{conteudo, plano}] · gera um .docx real (Word, Google Docs). */
  X.docx = function (pecas, medico, titulo) {
    return A.carregarScript(LIBS.zip).then(function () {
      var corpo = par(titulo || 'Conteúdos', { serif: true, tam: 44, cor: '0F5257', depois: 60 }) +
        par(assinatura(medico) + ' · gerado pela Fluyan em ' + A.fmtDataCurta(A.hoje()), { tam: 18, cor: '84918F', depois: 360 });
      pecas.forEach(function (x) {
        var c = x.conteudo || {}, p = x.plano || {}, st = (A.STATUS_CNT[c.status] || [c.status])[0];
        corpo += par(c.titulo || p.titulo, { serif: true, tam: 32, cor: '10262E', antes: 240 }) +
          par([c.formato, c.canal, c.data_planejada ? 'publicar em ' + A.fmtDataCurta(c.data_planejada) : '', 'status: ' + st].filter(Boolean).join(' · '), { tam: 18, cor: '84918F' });
        if (c.status !== 'aprovado' && c.status !== 'publicado' && c.status !== 'agendado') corpo += par('RASCUNHO, AINDA NÃO APROVADO PELO MÉDICO', { b: true, tam: 18, cor: 'B7832B' });
        (p.laminas || []).forEach(function (l, n) { corpo += par('Lâmina ' + (n + 1) + (l.destaque ? ' · ' + l.destaque : ''), { b: true, tam: 20, cor: '1D7874', antes: 120, depois: 40 }) + par(l.titulo, { b: true }) + (l.texto ? par(l.texto) : ''); });
        (p.cenas || []).forEach(function (s) { corpo += par(fmtT(s.inicio_s) + ' a ' + fmtT(s.fim_s) + (s.titulo_tela ? ' · tela: ' + s.titulo_tela : ''), { b: true, tam: 20, cor: '1D7874', antes: 120, depois: 40 }) + par(s.fala) + (s.visual ? par('Imagem: ' + s.visual, { tam: 18, cor: '84918F' }) : ''); });
        if (p.texto) corpo += par(p.texto);
        if (p.legenda) corpo += par('Legenda', { b: true, antes: 160, depois: 40 }) + par(p.legenda);
        if (p.hashtags && p.hashtags.length) corpo += par(p.hashtags.map(function (h) { return '#' + String(h).replace(/^#/, ''); }).join(' '), { cor: '1D7874' });
        if (p.cta) corpo += par('Chamada: ' + p.cta);
        var al = A.json(c.alertas, []);
        if (al.length) corpo += par('Alertas de publicidade médica', { b: true, cor: 'C2554D', antes: 120, depois: 40 }) + par(al.join('\n'), { cor: 'C2554D' });
        if (p.observacoes_revisao && p.observacoes_revisao.length) corpo += par('Para conferir antes de aprovar', { b: true, antes: 120, depois: 40 }) + par(p.observacoes_revisao.map(function (o) { return '- ' + o; }).join('\n'));
      });
      var z = new window.JSZip();
      z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
      z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      z.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + corpo +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>');
      return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
        .then(function (b) { A.baixar(arquivoNome(titulo || 'conteudos') + '.docx', b); });
    });
  };

  /* --------------------------------------------------------------- SRT */
  function fmtT(s) { s = Number(s) || 0; return Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2); }
  function srtT(s) { var ms = Math.round((Number(s) || 0) * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60; return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + ss).slice(-2) + ',' + ('00' + ms % 1000).slice(-3); }
  X.srtTexto = function (plano) { return plano.cenas.map(function (c, n) { return (n + 1) + '\n' + srtT(c.inicio_s) + ' --> ' + srtT(c.fim_s) + '\n' + c.fala + '\n'; }).join('\n'); };
  X.srt = function (plano) { A.baixar(arquivoNome(plano.titulo) + '.srt', new Blob([X.srtTexto(plano)], { type: 'text/plain;charset=utf-8' })); };

  /* ------------------------------------------------------- CapCut */
  var modeloCapcut = null;
  function uid() { return (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); })).toUpperCase(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function hexDe(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return ('00000000' + (h >>> 0).toString(16)).slice(-8) + ('00000000' + ((h * 2654435761) >>> 0).toString(16)).slice(-8) + '0000000000000000'; }
  /** Cartela de fundo da cena (só fundo e assinatura; o texto vai editável no CapCut). */
  function cartela(medico, n) {
    var cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920; var c = cv.getContext('2d');
    var cor = medico.cor && /^#[0-9a-f]{6}$/i.test(medico.cor) ? medico.cor : '#0F5257';
    c.fillStyle = n % 2 ? COR.tinta : cor; c.fillRect(0, 0, 1080, 1920);
    var g = c.createRadialGradient(900, 1700, 10, 900, 1700, 1100); g.addColorStop(0, 'rgba(140,199,181,.30)'); g.addColorStop(1, 'rgba(140,199,181,0)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
    c.fillStyle = 'rgba(255,255,255,.72)'; c.font = '500 30px "Plus Jakarta Sans", sans-serif'; c.textBaseline = 'top'; c.fillText(assinatura(medico), 88, 1780);
    return blobDe(cv);
  }
  /**
   * Monta a pasta do rascunho do CapCut Desktop em um .zip.
   * pasta: pasta de rascunhos do CapCut no computador do médico (ex.: C:/Users/Ana/AppData/Local/CapCut/User Data/Projects/com.lveditor.draft)
   * dados: pasta de dados do CapCut (ex.: C:/Users/Ana/AppData/Local/CapCut)
   */
  X.capcut = function (plano, medico, pasta, dados) {
    pasta = String(pasta || '').replace(/\\/g, '/').replace(/\/+$/, ''); dados = String(dados || '').replace(/\\/g, '/').replace(/\/+$/, '');
    var nomeProj = 'Fluyan ' + arquivoNome(plano.titulo), raiz = pasta + '/' + nomeProj;
    return Promise.all([A.carregarScript(LIBS.zip), modeloCapcut || fetch('capcut/modelo.json').then(function (r) { return r.json(); })]).then(function (r) {
      modeloCapcut = r[1];
      var MOD = JSON.parse(JSON.stringify(modeloCapcut).split('{{CAPCUT}}').join(dados));
      var Ab = MOD.conteudo, M = Ab.materials, US = 1e6, us = function (s) { return Math.round(s * US); };
      var byId = {}; Object.keys(M).forEach(function (k) { if (Array.isArray(M[k])) M[k].forEach(function (o) { if (o && o.id) byId[o.id] = { k: k, o: o }; }); });
      var tTexto = Ab.tracks.filter(function (t) { return t.type === 'text'; })[0], tImg = Ab.tracks[2] && Ab.tracks[2].type === 'video' ? Ab.tracks[2] : Ab.tracks[0];
      var SEG_TEXTO = tTexto.segments[0], SEG_IMG = tImg.segments[0];
      var MAT_TEXTO = byId[SEG_TEXTO.material_id].o, MAT_IMG = byId[SEG_IMG.material_id].o;
      var ANIM_TEXTO = M.material_animations.filter(function (a) { return a.animations[0] && a.animations[0].material_type === 'sticker'; })[0];
      var mats = {}; Object.keys(M).forEach(function (k) { mats[k] = Array.isArray(M[k]) ? [] : M[k]; });
      function add(k, o) { mats[k].push(o); return o.id; }
      function extras(seg, pular) { return seg.extra_material_refs.map(function (x) { return byId[x]; }).filter(function (x) { return x && (pular || []).indexOf(x.k) < 0; }).map(function (x) { var o = clone(x.o); o.id = uid(); return add(x.k, o); }); }
      function segmento(molde, matId, ini, dur, extra, clip) {
        var s = clone(molde); s.id = uid(); s.material_id = matId; s.target_timerange = { start: us(ini), duration: us(dur) }; s.extra_material_refs = extra; s.common_keyframes = []; s.keyframe_refs = [];
        if (clip && s.clip) { s.clip = Object.assign({}, s.clip, { alpha: 1, scale: { x: clip.scale || 1, y: clip.scale || 1 }, transform: { x: clip.x || 0, y: clip.y || 0 } }); s.uniform_scale = { on: true, value: clip.scale || 1 }; }
        return s;
      }
      function trilha(molde, segs) { var t = clone(molde); t.id = uid(); t.segments = segs; t.name = ''; t.is_default_name = true; return t; }
      function texto(t, ini, dur, y, tam, corHex) {
        var mat = clone(MAT_TEXTO); mat.id = uid();
        var corRgb = [1, 3, 5].map(function (i) { return parseInt(corHex.slice(i, i + 2), 16) / 255; });
        mat.content = JSON.stringify({ text: t, styles: [{ fill: { content: { render_type: 'solid', solid: { color: corRgb } } }, font: { path: mat.font_path || '', id: '' }, size: tam, range: [0, t.length] }] });
        Object.assign(mat, { text_color: corHex, font_size: tam, has_shadow: true, shadow_color: '#000000', shadow_alpha: .35, shadow_smoothing: .6, shadow_distance: 3, line_max_width: .86, alignment: 1 });
        add('texts', mat);
        var an = ANIM_TEXTO ? (function () { var a = clone(ANIM_TEXTO); a.id = uid(); a.animations[0].duration = us(.3); return add('material_animations', a); })() : null;
        return segmento(SEG_TEXTO, mat.id, ini, dur, an ? [an] : [], { scale: 1, x: 0, y: y });
      }
      var cenas = plano.cenas.slice().sort(function (a, b) { return a.inicio_s - b.inicio_s; });
      var t0 = cenas[0].inicio_s, fim = cenas[cenas.length - 1].fim_s - t0;
      var fundos = [], titulos = [], legendas = [], midias = [];
      cenas.forEach(function (c, n) {
        var ini = c.inicio_s - t0, dur = Math.max(.5, c.fim_s - c.inicio_s), arq = raiz + '/fluyan-midia/cena-' + (n + 1) + '.png';
        var mat = clone(MAT_IMG); Object.assign(mat, { id: uid(), unique_id: hexDe(arq), path: arq, material_name: 'cena-' + (n + 1) + '.png', width: 1080, height: 1920 }); add('videos', mat);
        var ex = extras(SEG_IMG, ['material_animations']); ex.push(add('material_animations', { id: uid(), type: 'sticker_animation', animations: [], multi_language_current: 'none' }));
        var s = segmento(SEG_IMG, mat.id, ini, dur, ex, { scale: 1 }); s.source_timerange = { start: 0, duration: us(dur) }; fundos.push(s);
        midias.push(n);
        if (c.titulo_tela) titulos.push(texto(c.titulo_tela, ini, dur, .42, 15, '#FFFFFF'));
        legendas.push(texto(c.fala, ini, dur, -.5, 8, '#FFFFFF'));
      });
      var tracks = [trilha(tImg, fundos), trilha(tTexto, titulos), trilha(tTexto, legendas)].filter(function (t) { return t.segments.length; });
      tracks.forEach(function (t, n) { t.segments.forEach(function (s) { s.track_render_index = n; if (t.type === 'text') s.render_index = 14000 + n; }); });
      var draft = clone(Ab); draft.duration = us(fim); draft.tracks = tracks; draft.materials = mats; draft.name = nomeProj;
      var json = JSON.stringify(draft), z = new window.JSZip(), raizZip = z.folder(nomeProj), tl = MOD.timeline;
      Object.keys(MOD.arquivos).forEach(function (p) { raizZip.file(p, MOD.arquivos[p]); });
      ['draft_content.json', 'draft_content.json.bak', 'template-2.tmp', 'Timelines/' + tl + '/draft_content.json', 'Timelines/' + tl + '/draft_content.json.bak', 'Timelines/' + tl + '/template-2.tmp'].forEach(function (p) { raizZip.file(p, json); });
      var meta = clone(MOD.meta), agoraUs = Date.now() * 1000;
      Object.assign(meta, { draft_id: uid(), draft_name: nomeProj, draft_fold_path: raiz, draft_root_path: pasta, tm_duration: us(fim), tm_draft_create: agoraUs, tm_draft_modified: agoraUs, draft_removable_storage_device: pasta.slice(0, 2) });
      raizZip.file('draft_meta_info.json', JSON.stringify(meta));
      raizZip.file('LEIA-ME.txt', 'Projeto do CapCut gerado pela Fluyan.\r\n\r\n1. Feche o CapCut.\r\n2. Descompacte este arquivo dentro de: ' + pasta + '\r\n   (a pasta "' + nomeProj + '" deve ficar direto dentro dela)\r\n3. Abra o CapCut: o projeto aparece na lista de rascunhos.\r\n\r\nTextos, tempos e fundos ficam editáveis. Para usar o seu vídeo, importe-o no CapCut e coloque na trilha de cima.\r\nAs legendas também estão no arquivo .srt, que funciona em qualquer editor.\r\nModelo gerado a partir do CapCut ' + (MOD.versao_capcut || '') + '. Versões muito diferentes podem não abrir o rascunho: nesse caso use o .srt e o roteiro.\r\n');
      raizZip.file(arquivoNome(plano.titulo) + '.srt', X.srtTexto(plano));
      return Promise.all(midias.map(function (n) { return cartela(medico, n).then(function (b) { raizZip.file('fluyan-midia/cena-' + (n + 1) + '.png', b); }); }))
        .then(function () { return z.generateAsync({ type: 'blob' }); })
        .then(function (b) { A.baixar(arquivoNome(plano.titulo) + '-capcut.zip', b); });
    });
  };
})();
