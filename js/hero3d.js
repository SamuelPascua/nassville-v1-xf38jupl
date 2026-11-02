/*
 * nassville® v1 — emblema "11" en 3D (Three.js).
 * Se extruye desde el vector del logo (js/logo-paths.js).
 * Gira de forma continua; se arrastra a izquierda o derecha y, al soltarlo
 * con impulso, gira rápido y frena poco a poco hasta volver al giro lento.
 * Si WebGL no está disponible, se muestra el emblema plano.
 */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var canvas = document.querySelector("[data-hero-canvas]");
  var stage = document.querySelector(".hero__stage");
  if (!hero || !canvas || !window.NASS_LOGO) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fallback() { hero.classList.add("no-webgl"); }

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }
  if (!hasWebGL()) return fallback();

  Promise.all([
    import("three"),
    import("three/addons/loaders/SVGLoader.js"),
    import("three/addons/environments/RoomEnvironment.js")
  ]).then(function (mods) {
    start(mods[0], mods[1].SVGLoader, mods[2].RoomEnvironment);
  }).catch(function (err) {
    console.warn("[nassville] 3D no disponible:", err);
    fallback();
  });

  function start(THREE, SVGLoader, RoomEnvironment) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return fallback(); }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new THREE.Scene();
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // perspectiva suave: de canto el emblema se ve igual desde ambos lados
    var camera = new THREE.PerspectiveCamera(16, 1, 0.1, 200);
    camera.position.set(0, 0, 9);

    // Luces: una clave cálida-neutra y un contraluz azul marino de la marca
    var key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 4, 6);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x5b7cff, 2.4);
    rim.position.set(-5, -2, -4);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x262c57, 0.6));

    // --- Geometría desde el vector del logo ---
    var def = window.NASS_LOGO.emblem;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + def.viewBox + '"><path fill="#fff" fill-rule="evenodd" d="' + def.paths.join(" ") + '"/></svg>';
    var data = new SVGLoader().parse(svg);
    var shapes = [];
    data.paths.forEach(function (p) {
      p.userData.style.fillRule = "evenodd";
      shapes = shapes.concat(SVGLoader.createShapes(p));
    });

    // El trazado trae los huecos (entre el óvalo y los "1") en el mismo sentido
    // que el contorno exterior. ExtrudeGeometry solo corrige los huecos cuando
    // el contorno va al revés, así que aquí sus paredes y su bisel quedaban
    // mirando hacia dentro y no se dibujaban. Se fuerza el sentido contrario.
    shapes = shapes.map(function (shape) {
      var outer = shape.getPoints(10);
      var outerCW = THREE.ShapeUtils.isClockWise(outer);
      var fixed = new THREE.Shape(outer);
      shape.holes.forEach(function (hole) {
        var pts = hole.getPoints(10);
        if (THREE.ShapeUtils.isClockWise(pts) === outerCW) pts = pts.slice().reverse();
        fixed.holes.push(new THREE.Path(pts));
      });
      return fixed;
    });

    var geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 90,
      bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 5,
      bevelSegments: 5,
      curveSegments: 10
    });
    // centrado moviendo la malla y no la geometría: geometry.center() recorría
    // todos los vértices otra vez y era de lo más lento al cargar
    geometry.computeBoundingBox();
    var size = new THREE.Vector3(), mid = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    geometry.boundingBox.getCenter(mid);

    var material = new THREE.MeshPhysicalMaterial({
      color: 0xe4e4e8,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.25
    });

    var mesh = new THREE.Mesh(geometry, material);
    var fit = 4.2 / size.x;
    mesh.scale.set(fit, -fit, fit); // el eje Y del SVG va hacia abajo
    mesh.position.set(-mid.x * fit, mid.y * fit, -mid.z * fit);
    var group = new THREE.Group();
    group.add(mesh);
    scene.add(group);

    // --- Tamaño ---
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // encaja el emblema tanto en horizontal como en vertical
      var needW = 5.2 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      var needH = (size.y * fit + 1.2) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      camera.position.z = Math.max(needW, needH);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // --- Giro sobre el eje vertical: continuo, arrastrable y con inercia ---
    var TAU = Math.PI * 2;
    var BASE = reduceMotion ? 0 : TAU / 12;   // una vuelta cada ~12 s
    var MAX_SPIN = 32;                         // rad/s (unas 5 vueltas por segundo)
    var FRICTION = reduceMotion ? 0.5 : 1.5;   // s: cuánto tarda en frenar tras soltar

    var angle = 0;
    var direction = 1;                         // 1 = derecha, -1 = izquierda
    var omega = reduceMotion ? 0 : 14;         // entrada: llega girando rápido y frena
    var scale = reduceMotion ? 1 : 0.85;

    // Arrastre con ratón o dedo: solo horizontal (izquierda / derecha)
    var dragging = false, pointerId = null, lastX = 0, samples = [];
    function radPerPx() { return (Math.PI * 1.6) / Math.max(canvas.clientWidth, 1); }

    canvas.addEventListener("pointerdown", function (e) {
      if (dragging) return; // un solo dedo manda
      dragging = true; pointerId = e.pointerId; lastX = e.clientX;
      samples = [{ x: e.clientX, t: performance.now() }];
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("is-dragging");
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging || e.pointerId !== pointerId) return;
      var now = performance.now();
      angle += (e.clientX - lastX) * radPerPx(); // sigue a la mano 1:1
      lastX = e.clientX;
      samples.push({ x: e.clientX, t: now });
      while (samples.length > 2 && now - samples[0].t > 100) samples.shift();
    });
    function release(e, fling) {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false; pointerId = null;
      canvas.classList.remove("is-dragging");
      var now = performance.now();
      var first = samples[0], lastS = samples[samples.length - 1];
      var v = 0; // px/s de los últimos ~100 ms
      if (fling && first && lastS && now - lastS.t < 80 && lastS.t > first.t) {
        v = (lastS.x - first.x) / ((lastS.t - first.t) / 1000);
      }
      var w = v * radPerPx();
      omega = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, w));
      if (Math.abs(w) > 0.6) direction = w > 0 ? 1 : -1; // el giro lento sigue tu dirección
    }
    canvas.addEventListener("pointerup", function (e) { release(e, true); });
    canvas.addEventListener("pointercancel", function (e) { release(e, false); }); // p. ej. el dedo pasa a hacer scroll

    // --- Cara visible: el "11" siempre se lee bien y el giro no da saltos ---
    // De espaldas el logo saldría en espejo, así que siempre se muestra la cara
    // delantera (girar 180° más equivale a darle la vuelta). Para que el cambio
    // de cara no se note, desde que el giro empieza a ocultar el "11" (~63°) el óvalo se
    // va estrechando en su eje de profundidad hasta quedar de canto, y la
    // rotación se compensa para que el ancho visible sea el de un giro real:
    // la velocidad aparente es uniforme y la inclinación del óvalo pasa de un
    // lado al otro poco a poco, no de golpe.
    // El ángulo de inicio se adapta a la velocidad: en el giro lento la
    // transición se ve durante casi 2 s, así que empieza más tarde (~67°);
    // en giros rápidos apenas se aprecia y puede empezar antes (~60°).
    var MORPH_SLOW = Math.cos(67 * Math.PI / 180);
    var MORPH_FAST = Math.cos(60 * Math.PI / 180);
    var FAST_SPEED = 6;                    // rad/s a partir de los cuales cuenta como rápido
    var morphStart = MORPH_SLOW;
    var speed = 0, prevAngle = 0;          // velocidad angular suavizada (también al arrastrar)
    var lastPass = 0, SOUND_FROM = 1.6;    // rad/s: por debajo, sin «bum» (el giro de reposo va a ~0,5)
    function showFace(a) {
      var MORPH_START = morphStart;
      var c = Math.cos(a), sn = Math.sin(a);
      if (c < 0) { c = -c; sn = -sn; }       // la cara trasera se muestra como delantera
      if (c >= MORPH_START) return { rotation: Math.atan2(sn, c), squash: 1 };
      var squash = Math.max(Math.sqrt(c / MORPH_START), 0.002);
      var cosShown = Math.min(c / squash, 1); // cos(giro) × estrechamiento = cos(ángulo real)
      return { rotation: (sn < 0 ? -1 : 1) * Math.acos(cosShown), squash: squash };
    }

    // --- Bucle (solo mientras el hero se ve) ---
    var visible = true, raf = 0, last = performance.now(), t0 = last, started = false;
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (started && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }).observe(hero);

    function loop(now) {
      raf = 0;
      if (!visible) return;
      var dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      var t = (now - t0) / 1000;

      if (!dragging) {
        // la velocidad se acerca poco a poco al giro lento (fricción exponencial)
        var target = BASE * direction;
        omega = target + (omega - target) * Math.exp(-dt / FRICTION);
        angle += omega * dt;
      }
      scale += (1 - scale) * (1 - Math.exp(-dt / 0.35));

      // salida al hacer scroll: el emblema se inclina y se aleja
      var p = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.8), 0), 1);
      // velocidad real del giro (arrastre incluido), suavizada para que el
      // ángulo de inicio cambie sin tirones
      var inst = Math.abs(angle - prevAngle) / Math.max(dt, 1e-3);
      prevAngle = angle;
      speed += (inst - speed) * (1 - Math.exp(-dt / 0.25));
      var fast = Math.min(Math.max((speed - BASE) / (FAST_SPEED - BASE), 0), 1);
      morphStart = MORPH_SLOW + (MORPH_FAST - MORPH_SLOW) * fast;

      // sonido: cada vez que el emblema pasa de canto (cada media vuelta)
      // suena un «bum»; solo cuando alguien lo ha hecho girar, y más fuerte
      // cuanto más fuerte se le ha dado. El giro lento de reposo no suena.
      var pass = Math.floor((angle - Math.PI / 2) / Math.PI);
      if (pass !== lastPass) {
        lastPass = pass;
        if (window.Sfx && speed > SOUND_FROM) {
          var push = Math.min((speed - SOUND_FROM) / (MAX_SPIN * 0.6), 1);
          window.Sfx.play("spin", { gain: 0.25 + 0.75 * Math.pow(push, 0.7), fast: push });
        }
      }

      var face = showFace(angle);
      group.rotation.y = face.rotation;
      mesh.scale.x = fit * face.squash;
      mesh.position.x = -mid.x * mesh.scale.x;
      group.rotation.x = p * 0.9;
      group.position.y = (reduceMotion ? 0 : Math.sin(t * 0.9) * 0.05) + p * 0.6;
      group.scale.setScalar(scale * (1 - p * 0.35));
      stage.style.opacity = String(1 - p * 1.1);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    // Los shaders del metal se compilan sin bloquear la página (si el navegador
    // lo permite) y el emblema aparece con su entrada ya lista, en vez de
    // congelar todo un instante en el primer fotograma.
    var ready = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve();
    ready.catch(function () {}).then(function () {
      started = true;
      renderer.render(scene, camera);
      canvas.classList.add("is-ready");
      last = t0 = performance.now();
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
  }
})();
