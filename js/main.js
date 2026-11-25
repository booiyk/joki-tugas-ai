import * as THREE from 'three';

/* ======================
   Apple-style 3D Scenes (Three.js) with WebGL fallback
   ====================== */

// --- WebGL capability guard ---
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ======================
   Hero Scene
   ====================== */
function initHeroScene() {
  const heroCanvas = document.getElementById('heroCanvas');
  const heroFallback = document.getElementById('heroFallback');
  const heroContent = heroCanvas.parentElement.querySelector('.hero__content');

  if (!hasWebGL() || prefersReducedMotion()) {
    heroCanvas.style.display = 'none';
    if (heroFallback) heroFallback.classList.add('hero__fallback--visible');
    if (heroContent) heroContent.style.display = 'none';
    return;
  }

  const canvasRect = heroCanvas.getBoundingClientRect();

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, canvasRect.width / canvasRect.height, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(canvasRect.width, canvasRect.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.display = 'block';
  heroCanvas.appendChild(renderer.domElement);

  // --- Subtle particle field (Apple-style: fewer, refined) ---
  const PARTICLE_COUNT = 600;
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const speeds = new Float32Array(PARTICLE_COUNT);
  const phases = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = 2 + Math.random() * 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = radius * Math.cos(phi);
    sizes[i] = Math.random() * 0.02 + 0.008;
    speeds[i] = Math.random() * 0.0003 + 0.0001;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    size: 0.03,
    color: 0x0071e3,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- Central floating orb (Apple-style: single refined element) ---
  const orbGeo = new THREE.IcosahedronGeometry(0.8, 12);
  const orbMat = new THREE.MeshPhysicalMaterial({
    color: 0x0071e3,
    metalness: 0.2,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 0.3,
    thickness: 0.5,
    ior: 1.33,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  scene.add(orb);

  // --- Orbiting rings (subtle depth) ---
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.RingGeometry(1.5 + i * 0.4, 1.55 + i * 0.4, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0071e3,
      transparent: true,
      opacity: 0.08 - i * 0.02,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + (i % 2) * 0.3;
    ring.rotation.z = (i * Math.PI) / 4;
    ring.userData = { speed: 0.0005 + i * 0.0003, axis: i % 2 === 0 ? 'x' : 'z' };
    rings.push(ring);
    scene.add(ring);
  }

  // --- Subtle ambient spheres ---
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a84ff,
    metalness: 0.1,
    roughness: 0.3,
    transparent: true,
    opacity: 0.15,
  });
  const ambientSpheres = [];
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 16, 16), sphereMat);
    const angle = Math.random() * Math.PI * 2;
    const rad = 2.5 + Math.random() * 2;
    s.position.set(Math.cos(angle) * rad, (Math.random() - 0.5) * 2, Math.sin(angle) * rad);
    s.userData = { vx: (Math.random() - 0.5) * 0.002, vy: (Math.random() - 0.5) * 0.003, vz: (Math.random() - 0.5) * 0.002 };
    ambientSpheres.push(s);
    scene.add(s);
  }

  camera.position.z = 5.5;

  // --- Mouse interaction (subtle parallax) ---
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  document.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 1.5;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 1;
  });

  // --- Animation loop ---
  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    // Mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.03;
    mouse.y += (mouse.targetY - mouse.y) * 0.03;

    // Particles: subtle orbital drift
    const p = particles.geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phase = phases[i] + frame * speeds[i];
      p[i * 3] += Math.sin(phase) * 0.0005;
      p[i * 3 + 1] += Math.cos(phase) * 0.0005;
      p[i * 3 + 2] += Math.sin(phase * 0.7) * 0.0003;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Orb: gentle floating rotation
    orb.rotation.x += 0.0015;
    orb.rotation.y += 0.0025;
    orb.position.y = Math.sin(frame * 0.003) * 0.15;

    // Rings: slow rotation
    rings.forEach((ring) => {
      if (ring.userData.axis === 'x') ring.rotation.x += ring.userData.speed;
      else ring.rotation.z += ring.userData.speed;
    });

    // Ambient spheres: slow drift
    ambientSpheres.forEach((s) => {
      s.position.x += s.userData.vx;
      s.position.y += s.userData.vy;
      s.position.z += s.userData.vz;
      if (Math.abs(s.position.x) > 6 || Math.abs(s.position.z) > 6) {
        const angle = Math.random() * Math.PI * 2;
        const rad = 2.5 + Math.random() * 2;
        s.position.set(Math.cos(angle) * rad, (Math.random() - 0.5) * 2, Math.sin(angle) * rad);
      }
    });

    // Camera: subtle parallax follow
    camera.position.x += (mouse.x * 0.3 - camera.position.x) * 0.02;
    camera.position.y += (-mouse.y * 0.2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // Mark canvas as ready for CSS transition
  heroCanvas.classList.add('hero__canvas--ready');

  // --- Resize ---
  window.addEventListener('resize', () => {
    const w = heroCanvas.clientWidth;
    const h = heroCanvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

/* ======================
   About Visual Scene
   ====================== */
function initAboutScene() {
  const aboutCanvas = document.getElementById('aboutCanvas');
  if (!aboutCanvas || !hasWebGL() || prefersReducedMotion()) return;

  const canvasRect = aboutCanvas.getBoundingClientRect();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvasRect.width / canvasRect.height, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(canvasRect.width, canvasRect.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.display = 'block';
  aboutCanvas.appendChild(renderer.domElement);

  // Simple geometric composition - Apple style
  const group = new THREE.Group();
  scene.add(group);

  const shapes = [
    { geo: new THREE.BoxGeometry(1, 1, 1), pos: [-1.5, 0.5, 0], rot: [0.3, 0.5, 0] },
    { geo: new THREE.ConeGeometry(0.6, 1.2, 8), pos: [1.5, 0.3, 0], rot: [0, 0, 0] },
    { geo: new THREE.CylinderGeometry(0.5, 0.5, 1, 16), pos: [0, -1, 0], rot: [0.5, 0, 0.3] },
    { geo: new THREE.TorusGeometry(0.5, 0.15, 16, 32), pos: [-1.2, -0.8, 0.8], rot: [0, 0.7, 0] },
  ];

  const shapeMat = new THREE.MeshPhysicalMaterial({
    color: 0x0071e3,
    metalness: 0.15,
    roughness: 0.25,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  });

  const meshes = shapes.map(({ geo, pos, rot }) => {
    const m = new THREE.Mesh(geo, shapeMat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.userData = { rotSpeed: [(Math.random() - 0.5) * 0.002, (Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.001] };
    group.add(m);
    return m;
  });

  camera.position.z = 4;

  function animate() {
    requestAnimationFrame(animate);
    meshes.forEach((m) => {
      m.rotation.x += m.userData.rotSpeed[0];
      m.rotation.y += m.userData.rotSpeed[1];
      m.rotation.z += m.userData.rotSpeed[2];
    });
    group.rotation.y += 0.0008;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = aboutCanvas.clientWidth;
    const h = aboutCanvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

/* ======================
   Scroll Reveal + Mobile Menu + Smooth Scroll
   ====================== */
function initUI() {
  // Scroll reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // Mobile menu
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinksAll = document.querySelectorAll('.nav__links a[href^="#"]');
  if (sections.length && navLinksAll.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinksAll.forEach((link) => {
            link.toggleAttribute('aria-current', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.5, rootMargin: '-50px 0px -50% 0px' });
    sections.forEach((s) => observer.observe(s));
  }
}

// --- Initialize ---
initHeroScene();
initAboutScene();
initUI();