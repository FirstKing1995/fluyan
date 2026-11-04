# Fluyan: especificação do produto

Versão 0.1 · 03/11/2026 · base: documento mestre v1.0 + pedidos do fundador nesta sessão (CapCut, Canva, páginas editáveis, copys em DOC).

Legenda de prioridade: **P** = piloto comercial · **F** = fase futura · **C** = só com infraestrutura clínica (fase 6).

---

## Parte A. Requisitos funcionais

### RF-01 Contas, tenants e permissões
| ID | Requisito | Prio |
|---|---|---|
| RF-01.1 | Médico cria conta com e-mail e senha; confirma o e-mail por código | P |
| RF-01.2 | Cada conta pertence a um tenant (organização). O tenant nasce na contratação | P |
| RF-01.3 | Papéis: admin da plataforma, médico titular, secretária, clínica parceira, paciente (sem login no piloto), colaborador | P (exceto colaborador: F) |
| RF-01.4 | Permissões granulares por papel, editáveis pelo titular (modelo do Prumo CRM) | P |
| RF-01.5 | Secretária não vê anamnese, prontuário ou exames, nem com permissão marcada por engano | P |
| RF-01.6 | MFA (código por e-mail ou app autenticador) para admin da plataforma | P |
| RF-01.7 | Sessão expira por inatividade; troca de senha invalida sessões | P |

### RF-02 Perfil do profissional
| ID | Requisito | Prio |
|---|---|---|
| RF-02.1 | Cadastro com os campos do item 6.1 do documento mestre; campos obrigatórios variam por profissão | P |
| RF-02.2 | Registro profissional (CRM/UF) obrigatório antes de publicar qualquer página | P |
| RF-02.3 | Entrevista guiada pela IA após o cadastro (texto; áudio no piloto se o custo de transcrição couber) | P |
| RF-02.4 | Perfil inteligente separa: fato confirmado, preferência, sugestão da IA, pendente de validação | P |
| RF-02.5 | Nada marcado como "sugestão" ou "pendente" aparece em página pública | P |
| RF-02.6 | Identidade visual do médico: logo, foto, cor de destaque (aplicada em páginas e peças) | P |

### RF-03 Assistente de IA
| ID | Requisito | Prio |
|---|---|---|
| RF-03.1 | Chat com o assistente usando as camadas A, B e C de contexto. Camada D bloqueada | P |
| RF-03.2 | Ferramentas: ideias, post, carrossel, legenda, roteiro de vídeo, stories, artigo, LP de serviço | P |
| RF-03.3 | Todo resultado vira um rascunho de conteúdo com status, não texto solto | P |
| RF-03.4 | Camada de provedor substituível (provedor, modelo, chave, limite, custo, fallback) | P |
| RF-03.5 | Registro de consumo por tarefa e por tenant; bloqueio ao atingir o limite do plano | P |
| RF-03.6 | Verificador de publicidade médica roda em todo rascunho (promessa de resultado, antes/depois, superlativos, preço em destaque, título não comprovado) e mostra alertas | P |
| RF-03.7 | Transcrição de áudio e vídeo enviados | P (curtos) / F (longos) |
| RF-03.8 | Consulta à agenda pelo assistente, só leitura, respeitando permissões | F |

### RF-04 Conteúdo e calendário editorial
| ID | Requisito | Prio |
|---|---|---|
| RF-04.1 | Biblioteca de materiais com metadados (dono, tipo, origem, finalidade, permissão de uso) | P |
| RF-04.2 | Calendário editorial com os estados `Ideia → Em produção → Revisão → Aprovado → Agendado → Publicado` e `Reprovado`, `Arquivado`, `Falha na publicação` | P |
| RF-04.3 | Aprovação humana obrigatória antes de `Aprovado`; registra quem aprovou e quando | P |
| RF-04.4 | **Exportar copy em DOCX** (peça única ou lote do mês), com marca do médico e aviso de revisão | P |
| RF-04.5 | **Exportar para o Canva**: peça visual gerada como PPTX/PDF de texto editável, com botão que importa direto na conta Canva do médico quando a integração estiver conectada | P (arquivo) / F (importação direta) |
| RF-04.6 | **Exportar para o CapCut**: roteiro de vídeo vira um projeto de rascunho do CapCut (faixas de legenda, títulos, marcações de corte e mídia), baixado em .zip para abrir no CapCut Desktop | P (versão 1) |
| RF-04.7 | Derivação: um vídeo/áudio enviado gera sugestões de cortes, carrossel, legenda, stories e artigo | P |
| RF-04.8 | Publicação automática em redes sociais | F |

