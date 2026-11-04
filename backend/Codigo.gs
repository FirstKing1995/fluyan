/* ==========================================================================
   FLUYAN — servidor (Google Apps Script)
   Arquivos do projeto Apps Script:
     Codigo.gs  (este)  roteador, adaptador de planilhas, trava, instalação
     Nucleo.gs          cópia de site/app/js/nucleo.js (gerada por ferramentas/montar.js)
     Estudio.gs         chamadas ao Claude (Estúdio)
   A planilha onde o script está vinculado é a CENTRAL. Cada cliente ganha
   uma planilha própria, criada automaticamente.
   SEGREDOS: só em Propriedades do Script (Configurações do projeto). Nunca aqui.
   ========================================================================== */

var FUSO = 'America/Fortaleza';
var PROPS = PropertiesService.getScriptProperties();

/* --------------------------------------------------------------- planilhas */
var Planilhas = (function () {
  var central = null, tenantSS = null, tenantId = '', cache = {};

  function ssCentral() { return central || (central = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(PROPS.getProperty('PLANILHA_CENTRAL'))); }
  function ehCentral(nome) { return Fluyan.CENTRAIS.indexOf(nome) >= 0; }
  function planilhaDe(nome) {
    if (ehCentral(nome)) return ssCentral();
    if (!tenantSS) throw new Error('Tenant não selecionado para a tabela ' + nome);
    return tenantSS;
  }
  function aba(nome) {
    var ss = planilhaDe(nome), sh = ss.getSheetByName(nome);
    if (!sh) sh = criarAba(ss, nome);
    return sh;
  }
  function criarAba(ss, nome) {
    var col = Fluyan.TABELAS[nome], sh = ss.insertSheet(nome);
    sh.getRange(1, 1, sh.getMaxRows(), col.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, col.length).setValues([col]).setFontWeight('bold').setBackground('#E4F1EC');
    sh.setFrozenRows(1);
    return sh;
  }
  function chaveCache(nome) { return (ehCentral(nome) ? 'C' : tenantId) + ':' + nome; }
  /** Neutraliza injeção de fórmula: texto que começa com = + - @ vira texto literal. */
  function seguro(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'sim' : 'nao';
    var s = String(v);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
  }
  function ler(nome) {
    var k = chaveCache(nome);
    if (cache[k]) return cache[k];
    var sh = aba(nome), col = Fluyan.TABELAS[nome], n = sh.getLastRow() - 1;
    var linhas = n > 0 ? sh.getRange(2, 1, n, col.length).getValues() : [];
    var out = linhas.map(function (l) { var o = {}; col.forEach(function (c, i) { o[c] = l[i] instanceof Date ? Utilities.formatDate(l[i], FUSO, "yyyy-MM-dd'T'HH:mm") : String(l[i]); }); return o; });
    cache[k] = out;
    return out;
  }
  function inserir(nome, obj) {
    var col = Fluyan.TABELAS[nome];
    aba(nome).appendRow(col.map(function (c) { return seguro(obj[c]); }));
    var k = chaveCache(nome); if (cache[k]) { var o = {}; col.forEach(function (c) { o[c] = obj[c] == null ? '' : String(obj[c]); }); cache[k].push(o); }
  }
  function linhaDe(nome, id, chave) {
    var col = Fluyan.TABELAS[nome], ci = col.indexOf(chave || 'id'), sh = aba(nome), n = sh.getLastRow() - 1;
    if (n < 1) return -1;
    var vals = sh.getRange(2, ci + 1, n, 1).getValues();
    for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(id)) return i + 2;
    return -1;
  }
  function atualizar(nome, id, campos, tid, chave) {
    var col = Fluyan.TABELAS[nome], r = linhaDe(nome, id, chave);
    if (r < 0) return;
    var sh = aba(nome), atual = sh.getRange(r, 1, 1, col.length).getValues()[0];
    col.forEach(function (c, i) { if (c in campos) atual[i] = seguro(campos[c]); });
    sh.getRange(r, 1, 1, col.length).setValues([atual]);
    var k = chaveCache(nome);
    if (cache[k]) cache[k].forEach(function (o) { if (o[chave || 'id'] === String(id)) Object.keys(campos).forEach(function (c) { o[c] = campos[c] == null ? '' : String(campos[c]); }); });
  }
  function excluir(nome, id) {
    var r = linhaDe(nome, id); if (r > 0) aba(nome).deleteRow(r);
    delete cache[chaveCache(nome)];
  }
  function usarTenant(ten) {
    if (!ten || !ten.planilha_id) throw new Error('Cliente sem planilha.');
    if (tenantId === ten.id) return;
    tenantSS = SpreadsheetApp.openById(ten.planilha_id); tenantId = ten.id;
  }
  /** Cria a planilha e a pasta do novo cliente. */
  function criarPlanilhaTenant(ten) {
    var pastaRaiz = DriveApp.getFolderById(PROPS.getProperty('PASTA_CLIENTES'));
    var pasta = pastaRaiz.createFolder(ten.nome + ' · ' + ten.id);
    var ss = SpreadsheetApp.create('Fluyan · ' + ten.nome);
    DriveApp.getFileById(ss.getId()).moveTo(pasta);
    Object.keys(Fluyan.TABELAS).filter(function (n) { return !ehCentral(n); }).forEach(function (n) { criarAba(ss, n); });
    var padrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1') || ss.getSheetByName('Planilha1');
    if (padrao) ss.deleteSheet(padrao);
    return { planilha_id: ss.getId(), pasta_id: pasta.getId() };
  }
  return { ler: ler, inserir: inserir, atualizar: atualizar, excluir: excluir, usarTenant: usarTenant, criarPlanilhaTenant: criarPlanilhaTenant, ssCentral: ssCentral, criarAba: criarAba };
})();

