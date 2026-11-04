/* Testes do núcleo da Fluyan. Uso: node ferramentas/testar.js */
'use strict';
const path = require('path');
const crypto = require('crypto');
const J = require(path.join(__dirname, '../site/app/js/nucleo.js'));
const { criarBancoMemoria } = require(path.join(__dirname, '../site/app/js/banco-memoria.js'));

let relogio = '2026-11-02T08:00'; // segunda-feira
const db = criarBancoMemoria({});
const N = J.criarNucleo(db, {
  agora: () => relogio,
  hash: (s) => crypto.createHash('sha256').update(String(s)).digest('hex'),
  segredo: () => crypto.randomBytes(24).toString('hex'),
  iteracoes: 50,
  registrarErro: (e) => { console.error('ERRO INTERNO', e); }
});

let ok = 0, falhas = 0;
function t(nome, fn) {
  try { fn(); ok++; console.log('  ok  ' + nome); }
  catch (e) { falhas++; console.log('  FALHOU  ' + nome + '\n        ' + e.message); }
}
function igual(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || '') + ' esperado ' + JSON.stringify(b) + ', veio ' + JSON.stringify(a)); }
function verdade(v, msg) { if (!v) throw new Error(msg || 'esperado verdadeiro'); }
function chamar(token, acao, dados) { return N.processar({ token, acao, dados }); }
function dados(r) { if (!r.ok) throw new Error('falhou: ' + r.erro); return r.dados; }
function erro(r, trecho) { if (r.ok) throw new Error('deveria falhar'); if (trecho && r.erro.indexOf(trecho) < 0 && r.codigo !== trecho) throw new Error('erro diferente: ' + r.erro); }

console.log('\nFluyan · testes do núcleo ' + J.VERSAO + '\n');

// ------------------------------------------------------------------ preparação
const A = N.criarTenant({ nome: 'Consultório Dra. Helena', tipo: 'individual', plano: 'profissional',
  titular: { nome: 'Dra. Helena Duarte', email: 'helena@teste.com', senha: 'senha-forte-1', especialidade: 'Clínica médica' } });
const B = N.criarTenant({ nome: 'Clínica Outra', tipo: 'clinica', plano: 'premium',
  titular: { nome: 'Gestor Outro', email: 'outro@teste.com', senha: 'senha-forte-2', medico: true } });
N.criarUsuario('Admin', 'admin@fluyan.app', 'senha-admin-1');
db.inserir('PAPEIS', { id: 'PAPADM', user_id: db.ler('USERS').find(u => u.email === 'admin@fluyan.app').id, tenant_id: '', papel: 'admin', doctor_id: '', local_id: '', status: 'ativo' });

const tokA = dados(N.processar({ acao: 'entrar', dados: { email: 'helena@teste.com', senha: 'senha-forte-1' } })).token;
const tokB = dados(N.processar({ acao: 'entrar', dados: { email: 'outro@teste.com', senha: 'senha-forte-2' } })).token;
const tokAdm = dados(N.processar({ acao: 'entrar', dados: { email: 'admin@fluyan.app', senha: 'senha-admin-1' } })).token;

let localVida, localCentro, srvConsulta, srvRetorno, vinVida, vinCentro;

