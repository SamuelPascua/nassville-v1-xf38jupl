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
    nodes.forEach(function (n) {
      // solo esconder lo que está por debajo del viewport: lo visible nunca parpadea
      var r = n.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) return;
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
    shown.forEach(function (src, i) {
      var tile = el("button", { class: "msg__photo", type: "button", "aria-label": "Ver foto " + (i + 1) + " de " + drop.title });
      tile.appendChild(el("img", { src: IMG + src, alt: "", loading: "lazy", decoding: "async" }));
      if (i === shown.length - 1 && extra > 0) tile.appendChild(el("span", { class: "msg__more", text: "+" + extra }));
      tile.addEventListener("click", function () { openViewer(drop.images, i, drop.title); });
      grid.appendChild(tile);
    });
    return grid;
  }

  function videoMsg(drop) {
    var vb = el("button", { class: "msg__video", type: "button", "aria-label": "Reproducir vídeo de " + drop.title, style: "aspect-ratio:" + drop.video.ratio });
    var v = el("video", { muted: "", loop: "", playsinline: "", preload: "none", poster: VID + drop.video.src + ".jpg", "data-src": VID + drop.video.src + ".mp4" + (drop.video.start ? "#t=" + drop.video.start : "") });
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
      el("img", { src: IMG + p.colorways[0].images[0], alt: "", loading: "lazy" }),
      el("span", { class: "msg__link-text" }, [
        el("strong", { text: p.name + " · " + p.type }),
        el("span", { text: st === "out" ? "Agotado · en el archivo" : euro(p.price) + " · " + TAG[st] }),
        el("small", { text: "nassville.com/tienda" })
      ])
    ]);
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

    // el mensaje fijado lleva a su drop dentro de la ventana, sin saltar la página
    $("[data-chat-pinned]").addEventListener("click", function (e) {
      var target = document.getElementById("drop-" + C.pinned.drop);
      if (!target) return;
      e.preventDefault();
      var r = chat.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) chat.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      var body = chatBody();
      // posición del drop dentro de la ventana (no respecto a la página)
      scrollChatTo(target.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8);
    });
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
        card.addEventListener("click", function () { openProductViewer(p, ci, 0); });
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
        var im = el("img", { src: IMG + src, alt: i === 0 ? p.name + " " + p.type + ", color " + c.name : "", loading: "lazy", decoding: "async", draggable: "false" });
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
        input.addEventListener("change", function () { state.size = s; paintCta(); });
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
      paintCta();
    }

    function paintCta() {
      var c = p.colorways[state.color];
      var st = stockState(c.stock);
      if (st === "out") {
        cta.textContent = "Avísame si vuelve";
        cta.className = "btn btn--ghost";
        cta.disabled = false;
        cta.dataset.mode = "notify";
        note.textContent = "Este color se ha agotado.";
        return;
      }
      cta.className = "btn btn--primary";
      cta.dataset.mode = "add";
      if (!state.size) {
        cta.textContent = "Elige tu talla";
        cta.setAttribute("aria-disabled", "true");
        note.textContent = st === "low" ? "Pocas unidades en algunas tallas." : "";
      } else {
        var left = c.stock[state.size];
        cta.textContent = "Lo quiero · " + state.size;
        cta.removeAttribute("aria-disabled");
        note.textContent = left <= 3 ? "Quedan " + left + " en " + state.size + "." : "Disponible en " + state.size + ".";
      }
    }

    function showImage() {
      $$("button", editions).forEach(function (b, i) { b.classList.toggle("is-on", i === state.image); });
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
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProductViewer(p, state.color, state.image); }
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
      if (!d.moved) openProductViewer(p, state.color, state.image);
    });
    track.addEventListener("pointercancel", function () { tDrag = null; track.classList.remove("is-dragging"); });

    cta.addEventListener("click", function () {
      var c = p.colorways[state.color];
      if (cta.dataset.mode === "notify") {
        toast("Te avisamos si vuelve <strong>" + p.name + " · " + c.name + "</strong>. Deja tu email abajo.");
        return;
      }
      if (!state.size) {
        toast("Primero elige una talla.");
        var first = $("input:not(:disabled)", sizes);
        if (first) first.focus();
        return;
      }
      bag.push({ id: p.id, color: c.name, size: state.size });
      updateBag();
      toast("<strong>" + p.name + "</strong> · " + c.name + " · " + state.size + " a tu bolsa.");
    });

    paint();
    return li;
  }

  function updateBag() {
    var btn = $("[data-bag-button]");
    var count = $("[data-bag-count]");
    count.textContent = bag.length;
    btn.classList.toggle("has-items", bag.length > 0);
    btn.setAttribute("aria-label", "Bolsa, " + bag.length + (bag.length === 1 ? " prenda" : " prendas"));
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
  }

  function setupBagButton() {
    $("[data-bag-button]").addEventListener("click", function () {
      if (!bag.length) toast("Tu bolsa está vacía. Mira <a href=\"#tienda\">lo que queda</a>.");
      else toast("Llevas " + bag.length + (bag.length === 1 ? " prenda" : " prendas") + ". El pago llega muy pronto.");
    });
  }

  /* ---------- Filtros ---------- */
  function setupFilters() {
    var bar = $("[data-filters]");
    if (!bar) return;
    var empty = $("[data-products-empty]");

    function apply(filter) {
      $$(".chip", bar).forEach(function (c) {
        var on = c.dataset.filter === filter;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var visible = 0;
      $$(".product").forEach(function (card) {
        var show = filter === "todo" || card.dataset.category === filter ||
          (filter === "disponible" && !card.querySelector(".product__tag--out"));
        card.classList.toggle("is-hidden", !show);
        if (show) visible++;
      });
      empty.hidden = visible > 0;
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
      var v = el("video", { muted: "", loop: "", playsinline: "", preload: "none", poster: VID + src + ".jpg", "data-src": VID + src + ".mp4" });
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
      err.hidden = true;
      input.removeAttribute("aria-invalid");
      sent.innerHTML = "";
      var out = el("div", { class: "bubble bubble--out" }, [el("p", { text: v })]);
      sent.appendChild(out);
      sent.appendChild(el("span", { class: "stamp stamp--out", text: "Entregado" }));
      input.value = "";
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
    var typing = $("[data-typing]");
    var bubble = $("[data-hero-bubble]");
    var notif = $("[data-hero-notif]");
    var hero = $(".hero");
    // en móvil el mensaje llega como notificación compacta; al tocarla se despliega
    notif.addEventListener("click", function () {
      var open = !hero.classList.contains("is-notif-open");
      hero.classList.toggle("is-notif-open", open);
      notif.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (reduceMotion) { typing.classList.add("is-gone"); bubble.classList.add("is-in"); notif.classList.add("is-in"); return; }
    setTimeout(function () {
      typing.classList.add("is-gone");
      bubble.classList.add("is-in");
      notif.classList.add("is-in");
    }, 1500);
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

  function pvLayout(instant) {
    var n = pv.cards.length;
    pv.cards.forEach(function (card, k) {
      var o = pvOffset(k);
      var pos = Math.max(-2, Math.min(2, o));
      // una carta que da la vuelta al mazo (de un extremo al otro) no se anima
      var jump = card._pos !== undefined && Math.abs(pos - card._pos) > 1;
      card.classList.toggle("no-anim", !!instant || jump);
      card.dataset.pos = String(pos);
      card._pos = pos;
      card.setAttribute("aria-hidden", o === 0 ? "false" : "true");
      card.tabIndex = Math.abs(o) === 1 ? 0 : -1;
    });
    pv.count.textContent = (pv.i + 1) + " / " + n;
    pv.prev.disabled = pv.next.disabled = n < 2;
  }

  function pvGo(step) {
    var n = pv.cards.length;
    if (n < 2) return;
    pv.i = (pv.i + step + n) % n;
    pvLayout(false);
  }

  function openProductViewer(p, ci, start) {
    var c = p.colorways[ci];
    var st = stockState(c.stock);
    pv.product = p; pv.colorway = ci; pv.i = start || 0;
    pv.opener = document.activeElement;
    pv.dialog.style.setProperty("--tint", c.tint || "#262c57");
    pv.name.textContent = p.name;
    pv.meta.textContent = p.type + " · " + c.name + " · " + euro(p.price);
    pv.stamp.hidden = st !== "out";
    pv.cta.textContent = st === "out" ? "Avísame si vuelve" : "Elegir talla";
    pv.cta.className = "btn " + (st === "out" ? "btn--ghost" : "btn--primary");

    // fondo: vídeo de la prenda con el filtro de su color
    if (c.video) {
      pv.video.poster = VID + c.video.src + ".jpg";
      pv.video.src = VID + c.video.src + ".mp4" + (c.video.start ? "#t=" + c.video.start : "");
      pv.video._start = c.video.start || 0;
      if (!reduceMotion) { var pr = pv.video.play(); if (pr && pr.catch) pr.catch(function () {}); }
    }

    pv.deck.innerHTML = "";
    pv.cards = c.images.map(function (src, k) {
      var card = el("div", { class: "pcard", role: "group", "aria-roledescription": "carta", "aria-label": "Foto " + (k + 1) + " de " + c.images.length }, [
        el("div", { class: "pcard__face pcard__front" }, [
          el("img", { src: IMG + src, alt: k === 0 ? p.name + " " + p.type + ", " + c.name : "", decoding: "async" })
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
    pvLayout(true);

    document.documentElement.classList.add("is-locked");
    if (typeof pv.dialog.showModal === "function") pv.dialog.showModal(); else pv.dialog.setAttribute("open", "");
    $("[data-pview-close]").focus();
  }

  function closeProductViewer() {
    pv.video.pause();
    pv.video.removeAttribute("src");
    pv.video.load();
    document.documentElement.classList.remove("is-locked");
    if (pv.dialog.open) pv.dialog.close();
    if (pv.opener) pv.opener.focus({ preventScroll: true });
  }

  function setupProductViewer() {
    if (!pv.dialog) return;
    $("[data-pview-close]").addEventListener("click", closeProductViewer);
    pv.dialog.addEventListener("cancel", function (e) { e.preventDefault(); closeProductViewer(); });
    pv.prev.addEventListener("click", function () { pvGo(-1); });
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
      closeProductViewer();
      var card = document.getElementById("product-" + p.id);
      if (!card) return;
      card.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      var first = $(".sizes input:not(:disabled)", card);
      setTimeout(function () { if (first) first.focus({ preventScroll: true }); }, 450);
    });

    // deslizar con dedo o ratón: izquierda = siguiente, derecha = anterior
    var drag = null;
    pv.stage.addEventListener("pointerdown", function (e) {
      if (drag || e.button > 0) return;
      drag = { id: e.pointerId, x: e.clientX, t: performance.now(), dx: 0 };
      pv.dragged = false;
      pv.deck.classList.add("is-dragging");
    });
    pv.stage.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x;
      // se captura el puntero solo al empezar a arrastrar, para que un toque
      // simple siga llegando a la carta como clic
      if (!pv.dragged && Math.abs(drag.dx) > 6) { pv.dragged = true; pv.stage.setPointerCapture(e.pointerId); }
      pv.deck.style.transform = "translateX(" + drag.dx * 0.35 + "px) rotateY(" + drag.dx * 0.012 + "deg)";
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = drag.dx, v = dx / Math.max(performance.now() - drag.t, 1); // px/ms
      drag = null;
      pv.deck.classList.remove("is-dragging");
      pv.deck.style.transform = "";
      if (dx < -60 || v < -0.45) pvGo(1);
      else if (dx > 60 || v > 0.45) pvGo(-1);
      setTimeout(function () { pv.dragged = false; }, 0);
    }
    pv.stage.addEventListener("pointerup", endDrag);
    pv.stage.addEventListener("pointercancel", endDrag);
  }

  /* ---------- Arranque ---------- */
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
  setupProductViewer();
  setupReveal($$(".chat__drop").concat($$(".product"), $$("main > section > .reveal, .about .reveal, .social .reveal, .shop__head .reveal")));
})();
