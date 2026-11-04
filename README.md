# Fluyan

Plataforma SaaS para médicos: presença digital, assistente de IA, agenda central com clínicas parceiras, CRM administrativo de pacientes, serviços e planos. Nome: Fluyan (de fluir).

**Status:** versão 0.3 em 03/11/2026. Funcionando em modo demonstração: agenda central com clínicas parceiras, portal da clínica, pacientes, serviços e planos, Estúdio com Claude (peças e vídeos com arquivo final e editável: PNG, PPTX para o Canva, projeto do CapCut, DOCX, SRT), página do médico editável com agendamento, financeiro, equipe e painel do administrador. Servidor no Apps Script pronto para instalar (`docs/GUIA.md`).

- Página de vendas: `site/index.html`
- Painel: `site/app/` (demonstração: `site/app/?demo=1`)
- Página pública do médico: `site/m/?m=helena-duarte&demo=1`

## Onde está cada coisa

| Arquivo | Conteúdo |
|---|---|
| `docs/Fluyan_Documento_Mestre.md` | Documento original do fundador (cópia) |
| `PRODUCT_SPEC.md` | A. Requisitos funcionais e não funcionais. F. Telas e fluxos |
| `PERGUNTAS.md` | B. Dúvidas e decisões pendentes, por área |
| `ROADMAP.md` | C. Escopo do piloto comercial e fases |
| `ARCHITECTURE.md` | D. Arquitetura do MVP, da produção e a migração. Mapa de reaproveitamento dos nossos projetos |
| `DATA_MODEL.md` | E. Modelo de dados, chaves e isolamento por tenant |
| `BACKLOG.md` | G. Backlog priorizado com dependências e critérios de aceite |
| `BUSINESS_RULES.md` | Regras de negócio consolidadas |
| `SECURITY_PRIVACY.md` | Segurança, LGPD e publicidade médica |
| `ESTUDIO.md` | Estúdio: Claude integrado gera peças e vídeos finais e editáveis (Canva, CapCut) |
| `INTEGRATIONS.md` | CapCut, Canva, páginas editáveis, DOCX, IA, WhatsApp, Mercado Pago |
| `DECISIONS.md` | Decisões arquiteturais com justificativa |
| `CHANGELOG.md` | Histórico de alterações |
| `identidade/` | Proposta de identidade visual (abrir `identidade/index.html` pelo servidor local) |

## Ver a identidade visual

Servidor local `fluyan` em `.claude/launch.json` (porta 8781). Página: `http://localhost:8781/identidade/`.
