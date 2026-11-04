# Fluyan: roadmap e escopo do piloto

Versão 0.1 · 03/11/2026

## C. Escopo mínimo do primeiro piloto comercial

O piloto prova as três hipóteses do documento mestre: (1) agenda, serviços e clínicas num só lugar; (2) a IA economiza tempo no marketing; (3) agendar fica mais simples para paciente e equipe.

**Entra no piloto**
- Página de vendas + assinatura Mercado Pago + criação automática do tenant
- Login, papéis (titular, secretária, clínica, admin), permissões, MFA do admin
- Perfil do médico, especialidades, perfil inteligente, entrevista pela IA
- Locais, clínicas parceiras, vínculos com regras, mínimo e máximo
- Agenda central com prevenção de conflito e reserva temporária
- Portal da clínica parceira
- Página do médico com editor de blocos + landing por serviço + agendamento público
- CRM administrativo de pacientes com funil e linha do tempo
- Serviços e planos (planos só para exibição)
- Assistente de IA com ferramentas de conteúdo e verificador de publicidade médica
- Calendário editorial com aprovação
- Exportação DOCX, Canva (PPTX/PDF) e CapCut (pacote de rascunho + SRT)
- Biblioteca de materiais com transcrição de áudio e vídeo curtos
- Indicadores e financeiro manual
- Admin da plataforma: tenants, planos, uso de IA, biblioteca central, auditoria
- Modo demonstração completo com dados fictícios

**Fica fora do piloto**: chatbot, WhatsApp por API, cobrança de pacientes, contratação de planos com créditos, formulários com dados reais, prontuário, teleatendimento, publicação automática em redes, domínio próprio, Google Agenda.

## Fases

| Fase | Entrega | Critério de saída | Estimativa de sessões |
|---|---|---|---|
| 0 | Esta especificação + identidade | Você aprova escopo, respostas [bloqueia] e identidade | 1 |
| 1 Fundação | Repositórios, núcleo, adaptador, login, tenants, perfil, especialidades, locais, vínculos, serviços, painel inicial, admin básico, modo demo | Médico configura perfil, locais e serviços no demo e na planilha real | 2 a 3 |
| 2 Agenda | Regras, exceções, agenda central, mínimo/máximo, conflito com trava, portal da clínica, pacientes e funil, planos demonstrativos | Fluxo completo com dados fictícios e teste de concorrência simulada passando | 2 a 3 |
| 3 Assistente e conteúdo | Estúdio com Claude (ESTUDIO.md), camada de IA, entrevista, perfil inteligente, ferramentas, verificador CFM, calendário, aprovação, uso de IA, biblioteca + transcrição, **DOCX, Canva, CapCut** | Um vídeo de entrada gera rascunhos revisáveis e exportáveis nos três formatos | 3 |
| 4 Presença digital | Editor de páginas, blocos, landing por serviço, publicação no Pages, SEO, agendamento público | Médico publica página ligada à agenda e edita sem ajuda | 2 |
| 4b Comercial | Página de vendas, assinatura, ativação por webhook, segurança (Fase 4 da Squad), guia de instalação | Assinatura de teste cria tenant sozinha; checklist de segurança limpo | 1 a 2 |
| 5 Atendimento | Chat do site, base de respostas, handoff, WhatsApp oficial | Bot executa tarefas administrativas sem passar dos limites | futura |
| 6 Clínico | Formulários reais, prontuário, teleatendimento em infraestrutura própria | Validação técnica, jurídica e de segurança | futura |
| 7 Escala | Migração para banco de produção, billing de consumo, multi-profissional | Migração de um tenant de teste com reversão | futura |
