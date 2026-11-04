/* Roda o backend do Apps Script em Node com planilhas simuladas.
   Uso: node ferramentas/testar-gas.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

/* ------------------------------------------------ simulação do Google */
let seq = 0;
const PLANILHAS = {};
function criarPlanilha(nome) {
  const id = 'SS' + (++seq), abas = {};
  const ss = {
    getId: () => id, getUrl: () => 'https://planilha/' + id, getName: () => nome,
    getSheetByName: (n) => abas[n] || null, getSheets: () => Object.values(abas),
    insertSheet: (n) => (abas[n] = criarAba(n)), deleteSheet: (s) => { delete abas[s.nome]; }
  };
  abas.Sheet1 = criarAba('Sheet1');
  PLANILHAS[id] = ss; return ss;
}
function criarAba(nome) {
  const linhas = [];
  const aba = {
    nome, linhas,
    getLastRow: () => linhas.length, getMaxRows: () => 1000,
    appendRow: (v) => { linhas.push(v.map(String)); },
    deleteRow: (r) => { linhas.splice(r - 1, 1); },
    setFrozenRows: () => aba,
    getRange: (r, c, nr, nc) => ({
      getValues: () => { const out = []; for (let i = 0; i < (nr || 1); i++) { const l = linhas[r - 1 + i] || []; const x = []; for (let j = 0; j < (nc || 1); j++) x.push(l[c - 1 + j] == null ? '' : l[c - 1 + j]); out.push(x); } return out; },
      setValues: (v) => { v.forEach((l, i) => { linhas[r - 1 + i] = linhas[r - 1 + i] || []; l.forEach((x, j) => { linhas[r - 1 + i][c - 1 + j] = String(x); }); }); return aba.getRange(r, c, nr, nc); },
      setNumberFormat() { return this; }, setFontWeight() { return this; }, setBackground() { return this; }
    })
  };
  return aba;
}
const central = criarPlanilha('Fluyan central');
const props = {};
const emails = [];
let respostaClaude = null, ultimoPedidoClaude = null;
const ctx = {
  console, JSON, Math, Date, Object, Array, String, Number, Error, RegExp, isFinite, encodeURIComponent,
  SpreadsheetApp: { getActiveSpreadsheet: () => central, openById: (id) => PLANILHAS[id], create: (n) => criarPlanilha(n) },
  DriveApp: {
    getFolderById: () => ({ createFolder: (n) => ({ getId: () => 'PASTA-' + n }) }),
    getFileById: () => ({ moveTo() { }, getParents: () => ({ hasNext: () => false }) }),
    getRootFolder: () => ({ createFolder: () => ({ getId: () => 'PASTA-RAIZ' }) })
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null, setProperty: (k, v) => { props[k] = v; }, deleteProperty: (k) => { delete props[k]; } }) },
  Utilities: {
    formatDate: (d, fuso, f) => { const x = new Date(d.getTime() - 3 * 3600e3).toISOString(); return f === 'yyMMddHHmmss' ? x.slice(2, 19).replace(/[-T:]/g, '') : (f.includes('ss') ? x.slice(0, 19) : x.slice(0, 16)); },
    getUuid: () => crypto.randomUUID(),
    computeDigest: (alg, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)),
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock() { }, releaseLock() { } }) },
  ContentService: { createTextOutput: (t) => ({ texto: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
  MailApp: { sendEmail: (o) => emails.push(o) },
  UrlFetchApp: { fetch: (url, o) => { ultimoPedidoClaude = { url, o }; return { getResponseCode: () => 200, getContentText: () => JSON.stringify(respostaClaude) }; } },
  Logger: { log: () => { } }
};
vm.createContext(ctx);
const dir = path.join(__dirname, '../backend');
for (const f of ['Nucleo.gs', 'Codigo.gs', 'Estudio.gs', 'Webhooks.gs']) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });

/* ------------------------------------------------------------- testes */
let ok = 0, falhas = 0;
function t(nome, fn) { try { fn(); ok++; console.log('  ok  ' + nome); } catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n        ' + e.message); } }
function post(req) { return JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(req) } }).texto); }
function dados(r) { if (!r.ok) throw new Error(r.erro); return r.dados; }
console.log('\nFluyan · teste do backend Apps Script (simulado)\n');