### RF-05 Páginas editáveis (site e landing pages)
| ID | Requisito | Prio |
|---|---|---|
| RF-05.1 | Página do médico montada por blocos: capa, sobre, serviços, planos, locais, agenda, FAQ, contato, texto livre, galeria do consultório | P |
| RF-05.2 | Editor visual: arrastar para reordenar, clicar no texto para editar, trocar foto, ocultar bloco, pré-visualizar celular e computador | P |
| RF-05.3 | Landing page por serviço gerada pela IA como rascunho, editável no mesmo editor | P |
| RF-05.4 | Publicar exige revisão (checklist de publicidade médica + CRM preenchido) | P |
| RF-05.5 | Versões: cada publicação guarda a anterior e permite voltar | P |
| RF-05.6 | Endereço `fluyan.../m/nome-do-medico` no piloto; domínio próprio | P / F |
| RF-05.7 | SEO básico: título, descrição, imagem de compartilhamento, dados estruturados de médico | P |
| RF-05.8 | Botão de agendamento ligado à agenda central | P |

### RF-06 Clínicas, vínculos e agenda central
| ID | Requisito | Prio |
|---|---|---|
| RF-06.1 | Cadastro de clínicas e consultório próprio como "local" | P |
| RF-06.2 | Vínculo médico-clínica como entidade própria com todas as regras do item 12.2 | P |
| RF-06.3 | Regras de disponibilidade por vínculo (dia, janela, duração, intervalo) e exceções (bloqueio, feriado, férias) | P |
| RF-06.4 | Mínimo e máximo de consultas por data e vínculo; nunca passa do máximo; alerta abaixo do mínimo | P |
| RF-06.5 | Data provisória ou confirmada, definida pelo médico | P |
| RF-06.6 | Link da clínica com login próprio da clínica; vê só horários do vínculo | P |
| RF-06.7 | Agenda central única para painel, link da clínica, página pública, secretária e chatbot | P |
| RF-06.8 | Validação em 9 passos do item 12.6 com trava de concorrência e reserva temporária com expiração | P |
| RF-06.9 | Estados do agendamento do item 12.7 | P |
| RF-06.10 | Sincronização com Google Agenda (só leitura de ocupação, depois escrita) | F |

### RF-07 Pacientes (CRM administrativo)
| ID | Requisito | Prio |
|---|---|---|
| RF-07.1 | Cadastro administrativo mínimo (item 10.1) | P |
| RF-07.2 | Funil administrativo de 8 estados, em quadro arrastável | P |
| RF-07.3 | Linha do tempo só com eventos administrativos | P |
| RF-07.4 | Lembretes de retorno, agendamento, renovação de plano | P |
| RF-07.5 | Consentimento de comunicação registrado por canal | P |
| RF-07.6 | Exportar dados de um paciente (direito do titular) | P |

### RF-08 Serviços, planos e contratações
| ID | Requisito | Prio |
|---|---|---|
| RF-08.1 | Serviços com campos do item 13.1 | P |
| RF-08.2 | Planos/pacotes com campos do item 13.2 | P (demonstrativo) |
| RF-08.3 | Contratação com saldo de créditos e consumo por agendamento | F |
| RF-08.4 | Cobrança do paciente pelo Mercado Pago do médico, confirmada só por webhook | F |