/* ------------------------------------------------------------------ núcleo */
function hashHex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function nucleo_() {
  return Fluyan.criarNucleo(Planilhas, {
    agora: function () { return Utilities.formatDate(new Date(), FUSO, "yyyy-MM-dd'T'HH:mm"); },
    id: function (p) { return p + Utilities.formatDate(new Date(), FUSO, 'yyMMddHHmmss') + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase(); },
    segredo: function () { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); },
    hash: hashHex_,
    iteracoes: 100,
    trava: function (fn) {
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(20000)) throw Object.assign(new Error('Sistema ocupado. Tente de novo.'), { publico: true, codigo: 'ocupado' });
      try { return fn(); } finally { lock.releaseLock(); }
    },
    aoCriarTenant: function (ten) { return Planilhas.criarPlanilhaTenant(ten); },
    ia: function (tarefa, entrada, ctx) { return Estudio.executar(tarefa, entrada, ctx); },
    registrarErro: registrarErro_
  });
}

/* ------------------------------------------------------------------- HTTP */
function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return json_({ ok: false, erro: 'Pedido inválido.' }); }
  if (req.acao === 'assinar') return json_(Webhooks.iniciar(req.dados));
  if (req.type || req.topic || req.action) return json_(Webhooks.mercadoPago(req, e));
  return json_(nucleo_().processar(req));
}
function doGet(e) {
  if (e && e.parameter && e.parameter.topic) return json_(Webhooks.mercadoPago({ dados: e.parameter }, e));
  return json_({ ok: true, app: 'Fluyan', versao: Fluyan.VERSAO });
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function registrarErro_(err, onde) {
  try {
    var ss = Planilhas.ssCentral(), sh = ss.getSheetByName('ERROS') || ss.insertSheet('ERROS');
    sh.appendRow([Utilities.formatDate(new Date(), FUSO, "yyyy-MM-dd'T'HH:mm:ss"), String(onde || ''), String(err && err.message || err).slice(0, 500), String(err && err.stack || '').slice(0, 1500)]);
  } catch (x) { console.error(err); }
}

/* -------------------------------------------------------------- instalação */
/**
 * Rode UMA vez pelo editor, depois de preencher nas Propriedades do Script:
 *   ADMIN_EMAIL, ADMIN_SENHA (mín. 8 caracteres)
 * Cria as abas centrais, a pasta dos clientes e o acesso de administrador.
 */
function instalar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  PROPS.setProperty('PLANILHA_CENTRAL', ss.getId());
  Fluyan.CENTRAIS.forEach(function (n) { if (!ss.getSheetByName(n)) Planilhas.criarAba(ss, n); });
  if (!PROPS.getProperty('PASTA_CLIENTES')) {
    var pai = DriveApp.getFileById(ss.getId()).getParents();
    var base = pai.hasNext() ? pai.next() : DriveApp.getRootFolder();
    PROPS.setProperty('PASTA_CLIENTES', base.createFolder('Fluyan · clientes').getId());
  }
  var em = PROPS.getProperty('ADMIN_EMAIL'), se = PROPS.getProperty('ADMIN_SENHA');
  if (!em || !se) throw new Error('Preencha ADMIN_EMAIL e ADMIN_SENHA nas Propriedades do Script antes de instalar.');
  var N = nucleo_(), u = N.criarUsuario('Administrador', em, se);
  if (!Planilhas.ler('PAPEIS').some(function (p) { return p.user_id === u.id && p.papel === 'admin'; }))
    Planilhas.inserir('PAPEIS', { id: 'PAPADM' + Utilities.getUuid().slice(0, 8).toUpperCase(), user_id: u.id, tenant_id: '', papel: 'admin', doctor_id: '', local_id: '', status: 'ativo', criado_em: '' });
  PROPS.deleteProperty('ADMIN_SENHA');
  var padrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1') || ss.getSheetByName('Planilha1');
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);
  Logger.log('Instalado. Agora: Implantar > Nova implantação > App da Web (executar como você, acesso: qualquer pessoa). Copie a URL para site/app/js/config.js.');
}

/** Cria um cliente pelo editor (útil antes do checkout estar ligado). Edite os dados e rode. */
function criarClienteManual() {
  var r = nucleo_().criarTenant({ nome: 'Consultório Dra. Exemplo', tipo: 'individual', plano: 'profissional',
    titular: { nome: 'Dra. Exemplo', email: 'exemplo@seudominio.com', senha: 'troque-esta-senha', especialidade: 'Clínica médica' } });
  Logger.log(JSON.stringify(r));
}
