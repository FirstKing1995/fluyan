# Fluyan: backlog priorizado

Versão 0.1 · 03/11/2026. Ordem = ordem de execução. "Dep." lista o que precisa estar pronto antes. Critério de aceite (CA) é o teste que encerra a tarefa.

## Fase 1: fundação

| # | Tarefa | Dep. | Critério de aceite |
|---|---|---|---|
| 1.1 | Criar pastas, repositório privado `fluyan` e público `fluyan-site` | aprovação | Os dois repositórios existem; `site/` publica uma página "em breve" no Pages |
| 1.2 | Portar `core.js` do Prumo para `MF` com tokens da identidade e layout base (menu lateral, barra inferior no celular) | 1.1 | Tela vazia do painel abre em 360 px e 1440 px sem rolagem lateral, claro e escuro |
| 1.3 | Núcleo `nucleo.js` com contexto `{tenant, user, papel}` e testes Node | 1.1 | `node ferramentas/testar.js` roda e falha se uma função não receber contexto |
| 1.4 | Adaptador `Plat` com planilha por tenant + versão em memória para demo/testes | 1.3 | Mesmo teste passa no adaptador de memória; injeção de fórmula neutralizada |
| 1.5 | Planilha central, `instalar()` e criação de tenant a partir de modelo | 1.4 | Função cria planilha e pasta do tenant e grava o índice |
| 1.6 | Login, sessão, papéis, permissões, limite de tentativas, MFA do admin | 1.4 | Teste: tenant A não lê nada de B; secretária não recebe tabelas clínicas; 6ª senha errada bloqueia |
| 1.7 | Perfil do médico, especialidades, identidade visual do médico | 1.6 | CRM/UF obrigatório; perfil salva e recarrega |
| 1.8 | Locais, clínicas e vínculos | 1.7 | Vínculo com todas as regras do item 12.2 |
| 1.9 | Serviços | 1.7 | Serviço com duração, modalidade, preço oculto por padrão |
| 1.10 | Painel inicial + Primeiros passos | 1.7–1.9 | Progresso reflete o que foi configurado |
| 1.11 | Admin da plataforma básico (tenants, planos, suspender) | 1.5 | Suspender tenant bloqueia login dele |
| 1.12 | Modo demonstração com dados fictícios | 1.2–1.10 | `?demo=1` abre o painel completo sem servidor |

## Fase 2: agenda e operação

| # | Tarefa | Dep. | Critério de aceite |
|---|---|---|---|
| 2.1 | Motor de horários (base: `grade` da Arcana) para vários locais e modalidades | 1.8, 1.9 | Testes cobrem AG-01, AG-02, AG-07, exceções e feriados |
| 2.2 | Mínimo/máximo e datas provisórias | 2.1 | Testes AG-04, AG-05, AG-06 |
| 2.3 | Reserva temporária e confirmação em 9 passos com trava | 2.1 | Teste de concorrência: 20 reservas simultâneas no último horário, só 1 confirma |
| 2.4 | Tela Agenda (dia/semana/mês, filtros, ações) | 2.3 | Criar, mover, cancelar, marcar falta; ocupação atualiza |
| 2.5 | Portal da clínica (convite, login, agendar, solicitar mudança) | 2.3, 1.6 | Clínica vê só o próprio vínculo; não vê pacientes de outros locais |
| 2.6 | Pacientes: cadastro, funil arrastável, linha do tempo, consentimentos, lembretes | 2.3 | Funil sem dado clínico; duplicado sugerido para mesclar |
| 2.7 | Planos e pacotes (exibição) | 1.9 | Plano com itens aparece na página e no painel |
| 2.8 | Indicadores e financeiro manual | 2.4 | Números batem com os dados fictícios do teste |

## Fase 3: assistente e conteúdo

| # | Tarefa | Dep. | Critério de aceite |
|---|---|---|---|
| 3.1 | Camada `IA.gs` (provedor, modelo, limite, custo, fallback, registro) | 1.6 | Uso registrado por tarefa; limite estourado bloqueia com mensagem clara |
| 3.2 | Entrevista guiada e perfil inteligente | 3.1, 1.7 | Itens sugeridos pela IA nunca aparecem como fato sem confirmação |
| 3.3 | Assistente com ferramentas e "salvar como rascunho" | 3.1 | Cada ferramenta gera conteúdo com estrutura (gancho, texto, CTA, cenas) |
| 3.4 | Verificador de publicidade médica | 3.3 | Lista de frases de teste dispara os alertas esperados |
| 3.5 | Calendário editorial com estados e aprovação | 3.3 | Transições inválidas recusadas; aprovação registra autor |
| 3.6 | Exportar DOCX (peça e mês) | 3.5 | Arquivo abre no Word e no Google Docs com estilos corretos |
| 3.7 | Exportar Canva (PPTX e PDF) com 6 leiautes iniciais | 3.5 | Importado no Canva, textos ficam editáveis e na posição certa |
| 3.8 | Exportar CapCut (porta do `gerar-capcut.mjs` para o navegador + 3 modelos) | 3.5, 3.9 | Pacote aberto no CapCut Desktop da máquina de teste com legendas e títulos editáveis; SRT junto |
| 3.9 | Biblioteca de materiais + extração de áudio no navegador + transcrição | 3.1 | Vídeo de 3 min transcrito com tempos por palavra |
| 3.10 | Derivação de conteúdo a partir da transcrição | 3.9, 3.3 | Sugestões de 5 formatos a partir de um vídeo |

## Fase 4: presença digital e comercial

| # | Tarefa | Dep. | Critério de aceite |
|---|---|---|---|
| 4.1 | Modelo de blocos e renderizador único (editor, prévia e publicação) | 1.7 | Mesmo JSON gera prévia e HTML idênticos |
| 4.2 | Editor visual (editar texto no lugar, arrastar, ocultar, fotos, prévia celular) | 4.1 | Usuário de teste edita e reordena sem instrução |
| 4.3 | Publicação no Pages via API do GitHub + versões | 4.1 | Publicar cria commit; restaurar versão anterior funciona |
| 4.4 | Widget de agendamento público | 2.3, 4.3 | Paciente agenda pelo celular em menos de 1 minuto |
| 4.5 | Landing por serviço gerada pela IA | 3.3, 4.2 | Rascunho editável, publica só após checklist |
| 4.6 | SEO básico e dados estruturados | 4.3 | Validador de dados estruturados sem erros |
| 4.7 | Página de vendas do Fluyan (skill design-taste-frontend) | identidade | Página não revela infraestrutura; nota de desempenho mobile alta |
| 4.8 | Assinatura Mercado Pago + ativação por webhook | 1.5, 4.7 | Pagamento de teste cria tenant e envia acesso |
| 4.9 | Revisão de segurança (Hacker da Squad) e correções | tudo | Checklist do SECURITY_PRIVACY.md todo verificado |
| 4.10 | Guia de instalação e operação (`docs/GUIA.md`) | tudo | Pessoa sem conhecimento técnico instala seguindo o guia |
