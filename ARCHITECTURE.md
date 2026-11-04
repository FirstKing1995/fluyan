# Fluyan: arquitetura

Versão 0.1 · 03/11/2026

## 1. Visão geral do MVP experimental

```
                 GitHub Pages (público, só arquivos estáticos)
  ┌──────────────────────────────────────────────────────────────────┐
  │ /            página de vendas + assinar                          │
  │ /app/        painel do médico, portal da clínica, admin (PWA)    │
  │ /m/<slug>/   páginas dos médicos, HTML pronto (gerado ao publicar)│
  │ exportadores no navegador: DOCX, PPTX/PDF (Canva), ZIP (CapCut)  │
  └──────────────┬───────────────────────────────────────────────────┘
                 │ fetch JSON  {acao, token, dados}
                 ▼
  Google Apps Script (Web App, conta do dono da plataforma)
  ┌──────────────────────────────────────────────────────────────────┐
  │ Codigo.gs     roteador, sessão, trava (LockService), quotas      │
  │ Nucleo.gs     regras de negócio em JS puro (mesmo arquivo do     │
  │               navegador no modo demo; testado em Node)           │
  │ Plat.gs       adaptador de dados: tabela → aba da planilha       │
  │ IA.gs         camada de provedores (Groq e outros), uso e custo  │
  │ Publicar.gs   gera HTML da página e faz commit no repo do site   │
  │ Webhooks.gs   Mercado Pago (assinatura do tenant)                │
  └──────┬─────────────────────────┬─────────────────────────────────┘
         ▼                         ▼
  Planilha CENTRAL           Uma planilha POR TENANT (criada de um modelo)
  tenants, usuários,         perfil, locais, vínculos, serviços, agenda,
  assinaturas, uso de IA,    pacientes, conteúdo, páginas, auditoria
  biblioteca, auditoria      + pasta privada no Drive para materiais
```

Segredos (chave de IA, token do GitHub, chaves Mercado Pago) ficam nas **Propriedades do Script**, nunca na planilha, no front ou no repositório.

## 2. Decisões centrais do MVP (detalhes em DECISIONS.md)

1. **Front sem etapa de build**: HTML + CSS + JS em módulos de tela, como o Prumo CRM. Qualquer pessoa edita e publica com `git push`.
2. **Uma planilha por tenant**: isolamento físico. Um erro de filtro não vaza dados de outro médico, porque a planilha errada nem é aberta. A planilha central só guarda o índice `tenant_id → planilha_id`.
3. **Núcleo de regras em JS puro**: agenda, permissões, publicidade médica e validações rodam iguais no Apps Script, no navegador (modo demo) e no Node (testes). Padrão já provado na Arcana Nail e na BRASA.
4. **Adaptador de dados (Plat)**: o núcleo pede `db.tabela('Agendamentos')`, não "aba 7, coluna C". Trocar a planilha por PostgreSQL é trocar o adaptador.
5. **Páginas dos médicos pré-geradas**: ao publicar, o servidor monta o HTML final e grava no repositório do site via API do GitHub. O paciente abre uma página estática rápida e indexável; só o widget de horários consulta o servidor.
6. **Exportações no navegador**: DOCX, PPTX e o pacote do CapCut são montados no aparelho do médico. Não gastam cota do Apps Script e não trafegam pelo servidor.
7. **Dois repositórios**: `fluyan` **privado** (docs, backend, ferramentas, testes) e `fluyan-site` **público** só com a pasta `site/` (o GitHub Pages gratuito exige repositório público). Mesmo modelo do Prumo e da BRASA, ajustado para manter o código do servidor privado.

## 3. Limites conhecidos do MVP

| Limite | Efeito | Mitigação no MVP |
|---|---|---|
| Apps Script: ~30 execuções simultâneas, 6 min por execução, cotas diárias de UrlFetch e e-mail | Piloto aguenta dezenas de médicos, não milhares | Cache no navegador, lotes, medir uso por tenant |
| Planilha não é banco transacional | Duas reservas no mesmo segundo podem colidir | `LockService` em toda escrita de agenda + reserva temporária + revalidação dentro da trava (item 12.6) |
| Cold start do Apps Script (1 a 3 s) | Primeira consulta de horários demora | Páginas estáticas; horários com indicador de carregamento; pré-aquecimento por gatilho |
| Envio de e-mail pela conta Google tem cota diária | Confirmações em massa param | Contar envios; acima do limite, só WhatsApp por link |
| Planilha e Drive não atendem requisitos de prontuário | Dados clínicos reais proibidos | Módulo clínico desligado; formulários só com dados fictícios |

## 4. Arquitetura de produção (a avaliar na fase 7)

