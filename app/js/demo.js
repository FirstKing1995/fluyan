/* ==========================================================================
   FLUYAN — modo demonstração
   Roda o núcleo real no navegador com banco em memória salvo no aparelho.
   Dados 100% fictícios. Também simula o Estúdio (sem chamar o Claude).
   ========================================================================== */
(function () {
  'use strict';
  var CHAVE = 'fluyan_demo_v3';
  var estado = null;
  try { estado = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { estado = null; }
  var salvarT;
  var banco = window.criarBancoMemoria(estado || {}, function (est) {
    clearTimeout(salvarT); salvarT = setTimeout(function () { try { localStorage.setItem(CHAVE, JSON.stringify(est)); } catch (e) { /* cheio */ } }, 150);
  });

  /* ------------------------------------------------- Estúdio simulado */
  function iaDemo(tipo, e) {
    var p = e.perfil || {}, assinatura = (p.nome_publico || 'Seu nome') + ' · ' + (p.conselho || 'CRM') + ' ' + (p.registro || '[confirmar]') + (p.uf ? ' ' + p.uf : '');
    var tema = e.pedido.replace(/^(crie|cria|fa[cç]a|quero|gere|preciso de)\s+(um|uma)?\s*/i, '').replace(/^(carrossel|post|stories|v[ií]deo|roteiro)\s+(sobre|de|com)?\s*/i, '').replace(/[.!]+$/, '');
    tema = tema.replace(/^(de\s+)?\d+\s*segundos\s+/i, '').replace(/^(sobre|com|de)\s+/i, '');
    tema = tema.charAt(0).toUpperCase() + tema.slice(1);
    if (tipo === 'video') {
      var d = e.duracao_s || 30, n = 5, passo = d / n;
      var falas = [
        ['Você sabia?', 'Hoje eu quero falar sobre ' + tema.toLowerCase() + '.', 'rosto'],
        ['O que observar', 'O primeiro ponto é perceber os sinais do dia a dia e não deixar para depois. [confirmar dado clínico]', 'consultório'],
        ['Na prática', 'Pequenos hábitos fazem diferença: sono, alimentação e acompanhamento regular.', 'ícone'],
        ['Quando procurar', 'Se os sintomas persistirem, procure avaliação. Cada caso é único.', 'rosto'],
        ['Fale comigo', 'Este conteúdo é educativo e não substitui a consulta. ' + assinatura, 'cartela final']
      ];
      return { modelo: 'demonstracao', tokens_entrada: 0, tokens_saida: 0, custo_centavos: 0, plano: {
        tipo: 'video', titulo: tema, estilo: 'dica_rapida', duracao_s: d,
        cenas: falas.map(function (f, i) { return { inicio_s: Math.round(i * passo * 10) / 10, fim_s: Math.round((i + 1) * passo * 10) / 10, titulo_tela: f[0], fala: f[1], visual: f[2] }; }),
        legenda: tema + '. Assista até o fim e salve para lembrar. Conteúdo educativo, não substitui a consulta.', hashtags: ['saude', 'prevencao', 'medicina'],
        cta: 'Agende pelo link do perfil.', observacoes_revisao: ['Confira o dado marcado com [confirmar].', 'Modo demonstração: texto gerado sem IA.'] } };
    }
    var n2 = e.formato === 'post' ? 1 : (e.formato === 'stories' ? 4 : 6);
    var icones = ['heart-pulse', 'activity', 'moon', 'apple', 'stethoscope', 'calendar-check'];
    var laminas = [{ papel: 'capa', titulo: tema, texto: e.formato === 'post' ? 'Informação clara para você cuidar melhor da sua saúde.' : 'Deslize para entender.', destaque: '', icone: 'sparkles' }];
    var pontos = ['Observe os sinais do dia a dia', 'Mantenha os exames em dia', 'Cuide do sono e da rotina', 'Converse com seu médico'];
    for (var i = 1; i < n2 - 1; i++) laminas.push({ papel: 'conteudo', titulo: pontos[(i - 1) % pontos.length], texto: 'Explicação curta e acolhedora sobre este ponto. [confirmar informação clínica]', destaque: String(i).padStart(2, '0'), icone: icones[i % icones.length] });
    if (n2 > 1) laminas.push({ papel: 'fechamento', titulo: 'Cada pessoa é única', texto: 'Este conteúdo é educativo e não substitui a consulta. ' + assinatura, destaque: '', icone: 'stethoscope' });
    return { modelo: 'demonstracao', tokens_entrada: 0, tokens_saida: 0, custo_centavos: 0, plano: {
      tipo: 'pecas', titulo: tema, proporcao: e.formato === 'stories' ? '9:16' : '4:5', leiaute: 'editorial', laminas: laminas,
      legenda: tema + '. Salve este conteúdo e compartilhe com quem precisa. Conteúdo educativo, não substitui a consulta.', hashtags: ['saude', 'prevencao', 'cuidado'],
      cta: 'Agende pelo link do perfil.', observacoes_revisao: ['Confira os trechos marcados com [confirmar].', 'Modo demonstração: texto gerado sem IA.'] } };
  }

  var N = window.Fluyan.criarNucleo(banco, { ia: iaDemo, reservaMin: 10 });
  window.addEventListener('pagehide', function () { try { localStorage.setItem(CHAVE, JSON.stringify(banco.estado)); } catch (e) { /* cheio */ } });
  window.DEMO = { processar: N.processar, banco: banco, reiniciar: function () { localStorage.removeItem(CHAVE); location.reload(); } };

  window.DEMO_CONTAS = [
    { rotulo: 'Médica titular', email: 'helena@demo.fluyan.app', senha: 'demo12345', icone: 'stethoscope' },
    { rotulo: 'Secretária', email: 'secretaria@demo.fluyan.app', senha: 'demo12345', icone: 'clipboard-list' },
    { rotulo: 'Clínica parceira', email: 'recepcao@clinicavida.demo', senha: 'demo12345', icone: 'building-2' },
    { rotulo: 'Administrador da plataforma', email: 'admin@demo.fluyan.app', senha: 'demo12345', icone: 'shield' }
  ];
  if (banco.estado.TENANTS && banco.estado.TENANTS.length) return;

  /* ------------------------------------------------- dados fictícios */
  function ok(r) { if (!r.ok) throw new Error('Semente: ' + r.erro); return r.dados; }
  function chamar(tok, acao, dados) { return ok(N.processar({ token: tok, acao: acao, dados: dados })); }
  var A1 = N.criarTenant({ nome: 'Consultório Dra. Helena Duarte', tipo: 'individual', plano: 'premium',
    titular: { nome: 'Dra. Helena Duarte', email: 'helena@demo.fluyan.app', senha: 'demo12345', especialidade: 'Clínica médica', whatsapp: '85999990000' } });
  N.criarTenant({ nome: 'Clínica Bem Viver', tipo: 'clinica', plano: 'enterprise', titular: { nome: 'Marcos Lima', email: 'gestao@bemviver.demo', senha: 'demo12345' } });
  var adm = N.criarUsuario('Administrador', 'admin@demo.fluyan.app', 'demo12345');
  banco.inserir('PAPEIS', { id: 'PAPADMDEMO', user_id: adm.id, tenant_id: '', papel: 'admin', doctor_id: '', local_id: '', status: 'ativo', criado_em: '' });
  var tok = ok(N.processar({ acao: 'entrar', dados: { email: 'helena@demo.fluyan.app', senha: 'demo12345' } })).token;

  chamar(tok, 'perfil', { nome_publico: 'Dra. Helena Duarte', registro: '000000', uf: 'CE', especialidade: 'Clínica médica', subespecialidades: 'Medicina preventiva, check-up',
    apresentacao: 'Atendo adultos com foco em prevenção e acompanhamento de longo prazo. Gosto de explicar cada passo com calma, para que você saia da consulta entendendo o seu cuidado.',
    formacao: 'Graduação em Medicina. Residência em Clínica Médica.', instagram: 'dra.helenaduarte.demo', tom_de_voz: 'Acolhedor, claro, sem jargões',
    publico_alvo: 'Adultos de 30 a 60 anos que querem cuidar da saúde de forma preventiva', temas_evitar: 'Estética, emagrecimento rápido' });
  var c = chamar(tok, 'carregar');
  var tele = c.locais[0];
  var vida = chamar(tok, 'local', { nome: 'Clínica Vida', tipo: 'parceira', endereco: 'Av. Santos Dumont, 1000', cidade: 'Fortaleza', responsavel: 'Ana Paula', telefone: '8532220000' });
  var aldeota = chamar(tok, 'local', { nome: 'Consultório Aldeota', tipo: 'propria', endereco: 'Rua Silva Paulet, 500, sala 804', cidade: 'Fortaleza' });
  var sCons = chamar(tok, 'servico', { nome: 'Consulta presencial', duracao_min: 40, preco_centavos: 38000, descricao: 'Avaliação completa com tempo para conversar sobre a sua rotina e os seus exames.', orientacoes: 'Traga seus exames recentes e a lista de medicamentos em uso.' });
  var sRet = chamar(tok, 'servico', { nome: 'Retorno', duracao_min: 20, preco_centavos: 0, descricao: 'Revisão de exames em até 30 dias após a consulta.' });
  var sTele = chamar(tok, 'servico', { nome: 'Teleconsulta', duracao_min: 30, modalidade: 'online', preco_centavos: 30000, descricao: 'Consulta por vídeo para acompanhamento e orientação.' });
  var sCheck = chamar(tok, 'servico', { nome: 'Check-up anual', duracao_min: 60, preco_centavos: 52000, descricao: 'Consulta ampliada de prevenção com plano de exames personalizado.' });
  var vVida = chamar(tok, 'vinculo', { local_id: vida.id, servicos: [sCons.id, sRet.id], publico: 'sim', cancelar_ate_h: 24, antecedencia_min_h: 2,
    regras: [{ dia_semana: 4, inicio: '08:00', fim: '17:00', intervalo_min: 0, min_consultas: 8, max_consultas: 15 }] });
  var vAld = chamar(tok, 'vinculo', { local_id: aldeota.id, servicos: [sCons.id, sRet.id, sCheck.id], publico: 'sim',
    regras: [{ dia_semana: 1, inicio: '13:00', fim: '19:00', max_consultas: 9 }, { dia_semana: 3, inicio: '13:00', fim: '19:00', max_consultas: 9 }] });
  var vTele = chamar(tok, 'vinculo', { local_id: tele.id, servicos: [sTele.id, sRet.id], publico: 'sim',
    regras: [{ dia_semana: 2, inicio: '18:00', fim: '21:00', max_consultas: 6 }, { dia_semana: 5, inicio: '08:00', fim: '11:00', max_consultas: 6 }] });
  chamar(tok, 'plano', { nome: 'Acompanhamento preventivo', descricao: 'Para quem quer cuidar da saúde ao longo do ano com consultas programadas.', publico: 'Adultos em acompanhamento preventivo',
    validade_dias: 365, itens: [{ servico_id: sCheck.id, quantidade: 1 }, { servico_id: sRet.id, quantidade: 3 }], preco_centavos: 120000, forma_pagamento: 'Pix ou cartão em até 3x' });

  var nomes = ['Mariana Souza', 'Paulo Ribeiro', 'Ana Clara Mendes', 'Rafael Costa', 'Beatriz Lima', 'João Pedro Alves', 'Camila Rocha', 'Lucas Martins', 'Fernanda Dias',
    'Gustavo Nogueira', 'Juliana Freitas', 'Ricardo Barros', 'Patrícia Moura', 'Eduardo Pires', 'Larissa Teixeira', 'Thiago Araújo'];
  var pacs = nomes.map(function (n, i) { return chamar(tok, 'paciente', { nome: n, whatsapp: '8598' + String(1000000 + i * 7919).slice(-7), consente_whatsapp: i % 3 !== 0, origem: 'painel' }); });

  // agendamentos futuros pelo próprio núcleo (respeitam todas as regras)
  var hoje = c.agora.slice(0, 10), alvo = [[vVida, [sCons, sRet]], [vAld, [sCons, sCheck, sRet]], [vTele, [sTele, sRet]]], k = 0;
  for (var dd = 0; dd < 21; dd++) {
    var data = window.Fluyan.util.somarDias(hoje, dd);
    alvo.forEach(function (par) {
      var srv = par[1][dd % par[1].length];
      var h = chamar(tok, 'horarios', { vinculo_id: par[0].id, servico_id: srv.id, data: data });
      var qtd = Math.min(h.slots.length, par[0].id === vVida.id ? (dd < 8 ? 9 : 5) : 3);
      for (var j = 0; j < qtd; j++) {
        try { chamar(tok, 'agendar', { vinculo_id: par[0].id, servico_id: srv.id, data: data, hora: h.slots[j * Math.max(1, Math.floor(h.slots.length / qtd))] || h.slots[j], paciente_id: pacs[(k++) % pacs.length].id }); } catch (e) { /* horário pego */ }
      }
    });
  }
  // histórico passado (inserido direto como concluído)
  var tid = A1.tenant.id;
  for (var pdia = 1; pdia <= 28; pdia += 3) {
    var dpas = window.Fluyan.util.somarDias(hoje, -pdia);
    for (var q = 0; q < 3; q++) {
      var pac = pacs[(pdia + q) % pacs.length], ini = dpas + 'T' + ['09:00', '10:20', '14:00'][q];
      var st = q === 2 && pdia % 2 ? 'nao_compareceu' : 'concluido';
      var id = 'AGDDEMO' + pdia + '_' + q;
      banco.inserir('AGENDAMENTOS', { id: id, tenant_id: tid, doctor_id: A1.doctor_id, paciente_id: pac.id, servico_id: sCons.id, vinculo_id: q === 2 ? vAld.id : vVida.id,
        inicio: ini, fim: window.Fluyan.util.somarMin(ini, 40), status: st, origem: 'painel', codigo: 'DEMO' + q, reserva_expira_em: '', motivo: '', excecao_limite: '', criado_por: '', criado_em: dpas + 'T08:00', atualizado_em: '' });
      if (st === 'concluido') banco.inserir('FINANCEIRO', { id: 'FINDEMO' + pdia + q, tenant_id: tid, doctor_id: A1.doctor_id, tipo: 'receita', descricao: 'Consulta presencial', agendamento_id: id,
        local_id: q === 2 ? aldeota.id : vida.id, valor_centavos: 38000, data: dpas, status: pdia % 4 ? 'recebido' : 'pendente', criado_em: dpas });
    }
  }
  ['novo', 'interessado', 'interessado', 'acompanhamento', 'inativo'].forEach(function (et, i) { chamar(tok, 'pacienteEtapa', { id: pacs[11 + i].id, etapa: et }); });

  chamar(tok, 'dia', { vinculo_id: vVida.id, data: (function () { for (var x = 22; x < 40; x++) { var dt = window.Fluyan.util.somarDias(hoje, x); if (window.Fluyan.util.diaSemana(dt) === 4) return dt; } })(), situacao: 'provisoria', obs: 'Aguardando confirmação da clínica' });

  var c1 = chamar(tok, 'conteudo', { titulo: '5 sinais de que é hora do check-up', formato: 'carrossel', canal: 'instagram', data_planejada: window.Fluyan.util.somarDias(hoje, 3),
    corpo: iaDemo('pecas', { formato: 'carrossel', pedido: 'carrossel sobre 5 sinais de que é hora do check-up', perfil: c.medicos[0] && Object.assign({}, c.medicos[0], { registro: '000000', uf: 'CE' }) }).plano });
  chamar(tok, 'conteudoStatus', { id: c1.id, status: 'producao' }); chamar(tok, 'conteudoStatus', { id: c1.id, status: 'revisao' });
  chamar(tok, 'conteudo', { titulo: 'Mitos sobre pressão alta', formato: 'video', canal: 'reels', data_planejada: window.Fluyan.util.somarDias(hoje, 6),
    corpo: iaDemo('video', { formato: 'video', duracao_s: 30, pedido: 'vídeo sobre mitos sobre pressão alta', perfil: { nome_publico: 'Dra. Helena Duarte', registro: '000000', uf: 'CE' } }).plano });
  chamar(tok, 'conteudo', { titulo: 'Como se preparar para a consulta', formato: 'post', canal: 'instagram', corpo: { texto: 'Ideia: lista do que levar para a consulta.' } });

  var cvSec = chamar(tok, 'convidar', { papel: 'secretaria', email: 'secretaria@demo.fluyan.app', nome: 'Roberta Sales' });
  ok(N.processar({ acao: 'aceitarConvite', dados: { codigo: cvSec.codigo, senha: 'demo12345' } }));
  var cvCli = chamar(tok, 'convidar', { papel: 'clinica', email: 'recepcao@clinicavida.demo', nome: 'Recepção Clínica Vida', local_id: vida.id });
  ok(N.processar({ acao: 'aceitarConvite', dados: { codigo: cvCli.codigo, senha: 'demo12345' } }));
  banco.estado.SESSOES = [];
  try { localStorage.setItem(CHAVE, JSON.stringify(banco.estado)); } catch (e) { /* nada */ }
})();
