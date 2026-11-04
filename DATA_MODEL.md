# Fluyan: modelo de dados

Versão 0.1 · 03/11/2026. Cada tabela vira uma aba no MVP e uma tabela PostgreSQL na produção.

## Convenções

- `id`: texto, prefixo da tabela + `aaMMddHHmmss` + 6 caracteres aleatórios (ex.: `AGD261105083012K7Q2PA`). Único globalmente.
- `tenant_id` em **todas** as linhas de dados do tenant, mesmo na planilha própria do tenant.
- Campos comuns: `criado_em`, `atualizado_em`, `criado_por`, `status`, `arquivado_em` (sem exclusão física de dados que têm valor de histórico).
- Datas e horas em ISO local do tenant (`2026-11-05T08:00:00`) + `fuso` no tenant.
- Valores em centavos (inteiro) para evitar erro de arredondamento.
- JSON em colunas de texto só para estruturas que não são filtradas (blocos de página, regras, permissões).

## Planilha CENTRAL (da plataforma)

| Tabela | Campos principais |
|---|---|
| `TENANTS` | id, nome, slug, tipo (`individual`/`clinica`), planilha_id, pasta_drive_id, plano_id, status (`teste`/`ativo`/`suspenso`/`cancelado`), fuso, criado_em |
| `USERS` | id, email, nome, senha_hash, salt, mfa_ativo, mfa_segredo_cifrado, ultimo_acesso, status |
| `USER_TENANT_ROLES` | id, user_id, tenant_id, papel (`titular`/`secretaria`/`clinica`/`colaborador`/`admin_plataforma`), clinica_id (quando papel = clinica), permissoes (JSON), status |
| `SESSIONS` | token_hash, user_id, tenant_id, expira_em, ip_resumo, criado_em |
| `PLANOS_SAAS` | id, nome, preco_centavos, limites (JSON: tokens IA, minutos de transcrição, páginas, usuários, armazenamento), ativo |
| `ASSINATURAS_SAAS` | id, tenant_id, plano_id, mp_preapproval_id, status, inicio, proxima_cobranca, cancelado_em |
| `PAGAMENTOS_SAAS` | id, tenant_id, assinatura_id, mp_payment_id, valor_centavos, status, pago_em, bruto (JSON do webhook) |
| `AI_USAGE` | id, tenant_id, user_id, tarefa, provedor, modelo, tokens_entrada, tokens_saida, segundos_audio, custo_estimado_centavos, ok, criado_em |
| `BIBLIOTECA_CENTRAL` | id, tipo (`copy`/`gancho`/`modelo_pagina`/`modelo_canva`/`modelo_capcut`/`pauta`/`campanha`), especialidade, canal, objetivo, conteudo (JSON), licenca, versao, status_revisao, restricoes |
| `ESPECIALIDADES` | id, profissao, nome, conselho, campos_obrigatorios (JSON) |
| `SLUGS` | slug, tenant_id, doctor_id (índice para páginas públicas) |
| `AUDIT_LOGS` | id, tenant_id, user_id, acao, entidade, entidade_id, antes (resumo), depois (resumo), justificativa, criado_em |

## Planilha DO TENANT

### Profissional e locais
| Tabela | Campos principais |
|---|---|
| `DOCTORS` | id, tenant_id, user_id, nome_completo, nome_publico, foto_url, conselho, registro, uf, rqe, apresentacao, contatos (JSON), redes (JSON), modalidades, idiomas, cor_destaque, logo_url, slug |
| `DOCTOR_SPECIALTIES` | id, tenant_id, doctor_id, especialidade_id, rqe, principal |
| `PERFIL_INTELIGENTE` | id, tenant_id, doctor_id, chave, valor, tipo (`fato`/`preferencia`/`sugestao_ia`/`pendente`), fonte, confirmado_em |
| `CLINICS` | id, tenant_id, nome, tipo (`propria`/`parceira`), endereco, responsavel, contatos, status |
| `DOCTOR_CLINICS` (vínculo) | id, tenant_id, doctor_id, clinic_id, status, servicos_permitidos (lista de ids), antecedencia_min_h, antecedencia_max_dias, regra_cancelamento, confirmacao (`automatica`/`manual`), permissoes_clinica (JSON) |

### Agenda
| Tabela | Campos principais |
|---|---|
| `SCHEDULE_RULES` | id, tenant_id, vinculo_id, dia_semana, inicio, fim, duracao_padrao_min, intervalo_min, min_consultas, max_consultas, vigencia_inicio, vigencia_fim |
| `SCHEDULE_DAYS` | id, tenant_id, vinculo_id, data, situacao (`provisoria`/`confirmada`/`cancelada`), min_override, max_override, observacao |
| `SCHEDULE_EXCEPTIONS` | id, tenant_id, doctor_id, vinculo_id (vazio = todos), inicio, fim, motivo |
| `SERVICES` | id, tenant_id, doctor_id, nome, descricao, especialidade_id, duracao_min, modalidade (`presencial`/`online`), preco_centavos, mostra_preco, intervalo_apos_min, orientacoes, status |
| `APPOINTMENTS` | id, tenant_id, doctor_id, patient_id, service_id, vinculo_id, modalidade, inicio, fim, status (`reservado_temp`/`pendente`/`confirmado`/`em_atendimento`/`concluido`/`cancelado`/`reagendamento_solicitado`/`nao_compareceu`), origem (`painel`/`clinica`/`pagina`/`chatbot`/`secretaria`), reserva_expira_em, codigo, cancelado_por, motivo, criado_por |

