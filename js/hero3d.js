/*
 * nassville® v1 — emblema "11" en 3D (Three.js).
 * Se extruye desde el vector del logo (js/logo-paths.js).
 * Sigue al cursor con un muelle; se puede girar arrastrando y conserva la inercia.
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

    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
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

    var geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 70,
      bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 5,
      bevelSegments: 5,
      curveSegments: 10
    });
    geometry.center();
    geometry.computeBoundingBox();
    var size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);

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

    if (reduceMotion) {
      group.rotation.set(-0.12, -0.35, 0);
      renderer.render(scene, camera);
      return;
    }

    // --- Muelles: el emblema sigue al cursor con inercia ---
    var spring = function (value) { return { x: value, v: 0, target: value }; };
    var rotY = spring(-2.6); // entrada: llega girando
    var rotX = spring(0.35);
    var scl = spring(0.82);
    rotY.target = 0; rotX.target = 0; scl.target = 1;

    function step(s, k, d, dt) {
      var f = -k * (s.x - s.target) - d * s.v;
      s.v += f * dt;
      s.x += s.v * dt;
    }

    var pointer = { x: 0, y: 0 };
    window.addEventListener("pointermove", function (e) {
      if (dragging) return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // Arrastrar para girar (con inercia)
    var dragging = false, lastX = 0, lastT = 0, spin = 0, spinOffset = 0;
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX; lastT = performance.now(); spin = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var now = performance.now();
      var dx = e.clientX - lastX;
      spinOffset += dx * 0.012;
      spin = (dx * 0.012) / Math.max(now - lastT, 8) * 1000; // rad/s
      lastX = e.clientX; lastT = now;
    });
    var endDrag = function () { dragging = false; canvas.style.cursor = "grab"; };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.style.cursor = "grab";

    // --- Bucle (solo mientras el hero se ve) ---
    var visible = true, raf = 0, last = performance.now(), t0 = last;
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }).observe(hero);

    function loop(now) {
      raf = 0;
      if (!visible) return;
      var dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      var t = (now - t0) / 1000;

      // inercia del giro manual, frenando poco a poco y volviendo a casa
      if (!dragging) {
        spinOffset += spin * dt;
        spin *= Math.pow(0.04, dt);
        spinOffset *= Math.pow(0.35, dt);
      }

      rotY.target = pointer.x * 0.55 + Math.sin(t * 0.5) * 0.12 + spinOffset;
      rotX.target = pointer.y * 0.3 + Math.sin(t * 0.7) * 0.05;

      step(rotY, 60, 11, dt);
      step(rotX, 60, 11, dt);
      step(scl, 80, 12, dt);

      // salida al hacer scroll: el emblema se inclina y se aleja
      var p = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.8), 0), 1);
      group.rotation.y = rotY.x;
      group.rotation.x = rotX.x + p * 0.9;
      group.position.y = Math.sin(t * 0.9) * 0.06 + p * 0.6;
      var s = scl.x * (1 - p * 0.35);
      group.scale.setScalar(s);
      stage.style.opacity = String(1 - p * 1.1);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }
})();
