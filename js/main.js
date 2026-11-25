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
   Generic Scene Creator (reusable for hero, promo, about, portfolio)
   ====================== */
function createScene(canvasId, fallbackId, contentSelector, options = {}) {
  const canvas = document.getElementById(canvasId);
  const fallback = document.getElementById(fallbackId);
  const content = canvas?.parentElement?.querySelector(contentSelector);

  if (!canvas || !hasWebGL() || prefersReducedMotion()) {
    if (canvas) canvas.style.display = 'none';
    if (fallback) fallback.classList.add('hero__fallback--visible', 'promo__fallback--visible');
    if (content) content.style.display = 'none';
    return null;
  }

  const canvasRect = canvas.getBoundingClientRect();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvasRect.width / canvasRect.height, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(canvasRect.width, canvasRect.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.display = 'block';
  canvas.appendChild(renderer.domElement);

  // --- Particles (subtle, Apple-style) ---
  const PARTICLE_COUNT = options.particleCount || 400;
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const speeds = new Float32Array(PARTICLE_COUNT);
  const phases = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = (options.radiusMin || 1.5) + Math.random() * (options.radiusMax || 4);
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
    color: options.particleColor || 0x0071e3,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- Central element (varies by scene) ---
  const centralMeshes = [];
  if (options.centralElement) {
    const { geometry, material, count = 1, positionFn } = options.centralElement;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      if (positionFn) positionFn(mesh, i);
      scene.add(mesh);
      centralMeshes.push(mesh);
    }
  }

  // --- Orbiting rings ---
  const rings = [];
  if (options.rings) {
    for (let i = 0; i < options.rings.count; i++) {
      const ringGeo = new THREE.RingGeometry(
        options.rings.innerRadius + i * options.rings.thickness,
        options.rings.innerRadius + options.rings.thickness + i * options.rings.thickness,
        64
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: options.rings.color || 0x0071e3,
        transparent: true,
        opacity: (options.rings.opacity || 0.08) - i * 0.02,
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
  }

  // --- Ambient spheres ---
  const ambientSpheres = [];
  if (options.ambientSpheres) {
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: options.ambientSpheres.color || 0x0a84ff,
      metalness: 0.1,
      roughness: 0.3,
      transparent: true,
      opacity: 0.15,
    });
    for (let i = 0; i < options.ambientSpheres.count; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 16, 16),
        sphereMat
      );
      const angle = Math.random() * Math.PI * 2;
      const rad = 2.5 + Math.random() * 2;
      s.position.set(Math.cos(angle) * rad, (Math.random() - 0.5) * 2, Math.sin(angle) * rad);
      s.userData = { vx: (Math.random() - 0.5) * 0.002, vy: (Math.random() - 0.5) * 0.003, vz: (Math.random() - 0.5) * 0.002 };
      ambientSpheres.push(s);
      scene.add(s);
    }
  }

  camera.position.z = options.cameraZ || 5.5;

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

    // Central elements
    centralMeshes.forEach((mesh, i) => {
      mesh.rotation.x += 0.001 + i * 0.0005;
      mesh.rotation.y += 0.002 + i * 0.0003;
      mesh.position.y = Math.sin(frame * 0.003 + i) * 0.15;
    });

    // Rings
    rings.forEach((ring) => {
      if (ring.userData.axis === 'x') ring.rotation.x += ring.userData.speed;
      else ring.rotation.z += ring.userData.speed;
    });

    // Ambient spheres
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
  canvas.classList.add('hero__canvas--ready', 'hero__media-canvas--ready', 'promo__media-canvas--ready');

  // --- Resize ---
  window.addEventListener('resize', () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  return { scene, camera, renderer };
}

/* ======================
   Initialize All Scenes
   ====================== */
