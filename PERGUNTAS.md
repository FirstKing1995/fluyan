# Fluyan: dúvidas e decisões pendentes

> **Respondidas em 03/11/2026:** 1 = os dois (médico individual e clínica); 6 = R$ 497 / 997 / 1.997, sem teste grátis; 11 = novo nome Fluyan; 14 = repositório público durante o desenvolvimento, versão segura antes de vender; Canva e CapCut viram o Estúdio com Claude. As demais seguem com a suposição padrão.

Versão 0.1 · 03/11/2026. Marcadas com **[bloqueia]** as que mudam a arquitetura ou o piloto e precisam de resposta antes da fase 1. As demais têm uma suposição padrão (entre parênteses) que vale até você dizer o contrário.

## Produto
1. **[bloqueia]** Cliente do piloto: médico individual, clínica com vários médicos, ou ambos? (Suposição: médico individual; clínica entra como parceira, não como assinante.)
2. Público inicial só médicos ou já nutricionistas e psicólogos? (Só médicos; arquitetura pronta para outras profissões.)
3. Quais especialidades no piloto? Ajuda a montar modelos de conteúdo e de página. (Clínica médica, pediatria, ginecologia, cardiologia, dermatologia.)
4. O paciente terá login no piloto? (Não; agenda por link e recebe confirmação.)
5. Formulário pré-consulta entra no piloto como demonstração com dados fictícios ou fica para depois? (Fica para depois.)

## Negócio
6. **[bloqueia]** Preços: manter as hipóteses R$ 497 / 997 / 1.997 / 2.997? Haverá período de teste grátis? (Manter; 14 dias de teste.)
7. Implantação cobrada à parte? (Sim no Enterprise; grátis nos demais durante o piloto.)
8. Quantos médicos no piloto e você já tem nomes? (5 a 10.)
9. Limites de IA por plano (tokens e minutos de transcrição). (Definir depois de medir o custo real do piloto.)
10. A empresa dona do Fluyan já existe (CNPJ) para Mercado Pago, termos e contrato de operador? 

## Marca e UX/UI
11. **[bloqueia]** Nome: "Fluyan" já é usado por outros produtos de saúde no Brasil e fora. Pesquisar marca no INPI e domínio antes de investir na marca. Quer que eu levante alternativas? (Seguir com Fluyan como provisório; símbolo independe do nome.)
12. A direção visual (petróleo, sálvia, champanhe, Fraunces + Plus Jakarta Sans) está aprovada? Ver `identidade/index.html`.
13. A cor de destaque de cada médico pode mudar só as páginas públicas, ou também o painel? (Só páginas e peças.)

## Arquitetura
14. **[bloqueia]** GitHub Pages gratuito exige repositório público. Proposta: código do servidor e docs em repositório **privado** `fluyan`, só o site em repositório **público** `fluyan-site`. Aprova?
15. Conta Google dona da planilha central e do Apps Script: a sua pessoal ou uma conta nova da empresa? (Conta nova da empresa, para separar e facilitar transferência.)
16. CLAUDE.md cita Firebase; o documento mestre e os projetos recentes usam Planilha + Apps Script. (Seguir Planilha + Apps Script com adaptador para migrar; ver DECISIONS.md D-02.)

## Segurança e LGPD
17. Há assessoria jurídica para DPA, termos, privacidade e publicidade médica? Sem isso, o piloto roda só com médicos amigos e dados fictícios de pacientes.
18. Aceita que, no piloto, nenhum dado de paciente vá para provedores de IA? (Sim.)

## Integrações
19. Qual versão do CapCut Desktop os médicos usam? A exportação depende do formato de rascunho legível; preciso testar na versão atual.
20. Os médicos têm Canva grátis, Pro ou Enterprise? Muda o nível da integração (arquivo importável no piloto; importação direta depois).
21. Provedor de IA: começar por Groq (gratuito com limites) com Claude como alternativa? Precisa da chave de cada um.
22. WhatsApp no piloto só por link `wa.me`? (Sim.)

## Regulamentação profissional
23. Depoimentos de pacientes nas páginas: deixar fora até parecer jurídico? (Sim.)
24. Exibir preço de consulta na página pública é permitido pela norma vigente? (Desligado por padrão; médico liga por conta própria, com aviso.)
