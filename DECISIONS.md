# Fluyan: registro de decisões

Formato: contexto, decisão, alternativas, consequências. Status: as decisões propostas foram aprovadas pelo fundador em 03/11/2026, salvo as alteradas abaixo.

## D-01 Publicação só no GitHub Pages — Aceita
O CLAUDE.md cita Netlify, mas os créditos do Netlify bloqueiam sites depois de um tempo (aviso de out/2026). Front estático no GitHub Pages; servidor no Apps Script.

## D-02 Planilha + Apps Script no MVP, com adaptador — Proposta
**Contexto:** o CLAUDE.md da Squad sugere Firebase; o documento mestre e os projetos recentes (Prumo, BRASA, Arcana) usam Planilha + Apps Script.
**Decisão:** Planilha + Apps Script, com núcleo em JS puro e adaptador de dados.
**Por quê:** reaproveita código testado, custo zero, o fundador já opera esse modelo, e o adaptador garante a migração exigida pelo princípio 8.
**Alternativa:** Firebase (Firestore + Auth). Melhor concorrência, mas regras de segurança mais difíceis de auditar, reescrita do que já temos e dependência forte do fornecedor.

## D-03 Uma planilha por tenant — Proposta
Isolamento físico. Custo: provisionamento automático e consultas agregadas do admin mais lentas (resolvido com resumo na central).

## D-04 Repositório público durante o desenvolvimento — Aceita (alterada)
O fundador decidiu: repositório público durante o desenvolvimento (Pages gratuito). Antes de vender, uma versão final mais segura separa o código do servidor num repositório privado. Por isso nenhum segredo entra no repositório em nenhuma hipótese.

## D-05 Front sem build, vanilla JS em módulos de tela — Proposta
Igual ao Prumo. Evita toolchain; quem mantém é o fundador. Reavaliar React se o editor de páginas exigir.

## D-06 Páginas de médico pré-geradas no Pages — Proposta
Velocidade e SEO; o servidor só atende horários. Alternativa (renderizar no navegador a partir do Apps Script) fica como prévia.

## D-07 Exportações no navegador — Proposta
DOCX (`docx`), PPTX (PptxGenJS), ZIP do CapCut (JSZip). Sem custo de servidor e sem enviar conteúdo a terceiros.

## D-08 Canva por arquivo importável no piloto — Proposta
Funciona em qualquer plano do Canva. Importação direta pela Connect API fica para depois da verificação de requisitos.

## D-09 CapCut por pacote de rascunho clonado de amostra — Proposta
Único caminho para entregar projeto editável sem API pública. Pacote reserva (SRT + mídia + roteiro) cobre versões incompatíveis.

## D-10 Módulo clínico desligado até a fase 6 — Aceita (documento mestre)

## D-11 Identidade visual — Proposta
Petróleo `#0F5257`, tinta `#10262E`, sálvia `#8CC7B5`, champanhe `#C8A96A` pontual, fundo pérola `#F6F5F1`; Fraunces nos títulos, Plus Jakarta Sans na interface; raios de 10/16/24 px e botões em pílula; ícones Lucide. Fonte da verdade: `identidade/tokens.css`.

## D-12 Nome Fluyan — Aceita
"MedFlow" já era usado e "Jalecia" foi recusado pelo fundador. Fluyan (de fluir) foi escolhido entre as sugestões dele: Carom, Ampa, Medc e Drom têm o .com.br registrado. Em 03/11/2026: nenhum produto encontrado com o nome (o mais parecido é o Fluyapp, de gestão de filas); fluyan.com.br, fluyan.med.br e fluyan.app livres no registro (fluyan.com está registrado). Registrar o domínio e pesquisar no INPI antes do lançamento.

## D-13 Estúdio com Claude — Aceita
Canva e CapCut viram ferramentas do Claude: ele planeja, o sistema renderiza o final e o editável a partir do mesmo plano. Detalhes em ESTUDIO.md. Substitui D-08 e D-09, que passam a ser os formatos de entrega.

## D-14 Clientes: médico individual e clínica — Aceita
Um tenant pode ter um ou vários médicos. Papéis: titular (dono do tenant), médico, secretária, clínica parceira, admin da plataforma.

## D-15 Preços sem teste grátis — Aceita
R$ 497 / 997 / 1.997 e Enterprise sob consulta. Sem período de teste.