### RF-09 Atendimento automatizado
| ID | Requisito | Prio |
|---|---|---|
| RF-09.1 | Chat na página pública com respostas da base aprovada, consulta de horários e agendamento | F (fase 5) |
| RF-09.2 | Botão de WhatsApp com mensagem pronta (wa.me) | P |
| RF-09.3 | WhatsApp por API oficial | F |
| RF-09.4 | Mensagem de segurança e encaminhamento humano diante de sinais de urgência | F (obrigatório quando o chat existir) |

### RF-10 Formulários, anamnese, prontuário, teleatendimento
| ID | Requisito | Prio |
|---|---|---|
| RF-10.1 | Construtor de formulários com templates por especialidade, testado só com dados fictícios | F (fase 3/4, demonstração) |
| RF-10.2 | Envio por link individual com validade | C |
| RF-10.3 | Prontuário, evoluções, documentos clínicos | C |
| RF-10.4 | Teleatendimento com link Jitsi ou Meet associado ao agendamento | F |

### RF-11 Financeiro e relatórios
| ID | Requisito | Prio |
|---|---|---|
| RF-11.1 | Indicadores: consultas por período, novos pacientes, comparecimento, cancelamentos, ocupação por clínica | P |
| RF-11.2 | Financeiro: recebido, pendente, por clínica, por serviço (lançamento manual no piloto) | P |
| RF-11.3 | Repasses, comissões, taxas de gateway | F |

### RF-12 Painel da plataforma (admin SaaS)
| ID | Requisito | Prio |
|---|---|---|
| RF-12.1 | Criar, suspender e reativar tenants | P |
| RF-12.2 | Assinatura do tenant pelo Mercado Pago (campos prontos, chaves preenchidas pelo dono) | P |
| RF-12.3 | Limites de uso por plano e consumo por tenant (IA, armazenamento, exportações) | P |
| RF-12.4 | Biblioteca central: copies, ganchos, modelos de página, modelos de peça Canva, modelos de vídeo CapCut | P |
| RF-12.5 | Gestão de provedores de IA e chaves (guardadas no servidor) | P |
| RF-12.6 | Logs operacionais e auditoria | P |
| RF-12.7 | Acesso a dados de um tenant só com justificativa registrada | P |

---

## Parte A. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Mobile-first; toda tela funciona em 360 px de largura |
| RNF-02 | Identidade da pasta `identidade/` (tokens CSS), ícones Lucide, sem emojis |
| RNF-03 | Acessibilidade: contraste AA, foco visível, navegação por teclado, rótulos em campos |
| RNF-04 | Primeira tela útil em até 2,5 s numa conexão 4G (front estático, cache no navegador) |
| RNF-05 | Datas em `dd/mm/aaaa`, fuso America/Fortaleza por padrão e configurável por tenant, moeda BRL, telefone com DDD |
| RNF-06 | Isolamento por tenant em toda leitura e escrita, verificado no servidor |
| RNF-07 | Nenhum segredo no front ou no repositório |
| RNF-08 | Auditoria de alterações importantes (autor, data, contexto) |
| RNF-09 | Exportação completa dos dados do tenant em JSON/planilha |
| RNF-10 | Camada de dados substituível: as regras de negócio não sabem que existe planilha |
| RNF-11 | Regras de negócio testadas por script Node antes de cada publicação |
| RNF-12 | Modo demonstração sem servidor, com dados fictícios, para vendas e testes |
| RNF-13 | Funciona instalado como app (PWA) |
| RNF-14 | Custo de infraestrutura zero no piloto; consumo variável (IA) medido por tenant |

---

## Parte F. Telas e fluxos do MVP

### Mapa de telas

**Públicas (sem login)**
1. **Página de vendas do Fluyan** (cadastro = página de vendas): proposta, módulos, planos, perguntas, botão de assinar.
2. **Assinar**: escolha do plano, dados do médico, pagamento Mercado Pago, criação do tenant.
3. **Entrar / recuperar senha.**
4. **Página do médico** `m/<slug>`: blocos publicados + agendamento.
5. **Landing de serviço** `m/<slug>/<servico>`.
6. **Agendar** (passo a passo do paciente): serviço → local/modalidade → dia → horário → dados → confirmação.

