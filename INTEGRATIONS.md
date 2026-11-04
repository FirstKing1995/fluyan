# Fluyan: integrações

Versão 0.1 · 03/11/2026. Regra: nenhuma integração é dada como gratuita ou disponível sem checar limites, política e preço na hora de implementar. Itens marcados **[verificar]** dependem dessa checagem.

---

> **Atualização 0.2:** CapCut e Canva agora são ferramentas do Claude dentro do Estúdio. O desenho final está em `ESTUDIO.md`; as seções 1 e 2 abaixo descrevem os formatos que o Estúdio entrega.

## 1. CapCut: vídeos editáveis depois

**Situação:** o CapCut não tem API pública para criar projetos. O caminho viável é gerar o **rascunho do projeto** no formato que o CapCut Desktop lê da pasta de rascunhos. Já fizemos isso: `pessoal/capcut/work/gerar-capcut.mjs` monta um projeto clonando a estrutura de uma amostra salva pelo próprio CapCut (faixas de vídeo, texto, imagem, efeito e áudio, com animações nativas).

**Como fica no Fluyan (versão 1, piloto):**
1. O médico aprova um roteiro de vídeo ou escolhe "Corte de 30 s" de um vídeo enviado.
2. O navegador monta o pacote: `draft_content.json` + `draft_meta_info.json` + pasta de mídia (vídeo original quando houver, títulos, legendas com tempo da transcrição, cartela final com nome e CRM, trilha opcional).
3. O médico baixa `nome-do-video.zip`, descompacta na pasta de rascunhos do CapCut (o Fluyan mostra o caminho padrão do Windows e do Mac) e abre o projeto já editável: textos, tempos, cortes e estilos.
4. Junto vai um `.srt` com as legendas e o roteiro em DOCX, que funcionam em qualquer editor (CapCut celular, Premiere, Instagram).

**Modelos de vídeo:** cada estilo (ex.: "Dica rápida", "Mito ou verdade", "Bastidor do consultório") é uma amostra feita uma vez no CapCut pelo admin e cadastrada na biblioteca central. O exportador clona a amostra e troca textos, tempos e mídia, exatamente como o script atual.

**Riscos:**
- Versões recentes do CapCut podem cifrar o `draft_content.json` ou mudar o formato **[verificar a versão do usuário e a mais atual]**. O nosso script funciona na versão instalada aqui (JSON legível). Mitigação: indicar versão compatível, testar a cada atualização e manter o pacote reserva (`.srt` + mídia + roteiro).
- O CapCut celular não lê esses rascunhos. Para celular, o pacote reserva resolve.
- Fontes: usar só fontes livres que o CapCut tenha ou que acompanhem o pacote.

---

## 2. Canva: imagens editáveis depois

**Nível 1 (piloto, funciona para qualquer conta Canva):**
- O Fluyan gera a peça (post, carrossel, stories) no navegador com a identidade do médico e exporta em **PPTX** (um slide por lâmina do carrossel, textos como caixas de texto reais, imagens como camadas) e em **PDF**.
- O médico importa no Canva (Arrastar arquivo ou "Importar arquivo"): o Canva converte PPTX e PDF em design com texto editável.
- Biblioteca de leiautes na conta do admin: cada modelo é um JSON de camadas (posição, fonte, cor, papel do texto) que vira PPTX. A mesma descrição gera a prévia na tela.
- Biblioteca: PptxGenJS (licença MIT) **[verificar versão e manutenção]**.

**Nível 2 (fase futura): importação direta pela Canva Connect API**
- Botão "Abrir no Canva": o servidor envia o PPTX pela API de importação de designs e devolve o link de edição na conta do médico.
- Exige integração registrada no portal de desenvolvedores do Canva, OAuth por médico e segredo guardado no servidor **[verificar requisitos para integração pública, revisão do Canva e custos]**.
- Preenchimento automático de modelos de marca (Autofill) exige plano Canva Enterprise **[verificar]**; por isso não entra no piloto.

---

## 3. Páginas editáveis

**Modelo:** cada página é uma lista de blocos em JSON (`tipo`, `ordem`, `visivel`, `dados`). O mesmo JSON alimenta o editor, a pré-visualização e o HTML publicado.

