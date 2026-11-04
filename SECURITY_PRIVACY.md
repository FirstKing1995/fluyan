# Fluyan: segurança e privacidade

Versão 0.1 · 03/11/2026. Revisão do "Hacker de Segurança" da Squad aplicada ao desenho, antes do código.

## 1. Ambientes de dados separados

| Ambiente | Conteúdo | No MVP |
|---|---|---|
| Marketing | perfil, materiais públicos, conteúdo, páginas | planilha do tenant + Drive |
| Administrativo | agenda, pacientes (cadastro mínimo), serviços, financeiro manual | planilha do tenant |
| Clínico | anamnese, prontuário, exames, evoluções | **desligado**; só dados fictícios em demonstração |

Nada passa automaticamente de um ambiente para outro.

## 2. Checklist adaptado do OWASP Top 10

| Risco | Controle no MVP |
|---|---|
| Controle de acesso quebrado | Tenant vem só da sessão; checagem de papel e permissão em toda ação no servidor; testes automáticos de "tenant A tenta ler B" |
| Falhas de criptografia | HTTPS sempre (Pages e Apps Script); senha com hash + salt (PBKDF2/SHA-256 iterado); CPF e segredo MFA cifrados; token de sessão guardado como hash |
| Injeção | Planilha não executa SQL, mas fórmula sim: todo texto que começa com `= + - @` é prefixado com apóstrofo antes de gravar (injeção de fórmula). Escape de HTML em toda renderização |
| Desenho inseguro | Reserva com trava; webhooks conferidos na API do provedor; nada de confiar no retorno do navegador |
| Configuração errada | Segredos só nas Propriedades do Script; planilhas nunca compartilhadas publicamente; `.gitignore` para pastas privadas |
| Componentes vulneráveis | Poucas bibliotecas, versões fixas, de CDN confiável com SRI quando disponível |
| Autenticação | Limite de tentativas por e-mail e por IP aproximado; MFA para admin; sessão com expiração; troca de senha derruba sessões |
| Integridade | Páginas publicadas geradas no servidor a partir de blocos sanitizados; versões guardadas |
| Logs e monitoramento | Auditoria de ações sensíveis; logs sem dados de pacientes; alerta de picos de uso de IA |
| SSRF | O servidor só chama URLs de uma lista fixa (IA, Mercado Pago, GitHub) |

Riscos específicos:
- **XSS no editor de páginas**: o editor aceita só um conjunto mínimo de marcações; o servidor sanitiza de novo antes de publicar. URLs só `https:` e `mailto:`/`tel:`.
- **Prompt injection** em arquivos e mensagens: conteúdo do usuário vai em campo separado do prompt de sistema; o assistente não tem ferramentas que escrevem na agenda ou publicam sem confirmação humana.
- **Links de clínica**: convite de uso único com expiração, depois login com senha. Nada de link permanente "quem tem o link entra".
- **Enumeração de páginas**: slugs públicos são esperados; dados privados nunca ficam em `site/`.
- **Abuso de agendamento público**: limite por WhatsApp/IP aproximado, reserva temporária curta, desafio simples contra robôs sem CAPTCHA de terceiros.

## 3. LGPD (pontos que dependem de assessoria jurídica)

- Médico (ou clínica) é o **controlador** dos dados dos pacientes; a empresa do Fluyan é **operadora**. A empresa é controladora dos dados dos próprios clientes (médicos). Validar com advogado.
- Bases legais por finalidade: execução de contrato (agendamento), consentimento (marketing e lembretes não essenciais), tutela da saúde (fase clínica).
- Contrato de operador (DPA) com cada médico; lista de suboperadores (Google, Groq e outros provedores de IA, GitHub, Mercado Pago).
- **Transferência internacional**: Google, Groq e GitHub processam dados fora do Brasil. No piloto, nenhum dado de paciente vai para a IA; dados administrativos ficam no Google. Documentar.
- Retenção: definir prazos por tabela; exportação e exclusão a pedido do titular respeitando obrigações legais.
- Página de privacidade e termos antes do primeiro cliente real.

## 4. Publicidade médica (CFM)

- Verificador de conteúdo com regras configuráveis pelo admin, baseadas na Resolução CFM nº 2.336/2023 e manual vigente **[validar texto atual com assessoria]**.
- Regras iniciais: exigir nome, CRM/UF e RQE quando citar especialidade; proibir promessa de resultado, sensacionalismo, autopromoção indevida, antes e depois sem as condições da norma, preço como apelo principal, divulgação de títulos não reconhecidos.
- Alerta não é bloqueio jurídico: a decisão final é do médico, com registro.

## 5. Telemedicina

Fora do piloto. Quando entrar: Resolução CFM nº 2.314/2022 e normas posteriores, sem gravação por padrão, consentimento registrado.
