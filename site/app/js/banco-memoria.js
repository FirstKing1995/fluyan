/* ==========================================================================
   FLUYAN — banco em memória (modo demonstração e testes)
   Mesma interface do adaptador da planilha (backend/Codigo.gs):
     ler(tabela) · inserir(tabela, obj) · atualizar(tabela, id, campos, tid, chave) · excluir(tabela, id)
   ========================================================================== */
(function (raiz) {
  'use strict';
  function criarBancoMemoria(estado, aoMudar) {
    estado = estado || {};
    function tab(n) { return estado[n] || (estado[n] = []); }
    function mudou() { if (aoMudar) aoMudar(estado); }
    return {
      estado: estado,
      ler: function (n) { return tab(n); },
      inserir: function (n, obj) { tab(n).push(JSON.parse(JSON.stringify(obj))); mudou(); },
      atualizar: function (n, id, campos, tid, chave) {
        var k = chave || 'id', r = tab(n).filter(function (x) { return x[k] === id; })[0];
        if (r) { Object.keys(campos).forEach(function (c) { r[c] = campos[c]; }); mudou(); }
      },
      excluir: function (n, id) { estado[n] = tab(n).filter(function (x) { return x.id !== id; }); mudou(); }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { criarBancoMemoria: criarBancoMemoria };
  else raiz.criarBancoMemoria = criarBancoMemoria;
})(this);
