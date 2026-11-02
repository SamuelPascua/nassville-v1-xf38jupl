/* nassville® — la bolsa (carrito.html): el probador y la pantalla de pago.
 *
 * Las prendas vienen de js/bag-store.js; los nombres, precios, fotos y stock
 * de js/data.js. Solo las prendas marcadas pasan al pago; las demás se quedan
 * guardadas en la bolsa. El cobro en sí está en js/checkout.js.
 */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var D = window.NASS;
  var Bag = window.NassBag;
  var IMG = "assets/img/";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ENTER = "cubic-bezier(0.22, 1, 0.36, 1)";
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  var euro = function (n) { return n.toLocaleString("es-ES") + " €"; };
  var photo = function (src) { return IMG + src.replace(/\.jpg$/, ".webp"); };
  var thumb = function (src) { return IMG + src.replace(/\.jpg$/, "-480.webp"); };
  var units = function (n) { return n + (n === 1 ? " prenda" : " prendas"); };

  var ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>'
  };

  /* ---------- Logo (igual que en la tienda) ---------- */
  function paintLogos() {
    var L = window.NASS_LOGO;
    if (!L) return;
    if (!document.getElementById("logo-sprite")) {
      var sprite = '<svg id="logo-sprite" width="0" height="0" style="position:absolute" aria-hidden="true">';
      Object.keys(L).forEach(function (k) {
        sprite += '<symbol id="logo-' + k + '" viewBox="' + L[k].viewBox + '"><path fill-rule="evenodd" d="' + L[k].paths.join(" ") + '"/></symbol>';
      });
      document.body.insertAdjacentHTML("afterbegin", sprite + "</svg>");
    }
    $$("[data-logo]:not([data-painted])").forEach(function (slot) {
      var key = slot.getAttribute("data-logo");
      if (!L[key]) return;
      slot.innerHTML = '<svg viewBox="' + L[key].viewBox + '" aria-hidden="true" focusable="false"><use href="#logo-' + key + '"/></svg>';
      slot.setAttribute("data-painted", "");
    });
  }

  /* ---------- Menú en móvil ---------- */
  function setupMenu() {
    var btn = $("[data-menu-button]"), sheet = $("[data-menu]");
    function setMenu(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      sheet.hidden = !open;
    }
    btn.addEventListener("click", function () { setMenu(sheet.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) { setMenu(false); btn.focus(); } });
  }

  /* ---------- Toast (con «Deshacer» al quitar) ---------- */
  var toastEl = $("[data-toast]"), toastTimer = null;
  function toast(html, ms) {
    toastEl.innerHTML = html;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, ms || 3200);
  }

  /* ---------- Cada línea de la bolsa, resuelta contra el catálogo ---------- */
  var byId = {};
  D.products.forEach(function (p) { byId[p.id] = p; });

  function resolve(line) {
    var p = byId[line.id];
    var c = p && p.colorways.filter(function (cw) { return cw.name === line.color; })[0];
    var left = c && c.stock[line.size] !== undefined ? c.stock[line.size] : 0;
    return { line: line, key: Bag.key(line), p: p, c: c, left: left, gone: !p || !c || left === 0 };
  }

  // Ajusta la bolsa al stock actual: lo agotado se desmarca y la cantidad no
  // pasa de lo que queda. Devuelve las líneas resueltas.
  function lines() {
    var out = Bag.items().map(resolve);
    out.forEach(function (r) {
      if (r.gone && r.line.selected) Bag.update(r.key, { selected: false });
      else if (!r.gone && r.line.qty > r.left) Bag.update(r.key, { qty: r.left });
    });
    return Bag.items().map(resolve);
  }
  function marked(list) { return list.filter(function (r) { return r.line.selected && !r.gone; }); }
  function subtotal(list) { return list.reduce(function (n, r) { return n + r.p.price * r.line.qty; }, 0); }
  function unitCount(list) { return list.reduce(function (n, r) { return n + r.line.qty; }, 0); }

  /* ---------- El probador ---------- */
  var rail = $("[data-fitting]");
  var railWrap = $("[data-fitting-wrap]");
  var tools = $("[data-bag-tools]");
  var markedEl = $("[data-marked]");
  var allBtn = $("[data-select-all]");
  var empty = $("[data-bag-empty]");
  var lede = $("[data-bag-lede]");
  var paybar = $("[data-paybar]");
  var payCount = $("[data-pay-count]");
  var payGo = $("[data-pay-go]");
  var firstRender = true;

  function card(r, i) {
    var l = r.line;
    var name = r.p ? r.p.name : "Prenda";
    var label = name + ", " + l.color + ", talla " + l.size;
    var li = el("li", { class: "fit" + (l.selected && !r.gone ? "" : " is-off") + (r.gone ? " is-gone" : ""), "data-key": r.key });

    var check = el("input", { type: "checkbox", disabled: r.gone ? "" : null });
    check.checked = l.selected && !r.gone;
    check.addEventListener("change", function () {
      Bag.update(r.key, { selected: check.checked });
      li.classList.toggle("is-off", !check.checked);
      summary();
    });
    var tick = el("label", { class: "fit__check" }, [
      check,
      el("span", { class: "fit__tick", "aria-hidden": "true", html: ICON.check }),
      el("span", { class: "sr-only", text: (r.gone ? "No disponible: " : "Llevarme ") + label })
    ]);

    var remove = el("button", { class: "fit__remove", type: "button", "aria-label": "Quitar " + label + " de la bolsa", html: ICON.close });
    remove.addEventListener("click", function () { removeLine(r, li); });

    var media = el("a", { class: "fit__media", href: r.p ? "./#product-" + r.p.id : "./#tienda", tabindex: "-1", "aria-hidden": "true" }, [
      r.c ? el("img", { src: i < 4 ? photo(r.c.images[0]) : null, "data-src": i < 4 ? null : photo(r.c.images[0]), alt: "", decoding: "async" }) : null,
      r.gone ? el("span", { class: "sold-stamp", text: "Agotado" }) : null
    ]);

    // el aviso de stock va en la misma línea que color y talla: la ficha no
    // crece y la carta cabe sobre la barra de pago también en el móvil
    var stock = el("span", { class: "fit__stock" });
    var body = el("div", { class: "fit__body" }, [
      el("h2", { class: "fit__name", text: name }),
      r.p ? el("p", { class: "fit__type", text: r.p.type }) : null,
      el("p", { class: "fit__meta" }, [document.createTextNode(l.color + " · Talla " + l.size), stock])
    ]);
    function stockNote(q) {
      if (r.gone) return "";
      // espacios duros: la frase de stock nunca se parte en dos líneas
      if (q >= r.left) return r.left === 1 ? " · es la única" : " · no quedan más";
      return r.left <= 3 ? " · quedan " + r.left : "";
    }

    if (r.gone) {
      body.appendChild(el("p", { class: "fit__note", text: "Se ha agotado en esta talla. Quítala o déjala por si vuelve." }));
    } else {
      var out = el("output", { class: "stepper__n", "aria-live": "polite", text: String(l.qty) });
      var minus = el("button", { class: "stepper__btn", type: "button", "aria-label": "Una menos", html: ICON.minus, disabled: l.qty <= 1 ? "" : null });
      var plus = el("button", { class: "stepper__btn", type: "button", "aria-label": "Una más", html: ICON.plus, disabled: l.qty >= r.left ? "" : null });
      var price = el("strong", { class: "fit__price", text: euro(r.p.price * l.qty) });
      stock.textContent = stockNote(l.qty);
      var step = function (d) {
        var q = Math.max(1, Math.min(r.left, l.qty + d));
        if (q === l.qty) return;
        l.qty = q;
        Bag.update(r.key, { qty: q });
        out.textContent = String(q);
        minus.disabled = q <= 1;
        plus.disabled = q >= r.left;
        roll(price, euro(r.p.price * q), d);
        stock.textContent = stockNote(q);
        summary();
      };
      minus.addEventListener("click", function () { step(-1); });
      plus.addEventListener("click", function () { step(1); });
      body.appendChild(el("div", { class: "fit__row" }, [
        el("div", { class: "stepper", role: "group", "aria-label": "Cantidad de " + name }, [minus, out, plus]),
        price
      ]));
    }

    li.appendChild(el("article", { class: "fit__card", "aria-label": label }, [media, tick, remove, body]));
    return li;
  }

  function render() {
    var list = lines();
    rail.innerHTML = "";
    var has = list.length > 0;
    railWrap.hidden = !has;
    tools.hidden = !has;
    empty.hidden = has;
    paybar.hidden = !has;
    document.body.classList.toggle("has-paybar", has);
    lede.hidden = !has;
    list.forEach(function (r, i) { rail.appendChild(card(r, i)); });
    loadNear();
    arrows();
    // la ficha cambia de alto con el ancho de la carta: una segunda medida lo asienta
    requestAnimationFrame(arrows);
    summary();
    if (firstRender && has && !reduceMotion) arrive($$(".fit", rail));
    firstRender = false;
  }

  // las cartas llegan como mensajes: suben, se enfocan y se asientan
  function arrive(nodes) {
    nodes.slice(0, 5).forEach(function (n, k) {
      n.animate([
        { opacity: 0, transform: "translateY(18px) scale(0.97)", filter: "blur(4px)" },
        { opacity: 1, transform: "none", filter: "blur(0)" }
      ], { duration: 560, delay: k * 70, easing: ENTER, fill: "backwards" });
    });
  }

  // fotos de las prendas que quedan fuera de la vista: al acercarse
  function loadNear() {
    var pending = $$("img[data-src]", rail);
    if (!pending.length) return;
    if (!("IntersectionObserver" in window)) { pending.forEach(function (im) { im.src = im.dataset.src; }); return; }
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.src = e.target.dataset.src;
        e.target.removeAttribute("data-src");
      });
    }, { root: rail, rootMargin: "0px 100%" });
    pending.forEach(function (im) { io.observe(im); });
  }

  // El número cambia rodando, como el contador de la bolsa
  function roll(node, text, dir) {
    if (node.textContent === text) return;
    if (reduceMotion) { node.textContent = text; return; }
    node.innerHTML = "";
    node.appendChild(el("span", { class: "roll", style: "--dir:" + (dir < 0 ? -1 : 1), text: text }));
  }

  function summary() {
    var list = Bag.items().map(resolve);
    var mk = marked(list);
    var available = list.filter(function (r) { return !r.gone; });
    var n = unitCount(mk), total = subtotal(mk);
    var prevTotal = +payGo.dataset.total || 0;

    markedEl.textContent = mk.length + " de " + list.length + (list.length === 1 ? " marcada" : " marcadas");
    var all = available.length > 0 && mk.length === available.length;
    allBtn.textContent = all ? "Desmarcar todo" : "Marcar todo";
    allBtn.setAttribute("aria-pressed", all ? "true" : "false");
    allBtn.disabled = available.length === 0;

    payCount.textContent = n ? units(n) + " · " + euro(total) : "Nada marcado";
    payGo.dataset.total = total;
    if (n) {
      payGo.removeAttribute("aria-disabled");
      roll(payGo, "Pagar " + euro(total), total - prevTotal);
    } else {
      payGo.setAttribute("aria-disabled", "true");
      payGo.textContent = "Marca alguna prenda";
    }
    paintBagCount(unitCount(list));
  }

  function paintBagCount(n) {
    $$("[data-bag-button]").forEach(function (b) {
      b.classList.toggle("has-items", n > 0);
      b.setAttribute("aria-label", "Bolsa, " + units(n));
    });
    $$("[data-bag-count]").forEach(function (c) { c.textContent = n; });
  }

  // Quitar: la carta se recoge en el riel y el toast deja deshacerlo
  function removeLine(r, li) {
    if (window.Sfx) window.Sfx.play("remove");
    var removed = Bag.remove(r.key);
    var finish = function () {
      render();
      var next = $(".fit__remove", rail) || allBtn;
      if (next && !next.hidden) next.focus({ preventScroll: true });
      else $("[data-bag-empty] .btn").focus({ preventScroll: true });
    };
    var name = r.p ? r.p.name : "la prenda";
    toast("Has quitado <strong>" + name + "</strong> · " + r.line.size + ". <button type=\"button\" class=\"toast__undo\" data-undo>Deshacer</button>", 5000);
    var undo = $("[data-undo]", toastEl);
    undo.addEventListener("click", function () {
      Bag.restore(removed);
      toastEl.classList.remove("is-on");
      render();
    });
    if (reduceMotion || !li.animate) { finish(); return; }
    var w = li.getBoundingClientRect().width;
    li.style.overflow = "hidden";
    li.animate([
      { width: w + "px", opacity: 1, transform: "none" },
      { width: "0px", opacity: 0, transform: "scale(0.9)", marginRight: "calc(var(--rail-gap) * -1)" }
    ], { duration: 280, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }).onfinish = finish;
  }

  // Flechas del riel (con ratón); con el dedo se desliza
  var prev = $("[data-rail-prev]"), next = $("[data-rail-next]");
  function arrows() {
    // dónde empieza el riel en la página: con eso el CSS calcula el tamaño de
    // carta que cabe entera sobre la barra de pago
    railWrap.style.setProperty("--rail-top", Math.round(railWrap.getBoundingClientRect().top + window.scrollY + 10) + "px");
    var body = $$(".fit__body", rail).reduce(function (h, b) { return Math.max(h, b.offsetHeight); }, 0);
    if (body) railWrap.style.setProperty("--fit-body", body + "px");
    var over = rail.scrollWidth > rail.clientWidth + 4;
    prev.hidden = next.hidden = !over;
    if (!over) return;
    prev.disabled = rail.scrollLeft < 8;
    next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
  }
  function slide(d) {
    var f = $(".fit", rail);
    var step = f ? f.getBoundingClientRect().width + 16 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: d * step, behavior: reduceMotion ? "auto" : "smooth" });
  }
  prev.addEventListener("click", function () { slide(-1); });
  next.addEventListener("click", function () { slide(1); });
  rail.addEventListener("scroll", arrows, { passive: true });
  window.addEventListener("resize", arrows);

  allBtn.addEventListener("click", function () {
    var available = Bag.items().map(resolve).filter(function (r) { return !r.gone; });
    var on = allBtn.getAttribute("aria-pressed") !== "true";
    Bag.selectAll(available.map(function (r) { return r.key; }), on);
    $$(".fit", rail).forEach(function (li) {
      if (li.classList.contains("is-gone")) return;
      li.classList.toggle("is-off", !on);
      $("input[type=checkbox]", li).checked = on;
    });
    summary();
  });

  /* ---------- De la bolsa al pago (#pago; el botón atrás vuelve) ---------- */
  var bagView = $("[data-view=bag]"), payView = $("[data-view=checkout]");
  var fromBag = false; // se llegó al pago desde esta misma página (atrás = volver a la bolsa)

  payGo.addEventListener("click", function () {
    if (payGo.getAttribute("aria-disabled") === "true") {
      if (!reduceMotion && rail.animate) rail.animate([
        { transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }
      ], { duration: 280, easing: "ease-out" });
      toast("Marca al menos una prenda para pagar.");
      return;
    }
    fromBag = true;
    location.hash = "pago";
  });

  function route() {
    var toPay = location.hash === "#pago" && marked(Bag.items().map(resolve)).length > 0;
    if (location.hash === "#pago" && !toPay) history.replaceState(null, "", location.pathname);
    bagView.hidden = toPay;
    payView.hidden = !toPay;
    paybar.hidden = toPay || Bag.items().length === 0;
    document.body.classList.toggle("has-paybar", !paybar.hidden);
    paintBagCount(unitCount(Bag.items().map(resolve)));
    if (toPay) {
      fillReceipt();
      window.scrollTo(0, 0);
      $(".checkout__title").focus({ preventScroll: true });
    } else {
      render();
    }
  }
  window.addEventListener("hashchange", route);
  $("[data-back]").addEventListener("click", function (e) {
    e.preventDefault();
    if (fromBag) { fromBag = false; history.back(); }
    else { history.pushState(null, "", location.pathname); route(); }
  });

  var receiptLines = $("[data-receipt-lines]");
  var payBtn = $("[data-checkout-pay]");
  function fillReceipt() {
    var mk = marked(Bag.items().map(resolve));
    receiptLines.innerHTML = "";
    mk.forEach(function (r) {
      receiptLines.appendChild(el("li", { class: "receipt__line" }, [
        el("img", { src: thumb(r.c.images[0]), alt: "", decoding: "async" }),
        el("span", { class: "receipt__what" }, [
          el("strong", { text: r.p.name }),
          el("span", { text: r.line.color + " · " + r.line.size + (r.line.qty > 1 ? " · ×" + r.line.qty : "") })
        ]),
        el("span", { class: "receipt__price", text: euro(r.p.price * r.line.qty) })
      ]));
    });
    var total = subtotal(mk);
    $("[data-receipt-subtotal]").textContent = euro(total);
    $("[data-receipt-total]").textContent = euro(total);
    // mientras no haya pasarela, el propio botón dice que no se cobra nada
    payBtn.innerHTML = "";
    payBtn.appendChild(el("span", { text: "Pagar " + euro(total) }));
    if (!window.NassCheckout.isLive()) payBtn.appendChild(el("small", { text: "Pagos aún no activos: no se cobra nada" }));
    result.hidden = true;
  }

  /* ---------- Formulario de envío ---------- */
  var form = $("[data-checkout-form]");
  var result = $("[data-checkout-result]");
  var terms = $("[data-terms]");
  var RULES = {
    "co-email": function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : v ? "Ese email no parece correcto. Revisa que tenga @ y dominio." : "Escribe tu email: te mandaremos ahí la confirmación."; },
    "co-tel": function (v) { return v.replace(/[\s+()-]/g, "").length >= 9 ? "" : "Escribe un teléfono de al menos 9 cifras."; },
    "co-name": function (v) { return v ? "" : "Escribe tu nombre."; },
    "co-last": function (v) { return v ? "" : "Escribe tus apellidos."; },
    "co-addr": function (v) { return v ? "" : "Escribe la calle y el número."; },
    "co-zip": function (v) { return /^\d{5}$/.test(v) ? "" : "El código postal son 5 cifras."; },
    "co-city": function (v) { return v ? "" : "Escribe la ciudad."; },
    "co-prov": function (v) { return v ? "" : "Escribe la provincia."; }
  };
  function check(id) {
    var input = document.getElementById(id);
    var msg = RULES[id](input.value.trim());
    var err = $('[data-error-for="' + id + '"]');
    err.textContent = msg;
    err.hidden = !msg;
    if (msg) { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", err.id || (err.id = "err-" + id)); }
    else { input.removeAttribute("aria-invalid"); }
    return !msg;
  }
  Object.keys(RULES).forEach(function (id) {
    var input = document.getElementById(id);
    // el error aparece al salir del campo y se corrige mientras escribes
    input.addEventListener("blur", function () { if (input.value.trim()) check(id); });
    input.addEventListener("input", function () { if (input.getAttribute("aria-invalid")) check(id); });
  });
  terms.addEventListener("change", function () { if (terms.checked) $('[data-error-for="terms"]').hidden = true; });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = Object.keys(RULES).filter(function (id) { return !check(id); });
    var termsErr = $('[data-error-for="terms"]');
    termsErr.hidden = terms.checked;
    termsErr.textContent = "Marca la casilla para aceptar las condiciones de compra.";
    if (bad.length || !terms.checked) { if (window.Sfx) window.Sfx.play("deny"); }
    if (bad.length) { document.getElementById(bad[0]).focus(); return; }
    if (!terms.checked) { terms.focus(); return; }

    var mk = marked(Bag.items().map(resolve));
    var data = new FormData(form);
    var order = {
      lines: mk.map(function (r) {
        return { id: r.p.id, name: r.p.name, type: r.p.type, color: r.line.color, size: r.line.size, qty: r.line.qty, unitPrice: r.p.price, lineTotal: r.p.price * r.line.qty };
      }),
      subtotal: subtotal(mk),
      currency: "EUR",
      contact: { email: data.get("email"), tel: data.get("tel") },
      shipping: ["nombre", "apellidos", "direccion", "direccion2", "cp", "ciudad", "provincia", "pais"].reduce(function (o, k) { o[k] = data.get(k) || ""; return o; }, {})
    };

    payBtn.setAttribute("aria-busy", "true");
    payBtn.disabled = true;
    window.NassCheckout.start(order).then(function () {
      // con una pasarela conectada, start() lleva a su página de pago
    }, function (err) {
      result.hidden = false;
      result.className = "checkout__result is-info";
      result.textContent = err && err.code === "not-configured"
        ? "Los pagos todavía no están activos, así que no se ha cobrado nada. Tus datos no se han enviado a ningún sitio y tu bolsa sigue igual."
        : "No hemos podido iniciar el pago. No se ha cobrado nada; vuelve a intentarlo en un momento.";
    }).then(function () {
      payBtn.removeAttribute("aria-busy");
      payBtn.disabled = false;
    });
  });

  /* ---------- Arranque ---------- */
  paintLogos();
  setupMenu();
  Bag.onExternalChange(function () { if (location.hash === "#pago") route(); else render(); });
  route();
})();
