/* nassville® v1 — interacción de la página (sin dependencias). */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var D = window.NASS;
  var IMG = "assets/img/";
  var VID = "assets/video/";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg>',
    read: '<svg viewBox="0 0 22 14" aria-hidden="true"><path d="M1 7.5 5 11.5 13 2.5M9 11.5l.5.5L18 2.5"/></svg>'
  };

  /* ---------- Logo inline (emblema y wordmark) ---------- */
  function paintLogos() {
    var L = window.NASS_LOGO;
    if (!L) return;
    // los trazados van una sola vez en un sprite; cada logo los reutiliza con <use>
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

  /* ---------- Llegada de mensajes ---------- */
  /* ---------- Carga diferida: fotos y pósters solo cuando se acercan ---------- */
  // root: la ventana del chat (sus fotos están dentro de un scroll propio) o la página
  var nearObservers = [];
  function whenNear(node, fn, root) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var entry = nearObservers.filter(function (o) { return o.root === (root || null); })[0];
    if (!entry) {
      entry = { root: root || null, io: new IntersectionObserver(function (list, io) {
        list.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          var f = e.target._near; e.target._near = null;
          if (f) f();
        });
      }, { root: root || null, rootMargin: root ? "100% 0px" : "600px 0px" }) };
      nearObservers.push(entry);
    }
    node._near = fn;
    entry.io.observe(node);
  }
  function wake(scope) {
    $$("[data-src]:not(video)", scope).forEach(function (im) { im.src = im.dataset.src; im.removeAttribute("data-src"); });
    $$("video[data-poster]", scope).forEach(function (v) { v.poster = v.dataset.poster; v.removeAttribute("data-poster"); });
  }

  var revealObserver = null;
  function setupReveal(nodes) {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealObserver.unobserve(entry.target);
          arrive(entry.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    }
    // solo esconder lo que está por debajo del viewport: lo visible nunca parpadea.
    // Se mide todo de una vez y después se marca: medir y escribir alternando
    // obligaba a recolocar la página entera por cada elemento al cargar.
    var limit = window.innerHeight * 0.9;
    var below = nodes.filter(function (n) { return n.getBoundingClientRect().top >= limit; });
    below.forEach(function (n) {
      if (n.classList.contains("chat__drop")) $$(".reveal", n).forEach(function (c) { c.classList.add("is-pending"); });
      else n.classList.add("is-pending");
      revealObserver.observe(n);
    });
  }
  function arrive(node) {
    // Un drop del chat: separador, y por cada persona "escribiendo…" y sus mensajes
    if (node.classList.contains("chat__drop")) { playDrop(node); return; }
    node.classList.remove("is-pending");
  }

  /* ---------- El hilo: grupo de chat "nassville drops" ---------- */
  var C = D.chat;
  var NASS_USER = { name: "nassville", color: "#7d9dff", brand: true };
  var CHECKS = '<svg class="msg__checks" viewBox="0 0 18 12" aria-label="Leído"><path d="M1 6.5 4.5 10 11 2.5M7.5 10l.5.5L16.5 2.5"/></svg>';

  function userOf(id) { return id === "nassville" ? NASS_USER : C.users[id]; }

  function avatar(user) {
    if (user.brand) return el("span", { class: "msg__avatar msg__avatar--brand", "data-logo": "emblem", "aria-hidden": "true" });
    return el("span", { class: "msg__avatar", style: "--who:" + user.color, "aria-hidden": "true", text: user.name.charAt(0) });
  }

  function meta(time, own) {
    return el("span", { class: "msg__meta", html: time + (own ? CHECKS : "") });
  }

  // Una fila de mensaje: avatar (solo en el primero de cada tanda) + burbuja
  function row(user, first, bubbleChildren, opts) {
    opts = opts || {};
    var r = el("div", { class: "msg reveal" + (first ? " msg--first" : "") + (user.brand ? " msg--brand" : "") + (opts.cls ? " " + opts.cls : "") });
    r.appendChild(first ? avatar(user) : el("span", { class: "msg__avatar msg__avatar--gap", "aria-hidden": "true" }));
    var b = el("div", { class: "msg__bubble" + (opts.media ? " msg__bubble--media" : "") });
    if (first) b.appendChild(el("span", { class: "msg__name", style: "--who:" + user.color, html: user.name + (user.brand ? ' <i class="msg__admin">admin</i>' : "") }));
    bubbleChildren.forEach(function (c) { if (c) b.appendChild(c); });
    r.appendChild(b);
    if (opts.reactions) {
      var re = el("span", { class: "msg__reactions", "aria-label": "Reacciones" });
      opts.reactions.forEach(function (x) { re.appendChild(el("span", { text: x[0] + " " + x[1] })); });
      b.appendChild(re);
      r.classList.add("has-reactions");
    }
    return r;
  }

  function quoteBox(user, text) {
    return el("span", { class: "msg__quote", style: "--who:" + user.color }, [
      el("strong", { text: user.name }),
      el("span", { text: text })
    ]);
  }

  function typingRow(user) {
    var r = el("div", { class: "msg msg--first msg--typing", "aria-hidden": "true", hidden: "" });
    r.appendChild(avatar(user));
    r.appendChild(el("div", { class: "msg__bubble" }, [el("span", { class: "typing typing--chat", html: "<i></i><i></i><i></i>" })]));
    r.dataset.who = user.name;
    return r;
  }

  // Álbum de fotos estilo WhatsApp: 2×2 con "+N"
  function album(drop) {
    var shown = drop.images.slice(0, 4);
    var extra = drop.images.length - shown.length;
    var grid = el("div", { class: "msg__album msg__album--" + shown.length });
    whenNear(grid, function () { wake(grid); }, chatBody());
    shown.forEach(function (src, i) {
      var tile = el("button", { class: "msg__photo", type: "button", "aria-label": "Ver foto " + (i + 1) + " de " + drop.title });
      tile.appendChild(el("img", { "data-src": IMG + src, alt: "", decoding: "async" }));
      if (i === shown.length - 1 && extra > 0) tile.appendChild(el("span", { class: "msg__more", text: "+" + extra }));
      tile.addEventListener("click", function () { openViewer(drop.images, i, drop.title); });
      grid.appendChild(tile);
    });
    return grid;
  }

  function videoMsg(drop) {
    var vb = el("button", { class: "msg__video", type: "button", "aria-label": "Reproducir vídeo de " + drop.title, style: "aspect-ratio:" + drop.video.ratio });
    var v = el("video", { muted: "", loop: "", playsinline: "", preload: "none", "data-poster": VID + drop.video.src + ".jpg", "data-src": VID + drop.video.src + ".mp4" + (drop.video.start ? "#t=" + drop.video.start : "") });
    whenNear(vb, function () { wake(vb); }, chatBody());
    v.muted = true;
    if (drop.video.start) {
      // vuelve al inicio elegido en cada vuelta, no al primer fotograma
      v.loop = false;
      v.addEventListener("ended", function () { v.currentTime = drop.video.start; v.play(); });
    }
    vb.appendChild(v);
    vb.appendChild(el("span", { class: "msg__play", html: ICON.play }));
    vb.addEventListener("click", function () { openPlayer(VID + drop.video.src + ".mp4", VID + drop.video.src + ".jpg"); });
    autoplayInView(v);
    return vb;
  }

  // Vista previa de enlace a la prenda (del hilo a la tienda)
  function linkPreview(p) {
    var st = productState(p);
    var href = st === "out" ? "#archivo-title" : "#product-" + p.id;
    var a = el("a", { class: "msg__link" + (st === "out" ? " is-out" : ""), href: href }, [
      el("img", { "data-src": IMG + p.colorways[0].images[0], alt: "" }),
      el("span", { class: "msg__link-text" }, [
        el("strong", { text: p.name + " · " + p.type }),
        el("span", { text: st === "out" ? "Agotado · en el archivo" : euro(p.price) + " · " + TAG[st] }),
        el("small", { text: "nassville.com/tienda" })
      ])
    ]);
    whenNear(a, function () { wake(a); }, chatBody());
    if (st !== "out") a.addEventListener("click", function () {
      var card = document.getElementById("product-" + p.id);
      if (!card) return;
      card.classList.remove("is-target"); void card.offsetWidth; card.classList.add("is-target");
    });
    return a;
  }

  function renderThread() {
    var body = $("[data-thread]");
    if (!body) return;
    $("[data-chat-name]").textContent = C.name;
    $("[data-chat-status]").textContent = C.members;
    var pin = $("[data-chat-pinned]");
    pin.href = "#drop-" + C.pinned.drop;
    $("[data-chat-pinned-text]").textContent = C.pinned.text;

    body.appendChild(el("p", { class: "chat__notice", text: "Conversación de ejemplo: las personas y respuestas de la comunidad se sustituirán por reales." }));

    D.drops.forEach(function (drop) {
      var info = C.drops[drop.id] || { time: "", replies: [] };
      var block = el("div", { class: "chat__drop" + (drop.lead ? " chat__drop--lead" : ""), id: "drop-" + drop.id, "data-drop": "" });
      block.appendChild(el("div", { class: "chat__sep reveal" }, [
        el("span", { html: "<strong>" + drop.title + "</strong>" + (drop.stamp ? " · " + drop.stamp : "") })
      ]));

      // Tanda 1: nassville publica el drop
      var t1 = [typingRow(NASS_USER)];
      drop.lines.forEach(function (line, i) {
        t1.push(row(NASS_USER, i === 0, [el("p", { text: line }), meta(info.time, false)]));
      });
      t1.push(row(NASS_USER, false, [album(drop), meta(info.time, false)], { media: true, reactions: info.reactions }));
      if (drop.video) t1.push(row(NASS_USER, false, [videoMsg(drop), meta(info.time, false)], { media: true }));
      D.products.filter(function (p) { return p.drop === drop.id; }).forEach(function (p) {
        t1.push(row(NASS_USER, false, [linkPreview(p), meta(info.time, false)], { cls: "msg--link" }));
      });
      var batches = [t1];

      // Respuestas: cada cambio de persona es una tanda con su "escribiendo…"
      var prev = "nassville";
      (info.replies || []).forEach(function (r) {
        var who = r.from || r.user;
        var user = userOf(who);
        var parts = [];
        // quote: true cita el último mensaje de nassville; un número, esa frase concreta
        if (r.quote !== undefined && r.quote !== false) parts.push(quoteBox(NASS_USER, drop.lines[r.quote === true ? drop.lines.length - 1 : r.quote]));
        if (r.reply) {
          var quoted = (info.replies || []).filter(function (x) { return x.user === r.reply; })[0];
          if (quoted) parts.push(quoteBox(userOf(r.reply), quoted.text));
        }
        parts.push(el("p", { text: r.text }));
        parts.push(meta(r.time, false));
        if (who !== prev) batches.push([typingRow(user)]);
        batches[batches.length - 1].push(row(user, who !== prev, parts));
        prev = who;
      });

      batches.forEach(function (b, i) {
        var g = el("div", { class: "chat__batch", "data-batch": i });
        b.forEach(function (n) { g.appendChild(n); });
        block.appendChild(g);
      });
      body.appendChild(block);
    });
    paintLogos();
  }

  // Llegada de un drop: separador, y por cada tanda "escribiendo…" y sus mensajes
  var statusTimer = null;
  function setStatus(text, typing) {
    var s = $("[data-chat-status]");
    s.textContent = text;
    s.classList.toggle("is-typing", !!typing);
  }
  function playDrop(block) {
    var sep = $(".chat__sep", block);
    if (sep) sep.classList.remove("is-pending");
    var batches = $$(".chat__batch", block);
    var i = 0;
    function next() {
      if (i >= batches.length) { setStatus(C.members, false); return; }
      var b = batches[i++];
      var typing = $(".msg--typing", b);
      var msgs = $$(".msg.reveal", b);
      if (typing) {
        typing.hidden = false;
        setStatus(typing.dataset.who + " está escribiendo…", true);
      }
      setTimeout(function () {
        if (typing) typing.hidden = true;
        msgs.forEach(function (m, k) {
          m.style.setProperty("--d", Math.min(k * 90, 540) + "ms");
          m.classList.remove("is-pending");
        });
        setTimeout(next, Math.min(msgs.length * 90, 540) + 250);
      }, typing ? 700 : 0);
    }
    next();
  }

  /* ---------- Ventana del chat: scroll interno ---------- */
  function chatBody() { return $("[data-thread]"); }
  function scrollChatTo(top) {
    chatBody().scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
  }
  function scrollChatToBottom() { scrollChatTo(chatBody().scrollHeight); }

  function setupChatWindow() {
    var body = chatBody();
    if (!body) return;
    var down = $("[data-chat-down]");
    var chat = $(".chat");
    var onScroll = function () {
      var fromBottom = body.scrollHeight - body.scrollTop - body.clientHeight;
      down.classList.toggle("is-on", fromBottom > 240);
    };
    body.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    down.addEventListener("click", scrollChatToBottom);

    // ir a un drop dentro de la pantalla, sin saltar la página
    function goToDrop(id) {
      var target = document.getElementById("drop-" + id);
      if (!target) return;
      // la página solo se mueve si la pantalla del chat no está a la vista
      // (en ordenador la tablet puede ser más alta que la ventana)
      var r = chat.getBoundingClientRect();
      var barH = 64;
      if (r.top < barH - 40 || r.top > window.innerHeight * 0.6) {
        window.scrollTo({ top: r.top + window.scrollY - barH - 16, behavior: reduceMotion ? "auto" : "smooth" });
      }
      // posición del drop dentro de la ventana (no respecto a la página)
      scrollChatTo(target.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8);
    }
    $("[data-chat-pinned]").addEventListener("click", function (e) { e.preventDefault(); goToDrop(C.pinned.drop); });

    // índice de drops junto a la tablet (ordenador)
    var index = $("[data-drop-index]");
    if (index) {
      var links = D.drops.map(function (drop) {
        var b = el("button", { class: "drop-link" + (drop.lead ? " is-lead" : ""), type: "button", "data-drop": drop.id }, [
          el("img", { src: IMG + drop.images[0], alt: "", loading: "lazy" }),
          el("span", null, [
            el("strong", { text: drop.title }),
            el("small", { text: drop.lead ? "Nuevo drop" + (drop.stamp ? " · " + drop.stamp : "") : (drop.stamp || "Ver en el hilo") })
          ])
        ]);
        b.addEventListener("click", function () { goToDrop(drop.id); });
        index.appendChild(el("li", null, [b]));
        return b;
      });
      // marca el drop que se está leyendo
      var blocks = $$(".chat__drop", body);
      var markCurrent = function () {
        var top = body.getBoundingClientRect().top + 80;
        var current = blocks[0];
        blocks.forEach(function (b) { if (b.getBoundingClientRect().top <= top) current = b; });
        links.forEach(function (l) { l.setAttribute("aria-current", current && current.id === "drop-" + l.dataset.drop ? "true" : "false"); });
      };
      body.addEventListener("scroll", markCurrent, { passive: true });
      markCurrent();
    }
  }

  /* ---------- Barra de escribir del chat ---------- */
  function setupChatComposer() {
    var form = $("[data-chat-composer]");
    if (!form) return;
    var input = $("input", form);
    var log = $("[data-thread]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) { input.focus(); return; }
      input.value = "";
      var now = new Date();
      var hh = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      var mine = el("div", { class: "msg msg--own" }, [
        el("div", { class: "msg__bubble" }, [el("p", { text: text }), meta(hh, true)])
      ]);
      log.appendChild(mine);
      scrollChatToBottom();
      var typing = typingRow(NASS_USER);
      setTimeout(function () {
        $(".msg__checks", mine).classList.add("is-read");
        typing.hidden = false;
        log.appendChild(typing);
        setStatus("nassville está escribiendo…", true);
        scrollChatToBottom();
      }, 600);
      setTimeout(function () {
        typing.remove();
        setStatus(C.members, false);
        var go = el("a", { class: "btn btn--primary msg__cta", href: "#email", text: "Dejar mi email" });
        go.addEventListener("click", function () { setTimeout(function () { $("#email").focus({ preventScroll: true }); }, 500); });
        var reply = row(NASS_USER, true, [el("p", { text: C.autoReply }), go, meta(hh, false)]);
        reply.classList.remove("reveal");
        log.appendChild(reply);
        paintLogos();
        scrollChatToBottom();
      }, 1700);
    });
  }

  /* ---------- Vídeos: cargar y reproducir solo cuando se ven ---------- */
  var videoObserver = null;
  function autoplayInView(video) {
    if (reduceMotion) return; // con movimiento reducido se quedan en su póster
    if (!("IntersectionObserver" in window)) return;
    if (!videoObserver) {
      videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) {
            if (v.dataset.src && !v.getAttribute("src")) v.setAttribute("src", v.dataset.src);
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
            v.closest(".note") && v.closest(".note").classList.add("is-playing");
          } else {
            v.pause();
            v.closest(".note") && v.closest(".note").classList.remove("is-playing");
          }
        });
      }, { threshold: 0.35 });
    }
    videoObserver.observe(video);
  }

  /* ---------- Tienda ---------- */
  var bag = [];

  function stockState(stock) {
    var vals = Object.keys(stock).map(function (k) { return stock[k]; });
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    if (total === 0) return "out";
    if (total <= 8) return "low";
    return "in";
  }
  function productState(p) {
    var states = p.colorways.map(function (c) { return stockState(c.stock); });
    if (states.every(function (s) { return s === "out"; })) return "out";
    if (states.indexOf("in") > -1) return "in";
    if (states.indexOf("low") > -1) return "low";
    return "out";
  }

  var TAG = { in: "Disponible", low: "Últimas unidades", out: "Agotado" };

  /* ---------- Movimiento compartido: texto que cambia, marca de talla, vuelo a la bolsa ---------- */
  var ENTER = "cubic-bezier(0.22, 1, 0.36, 1)";

  // Cambia el texto en el sitio: sale hacia arriba con un leve desenfoque y el
  // nuevo entra desde abajo (receta "text state swap"). Interrumpible.
  // En un botón solo se mueve su texto (en una etiqueta interior): animar el
  // botón entero lo hacía desaparecer, fondo incluido, a mitad del cambio.
  function labelOf(node) {
    if (node.tagName !== "BUTTON" || node.querySelector("svg")) return node;
    var label = node.firstElementChild;
    if (!label || !label.classList.contains("btn__label") || node.childNodes.length !== 1) {
      label = el("span", { class: "btn__label", text: node.textContent });
      node.textContent = "";
      node.appendChild(label);
    }
    return label;
  }
  function swapText(node, text) {
    if (node && node._slot) node._slot();
    if (!node || node.textContent === text) return;
    if (reduceMotion || !node.animate || !node.isConnected) { node.textContent = text; return; }
    var token = (node._swap || 0) + 1;
    node._swap = token;
    var host = node;
    node = labelOf(host);
    var out = node.animate([
      { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
      { opacity: 0, transform: "translateY(-6px)", filter: "blur(3px)" }
    ], { duration: 110, easing: "ease-in", fill: "forwards" });
    out.onfinish = function () {
      if (host._swap !== token) return;
      out.cancel();
      if (!host.contains(node)) { host.textContent = text; return; } // el botón se reescribió entretanto
      node.textContent = text;
      node.animate([
        { opacity: 0, transform: "translateY(6px)", filter: "blur(3px)" },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
      ], { duration: 200, easing: ENTER });
    };
  }

  // Cambio de talla: el botón entero gira como el rodillo de una tragaperras.
  // Dos copias del botón giran juntas sobre un mismo eje situado detrás de
  // ellas (un cubo): la cara actual sube y se va hacia atrás y la nueva llega
  // siempre desde abajo, con un pequeño golpe al encajar. El botón real cambia
  // su texto al instante (lectores de pantalla) y solo se oculta durante el giro.
  var SLOT_MS = 560;
  function rgbOf(c) { var m = (c || "").match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]]; }
  function mixRgb(a, b, t) { return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(a[i] * t + b[i] * (1 - t)); }).join(",") + ")"; }
  // color de fondo real sobre el que está pintado un elemento
  function behind(node) {
    for (var n = node.parentElement; n; n = n.parentElement) {
      var c = getComputedStyle(n).backgroundColor;
      if (rgbOf(c)[3] > 0.5) return c;
    }
    return getComputedStyle(document.body).backgroundColor;
  }
  function slotButton(button, text) {
    if (!button) return;
    if (button._slot) button._slot();
    if (button.textContent === text) return;
    button._swap = (button._swap || 0) + 1; // anula un cambio de texto suave a medias
    button.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    if (reduceMotion || !button.animate || !button.offsetParent) { button.textContent = text; return; }
    var h = button.offsetHeight, w = button.offsetWidth;
    var bcs = getComputedStyle(button);
    // Ventana con la forma exacta del botón (tamaño, redondeo y sombra): no
    // cambia en ningún momento. Dentro gira el rodillo, como en una
    // tragaperras: la cara actual sube y se aleja y la nueva llega desde abajo.
    // (Un bloque que gira entero cambia de silueta: en diagonal es más alto y
    // el borde crecía y se reajustaba al terminar.)
    var win = el("span", { class: "slot-window", "aria-hidden": "true" });
    win.style.cssText = "position:absolute;margin:0;z-index:2;pointer-events:none;overflow:hidden;" +
      "left:" + button.offsetLeft + "px;top:" + button.offsetTop + "px;width:" + w + "px;height:" + h + "px;" +
      "border-radius:" + bcs.borderTopLeftRadius + ";box-shadow:" + bcs.boxShadow + ";";
    var place = "position:absolute;left:0;top:0;margin:0;width:" + w + "px;height:" + h + "px;" +
      "border-radius:0;box-shadow:none;transition:none;pointer-events:none;" +
      "-webkit-backface-visibility:hidden;backface-visibility:hidden;";
    function face(label, active) {
      var f = button.cloneNode(true);
      Array.prototype.slice.call(f.attributes).forEach(function (a) {
        if (/^(id|data-|aria-)/.test(a.name) && !(a.name === "aria-disabled" && !active)) f.removeAttribute(a.name);
      });
      f.setAttribute("aria-hidden", "true");
      f.tabIndex = -1;
      f.textContent = label;
      f.classList.add("slot-face");
      f.style.cssText += place;
      win.appendChild(f);
      return f;
    }
    // la cara que se va conserva su aspecto (atenuada si aún no había talla);
    // la nueva llega ya activa: elegir talla siempre habilita el botón
    var old = face(button.textContent, false), next = face(text, true);
    button.parentNode.insertBefore(win, button.nextSibling);
    // atenuado = semitransparente: en el rodillo se vería la otra cara a
    // través. La cara se pinta opaca con el color que tenía atenuada.
    if (old.getAttribute("aria-disabled") === "true") {
      var o = parseFloat(getComputedStyle(old).opacity), under = rgbOf(behind(button));
      var cs = getComputedStyle(old);
      old.style.opacity = "1";
      old.style.backgroundColor = mixRgb(rgbOf(cs.backgroundColor), under, o);
      old.style.color = mixRgb(rgbOf(cs.color), under, o);
    }
    // fondo de la ventana: el tambor en sombra (lo que asoma entre caras)
    win.style.backgroundColor = mixRgb(rgbOf(getComputedStyle(next).backgroundColor), [0, 0, 0], 0.55);
    // sombra del rodillo arriba y abajo de la ventana mientras gira
    var shade = el("span", { "aria-hidden": "true" });
    shade.style.cssText = "position:absolute;inset:0;pointer-events:none;" +
      "background:linear-gradient(180deg, rgba(0,0,0,0.32), rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.32));";
    win.appendChild(shade);
    button.textContent = text;
    // se oculta y se recupera sin transición: con el fundido de opacidad del
    // botón quedaba un hueco oscuro entre que se quitan las caras y reaparece
    button.style.transition = "none";
    button.style.opacity = "0";
    // coge un poco de impulso, gira y encaja con un rebote, como un rodillo
    var opt = { duration: SLOT_MS, easing: "cubic-bezier(0.5, -0.1, 0.25, 1.35)", fill: "both" };
    // eje del rodillo a media altura por detrás de las caras; en reposo la
    // cara coincide exactamente con el botón
    function roll(deg) { return "perspective(500px) translateZ(" + (-h / 2) + "px) rotateX(" + deg + "deg) translateZ(" + (h / 2) + "px)"; }
    old.animate([
      { transform: roll(0), filter: "brightness(1)" },
      { transform: roll(90), filter: "brightness(0.5)" }
    ], opt);
    var spin = next.animate([
      { transform: roll(-90), filter: "brightness(0.5)" },
      { transform: roll(0), filter: "brightness(1)" }
    ], opt);
    shade.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }],
      { duration: SLOT_MS, easing: "linear", fill: "both" });
    button._slot = function () {
      button._slot = null;
      button.style.opacity = "";
      void button.offsetWidth; // aplica la opacidad ya, antes de devolver la transición
      button.style.transition = "";
      win.remove();
    };
    spin.onfinish = function () { if (button._slot) button._slot(); };
  }

  // Marca de la talla elegida que se desliza entre tallas (como un selector segmentado)
  function sizeThumb(fieldset) {
    var thumb = el("span", { class: "sizes__thumb no-anim", "aria-hidden": "true" });
    // al final: el <legend> tiene que seguir siendo el primer hijo del <fieldset>
    fieldset.appendChild(thumb);
    // origen real de la marca en pantalla (en un <fieldset> con <legend> su
    // offsetTop no coincide con donde se pinta), medido una vez sin transform
    var origin = null;
    function measureOrigin() {
      var f = fieldset.getBoundingClientRect(), t = thumb.getBoundingClientRect();
      origin = { x: t.left - f.left, y: t.top - f.top };
    }
    function move(instant) {
      var input = $("input:checked", fieldset);
      if (!input) { thumb.classList.remove("is-on"); return; }
      var label = input.closest(".size");
      var first = !thumb.classList.contains("is-on");
      thumb.classList.toggle("no-anim", !!instant || first || reduceMotion);
      thumb.style.width = label.offsetWidth + "px";
      thumb.style.height = label.offsetHeight + "px";
      if (!origin) measureOrigin();
      var f = fieldset.getBoundingClientRect(), l = label.getBoundingClientRect();
      thumb.style.transform = "translate(" + (l.left - f.left - origin.x) + "px, " + (l.top - f.top - origin.y) + "px)";
      void thumb.offsetWidth;
      thumb.classList.remove("no-anim");
      thumb.classList.add("is-on");
      // la primera vez aparece con un pequeño crecimiento en su sitio
      if (first && !instant && !reduceMotion && thumb.animate) {
        thumb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
      }
    }
    fieldset.addEventListener("change", function () { move(false); });
    move(true);
    return move;
  }

  // La prenda vuela en arco desde el botón hasta la bolsa; al llegar, la bolsa
  // "la recoge" y el número sube. Dos ejes con curvas distintas dibujan el arco.
  function flyToBag(fromEl, imgSrc, done) {
    var inViewer = pv.dialog && pv.dialog.open;
    var target = inViewer ? $(".pview__bag", pv.dialog) : $(".chatbar [data-bag-button]");
    if (reduceMotion || !fromEl || !target || !document.body.animate) { done(); return; }
    var a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    var dx = b.left + b.width / 2 - x0, dy = b.top + b.height / 2 - y0;
    var img = el("span", { class: "fly__img" }, [el("img", { src: imgSrc, alt: "" })]);
    var yAxis = el("span", { class: "fly__y" }, [img]);
    var fly = el("div", { class: "fly", "aria-hidden": "true", style: "transform: translate(" + x0 + "px, " + y0 + "px)" }, [yAxis]);
    (inViewer ? pv.dialog : document.body).appendChild(fly);
    var D = 720;
    // horizontal: arranca despacio y acelera; vertical: sube rápido y se asienta → arco
    fly.animate([{ transform: "translate(" + x0 + "px, " + y0 + "px)" }, { transform: "translate(" + (x0 + dx) + "px, " + y0 + "px)" }],
      { duration: D, easing: "cubic-bezier(0.5, 0, 0.9, 1)", fill: "forwards" });
    yAxis.animate([{ transform: "translateY(0)" }, { transform: "translateY(" + dy + "px)" }],
      { duration: D, easing: "cubic-bezier(0.1, 0.65, 0.3, 1)", fill: "forwards" });
    var last = img.animate([
      { transform: "scale(0.6)", opacity: 0 },
      { transform: "scale(1.08)", opacity: 1, offset: 0.16 },
      { transform: "scale(0.9)", opacity: 1, offset: 0.55 },
      { transform: "scale(0.3)", opacity: 0.85 }
    ], { duration: D, easing: "linear", fill: "forwards" });
    last.onfinish = function () { fly.remove(); done(); };
  }

  // Confirmación en el propio botón ("Añadido ✓") y vuelta a su texto
  function confirmOn(button, restore) {
    swapText(button, "Añadido ✓");
    button.classList.add("is-done");
    clearTimeout(button._confirm);
    button._confirm = setTimeout(function () { button.classList.remove("is-done"); restore(); }, 1300);
  }

  // Falta la talla: las tallas se sacuden en el sitio, se marcan un instante y
  // el aviso aparece junto a ellas (receta "error state shake"), sin toast
  function nudgeSizes(fieldset, note) {
    if (note) swapText(note, "Elige una talla primero.");
    if (!reduceMotion && fieldset.animate) {
      fieldset.animate([
        { transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" },
        { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }
      ], { duration: 320, easing: "ease-out" });
    }
    fieldset.classList.add("is-nudged");
    clearTimeout(fieldset._nudge);
    fieldset._nudge = setTimeout(function () { fieldset.classList.remove("is-nudged"); }, 900);
    var first = $("input:not(:disabled)", fieldset);
    if (first) first.focus({ preventScroll: true });
  }

  // Marca del filtro activo que se desliza entre botones
  function chipsPill(bar) {
    var pill = el("span", { class: "chips__pill no-anim", "aria-hidden": "true" });
    bar.insertBefore(pill, bar.firstChild);
    function move(instant) {
      var active = $(".chip.is-active", bar);
      if (!active) return;
      pill.classList.toggle("no-anim", !!instant || reduceMotion);
      pill.style.width = active.offsetWidth + "px";
      pill.style.height = active.offsetHeight + "px";
      pill.style.transform = "translate(" + (active.offsetLeft - pill.offsetLeft) + "px, " + (active.offsetTop - pill.offsetTop) + "px)";
      void pill.offsetWidth;
      pill.classList.remove("no-anim");
    }
    window.addEventListener("resize", function () { move(true); });
    requestAnimationFrame(function () { move(true); });
    return move;
  }

  function renderShop() {
    var grid = $("[data-products]");
    var archive = $("[data-archive]");
    if (!grid) return;

    D.products.forEach(function (p, idx) {
      if (productState(p) === "out") return; // todo agotado: va al archivo
      grid.appendChild(productCard(p, idx === 0));
    });

    // agotado: cada color agotado es una tarjeta; el sello se estampa al verla
    var stampIndex = 0;
    D.products.forEach(function (p) {
      p.colorways.forEach(function (c, ci) {
        if (stockState(c.stock) !== "out") return;
        var card = el("button", { class: "soldcard", type: "button", "aria-label": "Ver " + p.name + " " + c.name + ", agotado", style: "--d:" + (stampIndex++ % 4) * 160 + "ms" }, [
          el("span", { class: "soldcard__media" }, [
            el("img", { src: IMG + c.images[0], alt: "", loading: "lazy" }),
            el("span", { class: "sold-stamp", "aria-hidden": "true", text: "Agotado" })
          ]),
          el("span", { class: "soldcard__body" }, [
            el("strong", { text: p.name }),
            el("span", { text: p.type + " · " + c.name }),
            el("s", { text: euro(p.price) })
          ])
        ]);
        // como en la tienda: al cerrar, la tarjeta se queda en la foto que se miraba
        card.addEventListener("click", function () {
          openProductViewer(p, ci, card._i || 0, $("img", card), function (i) {
            var im = $("img", card);
            if (card._i !== i && c.images[i]) { im.src = IMG + c.images[i]; card._i = i; }
            return im;
          });
        });
        archive.appendChild(el("li", null, [card]));
      });
    });
    if ("IntersectionObserver" in window && !reduceMotion) {
      var stampObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          stampObs.unobserve(e.target);
          e.target.classList.add("is-stamped");
        });
      }, { threshold: 0.55 });
      $$(".soldcard", archive).forEach(function (c) { stampObs.observe(c); });
    } else {
      $$(".soldcard", archive).forEach(function (c) { c.classList.add("is-stamped"); });
    }
  }

  function productCard(p, lead) {
    var state = { color: 0, image: 0, size: null };
    var firstAvailable = p.colorways.findIndex(function (c) { return stockState(c.stock) !== "out"; });
    state.color = firstAvailable > -1 ? firstAvailable : 0;

    var li = el("li", { class: "product reveal" + (lead ? " product--lead" : ""), id: "product-" + p.id, "data-category": p.category, "data-id": p.id });
    var media = el("div", { class: "product__media" });
    var tag = el("span", { class: "product__tag" });
    var editions = el("div", { class: "editions", role: "group", "aria-label": "Fotos de " + p.name });
    // carrusel deslizable: con el dedo, con el ratón (arrastrando) o con las flechas
    var track = el("div", { class: "product__track", tabindex: "0", role: "button", "aria-label": "Fotos de " + p.name + ". Desliza para ver más; pulsa para ampliar" });
    var CHEVRON_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    var CHEVRON_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
    var prevBtn = el("button", { class: "product__nav product__nav--prev", type: "button", "aria-label": "Foto anterior", html: CHEVRON_L });
    var nextBtn = el("button", { class: "product__nav product__nav--next", type: "button", "aria-label": "Foto siguiente", html: CHEVRON_R });
    var zoomIcon = el("span", { class: "product__zoom", "aria-hidden": "true", html: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>' });
    var body = el("div", { class: "product__body" });

    var top = el("div", { class: "product__top" }, [
      el("div", null, [
        el("h3", { class: "product__name", text: p.name }),
        el("p", { class: "product__type", text: p.type })
      ]),
      el("span", { class: "product__price", text: euro(p.price) })
    ]);
    var dropInfo = D.drops.filter(function (d) { return d.id === p.drop; })[0];
    body.appendChild(top);
    if (p.desc) body.appendChild(el("p", { class: "product__desc", text: p.desc }));

    var swatches = null;
    if (p.colorways.length > 1) {
      swatches = el("div", { class: "swatches", role: "group", "aria-label": "Color" });
      p.colorways.forEach(function (c, i) {
        var out = stockState(c.stock) === "out";
        var b = el("button", { class: "swatch" + (out ? " is-out" : ""), type: "button", "aria-pressed": "false", text: c.name + (out ? " · agotado" : "") });
        b.addEventListener("click", function () { state.color = i; state.image = 0; state.size = null; paint(); });
        swatches.appendChild(b);
      });
      body.appendChild(swatches);
    }

    var sizes = el("fieldset", { class: "sizes" });
    body.appendChild(sizes);
    var legend = el("p", { class: "sizes__legend", html: '<i class="size__low size__low--inline" aria-hidden="true"></i> quedan pocas' });
    body.appendChild(legend);

    var foot = el("div", { class: "product__foot" });
    var cta = el("button", { class: "btn btn--primary", type: "button" });
    var note = el("p", { class: "product__state", "aria-live": "polite" });
    foot.appendChild(cta);
    foot.appendChild(note);
    if (dropInfo) foot.appendChild(el("a", { class: "product__source", href: "#drop-" + dropInfo.id, text: "Ver el drop " + dropInfo.title + " en el hilo" }));
    body.appendChild(foot);

    media.appendChild(track);
    media.appendChild(tag);
    media.appendChild(zoomIcon);
    media.appendChild(prevBtn);
    media.appendChild(nextBtn);
    media.appendChild(editions);
    li.appendChild(media);
    li.appendChild(body);

    var imgs = [];

    function paint() {
      var c = p.colorways[state.color];
      var st = stockState(c.stock);

      // imágenes del carrusel
      track.innerHTML = "";
      imgs = c.images.map(function (src, i) {
        var now = i === 0 || li._near;
        var im = el("img", { src: now ? IMG + src : null, "data-src": now ? null : IMG + src, alt: i === 0 ? p.name + " " + p.type + ", color " + c.name : "", loading: "lazy", decoding: "async", draggable: "false" });
        track.appendChild(im);
        return im;
      });
      track.scrollLeft = 0;
      state.image = 0;
      editions.innerHTML = "";
      c.images.forEach(function (_, i) {
        var b = el("button", { type: "button", "aria-label": "Foto " + (i + 1) });
        b.addEventListener("click", function () { goImage(i); });
        editions.appendChild(b);
      });
      var many = c.images.length > 1;
      editions.hidden = !many;
      prevBtn.hidden = nextBtn.hidden = !many;
      showImage();

      tag.textContent = st === "out" ? "Agotado en " + c.name : TAG[st];
      tag.className = "product__tag" + (st === "low" ? " product__tag--low" : st === "out" ? " product__tag--out" : "");

      if (swatches) $$(".swatch", swatches).forEach(function (b, i) {
        b.classList.toggle("is-on", i === state.color);
        b.setAttribute("aria-pressed", i === state.color ? "true" : "false");
      });

      // tallas
      sizes.innerHTML = "";
      sizes.appendChild(el("legend", { text: "Talla" }));
      var name = "size-" + p.id;
      Object.keys(c.stock).forEach(function (s) {
        var n = c.stock[s];
        var input = el("input", { type: "radio", name: name, value: s, disabled: n === 0 ? "" : null });
        if (state.size === s) input.checked = true;
        // de una talla a otra el botón gira como una tragaperras
        input.addEventListener("change", function () { var was = state.size; state.size = s; paintCta(was !== s); });
        var label = el("label", { class: "size", title: n === 0 ? "Agotada" : n <= 3 ? "Quedan " + n : "" }, [
          input,
          el("span", { text: s })
        ]);
        if (n > 0 && n <= 3) label.appendChild(el("i", { class: "size__low", "aria-hidden": "true" }));
        if (n === 0) label.appendChild(el("span", { class: "sr-only", text: " agotada" }));
        else if (n <= 3) label.appendChild(el("span", { class: "sr-only", text: " últimas unidades" }));
        sizes.appendChild(label);
      });
      legend.hidden = !Object.keys(c.stock).some(function (k) { return c.stock[k] > 0 && c.stock[k] <= 3; });
      sizeThumb(sizes);
      paintCta();
    }

    function paintCta(slot) {
      var c = p.colorways[state.color];
      var st = stockState(c.stock);
      if (st === "out") {
        swapText(cta, "Avísame si vuelve");
        cta.className = "btn btn--ghost";
        cta.disabled = false;
        cta.dataset.mode = "notify";
        swapText(note, "Este color se ha agotado.");
        return;
      }
      cta.className = "btn btn--primary";
      cta.dataset.mode = "add";
      if (!state.size) {
        swapText(cta, "Elige tu talla");
        cta.setAttribute("aria-disabled", "true");
        swapText(note, st === "low" ? "Pocas unidades en algunas tallas." : "");
      } else {
        var left = c.stock[state.size];
        (slot ? slotButton : swapText)(cta, "Lo quiero · " + state.size);
        cta.removeAttribute("aria-disabled");
        swapText(note, left <= 3 ? "Quedan " + left + " en " + state.size + "." : "Disponible en " + state.size + ".");
      }
    }

    function showImage() {
      $$("button", editions).forEach(function (b, i) { b.classList.toggle("is-on", i === state.image); });
    }
    // al cerrar la vista ampliada, el carrusel se queda en la foto que se
    // estaba mirando (sin animar: ocurre debajo de la carta que vuelve)
    function showFromViewer(i) {
      var im = imgs[i];
      if (!im) return null;
      if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); }
      state.image = i;
      track.scrollTo({ left: i * track.clientWidth, behavior: "instant" });
      showImage();
      return im;
    }
    function goImage(i) {
      var n = imgs.length;
      i = Math.max(0, Math.min(n - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    }
    track.addEventListener("scroll", function () {
      var i = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      if (i !== state.image) { state.image = i; showImage(); }
    }, { passive: true });
    prevBtn.addEventListener("click", function () { goImage(state.image - 1); });
    nextBtn.addEventListener("click", function () { goImage(state.image + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); goImage(state.image + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goImage(state.image - 1); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProductViewer(p, state.color, state.image, imgs[state.image], showFromViewer); }
    });
    // ratón: arrastrar para deslizar; un clic sin arrastre amplía. En táctil el
    // deslizamiento es nativo y un toque simple amplía.
    var tDrag = null;
    track.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return;
      tDrag = { id: e.pointerId, x: e.clientX, sl: track.scrollLeft, moved: false, mouse: e.pointerType === "mouse" };
    });
    track.addEventListener("pointermove", function (e) {
      if (!tDrag || e.pointerId !== tDrag.id) return;
      var dx = e.clientX - tDrag.x;
      if (Math.abs(dx) > 6) tDrag.moved = true;
      if (tDrag.mouse && tDrag.moved) {
        if (!track.classList.contains("is-dragging")) { track.classList.add("is-dragging"); track.setPointerCapture(e.pointerId); }
        track.scrollLeft = tDrag.sl - dx;
      }
    });
    track.addEventListener("pointerup", function (e) {
      if (!tDrag || e.pointerId !== tDrag.id) return;
      var d = tDrag; tDrag = null;
      if (track.classList.contains("is-dragging")) {
        track.classList.remove("is-dragging");
        var dx = e.clientX - d.x;
        var from = Math.round(d.sl / Math.max(track.clientWidth, 1));
        goImage(from + (dx < -40 ? 1 : dx > 40 ? -1 : 0));
      }
      if (!d.moved) openProductViewer(p, state.color, state.image, imgs[state.image], showFromViewer);
    });
    track.addEventListener("pointercancel", function () { tDrag = null; track.classList.remove("is-dragging"); });

    cta.addEventListener("click", function () {
      var c = p.colorways[state.color];
      if (cta.dataset.mode === "notify") {
        toast("Te avisamos si vuelve <strong>" + p.name + " · " + c.name + "</strong>. Deja tu email abajo.");
        return;
      }
      if (!state.size) { nudgeSizes(sizes, note); return; }
      bag.push({ id: p.id, color: c.name, size: state.size });
      // la prenda vuela a la bolsa y el botón confirma en el sitio
      flyToBag(cta, IMG + c.images[state.image || 0], updateBag);
      confirmOn(cta, paintCta);
      toast("<strong>" + p.name + "</strong> · " + c.name + " · " + state.size + " a tu bolsa.");
    });

    paint();
    whenNear(li, function () { li._near = true; wake(track); });
    return li;
  }

  function updateBag() {
    var n = bag.length;
    $$("[data-bag-button]").forEach(function (btn) {
      btn.classList.toggle("has-items", n > 0);
      btn.setAttribute("aria-label", "Bolsa, " + n + (n === 1 ? " prenda" : " prendas"));
      btn.classList.remove("bump");
      void btn.offsetWidth;
      btn.classList.add("bump");
    });
    // el número sube rodando (o baja, si algún día se quitan prendas)
    $$("[data-bag-count]").forEach(function (count) {
      var prev = +count.dataset.n || 0;
      count.dataset.n = n;
      count.innerHTML = '<span class="bag__digit" style="--dir:' + (n >= prev ? 1 : -1) + '">' + n + "</span>";
    });
  }

  function setupBagButton() {
    $$("[data-bag-button]").forEach(function (b) { b.addEventListener("click", function () {
      if (!bag.length) toast("Tu bolsa está vacía. Mira <a href=\"#tienda\">lo que queda</a>.");
      else toast("Llevas " + bag.length + (bag.length === 1 ? " prenda" : " prendas") + ". El pago llega muy pronto.");
    }); });
  }

  /* ---------- Filtros ---------- */
  /* ---------- Vídeo del inicio: solo se descarga el que toca a esta pantalla ---------- */
  function setupHeroVideo() {
    var wide = $(".hero__video--wide"), tall = $(".hero__video--tall");
    if (!wide || !tall) return;
    var mq = window.matchMedia("(max-width: 720px)");
    function pick() {
      var on = mq.matches ? tall : wide, off = mq.matches ? wide : tall;
      off.pause();
      on.preload = "auto";
      var p = on.play(); if (p && p.catch) p.catch(function () {});
    }
    if (mq.addEventListener) mq.addEventListener("change", pick);
    pick();
  }

  function setupFilters() {
    var bar = $("[data-filters]");
    if (!bar) return;
    var empty = $("[data-products-empty]");

    var movePill = chipsPill(bar);
    var MOVE = "cubic-bezier(0.25, 1, 0.5, 1)";

    function apply(filter) {
      $$(".chip", bar).forEach(function (c) {
        var on = c.dataset.filter === filter;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      movePill(false);

      var cards = $$(".product");
      var show = function (c) { return filter === "todo" || c.dataset.category === filter; };
      // un clic rápido interrumpe el cambio anterior y parte del estado actual
      cards.forEach(function (c) { (c.getAnimations ? c.getAnimations() : []).forEach(function (a) { if (a.id === "flt") a.cancel(); }); });
      var visible = function (c) { return !c.classList.contains("is-hidden"); };
      var leaving = cards.filter(function (c) { return visible(c) && !show(c); });
      var entering = cards.filter(function (c) { return !visible(c) && show(c); });
      var staying = cards.filter(function (c) { return visible(c) && show(c); });

      function commit() {
        var before = staying.map(function (c) { return c.getBoundingClientRect(); });
        cards.forEach(function (c) { c.classList.toggle("is-hidden", !show(c)); });
        leaving.forEach(function (c) { (c.getAnimations ? c.getAnimations() : []).forEach(function (a) { if (a.id === "flt") a.cancel(); }); });
        empty.hidden = cards.some(show);
        if (reduceMotion || !document.body.animate) return;
        // las que se quedan se deslizan desde donde estaban (FLIP)
        staying.forEach(function (c, i) {
          var a = before[i], b = c.getBoundingClientRect();
          var dx = a.left - b.left, dy = a.top - b.top;
          if (Math.abs(a.width - b.width) > 4) {
            c.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 300, easing: "ease-out", id: "flt" });
          } else if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            c.animate([{ transform: "translate(" + dx + "px, " + dy + "px)" }, { transform: "none" }], { duration: 420, easing: MOVE, id: "flt" });
          }
        });
        // las nuevas entran en cascada, sin aparecer de la nada
        entering.forEach(function (c, i) {
          c.animate([
            { opacity: 0, transform: "translateY(16px) scale(0.97)" },
            { opacity: 1, transform: "none" }
          ], { duration: 380, delay: 60 + i * 50, easing: ENTER, fill: "backwards", id: "flt" });
        });
      }

      if (reduceMotion || !leaving.length || !document.body.animate) { commit(); return; }
      // las que se van salen rápido (la salida es más corta que la entrada)
      var outs = leaving.map(function (c) {
        return c.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.96)" }], { duration: 160, easing: "ease-in", fill: "forwards", id: "flt" });
      });
      outs[0].onfinish = commit;
    }

    bar.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (b) apply(b.dataset.filter);
    });
    $("[data-filter-reset]").addEventListener("click", function () { apply("todo"); });
    $$("[data-filter-link]").forEach(function (a) {
      a.addEventListener("click", function () { apply(a.dataset.filterLink); });
    });
  }

  /* ---------- Notas de vídeo y películas ---------- */
  function renderVideos() {
    var notes = $("[data-notes]");
    var films = $("[data-films]");
    D.notes.forEach(function (src) {
      var b = el("button", { class: "note", type: "button", "aria-label": "Reproducir nota de vídeo con sonido" });
      var v = el("video", { muted: "", loop: "", playsinline: "", preload: "none", "data-poster": VID + src + ".jpg", "data-src": VID + src + ".mp4" });
      whenNear(b, function () { wake(b); });
      v.muted = true;
      v.addEventListener("loadedmetadata", function () {
        var s = Math.round(v.duration);
        time.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      });
      var time = el("span", { class: "note__time", text: "" });
      b.appendChild(v);
      b.appendChild(time);
      b.addEventListener("click", function () { openPlayer(VID + src + ".mp4", VID + src + ".jpg"); });
      notes.appendChild(el("li", null, [b]));
      autoplayInView(v);
    });

    D.films.forEach(function (f, i) {
      var b = el("button", { class: "film" + (i === 0 ? " film--wide" : ""), type: "button", "aria-label": "Ver " + f.title });
      b.appendChild(el("img", { src: VID + f.src + ".jpg", alt: "", loading: "lazy" }));
      b.appendChild(el("span", { class: "film__info" }, [
        el("span", null, [
          el("span", { class: "film__title", text: f.title }),
          el("span", { class: "film__note", text: f.note })
        ]),
        el("span", { class: "film__play", html: ICON.play })
      ]));
      b.addEventListener("click", function () { openPlayer(VID + f.src + ".mp4", VID + f.src + ".jpg"); });
      films.appendChild(el("li", null, [b]));
    });
  }

  /* ---------- Reproductor y visor ---------- */
  var player = $("[data-player]");
  var playerVideo = $("[data-player-video]");
  var lastFocus = null;

  function openPlayer(src, poster) {
    lastFocus = document.activeElement;
    playerVideo.poster = poster || "";
    playerVideo.src = src;
    if (typeof player.showModal === "function") player.showModal(); else player.setAttribute("open", "");
    var p = playerVideo.play();
    if (p && p.catch) p.catch(function () {});
  }
  function closePlayer() {
    playerVideo.pause();
    playerVideo.removeAttribute("src");
    playerVideo.load();
    if (player.open) player.close();
    if (lastFocus) lastFocus.focus();
  }
  $("[data-player-close]").addEventListener("click", closePlayer);
  player.addEventListener("click", function (e) { if (e.target === player) closePlayer(); });
  player.addEventListener("cancel", function (e) { e.preventDefault(); closePlayer(); });

  var viewer = $("[data-viewer]");
  var viewerImg = $("[data-viewer-img]");
  var gallery = { list: [], i: 0, title: "" };
  function openViewer(list, i, title) {
    lastFocus = document.activeElement;
    gallery = { list: list, i: i, title: title };
    showInViewer();
    if (typeof viewer.showModal === "function") viewer.showModal(); else viewer.setAttribute("open", "");
  }
  function showInViewer() {
    viewerImg.src = IMG + gallery.list[gallery.i];
    viewerImg.alt = gallery.title + ", foto " + (gallery.i + 1) + " de " + gallery.list.length;
  }
  function closeViewer() { if (viewer.open) viewer.close(); if (lastFocus) lastFocus.focus(); }
  $("[data-viewer-close]").addEventListener("click", closeViewer);
  viewer.addEventListener("click", function (e) {
    if (e.target === viewer) return closeViewer();
    if (e.target === viewerImg) { gallery.i = (gallery.i + 1) % gallery.list.length; showInViewer(); }
  });
  viewer.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { gallery.i = (gallery.i + 1) % gallery.list.length; showInViewer(); }
    if (e.key === "ArrowLeft") { gallery.i = (gallery.i - 1 + gallery.list.length) % gallery.list.length; showInViewer(); }
  });

  /* ---------- Toast ---------- */
  var toastEl = $("[data-toast]");
  var toastTimer = null;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3200);
  }

  /* ---------- Redes ---------- */
  function renderSocial() {
    var feed = $("[data-feed]");
    D.social.feed.forEach(function (src) {
      feed.appendChild(el("li", null, [
        el("a", { href: D.social.instagram, target: "_blank", rel: "noopener", "aria-label": "Abrir Instagram de nassville" }, [
          el("img", { src: IMG + src, alt: "", loading: "lazy", decoding: "async" })
        ])
      ]));
    });
  }

  /* ---------- Barra de escribir (email) ---------- */
  function setupComposer() {
    var form = $("[data-composer]");
    var input = $("#email", form);
    var err = $("[data-composer-error]");
    var sent = $("[data-composer-sent]");
    var send = $(".composer__send", form);
    var consent = $("[data-composer-consent]", form);
    consent.addEventListener("change", function () { if (consent.checked && err.dataset.kind === "consent") err.hidden = true; });
    // al volver a escribir, el check vuelve a ser la flecha de enviar
    input.addEventListener("input", function () {
      if (!send.classList.contains("is-sent")) return;
      send.classList.remove("is-sent");
      send.setAttribute("aria-label", "Enviar");
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        err.textContent = v ? "Ese email no parece correcto. Revisa que tenga @ y dominio." : "Escribe tu email para que te avisemos.";
        err.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      // el consentimiento tiene que ser expreso: sin la casilla no se apunta a nadie
      if (!consent.checked) {
        err.textContent = "Marca la casilla para que podamos escribirte.";
        err.dataset.kind = "consent";
        err.hidden = false;
        input.removeAttribute("aria-invalid");
        consent.focus();
        return;
      }
      err.hidden = true;
      err.dataset.kind = "";
      input.removeAttribute("aria-invalid");
      sent.innerHTML = "";
      var out = el("div", { class: "bubble bubble--out" }, [el("p", { text: v })]);
      sent.appendChild(out);
      sent.appendChild(el("span", { class: "stamp stamp--out", text: "Entregado" }));
      input.value = "";
      consent.checked = false; // el siguiente email necesita su propio consentimiento
      send.classList.add("is-sent");
      send.setAttribute("aria-label", "Enviado");
      setTimeout(function () {
        sent.appendChild(el("div", { class: "bubble bubble--in" }, [el("p", { text: "Apuntado. Te escribimos antes del próximo drop." })]));
      }, reduceMotion ? 0 : 900);
    });
  }

  /* ---------- Barra superior y menú ---------- */
  function setupChrome() {
    var bar = $("[data-chatbar]");
    var hero = $(".hero");
    var menuBtn = $("[data-menu-button]");
    var sheet = $("[data-menu]");

    var onScroll = function () {
      bar.classList.toggle("is-solid", window.scrollY > hero.offsetHeight * 0.6);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      sheet.hidden = !open;
      if (open) bar.classList.add("is-solid"); else onScroll();
    }
    menuBtn.addEventListener("click", function () { setMenu(sheet.hidden); });
    $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) { setMenu(false); menuBtn.focus(); } });

    // sección actual en la navegación
    if ("IntersectionObserver" in window) {
      var links = $$(".chatbar__nav a");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      ["hilo", "tienda", "videos", "conocenos", "redes"].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  /* ---------- Hero: "escribiendo..." y llega el mensaje ---------- */
  function heroMessage() {
    var hero = $(".hero");
    var bubble = $("[data-hero-bubble]");
    var notif = $("[data-hero-notif]");
    var closeBtn = $("[data-hero-close]");
    var EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
    var anim = null;

    // recorte que deja visible solo el hueco de la notificación (abajo a la izquierda)
    function notifInset() {
      var nb = notif.getBoundingClientRect(), bb = bubble.getBoundingClientRect();
      return "inset(" + Math.max(bb.height - nb.height, 0) + "px " + Math.max(bb.width - nb.width, 0) + "px 0px 0px round 18px)";
    }
    function parts() { return Array.prototype.filter.call(bubble.children, function (c) { return c !== closeBtn; }).concat([closeBtn]); }

    // la notificación crece hasta ser el mensaje: recorte + color, y el contenido en cascada
    function open() {
      if (hero.classList.contains("is-notif-open")) return;
      if (anim) anim.cancel();
      bubble.hidden = false;
      hero.classList.add("is-notif-open");
      notif.setAttribute("aria-expanded", "true");
      if (!reduceMotion) {
        anim = bubble.animate([
          { clipPath: notifInset(), backgroundColor: "rgb(28, 33, 74)" },
          { clipPath: "inset(0px 0px 0px 0px round 0px)", backgroundColor: "rgb(228, 228, 232)" }
        ], { duration: 560, easing: EASE });
        parts().forEach(function (el, i) {
          el.animate([
            { opacity: 0, transform: "translateY(10px)" },
            { opacity: 1, transform: "none" }
          ], { duration: 380, delay: 170 + i * 60, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" });
        });
      }
      var first = $("a", bubble);
      if (first) first.focus({ preventScroll: true });
    }

    // y al cerrar vuelve a encogerse en la notificación
    function close(restoreFocus) {
      if (!hero.classList.contains("is-notif-open")) return;
      hero.classList.remove("is-notif-open");
      notif.setAttribute("aria-expanded", "false");
      var done = function () { bubble.hidden = true; anim = null; };
      if (reduceMotion) done();
      else {
        if (anim) anim.cancel();
        parts().forEach(function (el) { el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }); });
        anim = bubble.animate([
          { clipPath: "inset(0px 0px 0px 0px round 0px)", backgroundColor: "rgb(228, 228, 232)" },
          { clipPath: notifInset(), backgroundColor: "rgb(28, 33, 74)" }
        ], { duration: 420, easing: EASE });
        anim.onfinish = function () {
          parts().forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); });
          done();
        };
      }
      if (restoreFocus) notif.focus({ preventScroll: true });
    }

    notif.addEventListener("click", open);
    closeBtn.addEventListener("click", function () { close(true); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(true); });
    document.addEventListener("pointerdown", function (e) { if (!e.target.closest(".hero__drop")) close(false); });

    // la notificación llega un momento después de cargar
    if (reduceMotion) notif.classList.add("is-in");
    else setTimeout(function () { notif.classList.add("is-in"); }, 1200);
  }

  /* ---------- Vista ampliada de producto: cartas que se voltean ---------- */
  // La foto activa es la carta del centro, boca arriba; las de los lados están
  // boca abajo. Al pasar de foto, la del centro se voltea y se va a un lado y
  // la siguiente se voltea al llegar al centro.
  var pv = {
    dialog: $("[data-pview]"),
    stage: $("[data-pview-stage]"),
    deck: $("[data-pview-deck]"),
    video: $("[data-pview-video]"),
    name: $("[data-pview-name]"),
    meta: $("[data-pview-meta]"),
    count: $("[data-pview-count]"),
    cta: $("[data-pview-cta]"),
    stamp: $("[data-pview-stamp]"),
    prev: $("[data-pview-prev]"),
    next: $("[data-pview-next]"),
    product: null, colorway: null, cards: [], i: 0, opener: null
  };

  function pvOffset(k) {
    var n = pv.cards.length;
    var o = ((k - pv.i) % n + n) % n;
    if (o > n / 2) o -= n;
    return o;
  }

  // Pose de una carta según su distancia al centro (o puede ser fraccionaria
  // mientras se arrastra): se desplaza, se aleja, gira y encoge a la vez, así
  // que la carta va volteándose con el dedo y al soltar sigue desde ahí.
  var MOVE_EASE = "transform 760ms cubic-bezier(0.65, 0, 0.35, 1)";   // flechas, teclado, clic
  var RELEASE_EASE = "transform 640ms cubic-bezier(0.22, 1, 0.36, 1)"; // al soltar: continúa y frena
  function pvGap() {
    var w = pv.cards[0] ? pv.cards[0].offsetWidth : 300;
    return w * (window.innerWidth <= 720 ? 0.86 : 0.8);
  }
  function pvPose(card, o, gap) {
    var a = Math.min(Math.abs(o), 2), s = o < 0 ? -1 : 1;
    var near = Math.min(a, 1), far = Math.max(a - 1, 0);
    var x = s * gap * (near + far * 0.7);
    var z = -180 * near - 180 * far;
    var rot = -180 * s * near;          // derecha boca abajo hacia un lado, izquierda hacia el otro
    var scale = 1 - 0.16 * near - 0.14 * far;
    card.style.transform = "translate(-50%, -50%) translateX(" + x.toFixed(1) + "px) translateZ(" + z.toFixed(1) + "px) rotateY(" + rot.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
    card.style.setProperty("--face-o", Math.abs(o) <= 1.35 ? 1 : Math.max(0, 1 - (Math.abs(o) - 1.35) / 0.5));
    card.style.zIndex = String(10 - Math.round(Math.abs(o) * 2));
  }

  // progress: fracción del paso en curso al arrastrar (positivo = hacia la siguiente)
  function pvLayout(instant, progress, transition) {
    var n = pv.cards.length;
    var gap = pvGap();
    progress = progress || 0;
    pv.cards.forEach(function (card, k) {
      var base = pvOffset(k);
      var o = base - progress;
      // una carta que da la vuelta al mazo (de un extremo al otro) no se anima
      var jump = card._o !== undefined && Math.abs(o - card._o) > 1.5;
      var still = reduceMotion || instant || jump;
      card.style.transition = still ? "none" : (transition || MOVE_EASE);
      // sin animación tampoco se anima la transparencia de las caras: así las
      // cartas de reserva no se ven un instante al abrir y luego se desvanecen
      card.classList.toggle("no-anim", !!still);
      pvPose(card, o, gap);
      card._o = o;
      card.dataset.pos = String(Math.max(-2, Math.min(2, base)));
      card.setAttribute("aria-hidden", base === 0 ? "false" : "true");
      card.tabIndex = Math.abs(base) === 1 ? 0 : -1;
    });
    pv.count.textContent = (pv.i + 1) + " / " + n;
    pv.prev.disabled = pv.next.disabled = n < 2;
  }

  function pvGo(step, transition) {
    pvEndEmerge(); // si se mueve el mazo mientras aún llega, la llegada termina ya
    var n = pv.cards.length;
    if (n < 2) return;
    pv.i = (pv.i + step + n) % n;
    pvLayout(false, 0, transition);
  }

  // La foto tocada crece hasta ser la carta central y las demás cartas se
  // abren en abanico desde detrás de ella; al cerrar, la carta vuelve a
  // encogerse sobre su foto. Solo se animan transform y opacity (van en la
  // GPU), así que el vídeo o las fotos que se cargan no lo entrecortan.
  var FLY_EASE = "cubic-bezier(0.3, 0, 0.1, 1)"; // arranca suave, frena largo y sin quedarse colgado
  var FLY_MS = 480;
  function pvVisible(node) {
    if (!node || !node.isConnected) return null;
    var r = node.getBoundingClientRect();
    if (r.width < 8 || r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return null;
    return r;
  }
  // Marco con la esquina y la sombra de la carta, colocado en "box" y que
  // arranca transformado sobre "far". La foto de dentro se recalcula a cada
  // 10 % del viaje para cubrir siempre el marco sin deformarse, aunque la foto
  // de origen tenga otra proporción que la carta.
  function pvGhost(src, natural, filter, box, far) {
    var sx = far.width / box.width, sy = far.height / box.height;
    var W = natural.w || box.width, H = natural.h || box.height;
    var base = Math.max(box.width / W, box.height / H); // la foto cubriendo el marco sin escalar
    // la foto a su proporción real, centrada y cubriendo el marco
    var fit = "left:" + (box.width - W * base) / 2 + "px;top:" + (box.height - H * base) / 2 + "px;width:" + W * base + "px;height:" + H * base + "px";
    var colour = el("img", { src: src, alt: "", style: fit });
    var grey = filter ? el("img", { src: src, alt: "", style: fit + ";filter:" + filter }) : null;
    var ghost = el("div", { class: "pv-ghost", "aria-hidden": "true",
      style: "left:" + box.left + "px;top:" + box.top + "px;width:" + box.width + "px;height:" + box.height + "px" }, grey ? [grey, colour] : [colour]);
    var dx = (far.left + far.width / 2) - (box.left + box.width / 2), dy = (far.top + far.height / 2) - (box.top + box.height / 2);
    // p = 0 en "far", 1 en "box"
    var boxK = [], imgK = [];
    for (var i = 0; i <= 10; i++) {
      var p = i / 10;
      var bx = sx + (1 - sx) * p, by = sy + (1 - sy) * p;
      var cover = Math.max(bx * box.width / W, by * box.height / H) / base;
      boxK.push({ offset: p, transform: "translate(" + (dx * (1 - p)) + "px, " + (dy * (1 - p)) + "px) scale(" + bx + ", " + by + ")" });
      imgK.push({ offset: p, transform: "scale(" + (cover / bx) + ", " + (cover / by) + ")" });
    }
    return { el: ghost, imgs: grey ? [grey, colour] : [colour], colour: colour, grey: grey, boxK: boxK, imgK: imgK };
  }
  function pvFly(g, toFar, opt) {
    function flip(k) { return k.map(function (f) { return { offset: 1 - f.offset, transform: f.transform }; }).reverse(); }
    g.imgs.forEach(function (im) { im.animate(toFar ? flip(g.imgK) : g.imgK, opt); });
    return g.el.animate(toFar ? flip(g.boxK) : g.boxK, opt);
  }
  function natural(img) { return { w: img.naturalWidth, h: img.naturalHeight }; }
  function greyOf(img) { var f = getComputedStyle(img).filter; return f && f !== "none" ? f : ""; }

  function pvEmerge(origin) {
    var from = pvVisible(origin);
    var center = pv.cards[pv.i];
    if (!from || !center || reduceMotion || !center.animate) return false;
    var to = center.getBoundingClientRect();
    var g = pvGhost(origin.currentSrc || origin.src, natural(origin), greyOf(origin), to, from);
    pv.dialog.appendChild(g.el);
    pv.dialog.classList.add("is-emerging");
    var opt = { duration: FLY_MS, easing: FLY_EASE, fill: "both" };
    var fly = pvFly(g, false, opt);
    if (g.grey) g.colour.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FLY_MS, easing: "ease-in-out", fill: "both" });
    // mesa vacía mientras la foto viaja; las demás salen de detrás cuando ya la tapa
    var centerT = center.style.transform;
    pv.cards.forEach(function (card) { card.style.visibility = "hidden"; });
    pv.emerge = { ghost: g.el, timer: setTimeout(function () {
      pv.cards.forEach(function (card, k) {
        var o = pvOffset(k);
        if (o === 0) return;
        card.style.visibility = "";
        card.animate([{ transform: centerT + " scale(0.92)" }, { transform: card.style.transform }],
          { duration: 420, delay: (Math.abs(o) - 1) * 50, easing: ENTER, fill: "backwards", id: "emerge" });
      });
    }, FLY_MS * 0.45) };
    fly.onfinish = pvEndEmerge;
    return true;
  }
  // termina la llegada (al aterrizar, o antes si se mueve el mazo o se cierra)
  function pvEndEmerge() {
    var e = pv.emerge;
    if (!e) return;
    pv.emerge = null;
    clearTimeout(e.timer);
    pv.cards.forEach(function (card) {
      card.style.visibility = "";
      card.getAnimations().forEach(function (a) { if (a.id === "emerge") a.finish(); });
    });
    e.ghost.remove();
    // "is-emerging" se queda hasta cerrar: quitarlo reiniciaba el fundido
    // general de la ventana y se veía un parpadeo en negro al terminar
    if (!pv.closing) pvAfterOpen();
  }
  // lo pesado (vídeo de fondo y el resto de fotos) espera a que la carta aterrice
  function pvAfterOpen() {
    $$("img[data-src]", pv.deck).forEach(function (im) { im.src = im.dataset.src; im.removeAttribute("data-src"); });
    var v = pv.video;
    if (v.dataset.src && !reduceMotion) {
      v.src = v.dataset.src;
      v.removeAttribute("data-src");
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    }
  }

  function openProductViewer(p, ci, start, origin, onReturn) {
    var c = p.colorways[ci];
    var st = stockState(c.stock);
    pv.product = p; pv.colorway = ci; pv.i = start || 0;
    pv.opener = document.activeElement;
    pv.origin = origin || null;
    pv.onReturn = onReturn || null;
    pv.dialog.style.setProperty("--tint", c.tint || "#262c57");
    pv.name.textContent = p.name;
    pv.meta.textContent = p.type + " · " + c.name + " · " + euro(p.price);
    pv.stamp.hidden = st !== "out";
    pv.cta.textContent = st === "out" ? "Avísame si vuelve" : "Elegir talla";
    pv.cta.className = "btn pview__cta " + (st === "out" ? "btn--ghost" : "btn--primary");
    pvSheet(false);
    pv.size = null;
    pvRenderSizes();

    // fondo: vídeo de la prenda con el filtro de su color
    if (c.video) {
      pv.video.poster = VID + c.video.src + ".jpg";
      pv.video.dataset.src = VID + c.video.src + ".mp4" + (c.video.start ? "#t=" + c.video.start : "");
      pv.video._start = c.video.start || 0;
    }

    pv.deck.innerHTML = "";
    var n = c.images.length;
    pv.cards = c.images.map(function (src, k) {
      // la central y sus vecinas ya; las de reserva cuando la carta aterriza
      var o = ((k - pv.i) % n + n) % n; if (o > n / 2) o -= n;
      var near = Math.abs(o) <= 1;
      var card = el("div", { class: "pcard", role: "group", "aria-roledescription": "carta", "aria-label": "Foto " + (k + 1) + " de " + n }, [
        el("div", { class: "pcard__face pcard__front" }, [
          el("img", { src: near ? IMG + src : null, "data-src": near ? null : IMG + src, alt: k === 0 ? p.name + " " + p.type + ", " + c.name : "", decoding: "async" })
        ]),
        el("div", { class: "pcard__face pcard__back", "aria-hidden": "true" }, [
          el("span", { class: "pcard__emblem", "data-logo": "emblem" }),
          el("span", { class: "pcard__word", "data-logo": "word" })
        ])
      ]);
      // tocar una carta lateral la trae al centro
      card.addEventListener("click", function () { var o = pvOffset(k); if (o !== 0 && !pv.dragged) pvGo(o); });
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); var o = pvOffset(k); if (o) pvGo(o); } });
      pv.deck.appendChild(card);
      return card;
    });
    paintLogos();

    // al bloquear el scroll desaparece la barra: se compensa su ancho para que
    // la página no se recoloque (la foto de origen sigue en su sitio al cerrar)
    var bar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.paddingRight = bar > 0 ? bar + "px" : "";
    document.documentElement.classList.add("is-locked");
    if (typeof pv.dialog.showModal === "function") pv.dialog.showModal(); else pv.dialog.setAttribute("open", "");
    // colocar las cartas con la ventana ya visible: con ella oculta las cartas
    // miden 0 px y los dorsos laterales quedaban escondidos tras la central
    pvLayout(true);
    if (!pvEmerge(pv.origin)) pvAfterOpen();
    $("[data-pview-close]").focus();
  }

  /* Panel de tallas dentro de la vista ampliada */
  pv.sheet = $("[data-pview-sheet]");
  pv.sizes = $("[data-pview-sizes]");
  pv.add = $("[data-pview-add]");
  pv.legend = $("[data-pview-legend]");
  pv.sheetMeta = $("[data-pview-sheet-meta]");

  function pvSheetOpen() { return pv.sheet.dataset.open === "true"; }
  function pvSheet(open) {
    pv.sheet.dataset.open = open ? "true" : "false";
    pv.sheet.setAttribute("aria-hidden", open ? "false" : "true");
    pv.sheet.inert = !open;
    pv.cta.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var first = $("input:not(:disabled)", pv.sizes);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    }
  }

  function pvRenderSizes() {
    var p = pv.product, c = p.colorways[pv.colorway];
    pv.sheetMeta.textContent = c.name + " · " + euro(p.price);
    pv.sizes.innerHTML = "";
    pv.sizes.appendChild(el("legend", { class: "sr-only", text: "Talla" }));
    Object.keys(c.stock).forEach(function (s) {
      var n = c.stock[s];
      var input = el("input", { type: "radio", name: "pview-size", value: s, disabled: n === 0 ? "" : null });
      input.addEventListener("change", function () { var was = pv.size; pv.size = s; pvPaintAdd(was !== s); });
      var label = el("label", { class: "size", title: n === 0 ? "Agotada" : n <= 3 ? "Quedan " + n : "" }, [input, el("span", { text: s })]);
      if (n > 0 && n <= 3) label.appendChild(el("i", { class: "size__low", "aria-hidden": "true" }));
      if (n === 0) label.appendChild(el("span", { class: "sr-only", text: " agotada" }));
      else if (n <= 3) label.appendChild(el("span", { class: "sr-only", text: " últimas unidades" }));
      pv.sizes.appendChild(label);
    });
    pv.legend.hidden = !Object.keys(c.stock).some(function (k) { return c.stock[k] > 0 && c.stock[k] <= 3; });
    sizeThumb(pv.sizes);
    pvPaintAdd();
  }

  function pvPaintAdd(slot) {
    var c = pv.product.colorways[pv.colorway];
    if (!pv.size) {
      swapText(pv.add, "Elige una talla");
      pv.add.setAttribute("aria-disabled", "true");
    } else {
      var left = c.stock[pv.size];
      (slot ? slotButton : swapText)(pv.add, "Añadir a la bolsa · " + pv.size + (left <= 3 ? " (quedan " + left + ")" : ""));
      pv.add.removeAttribute("aria-disabled");
    }
  }

  // Al cerrar, todo ocurre dentro de la vista ampliada (que va dejando ver la
  // página) y solo al final se cierra de verdad: así no hay un corte seco.
  function closeProductViewer() {
    if (!pv.dialog.open || pv.closing) return;
    pv.closing = true;
    pvEndEmerge();
    // la tarjeta de la tienda pasa a la foto en la que se ha quedado la vista
    // y la carta vuelve justo a esa foto
    if (pv.onReturn) { var back = pv.onReturn(pv.i); if (back) pv.origin = back; }
    var center = pv.cards[pv.i];
    var to = pvVisible(pv.origin);
    var img = center && $(".pcard__front img", center);
    if (reduceMotion || !to || !img || !img.src || !center.animate) { pvFinishClose(); return; }
    var from = center.getBoundingClientRect();
    var src = img.currentSrc || img.src;
    var g = pvGhost(src, natural(img), greyOf(pv.origin), to, from);
    pv.dialog.appendChild(g.el);
    center.style.visibility = "hidden";
    pv.dialog.classList.add("is-closing");
    // vídeo de fondo, cabecera y pie se funden aquí (la entrada los dejaba
    // fijados a opacidad 1 y la regla de CSS no podía con ello: el fondo tapaba
    // la página durante todo el cierre y desaparecía de golpe al final)
    pv.closeFades = $$(".pview__bg, .pview__head, .pview__foot", pv.dialog).map(function (n) {
      return n.animate([{ opacity: getComputedStyle(n).opacity }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" });
    });
    var ms = 380, opt = { duration: ms, easing: "cubic-bezier(0.4, 0, 0.1, 1)", fill: "both" };
    var fly = pvFly(g, false, opt);
    if (g.grey) g.colour.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: "ease-in-out", fill: "both" });
    // si la carta es otra foto que la del carrusel, se funde con ella al llegar
    var same = pv.origin.src === img.src;
    if (!same) g.el.animate([{ opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: ms, easing: "ease-in", fill: "both" });
    // las otras cartas se recogen hacia el centro mientras se desvanecen (en
    // sus caras: la opacidad en la carta aplanaría el 3D y se vería en espejo)
    var centerT = center.style.transform + " scale(0.92)";
    pv.cards.forEach(function (card, k) {
      if (k === pv.i) return;
      card.animate([{ transform: card.style.transform }, { transform: centerT }], { duration: 260, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
      $$(".pcard__face", card).forEach(function (f) { f.animate([{ opacity: 0 }], { duration: 180, easing: "ease-out", fill: "forwards" }); });
    });
    fly.onfinish = function () { pvFinishClose(); g.el.remove(); };
  }
  function pvFinishClose() {
    document.documentElement.classList.remove("is-locked");
    document.documentElement.style.paddingRight = "";
    if (pv.dialog.open) pv.dialog.close();
    pv.dialog.classList.remove("is-closing", "is-emerging");
    (pv.closeFades || []).forEach(function (a) { a.cancel(); });
    pv.closeFades = null;
    pv.cards.forEach(function (card) { card.style.visibility = ""; card.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); }); });
    pv.closing = false;
    if (pv.opener) pv.opener.focus({ preventScroll: true });
    // el vídeo se suelta después, sin bloquear la animación
    setTimeout(function () {
      pv.video.pause();
      pv.video.removeAttribute("src");
      pv.video.load();
    }, 0);
  }

  function setupProductViewer() {
    if (!pv.dialog) return;
    $("[data-pview-close]").addEventListener("click", closeProductViewer);
    pv.dialog.addEventListener("cancel", function (e) {
      e.preventDefault();
      if (pvSheetOpen()) { pvSheet(false); pv.cta.focus({ preventScroll: true }); return; }
      closeProductViewer();
    });
    pv.prev.addEventListener("click", function () { pvGo(-1); });
    window.addEventListener("resize", function () { if (pv.dialog.open) pvLayout(true); });
    pv.next.addEventListener("click", function () { pvGo(1); });
    pv.dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); pvGo(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); pvGo(-1); }
    });
    pv.video.addEventListener("ended", function () { pv.video.currentTime = pv.video._start || 0; pv.video.play(); });
    pv.cta.addEventListener("click", function () {
      var p = pv.product, c = p.colorways[pv.colorway];
      if (stockState(c.stock) === "out") {
        toast("Te avisamos si vuelve <strong>" + p.name + " · " + c.name + "</strong>. Deja tu email abajo.");
        return;
      }
      // las tallas se eligen aquí mismo, sin salir de la vista ampliada
      pvSheet(!pvSheetOpen());
    });
    pv.add.addEventListener("click", function () {
      var p = pv.product, c = p.colorways[pv.colorway];
      if (!pv.size) { nudgeSizes(pv.sizes, null); return; }
      bag.push({ id: p.id, color: c.name, size: pv.size });
      // la foto de la carta vuela a la bolsa de la vista; el botón confirma y
      // el panel se recoge cuando la prenda ya ha llegado
      flyToBag(pv.add, IMG + c.images[pv.i], updateBag);
      confirmOn(pv.add, pvPaintAdd);
      toast("<strong>" + p.name + "</strong> · " + c.name + " · " + pv.size + " a tu bolsa.");
      setTimeout(function () {
        if (!pvSheetOpen()) return;
        pvSheet(false);
        pv.cta.focus({ preventScroll: true });
      }, 900);
    });

    // deslizar con dedo o ratón: izquierda = siguiente, derecha = anterior.
    // Las cartas siguen al dedo (se van volteando a medio camino) y al soltar
    // terminan el movimiento desde donde están, sin volver atrás.
    var drag = null;
    pv.stage.addEventListener("pointerdown", function (e) {
      if (drag || e.button > 0 || pv.cards.length < 2) return;
      drag = { id: e.pointerId, x: e.clientX, dx: 0, gap: pvGap(), samples: [{ x: e.clientX, t: performance.now() }] };
      pv.dragged = false;
    });
    pv.stage.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x;
      // se captura el puntero solo al empezar a arrastrar, para que un toque
      // simple siga llegando a la carta como clic
      if (!pv.dragged && Math.abs(drag.dx) > 6) { pv.dragged = true; pv.stage.setPointerCapture(e.pointerId); }
      if (!pv.dragged) return;
      var now = performance.now();
      drag.samples.push({ x: e.clientX, t: now });
      while (drag.samples.length > 2 && now - drag.samples[0].t > 100) drag.samples.shift();
      var p = -drag.dx / drag.gap;
      if (Math.abs(p) > 1) p = (p < 0 ? -1 : 1) * (1 + (Math.abs(p) - 1) * 0.25); // resistencia pasado un paso
      pvLayout(true, p);
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      if (!pv.dragged) return;
      var first = d.samples[0], last = d.samples[d.samples.length - 1];
      var v = last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0; // px/ms de los últimos ~100 ms
      var p = -d.dx / d.gap;
      var step = 0;
      if (p > 0.22 || v < -0.4) step = 1;
      else if (p < -0.22 || v > 0.4) step = -1;
      if (e.type === "pointercancel") step = 0;
      if (step) pvGo(step, RELEASE_EASE);
      else pvLayout(false, 0, RELEASE_EASE);
      setTimeout(function () { pv.dragged = false; }, 0);
    }
    pv.stage.addEventListener("pointerup", endDrag);
    pv.stage.addEventListener("pointercancel", endDrag);
  }

  /* ---------- Hora de la barra de estado del teléfono ---------- */
  function setupPhoneClock() {
    var t = $("[data-phone-time]");
    if (!t) return;
    var paint = function () {
      var d = new Date();
      t.textContent = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
    };
    paint();
    setInterval(paint, 30000);
  }

  /* ---------- Arranque ---------- */
  setupHeroVideo();
  paintLogos();
  renderThread();
  renderShop();
  renderVideos();
  renderSocial();
  setupFilters();
  setupBagButton();
  setupComposer();
  setupChrome();
  heroMessage();
  setupChatComposer();
  setupChatWindow();
  setupPhoneClock();
  setupProductViewer();
  setupReveal($$(".chat__drop").concat($$(".product"), $$("main > section > .reveal, .about .reveal, .social .reveal, .shop__head .reveal, .reveal--title")));
})();