function initAllScenes() {
  // Hero
  createScene('heroCanvas', 'heroFallback', '.hero__content', {
    particleCount: 600,
    particleColor: 0x0071e3,
    radiusMin: 2,
    radiusMax: 6,
    centralElement: {
      geometry: new THREE.IcosahedronGeometry(0.8, 12),
      material: new THREE.MeshPhysicalMaterial({
        color: 0x0071e3,
        metalness: 0.2,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        transmission: 0.3,
        thickness: 0.5,
        ior: 1.33,
      }),
      count: 1,
    },
    rings: { count: 3, innerRadius: 1.5, thickness: 0.4, color: 0x0071e3, opacity: 0.08 },
    ambientSpheres: { count: 8, color: 0x0a84ff },
    cameraZ: 5.5,
  });

  // Promo 1 (Joki Tugas) - blue theme
  createScene('promo1Canvas', 'promo1Fallback', '.promo__content', {
    particleCount: 300,
    particleColor: 0x0071e3,
    radiusMin: 1.5,
    radiusMax: 3,
    centralElement: {
      geometry: new THREE.BoxGeometry(1, 1, 1),
      material: new THREE.MeshPhysicalMaterial({
        color: 0x0071e3,
        metalness: 0.15,
        roughness: 0.25,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
      }),
      count: 1,
    },
    rings: { count: 2, innerRadius: 1.3, thickness: 0.3, color: 0x0071e3, opacity: 0.06 },
    ambientSpheres: { count: 4, color: 0x0a84ff },
    cameraZ: 4.5,
  });

  // Promo 2 (Website) - purple theme
  createScene('promo2Canvas', 'promo2Fallback', '.promo__content', {
    particleCount: 300,
    particleColor: 0x8b5cf6,
    radiusMin: 1.5,
    radiusMax: 3,
    centralElement: {
      geometry: new THREE.ConeGeometry(0.6, 1.2, 8),
      material: new THREE.MeshPhysicalMaterial({
        color: 0x8b5cf6,
        metalness: 0.15,
        roughness: 0.25,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
      }),
      count: 1,
    },
    rings: { count: 2, innerRadius: 1.3, thickness: 0.3, color: 0x8b5cf6, opacity: 0.06 },
    ambientSpheres: { count: 4, color: 0xa78bfa },
    cameraZ: 4.5,
  });

  // Promo 3 (AI) - green theme
  createScene('promo3Canvas', 'promo3Fallback', '.promo__content', {
    particleCount: 300,
    particleColor: 0x10b981,
    radiusMin: 1.5,
    radiusMax: 3,
    centralElement: {
      geometry: new THREE.TorusGeometry(0.6, 0.2, 16, 32),
      material: new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        metalness: 0.15,
        roughness: 0.25,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
      }),
      count: 1,
    },
    rings: { count: 2, innerRadius: 1.3, thickness: 0.3, color: 0x10b981, opacity: 0.06 },
    ambientSpheres: { count: 4, color: 0x34d399 },
    cameraZ: 4.5,
  });

  // Portfolio items (4 canvases)
  const portfolioConfigs = [
    { id: 'portfolio1Canvas', color: 0x0071e3, geometry: new THREE.BoxGeometry(1, 1, 1) },
    { id: 'portfolio2Canvas', color: 0x8b5cf6, geometry: new THREE.ConeGeometry(0.6, 1.2, 8) },
    { id: 'portfolio3Canvas', color: 0x10b981, geometry: new THREE.CylinderGeometry(0.5, 0.5, 1, 16) },
    { id: 'portfolio4Canvas', color: 0xf59e0b, geometry: new THREE.TorusGeometry(0.6, 0.2, 16, 32) },
  ];

  portfolioConfigs.forEach((cfg, i) => {
    createScene(cfg.id, null, '.portfolio-item__content', {
      particleCount: 200,
      particleColor: cfg.color,
      radiusMin: 1,
      radiusMax: 2.5,
      centralElement: {
        geometry: cfg.geometry,
        material: new THREE.MeshPhysicalMaterial({
          color: cfg.color,
          metalness: 0.15,
          roughness: 0.25,
          clearcoat: 0.5,
          clearcoatRoughness: 0.2,
        }),
        count: 1,
      },
      rings: { count: 1, innerRadius: 1.2, thickness: 0.25, color: cfg.color, opacity: 0.05 },
      ambientSpheres: { count: 3, color: cfg.color },
      cameraZ: 4,
    });
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
initAllScenes();
initUI();