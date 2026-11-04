# Fluyan: guia de instalação e operação

Este guia põe o Fluyan no ar com dados reais. Siga na ordem. Enquanto o servidor não estiver ligado, o site funciona em **modo demonstração**, com dados fictícios guardados no próprio navegador.

## O que vem no pacote

| Pasta | O que é | Onde vai |
|---|---|---|
| `site/` | Página de vendas (`index.html`), painel (`app/`), página dos médicos (`m/`) | GitHub Pages |
| `backend/` | `Codigo.gs`, `Nucleo.gs`, `Estudio.gs`, `Webhooks.gs`, `appsscript.json` | Google Apps Script |
| `ferramentas/` | Testes e geradores (rodam no seu computador com Node) | Fica com você |

`backend/Nucleo.gs` é gerado. Depois de mexer em `site/app/js/nucleo.js`, rode `node ferramentas/montar.js`.

## 1. Planilha central e Apps Script

1. Crie uma planilha nova no Google Drive com a conta que será dona da plataforma (de preferência uma conta da empresa). Dê o nome **Fluyan central**.
2. Na planilha: **Extensões > Apps Script**.
3. Crie quatro arquivos de script com os nomes `Codigo`, `Nucleo`, `Estudio` e `Webhooks` e cole o conteúdo de cada `.gs` da pasta `backend/`.
4. Em **Configurações do projeto**, marque "Mostrar arquivo de manifesto appsscript.json no editor" e cole o conteúdo de `backend/appsscript.json`.
5. Ainda em Configurações, em **Propriedades do script**, crie:

| Propriedade | Valor |
|---|---|
| `ADMIN_EMAIL` | seu e-mail de administrador da plataforma |
| `ADMIN_SENHA` | uma senha com pelo menos 8 caracteres (é apagada depois da instalação) |
| `ANTHROPIC_API_KEY` | chave da API do Claude (console.anthropic.com), para o Estúdio |
| `MP_ACCESS_TOKEN` | token do Mercado Pago (use o de teste primeiro) |
| `SITE_URL` | endereço do site no GitHub Pages, sem barra no fim |
| `COTACAO_DOLAR` | opcional, para o custo do Estúdio em reais (padrão 5,6) |
| `CLAUDE_MODELO` | opcional (padrão `claude-opus-5-5`) |

6. No editor, escolha a função `instalar` e clique em **Executar**. Autorize o acesso. A função cria as abas centrais, a pasta "Fluyan · clientes" e o seu acesso de administrador.
7. **Implantar > Nova implantação > App da Web**: executar como **você**, acesso **qualquer pessoa**. Copie a URL que termina em `/exec`.

Segredos ficam só nas Propriedades do script. Nunca cole chaves na planilha, no site ou no GitHub.

## 2. Ligar o site ao servidor

1. Abra `site/app/js/config.js` e cole a URL em `API_URL`.
2. Publique (seção 5). O site sai do modo demonstração. A demonstração continua disponível em `app/?demo=1`.

## 3. Criar clientes

- **Pelo painel do administrador**: entre com o e-mail e a senha de administrador, abra **Clientes > Novo cliente**.
- **Pela assinatura**: com `MP_ACCESS_TOKEN` preenchido, a página de vendas cria a assinatura no Mercado Pago. Cadastre no Mercado Pago o webhook do tópico **Assinaturas** apontando para a URL do App da Web com `?topic=preapproval`. Quando o pagamento é autorizado, o cliente é criado com planilha própria e recebe o acesso por e-mail.

Cada cliente ganha uma planilha só dele, dentro da pasta "Fluyan · clientes". Não compartilhe essas planilhas.

## 4. Primeiro acesso do médico

No painel, o card **Primeiros passos** guia a ordem: perfil (com o registro no conselho), serviços, locais e horários, primeiro conteúdo. Depois:

- **Clínicas parceiras**: em Locais e clínicas, "Acesso da clínica" gera um convite de uso único, válido por 7 dias.
- **Página pública**: em Minha página, edite os blocos e publique. O endereço é `SITE_URL/m/?m=nome-do-medico`.
- **Estúdio**: precisa de `ANTHROPIC_API_KEY`. Cada criação desconta do limite mensal do plano.
- **CapCut**: o projeto abre no CapCut para computador. Na primeira exportação o médico informa a pasta de rascunhos e a pasta de dados do CapCut.

## 5. Publicar no GitHub Pages

O Pages publica o ramo `site`, gerado a partir da pasta `site/`:

```bash
git subtree split --prefix site -b site-novo
git push origin site-novo:site --force
git branch -D site-novo
```

## 6. Testes antes de cada publicação

```bash
node ferramentas/testar.js
node ferramentas/testar-gas.js
```

O primeiro testa as regras (agenda, limites, conflitos, permissões, isolamento entre clientes, publicidade médica). O segundo roda o servidor do Apps Script com planilhas simuladas, inclusive a chamada ao Claude.

## 7. Limites desta versão

- Planilha e Apps Script atendem um piloto com dezenas de médicos, não milhares.
- Não guarde dados clínicos. O prontuário fica para a versão com infraestrutura própria.
- O formato de rascunho do CapCut foi gerado a partir da versão 9.x para Windows. Teste a cada atualização do CapCut.
- A importação direta no Canva (sem baixar o arquivo) depende de registrar o aplicativo no Canva.
- Termos de uso, política de privacidade e contrato de operador (LGPD) precisam de revisão jurídica antes do primeiro cliente pagante.
