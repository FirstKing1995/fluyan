# Fluyan: alterações

## 0.4.0 · 10/11/2026
- Navegação por áreas: depois de entrar, a tela inicial mostra quatro áreas (Atender, Divulgar, Organizar, Resultados). Cada área abre só as telas dela, em abas, com um caminho de volta ao Início. O menu lateral e a barra do celular mostram as áreas, não todas as telas.
- Tela inicial guiada: resumo de cada área, "Precisa da sua atenção" com as pendências e um botão para resolver cada uma, atendimentos de hoje e os primeiros passos com "Comece aqui".
- Clínica parceira e administrador, que têm poucas telas, continuam com menu direto.
- Perguntas de motivo e justificativa em janelas do próprio sistema, no lugar das caixas do navegador.
- Ocupação dos próximos dias passou para Resultados. "Sair da conta" também na tela de conta.
- Link direto da demonstração: `app/?demo=1&entrar=0` (0 médica, 1 secretária, 2 clínica, 3 administrador).
- A demonstração grava a sessão ao sair da página.

## 0.3.0 · 03/11/2026
- Núcleo de regras único (navegador, Apps Script e Node) com 18 testes: agenda multi-local, mínimo e máximo, reserva temporária, concorrência, clínica parceira, secretária, isolamento entre clientes, publicidade médica, Estúdio.
- Servidor Apps Script: planilha central + uma planilha por cliente, trava de concorrência, proteção contra injeção de fórmula, Estúdio com Claude (saída estruturada, fallback do servidor), assinatura Mercado Pago com ativação por webhook. 8 testes com planilhas simuladas.
- Painel completo em modo demonstração, portal da clínica, administrador da plataforma.
- Estúdio: prévias das lâminas, imagens finais, PPTX editável no Canva, DOCX, SRT e projeto do CapCut gerado no navegador a partir de um modelo real (CapCut 9.x).
- Página pública do médico com blocos editáveis e agendamento em etapas.
- Página de vendas feita com a skill design-taste-frontend (direção "o produto se mostra").

## 0.2.0 · 03/11/2026
- Nome definitivo: Fluyan (o fundador recusou MedFlow e Jalecia). Pasta `apps meus/fluyan`.
- Respostas do fundador: médico individual e clínica; preços mantidos sem teste grátis; repositório público no desenvolvimento.
- Estúdio com Claude integrado (ESTUDIO.md): Canva e CapCut como ferramentas, entrega de final e editável.

## 0.1.0 · 03/11/2026
- Fase 0 iniciada: especificação completa (requisitos, perguntas, escopo do piloto, arquitetura, modelo de dados, telas, backlog, regras, segurança, integrações, decisões).
- Pedidos do fundador incorporados: exportação para CapCut, para Canva, páginas editáveis e copys em DOCX.
- Proposta de identidade visual em `identidade/` (tokens CSS e prancha com painel e página pública).
- Servidor local `fluyan` (porta 8781) adicionado ao `.claude/launch.json`.
