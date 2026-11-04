# Fluyan: Estúdio (Claude integrado)

Versão 0.2 · 03/11/2026. Pedido do fundador: Canva e CapCut viram ferramentas do Claude dentro do sistema. O médico faz o pedido, o Claude edita e devolve **o arquivo final** e **o editável**.

## Como funciona para o médico

1. No Estúdio, o médico escreve o pedido ("carrossel com 5 sinais de check-up", "corte de 30 s do vídeo que enviei ontem, com legendas") e escolhe o material de origem, se houver.
2. O Claude monta o plano (roteiro, lâminas, cortes, legendas), aplica a identidade do médico e roda o verificador de publicidade médica.
3. O Estúdio devolve:

| Pedido | Arquivo final | Editáveis |
|---|---|---|
| Post, carrossel, stories | PNG/JPG por lâmina, PDF | Design no Canva da conta do médico (quando conectado) + PPTX que o Canva importa |
| Vídeo curto, corte, reels | MP4 vertical com legendas | Projeto de rascunho do CapCut (.zip) + legendas SRT + roteiro DOCX |
| Copy, roteiro, artigo | DOCX | DOCX e texto no calendário editorial |

4. Tudo entra no calendário editorial como `Revisão`. Nada é publicado sem aprovação.

## Arquitetura

```
 Painel (navegador)                     Apps Script                    API do Claude
 ┌───────────────────┐  pedido + ids   ┌────────────────────┐  HTTP   ┌──────────────────────┐
 │ Estúdio            │ ─────────────▶ │ Estudio.gs          │ ──────▶ │ claude-opus-5-5       │
 │ - envia pedido     │                │ - monta contexto    │         │ ferramentas:          │
 │ - recebe "plano"   │ ◀───────────── │   (perfil, marca,   │ ◀────── │  - planejar_pecas     │
 │ - renderiza final  │   plano JSON   │    transcrição)     │         │  - planejar_video     │
 │   (canvas, vídeo)  │                │ - registra uso      │         │  - Canva (MCP, opc.)  │
 │ - gera editáveis   │                │ - chave no servidor │         └──────────────────────┘
 └───────────────────┘                └────────────────────┘
```

- **O Claude decide, o sistema executa.** A resposta do Claude é um plano estruturado (JSON validado): lâminas com camadas de texto e imagem, ou linha do tempo de vídeo com cortes, títulos e legendas. O mesmo plano gera o final e o editável, então os dois sempre batem.
- **Renderização no aparelho do médico**: imagens em canvas (PNG), vídeo com WebCodecs no navegador (MP4), pacotes PPTX, DOCX e CapCut montados ali. Nada pesado roda no Apps Script, que tem limite de 6 minutos.
- **Canva pelo conector MCP**: quando o médico conecta a conta Canva (OAuth), o servidor passa o token do médico ao Claude pelo conector MCP da API (`mcp_servers` + `mcp_toolset`, beta `mcp-client-2025-11-20`). O Claude cria o design direto na conta do médico e devolve o link de edição. Sem conexão, o editável é o PPTX importável. **[verificar: registro do aplicativo no Canva, OAuth do servidor MCP do Canva para terceiros e limites]**
- **CapCut**: o CapCut não tem API. O editável é o rascunho do projeto, montado a partir de amostras feitas no CapCut (método do `pessoal/capcut/work/gerar-capcut.mjs`). **[verificar o formato da versão atual do CapCut Desktop]**

## Chamada ao Claude (servidor)

- Apps Script não tem SDK oficial, então a chamada é HTTP direta para `POST https://api.anthropic.com/v1/messages` com `UrlFetchApp`.
- Modelo `claude-opus-5-5`, pensamento adaptativo, `output_config.effort` = `medium` para peças, `high` para vídeo.
- Ferramentas próprias com `strict: true` (`planejar_pecas`, `planejar_video`, `revisar_publicidade`), escolha `auto` com instrução no prompt.
- Fallback do servidor ligado (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`): se o modelo recusar, a própria API tenta outro modelo.
- Chave `ANTHROPIC_API_KEY` só nas Propriedades do Script. O uso (tokens de entrada e saída, custo estimado) vai para `USO_IA` por tenant e desconta do limite do plano.
- Conteúdo enviado pelo médico vai como dado, separado das instruções (proteção contra instruções escondidas em arquivos).
- Dados de pacientes nunca entram no Estúdio.

## Modelos (biblioteca central)

- **Peças**: leiautes em JSON (proporção 1:1, 4:5, 9:16; papéis de texto: gancho, corpo, rodapé com CRM). O Claude escolhe o leiaute e preenche; a cor de destaque vem do perfil do médico.
- **Vídeos**: estilos ("Dica rápida", "Mito ou verdade", "Bastidor") com amostra CapCut correspondente e parâmetros do render no navegador (fonte, posição de legenda, animação de entrada).

## Limites por plano (hipótese inicial, ajustar com o custo real)

| Plano | Peças/mês | Vídeos/mês |
|---|---|---|
| Essencial R$ 497 | 20 | 0 |
| Profissional R$ 997 | 60 | 10 |
| Premium R$ 1.997 | 150 | 30 |
| Enterprise | sob contrato | sob contrato |
