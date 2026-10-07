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
    $$("[data-logo]").forEach(function (slot) {
      var key = slot.getAttribute("data-logo");
      var def = L[key];
      if (!def) return;
      slot.innerHTML = '<svg viewBox="' + def.viewBox + '" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="' + def.paths.join(" ") + '"/></svg>';
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
      if (n.classList.contains("drop")) $$(".reveal", n).forEach(function (c) { c.classList.add("is-pending"); });
      else n.classList.add("is-pending");
      revealObserver.observe(n);
    });
  }
  function arrive(node) {
    // Un drop entero: primero "escribiendo...", luego sus mensajes en cascada
    if (node.classList.contains("drop")) {
      var typing = $(".typing", node);
      var items = $$(".reveal", node);
      var start = function () {
        if (typing) typing.classList.add("is-gone");
        items.forEach(function (it, i) {
          it.style.setProperty("--d", Math.min(i * 70, 420) + "ms");
          it.classList.remove("is-pending");
        });
      };
      if (typing) { typing.hidden = false; setTimeout(start, 650); } else start();
      return;
    }
    node.classList.remove("is-pending");
  }

  /* ---------- Vista previa de enlace (del hilo a la tienda) ---------- */
  function linkCard(p) {
    var st = productState(p);
    var a = el("a", { class: "linkcard reveal" + (st === "out" ? " is-out" : ""), href: st === "out" ? "#archivo-title" : "#product-" + p.id }, [
      el("img", { src: IMG + p.colorways[0].images[0], alt: "", loading: "lazy" }),
      el("span", { class: "linkcard__text" }, [
        el("span", { class: "linkcard__host", text: "nassville.com/tienda" }),
        el("strong", { text: p.name + " · " + p.type }),
        el("span", { class: "linkcard__meta", text: st === "out" ? "Agotado · en el archivo" : euro(p.price) + " · " + TAG[st] })
      ]),
      el("span", { class: "linkcard__go", "aria-hidden": "true", html: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>' })
    ]);
    if (st !== "out") a.addEventListener("click", function () {
      var card = document.getElementById("product-" + p.id);
      if (!card) return;
      card.classList.remove("is-target"); void card.offsetWidth; card.classList.add("is-target");
    });
    return a;
  }

  /* ---------- El hilo ---------- */
  function renderThread() {
    var list = $("[data-thread]");
    if (!list) return;
    D.drops.forEach(function (drop) {
      var li = el("li", { class: "drop" + (drop.lead ? " drop--lead" : ""), id: "drop-" + drop.id });

      var rail = el("div", { class: "drop__rail" }, [
        el("h3", { class: "drop__title", text: drop.title }),
        drop.stamp ? el("time", { class: "drop__stamp", text: drop.stamp }) : null
      ]);

      var body = el("div", { class: "drop__body" });
      var typing = el("div", { class: "typing", "aria-hidden": "true", html: "<i></i><i></i><i></i>" });
      typing.hidden = true;
      body.appendChild(typing);

      var group = el("div", { class: "group" });
      drop.lines.forEach(function (line, i) {
        var b = el("div", { class: "bubble bubble--in reveal" + (i === 0 && drop.lead ? " is-first" : "") }, [el("p", { text: line })]);
        group.appendChild(b);
      });
      body.appendChild(group);

      // adjuntos
      // el drop actual factura grande; los anteriores, una fila con "+N"
      var max = drop.lead ? 8 : 3;
      var shown = drop.images.slice(0, max);
      var extra = drop.images.length - shown.length;
      var cls = drop.lead ? "attach attach--lead" : "attach attach--row attach--" + shown.length;
      var attach = el("div", { class: cls + " reveal" });
      shown.forEach(function (src, i) {
        var tile = el("button", { class: "attach__tile", type: "button", "aria-label": "Ver foto " + (i + 1) + " de " + drop.title });
        tile.appendChild(el("img", { src: IMG + src, alt: "", loading: "lazy", decoding: "async" }));
        if (i === shown.length - 1 && extra > 0) tile.appendChild(el("span", { class: "attach__more", text: "+" + extra }));
        tile.addEventListener("click", function () { openViewer(drop.images, i, drop.title); });
        attach.appendChild(tile);
      });
      body.appendChild(attach);

      if (drop.video) {
        var wide = drop.video.ratio === "16/9";
        var vb = el("button", { class: "vbubble reveal" + (wide ? " vbubble--wide" : ""), type: "button", "aria-label": "Reproducir vídeo de " + drop.title, style: "aspect-ratio:" + drop.video.ratio });
        var v = el("video", { muted: "", loop: "", playsinline: "", preload: "none", poster: VID + drop.video.src + ".jpg", "data-src": VID + drop.video.src + ".mp4" + (drop.video.start ? "#t=" + drop.video.start : "") });
        v.muted = true;
        if (drop.video.start) {
          // vuelve al inicio elegido en cada vuelta, no al primer fotograma
          v.loop = false;
          v.addEventListener("ended", function () { v.currentTime = drop.video.start; v.play(); });
        }
        vb.appendChild(v);
        vb.appendChild(el("span", { class: "vbubble__badge", html: ICON.play + "Vídeo" }));
        vb.addEventListener("click", function () { openPlayer(VID + drop.video.src + ".mp4", VID + drop.video.src + ".jpg"); });
        body.appendChild(vb);
        autoplayInView(v);
      }

      // vista previa de enlace a las prendas de este drop
      D.products.filter(function (p) { return p.drop === drop.id; }).forEach(function (p) {
        body.appendChild(linkCard(p));
      });

      body.appendChild(el("span", { class: "receipt reveal", text: drop.lead ? "Entregado 22:05" : "Entregado" }));

      li.appendChild(rail);
      li.appendChild(body);
      list.appendChild(li);
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

    // archivo: cada color agotado es una línea, como mensajes leídos
    D.products.forEach(function (p) {
      p.colorways.forEach(function (c) {
        if (stockState(c.stock) !== "out") return;
        archive.appendChild(el("li", { class: "archive__row" }, [
          el("img", { src: IMG + c.images[0], alt: "", loading: "lazy" }),
          el("div", { class: "archive__name" }, [
            el("strong", { text: p.name }),
            el("span", { text: p.type + " · " + c.name })
          ]),
          el("div", { class: "archive__meta" }, [
            el("s", { text: euro(p.price) }),
            el("span", { html: ICON.read + "Leído" })
          ])
        ]));
      });
    });
  }

  function productCard(p, lead) {
    var state = { color: 0, image: 0, size: null };
    var firstAvailable = p.colorways.findIndex(function (c) { return stockState(c.stock) !== "out"; });
    state.color = firstAvailable > -1 ? firstAvailable : 0;

    var li = el("li", { class: "product reveal" + (lead ? " product--lead" : ""), id: "product-" + p.id, "data-category": p.category, "data-id": p.id });
    var media = el("div", { class: "product__media" });
    var tag = el("span", { class: "product__tag" });
    var editions = el("div", { class: "editions", role: "group", "aria-label": "Fotos de " + p.name });
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

    media.appendChild(tag);
    media.appendChild(editions);
    li.appendChild(media);
    li.appendChild(body);

    var imgs = [];
    var timer = null;

    function paint() {
      var c = p.colorways[state.color];
      var st = stockState(c.stock);

      // imágenes
      imgs.forEach(function (i) { i.remove(); });
      imgs = c.images.map(function (src, i) {
        var im = el("img", { src: IMG + src, alt: i === 0 ? p.name + " " + p.type + ", color " + c.name : "", loading: "lazy", decoding: "async" });
        media.insertBefore(im, tag);
        return im;
      });
      editions.innerHTML = "";
      c.images.forEach(function (_, i) {
        var b = el("button", { type: "button", "aria-label": "Foto " + (i + 1) });
        b.addEventListener("click", function () { state.image = i; showImage(); });
        b.addEventListener("mouseenter", function () { state.image = i; showImage(); });
        editions.appendChild(b);
      });
      editions.hidden = c.images.length < 2;
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
      imgs.forEach(function (im, i) { im.classList.toggle("is-on", i === state.image); });
      $$("button", editions).forEach(function (b, i) { b.classList.toggle("is-on", i === state.image); });
    }

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

    // en táctil y sin hover, las fotos rotan solas mientras la tarjeta se ve
    if (!reduceMotion && window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          clearInterval(timer);
          if (e.isIntersecting && imgs.length > 1) {
            timer = setInterval(function () { state.image = (state.image + 1) % imgs.length; showImage(); }, 2400);
          }
        });
      }, { threshold: 0.6 }).observe(media);
    }

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
    if (reduceMotion) { typing.classList.add("is-gone"); bubble.classList.add("is-in"); return; }
    setTimeout(function () {
      typing.classList.add("is-gone");
      bubble.classList.add("is-in");
    }, 1500);
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
  setupReveal($$(".drop").concat($$(".product"), $$("main > section > .reveal, .about .reveal, .social .reveal, .shop__head .reveal")));
})();