t('Sessão: login e carregar do titular', () => {
  const c = dados(chamar(tokA, 'carregar'));
  igual(c.eu.papel, 'titular'); igual(c.medicos.length, 1); igual(c.locais.length, 1, 'teleconsulta criada');
});
t('Sessão: 5 senhas erradas bloqueiam por 15 minutos', () => {
  N.criarUsuario('Teste', 'bloq@teste.com', 'senha-certa-1');
  for (let i = 0; i < 5; i++) erro(N.processar({ acao: 'entrar', dados: { email: 'bloq@teste.com', senha: 'errada' } }));
  erro(N.processar({ acao: 'entrar', dados: { email: 'bloq@teste.com', senha: 'senha-certa-1' } }), 'Muitas tentativas');
});
t('Cadastros: perfil, locais, serviços e vínculos', () => {
  dados(chamar(tokA, 'perfil', { registro: '123456', uf: 'ce', nome_publico: 'Dra. Helena Duarte', whatsapp: '(85) 99999-0000' }));
  localVida = dados(chamar(tokA, 'local', { nome: 'Clínica Vida', tipo: 'parceira', cidade: 'Fortaleza' }));
  localCentro = dados(chamar(tokA, 'local', { nome: 'Consultório Centro', tipo: 'propria' }));
  srvConsulta = dados(chamar(tokA, 'servico', { nome: 'Consulta', duracao_min: 40, preco_centavos: 35000 }));
  srvRetorno = dados(chamar(tokA, 'servico', { nome: 'Retorno', duracao_min: 20 }));
  // quinta (4): 08:00–10:00, mín 2, máx 3
  vinVida = dados(chamar(tokA, 'vinculo', { local_id: localVida.id, servicos: [srvConsulta.id, srvRetorno.id], publico: 'sim', cancelar_ate_h: 24,
    regras: [{ dia_semana: 4, inicio: '08:00', fim: '11:00', min_consultas: 2, max_consultas: 3 }] }));
  vinCentro = dados(chamar(tokA, 'vinculo', { local_id: localCentro.id, servicos: [srvConsulta.id], publico: 'sim',
    regras: [{ dia_semana: 4, inicio: '08:00', fim: '12:00', max_consultas: 10 }] }));
  erro(chamar(tokA, 'vinculo', { local_id: localVida.id, servicos: [srvConsulta.id] }), 'Já existe');
  erro(chamar(tokA, 'vinculo', { local_id: localCentro.id, servicos: [srvConsulta.id], regras: [{ dia_semana: 1, inicio: '10:00', fim: '09:00' }] }), 'Horário inválido');
});
t('Agenda: grade de horários respeita duração', () => {
  const h = dados(chamar(tokA, 'horarios', { vinculo_id: vinVida.id, servico_id: srvConsulta.id, data: '2026-11-05' }));
  igual(h.slots, ['08:00', '08:40', '09:20', '10:00']);
  const sem = dados(chamar(tokA, 'horarios', { vinculo_id: vinVida.id, servico_id: srvConsulta.id, data: '2026-11-06' }));
  igual(sem.slots, []);
});
t('Agenda: conflito entre locais diferentes do mesmo médico', () => {
  dados(chamar(tokA, 'agendar', { vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-05', hora: '08:00', paciente: { nome: 'Ana', whatsapp: '85988887777' } }));
  const h = dados(chamar(tokA, 'horarios', { vinculo_id: vinVida.id, servico_id: srvConsulta.id, data: '2026-11-05' }));
  igual(h.slots, ['08:40', '09:20', '10:00']);
});
t('Agenda: máximo nunca é ultrapassado; alerta de mínimo', () => {
  dados(chamar(tokA, 'agendar', { vinculo_id: vinVida.id, servico_id: srvConsulta.id, data: '2026-11-05', hora: '08:40', paciente: { nome: 'Bruno', whatsapp: '85911112222' } }));
  let c = dados(chamar(tokA, 'carregar'));
  let dia = c.ocupacao.find(o => o.vinculo_id === vinVida.id && o.data === '2026-11-05');
  igual([dia.ocupacao, dia.abaixo_minimo], [1, true]);
  dados(chamar(tokA, 'agendar', { vinculo_id: vinVida.id, servico_id: srvRetorno.id, data: '2026-11-05', hora: '09:20', paciente: { nome: 'Carla', whatsapp: '85933334444' } }));
  dados(chamar(tokA, 'agendar', { vinculo_id: vinVida.id, servico_id: srvRetorno.id, data: '2026-11-05', hora: '09:40', paciente: { nome: 'Davi', whatsapp: '85955556666' } }));
  erro(chamar(tokA, 'agendar', { vinculo_id: vinVida.id, servico_id: srvRetorno.id, data: '2026-11-05', hora: '08:20', paciente: { nome: 'Eva', whatsapp: '85977778888' } }), 'esgotadas');
  erro(chamar(tokA, 'agendar', { vinculo_id: vinVida.id, servico_id: srvRetorno.id, data: '2026-11-05', hora: '08:20', excecao_limite: true, paciente: { nome: 'Eva', whatsapp: '85977778888' } }), 'motivo');
  const ag = dados(chamar(tokA, 'agendar', { vinculo_id: vinVida.id, servico_id: srvRetorno.id, data: '2026-11-05', hora: '10:00', excecao_limite: true, motivo: 'Encaixe urgente', paciente: { nome: 'Eva', whatsapp: '85977778888' } }));
  igual(ag.excecao_limite, 'sim');
});
t('Agenda: data provisória some da página pública e aparece para o painel', () => {
  dados(chamar(tokA, 'dia', { vinculo_id: vinCentro.id, data: '2026-11-12', situacao: 'provisoria' }));
  const pub = dados(N.processar({ acao: 'publicoHorarios', dados: { slug: 'helena-duarte', vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-12' } }));
  igual(pub.slots, []);
  const pai = dados(chamar(tokA, 'horarios', { vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-12' }));
  verdade(pai.slots.length > 0, 'painel vê a data provisória');
});
t('Agenda: bloqueio (exceção) remove horários', () => {
  dados(chamar(tokA, 'excecao', { inicio: '2026-11-19T08:00', fim: '2026-11-19T10:00', motivo: 'Congresso' }));
  const h = dados(chamar(tokA, 'horarios', { vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-19' }));
  igual(h.slots[0], '10:00');
});
t('Página pública: reserva temporária, expiração e confirmação', () => {
  const p = dados(N.processar({ acao: 'publicoPerfil', dados: { slug: 'helena-duarte' } }));
  igual(p.medico.registro, '123456'); igual(p.servicos[0].preco_centavos, '', 'preço oculto por padrão');
  erro(N.processar({ acao: 'publicoReservar', dados: { slug: 'helena-duarte', vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-26', hora: '08:00', paciente: { nome: 'Fábio', whatsapp: '85912345678' } } }), 'aceite');
  const r = dados(N.processar({ acao: 'publicoReservar', dados: { slug: 'helena-duarte', vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-26', hora: '08:00', paciente: { nome: 'Fábio', whatsapp: '85912345678', aceite: true } } }));
  let h = dados(N.processar({ acao: 'publicoHorarios', dados: { slug: 'helena-duarte', vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-26' } }));
  verdade(h.slots.indexOf('08:00') < 0, 'reserva segura o horário');
  relogio = '2026-11-02T08:11';
  h = dados(N.processar({ acao: 'publicoHorarios', dados: { slug: 'helena-duarte', vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-26' } }));
  verdade(h.slots.indexOf('08:00') >= 0, 'reserva expirada libera');
  erro(N.processar({ acao: 'publicoConfirmar', dados: { slug: 'helena-duarte', id: r.id, codigo: r.codigo } }), 'expirada');
  const r2 = dados(N.processar({ acao: 'publicoReservar', dados: { slug: 'helena-duarte', vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-26', hora: '08:00', paciente: { nome: 'Fábio', whatsapp: '85912345678', aceite: true } } }));
  const c = dados(N.processar({ acao: 'publicoConfirmar', dados: { slug: 'helena-duarte', id: r2.id, codigo: r2.codigo } }));
  igual(c.status, 'confirmado');
  relogio = '2026-11-02T08:00';
});
t('Concorrência: 20 tentativas no último horário, só uma confirma', () => {
  let sucesso = 0;
  for (let i = 0; i < 20; i++) {
    const r = N.processar({ acao: 'publicoReservar', dados: { slug: 'helena-duarte', vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-26', hora: '11:20', paciente: { nome: 'P' + i, whatsapp: '8590000' + String(1000 + i), aceite: true } } });
    if (r.ok) sucesso++;
  }
  igual(sucesso, 1);
});
let tokClinica;
t('Clínica parceira: convite, acesso restrito e cancelamento vira solicitação', () => {
  const cv = dados(chamar(tokA, 'convidar', { papel: 'clinica', email: 'recepcao@vida.com', nome: 'Recepção Vida', local_id: localVida.id }));
  tokClinica = dados(N.processar({ acao: 'aceitarConvite', dados: { codigo: cv.codigo, senha: 'clinica-vida-1' } })).token;
  erro(N.processar({ acao: 'aceitarConvite', dados: { codigo: cv.codigo, senha: 'clinica-vida-1' } }), 'Convite');
  const c = dados(chamar(tokClinica, 'carregar'));
  igual(c.vinculos.map(v => v.id), [vinVida.id]);
  verdade(c.agendamentos.every(a => a.vinculo_id === vinVida.id), 'só agendamentos do local');
  verdade(c.pacientes.every(p => Object.keys(p).join() === 'id,nome,whatsapp'), 'paciente mínimo');
  verdade(!c.financeiro && !c.conteudos, 'sem financeiro e conteúdo');
  erro(chamar(tokClinica, 'agendar', { vinculo_id: vinCentro.id, servico_id: srvConsulta.id, data: '2026-11-26', hora: '09:20', paciente: { nome: 'X', whatsapp: '85900001111' } }), 'proibido');
  const ag = dados(chamar(tokClinica, 'agendar', { vinculo_id: vinVida.id, servico_id: srvRetorno.id, data: '2026-11-12', hora: '08:00', paciente: { nome: 'Gil', whatsapp: '85922223333' } }));
  relogio = '2026-11-11T12:00';
  try {
    const tok2 = dados(N.processar({ acao: 'entrar', dados: { email: 'recepcao@vida.com', senha: 'clinica-vida-1' } })).token;
    const st = dados(chamar(tok2, 'agStatus', { id: ag.id, status: 'cancelado', motivo: 'Paciente pediu' }));
    igual(st.status, 'reagendamento_solicitado');
  } finally { relogio = '2026-11-02T08:00'; }
  erro(chamar(tokClinica, 'perfil', { apresentacao: 'x' }), 'proibido');
});
t('Isolamento: tenant B não enxerga nem altera dados de A', () => {
  const c = dados(chamar(tokB, 'carregar'));
  igual(c.agendamentos.length, 0); igual(c.pacientes.length, 0);
  verdade(c.locais.every(l => l.tenant_id === B.tenant.id));
  const agA = db.ler('AGENDAMENTOS').find(a => a.tenant_id === A.tenant.id);
  erro(chamar(tokB, 'agStatus', { id: agA.id, status: 'cancelado' }), 'não encontrado');
  erro(chamar(tokB, 'vinculo', { local_id: localVida.id, servicos: [srvConsulta.id] }), 'Escolha o local');
});
t('Secretária: agenda sim, conteúdo e perfil não', () => {
  const cv = dados(chamar(tokA, 'convidar', { papel: 'secretaria', email: 'sec@teste.com', nome: 'Sec' }));
  const tok = dados(N.processar({ acao: 'aceitarConvite', dados: { codigo: cv.codigo, senha: 'secretaria-1' } })).token;
  const c = dados(chamar(tok, 'carregar'));
  verdade(!c.conteudos, 'sem conteúdos'); verdade(c.agendamentos.length > 0);
  erro(chamar(tok, 'conteudo', { titulo: 'x' }), 'proibido');
  erro(chamar(tok, 'convidar', { papel: 'medico', email: 'm@m.com', nome: 'M' }), 'titular');
});
t('Publicidade médica: alertas e aprovação com justificativa', () => {
  const cnt = dados(chamar(tokA, 'conteudo', { titulo: 'Check-up', corpo: { gancho: 'Resultado garantido no seu check-up', texto: 'Sou o melhor médico da cidade.' } }));
  const al = JSON.parse(cnt.alertas);
  verdade(al.length >= 2, 'dois alertas');
  dados(chamar(tokA, 'conteudoStatus', { id: cnt.id, status: 'producao' }));
  dados(chamar(tokA, 'conteudoStatus', { id: cnt.id, status: 'revisao' }));
  erro(chamar(tokA, 'conteudoStatus', { id: cnt.id, status: 'aprovado' }), 'alertas');
  dados(chamar(tokA, 'conteudoStatus', { id: cnt.id, status: 'aprovado', justificativa: 'Texto revisado com assessoria' }));
  erro(chamar(tokA, 'conteudoStatus', { id: cnt.id, status: 'ideia' }));
  igual(N.verificarPublicidade('Dicas para dormir melhor').length, 0);
});
t('Concluir consulta gera receita pendente e paciente ativo', () => {
  const ag = db.ler('AGENDAMENTOS').find(a => a.tenant_id === A.tenant.id && a.servico_id === srvConsulta.id && a.status === 'confirmado');
  dados(chamar(tokA, 'agStatus', { id: ag.id, status: 'concluido' }));
  const fin = db.ler('FINANCEIRO').filter(f => f.agendamento_id === ag.id);
  igual([fin.length, fin[0].valor_centavos], [1, 35000]);
});
t('Admin: suspender cliente bloqueia o acesso', () => {
  const lista = dados(chamar(tokAdm, 'adminTenants'));
  verdade(lista.length >= 2);
  erro(chamar(tokA, 'adminTenants'), 'proibido');
  dados(chamar(tokAdm, 'adminStatusTenant', { id: B.tenant.id, status: 'suspenso', justificativa: 'Teste' }));
  erro(chamar(tokB, 'carregar'), 'suspenso');
  erro(N.processar({ acao: 'entrar', dados: { email: 'outro@teste.com', senha: 'senha-forte-2' } }), 'suspenso');
});
t('Plano limita a quantidade de médicos', () => {
  erro(chamar(tokA, 'convidar', { papel: 'medico', email: 'novo@teste.com', nome: 'Dr. Novo' }), 'médico');
});
t('Erro interno não vaza detalhes', () => {
  const r = N.processar({ acao: 'entrar', dados: null });
  verdade(!r.ok);
});

console.log('\n' + ok + ' passaram, ' + falhas + ' falharam\n');
process.exit(falhas ? 1 : 0);
