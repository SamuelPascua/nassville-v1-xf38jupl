/* nassville® — sonidos de la interfaz.
 *
 * Todo se sintetiza aquí mismo con Web Audio: no hay archivos que descargar.
 * Una sola familia de timbres (madera, papel, campanita) muy bajos de volumen,
 * con un filtro que les quita el brillo para que suenen suaves.
 *
 * Reglas:
 * - El navegador no deja sonar nada hasta el primer toque o tecla: el motor se
 *   despierta ahí y antes de eso cualquier sonido se ignora sin más.
 * - Cada sonido tiene un tiempo mínimo entre repeticiones, para que nada se
 *   encadene ni llegue a cansar, y una pequeña variación de tono.
 * - Botón de sonido en la cabecera ([data-sound-toggle]); la preferencia se
 *   recuerda. Con «reducir movimiento» del sistema empieza apagado.
 * - Con la pestaña oculta no suena nada.
 *
 * Uso: Sfx.play("tap"), Sfx.play("stamp", { delay: 300 }), etc.
 * (opciones: delay en ms, gain, force para saltarse el límite de repetición)
 */
(function () {
  "use strict";

  var KEY = "nass-sfx";
  var VOLUME = 0.55;
  var ctx = null, out = null, noiseBuf = null;
  var last = {};          // última vez que sonó cada sonido
  var lastAny = 0;        // última vez que sonó algo concreto (para no doblar con el clic genérico)

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var enabled = stored() ? stored() === "on" : !reduce;

  // tiempo mínimo entre repeticiones de cada sonido (ms)
  var GAP = {
    tap: 45, hover: 120, tick: 30, reel: 160, key: 0, typing: 1800, stamp: 130,
    card: 70, deal: 600, register: 250, remove: 150, deny: 300, send: 200,
    receive: 300, on: 0, check: 60
  };

  function unlock() {
    if (!enabled) return;
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      // cadena maestra: volumen general → filtro cálido → compresor suave
      var master = ctx.createGain();
      master.gain.value = VOLUME;
      var warm = ctx.createBiquadFilter();
      warm.type = "lowpass"; warm.frequency.value = 5200; warm.Q.value = 0.5;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
      master.connect(warm); warm.connect(comp); comp.connect(ctx.destination);
      out = master;
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (t) {
    window.addEventListener(t, unlock, { capture: true, passive: true });
  });

  /* ---------- piezas ---------- */
  function vary(n) { return 1 + (Math.random() - 0.5) * n; }

  // envolvente: sube en `a` segundos hasta `peak` y cae en `d`
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function tone(t, o) {
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || o.d));
    env(g, t, o.a || 0.003, o.peak, o.d);
    osc.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + (o.a || 0.003) + o.d + 0.05);
  }

  function noise(t, o) {
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = o.type || "bandpass";
    f.frequency.setValueAtTime(o.f, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + (o.a || 0.002) + o.d);
    f.Q.value = o.q || 1;
    env(g, t, o.a || 0.002, o.peak, o.d);
    src.connect(f); f.connect(g); g.connect(out);
    var dur = (o.a || 0.002) + o.d + 0.05;
    src.start(t, Math.random() * 0.5, dur); src.stop(t + dur);
  }

  /* ---------- sonidos ---------- */
  var S = {
    // clic de madera blanda: botones y enlaces
    tap: function (t) {
      var r = vary(0.08);
      tone(t, { f: 1150 * r, to: 680 * r, d: 0.05, peak: 0.09 });
      noise(t, { f: 3200 * r, q: 1.2, d: 0.012, peak: 0.05 });
    },
    // casilla marcada: el mismo clic, un punto más alto
    check: function (t) {
      var r = vary(0.06);
      tone(t, { f: 1500 * r, to: 1000 * r, d: 0.04, peak: 0.08 });
      noise(t, { f: 4200, q: 1.5, d: 0.01, peak: 0.04 });
    },
    // hover: un roce casi inaudible
    hover: function (t) {
      tone(t, { f: 2300 * vary(0.1), d: 0.028, peak: 0.018, a: 0.004 });
    },
    // un diente del rodillo
    tick: function (t, o) {
      var r = (o && o.pitch) || 1;
      noise(t, { f: 2600 * r, q: 5, d: 0.014, peak: 0.07 });
      tone(t, { type: "triangle", f: 1500 * r, d: 0.018, peak: 0.025 });
    },
    // rodillo de tragaperras: dientes que frenan y encajan con un golpe sordo
    // (coincide con los 560 ms del giro del botón de talla)
    reel: function (t) {
      var times = [0, 0.045, 0.092, 0.142, 0.198, 0.262, 0.336];
      times.forEach(function (dt, i) { S.tick(t + dt, { pitch: 1.08 - i * 0.025 }); });
      tone(t + 0.42, { f: 230, to: 140, d: 0.12, peak: 0.11 });
      noise(t + 0.42, { type: "lowpass", f: 900, d: 0.05, peak: 0.07 });
    },
    // una tecla de móvil, muy apagada
    key: function (t) {
      var r = vary(0.3);
      noise(t, { f: 2300 * r, q: 2, d: 0.022, peak: 0.04 });
      tone(t, { f: 480 * r, d: 0.018, peak: 0.016 });
    },
    // «está escribiendo…»: unas cuantas teclas a ritmo irregular
    typing: function (t, o) {
      var span = Math.max(0.3, ((o && o.ms) || 700) / 1000 - 0.12);
      var at = 0.04;
      while (at < span) {
        if (Math.random() > 0.15) S.key(t + at);
        at += 0.07 + Math.random() * 0.09;
      }
    },
    // sello de tinta: golpe grave y amortiguado sobre papel
    stamp: function (t, o) {
      var r = vary(0.06), g = (o && o.gain) || 1;
      tone(t, { f: 150 * r, to: 58, d: 0.17, peak: 0.26 * g });
      noise(t, { type: "lowpass", f: 520 * r, d: 0.11, peak: 0.3 * g });
      noise(t + 0.004, { type: "highpass", f: 2800, d: 0.035, peak: 0.025 * g });
    },
    // carta que se desliza y voltea
    card: function (t, o) {
      var g = (o && o.gain) || 1, r = vary(0.12);
      noise(t, { f: 1300 * r, to: 4200 * r, q: 0.8, a: 0.012, d: 0.07, peak: 0.11 * g });
      noise(t + 0.075, { type: "highpass", f: 4800, d: 0.008, peak: 0.03 * g });
    },
    // el mazo se abre en abanico
    deal: function (t) {
      S.card(t, { gain: 0.9 }); S.card(t + 0.065, { gain: 0.7 }); S.card(t + 0.125, { gain: 0.5 });
    },
    // caja registradora: tecla mecánica y, al llegar la prenda a la bolsa, la campanita
    register: function (t, o) {
      var land = ((o && o.land) || 700) / 1000;
      noise(t, { f: 2600, q: 3, d: 0.016, peak: 0.07 });
      tone(t, { type: "triangle", f: 820, to: 600, d: 0.04, peak: 0.04 });
      noise(t + 0.05, { type: "lowpass", f: 420, d: 0.12, peak: 0.08 });
      tone(t + land, { f: 1318.5, d: 0.75, peak: 0.055, a: 0.004 });
      tone(t + land, { f: 2637, d: 0.35, peak: 0.012, a: 0.004 });
      tone(t + land + 0.085, { f: 1760, d: 1.0, peak: 0.05, a: 0.004 });
      tone(t + land + 0.085, { f: 3520, d: 0.4, peak: 0.01, a: 0.004 });
    },
    // quitar de la bolsa: roce que baja
    remove: function (t) {
      noise(t, { f: 3000, to: 800, q: 0.9, a: 0.01, d: 0.13, peak: 0.07 });
      tone(t, { f: 520, to: 300, d: 0.09, peak: 0.04 });
    },
    // falta algo (talla sin elegir): dos golpecitos que bajan
    deny: function (t) {
      tone(t, { type: "triangle", f: 330, d: 0.07, peak: 0.06 });
      tone(t + 0.09, { type: "triangle", f: 262, d: 0.1, peak: 0.06 });
    },
    // mensaje enviado: burbuja que sube
    send: function (t) {
      tone(t, { f: 560, to: 1180, glide: 0.07, d: 0.09, peak: 0.06, a: 0.005 });
    },
    // mensaje recibido: dos notas suaves
    receive: function (t) {
      tone(t, { f: 880, d: 0.14, peak: 0.05 });
      tone(t + 0.07, { f: 1320, d: 0.18, peak: 0.035 });
    },
    // sonido activado
    on: function (t) {
      tone(t, { f: 660, d: 0.09, peak: 0.05 });
      tone(t + 0.08, { f: 990, d: 0.14, peak: 0.045 });
    }
  };

  function play(name, opts) {
    if (!enabled || !ctx || ctx.state !== "running" || document.hidden || !S[name]) return;
    var now = performance.now();
    var delay = (opts && opts.delay) || 0;
    // el límite de repetición cuenta desde cuando suena de verdad (con su retraso)
    var when = now + delay, gap = GAP[name] || 0;
    // force: respuesta directa a algo que acaba de hacer el visitante
    if (!(opts && opts.force) && last[name] !== undefined && Math.abs(when - last[name]) < gap) return;
    last[name] = when;
    if (name !== "hover") lastAny = now;
    S[name](ctx.currentTime + 0.005 + delay / 1000, opts);
  }

  /* ---------- clic genérico ---------- */
  // Después de los manejadores propios: si uno ya ha sonado con su sonido
  // concreto en este mismo clic, el genérico se calla.
  var TAPPABLE = "button, a[href], [role='button'], summary, .chip, .swatch";
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(TAPPABLE);
    if (!t || t.disabled || t.getAttribute("aria-disabled") === "true") return;
    if (t.closest("[data-sfx-silent]")) return;
    var at = performance.now();
    // un instante después: el envío de un formulario llega tras el clic
    setTimeout(function () { if (lastAny < at - 60) play("tap"); }, 0);
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t || t.type !== "checkbox") return;
    if (performance.now() - lastAny < 60) return;
    play(t.checked ? "check" : "tap");
  });

  /* ---------- hover en ordenador: solo elementos clave ---------- */
  var HOVER = ".product__media, .soldcard, .btn--primary, .bag, .size:not(:has(input:disabled)), .swatch, .pcard, .sound";
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)");
  var hovered = null, lastEl = null, lastOut = 0;
  document.addEventListener("pointerover", function (e) {
    if (e.pointerType !== "mouse" || !fine || !fine.matches) return;
    var t;
    try { t = e.target.closest && e.target.closest(HOVER); } catch (err) { t = e.target.closest && e.target.closest(".product__media, .soldcard, .btn--primary, .bag, .swatch, .pcard, .sound"); }
    if (!t || t === hovered) return;
    // volver enseguida al mismo elemento (el ratón temblando en el borde) no suena
    var again = t === lastEl && performance.now() - lastOut < 500;
    hovered = lastEl = t;
    if (!again) play("hover");
  });
  document.addEventListener("pointerout", function (e) {
    if (hovered && !hovered.contains(e.relatedTarget)) { hovered = null; lastOut = performance.now(); }
  });

  /* ---------- botón de sonido ---------- */
  function paint(btn) {
    btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    btn.setAttribute("aria-label", enabled ? "Sonido activado. Pulsa para silenciar" : "Sonido silenciado. Pulsa para activar");
    btn.classList.toggle("is-muted", !enabled);
  }
  function setEnabled(on) {
    enabled = !!on;
    store(enabled ? "on" : "off");
    document.querySelectorAll("[data-sound-toggle]").forEach(paint);
    if (enabled) { unlock(); setTimeout(function () { play("on"); }, 30); }
  }
  function setupToggles() {
    document.querySelectorAll("[data-sound-toggle]").forEach(function (btn) {
      btn.setAttribute("data-sfx-silent", "");
      paint(btn);
      btn.addEventListener("click", function () { setEnabled(!enabled); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupToggles);
  else setupToggles();

  window.Sfx = {
    play: play,
    isOn: function () { return enabled; },
    state: function () { return ctx ? ctx.state : "locked"; },
    set: setEnabled
  };
})();
