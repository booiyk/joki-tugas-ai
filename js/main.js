import * as THREE from 'three';

/* ======================
   3D Hero Scene (Three.js) with WebGL fallback
   ====================== */
const heroCanvas = document.getElementById('heroCanvas');
const canvasRect = heroCanvas.getBoundingClientRect();

// --- WebGL capability guard ---
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

if (!hasWebGL()) {
  heroCanvas.style.display = 'none';
  const fallback = document.createElement('div');
  fallback.className = 'hero__fallback';
  fallback.innerHTML = `
    <div class="hero__content">
      <p class="hero__kicker">AI · Jasa Waktu · Cepat</p>
      <h1 class="hero__title">
        Joki Tugas & Website<br />Cepat & Cerdas
      </h1>
      <p class="hero__subtitle">
        Bantuan tugas akademik, pembuatan website profesional, dan solusi AI — semuanya dalam satu layanan.
      </p>
      <div class="hero__actions">
        <a href="#services" class="btn btn--primary">Lihat Jasa <span aria-hidden="true">↓</span></a>
        <a href="https://wa.me/6281234567890" class="btn btn--primary" target="_blank" rel="noopener">Chat WhatsApp</a>
      </div>
      <div class="hero__stats">
        <div class="hero__stat"><span class="hero__stat-num">500+</span><span class="hero__stat-label">Tugas Selesai</span></div>
        <div class="hero__stat"><span class="hero__stat-num">120+</span><span class="hero__stat-label">Website Lulus</span></div>
      </div>
    </div>`;
  document.querySelector('.hero').prepend(fallback);
} else {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, canvasRect.width / canvasRect.height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(canvasRect.width, canvasRect.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.display = 'block';
  heroCanvas.appendChild(renderer.domElement);

// --- Particle system ---
const PARTICLE_COUNT = 2200;
const pos = new Float32Array(PARTICLE_COUNT * 3);
const col = new Float32Array(PARTICLE_COUNT * 3);
const sizes = new Float32Array(PARTICLE_COUNT);
const speed = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 24;
  pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
  col[i * 3] = Math.random();
  col[i * 3 + 1] = Math.random();
  col[i * 3 + 2] = Math.random();
  sizes[i] = Math.random() * 0.06 + 0.01;
  speed[i] = Math.random() * 0.005 + 0.001;
}

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particleMat = new THREE.PointsMaterial({
  size: 0.045,
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// --- Orbiting ring for visual depth ---
const ringGeo = new THREE.RingGeometry(3.4, 4.0, 96);
const ringMat = new THREE.MeshBasicMaterial({
  color: 0x8b5cf6,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

// --- Central torus knot ---
const knotGeo = new THREE.TorusKnotGeometry(1.1, 0.38, 160, 16);
const knotMat = new THREE.MeshStandardMaterial({
  color: 0x8b5cf6,
  emissive: 0x8b5cf6,
  roughness: 0.25,
  metalness: 0.6,
});
const knot = new THREE.Mesh(knotGeo, knotMat);
knot.position.set(0, 0, 0);
scene.add(knot);

// --- Ambient small spheres ---
const sphereMat = new THREE.MeshStandardMaterial({
  color: 0x3b82f6,
  emissive: 0x3b82f6,
  roughness: 0.3,
  metalness: 0.4,
  transparent: true,
  opacity: 0.4,
});
for (let i = 0; i < 18; i++) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.2, 12, 12), sphereMat);
  const angle = Math.random() * Math.PI * 2;
  const rad = 2.4 + Math.random() * 2.0;
  s.position.set(
    Math.cos(angle) * rad,
    (Math.random() - 0.5) * 3.2,
    Math.sin(angle) * rad
  );
  s.vx = (Math.random() - 0.5) * 0.004;
  s.vy = (Math.random() - 0.5) * 0.006;
  s.vz = (Math.random() - 0.5) * 0.004;
  scene.add(s);
}

camera.position.z = 5.2;

// --- Mouse interaction ---
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

document.addEventListener('mousemove', (e) => {
  mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// --- Animation loop ---
function animate() {
  requestAnimationFrame(animate);

  // Mouse lerp
  mouse.x += (mouse.targetX - mouse.x) * 0.07;
  mouse.y += (mouse.targetY - mouse.y) * 0.07;

  // Particles drift upward
  const p = particles.geometry.attributes.position.array;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    p[i * 3 + 1] += speed[i];
    if (p[i * 3 + 1] > 8) {
      p[i * 3] = (Math.random() - 0.5) * 24;
      p[i * 3 + 1] = -8;
      p[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;

  // Subtle color drift
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    col[i * 3] += (Math.random() - 0.5) * 0.0004;
    col[i * 3 + 1] += (Math.random() - 0.5) * 0.0004;
    col[i * 3 + 2] += (Math.random() - 0.5) * 0.0004;
  }
  particles.geometry.attributes.color.needsUpdate = true;

  // Camera follows mouse
  camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05;
  camera.position.y += (mouse.y * 0.35 - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);

  // Ring rotation
  ring.rotation.z += 0.004;

  // Knot rotation
  knot.rotation.x += 0.006;
  knot.rotation.y += 0.014;

  // Spheres float
  const spp = scene.children.filter(c => c.isMesh && c.geometry.type === 'SphereGeometry');
  for (const s of spp) {
    s.position.x += s.vx;
    s.position.y += s.vy;
    s.position.z += s.vz;
    if (Math.abs(s.position.x) > 5 || Math.abs(s.position.z) > 5) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 2.4 + Math.random() * 2.0;
      s.position.set(Math.cos(angle) * rad, (Math.random() - 0.5) * 3.2, Math.sin(angle) * rad);
      s.vx = (Math.random() - 0.5) * 0.008;
      s.vy = (Math.random() - 0.5) * 0.008;
      s.vz = (Math.random() - 0.5) * 0.008;
    }
  }

  renderer.render(scene, camera);
}

animate();

// --- Resize ---
window.addEventListener('resize', () => {
  const w = heroCanvas.clientWidth;
  const h = heroCanvas.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

} // end else (hasWebGL)

/* ======================
   Scroll reveal + mobile menu
   ====================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

const burger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', isOpen);
});

// Close menu on link click
navLinks.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  });
});

// Smooth anchor scroll (fallback for anchors on this page)
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