**Painel do médico** (menu lateral no computador, barra inferior no celular)
7. **Início**: atendimentos do dia, ocupação por clínica com mínimo/máximo, pendências, conteúdos para revisar, consumo de IA.
8. **Primeiros passos**: lista de configuração com progresso (perfil, serviços, locais, agenda, página). Some quando tudo estiver pronto.
9. **Agenda**: dia, semana e mês; filtro por local; criar, mover, cancelar, marcar falta; datas provisórias destacadas.
10. **Clínicas e locais**: lista, vínculo, regras, mínimo/máximo, gerar e revogar link da clínica.
11. **Serviços e planos.**
12. **Pacientes**: lista com busca, quadro do funil, ficha administrativa com linha do tempo.
13. **Assistente**: chat com atalhos de ferramentas; cada resposta tem "salvar como rascunho".
14. **Conteúdo**: calendário editorial (mês e lista), ficha da peça com texto, alertas de publicidade médica, aprovação e exportações DOCX, Canva e CapCut.
15. **Biblioteca de materiais**: envio de arquivos, transcrições, sugestões de derivados.
16. **Minhas páginas**: lista de páginas, editor de blocos, histórico de versões, publicar.
17. **Relatórios e financeiro.**
18. **Equipe e permissões.**
19. **Perfil e identidade visual.**
20. **Minha assinatura**: plano, consumo, faturas.

**Portal da clínica parceira**
21. **Entrar.**
22. **Agenda do médico**: dias publicados, ocupação, horários livres.
23. **Novo agendamento**: serviço autorizado → horário → localizar ou cadastrar paciente → confirmar.
24. **Agendamentos da clínica**: lista com status, pedir alteração ou cancelamento.

**Admin da plataforma**
25. **Visão geral**: tenants ativos, receita, consumo, alertas.
26. **Tenants**: ficha, plano, limites, suspender, histórico de suporte.
27. **Biblioteca central**: copies, ganchos, modelos de página, modelos Canva e CapCut, versões.
28. **Integrações e provedores de IA.**
29. **Auditoria e logs.**

### Fluxos principais

**F1. Onboarding do médico (piloto)**
Página de vendas → Assinar (Mercado Pago) → webhook confirma → tenant criado → e-mail com acesso → Primeiros passos: perfil + CRM → entrevista com o assistente → serviços → locais e vínculos → regras de agenda → página gerada como rascunho → revisão → publicar.

**F2. Clínica agenda paciente**
Médico cria vínculo (quinta, 08h–17h, mín. 8, máx. 15, serviços A e B) → gera convite da clínica → clínica cria senha → vê só quintas publicadas → escolhe serviço e horário → informa paciente → servidor valida os 9 passos com trava → agendamento confirmado ou pendente (conforme regra do vínculo) → aparece na agenda central e no painel de ocupação.

**F3. Paciente agenda pela página**
Página do médico → Agendar → serviço → local → dia → horário (reserva temporária de 10 min) → nome, WhatsApp, e-mail, consentimento → confirmação → mensagem pronta para WhatsApp e e-mail de confirmação.

**F4. Vídeo vira conteúdo**
Biblioteca → enviar vídeo (limite por plano) → transcrição → temas → sugestões de derivados → médico escolhe "Carrossel" e "Corte de 30 s" → rascunhos no calendário → alertas de publicidade → aprovação → exportar carrossel para Canva e corte para CapCut → copy em DOCX para a equipe.

**F5. Editar e publicar página**
Minhas páginas → abrir → clicar no texto da capa e editar → arrastar bloco "Planos" para cima → trocar foto → pré-visualizar no celular → Publicar → checklist (CRM, sem promessa, sem antes/depois) → versão nova publicada; a anterior fica no histórico.
