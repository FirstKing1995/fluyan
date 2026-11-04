/* Gera site/app/capcut/modelo.json a partir de um rascunho real do CapCut Desktop.
   O rascunho de origem é o mesmo usado por pessoal/capcut/work/gerar-capcut.mjs (CapCut 9.x).
   Caminhos pessoais viram marcadores, porque o site é público:
     {{CAPCUT}}  pasta de dados do CapCut no computador do médico
   Uso: node ferramentas/capcut-modelo.js "E:/capcut/CapCut Drafts/teste de edição de vídeo" */
'use strict';
const fs = require('fs');
const path = require('path');
const origem = process.argv[2];
if (!origem || !fs.existsSync(path.join(origem, 'draft_content.json'))) { console.error('Informe a pasta de um rascunho do CapCut.'); process.exit(1); }

function limpar(txt) {
  return txt
    .replace(/[A-Z]:\/Users\/[^/"]+\/AppData\/Local\/CapCut/g, '{{CAPCUT}}')
    .replace(/"[A-Z]:\/(?!Users)[^"]*"/g, '""');
}
const conteudo = JSON.parse(limpar(fs.readFileSync(path.join(origem, 'draft_content.json'), 'utf8')));
const tl = conteudo.id;
const ignorar = /draft_content\.json|draft_content\.json\.bak|template-2\.tmp|\.jpg$|draft_meta_info\.json|mini_draft\.json|attachment_id_mapping\.json/;
const arquivos = {};
(function andar(dir, rel) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n), r = rel ? rel + '/' + n : n;
    if (fs.statSync(p).isDirectory()) { andar(p, r); continue; }
    if (ignorar.test(n)) continue;
    arquivos[r] = limpar(fs.readFileSync(p, 'utf8'));
  }
})(origem, '');
const meta = JSON.parse(limpar(fs.readFileSync(path.join(origem, 'draft_meta_info.json'), 'utf8')));
meta.draft_materials = [{ type: 0, value: [] }, { type: 1, value: [] }, { type: 2, value: [] }, { type: 3, value: [] }, { type: 6, value: [] }, { type: 7, value: [] }, { type: 8, value: [] }];
Object.assign(meta, { draft_fold_path: '', draft_root_path: '', draft_removable_storage_device: '', draft_timeline_materials_size_: 0, draft_cover: '' });

const saida = path.join(__dirname, '../site/app/capcut/modelo.json');
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, JSON.stringify({ versao_capcut: (conteudo.platform || {}).app_version || '', timeline: tl, conteudo, meta, arquivos }));
const txt = fs.readFileSync(saida, 'utf8');
const vazou = txt.match(/Users\/[A-Za-z0-9._-]+|[A-Z]:\/[A-Za-z]/g);
console.log('ok', saida, Math.round(txt.length / 1024) + ' KB', Object.keys(arquivos).length + ' arquivos auxiliares', vazou ? 'ATENÇÃO caminhos: ' + vazou.slice(0, 5) : 'sem caminhos pessoais');
