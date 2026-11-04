/* Gera backend/Nucleo.gs a partir de site/app/js/nucleo.js e confere a sintaxe dos .gs.
   Uso: node ferramentas/montar.js */
'use strict';
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const origem = fs.readFileSync(path.join(raiz, 'site/app/js/nucleo.js'), 'utf8');
fs.writeFileSync(path.join(raiz, 'backend/Nucleo.gs'),
  '/* GERADO por ferramentas/montar.js a partir de site/app/js/nucleo.js. NÃO EDITE AQUI. */\n' + origem);
let erros = 0;
for (const f of fs.readdirSync(path.join(raiz, 'backend')).filter((n) => n.endsWith('.gs'))) {
  try { new Function(fs.readFileSync(path.join(raiz, 'backend', f), 'utf8')); console.log('ok  ' + f); }
  catch (e) { erros++; console.log('ERRO ' + f + ': ' + e.message); }
}
process.exit(erros ? 1 : 0);
