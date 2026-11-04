/* ==========================================================================
   FLUYAN — assinatura pelo Mercado Pago
   Fluxo: página de vendas → acao "assinar" → criamos a assinatura (preapproval)
   no Mercado Pago e devolvemos o link de pagamento → o Mercado Pago avisa o
   webhook → conferimos NA API do Mercado Pago (nunca no navegador) → criamos
   o cliente e enviamos o acesso por e-mail.
   Propriedades do Script:
     MP_ACCESS_TOKEN   token de produção (ou de teste) da conta Mercado Pago
     SITE_URL          ex.: https://usuario.github.io/fluyan
   No Mercado Pago, cadastre o webhook (tópico Assinaturas) apontando para a
   URL do App da Web com ?topic=preapproval.
   ========================================================================== */
var Webhooks = (function () {
  var API = 'https://api.mercadopago.com';

  function mp(metodo, caminho, corpo) {
    var tok = PROPS.getProperty('MP_ACCESS_TOKEN');
    if (!tok) throw Object.assign(new Error('Pagamentos ainda não configurados.'), { publico: true });
    var r = UrlFetchApp.fetch(API + caminho, { method: metodo, contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + tok }, payload: corpo ? JSON.stringify(corpo) : undefined });
    var j = JSON.parse(r.getContentText() || '{}');
    if (r.getResponseCode() >= 300) { registrarErro_(new Error('MP ' + r.getResponseCode() + ' ' + r.getContentText().slice(0, 300)), 'mp'); throw Object.assign(new Error('Não foi possível falar com o Mercado Pago agora.'), { publico: true }); }
    return j;
  }

  /** Ação pública "assinar": registra o cadastro e devolve o link de pagamento. */
  function iniciar(d) {
    try {
      d = d || {};
      var plano = Fluyan.PLANOS[d.plano];
      if (!plano || !plano.preco) return { ok: false, erro: 'Escolha um plano.' };
      var email = String(d.email || '').trim().toLowerCase(), nome = String(d.nome || '').trim().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || nome.length < 3) return { ok: false, erro: 'Informe nome e e-mail válidos.' };
      if (Planilhas.ler('USERS').some(function (u) { return u.email === email; })) return { ok: false, erro: 'Este e-mail já tem conta. Entre pelo painel.' };
      var id = 'CAD' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
      var agora = Utilities.formatDate(new Date(), FUSO, "yyyy-MM-dd'T'HH:mm");
      var site = PROPS.getProperty('SITE_URL') || '';
      var ass = mp('post', '/preapproval', {
        reason: 'Fluyan ' + plano.nome, external_reference: id, payer_email: email, back_url: site + '/obrigado.html',
        auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: plano.preco / 100, currency_id: 'BRL' }, status: 'pending'
      });
      Planilhas.inserir('CADASTROS', { id: id, nome: nome, email: email, whatsapp: String(d.whatsapp || '').replace(/\D/g, ''), tipo: d.tipo === 'clinica' ? 'clinica' : 'individual',
        plano: d.plano, especialidade: String(d.especialidade || '').slice(0, 80), status: 'aguardando_pagamento', mp_id: ass.id, tenant_id: '', criado_em: agora, atualizado_em: agora });
      return { ok: true, dados: { link: ass.init_point } };
    } catch (e) { if (e.publico) return { ok: false, erro: e.message }; registrarErro_(e, 'assinar'); return { ok: false, erro: 'Não foi possível iniciar a assinatura.' }; }
  }

  /** Webhook: confere a assinatura na API e ativa o cliente uma única vez. */
  function mercadoPago(req, e) {
    var p = (e && e.parameter) || {}, corpo = {};
    try { corpo = e && e.postData ? JSON.parse(e.postData.contents) : {}; } catch (x) { /* nada */ }
    var id = (corpo.data && corpo.data.id) || p['data.id'] || p.id;
    var tipo = corpo.type || p.topic || p.type;
    if (!id || !/preapproval/.test(String(tipo))) return { ok: true };
    var lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      var ass = mp('get', '/preapproval/' + encodeURIComponent(id));
      var cad = Planilhas.ler('CADASTROS').filter(function (c) { return c.id === ass.external_reference; })[0];
      if (!cad) return { ok: true };
      var agora = Utilities.formatDate(new Date(), FUSO, "yyyy-MM-dd'T'HH:mm");
      if (ass.status === 'authorized' && !cad.tenant_id) {
        var senha = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
        var r = nucleo_().criarTenant({ nome: cad.tipo === 'clinica' ? cad.nome : 'Consultório ' + cad.nome, tipo: cad.tipo, plano: cad.plano,
          titular: { nome: cad.nome, email: cad.email, senha: senha, especialidade: cad.especialidade, whatsapp: cad.whatsapp, medico: true } });
        Planilhas.atualizar('CADASTROS', cad.id, { status: 'ativo', tenant_id: r.tenant.id, atualizado_em: agora });
        MailApp.sendEmail({ to: cad.email, subject: 'Seu acesso à Fluyan',
          htmlBody: '<p>Olá, ' + cad.nome.replace(/[<>&]/g, '') + '.</p><p>Sua assinatura está ativa. Entre em <a href="' + (PROPS.getProperty('SITE_URL') || '') + '/app/">' +
            (PROPS.getProperty('SITE_URL') || '') + '/app/</a> com este e-mail e a senha provisória <b>' + senha + '</b>.</p><p>Troque a senha no primeiro acesso, em Perfil.</p><p>Equipe Fluyan</p>' });
      } else if ((ass.status === 'paused' || ass.status === 'cancelled') && cad.tenant_id) {
        Planilhas.atualizar('TENANTS', cad.tenant_id, { status: ass.status === 'cancelled' ? 'cancelado' : 'suspenso', atualizado_em: agora });
        Planilhas.atualizar('CADASTROS', cad.id, { status: ass.status, atualizado_em: agora });
      }
      return { ok: true };
    } catch (x) { registrarErro_(x, 'webhook'); return { ok: false }; }
    finally { lock.releaseLock(); }
  }
  return { iniciar: iniciar, mercadoPago: mercadoPago };
})();
