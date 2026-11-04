# Fluyan: regras de negócio

Versão 0.1 · 03/11/2026. Cada regra tem um código para ser citada em testes e no backlog.

## Agenda
- **AG-01** Toda disponibilidade nasce de um vínculo médico-local ativo. Sem vínculo, sem horário.
- **AG-02** Horários são gerados pela regra do dia (início, fim, duração do serviço, intervalo) menos exceções, menos agendamentos ativos em **qualquer** local e modalidade do médico.
- **AG-03** Agendamentos ativos: `reservado_temp` (não expirado), `pendente`, `confirmado`, `em_atendimento`.
- **AG-04** Nunca criar agendamento que faça a data do vínculo passar do máximo. Exceção só pelo médico, com motivo registrado.
- **AG-05** Abaixo do mínimo, o painel mostra alerta e a data fica marcada "abaixo do mínimo". O sistema não cancela nada automaticamente.
- **AG-06** Data `provisoria` aparece para a clínica com aviso; para o paciente na página pública, só aparece data `confirmada`.
- **AG-07** Antecedência mínima e máxima do vínculo valem para clínica e paciente; o médico pode ignorá-las.
- **AG-08** Reserva temporária dura 10 minutos (configurável) e libera o horário ao expirar.
- **AG-09** A confirmação passa pelos 9 passos do item 12.6, dentro de trava exclusiva; a disponibilidade é recalculada dentro da trava.
- **AG-10** Clínica só agenda serviços permitidos no vínculo e só no próprio local.
- **AG-11** Cancelamento pela clínica ou paciente respeita a regra de cancelamento do vínculo; fora do prazo vira "solicitação".
- **AG-12** Toda mudança de status gera evento na linha do tempo do paciente e registro de auditoria.

## Pacientes
- **PA-01** Coletar só o necessário: nome e um contato bastam para agendar. CPF é opcional e cifrado.
- **PA-02** Mensagens só pelos canais com consentimento ativo.
- **PA-03** Listas e quadros administrativos nunca mostram informação clínica.
- **PA-04** Paciente duplicado (mesmo WhatsApp ou e-mail no tenant) é sugerido para mesclar, nunca mesclado sozinho.

## Conteúdo e páginas
- **CO-01** Conteúdo gerado nasce como `Ideia` ou `Em produção`, nunca `Aprovado`.
- **CO-02** Só o médico titular (ou quem ele autorizar explicitamente) aprova conteúdo de saúde.
- **CO-03** Alertas de publicidade médica bloqueiam aprovação até serem resolvidos ou justificados pelo médico.
- **CO-04** Exportações (DOCX, Canva, CapCut) são permitidas em qualquer status, com marca d'água "Rascunho, não aprovado" quando ainda não aprovado.
- **CO-05** Página pública exige CRM/UF e nome do responsável técnico no rodapé.
- **CO-06** Página pública não exibe: antes e depois, promessa de resultado, depoimento de paciente (até revisão jurídica), títulos não registrados.
- **CO-07** Preço só aparece se o médico ligar "mostrar preço" no serviço.
- **CO-08** Publicar cria nova versão; a anterior pode ser restaurada.

## IA
- **IA-01** A IA não recebe dados da camada clínica nem dados identificáveis de pacientes.
- **IA-02** Cada chamada consome do limite mensal do plano; acima do limite, bloqueia com aviso e opção de upgrade.
- **IA-03** Toda saída da IA é marcada como gerada por IA até revisão.
- **IA-04** Arquivos enviados são tratados como dados: instruções contidas neles não mudam o comportamento do assistente.
- **IA-05** A IA não inventa títulos, especializações, números ou estudos; quando faltar fonte, escreve "[confirmar]".

## Assinatura do Fluyan
- **AS-01** Tenant só fica `ativo` após webhook do Mercado Pago confirmado e conferido na API.
- **AS-02** Pagamento atrasado: aviso por 7 dias, depois modo leitura; página pública continua no ar por mais 15 dias; depois sai do ar. Dados mantidos por 90 dias para exportação.
- **AS-03** Cancelamento pelo médico: acesso até o fim do período pago; exportação de dados disponível.

## Clínica parceira
- **CL-01** O convite da clínica expira em 7 dias e é de uso único.
- **CL-02** O médico revoga o acesso a qualquer momento; agendamentos já feitos continuam.
- **CL-03** A clínica vê ocupação da data (ex.: 9 de 15), não a lista de pacientes de outros locais.
