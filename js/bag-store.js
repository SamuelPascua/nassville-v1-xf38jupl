/* nassville® — la bolsa, compartida entre la tienda y carrito.html.
 *
 * Se guarda en este navegador (localStorage «nassville-bag»): es almacenamiento
 * técnico necesario para que la bolsa no se vacíe al cambiar de página, así
 * que no requiere consentimiento (ver cookies.html). Si el navegador no deja
 * guardar (modo privado estricto), la bolsa vive solo mientras la página esté
 * abierta.
 *
 * Cada línea: { id, color, size, qty, selected, added }
 *   id/color/size identifican la prenda (producto de data.js, nombre del color
 *   y talla); selected = marcada para pagar (las nuevas llegan marcadas).
 */
(function () {
  "use strict";

  var KEY = "nassville-bag";
  var memory = [];

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) { return memory.slice(); }
  }
  function write(items) {
    memory = items;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  }
  function keyOf(line) { return line.id + "|" + line.color + "|" + line.size; }
  function find(items, key) {
    for (var i = 0; i < items.length; i++) if (keyOf(items[i]) === key) return i;
    return -1;
  }

  window.NassBag = {
    key: keyOf,
    items: read,
    // prendas en total (suma de cantidades): es el número del icono de la bolsa
    count: function () { return read().reduce(function (n, l) { return n + l.qty; }, 0); },

    // Añade una unidad; si la prenda ya está, sube su cantidad hasta «max»
    // (el stock de esa talla). Devuelve { qty, capped }.
    add: function (line, max) {
      var items = read();
      var i = find(items, keyOf(line));
      if (i > -1) {
        var l = items[i];
        if (max !== undefined && l.qty >= max) return { qty: l.qty, capped: true };
        l.qty += 1;
        l.selected = true;
        write(items);
        return { qty: l.qty, capped: false };
      }
      if (max === 0) return { qty: 0, capped: true };
      items.push({ id: line.id, color: line.color, size: line.size, qty: 1, selected: true, added: Date.now() });
      write(items);
      return { qty: 1, capped: false };
    },

    // Cambia campos de una línea (qty, selected); qty 0 la quita
    update: function (key, patch) {
      var items = read();
      var i = find(items, key);
      if (i < 0) return;
      Object.keys(patch).forEach(function (k) { items[i][k] = patch[k]; });
      if (items[i].qty <= 0) items.splice(i, 1);
      write(items);
    },

    // Quita una línea y la devuelve (para poder deshacer)
    remove: function (key) {
      var items = read();
      var i = find(items, key);
      if (i < 0) return null;
      var gone = items.splice(i, 1)[0];
      write(items);
      return { line: gone, index: i };
    },

    // Vuelve a poner una línea quitada en su sitio
    restore: function (removed) {
      if (!removed) return;
      var items = read();
      if (find(items, keyOf(removed.line)) > -1) return;
      items.splice(Math.min(removed.index, items.length), 0, removed.line);
      write(items);
    },

    // Marca o desmarca varias a la vez
    selectAll: function (keys, on) {
      var items = read();
      items.forEach(function (l) { if (keys.indexOf(keyOf(l)) > -1) l.selected = on; });
      write(items);
    },

    // Avisa cuando la bolsa cambia en otra pestaña
    onExternalChange: function (fn) {
      window.addEventListener("storage", function (e) { if (e.key === KEY) fn(); });
    }
  };
})();