### Pacientes (administrativo)
| Tabela | Campos principais |
|---|---|
| `PATIENTS` | id, tenant_id, nome, nascimento, cpf_cifrado (opcional), telefone, whatsapp, email, responsavel_id, origem, etapa_funil, preferencias_contato (JSON), status |
| `PATIENT_EVENTS` | id, tenant_id, patient_id, tipo (`cadastro`/`contato`/`agendamento`/`comparecimento`/`falta`/`pagamento`/`formulario_enviado`/`documento`), ref_id, resumo, criado_em |
| `CONSENTS` | id, tenant_id, patient_id, finalidade, canal, aceito, versao_texto, registrado_em, origem, revogado_em |
| `REMINDERS` | id, tenant_id, patient_id, tipo, data, mensagem, status |

### Serviços comerciais
| Tabela | Campos principais |
|---|---|
| `PLANS` | id, tenant_id, doctor_id, nome, descricao, publico, validade_dias, preco_centavos, forma_pagamento, politica_cancelamento, renovacao, status |
| `PLAN_ITEMS` | id, tenant_id, plan_id, service_id, quantidade, regra_uso |
| `SUBSCRIPTIONS` / `SUBSCRIPTION_USAGE` / `PAYMENTS` | previstas para a fase futura (item 13.4) |

### Marketing e páginas
| Tabela | Campos principais |
|---|---|
| `CONTENT_ASSETS` | id, tenant_id, doctor_id, tipo, nome, drive_id, tamanho, origem, finalidade, permissao_uso, transcricao_id, status |
| `TRANSCRIPTIONS` | id, tenant_id, asset_id, texto, palavras (JSON com tempos), temas, criado_em |
| `GENERATED_CONTENT` | id, tenant_id, doctor_id, origem_asset_id, ferramenta, formato, canal, titulo, corpo (JSON: gancho, texto, cenas, cta, hashtags), alertas_publicidade (JSON), modelo_visual_id, versao |
| `EDITORIAL_CALENDAR` | id, tenant_id, content_id, data_planejada, responsavel_id, status, aprovado_por, aprovado_em, url_publicada, metricas (JSON) |
| `PAGES` | id, tenant_id, doctor_id, slug, tipo (`site`/`servico`), service_id, titulo, seo (JSON), blocos (JSON), status (`rascunho`/`revisao`/`publicada`), versao_publicada |
| `PAGE_VERSIONS` | id, tenant_id, page_id, versao, blocos (JSON), publicado_por, publicado_em, commit_sha |
| `EXPORTS` | id, tenant_id, content_id, tipo (`docx`/`pptx`/`pdf`/`capcut`/`srt`), user_id, criado_em |

### Operação
| Tabela | Campos principais |
|---|---|
| `AI_JOBS` | id, tenant_id, tarefa, status, entrada_resumo, saida_ref, erro, criado_em |
| `NOTIFICATIONS` | id, tenant_id, user_id, tipo, texto, lida, criado_em |
| `AUDIT_LOGS` | cópia local do tenant (a central recebe o resumo) |
| `CONFIG` | chave, valor (sem segredos) |

### Clínico (desligado no MVP, só fase 6)
`ANAMNESIS_TEMPLATES`, `FORM_VERSIONS`, `PATIENT_FORM_LINKS`, `PATIENT_FORM_RESPONSES`, `MEDICAL_RECORDS`, `MEDICAL_EVOLUTIONS`, `CLINICAL_DOCUMENTS`: modelados no documento mestre; serão criados em base separada da produção, nunca na planilha.

## Relacionamentos

- TENANT 1–N USER_TENANT_ROLES N–1 USER
- TENANT 1–N DOCTOR; DOCTOR N–N CLINIC por DOCTOR_CLINICS (vínculo)
- VÍNCULO 1–N SCHEDULE_RULES, 1–N SCHEDULE_DAYS
- APPOINTMENT N–1 PATIENT, DOCTOR, SERVICE, VÍNCULO (vazio quando online sem clínica)
- PLAN 1–N PLAN_ITEMS N–1 SERVICE
- CONTENT 1–1 EDITORIAL_CALENDAR; CONTENT N–1 CONTENT_ASSET (origem)
- PAGE 1–N PAGE_VERSIONS

## Regras de isolamento

1. O token da sessão carrega `user_id` e `tenant_id`. O servidor abre **só** a planilha do `tenant_id` da sessão; nenhum parâmetro do cliente escolhe a planilha.
2. Toda função do núcleo recebe o contexto `{tenant_id, user_id, papel, permissoes, clinic_id}` e filtra por ele, mesmo dentro da planilha certa (defesa em profundidade).
3. Papel `clinica` só enxerga `APPOINTMENTS` do seu `vinculo_id`, e dos pacientes só nome e contato dos que ela própria agendou.
4. Papel `secretaria` nunca recebe tabelas clínicas; o servidor nem as lê para esse papel.
5. Admin da plataforma acessa planilha de tenant apenas por ação "acesso de suporte" com justificativa obrigatória gravada em `AUDIT_LOGS` central.
6. Páginas publicadas contêm só dados do perfil marcados como `fato` e conteúdos `publicada`.
7. Na produção: Row Level Security por `tenant_id` no PostgreSQL + mesma checagem no código.