```
 Front (o mesmo, PWA)  →  API (Node/TypeScript, serverless ou container, região Brasil)
                              ├─ Auth com MFA (provedor gerenciado)
                              ├─ PostgreSQL gerenciado com Row Level Security por tenant_id
                              ├─ Armazenamento de objetos privado + URLs temporárias
                              ├─ Fila para IA, transcrição e envios
                              ├─ Cofre de segredos
                              ├─ Logs, métricas, alertas, backups testados
                              └─ Base clínica separada (esquema e chaves próprios)
```

Candidatos a avaliar (nenhum aprovado): Supabase (Postgres + Auth + Storage em São Paulo), Neon + Cloudflare Workers, ou provedor nacional para a base clínica. A escolha depende de contrato, região dos dados e custo por tenant.

## 5. Migração MVP → produção

1. **Contrato de API fixo desde o início**: o front fala `{acao, token, dados}` com uma URL. Na migração, só muda `API_URL`.
2. **Núcleo reaproveitado**: as regras em JS puro viram módulo da nova API sem reescrita.
3. **IDs globais** (prefixo + data + aleatório) e `tenant_id` em todas as linhas desde já, mesmo com uma planilha por tenant. A importação para Postgres não precisa remapear chaves.
4. **Script de exportação** por tenant (JSON por tabela) e **script de importação** testado com dados fictícios antes de qualquer cliente real.
5. **Migração por tenant**: cada médico migra individualmente, com período de leitura dupla e botão de reversão.
6. Páginas públicas não mudam: continuam estáticas.

## 6. Reaproveitamento dos nossos projetos

| De onde | O que vem | Para onde no Fluyan |
|---|---|---|
| `prumo-crm/app/js/core.js` | estado, `C.store`, chamada à API, modo demo, formatação BRL e datas, componentes de modal e lista | `site/app/js/core.js` (renomeado `MF`) |
| `prumo-crm/backend/plataforma.gs` (`PLAT`) | adaptador de tabelas sobre abas, `comTrava_`, hash de senha com salt, id, cache, arquivos no Drive, e-mail | `backend/Plat.gs`, adaptado para abrir a planilha do tenant |
| `prumo-crm` usuários e permissões | perfis, permissões por tela, sessão por token | papéis médico, secretária, clínica, admin |
| `prumo-crm` funil e contatos (`views-crm.js`) | quadro arrastável, ficha com linha do tempo, tarefas | funil administrativo de pacientes |
| `prumo-crm` modelos, campanhas, `chat.js` | mensagens prontas, chat do site, provedores de WhatsApp | lembretes e, na fase 5, chatbot |
| `prumo-crm` cobranças Mercado Pago | campos e webhook | assinatura do tenant e, depois, planos do paciente |
| `arcana-nail/servidor/nucleo.js` | grade de horários (`grade`), bloqueios, reservas, validação de data/hora, código de reserva, testes em Node | motor da agenda central, ampliado para vários locais, vínculos e mínimo/máximo |
| `arcana-nail` página do cliente | passo a passo de agendamento no celular | fluxo do paciente (tela 6) |
| `brasa` checkout | Pix e cartão Mercado Pago na própria página, webhook, página de obrigado | assinatura do Fluyan |
| `brasa` `lp.html` + `admin.html` | landing de vendas e painel administrativo | página de vendas e admin da plataforma |
| `brasa` ponte BRASA → CRM | fila de saída (`CrmOutbox`) e chave entre sistemas | eventos entre central e tenants, webhooks de saída |
| `brasa/catalogo/build.py` | catálogo gerado por script | biblioteca central de copies e modelos por especialidade |
| `pessoal/capcut/work/gerar-capcut.mjs` | montagem de rascunho do CapCut clonando uma amostra real (faixas de texto, imagem, áudio, animações) | exportador CapCut, portado para o navegador |
| GODS e jogos | progressão por etapas com feedback visual | "Primeiros passos" com progresso e pequenas celebrações sóbrias |
| `prumo-vendas` (feita com design-taste-frontend) | estrutura de página de vendas que não revela a infraestrutura | página de vendas do Fluyan |

## 7. Estrutura de pastas prevista

```
apps meus/fluyan/
  docs/                      documento mestre e guias
  identidade/                tokens e prancha da marca
  backend/                   Codigo.gs, Nucleo.gs, Plat.gs, IA.gs, Publicar.gs, Webhooks.gs
  site/                      → repositório público fluyan-site
    index.html               página de vendas
    assinar.html
    app/                     painel, portal da clínica, admin
      js/core.js, js/nucleo.js (cópia do Nucleo.gs), js/views-*.js
      js/export-docx.js, js/export-canva.js, js/export-capcut.js
      js/editor-paginas.js
    m/                       páginas publicadas dos médicos
    assets/
  ferramentas/               testes do núcleo em Node, montagem de pacotes
  *.md                       especificação
```