**Editor (no painel):**
- Clicar no texto e editar ali mesmo (`contenteditable` com sanitização: só negrito, itálico, link e lista).
- Arrastar para reordenar blocos; ocultar e duplicar; trocar foto pela biblioteca.
- Painel lateral com as opções do bloco (fundo claro/escuro, alinhamento, botão de ação).
- Pré-visualização em largura de celular e de computador.
- Desfazer/refazer na sessão; histórico de versões publicadas.
- Blocos do piloto: Capa, Sobre, Serviços, Planos, Locais e horários, Agendar, Perguntas frequentes, Texto livre, Galeria do consultório, Contato, Rodapé com CRM e responsável técnico.
- Bloco "Depoimentos" fica fora até a revisão jurídica das regras de publicidade médica.

**Publicação:**
1. Checklist automático (CRM preenchido, alertas de publicidade resolvidos).
2. O servidor renderiza o HTML com os tokens da identidade e as cores do médico.
3. Grava `m/<slug>/index.html` no repositório `fluyan-site` pela API do GitHub (token só nas Propriedades do Script).
4. O GitHub Pages publica em cerca de um minuto. A versão anterior fica no histórico da planilha e do git.

**Domínio próprio (fase futura):** o GitHub Pages aceita um domínio por repositório. Para vários médicos com domínio próprio será preciso um repositório por médico ou outra hospedagem estática gratuita **[verificar na fase 4]**.

---

## 4. Copys em DOC

- Botão **Baixar DOCX** em cada peça e **Baixar o mês** no calendário editorial.
- Gerado no navegador com a biblioteca `docx` (MIT) **[verificar versão]**.
- Estrutura: capa com nome do médico e período; por peça: canal, formato, data planejada, gancho, texto/legenda, roteiro por cena (quando vídeo), CTA, hashtags, alertas de publicidade e status de aprovação.
- Estilos de título e corpo do Word com as fontes da marca (com alternativa padrão quando a fonte não estiver instalada).
- Também exporta `.txt` e copiar para a área de transferência.

---

## 5. Inteligência artificial

| Uso | Provedor inicial | Observação |
|---|---|---|
| Texto (copys, roteiros, entrevista, resumo) | Groq (modelos abertos por API) | **[verificar limites do plano gratuito e termos de retenção]** |
| Transcrição de áudio e vídeo | Groq Whisper | O navegador extrai só o áudio do vídeo e reduz para mono 16 kHz antes de enviar (um vídeo de 3 min vira poucos MB) **[verificar limite de tamanho]** |
| Alternativa/fallback de texto | Anthropic (Claude) ou outro, configurável no admin | já usamos chave Anthropic na BRASA |
| Imagens | Fora do piloto. Avaliar Hugging Face depois | direitos e revisão obrigatórios |

Camada `IA.gs`: `executar(tarefa, entrada, tenant)` escolhe provedor e modelo pela tarefa, aplica limite do plano, mede tokens e custo estimado, grava em `AI_USAGE`, tenta o fallback em caso de erro e nunca recebe dados da camada clínica.

---

## 6. WhatsApp

- **Piloto:** links `wa.me` com mensagem pronta (confirmação, lembrete, endereço). Sem custo, sem risco de bloqueio.
- **Fase 5:** API oficial do WhatsApp Business (Cloud API) ou provedor autorizado. O Prumo CRM já tem o conector `meta`. Custos por conversa e modelos aprovados pela Meta **[verificar]**.
- Conectores não oficiais (Evolution, WAHA), existentes no Prumo, não serão usados com pacientes por risco de bloqueio e privacidade.

---

## 7. Mercado Pago

- **Assinatura do Fluyan (piloto):** planos de assinatura recorrente do Mercado Pago, campos prontos no admin; chaves preenchidas pelo dono da plataforma nas Propriedades do Script. Ativação do tenant só pelo webhook autenticado.
- **Cobrança de pacientes pelo médico (fase futura):** cada médico conecta a própria conta; o Fluyan não recebe dinheiro do paciente.

---

## 8. Outras

| Integração | Fase | Observação |
|---|---|---|
| E-mail (MailApp da conta Google) | Piloto | Cota diária limitada; contar envios |
| Google Agenda | Futura | Leitura de ocupação primeiro |
| Jitsi Meet / Google Meet | Futura | Link associado ao agendamento online |
| Redes sociais (publicar e métricas) | Futura | APIs da Meta com revisão de app |
| Hotmart/Kiwify (venda alternativa da assinatura) | Opcional | Conector já existe no Prumo |
