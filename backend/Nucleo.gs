/* GERADO por ferramentas/montar.js a partir de site/app/js/nucleo.js. NÃO EDITE AQUI. */
/* ==========================================================================
   FLUYAN — núcleo de regras de negócio
   O MESMO arquivo roda em três lugares:
     1. navegador (modo demonstração, banco em memória)
     2. Google Apps Script (backend/Nucleo.gs é cópia deste arquivo)
     3. Node (ferramentas/testar.js)
   Não usa nada específico de nenhum deles: tudo de fora chega em `amb`.
   ========================================================================== */
(function (raiz) {
  'use strict';

  var VERSAO = '0.4.0';

  var PLANOS = {
    essencial: { nome: 'Essencial', preco: 49700, pecas: 20, videos: 0, medicos: 1, usuarios: 3 },
    profissional: { nome: 'Profissional', preco: 99700, pecas: 60, videos: 10, medicos: 1, usuarios: 6 },
    premium: { nome: 'Premium', preco: 199700, pecas: 150, videos: 30, medicos: 3, usuarios: 12 },
    enterprise: { nome: 'Enterprise', preco: 0, pecas: 600, videos: 120, medicos: 50, usuarios: 200 }
  };

  var PAPEIS = ['titular', 'medico', 'secretaria', 'clinica', 'admin'];

  /* Tabelas e colunas. Central = da plataforma; Tenant = de cada cliente. */
  var TABELAS = {
    TENANTS: ['id', 'nome', 'tipo', 'plano', 'status', 'fuso', 'planilha_id', 'pasta_id', 'criado_em', 'atualizado_em'],
    USERS: ['id', 'email', 'nome', 'senha_hash', 'salt', 'status', 'tentativas', 'bloqueado_ate', 'ultimo_acesso', 'criado_em'],
    PAPEIS: ['id', 'user_id', 'tenant_id', 'papel', 'doctor_id', 'local_id', 'status', 'criado_em'],
    SESSOES: ['token_hash', 'user_id', 'papel_id', 'expira_em', 'criado_em'],
    CONVITES: ['codigo_hash', 'tenant_id', 'email', 'nome', 'papel', 'doctor_id', 'local_id', 'expira_em', 'usado_em', 'criado_por', 'criado_em'],
    SLUGS: ['slug', 'tenant_id', 'doctor_id'],
    USO_IA: ['id', 'tenant_id', 'user_id', 'tarefa', 'modelo', 'tokens_entrada', 'tokens_saida', 'custo_centavos', 'ok', 'criado_em'],
    CADASTROS: ['id', 'nome', 'email', 'whatsapp', 'tipo', 'plano', 'especialidade', 'status', 'mp_id', 'tenant_id', 'criado_em', 'atualizado_em'],
    AUDITORIA: ['id', 'tenant_id', 'user_id', 'acao', 'entidade', 'entidade_id', 'resumo', 'justificativa', 'criado_em'],

    DOCTORS: ['id', 'tenant_id', 'user_id', 'nome_completo', 'nome_publico', 'conselho', 'registro', 'uf', 'rqe', 'especialidade', 'subespecialidades',
      'apresentacao', 'formacao', 'foto_url', 'whatsapp', 'email', 'instagram', 'cor', 'slug', 'tom_de_voz', 'publico_alvo', 'temas_evitar', 'status', 'criado_em', 'atualizado_em'],
    LOCAIS: ['id', 'tenant_id', 'nome', 'tipo', 'endereco', 'cidade', 'responsavel', 'telefone', 'status', 'criado_em'],
    VINCULOS: ['id', 'tenant_id', 'doctor_id', 'local_id', 'status', 'servicos', 'antecedencia_min_h', 'antecedencia_max_dias', 'confirmacao',
      'cancelar_ate_h', 'dia_padrao', 'publico', 'criado_em', 'atualizado_em'],
    REGRAS: ['id', 'tenant_id', 'vinculo_id', 'dia_semana', 'inicio', 'fim', 'intervalo_min', 'min_consultas', 'max_consultas'],
    DIAS: ['id', 'tenant_id', 'vinculo_id', 'data', 'situacao', 'min_consultas', 'max_consultas', 'obs'],
    EXCECOES: ['id', 'tenant_id', 'doctor_id', 'vinculo_id', 'inicio', 'fim', 'motivo'],
    SERVICOS: ['id', 'tenant_id', 'doctor_id', 'nome', 'descricao', 'duracao_min', 'intervalo_apos_min', 'modalidade', 'preco_centavos', 'mostra_preco',
      'orientacoes', 'status', 'criado_em'],
    PLANOS: ['id', 'tenant_id', 'doctor_id', 'nome', 'descricao', 'publico', 'validade_dias', 'itens', 'preco_centavos', 'forma_pagamento',
      'politica_cancelamento', 'status', 'criado_em'],
    PACIENTES: ['id', 'tenant_id', 'nome', 'nascimento', 'telefone', 'whatsapp', 'email', 'responsavel', 'origem', 'etapa', 'consente_whatsapp',
      'consente_email', 'notas_adm', 'status', 'criado_em', 'atualizado_em'],
    EVENTOS: ['id', 'tenant_id', 'paciente_id', 'tipo', 'ref_id', 'resumo', 'user_id', 'criado_em'],
    AGENDAMENTOS: ['id', 'tenant_id', 'doctor_id', 'paciente_id', 'servico_id', 'vinculo_id', 'inicio', 'fim', 'status', 'origem', 'codigo',
      'reserva_expira_em', 'motivo', 'excecao_limite', 'criado_por', 'criado_em', 'atualizado_em'],
    CONTEUDOS: ['id', 'tenant_id', 'doctor_id', 'titulo', 'formato', 'canal', 'data_planejada', 'status', 'corpo', 'alertas', 'origem', 'aprovado_por',
      'aprovado_em', 'criado_em', 'atualizado_em'],
    PAGINAS: ['id', 'tenant_id', 'doctor_id', 'blocos', 'status', 'atualizado_em', 'publicado_em'],
    FINANCEIRO: ['id', 'tenant_id', 'doctor_id', 'tipo', 'descricao', 'agendamento_id', 'local_id', 'valor_centavos', 'data', 'status', 'criado_em']
  };
  var CENTRAIS = ['TENANTS', 'USERS', 'PAPEIS', 'SESSOES', 'CONVITES', 'SLUGS', 'USO_IA', 'CADASTROS', 'AUDITORIA'];

  var ETAPAS_PACIENTE = ['novo', 'interessado', 'aguardando', 'agendado', 'ativo', 'acompanhamento', 'inativo', 'arquivado'];
  var STATUS_AG = ['reservado_temp', 'pendente', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'reagendamento_solicitado', 'nao_compareceu'];
  var ATIVOS = { reservado_temp: 1, pendente: 1, confirmado: 1, em_atendimento: 1 };
  var STATUS_CONTEUDO = ['ideia', 'producao', 'revisao', 'aprovado', 'agendado', 'publicado', 'reprovado', 'arquivado', 'falha'];
  var TRANSICOES_CONTEUDO = {
    ideia: ['producao', 'arquivado'], producao: ['revisao', 'ideia', 'arquivado'], revisao: ['aprovado', 'reprovado', 'producao'],
    aprovado: ['agendado', 'publicado', 'producao'], agendado: ['publicado', 'falha', 'aprovado'], publicado: ['arquivado'],
    reprovado: ['producao', 'arquivado'], arquivado: ['ideia'], falha: ['agendado', 'publicado']
  };

  /* Regras de publicidade médica (CFM 2.336/2023 e manual vigente: validar com assessoria). */
  var ALERTAS_PUBLICIDADE = [
    { re: /\b(garant\w*|100\s?%|resultado (certo|garantido)|cura definitiva|sem riscos?)\b/i, msg: 'Promessa de resultado ou garantia.' },
    { re: /\b(antes e depois|antes\/depois)\b/i, msg: 'Antes e depois exige as condições da norma.' },
    { re: /\b(o melhor|a melhor|melhores m[eé]dicos?|n[uú]mero 1|n[º°] ?1|[uú]nico (m[eé]dico|tratamento))\b/i, msg: 'Superlativo ou autopromoção indevida.' },
    { re: /\b(promo[cç][aã]o|desconto|black friday|imperd[ií]vel|[uú]ltimas vagas)\b/i, msg: 'Apelo comercial ou de preço.' },
    { re: /\b(milagr\w*|revolucion[aá]ri\w*|infal[ií]vel)\b/i, msg: 'Sensacionalismo.' },
    { re: /\b(depoimento|meu paciente disse|paciente satisfeit\w*)\b/i, msg: 'Depoimento de paciente: aguarda parecer jurídico.' },
    { re: /\bespecialista\b/i, msg: 'Ao citar especialidade, informe o RQE.', exceto: function (d) { return !!(d && d.rqe); } }
  ];

  /* ------------------------------------------------------------------ util */
  function txt(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ').trim().slice(0, max || 200); }
  function linha(v, max) { return txt(v, max).replace(/\n/g, ' '); }
  function num(v) { var n = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; }
  function inteiro(v, min, max) { var n = Math.round(num(v)); if (min != null && n < min) n = min; if (max != null && n > max) n = max; return n; }
  function sim(v) { return v === true || /^(sim|s|true|1|x)$/i.test(String(v).trim()); }
  function digitos(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
  function email(v) { var e = linha(v, 160).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : ''; }
  function horaValida(h) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(h)); }
  function dataValida(d) { return /^\d{4}-\d{2}-\d{2}$/.test(String(d)); }
  function minutos(h) { var p = String(h).split(':'); return Number(p[0]) * 60 + Number(p[1] || 0); }
  function hhmm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
  function diaSemana(d) { var p = d.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); }
  function somarDias(d, n) { var p = d.split('-').map(Number); var x = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return x.toISOString().slice(0, 10); }
  /** Soma minutos a 'AAAA-MM-DDTHH:mm' sem depender de fuso. */
  function somarMin(iso, m) {
    var d = iso.slice(0, 10), t = minutos(iso.slice(11, 16)) + m, dias = Math.floor(t / 1440);
    t -= dias * 1440; return somarDias(d, dias) + 'T' + hhmm(t);
  }
  function difMin(a, b) { /* b - a em minutos */
    var da = Date.UTC.apply(null, partes(a)), db = Date.UTC.apply(null, partes(b));
    return Math.round((db - da) / 60000);
  }
  function partes(iso) { var p = iso.slice(0, 10).split('-').map(Number); var h = iso.slice(11, 16) || '00:00'; return [p[0], p[1] - 1, p[2], minutos(h) / 60 | 0, minutos(h) % 60]; }
  function sobrepoe(a1, a2, b1, b2) { return a1 < b2 && b1 < a2; }
  function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(dra?|doutora?)\.?\s+/, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'medico';
  }
  function falha(msg, codigo) { var e = new Error(msg); e.publico = true; e.codigo = codigo || 'invalido'; return e; }
  function lista(v) { if (Array.isArray(v)) return v.map(String).filter(Boolean); return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  function json(v, padrao) { if (v && typeof v === 'object') return v; try { return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }

  /* ====================================================================== */
  function criarNucleo(db, amb) {
    amb = amb || {};
    var agora = amb.agora || function () { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
    var novoId = amb.id || function (p) { return p + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8).toUpperCase(); };
    var segredo = amb.segredo || function () { return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 32); };
    var hash = amb.hash || function (s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
    var trava = amb.trava || function (fn) { return fn(); };
    var aoCriarTenant = amb.aoCriarTenant || function () { return {}; };
    var RESERVA_MIN = amb.reservaMin || 10;
    var SESSAO_H = amb.sessaoHoras || 12;

    /* ---------------------------------------------------------- acesso a dados */
    function T(nome, tid) { var r = db.ler(nome, tid); return r || []; }
    function doTenant(nome, ctx) { return T(nome, ctx.tenant_id).filter(function (r) { return r.tenant_id === ctx.tenant_id; }); }
    function porId(nome, id, ctx) { var r = (ctx ? doTenant(nome, ctx) : T(nome)).filter(function (x) { return x.id === id; })[0]; return r || null; }
    function inserir(nome, obj, tid) { db.inserir(nome, obj, tid); return obj; }
    function atualizar(nome, id, campos, tid, chave) { db.atualizar(nome, id, campos, tid, chave); }
    function auditar(ctx, acao, entidade, id, resumo, just) {
      inserir('AUDITORIA', { id: novoId('AUD'), tenant_id: ctx.tenant_id || '', user_id: ctx.user_id || '', acao: acao, entidade: entidade, entidade_id: id || '',
        resumo: linha(resumo, 300), justificativa: linha(just, 300), criado_em: agora() });
    }
    function senhaHash(senha, salt) { var h = String(senha) + ':' + salt; for (var i = 0; i < (amb.iteracoes || 1); i++) h = hash(h + salt); return h; }

    /* ------------------------------------------------------------- permissões */
    var PODE = {
      titular: { tudo: 1 },
      medico: { agenda: 1, pacientes: 1, servicos: 1, locais: 1, perfil: 1, conteudo: 1, aprovar: 1, financeiro: 1, relatorios: 1 },
      secretaria: { agenda: 1, pacientes: 1, financeiro: 1 },
      clinica: { agenda_clinica: 1 },
      admin: { plataforma: 1 }
    };
    function exige(ctx, perm) {
      var p = PODE[ctx.papel] || {};
      if (p.tudo && perm !== 'plataforma') return;
      if (!p[perm]) throw falha('Seu acesso não permite esta ação.', 'proibido');
    }
    /** Médico só mexe nos próprios dados; titular e secretária em todos do tenant. */
    function doctorAlvo(ctx, pedido) {
      if (ctx.papel === 'medico') return ctx.doctor_id;
      var id = pedido || ctx.doctor_id;
      if (!id) { var d = doTenant('DOCTORS', ctx)[0]; id = d && d.id; }
      if (!id || !porId('DOCTORS', id, ctx)) throw falha('Médico não encontrado.');
      return id;
    }

    /* ================================================================ SESSÃO */
    function entrar(p) {
      var em = email(p.email); if (!em || !p.senha) throw falha('Informe e-mail e senha.');
      var u = T('USERS').filter(function (x) { return x.email === em; })[0];
      var t = agora();
      if (u && u.bloqueado_ate && u.bloqueado_ate > t) throw falha('Muitas tentativas. Tente de novo em alguns minutos.', 'bloqueado');
      if (!u || u.senha_hash !== senhaHash(p.senha, u.salt) || u.status !== 'ativo') {
        if (u) {
          var n = num(u.tentativas) + 1;
          atualizar('USERS', u.id, n >= 5 ? { tentativas: 0, bloqueado_ate: somarMin(t, 15) } : { tentativas: n });
        }
        throw falha('E-mail ou senha incorretos.', 'credenciais');
      }
      var papeis = T('PAPEIS').filter(function (r) { return r.user_id === u.id && r.status === 'ativo'; });
      if (!papeis.length) throw falha('Esta conta não tem acesso ativo.', 'sem_papel');
      var escolhido = papeis.filter(function (r) { return r.id === p.papel_id; })[0] || papeis[0];
      if (escolhido.tenant_id) {
        var ten = porId('TENANTS', escolhido.tenant_id);
        if (!ten || ten.status === 'suspenso' || ten.status === 'cancelado') throw falha('O acesso desta conta está suspenso. Fale com o suporte.', 'suspenso');
      }
      var token = segredo();
      inserir('SESSOES', { token_hash: hash(token), user_id: u.id, papel_id: escolhido.id, expira_em: somarMin(t, SESSAO_H * 60), criado_em: t });
      atualizar('USERS', u.id, { tentativas: 0, bloqueado_ate: '', ultimo_acesso: t });
      return { token: token, papeis: papeis.map(resumoPapel) };
    }
    function resumoPapel(r) { var t = r.tenant_id ? porId('TENANTS', r.tenant_id) : null; return { id: r.id, papel: r.papel, tenant: t ? t.nome : 'Plataforma' }; }

    function contexto(token) {
      if (!token) throw falha('Entre novamente.', 'sessao');
      var s = T('SESSOES').filter(function (x) { return x.token_hash === hash(token); })[0];
      if (!s || s.expira_em < agora()) throw falha('Sua sessão expirou. Entre novamente.', 'sessao');
      var u = porId('USERS', s.user_id), pa = porId('PAPEIS', s.papel_id);
      if (!u || u.status !== 'ativo' || !pa || pa.status !== 'ativo') throw falha('Acesso removido.', 'sessao');
      if (pa.tenant_id) {
        var ten = porId('TENANTS', pa.tenant_id);
        if (!ten || ten.status === 'suspenso' || ten.status === 'cancelado') throw falha('O acesso desta conta está suspenso.', 'suspenso');
        if (db.usarTenant) db.usarTenant(ten);
      }
      return { user_id: u.id, nome: u.nome, email: u.email, papel: pa.papel, tenant_id: pa.tenant_id || '', doctor_id: pa.doctor_id || '', local_id: pa.local_id || '' };
    }
    function sair(ctx, p, token) { atualizar('SESSOES', hash(token), { expira_em: agora() }, null, 'token_hash'); return { ok: true }; }

    function trocarSenha(ctx, p) {
      var u = porId('USERS', ctx.user_id);
      if (u.senha_hash !== senhaHash(p.atual, u.salt)) throw falha('Senha atual incorreta.');
      validarSenha(p.nova);
      var salt = segredo().slice(0, 16);
      atualizar('USERS', u.id, { senha_hash: senhaHash(p.nova, salt), salt: salt });
      T('SESSOES').filter(function (s) { return s.user_id === u.id; }).forEach(function (s) { atualizar('SESSOES', s.token_hash, { expira_em: agora() }, null, 'token_hash'); });
      return { ok: true };
    }
    function validarSenha(s) { if (String(s || '').length < 8) throw falha('A senha precisa ter pelo menos 8 caracteres.'); }

    /* ================================================================ TENANTS */
    function criarUsuario(nome, em, senha) {
      em = email(em); if (!em) throw falha('E-mail inválido.');
      var u = T('USERS').filter(function (x) { return x.email === em; })[0];
      if (u) return u;
      validarSenha(senha);
      var salt = segredo().slice(0, 16);
      return inserir('USERS', { id: novoId('USR'), email: em, nome: linha(nome, 120), senha_hash: senhaHash(senha, salt), salt: salt, status: 'ativo',
        tentativas: 0, bloqueado_ate: '', ultimo_acesso: '', criado_em: agora() });
    }
    function slugLivre(base) {
      var s = slugify(base), usados = {}, i = 2, cand = s;
      T('SLUGS').forEach(function (r) { usados[r.slug] = 1; });
      while (usados[cand]) cand = s + '-' + (i++);
      return cand;
    }
    /** Cria um cliente (tenant) completo. Chamado pelo admin ou pelo webhook de assinatura. */
    function criarTenant(p) {
      var plano = PLANOS[p.plano] ? p.plano : 'essencial';
      var tipo = p.tipo === 'clinica' ? 'clinica' : 'individual';
      var nomeTen = linha(p.nome, 120); if (!nomeTen) throw falha('Informe o nome do cliente.');
      var tit = p.titular || {};
      var t = agora();
      var ten = { id: novoId('TEN'), nome: nomeTen, tipo: tipo, plano: plano, status: 'ativo', fuso: p.fuso || 'America/Fortaleza', planilha_id: '', pasta_id: '', criado_em: t, atualizado_em: t };
      var extra = aoCriarTenant(ten) || {};
      ten.planilha_id = extra.planilha_id || ''; ten.pasta_id = extra.pasta_id || '';
      inserir('TENANTS', ten);
      if (db.usarTenant) db.usarTenant(ten);
      var u = criarUsuario(tit.nome, tit.email, tit.senha);
      var doc = null;
      if (tipo === 'individual' || tit.medico) {
        var slug = slugLivre(tit.nome_publico || tit.nome);
        doc = inserir('DOCTORS', { id: novoId('DOC'), tenant_id: ten.id, user_id: u.id, nome_completo: linha(tit.nome, 120), nome_publico: linha(tit.nome_publico || tit.nome, 120),
          conselho: 'CRM', registro: '', uf: '', rqe: '', especialidade: linha(tit.especialidade, 80), subespecialidades: '', apresentacao: '', formacao: '', foto_url: '',
          whatsapp: digitos(tit.whatsapp), email: u.email, instagram: '', cor: '#0F5257', slug: slug, tom_de_voz: '', publico_alvo: '', temas_evitar: '', status: 'ativo', criado_em: t, atualizado_em: t }, ten.id);
        inserir('SLUGS', { slug: slug, tenant_id: ten.id, doctor_id: doc.id });
      }
      inserir('PAPEIS', { id: novoId('PAP'), user_id: u.id, tenant_id: ten.id, papel: 'titular', doctor_id: doc ? doc.id : '', local_id: '', status: 'ativo', criado_em: t });
      inserir('LOCAIS', { id: novoId('LOC'), tenant_id: ten.id, nome: 'Teleconsulta', tipo: 'online', endereco: '', cidade: '', responsavel: '', telefone: '', status: 'ativo', criado_em: t }, ten.id);
      auditar({ tenant_id: ten.id, user_id: u.id }, 'criar', 'tenant', ten.id, nomeTen + ' · plano ' + plano);
      return { tenant: ten, user_id: u.id, doctor_id: doc ? doc.id : '' };
    }
    function adminTenants(ctx) {
      exige(ctx, 'plataforma');
      var uso = T('USO_IA');
      return T('TENANTS').map(function (t) {
        var u = uso.filter(function (x) { return x.tenant_id === t.id; });
        return { id: t.id, nome: t.nome, tipo: t.tipo, plano: t.plano, status: t.status, criado_em: t.criado_em,
          usuarios: T('PAPEIS').filter(function (p) { return p.tenant_id === t.id && p.status === 'ativo'; }).length,
          ia_tokens: u.reduce(function (s, x) { return s + num(x.tokens_entrada) + num(x.tokens_saida); }, 0),
          ia_custo: u.reduce(function (s, x) { return s + num(x.custo_centavos); }, 0) };
      });
    }
    function adminCriarTenant(ctx, p) { exige(ctx, 'plataforma'); var r = criarTenant(p); auditar(ctx, 'criar', 'tenant', r.tenant.id, r.tenant.nome); return { id: r.tenant.id }; }
    function adminStatusTenant(ctx, p) {
      exige(ctx, 'plataforma');
      if (['ativo', 'suspenso', 'cancelado'].indexOf(p.status) < 0) throw falha('Status inválido.');
      if (!porId('TENANTS', p.id)) throw falha('Cliente não encontrado.');
      atualizar('TENANTS', p.id, { status: p.status, atualizado_em: agora() });
      auditar(ctx, 'status', 'tenant', p.id, p.status, p.justificativa);
      return { ok: true };
    }
    function adminPlano(ctx, p) {
      exige(ctx, 'plataforma'); if (!PLANOS[p.plano]) throw falha('Plano inválido.');
      atualizar('TENANTS', p.id, { plano: p.plano, atualizado_em: agora() }); auditar(ctx, 'plano', 'tenant', p.id, p.plano); return { ok: true };
    }
    function adminAuditoria(ctx) { exige(ctx, 'plataforma'); return T('AUDITORIA').slice(-300).reverse(); }

    /* ================================================================ EQUIPE */
    function convidar(ctx, p) {
      if (ctx.papel !== 'titular') throw falha('Só o titular convida pessoas.', 'proibido');
      var papel = p.papel;
      if (['medico', 'secretaria', 'clinica'].indexOf(papel) < 0) throw falha('Papel inválido.');
      var em = email(p.email); if (!em) throw falha('E-mail inválido.');
      var ten = porId('TENANTS', ctx.tenant_id), lim = PLANOS[ten.plano];
      var ativos = T('PAPEIS').filter(function (r) { return r.tenant_id === ctx.tenant_id && r.status === 'ativo'; });
      if (ativos.length >= lim.usuarios) throw falha('Seu plano permite ' + lim.usuarios + ' acessos. Fale conosco para ampliar.', 'limite');
      var doctorId = '', localId = '';
      if (papel === 'medico') {
        if (doTenant('DOCTORS', ctx).length >= lim.medicos) throw falha('Seu plano permite ' + lim.medicos + ' médico(s).', 'limite');
        var t = agora(), slug = slugLivre(p.nome);
        var d = inserir('DOCTORS', { id: novoId('DOC'), tenant_id: ctx.tenant_id, user_id: '', nome_completo: linha(p.nome, 120), nome_publico: linha(p.nome, 120), conselho: 'CRM',
          registro: '', uf: '', rqe: '', especialidade: '', subespecialidades: '', apresentacao: '', formacao: '', foto_url: '', whatsapp: '', email: em, instagram: '', cor: '#0F5257',
          slug: slug, tom_de_voz: '', publico_alvo: '', temas_evitar: '', status: 'ativo', criado_em: t, atualizado_em: t }, ctx.tenant_id);
        inserir('SLUGS', { slug: slug, tenant_id: ctx.tenant_id, doctor_id: d.id });
        doctorId = d.id;
      }
      if (papel === 'clinica') { var l = porId('LOCAIS', p.local_id, ctx); if (!l || l.tipo === 'online') throw falha('Escolha a clínica parceira.'); localId = l.id; }
      var codigo = segredo().slice(0, 20);
      inserir('CONVITES', { codigo_hash: hash(codigo), tenant_id: ctx.tenant_id, email: em, nome: linha(p.nome, 120), papel: papel, doctor_id: doctorId, local_id: localId,
        expira_em: somarMin(agora(), 7 * 1440), usado_em: '', criado_por: ctx.user_id, criado_em: agora() });
      auditar(ctx, 'convidar', 'papel', em, papel);
      return { codigo: codigo, expira_em: somarMin(agora(), 7 * 1440) };
    }
    function aceitarConvite(p) {
      var c = T('CONVITES').filter(function (x) { return x.codigo_hash === hash(p.codigo || ''); })[0];
      if (!c || c.usado_em || c.expira_em < agora()) throw falha('Convite inválido ou vencido. Peça um novo.', 'convite');
      var u = T('USERS').filter(function (x) { return x.email === c.email; })[0];
      if (!u) u = criarUsuario(p.nome || c.nome, c.email, p.senha);
      else if (u.senha_hash !== senhaHash(p.senha, u.salt)) throw falha('Este e-mail já tem conta. Use a mesma senha para aceitar.');
      inserir('PAPEIS', { id: novoId('PAP'), user_id: u.id, tenant_id: c.tenant_id, papel: c.papel, doctor_id: c.doctor_id, local_id: c.local_id, status: 'ativo', criado_em: agora() });
      if (c.doctor_id) { if (db.usarTenant) db.usarTenant(porId('TENANTS', c.tenant_id)); atualizar('DOCTORS', c.doctor_id, { user_id: u.id }, c.tenant_id); }
      atualizar('CONVITES', c.codigo_hash, { usado_em: agora() }, null, 'codigo_hash');
      return entrar({ email: c.email, senha: p.senha });
    }
    function equipe(ctx) {
      if (ctx.papel !== 'titular') throw falha('Só o titular vê a equipe.', 'proibido');
      var users = {}; T('USERS').forEach(function (u) { users[u.id] = u; });
      return T('PAPEIS').filter(function (r) { return r.tenant_id === ctx.tenant_id; }).map(function (r) {
        var u = users[r.user_id] || {}; return { id: r.id, nome: u.nome, email: u.email, papel: r.papel, status: r.status, local_id: r.local_id, doctor_id: r.doctor_id, ultimo_acesso: u.ultimo_acesso };
      }).concat(T('CONVITES').filter(function (c) { return c.tenant_id === ctx.tenant_id && !c.usado_em && c.expira_em > agora(); })
        .map(function (c) { return { id: '', nome: c.nome, email: c.email, papel: c.papel, status: 'convidado', local_id: c.local_id }; }));
    }
    function removerAcesso(ctx, p) {
      if (ctx.papel !== 'titular') throw falha('Só o titular remove acessos.', 'proibido');
      var r = T('PAPEIS').filter(function (x) { return x.id === p.id && x.tenant_id === ctx.tenant_id; })[0];
      if (!r) throw falha('Acesso não encontrado.');
      if (r.user_id === ctx.user_id) throw falha('Você não pode remover o próprio acesso.');
      atualizar('PAPEIS', r.id, { status: 'removido' }); auditar(ctx, 'remover', 'papel', r.id, r.papel); return { ok: true };
    }

    /* ================================================================ CADASTROS */
    var CAMPOS_PERFIL = { nome_completo: 120, nome_publico: 120, conselho: 10, registro: 20, uf: 2, rqe: 40, especialidade: 80, subespecialidades: 200,
      apresentacao: 2000, formacao: 1500, foto_url: 400, whatsapp: 20, email: 160, instagram: 60, cor: 7, tom_de_voz: 300, publico_alvo: 500, temas_evitar: 500 };
    function salvarPerfil(ctx, p) {
      exige(ctx, 'perfil');
      var id = doctorAlvo(ctx, p.id), c = { atualizado_em: agora() };
      Object.keys(CAMPOS_PERFIL).forEach(function (k) { if (k in p) c[k] = k === 'apresentacao' || k === 'formacao' ? txt(p[k], CAMPOS_PERFIL[k]) : linha(p[k], CAMPOS_PERFIL[k]); });
      if ('whatsapp' in c) c.whatsapp = digitos(c.whatsapp);
      if ('uf' in c) c.uf = c.uf.toUpperCase();
      if ('cor' in c && !/^#[0-9a-f]{6}$/i.test(c.cor)) delete c.cor;
      if ('foto_url' in c && c.foto_url && !/^https:\/\//.test(c.foto_url)) throw falha('A foto precisa de um endereço https.');
      atualizar('DOCTORS', id, c, ctx.tenant_id);
      return porId('DOCTORS', id, ctx);
    }
    function salvarLocal(ctx, p) {
      exige(ctx, 'locais');
      var dados = { nome: linha(p.nome, 120), tipo: ['propria', 'parceira', 'online'].indexOf(p.tipo) >= 0 ? p.tipo : 'parceira', endereco: linha(p.endereco, 200),
        cidade: linha(p.cidade, 80), responsavel: linha(p.responsavel, 120), telefone: digitos(p.telefone), status: p.status === 'arquivado' ? 'arquivado' : 'ativo' };
      if (!dados.nome) throw falha('Informe o nome do local.');
      if (p.id) { if (!porId('LOCAIS', p.id, ctx)) throw falha('Local não encontrado.'); atualizar('LOCAIS', p.id, dados, ctx.tenant_id); return porId('LOCAIS', p.id, ctx); }
      dados.id = novoId('LOC'); dados.tenant_id = ctx.tenant_id; dados.criado_em = agora();
      return inserir('LOCAIS', dados, ctx.tenant_id);
    }
    function salvarServico(ctx, p) {
      exige(ctx, 'servicos');
      var dados = { doctor_id: doctorAlvo(ctx, p.doctor_id), nome: linha(p.nome, 120), descricao: txt(p.descricao, 1500), duracao_min: inteiro(p.duracao_min, 5, 480),
        intervalo_apos_min: inteiro(p.intervalo_apos_min, 0, 120), modalidade: p.modalidade === 'online' ? 'online' : (p.modalidade === 'ambas' ? 'ambas' : 'presencial'),
        preco_centavos: inteiro(p.preco_centavos, 0), mostra_preco: sim(p.mostra_preco) ? 'sim' : 'nao', orientacoes: txt(p.orientacoes, 1000),
        status: p.status === 'inativo' ? 'inativo' : 'ativo' };
      if (!dados.nome) throw falha('Informe o nome do serviço.');
      if (!p.duracao_min) dados.duracao_min = 30;
      if (p.id) { if (!porId('SERVICOS', p.id, ctx)) throw falha('Serviço não encontrado.'); atualizar('SERVICOS', p.id, dados, ctx.tenant_id); return porId('SERVICOS', p.id, ctx); }
      dados.id = novoId('SRV'); dados.tenant_id = ctx.tenant_id; dados.criado_em = agora();
      return inserir('SERVICOS', dados, ctx.tenant_id);
    }
    function salvarPlano(ctx, p) {
      exige(ctx, 'servicos');
      var itens = (Array.isArray(p.itens) ? p.itens : json(p.itens, [])).map(function (i) { return { servico_id: String(i.servico_id), quantidade: inteiro(i.quantidade, 1, 99) }; })
        .filter(function (i) { return porId('SERVICOS', i.servico_id, ctx); });
      var dados = { doctor_id: doctorAlvo(ctx, p.doctor_id), nome: linha(p.nome, 120), descricao: txt(p.descricao, 2000), publico: linha(p.publico, 200),
        validade_dias: inteiro(p.validade_dias, 1, 730), itens: JSON.stringify(itens), preco_centavos: inteiro(p.preco_centavos, 0), forma_pagamento: linha(p.forma_pagamento, 120),
        politica_cancelamento: txt(p.politica_cancelamento, 1000), status: p.status === 'inativo' ? 'inativo' : 'ativo' };
      if (!dados.nome) throw falha('Informe o nome do plano.');
      if (!itens.length) throw falha('Inclua pelo menos um serviço no plano.');
      if (p.id) { if (!porId('PLANOS', p.id, ctx)) throw falha('Plano não encontrado.'); atualizar('PLANOS', p.id, dados, ctx.tenant_id); return porId('PLANOS', p.id, ctx); }
      dados.id = novoId('PLN'); dados.tenant_id = ctx.tenant_id; dados.criado_em = agora();
      return inserir('PLANOS', dados, ctx.tenant_id);
    }

    /* ---------------------------------------------------------- vínculos e regras */
    function salvarVinculo(ctx, p) {
      exige(ctx, 'locais');
      var local = porId('LOCAIS', p.local_id, ctx); if (!local) throw falha('Escolha o local.');
      var doc = doctorAlvo(ctx, p.doctor_id);
      var servs = lista(p.servicos).filter(function (id) { var s = porId('SERVICOS', id, ctx); return s && s.doctor_id === doc; });
      if (!servs.length) throw falha('Escolha pelo menos um serviço para este local.');
      var dados = { doctor_id: doc, local_id: local.id, status: p.status === 'pausado' ? 'pausado' : (p.status === 'encerrado' ? 'encerrado' : 'ativo'),
        servicos: servs.join(','), antecedencia_min_h: inteiro(p.antecedencia_min_h, 0, 720), antecedencia_max_dias: inteiro(p.antecedencia_max_dias || 60, 1, 365),
        confirmacao: p.confirmacao === 'manual' ? 'manual' : 'automatica', cancelar_ate_h: inteiro(p.cancelar_ate_h, 0, 720),
        dia_padrao: p.dia_padrao === 'provisoria' ? 'provisoria' : 'confirmada', publico: sim(p.publico) ? 'sim' : 'nao', atualizado_em: agora() };
      var regras = (Array.isArray(p.regras) ? p.regras : json(p.regras, [])).map(function (r) {
        var x = { dia_semana: inteiro(r.dia_semana, 0, 6), inicio: String(r.inicio), fim: String(r.fim), intervalo_min: inteiro(r.intervalo_min, 0, 120),
          min_consultas: inteiro(r.min_consultas, 0, 200), max_consultas: inteiro(r.max_consultas, 0, 200) };
        if (!horaValida(x.inicio) || !horaValida(x.fim) || minutos(x.fim) <= minutos(x.inicio)) throw falha('Horário inválido na regra de ' + DIAS_NOME[x.dia_semana] + '.');
        if (x.max_consultas && x.min_consultas > x.max_consultas) throw falha('Mínimo maior que o máximo em ' + DIAS_NOME[x.dia_semana] + '.');
        return x;
      });
      var id = p.id;
      if (id) { if (!porId('VINCULOS', id, ctx)) throw falha('Vínculo não encontrado.'); atualizar('VINCULOS', id, dados, ctx.tenant_id); }
      else {
        if (doTenant('VINCULOS', ctx).some(function (v) { return v.doctor_id === doc && v.local_id === local.id && v.status !== 'encerrado'; })) throw falha('Já existe vínculo com este local.');
        dados.id = id = novoId('VIN'); dados.tenant_id = ctx.tenant_id; dados.criado_em = agora(); inserir('VINCULOS', dados, ctx.tenant_id);
      }
      if (p.regras !== undefined) {
        doTenant('REGRAS', ctx).filter(function (r) { return r.vinculo_id === id; }).forEach(function (r) { db.excluir('REGRAS', r.id, ctx.tenant_id); });
        regras.forEach(function (r) { r.id = novoId('REG'); r.tenant_id = ctx.tenant_id; r.vinculo_id = id; inserir('REGRAS', r, ctx.tenant_id); });
      }
      auditar(ctx, p.id ? 'editar' : 'criar', 'vinculo', id, local.nome);
      return porId('VINCULOS', id, ctx);
    }
    var DIAS_NOME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    function salvarDia(ctx, p) {
      exige(ctx, 'agenda');
      var v = porId('VINCULOS', p.vinculo_id, ctx); if (!v) throw falha('Vínculo não encontrado.');
      if (ctx.papel === 'medico' && v.doctor_id !== ctx.doctor_id) throw falha('Este local é de outro médico.', 'proibido');
      if (!dataValida(p.data)) throw falha('Data inválida.');
      var dados = { situacao: ['provisoria', 'confirmada', 'fechada'].indexOf(p.situacao) >= 0 ? p.situacao : 'confirmada',
        min_consultas: p.min_consultas === '' || p.min_consultas == null ? '' : inteiro(p.min_consultas, 0, 200),
        max_consultas: p.max_consultas === '' || p.max_consultas == null ? '' : inteiro(p.max_consultas, 0, 200), obs: linha(p.obs, 200) };
      var atual = doTenant('DIAS', ctx).filter(function (d) { return d.vinculo_id === v.id && d.data === p.data; })[0];
      if (atual) atualizar('DIAS', atual.id, dados, ctx.tenant_id);
      else { dados.id = novoId('DIA'); dados.tenant_id = ctx.tenant_id; dados.vinculo_id = v.id; dados.data = p.data; inserir('DIAS', dados, ctx.tenant_id); }
      auditar(ctx, 'dia', 'vinculo', v.id, p.data + ' ' + dados.situacao);
      return { ok: true };
    }
    function salvarExcecao(ctx, p) {
      exige(ctx, 'agenda');
      var doc = doctorAlvo(ctx, p.doctor_id);
      var ini = String(p.inicio || '').slice(0, 16), fim = String(p.fim || '').slice(0, 16);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(ini) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fim) || fim <= ini) throw falha('Período inválido.');
      var x = { id: novoId('EXC'), tenant_id: ctx.tenant_id, doctor_id: doc, vinculo_id: p.vinculo_id || '', inicio: ini, fim: fim, motivo: linha(p.motivo, 120) };
      inserir('EXCECOES', x, ctx.tenant_id); return x;
    }
    function removerExcecao(ctx, p) { exige(ctx, 'agenda'); if (!porId('EXCECOES', p.id, ctx)) throw falha('Bloqueio não encontrado.'); db.excluir('EXCECOES', p.id, ctx.tenant_id); return { ok: true }; }

    /* ================================================================ AGENDA */
    function ativo(a, t) { return ATIVOS[a.status] && !(a.status === 'reservado_temp' && a.reserva_expira_em && a.reserva_expira_em < t); }

    /** Situação de uma data num vínculo: regra do dia + ajustes do médico + ocupação. */
    function situacaoDia(ctx, v, data, cache) {
      var regra = (cache.regras || doTenant('REGRAS', ctx)).filter(function (r) { return r.vinculo_id === v.id && num(r.dia_semana) === diaSemana(data); })[0];
      if (!regra) return null;
      var ajuste = (cache.dias || doTenant('DIAS', ctx)).filter(function (d) { return d.vinculo_id === v.id && d.data === data; })[0] || {};
      var t = cache.agora || agora();
      var ocup = (cache.ags || doTenant('AGENDAMENTOS', ctx)).filter(function (a) { return a.vinculo_id === v.id && a.inicio.slice(0, 10) === data && ativo(a, t); }).length;
      var max = ajuste.max_consultas !== '' && ajuste.max_consultas != null ? num(ajuste.max_consultas) : num(regra.max_consultas);
      var min = ajuste.min_consultas !== '' && ajuste.min_consultas != null ? num(ajuste.min_consultas) : num(regra.min_consultas);
      return { data: data, vinculo_id: v.id, inicio: regra.inicio, fim: regra.fim, intervalo_min: num(regra.intervalo_min), situacao: ajuste.situacao || v.dia_padrao || 'confirmada',
        min: min, max: max, ocupacao: ocup, lotado: max > 0 && ocup >= max, abaixo_minimo: min > 0 && ocup < min, obs: ajuste.obs || '' };
    }

    /**
     * Horários livres (regras AG-01, AG-02, AG-04, AG-06, AG-07).
     * origem: 'painel' | 'clinica' | 'pagina'
     */
    function horariosLivres(ctx, p, origem, cache) {
      cache = cache || {};
      var v = porId('VINCULOS', p.vinculo_id, ctx); if (!v || v.status !== 'ativo') return { slots: [], motivo: 'Local indisponível.' };
      var s = porId('SERVICOS', p.servico_id, ctx);
      if (!s || s.status !== 'ativo' || lista(v.servicos).indexOf(s.id) < 0) return { slots: [], motivo: 'Serviço não disponível neste local.' };
      if (!dataValida(p.data)) return { slots: [], motivo: 'Data inválida.' };
      var dia = situacaoDia(ctx, v, p.data, cache);
      if (!dia) return { slots: [], motivo: 'Sem atendimento neste dia.' };
      if (dia.situacao === 'fechada') return { slots: [], dia: dia, motivo: 'Dia fechado.' };
      if (origem === 'pagina' && dia.situacao !== 'confirmada') return { slots: [], dia: dia, motivo: 'Data ainda não confirmada.' };
      if (dia.lotado && !(p.ignorar_maximo && origem === 'painel')) return { slots: [], dia: dia, motivo: 'Vagas esgotadas neste dia.' };
      var t = cache.agora || agora();
      var limiteMin = origem === 'painel' ? t : somarMin(t, num(v.antecedencia_min_h) * 60);
      var limiteMax = origem === 'painel' ? '9999' : somarDias(t.slice(0, 10), num(v.antecedencia_max_dias) || 60) + 'T23:59';
      var ags = (cache.ags || doTenant('AGENDAMENTOS', ctx)).filter(function (a) { return a.doctor_id === v.doctor_id && ativo(a, t) && a.inicio.slice(0, 10) === p.data && a.id !== p.ignorar; });
      var exc = (cache.exc || doTenant('EXCECOES', ctx)).filter(function (e) { return e.doctor_id === v.doctor_id && (!e.vinculo_id || e.vinculo_id === v.id); });
      var dur = num(s.duracao_min) || 30, passo = dur + num(s.intervalo_apos_min) + dia.intervalo_min;
      var slots = [];
      for (var m = minutos(dia.inicio); m + dur <= minutos(dia.fim); m += passo) {
        var ini = p.data + 'T' + hhmm(m), fim = somarMin(ini, dur);
        if (ini < limiteMin || ini > limiteMax) continue;
        if (ags.some(function (a) { return sobrepoe(ini, fim, a.inicio, a.fim); })) continue;
        if (exc.some(function (e) { return sobrepoe(ini, fim, e.inicio, e.fim); })) continue;
        slots.push(hhmm(m));
      }
      return { slots: slots, dia: dia, duracao: dur };
    }

    /** Próximos dias com vagas, para o calendário do paciente e da clínica. */
    function diasDisponiveis(ctx, p, origem) {
      var v = porId('VINCULOS', p.vinculo_id, ctx); if (!v) return [];
      var hoje = agora().slice(0, 10), n = Math.min(num(p.dias) || 30, 90), out = [];
      var cache = { regras: doTenant('REGRAS', ctx), dias: doTenant('DIAS', ctx), ags: doTenant('AGENDAMENTOS', ctx), exc: doTenant('EXCECOES', ctx), agora: agora() };
      for (var i = 0; i < n; i++) {
        var d = somarDias(p.de && dataValida(p.de) ? p.de : hoje, i);
        var h = horariosLivres(ctx, { vinculo_id: v.id, servico_id: p.servico_id, data: d }, origem, cache);
        if (h.dia) out.push({ data: d, livres: h.slots.length, situacao: h.dia.situacao, ocupacao: h.dia.ocupacao, max: h.dia.max, min: h.dia.min });
      }
      return out;
    }

    function acharPaciente(ctx, dados) {
      var w = digitos(dados.whatsapp), em = email(dados.email);
      return doTenant('PACIENTES', ctx).filter(function (x) { return (w && x.whatsapp === w) || (em && x.email === em); })[0] || null;
    }
    function garantirPaciente(ctx, dados, origem) {
      var nome = linha(dados.nome, 120); if (!nome) throw falha('Informe o nome do paciente.');
      var w = digitos(dados.whatsapp); if (w && (w.length < 10 || w.length > 13)) throw falha('WhatsApp inválido. Use DDD + número.');
      if (!w && !email(dados.email)) throw falha('Informe WhatsApp ou e-mail do paciente.');
      var x = acharPaciente(ctx, dados);
      if (x) return x;
      var t = agora();
      x = { id: novoId('PAC'), tenant_id: ctx.tenant_id, nome: nome, nascimento: dataValida(dados.nascimento) ? dados.nascimento : '', telefone: '', whatsapp: w, email: email(dados.email),
        responsavel: linha(dados.responsavel, 120), origem: origem, etapa: 'aguardando', consente_whatsapp: sim(dados.consente_whatsapp) ? 'sim' : 'nao',
        consente_email: sim(dados.consente_email) ? 'sim' : 'nao', notas_adm: '', status: 'ativo', criado_em: t, atualizado_em: t };
      inserir('PACIENTES', x, ctx.tenant_id);
      evento(ctx, x.id, 'cadastro', '', 'Cadastro pela origem ' + origem);
      return x;
    }
    function evento(ctx, pacId, tipo, ref, resumo) {
      inserir('EVENTOS', { id: novoId('EVT'), tenant_id: ctx.tenant_id, paciente_id: pacId, tipo: tipo, ref_id: ref || '', resumo: linha(resumo, 300), user_id: ctx.user_id || '', criado_em: agora() }, ctx.tenant_id);
    }
    function codigoReserva() { var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 6; i++) s += c.charAt(Math.floor(Math.random() * c.length)); return s; }

    /**
     * Criação de agendamento em 9 passos (item 12.6), sempre dentro da trava.
     * modo: 'reserva' (temporária) | 'direto'
     */
    function criarAgendamento(ctx, p, origem, modo) {
      return trava(function () {
        var v = porId('VINCULOS', p.vinculo_id, ctx);                                         // 2. vínculo
        if (!v || v.status !== 'ativo') throw falha('Local indisponível.');
        if (ctx.papel === 'clinica' && v.local_id !== ctx.local_id) throw falha('Este local não é da sua clínica.', 'proibido');   // 1. permissão
        if (ctx.papel === 'medico' && v.doctor_id !== ctx.doctor_id) throw falha('Este local é de outro médico.', 'proibido');
        if (!horaValida(p.hora)) throw falha('Escolha um horário.');
        var h = horariosLivres(ctx, { vinculo_id: v.id, servico_id: p.servico_id, data: p.data }, origem);   // 3–7
        var forcar = origem === 'painel' && sim(p.excecao_limite) && (ctx.papel === 'titular' || ctx.papel === 'medico');
        if (h.slots.indexOf(p.hora) < 0) {
          if (!(forcar && h.dia && h.dia.lotado)) throw falha(h.motivo && h.slots.length === 0 && h.dia && h.dia.lotado ? 'Vagas esgotadas neste dia.' : 'Este horário acabou de ser ocupado. Escolha outro.', 'ocupado');
          if (!linha(p.motivo, 200)) throw falha('Para passar do máximo, informe o motivo.');
          var hh = horariosLivres(ctx, { vinculo_id: v.id, servico_id: p.servico_id, data: p.data, ignorar_maximo: true }, origem);
          if (hh.slots.indexOf(p.hora) < 0) throw falha('Este horário está ocupado.', 'ocupado');
        }
        var s = porId('SERVICOS', p.servico_id, ctx);
        var pac = p.paciente_id ? porId('PACIENTES', p.paciente_id, ctx) : garantirPaciente(ctx, p.paciente || {}, origem);
        if (!pac) throw falha('Paciente não encontrado.');
        var ini = p.data + 'T' + p.hora, t = agora();
        var status = modo === 'reserva' ? 'reservado_temp' : (v.confirmacao === 'manual' && origem !== 'painel' ? 'pendente' : 'confirmado');
        var ag = { id: novoId('AGD'), tenant_id: ctx.tenant_id, doctor_id: v.doctor_id, paciente_id: pac.id, servico_id: s.id, vinculo_id: v.id, inicio: ini,               // 8. reserva
          fim: somarMin(ini, num(s.duracao_min) || 30), status: status, origem: origem, codigo: codigoReserva(), reserva_expira_em: modo === 'reserva' ? somarMin(t, RESERVA_MIN) : '',
          motivo: linha(p.motivo, 200), excecao_limite: forcar && h.dia && h.dia.lotado ? 'sim' : '', criado_por: ctx.user_id || 'publico', criado_em: t, atualizado_em: t };
        inserir('AGENDAMENTOS', ag, ctx.tenant_id);
        if (modo !== 'reserva') posConfirmar(ctx, ag, pac);                                      // 9. registro
        if (ag.excecao_limite) auditar(ctx, 'excecao_limite', 'agendamento', ag.id, p.data, p.motivo);
        return ag;
      });
    }
    function posConfirmar(ctx, ag, pac) {
      evento(ctx, pac.id, 'agendamento', ag.id, 'Agendado para ' + ag.inicio.replace('T', ' ') + ' (' + ag.status + ')');
      if (['novo', 'interessado', 'aguardando', 'inativo'].indexOf(pac.etapa) >= 0) atualizar('PACIENTES', pac.id, { etapa: 'agendado', atualizado_em: agora() }, ctx.tenant_id);
      auditar(ctx, 'agendar', 'agendamento', ag.id, ag.inicio + ' ' + ag.status);
    }
    function confirmarReserva(ctx, p) {
      return trava(function () {
        var ag = doTenant('AGENDAMENTOS', ctx).filter(function (a) { return a.id === p.id && a.codigo === String(p.codigo || '').toUpperCase(); })[0];
        if (!ag || ag.status !== 'reservado_temp') throw falha('Reserva não encontrada.');
        if (ag.reserva_expira_em < agora()) { atualizar('AGENDAMENTOS', ag.id, { status: 'cancelado', motivo: 'Reserva expirou' }, ctx.tenant_id); throw falha('O tempo da reserva acabou. Escolha o horário de novo.', 'expirada'); }
        var v = porId('VINCULOS', ag.vinculo_id, ctx);
        var st = v.confirmacao === 'manual' ? 'pendente' : 'confirmado';
        atualizar('AGENDAMENTOS', ag.id, { status: st, reserva_expira_em: '', atualizado_em: agora() }, ctx.tenant_id);
        ag.status = st; posConfirmar(ctx, ag, porId('PACIENTES', ag.paciente_id, ctx));
        return { id: ag.id, codigo: ag.codigo, status: st, inicio: ag.inicio };
      });
    }
    var TRANSICOES_AG = {
      pendente: ['confirmado', 'cancelado', 'reagendamento_solicitado'], confirmado: ['em_atendimento', 'concluido', 'cancelado', 'nao_compareceu', 'reagendamento_solicitado'],
      em_atendimento: ['concluido'], reagendamento_solicitado: ['confirmado', 'cancelado'], reservado_temp: ['cancelado'],
      concluido: [], cancelado: [], nao_compareceu: ['confirmado']
    };
    function mudarStatusAg(ctx, p) {
      var ag = porId('AGENDAMENTOS', p.id, ctx); if (!ag) throw falha('Agendamento não encontrado.');
      var novo = p.status;
      if (ctx.papel === 'clinica') {
        var v = porId('VINCULOS', ag.vinculo_id, ctx);
        if (!v || v.local_id !== ctx.local_id) throw falha('Agendamento de outro local.', 'proibido');
        if (['cancelado', 'reagendamento_solicitado'].indexOf(novo) < 0) throw falha('A clínica pode cancelar ou pedir alteração.', 'proibido');
        if (novo === 'cancelado' && difMin(agora(), ag.inicio) < num(v.cancelar_ate_h) * 60) novo = 'reagendamento_solicitado';
      } else exige(ctx, 'agenda');
      if (ctx.papel === 'medico' && ag.doctor_id !== ctx.doctor_id) throw falha('Agendamento de outro médico.', 'proibido');
      if ((TRANSICOES_AG[ag.status] || []).indexOf(novo) < 0) throw falha('Não é possível mudar de "' + ag.status + '" para "' + novo + '".');
      atualizar('AGENDAMENTOS', ag.id, { status: novo, motivo: linha(p.motivo, 200) || ag.motivo, atualizado_em: agora() }, ctx.tenant_id);
      var tipo = novo === 'nao_compareceu' ? 'falta' : (novo === 'concluido' ? 'comparecimento' : 'agendamento');
      evento(ctx, ag.paciente_id, tipo, ag.id, 'Status: ' + novo + (p.motivo ? ' · ' + linha(p.motivo, 120) : ''));
      if (novo === 'concluido') {
        var pac = porId('PACIENTES', ag.paciente_id, ctx);
        if (pac && pac.etapa === 'agendado') atualizar('PACIENTES', pac.id, { etapa: 'ativo' }, ctx.tenant_id);
        var s = porId('SERVICOS', ag.servico_id, ctx), v2 = porId('VINCULOS', ag.vinculo_id, ctx);
        if (s && num(s.preco_centavos) && !doTenant('FINANCEIRO', ctx).some(function (f) { return f.agendamento_id === ag.id; }))
          inserir('FINANCEIRO', { id: novoId('FIN'), tenant_id: ctx.tenant_id, doctor_id: ag.doctor_id, tipo: 'receita', descricao: s.nome, agendamento_id: ag.id, local_id: v2 ? v2.local_id : '',
            valor_centavos: num(s.preco_centavos), data: ag.inicio.slice(0, 10), status: 'pendente', criado_em: agora() }, ctx.tenant_id);
      }
      auditar(ctx, 'status', 'agendamento', ag.id, ag.status + ' → ' + novo, p.motivo);
      return { ok: true, status: novo };
    }
    function remarcar(ctx, p) {
      exige(ctx, 'agenda');
      var ag = porId('AGENDAMENTOS', p.id, ctx); if (!ag || !ATIVOS[ag.status]) throw falha('Agendamento não pode ser remarcado.');
      return trava(function () {
        var h = horariosLivres(ctx, { vinculo_id: p.vinculo_id || ag.vinculo_id, servico_id: ag.servico_id, data: p.data, ignorar: ag.id }, 'painel');
        if (h.slots.indexOf(p.hora) < 0) throw falha(h.motivo || 'Horário ocupado.', 'ocupado');
        var ini = p.data + 'T' + p.hora;
        atualizar('AGENDAMENTOS', ag.id, { vinculo_id: p.vinculo_id || ag.vinculo_id, inicio: ini, fim: somarMin(ini, difMin(ag.inicio, ag.fim)), atualizado_em: agora() }, ctx.tenant_id);
        evento(ctx, ag.paciente_id, 'agendamento', ag.id, 'Remarcado para ' + ini.replace('T', ' '));
        return { ok: true };
      });
    }

    /* ================================================================ PACIENTES */
    function salvarPaciente(ctx, p) {
      exige(ctx, 'pacientes');
      if (!p.id) { var x = garantirPaciente(ctx, p, 'painel'); if (p.etapa && ETAPAS_PACIENTE.indexOf(p.etapa) >= 0) atualizar('PACIENTES', x.id, { etapa: p.etapa }, ctx.tenant_id); return porId('PACIENTES', x.id, ctx); }
      var atual = porId('PACIENTES', p.id, ctx); if (!atual) throw falha('Paciente não encontrado.');
      var c = { nome: linha(p.nome, 120) || atual.nome, nascimento: dataValida(p.nascimento) ? p.nascimento : '', whatsapp: digitos(p.whatsapp), email: email(p.email),
        responsavel: linha(p.responsavel, 120), consente_whatsapp: sim(p.consente_whatsapp) ? 'sim' : 'nao', consente_email: sim(p.consente_email) ? 'sim' : 'nao',
        notas_adm: txt(p.notas_adm, 1000), atualizado_em: agora() };
      if (c.consente_whatsapp !== atual.consente_whatsapp || c.consente_email !== atual.consente_email) evento(ctx, atual.id, 'contato', '', 'Consentimentos: WhatsApp ' + c.consente_whatsapp + ', e-mail ' + c.consente_email);
      atualizar('PACIENTES', atual.id, c, ctx.tenant_id);
      return porId('PACIENTES', atual.id, ctx);
    }
    function etapaPaciente(ctx, p) {
      exige(ctx, 'pacientes');
      if (ETAPAS_PACIENTE.indexOf(p.etapa) < 0) throw falha('Etapa inválida.');
      var x = porId('PACIENTES', p.id, ctx); if (!x) throw falha('Paciente não encontrado.');
      atualizar('PACIENTES', x.id, { etapa: p.etapa, atualizado_em: agora() }, ctx.tenant_id);
      evento(ctx, x.id, 'contato', '', 'Etapa: ' + x.etapa + ' → ' + p.etapa);
      return { ok: true };
    }
    function historicoPaciente(ctx, p) {
      exige(ctx, 'pacientes');
      if (!porId('PACIENTES', p.id, ctx)) throw falha('Paciente não encontrado.');
      return doTenant('EVENTOS', ctx).filter(function (e) { return e.paciente_id === p.id; }).reverse();
    }
    function exportarPaciente(ctx, p) {
      exige(ctx, 'pacientes');
      var x = porId('PACIENTES', p.id, ctx); if (!x) throw falha('Paciente não encontrado.');
      auditar(ctx, 'exportar', 'paciente', x.id, 'Exportação a pedido do titular dos dados');
      return { paciente: x, eventos: historicoPaciente(ctx, p), agendamentos: doTenant('AGENDAMENTOS', ctx).filter(function (a) { return a.paciente_id === x.id; }) };
    }

    /* ================================================================ CONTEÚDO */
    function verificarPublicidade(texto, doc) {
      var t = String(texto || ''), out = [];
      ALERTAS_PUBLICIDADE.forEach(function (a) { if (a.re.test(t) && !(a.exceto && a.exceto(doc))) out.push(a.msg); });
      return out;
    }
    function salvarConteudo(ctx, p) {
      exige(ctx, 'conteudo');
      var doc = doctorAlvo(ctx, p.doctor_id), docRow = porId('DOCTORS', doc, ctx);
      var corpo = typeof p.corpo === 'object' ? p.corpo : json(p.corpo, { texto: txt(p.corpo, 8000) });
      var texto = [corpo.gancho, corpo.texto, corpo.cta, (corpo.cenas || []).map(function (c) { return c.fala || c.texto || ''; }).join(' ')].join(' ');
      var dados = { doctor_id: doc, titulo: linha(p.titulo, 160), formato: linha(p.formato, 40) || 'post', canal: linha(p.canal, 40) || 'instagram',
        data_planejada: dataValida(p.data_planejada) ? p.data_planejada : '', corpo: JSON.stringify(corpo).slice(0, 45000),
        alertas: JSON.stringify(verificarPublicidade(texto, docRow)), origem: linha(p.origem, 80), atualizado_em: agora() };
      if (!dados.titulo) throw falha('Dê um título ao conteúdo.');
      if (p.id) {
        var at = porId('CONTEUDOS', p.id, ctx); if (!at) throw falha('Conteúdo não encontrado.');
        if (at.status === 'aprovado' || at.status === 'agendado' || at.status === 'publicado') { dados.status = 'revisao'; dados.aprovado_por = ''; dados.aprovado_em = ''; }
        atualizar('CONTEUDOS', p.id, dados, ctx.tenant_id); return porId('CONTEUDOS', p.id, ctx);
      }
      dados.id = novoId('CNT'); dados.tenant_id = ctx.tenant_id; dados.status = STATUS_CONTEUDO.indexOf(p.status) >= 0 && p.status !== 'aprovado' ? p.status : 'ideia';
      dados.aprovado_por = ''; dados.aprovado_em = ''; dados.criado_em = agora();
      return inserir('CONTEUDOS', dados, ctx.tenant_id);
    }
    function statusConteudo(ctx, p) {
      exige(ctx, 'conteudo');
      var c = porId('CONTEUDOS', p.id, ctx); if (!c) throw falha('Conteúdo não encontrado.');
      if ((TRANSICOES_CONTEUDO[c.status] || []).indexOf(p.status) < 0) throw falha('Não é possível ir de "' + c.status + '" para "' + p.status + '".');
      var campos = { status: p.status, atualizado_em: agora() };
      if (p.status === 'aprovado') {
        exige(ctx, 'aprovar');
        if (ctx.papel === 'medico' && c.doctor_id !== ctx.doctor_id) throw falha('Só o médico autor aprova este conteúdo.', 'proibido');
        if (json(c.alertas, []).length && !linha(p.justificativa, 300)) throw falha('Há alertas de publicidade médica. Corrija o texto ou registre a justificativa.', 'alertas');
        campos.aprovado_por = ctx.user_id; campos.aprovado_em = agora();
        auditar(ctx, 'aprovar', 'conteudo', c.id, c.titulo, p.justificativa);
      }
      atualizar('CONTEUDOS', c.id, campos, ctx.tenant_id);
      return { ok: true };
    }

    /* ================================================================ ESTÚDIO */
    var FORMATOS = { post: 'pecas', carrossel: 'pecas', stories: 'pecas', video: 'video', corte: 'video', roteiro: 'video', legenda: 'pecas', artigo: 'texto' };
    function usoDoMes(ctx) {
      var mes = agora().slice(0, 7);
      return T('USO_IA').filter(function (u) { return u.tenant_id === ctx.tenant_id && String(u.criado_em).slice(0, 7) === mes && u.ok === 'sim'; });
    }
    function estudio(ctx, p) {
      exige(ctx, 'conteudo');
      var formato = FORMATOS[p.formato] ? p.formato : 'post', tipo = FORMATOS[formato];
      var pedido = txt(p.pedido, 3000); if (pedido.length < 8) throw falha('Descreva o que você quer criar.');
      var ten = porId('TENANTS', ctx.tenant_id), lim = PLANOS[ten.plano], uso = usoDoMes(ctx);
      var pecas = uso.filter(function (u) { return u.tarefa !== 'video'; }).length;
      var videoMin = uso.filter(function (u) { return u.tarefa === 'video'; }).length;
      if (tipo === 'video' && !lim.videos) throw falha('Vídeos estão disponíveis a partir do plano Profissional.', 'limite');
      if (tipo !== 'video' && pecas >= lim.pecas) throw falha('Você usou as ' + lim.pecas + ' criações do mês. Fale conosco para ampliar.', 'limite');
      if (tipo === 'video' && videoMin >= lim.videos) throw falha('Você usou os vídeos do mês do seu plano. Fale conosco para ampliar.', 'limite');
      var d = porId('DOCTORS', doctorAlvo(ctx, p.doctor_id), ctx);
      var perfil = { nome_publico: d.nome_publico, conselho: d.conselho, registro: d.registro, uf: d.uf, rqe: d.rqe, especialidade: d.especialidade,
        subespecialidades: d.subespecialidades, tom_de_voz: d.tom_de_voz, publico_alvo: d.publico_alvo, temas_evitar: d.temas_evitar, cor: d.cor, instagram: d.instagram };
      var entrada = { formato: formato, canal: linha(p.canal, 40) || 'instagram', pedido: pedido, transcricao: txt(p.transcricao, 60000), duracao_s: inteiro(p.duracao_s || 30, 10, 180), perfil: perfil };
      var r;
      try { r = amb.ia ? amb.ia(tipo, entrada, ctx) : null; }
      catch (e) {
        inserir('USO_IA', { id: novoId('IA'), tenant_id: ctx.tenant_id, user_id: ctx.user_id, tarefa: tipo, modelo: '', tokens_entrada: 0, tokens_saida: 0, custo_centavos: 0, ok: 'nao', criado_em: agora() });
        throw e.publico ? e : falha('O Estúdio não respondeu agora. Tente de novo em instantes.', 'ia');
      }
      if (!r || !r.plano) throw falha('O Estúdio não está configurado.', 'ia');
      inserir('USO_IA', { id: novoId('IA'), tenant_id: ctx.tenant_id, user_id: ctx.user_id, tarefa: tipo, modelo: r.modelo || '', tokens_entrada: num(r.tokens_entrada),
        tokens_saida: num(r.tokens_saida), custo_centavos: num(r.custo_centavos), ok: 'sim', criado_em: agora() });
      var plano = r.plano;
      var cnt = salvarConteudo(ctx, { doctor_id: d.id, titulo: plano.titulo || pedido.slice(0, 80), formato: formato, canal: entrada.canal, corpo: plano, origem: 'estudio', status: 'producao' });
      atualizar('CONTEUDOS', cnt.id, { status: 'revisao' }, ctx.tenant_id);
      cnt.status = 'revisao';
      if (r.canva_url) { plano.canva_url = r.canva_url; atualizar('CONTEUDOS', cnt.id, { corpo: JSON.stringify(plano) }, ctx.tenant_id); cnt.corpo = JSON.stringify(plano); }
      return cnt;
    }

    /* ================================================================ PÁGINA */
    var TIPOS_BLOCO = { capa: 1, sobre: 1, servicos: 1, agendar: 1, locais: 1, planos: 1, faq: 1, texto: 1, contato: 1 };
    function blocosPadrao() {
      return [{ tipo: 'capa', visivel: true, titulo: '', texto: '' }, { tipo: 'sobre', visivel: true, titulo: 'Sobre', texto: '' }, { tipo: 'servicos', visivel: true, titulo: 'Atendimentos', texto: '' },
        { tipo: 'agendar', visivel: true, titulo: 'Agende sua consulta', texto: '' }, { tipo: 'planos', visivel: true, titulo: 'Acompanhamentos', texto: '' },
        { tipo: 'locais', visivel: true, titulo: 'Onde atendo', texto: '' }, { tipo: 'faq', visivel: true, titulo: 'Perguntas frequentes', texto: '', itens: [
          { p: 'Atende por convênio?', r: 'Atendimento particular. Solicite recibo para reembolso, conforme as regras do seu plano.' },
          { p: 'Como remarcar?', r: 'Fale pelo WhatsApp com pelo menos 24 horas de antecedência.' }] }, { tipo: 'contato', visivel: true, titulo: 'Contato', texto: '' }];
    }
    function paginaDe(ctx, doc) { return doTenant('PAGINAS', ctx).filter(function (x) { return x.doctor_id === doc; })[0] || null; }
    function lerPagina(ctx, p) { exige(ctx, 'perfil'); var doc = doctorAlvo(ctx, p.doctor_id), pg = paginaDe(ctx, doc); return { blocos: pg ? json(pg.blocos, blocosPadrao()) : blocosPadrao(), status: pg ? pg.status : 'rascunho', publicado_em: pg ? pg.publicado_em : '' }; }
    function salvarPagina(ctx, p) {
      exige(ctx, 'perfil');
      var doc = doctorAlvo(ctx, p.doctor_id), docRow = porId('DOCTORS', doc, ctx);
      var blocos = (Array.isArray(p.blocos) ? p.blocos : []).filter(function (b) { return b && TIPOS_BLOCO[b.tipo]; }).slice(0, 30).map(function (b) {
        return { tipo: b.tipo, visivel: b.visivel !== false, titulo: linha(b.titulo, 140), texto: txt(b.texto, 3000),
          itens: (Array.isArray(b.itens) ? b.itens : []).slice(0, 20).map(function (i) { return { p: linha(i.p, 200), r: txt(i.r, 1000) }; }) };
      });
      var publicar = sim(p.publicar), alertas = verificarPublicidade(blocos.map(function (b) { return b.titulo + ' ' + b.texto + ' ' + b.itens.map(function (i) { return i.p + ' ' + i.r; }).join(' '); }).join(' '), docRow);
      if (publicar && !docRow.registro) throw falha('Preencha o número do registro no conselho em Perfil antes de publicar.');
      if (publicar && alertas.length && !linha(p.justificativa, 300)) throw falha('A página tem alertas de publicidade médica: ' + alertas.join(' '), 'alertas');
      var pg = paginaDe(ctx, doc), dados = { blocos: JSON.stringify(blocos), atualizado_em: agora() };
      if (publicar) { dados.status = 'publicada'; dados.publicado_em = agora(); auditar(ctx, 'publicar', 'pagina', doc, docRow.slug, p.justificativa); }
      if (pg) atualizar('PAGINAS', pg.id, dados, ctx.tenant_id);
      else { dados.id = novoId('PAG'); dados.tenant_id = ctx.tenant_id; dados.doctor_id = doc; dados.status = dados.status || 'rascunho'; dados.publicado_em = dados.publicado_em || ''; inserir('PAGINAS', dados, ctx.tenant_id); }
      return { ok: true, alertas: alertas, slug: docRow.slug };
    }

    /* ================================================================ CARREGAR */
    /** Tudo que a tela precisa, filtrado pelo papel. Dados clínicos não existem nesta versão. */
    function carregar(ctx) {
      if (ctx.papel === 'admin') return { eu: ctx, tenants: adminTenants(ctx), planos: PLANOS, versao: VERSAO };
      var ten = porId('TENANTS', ctx.tenant_id);
      var docs = doTenant('DOCTORS', ctx), locais = doTenant('LOCAIS', ctx), vinc = doTenant('VINCULOS', ctx), regras = doTenant('REGRAS', ctx);
      var servs = doTenant('SERVICOS', ctx), ags = doTenant('AGENDAMENTOS', ctx), pacs = doTenant('PACIENTES', ctx), t = agora();
      var base = { eu: ctx, tenant: { id: ten.id, nome: ten.nome, tipo: ten.tipo, plano: ten.plano, limites: PLANOS[ten.plano] }, versao: VERSAO, agora: t };
      if (ctx.papel === 'clinica') {
        var meus = vinc.filter(function (v) { return v.local_id === ctx.local_id && v.status === 'ativo'; });
        var ids = {}; meus.forEach(function (v) { ids[v.id] = 1; });
        var meusAgs = ags.filter(function (a) { return ids[a.vinculo_id] && a.status !== 'reservado_temp'; });
        var pacIds = {}; meusAgs.forEach(function (a) { pacIds[a.paciente_id] = 1; });
        var srvIds = {}; meus.forEach(function (v) { lista(v.servicos).forEach(function (s) { srvIds[s] = 1; }); });
        return Object.assign(base, {
          medicos: docs.filter(function (d) { return meus.some(function (v) { return v.doctor_id === d.id; }); }).map(function (d) { return { id: d.id, nome_publico: d.nome_publico, especialidade: d.especialidade, registro: d.registro, uf: d.uf }; }),
          locais: locais.filter(function (l) { return l.id === ctx.local_id; }), vinculos: meus, regras: regras.filter(function (r) { return ids[r.vinculo_id]; }),
          servicos: servs.filter(function (s) { return srvIds[s.id]; }).map(function (s) { return { id: s.id, nome: s.nome, duracao_min: s.duracao_min, doctor_id: s.doctor_id, status: s.status }; }),
          agendamentos: meusAgs, pacientes: pacs.filter(function (p) { return pacIds[p.id]; }).map(function (p) { return { id: p.id, nome: p.nome, whatsapp: p.whatsapp }; }),
          ocupacao: ocupacao(ctx, { dias: 45 }, { vinc: meus })
        });
      }
      var filtroDoc = ctx.papel === 'medico' ? function (x) { return x.doctor_id === ctx.doctor_id; } : function () { return true; };
      var out = Object.assign(base, {
        medicos: docs.filter(function (d) { return ctx.papel !== 'medico' || d.id === ctx.doctor_id; }), locais: locais, vinculos: vinc.filter(filtroDoc),
        regras: regras, dias: doTenant('DIAS', ctx), excecoes: doTenant('EXCECOES', ctx).filter(filtroDoc), servicos: servs.filter(filtroDoc),
        planos: doTenant('PLANOS', ctx).filter(filtroDoc), agendamentos: ags.filter(function (a) { return filtroDoc(a) && ativo(a, t) || ['concluido', 'cancelado', 'nao_compareceu', 'reagendamento_solicitado'].indexOf(a.status) >= 0 && filtroDoc(a); }),
        pacientes: pacs, ocupacao: ocupacao(ctx, { dias: 45 }, { vinc: vinc.filter(filtroDoc) })
      });
      if (PODE[ctx.papel].tudo || PODE[ctx.papel].financeiro) out.financeiro = doTenant('FINANCEIRO', ctx).filter(filtroDoc);
      if (PODE[ctx.papel].tudo || PODE[ctx.papel].conteudo) out.conteudos = doTenant('CONTEUDOS', ctx).filter(filtroDoc);
      if (ctx.papel === 'titular') out.equipe = equipe(ctx);
      return out;
    }
    /** Ocupação por vínculo e data (painel de mínimo/máximo). */
    function ocupacao(ctx, p, opc) {
      var vinc = (opc && opc.vinc) || doTenant('VINCULOS', ctx), hoje = agora().slice(0, 10), out = [];
      var cache = { regras: doTenant('REGRAS', ctx), dias: doTenant('DIAS', ctx), ags: doTenant('AGENDAMENTOS', ctx), agora: agora() };
      vinc.filter(function (v) { return v.status === 'ativo'; }).forEach(function (v) {
        for (var i = 0; i < (num(p.dias) || 30); i++) { var s = situacaoDia(ctx, v, somarDias(hoje, i), cache); if (s) out.push(s); }
      });
      return out;
    }

    /* ================================================================ PÚBLICO */
    function ctxPublico(slug) {
      var r = T('SLUGS').filter(function (x) { return x.slug === String(slug || '').toLowerCase(); })[0];
      if (!r) throw falha('Página não encontrada.', 'nao_encontrado');
      var ten = porId('TENANTS', r.tenant_id);
      if (!ten || ten.status !== 'ativo') throw falha('Página indisponível.', 'nao_encontrado');
      if (db.usarTenant) db.usarTenant(ten);
      return { tenant_id: ten.id, doctor_id: r.doctor_id, papel: 'publico', user_id: '' };
    }
    function publicoPerfil(p) {
      var ctx = ctxPublico(p.slug), d = porId('DOCTORS', ctx.doctor_id, ctx);
      if (!d || !d.registro) throw falha('Página em preparação.', 'nao_encontrado');
      var vinc = doTenant('VINCULOS', ctx).filter(function (v) { return v.doctor_id === d.id && v.status === 'ativo' && v.publico === 'sim'; });
      var locais = doTenant('LOCAIS', ctx), servs = doTenant('SERVICOS', ctx).filter(function (s) { return s.doctor_id === d.id && s.status === 'ativo'; });
      return {
        medico: { nome_publico: d.nome_publico, conselho: d.conselho, registro: d.registro, uf: d.uf, rqe: d.rqe, especialidade: d.especialidade, subespecialidades: d.subespecialidades,
          apresentacao: d.apresentacao, formacao: d.formacao, foto_url: d.foto_url, whatsapp: d.whatsapp, instagram: d.instagram, cor: d.cor },
        servicos: servs.map(function (s) { return { id: s.id, nome: s.nome, descricao: s.descricao, duracao_min: s.duracao_min, modalidade: s.modalidade, preco_centavos: s.mostra_preco === 'sim' ? s.preco_centavos : '', orientacoes: s.orientacoes }; }),
        locais: vinc.map(function (v) { var l = locais.filter(function (x) { return x.id === v.local_id; })[0] || {}; return { vinculo_id: v.id, nome: l.nome, tipo: l.tipo, endereco: l.endereco, cidade: l.cidade, servicos: lista(v.servicos) }; }),
        planos: doTenant('PLANOS', ctx).filter(function (x) { return x.doctor_id === d.id && x.status === 'ativo'; }).map(function (x) { return { nome: x.nome, descricao: x.descricao, validade_dias: x.validade_dias, itens: json(x.itens, []) }; }),
        blocos: (function () { var pg = paginaDe(ctx, d.id); return pg && pg.status === 'publicada' ? json(pg.blocos, blocosPadrao()) : blocosPadrao(); })()
      };
    }
    function vinculoPublico(ctx, id) { var v = porId('VINCULOS', id, ctx); if (!v || v.publico !== 'sim' || v.doctor_id !== ctx.doctor_id) throw falha('Local indisponível.'); return v; }
    function publicoDias(p) { var ctx = ctxPublico(p.slug); vinculoPublico(ctx, p.vinculo_id); return diasDisponiveis(ctx, p, 'pagina').filter(function (d) { return d.situacao === 'confirmada'; }); }
    function publicoHorarios(p) { var ctx = ctxPublico(p.slug); vinculoPublico(ctx, p.vinculo_id); var h = horariosLivres(ctx, p, 'pagina'); return { slots: h.slots, motivo: h.slots.length ? '' : h.motivo }; }
    function publicoReservar(p) {
      var ctx = ctxPublico(p.slug); vinculoPublico(ctx, p.vinculo_id);
      var pac = p.paciente || {};
      if (!sim(pac.aceite)) throw falha('Para agendar, aceite o uso dos seus dados para este atendimento.');
      var ag = criarAgendamento(ctx, { vinculo_id: p.vinculo_id, servico_id: p.servico_id, data: p.data, hora: p.hora, paciente: pac }, 'pagina', 'reserva');
      return { id: ag.id, codigo: ag.codigo, expira_em: ag.reserva_expira_em, inicio: ag.inicio };
    }
    function publicoConfirmar(p) { var ctx = ctxPublico(p.slug); return confirmarReserva(ctx, p); }

    /* ================================================================ ROTEADOR */
    var ACOES = {
      carregar: carregar, sair: sair, trocarSenha: trocarSenha,
      perfil: salvarPerfil, local: salvarLocal, servico: salvarServico, plano: salvarPlano, vinculo: salvarVinculo, dia: salvarDia,
      excecao: salvarExcecao, excecaoRemover: removerExcecao,
      horarios: function (ctx, p) { exigeAgenda(ctx, p); return horariosLivres(ctx, p, ctx.papel === 'clinica' ? 'clinica' : 'painel'); },
      dias: function (ctx, p) { exigeAgenda(ctx, p); return diasDisponiveis(ctx, p, ctx.papel === 'clinica' ? 'clinica' : 'painel'); },
      agendar: function (ctx, p) { exigeAgenda(ctx, p); return criarAgendamento(ctx, p, ctx.papel === 'clinica' ? 'clinica' : 'painel', 'direto'); },
      agStatus: mudarStatusAg, remarcar: remarcar,
      paciente: salvarPaciente, pacienteEtapa: etapaPaciente, pacienteHistorico: historicoPaciente, pacienteExportar: exportarPaciente,
      conteudo: salvarConteudo, conteudoStatus: statusConteudo, estudio: estudio,
      usoEstudio: function (ctx) { var u = usoDoMes(ctx), ten = porId('TENANTS', ctx.tenant_id); return { pecas: u.filter(function (x) { return x.tarefa !== 'video'; }).length, videos: u.filter(function (x) { return x.tarefa === 'video'; }).length, limites: PLANOS[ten.plano] }; }, verificarTexto: function (ctx, p) { return verificarPublicidade(p.texto, porId('DOCTORS', doctorAlvo(ctx), ctx)); },
      pagina: lerPagina, paginaSalvar: salvarPagina,
      convidar: convidar, equipe: equipe, removerAcesso: removerAcesso,
      adminTenants: adminTenants, adminCriarTenant: adminCriarTenant, adminStatusTenant: adminStatusTenant, adminPlano: adminPlano, adminAuditoria: adminAuditoria
    };
    function exigeAgenda(ctx, p) {
      if (ctx.papel === 'clinica') { var v = porId('VINCULOS', p.vinculo_id, ctx); if (!v || v.local_id !== ctx.local_id) throw falha('Este local não é da sua clínica.', 'proibido'); return; }
      exige(ctx, 'agenda');
    }
    var PUBLICAS = { entrar: entrar, aceitarConvite: aceitarConvite, publicoPerfil: publicoPerfil, publicoDias: publicoDias, publicoHorarios: publicoHorarios,
      publicoReservar: publicoReservar, publicoConfirmar: publicoConfirmar };

    /** Ponto único de entrada: {acao, token, dados} → {ok, dados} | {ok:false, erro, codigo}. */
    function processar(req) {
      try {
        req = req || {};
        var acao = String(req.acao || ''), dados = req.dados || {};
        if (PUBLICAS[acao]) return { ok: true, dados: PUBLICAS[acao](dados) };
        if (!ACOES[acao]) throw falha('Ação desconhecida.', 'acao');
        var ctx = contexto(req.token);
        if (ctx.papel !== 'admin' && acao.indexOf('admin') === 0) throw falha('Seu acesso não permite esta ação.', 'proibido');
        return { ok: true, dados: ACOES[acao](ctx, dados, req.token) };
      } catch (e) {
        if (e.publico) return { ok: false, erro: e.message, codigo: e.codigo };
        if (amb.registrarErro) amb.registrarErro(e, req && req.acao);
        return { ok: false, erro: 'Algo deu errado do nosso lado. Tente de novo em instantes.', codigo: 'interno' };
      }
    }

    return {
      processar: processar, criarTenant: criarTenant, criarUsuario: criarUsuario, verificarPublicidade: verificarPublicidade,
      _interno: { horariosLivres: horariosLivres, contexto: contexto, somarMin: somarMin, slugify: slugify }
    };
  }

  var API = { criarNucleo: criarNucleo, TABELAS: TABELAS, CENTRAIS: CENTRAIS, PLANOS: PLANOS, PAPEIS: PAPEIS, ETAPAS_PACIENTE: ETAPAS_PACIENTE,
    STATUS_AG: STATUS_AG, STATUS_CONTEUDO: STATUS_CONTEUDO, VERSAO: VERSAO, util: { somarDias: somarDias, somarMin: somarMin, diaSemana: diaSemana, slugify: slugify } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else raiz.Fluyan = API;
})(this);
