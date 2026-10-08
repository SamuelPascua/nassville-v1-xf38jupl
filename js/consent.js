/* nassville® v1 — aviso de cookies y consentimiento (sin dependencias).
 *
 * Hoy la web no usa cookies de análisis ni de publicidad. Este archivo deja el
 * consentimiento listo para cuando se usen (Google Analytics, Meta Pixel...):
 * nada de eso debe cargarse sin pasar por aquí.
 *
 *   nassConsent.whenAllowed(function () { ...cargar el script de análisis... });
 *
 * La función se ejecuta en cuanto la persona acepta (ahora o más adelante) y
 * nunca si rechaza. La elección se guarda en este navegador (localStorage, es
 * técnica y no necesita consentimiento) y se puede cambiar desde cualquier
 * enlace con data-cookie-settings, por ejemplo en el pie de página.
 */
(function () {
  "use strict";

  var KEY = "nass-consent";
  var VERSION = 1;          // subir si cambian las finalidades: se vuelve a preguntar
  var MAX_AGE = 1000 * 60 * 60 * 24 * 365 / 12 * 13; // 13 meses, como recomienda la AEPD
  var waiting = [];

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (!v || v.v !== VERSION || Date.now() - v.at > MAX_AGE) return null;
      return v;
    } catch (e) { return null; }
  }
  function write(allowed) {
    var v = { v: VERSION, analytics: !!allowed, at: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    return v;
  }

  var state = read();

  function allowed() { return !!(state && state.analytics); }
  function flush() {
    if (!allowed()) return;
    var list = waiting; waiting = [];
    list.forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  window.nassConsent = {
    // null (sin decidir), true (aceptado) o false (rechazado)
    get: function () { return state ? state.analytics : null; },
    whenAllowed: function (fn) { waiting.push(fn); flush(); },
    open: function () { show(); }
  };

  /* ---------- Banner ---------- */
  var banner = null, lastFocus = null;

  function build() {
    banner = document.createElement("section");
    banner.className = "cookies";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Aviso de cookies");
    banner.innerHTML =
      '<p class="cookies__title">Cookies</p>' +
      '<p class="cookies__text">Ahora mismo no usamos cookies de análisis ni de publicidad. ' +
      'Si algún día medimos visitas o anuncios (por ejemplo con Google Analytics o Meta), ' +
      'solo se activará si lo aceptas. Puedes cambiarlo cuando quieras. ' +
      '<a href="cookies.html">Más información</a>.</p>' +
      '<div class="cookies__actions">' +
      '<button type="button" class="btn btn--ghost cookies__btn" data-cookie-choice="no">Rechazar</button>' +
      '<button type="button" class="btn btn--ghost cookies__btn" data-cookie-choice="yes">Aceptar</button>' +
      '</div>';
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cookie-choice]");
      if (!b) return;
      state = write(b.getAttribute("data-cookie-choice") === "yes");
      hide();
      flush();
      document.dispatchEvent(new CustomEvent("nass:consent", { detail: { analytics: allowed() } }));
    });
    banner.addEventListener("keydown", function (e) {
      // Escape cierra sin decidir solo si ya había una elección guardada
      if (e.key === "Escape" && state) hide();
    });
    document.body.appendChild(banner);
  }

  function show() {
    if (!banner) build();
    lastFocus = document.activeElement;
    banner.hidden = false;
    // fotograma siguiente: así entra con su transición
    requestAnimationFrame(function () { banner.classList.add("is-on"); });
    // al abrirlo a propósito, el foco va a la elección; en la primera visita no se roba el foco
    if (state) setTimeout(function () { var b = banner.querySelector("[data-cookie-choice]"); if (b) b.focus(); }, 60);
  }
  function hide() {
    if (!banner) return;
    banner.classList.remove("is-on");
    setTimeout(function () { banner.hidden = true; }, 260);
    if (lastFocus && lastFocus !== document.body && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  function init() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-cookie-settings]");
      if (!t) return;
      e.preventDefault();
      show();
    });
    if (!state) show();
    flush();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