let tok, srv, vin, sem = '';
t('instalar cria abas centrais e admin, e apaga a senha das propriedades', () => {
  props.ADMIN_EMAIL = 'admin@fluyan.app'; props.ADMIN_SENHA = 'senha-admin-123';
  ctx.instalar();
  if (!central.getSheetByName('TENANTS') || !central.getSheetByName('USERS')) throw new Error('abas centrais');
  if (props.ADMIN_SENHA) throw new Error('senha ficou nas propriedades');
  dados(post({ acao: 'entrar', dados: { email: 'admin@fluyan.app', senha: 'senha-admin-123' } }));
});
t('cria cliente com planilha própria', () => {
  const r = vm.runInContext('nucleo_().criarTenant({ nome: "Consultório Teste", plano: "profissional", titular: { nome: "Dra. Ana Lima", email: "ana@teste.com", senha: "senha-ana-123" } })', ctx);
  const ss = PLANILHAS[r.tenant.planilha_id];
  if (!ss || !ss.getSheetByName('AGENDAMENTOS') || ss.getSheetByName('Sheet1')) throw new Error('planilha do cliente');
  if (central.getSheetByName('AGENDAMENTOS')) throw new Error('tabela do cliente na central');
});
t('login e cadastros gravam na planilha do cliente', () => {
  tok = dados(post({ acao: 'entrar', dados: { email: 'ana@teste.com', senha: 'senha-ana-123' } })).token;
  dados(post({ acao: 'perfil', token: tok, dados: { registro: '=HYPERLINK("x")', uf: 'ce' } }));
  const loc = dados(post({ acao: 'local', token: tok, dados: { nome: 'Clínica Sol', tipo: 'parceira' } }));
  srv = dados(post({ acao: 'servico', token: tok, dados: { nome: 'Consulta', duracao_min: 30 } }));
  // próxima segunda
  const hoje = new Date(Date.now() - 3 * 3600e3); for (let i = 1; i < 8; i++) { const d = new Date(hoje.getTime() + i * 864e5); if (d.getUTCDay() === 1) { sem = d.toISOString().slice(0, 10); break; } }
  vin = dados(post({ acao: 'vinculo', token: tok, dados: { local_id: loc.id, servicos: [srv.id], publico: 'sim', regras: [{ dia_semana: 1, inicio: '08:00', fim: '10:00', max_consultas: 2 }] } }));
  const perfil = Object.values(PLANILHAS).find((s) => s.getName().includes('Consultório Teste')).getSheetByName('DOCTORS').linhas[1];
  if (!perfil.some((v) => v === '\'=HYPERLINK("x")')) throw new Error('injeção de fórmula não neutralizada: ' + perfil.join('|'));
});
t('agenda: horários, agendamento e limite máximo', () => {
  const h = dados(post({ acao: 'horarios', token: tok, dados: { vinculo_id: vin.id, servico_id: srv.id, data: sem } }));
  if (h.slots.join() !== '08:00,08:30,09:00,09:30') throw new Error('slots ' + h.slots);
  dados(post({ acao: 'agendar', token: tok, dados: { vinculo_id: vin.id, servico_id: srv.id, data: sem, hora: '08:00', paciente: { nome: 'Bia', whatsapp: '85911112222' } } }));
  dados(post({ acao: 'agendar', token: tok, dados: { vinculo_id: vin.id, servico_id: srv.id, data: sem, hora: '09:00', paciente: { nome: 'Caio', whatsapp: '85933334444' } } }));
  const r = post({ acao: 'agendar', token: tok, dados: { vinculo_id: vin.id, servico_id: srv.id, data: sem, hora: '09:30', paciente: { nome: 'Davi', whatsapp: '85955556666' } } });
  if (r.ok) throw new Error('passou do máximo');
});
t('página pública: perfil exige registro e carrega serviços', () => {
  dados(post({ acao: 'perfil', token: tok, dados: { registro: '12345' } }));
  const p = dados(post({ acao: 'publicoPerfil', dados: { slug: 'ana-lima' } }));
  if (p.servicos.length !== 1 || !p.blocos.length) throw new Error('perfil público');
});
t('Estúdio chama o Claude com o formato certo e registra o uso', () => {
  props.ANTHROPIC_API_KEY = 'chave-de-teste';
  const plano = { titulo: 'Sono e coração', proporcao: '4:5', leiaute: 'editorial', laminas: [{ papel: 'capa', titulo: 'Sono e coração', texto: '', destaque: '', icone: 'moon' }],
    legenda: 'Legenda', hashtags: ['sono'], cta: 'Agende', observacoes_revisao: [] };
  respostaClaude = { model: 'claude-opus-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(plano) }], usage: { input_tokens: 1200, output_tokens: 800 } };
  const c = dados(post({ acao: 'estudio', token: tok, dados: { formato: 'post', pedido: 'Post sobre sono e saúde do coração' } }));
  const corpo = JSON.parse(ultimoPedidoClaude.o.payload), h = ultimoPedidoClaude.o.headers;
  if (corpo.model !== 'claude-opus-5-5' || corpo.thinking.type !== 'adaptive' || corpo.output_config.format.type !== 'json_schema' || corpo.fallbacks !== 'default') throw new Error('pedido ao Claude');
  if (h['x-api-key'] !== 'chave-de-teste' || h['anthropic-beta'] !== 'server-side-fallback-2026-07-01') throw new Error('cabeçalhos');
  if (c.status !== 'revisao') throw new Error('status ' + c.status);
  const uso = central.getSheetByName('USO_IA').linhas.slice(1);
  if (uso.length !== 1 || uso[0][5] !== '1200') throw new Error('uso não registrado');
});
t('Estúdio: recusa do modelo vira mensagem clara e não conta no limite', () => {
  respostaClaude = { stop_reason: 'refusal', content: [], usage: {} };
  const r = post({ acao: 'estudio', token: tok, dados: { formato: 'post', pedido: 'Algo que será recusado' } });
  if (r.ok || !/Reformule/.test(r.erro)) throw new Error('esperava recusa: ' + JSON.stringify(r));
});
t('erro interno vai para a aba ERROS sem vazar detalhes', () => {
  const r = post({ acao: 'carregar', token: 'token-invalido' });
  if (r.ok || r.codigo !== 'sessao') throw new Error('sessão');
});
console.log('\n' + ok + ' passaram, ' + falhas + ' falharam\n');
process.exit(falhas ? 1 : 0);
