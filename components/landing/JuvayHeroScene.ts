/**
 * Premium procedural island stall — no network models.
 * Golden-hour lighting, rounded geometry, PBR materials, soft shadows, fog.
 * Lazy-loaded; paused offscreen; DPR capped by the caller.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type HeroSceneHandle = {
  setProgress: (t: number) => void;
  setPointer: (x: number, y: number) => void;
  setGyro: (beta: number, gamma: number) => void;
  setVisible: (v: boolean) => void;
  setFrame: (frame: 'mobile' | 'desktop') => void;
  resize: () => void;
  dispose: () => void;
};

function smoothstep(e0: number, e1: number, x: number): number {
  if (e1 === e0) return x >= e1 ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function rbox(w: number, h: number, d: number, r = 0.04, segs = 4): RoundedBoxGeometry {
  return new RoundedBoxGeometry(w, h, d, segs, Math.min(r, Math.min(w, h, d) * 0.45));
}

function makeCanvas(w: number, h: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  paint(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function woodTex(tone = '#6b3f1f'): THREE.CanvasTexture {
  return makeCanvas(256, 256, (g, w, h) => {
    g.fillStyle = tone;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 28; i++) {
      const x = (i / 28) * w + Math.sin(i * 1.7) * 4;
      g.strokeStyle = `rgba(40,18,6,${0.08 + (i % 3) * 0.05})`;
      g.lineWidth = 1 + (i % 4 === 0 ? 2 : 0);
      g.beginPath();
      g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 8) {
        g.lineTo(x + Math.sin(y * 0.08 + i) * 3, y);
      }
      g.stroke();
    }
    g.globalAlpha = 0.12;
    g.fillStyle = '#2a1408';
    for (let i = 0; i < 40; i++) {
      g.fillRect(Math.random() * w, Math.random() * h, 2, 8);
    }
  });
}

function paperTex(): THREE.CanvasTexture {
  return makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#f3e6c8';
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(180,140,80,0.12)';
    for (let i = 0; i < 80; i++) {
      g.beginPath();
      g.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 18, 4 + Math.random() * 8, Math.random(), 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = 'rgba(90,60,30,0.15)';
    g.strokeRect(4, 4, w - 8, h - 8);
  });
}

function labelTex(title: string, sub: string, bg: string, fg: string): THREE.CanvasTexture {
  return makeCanvas(256, 160, (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = fg;
    g.lineWidth = 6;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 42px system-ui,sans-serif';
    g.fillText(title, w / 2, h / 2 - 14);
    g.font = '22px system-ui,sans-serif';
    g.fillText(sub, w / 2, h / 2 + 28);
  });
}

function skyTex(): THREE.CanvasTexture {
  return makeCanvas(8, 512, (g, _w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#16364a');
    grd.addColorStop(0.36, '#2a6a7a');
    grd.addColorStop(0.52, '#e8954c');
    grd.addColorStop(0.68, '#f6cf96');
    grd.addColorStop(1, '#f7e6c6');
    g.fillStyle = grd;
    g.fillRect(0, 0, 8, h);
  });
}

function phoneTex(): THREE.CanvasTexture {
  return makeCanvas(256, 512, (g, w, h) => {
    g.fillStyle = '#fff8f0';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#0b1f24';
    g.fillRect(0, 0, w, 52);
    g.fillStyle = '#f5c14a';
    g.font = 'bold 24px system-ui,sans-serif';
    g.fillText('Juvay', 18, 34);
    g.fillStyle = '#fff8f0';
    g.font = '13px system-ui,sans-serif';
    g.fillText('Your store', 148, 33);
    g.fillStyle = '#ce1126';
    g.beginPath();
    g.roundRect(16, 68, 224, 100, 14);
    g.fill();
    g.fillStyle = '#fff8f0';
    g.font = 'bold 18px system-ui,sans-serif';
    g.fillText('Add your first item', 32, 126);
    const rows = [
      { t: 'Cash pickup', s: '0% on cash and COD' },
      { t: 'Cash on delivery', s: '0% on cash and COD' },
      { t: 'Wam online', s: 'When you are ready' },
    ];
    rows.forEach((r, i) => {
      const y = 188 + i * 88;
      g.fillStyle = '#fff';
      g.strokeStyle = 'rgba(20,20,20,0.1)';
      g.lineWidth = 2;
      g.beginPath();
      g.roundRect(16, y, 224, 76, 14);
      g.fill();
      g.stroke();
      g.fillStyle = '#f5c14a';
      g.beginPath();
      g.roundRect(28, y + 14, 48, 48, 8);
      g.fill();
      g.fillStyle = '#141414';
      g.font = 'bold 16px system-ui,sans-serif';
      g.fillText(r.t, 88, y + 34);
      g.fillStyle = '#5c574e';
      g.font = '12px system-ui,sans-serif';
      g.fillText(r.s, 88, y + 54);
    });
    g.fillStyle = '#6b6256';
    g.font = '11px system-ui,sans-serif';
    g.fillText('Illustrative store preview', 16, 496);
  });
}

function signTex(text: string, bg: string, fg: string): THREE.CanvasTexture {
  return makeCanvas(256, 96, (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.25)';
    g.lineWidth = 6;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = fg;
    g.font = 'bold 48px system-ui,sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2);
  });
}

function billTex(): THREE.CanvasTexture {
  return makeCanvas(256, 128, (g, w, h) => {
    g.fillStyle = '#1f6b45';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d4f0c8';
    g.lineWidth = 4;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#e8f8e0';
    g.font = 'bold 36px system-ui,sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('CASH', w / 2, h / 2);
  });
}

function steamTex(): THREE.CanvasTexture {
  return makeCanvas(64, 64, (g, w, h) => {
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(255,255,255,0.7)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
}

function contactShadowTex(): THREE.CanvasTexture {
  return makeCanvas(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.save();
    g.translate(w / 2, h / 2);
    g.scale(1.15, 0.55);
    const grd = g.createRadialGradient(0, 0, 6, 0, 0, 150);
    grd.addColorStop(0, 'rgba(20,12,6,0.7)');
    grd.addColorStop(0.32, 'rgba(20,12,6,0.32)');
    grd.addColorStop(0.65, 'rgba(20,12,6,0.1)');
    grd.addColorStop(1, 'rgba(20,12,6,0)');
    g.fillStyle = grd;
    g.fillRect(-180, -180, 360, 360);
    g.restore();
  });
}

function sandTex(): THREE.CanvasTexture {
  return makeCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#e8d5b0';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${160 + Math.random() * 60},${130 + Math.random() * 40},${80 + Math.random() * 30},${0.15})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (mat) {
      const list = Array.isArray(mat) ? mat : [mat];
      list.forEach((m) => {
        Object.values(m).forEach((v) => {
          if (v && typeof v === 'object' && (v as THREE.Texture).isTexture) {
            (v as THREE.Texture).dispose();
          }
        });
        m.dispose();
      });
    }
  });
}

function makePalm(height = 2.6, lean = 0.12): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x7a4a28,
    roughness: 0.82,
    metalness: 0.02,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x1d6b3a,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const leafBack = new THREE.MeshStandardMaterial({
    color: 0x8fb85a,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lean * 0.4, height * 0.5, 0),
    new THREE.Vector3(lean, height, 0),
  );
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.055, 10, false), trunkMat);
  trunk.castShadow = true;
  g.add(trunk);
  const tip = curve.getPoint(1);
  const frondCount = 9;
  for (let i = 0; i < frondCount; i++) {
    const frond = new THREE.Group();
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.016, 1.35, 6), leafMat);
    mid.rotation.z = Math.PI / 2;
    mid.position.x = 0.62;
    frond.add(mid);
    for (let k = 0; k < 11; k++) {
      const leaflet = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.38, 1, 2), k % 2 ? leafMat : leafBack);
      leaflet.position.set(0.12 + k * 0.11, 0, 0);
      leaflet.rotation.z = (k % 2 ? 1 : -1) * (0.95 - k * 0.04);
      leaflet.rotation.y = 0.15;
      frond.add(leaflet);
    }
    frond.position.copy(tip);
    frond.rotation.y = (i / frondCount) * Math.PI * 2;
    frond.rotation.z = -0.55 - (i % 3) * 0.08;
    frond.rotation.x = (i % 2 ? 0.1 : -0.08);
    g.add(frond);
  }
  return g;
}

function bottleLathe(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0),
    new THREE.Vector2(0.055, 0),
    new THREE.Vector2(0.07, 0.02),
    new THREE.Vector2(0.078, 0.2),
    new THREE.Vector2(0.072, 0.3),
    new THREE.Vector2(0.042, 0.36),
    new THREE.Vector2(0.03, 0.4),
    new THREE.Vector2(0.03, 0.5),
    new THREE.Vector2(0.038, 0.52),
    new THREE.Vector2(0.0, 0.52),
  ];
  return new THREE.LatheGeometry(pts, 24);
}

function potLathe(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.12, 0),
    new THREE.Vector2(0.16, 0.02),
    new THREE.Vector2(0.18, 0.16),
    new THREE.Vector2(0.2, 0.2),
    new THREE.Vector2(0.17, 0.22),
    new THREE.Vector2(0.0, 0.22),
  ];
  return new THREE.LatheGeometry(pts, 24);
}

export function createJuvayHeroScene(
  canvas: HTMLCanvasElement,
  opts: { dprCap?: number; reducedMotion?: boolean; shadows?: boolean } = {},
): HeroSceneHandle {
  const dprCap = opts.dprCap ?? 1.5;
  const reducedMotion = !!opts.reducedMotion;
  const shadows = !!opts.shadows && !reducedMotion;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: dprCap > 1.1,
    alpha: true,
    powerPreference: shadows ? 'high-performance' : 'low-power',
    stencil: false,
    depth: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setClearColor(0x0c2c38, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = shadows;
  if (shadows) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe8b86a, 14, 36);

  const skyMap = skyTex();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(42, 32, 24),
    new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  scene.add(sky);

  // Environment for PBR highlights (procedural, no file)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room as unknown as THREE.Scene, 0.06).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.55;
  (room as unknown as { dispose?: () => void }).dispose?.();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  const camHome = new THREE.Vector3(4.05, 2.7, 7.9);
  const camLook = new THREE.Vector3(0.15, 1.15, 0);
  camera.position.copy(camHome);

  const hemi = new THREE.HemisphereLight(0xffe0b0, 0x3a5a48, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffc078, 2.15);
  sun.position.set(-5.5, 7.2, 4.2);
  sun.castShadow = shadows;
  if (shadows) {
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 28;
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 3.5;
  }
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x89c6d2, 0.45);
  rim.position.set(6, 2.2, -4);
  scene.add(rim);
  const flash = new THREE.PointLight(0xfff4d0, 0, 8);
  flash.position.set(0.4, 2.2, 1.6);
  scene.add(flash);

  // Sun disk + glow
  const sunSprite = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, fog: false, transparent: true, opacity: 0.95 }),
  );
  sunSprite.position.set(-7, 6.2, -10);
  scene.add(sunSprite);

  const root = new THREE.Group();
  scene.add(root);

  const sandMap = sandTex();
  sandMap.wrapS = sandMap.wrapT = THREE.RepeatWrapping;
  sandMap.repeat.set(4, 4);
  const sand = new THREE.Mesh(
    new THREE.CircleGeometry(11, 64),
    new THREE.MeshStandardMaterial({ color: 0xe8d5b0, map: sandMap, roughness: 1, metalness: 0 }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.receiveShadow = true;
  root.add(sand);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(18, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x0d6e72,
      roughness: 0.18,
      metalness: 0.08,
      envMapIntensity: 0.9,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.1, -4);
  root.add(water);

  const hillMat = new THREE.MeshStandardMaterial({ color: 0x1c5344, roughness: 0.9 });
  for (const [x, z, s] of [
    [-6.8, -8.4, 2.5],
    [-3.4, -9.8, 1.9],
    [5.8, -9.2, 2.9],
    [8.5, -7.6, 1.7],
  ] as Array<[number, number, number]>) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(s, 24, 16), hillMat);
    hill.position.set(x, s * 0.22, z);
    hill.scale.y = 0.5;
    root.add(hill);
  }

  const palmL = makePalm(2.7, -0.18);
  palmL.position.set(-3.5, 0, -1.55);
  const palmR = makePalm(2.2, 0.22);
  palmR.position.set(4.35, 0, -0.85);
  const palmB = makePalm(1.85, -0.1);
  palmB.position.set(-5.4, 0, 1.15);
  root.add(palmL, palmR, palmB);

  const contactMap = contactShadowTex();
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 3.6),
    new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false, opacity: 1 }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, 0.014, 0.2);
  root.add(contact);

  // ——— Stall ———
  const stall = new THREE.Group();
  stall.rotation.y = 0.18;
  root.add(stall);

  const woodMap = woodTex('#6b3f1f');
  const woodDarkMap = woodTex('#3d2414');
  const wood = new THREE.MeshStandardMaterial({ map: woodMap, color: 0x8a5530, roughness: 0.72, metalness: 0.04 });
  const woodDark = new THREE.MeshStandardMaterial({ map: woodDarkMap, color: 0x4a2c18, roughness: 0.78, metalness: 0.03 });
  const metalRoof = new THREE.MeshStandardMaterial({
    color: 0x5a3a28,
    roughness: 0.45,
    metalness: 0.28,
    envMapIntensity: 0.7,
  });

  const posts: THREE.Mesh[] = [];
  const postGeo = new THREE.CylinderGeometry(0.055, 0.068, 2.18, 16);
  (
    [
      [-1.38, 1.09, 0.58],
      [1.38, 1.09, 0.58],
      [-1.38, 1.09, -0.72],
      [1.38, 1.09, -0.72],
    ] as Array<[number, number, number]>
  ).forEach((p) => {
    const m = new THREE.Mesh(postGeo, wood);
    m.position.set(p[0], p[1], p[2]);
    m.castShadow = true;
    posts.push(m);
    stall.add(m);
  });

  const beam = new THREE.Mesh(rbox(2.98, 0.1, 0.1, 0.03), woodDark);
  beam.position.set(0, 2.18, 0);
  beam.castShadow = true;
  const beamZ = new THREE.Mesh(rbox(0.1, 0.1, 1.5, 0.03), woodDark);
  beamZ.position.set(0, 2.18, -0.05);
  stall.add(beam, beamZ);

  const roofL = new THREE.Mesh(rbox(1.9, 0.07, 2.05, 0.02, 3), metalRoof);
  roofL.position.set(-0.82, 2.52, -0.05);
  roofL.rotation.z = 0.36;
  roofL.castShadow = true;
  const roofR = new THREE.Mesh(rbox(1.9, 0.07, 2.05, 0.02, 3), metalRoof);
  roofR.position.set(0.82, 2.52, -0.05);
  roofR.rotation.z = -0.36;
  roofR.castShadow = true;
  stall.add(roofL, roofR);
  roofL.userData.ridge = true;
  roofR.userData.ridge = true;

  // Awning — canvas-look stripes, will sway
  const awning = new THREE.Group();
  const stripeColors = [0xf5c14a, 0xfff6e0, 0x0d9488, 0xf5c14a, 0xfff6e0, 0xce1126];
  stripeColors.forEach((col, i) => {
    const s = new THREE.Mesh(
      rbox(0.43, 0.045, 1.08, 0.02, 3),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.78, metalness: 0 }),
    );
    s.position.set(-1.075 + i * 0.43, 2.06, 0.88);
    s.rotation.x = 0.32;
    s.castShadow = true;
    awning.add(s);
  });
  stall.add(awning);

  const woodLight = new THREE.MeshStandardMaterial({
    map: woodTex('#b07a42'),
    color: 0xc4a06a,
    roughness: 0.62,
    metalness: 0.04,
  });
  const creamPaint = new THREE.MeshStandardMaterial({ color: 0xe8d5b0, roughness: 0.84, metalness: 0 });
  const counterGroup = new THREE.Group();
  const counter = new THREE.Mesh(rbox(2.78, 0.12, 0.96, 0.05, 5), woodLight);
  counter.position.set(0, 0.95, 0.36);
  counter.castShadow = true;
  counter.receiveShadow = true;
  const lip = new THREE.Mesh(rbox(2.82, 0.045, 0.07, 0.018, 4), wood);
  lip.position.set(0, 1.015, 0.82);
  lip.castShadow = true;
  const apron = new THREE.Mesh(rbox(2.52, 0.6, 0.08, 0.045, 4), creamPaint);
  apron.position.set(0, 0.55, 0.76);
  apron.castShadow = true;
  const apronFrameT = new THREE.Mesh(rbox(2.78, 0.09, 0.1, 0.025, 3), woodDark);
  apronFrameT.position.set(0, 0.86, 0.77);
  const apronFrameB = new THREE.Mesh(rbox(2.78, 0.09, 0.1, 0.025, 3), woodDark);
  apronFrameB.position.set(0, 0.24, 0.77);
  const apronFrameL = new THREE.Mesh(rbox(0.09, 0.74, 0.1, 0.025, 3), woodDark);
  apronFrameL.position.set(-1.345, 0.52, 0.77);
  const apronFrameR = new THREE.Mesh(rbox(0.09, 0.74, 0.1, 0.025, 3), woodDark);
  apronFrameR.position.set(1.345, 0.52, 0.77);
  counterGroup.add(counter, lip, apron, apronFrameT, apronFrameB, apronFrameL, apronFrameR);
  counterGroup.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  stall.add(counterGroup);

  const signMap = signTex('OPEN', '#0b8a80', '#fff8f0');
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.3),
    new THREE.MeshStandardMaterial({ map: signMap, roughness: 0.45 }),
  );
  sign.position.set(0, 1.74, 0.74);
  const signFrame = new THREE.Mesh(rbox(0.78, 0.36, 0.04, 0.02), woodDark);
  signFrame.position.set(0, 1.74, 0.72);
  stall.add(signFrame, sign);

  // ——— Goods ———
  const products = new THREE.Group();
  stall.add(products);
  const paperMap = paperTex();
  const paperMat = new THREE.MeshStandardMaterial({ map: paperMap, color: 0xf3e6c8, roughness: 0.88 });
  const baraMat = new THREE.MeshStandardMaterial({ color: 0xe8b445, roughness: 0.62 });

  // Doubles: open paper wraps with flat bara and chutney peeking over the rim
  const chutneyY = new THREE.MeshStandardMaterial({ color: 0xf0c14a, roughness: 0.45 });
  const chutneyG = new THREE.MeshStandardMaterial({ color: 0x3f6b28, roughness: 0.5 });
  const chutneyT = new THREE.MeshStandardMaterial({ color: 0x6b3a12, roughness: 0.48 });
  const channa = new THREE.MeshStandardMaterial({ color: 0xd4a034, roughness: 0.58 });
  for (let i = 0; i < 3; i++) {
    const wrap = new THREE.Group();
    // Shallow paper boat — sides short so the food is the hero
    const base = new THREE.Mesh(rbox(0.32, 0.022, 0.27, 0.02, 4), paperMat);
    const front = new THREE.Mesh(rbox(0.32, 0.08, 0.018, 0.01, 3), paperMat);
    front.position.set(0, 0.045, 0.125);
    front.rotation.x = -0.28;
    const back = new THREE.Mesh(rbox(0.32, 0.11, 0.018, 0.01, 3), paperMat);
    back.position.set(0, 0.06, -0.125);
    back.rotation.x = 0.18;
    // Back flap folded over, classic wax-paper wrap
    const flap = new THREE.Mesh(rbox(0.3, 0.016, 0.1, 0.01, 3), paperMat);
    flap.position.set(0, 0.125, -0.06);
    flap.rotation.x = 0.55;
    const left = new THREE.Mesh(rbox(0.018, 0.09, 0.26, 0.01, 3), paperMat);
    left.position.set(-0.15, 0.05, 0);
    left.rotation.z = 0.28;
    const right = new THREE.Mesh(rbox(0.018, 0.09, 0.26, 0.01, 3), paperMat);
    right.position.set(0.15, 0.05, 0);
    right.rotation.z = -0.28;
    const bara = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.115, 0.042, 28), baraMat);
    bara.position.y = 0.04;
    const bara2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.108, 0.04, 28), baraMat);
    bara2.position.set(0.01, 0.078, 0.01);
    bara2.rotation.y = 0.4;
    const curry = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), channa);
    curry.scale.set(1, 0.28, 0.88);
    curry.position.set(0.01, 0.105, 0.015);
    const d1 = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 10), i === 1 ? chutneyG : chutneyY);
    d1.scale.set(1.25, 0.55, 1.05);
    d1.position.set(0.04, 0.13, 0.03);
    const d2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), i === 2 ? chutneyT : chutneyG);
    d2.scale.set(1.15, 0.5, 1);
    d2.position.set(-0.035, 0.132, -0.01);
    wrap.add(base, front, back, flap, left, right, bara, bara2, curry, d1, d2);
    wrap.position.set(-0.98 + i * 0.4, 1.07, 0.3);
    wrap.rotation.y = -0.18 + i * 0.14;
    wrap.rotation.x = -0.08;
    wrap.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    products.add(wrap);
  }

  // Sauce bottles with labels
  const bottleGeo = bottleLathe();
  const sauces: Array<{ col: number; name: string; sub: string; bg: string; fg: string }> = [
    { col: 0x9b1b1b, name: 'Pepper', sub: 'Hot sauce', bg: '#7a1515', fg: '#fde68a' },
    { col: 0xc48a1a, name: 'Tamarind', sub: 'Chutney', bg: '#8a5a10', fg: '#fff8f0' },
    { col: 0x2f5a28, name: 'Chadon', sub: 'Beni', bg: '#1d3d1c', fg: '#d9f99d' },
    { col: 0x6b2d12, name: 'Garlic', sub: 'Sauce', bg: '#4a1e0c', fg: '#fed7aa' },
  ];
  sauces.forEach((s, i) => {
    const b = new THREE.Group();
    const glass = new THREE.Mesh(
      bottleGeo,
      new THREE.MeshPhysicalMaterial({
        color: s.col,
        roughness: 0.16,
        metalness: 0.05,
        transmission: 0.18,
        thickness: 0.12,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        transparent: true,
        opacity: 0.95,
        envMapIntensity: 1,
      }),
    );
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.034, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.3 }),
    );
    cap.position.y = 0.545;
    const labMap = labelTex(s.name, s.sub, s.bg, s.fg);
    const lab = new THREE.Mesh(
      new THREE.PlaneGeometry(0.11, 0.09),
      new THREE.MeshStandardMaterial({ map: labMap, roughness: 0.55 }),
    );
    lab.position.set(0, 0.2, 0.072);
    b.add(glass, cap, lab);
    b.position.set(0.22 + i * 0.18, 1.08, 0.58);
    b.castShadow = true;
    glass.castShadow = true;
    products.add(b);
  });

  // Fruit crate
  const crateMat = new THREE.MeshStandardMaterial({ map: woodMap, color: 0x8a5a2b, roughness: 0.75 });
  const fruitCrate = new THREE.Mesh(rbox(0.52, 0.2, 0.4, 0.03, 3), crateMat);
  fruitCrate.position.set(1.0, 1.15, 0.22);
  fruitCrate.castShadow = true;
  products.add(fruitCrate);
  const fruits: Array<[number, number, number, number]> = [
    [0xe07b3c, -0.12, 0.16, -0.05],
    [0xe8a317, 0.1, 0.16, 0.06],
    [0xd45a1a, 0.0, 0.18, -0.1],
    [0xf0a020, -0.05, 0.2, 0.1],
    [0xc94e12, 0.14, 0.17, -0.08],
  ];
  fruits.forEach(([col, x, y, z]) => {
    const f = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 18, 14),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 }),
    );
    f.position.set(1.0 + x, 1.08 + y, 0.22 + z);
    f.castShadow = true;
    products.add(f);
  });

  // Fish crate
  const fishCrate = new THREE.Mesh(rbox(0.55, 0.16, 0.38, 0.03, 3), crateMat);
  fishCrate.position.set(-0.05, 1.13, 0.18);
  fishCrate.castShadow = true;
  products.add(fishCrate);
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8f4ff,
    roughness: 0.15,
    transmission: 0.35,
    thickness: 0.08,
    transparent: true,
    opacity: 0.7,
  });
  for (let i = 0; i < 5; i++) {
    const ice = new THREE.Mesh(rbox(0.1, 0.05, 0.08, 0.015, 2), iceMat);
    ice.position.set(-0.2 + i * 0.1, 1.2, 0.12 + (i % 2) * 0.08);
    ice.rotation.y = i * 0.4;
    products.add(ice);
  }
  const fishMat = new THREE.MeshStandardMaterial({ color: 0xb7c4cc, roughness: 0.32, metalness: 0.35, envMapIntensity: 0.9 });
  for (let i = 0; i < 2; i++) {
    const fish = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), fishMat);
    body.scale.set(1.8, 0.55, 0.7);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.1, 8), fishMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.2;
    fish.add(body, tail);
    fish.position.set(-0.12 + i * 0.22, 1.26, 0.2 - i * 0.06);
    fish.rotation.y = 0.3 - i * 0.2;
    body.castShadow = true;
    products.add(fish);
  }

  // Corn-soup pot + steam
  const potGroup = new THREE.Group();
  const pot = new THREE.Mesh(
    potLathe(),
    new THREE.MeshStandardMaterial({ color: 0x6a6e72, roughness: 0.32, metalness: 0.72, envMapIntensity: 1 }),
  );
  pot.castShadow = true;
  const potRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.185, 0.018, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0x8a8e92, roughness: 0.3, metalness: 0.7 }),
  );
  potRim.rotation.x = Math.PI / 2;
  potRim.position.y = 0.21;
  potGroup.add(pot, potRim);
  potGroup.position.set(0.72, 1.08, 0.58);
  products.add(potGroup);

  const steamMap = steamTex();
  const steamMat = new THREE.SpriteMaterial({ map: steamMap, color: 0xfff4e0, transparent: true, depthWrite: false, opacity: 0.75 });
  const steams: THREE.Sprite[] = [];
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Sprite(steamMat.clone());
    sp.scale.set(0.22, 0.28, 1);
    sp.userData.phase = i * 0.7;
    potGroup.add(sp);
    steams.push(sp);
  }

  // Phone
  const phone = new THREE.Group();
  const phoneBody = new THREE.Mesh(
    rbox(0.74, 1.46, 0.07, 0.06, 5),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.28, metalness: 0.55 }),
  );
  const phoneMap = phoneTex();
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.64, 1.28),
    new THREE.MeshStandardMaterial({ map: phoneMap, roughness: 0.22 }),
  );
  phoneScreen.position.z = 0.038;
  phone.add(phoneBody, phoneScreen);
  phone.position.set(2.2, 1.48, 1.5);
  phone.rotation.set(0.08, -0.48, 0);
  phoneBody.castShadow = true;
  root.add(phone);

  // Chat bubble
  const chat = new THREE.Group();
  const chatMat = new THREE.MeshStandardMaterial({ color: 0x19a15f, roughness: 0.4 });
  const chatBall = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 18), chatMat);
  const chatTail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 12), chatMat);
  chatTail.position.set(-0.16, -0.25, 0);
  chatTail.rotation.z = 0.7;
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xeffff3 });
  const l1 = new THREE.Mesh(rbox(0.26, 0.035, 0.035, 0.015, 2), lineMat);
  l1.position.set(0, 0.05, 0.22);
  const l2 = new THREE.Mesh(rbox(0.18, 0.035, 0.035, 0.015, 2), lineMat);
  l2.position.set(-0.04, -0.05, 0.22);
  chat.add(chatBall, chatTail, l1, l2);
  chat.position.set(-1.9, 1.88, 1.55);
  root.add(chat);

  // Cash + Wam
  const pay = new THREE.Group();
  const billMap = billTex();
  for (let i = 0; i < 3; i++) {
    const bill = new THREE.Mesh(
      rbox(0.7, 0.015, 0.36, 0.01, 2),
      new THREE.MeshStandardMaterial({ map: billMap, roughness: 0.62, color: 0x2a8a55 }),
    );
    // Use a plane with the bill texture on top
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.36),
      new THREE.MeshStandardMaterial({ map: billMap, roughness: 0.58, side: THREE.DoubleSide }),
    );
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.01;
    const wrapB = new THREE.Group();
    wrapB.add(bill, face);
    wrapB.position.set(0, 0.012 * i, 0.008 * i);
    wrapB.rotation.y = -0.12 + i * 0.08;
    wrapB.rotation.z = -0.08;
    pay.add(wrapB);
  }
  const chip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.27, 0.055, 32),
    new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.28, metalness: 0.35 }),
  );
  chip.rotation.x = Math.PI / 2.3;
  chip.position.set(0.62, 0.08, 0.04);
  const wamMap = signTex('Wam', '#0d9488', '#fff8f0');
  const wamLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.17),
    new THREE.MeshStandardMaterial({ map: wamMap, roughness: 0.4 }),
  );
  wamLabel.position.set(0.62, 0.14, 0.1);
  wamLabel.rotation.x = -0.38;
  pay.add(chip, wamLabel);
  pay.position.set(-1.15, 1.25, 1.95);
  root.add(pay);

  // Camera prop (photo snap)
  const camProp = new THREE.Group();
  const camBody = new THREE.Mesh(
    rbox(0.42, 0.3, 0.18, 0.04, 4),
    new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.32, metalness: 0.4 }),
  );
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.1, 0.12, 24),
    new THREE.MeshStandardMaterial({ color: 0x1b3a4a, roughness: 0.15, metalness: 0.7 }),
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.12;
  camProp.add(camBody, lens);
  camProp.position.set(-2.05, 1.42, 1.35);
  camProp.rotation.y = 0.5;
  camBody.castShadow = true;
  root.add(camProp);

  let progress = reducedMotion ? 1 : 0.5;
  let pointer = { x: 0, y: 0 };
  let gyro = { x: 0, y: 0 };
  let targetPointer = { x: 0, y: 0 };
  let visible = true;
  let raf = 0;
  let flashUntil = 0;
  let didFlash = false;
  let frame: 'mobile' | 'desktop' = 'desktop';
  const clock = new THREE.Clock();

  const applyAssembly = (t: number) => {
    const stallT = smoothstep(0.12, 0.42, t);
    posts.forEach((p, i) => {
      const pt = smoothstep(0.12 + i * 0.03, 0.32 + i * 0.03, t);
      p.scale.y = Math.max(0.001, pt);
      p.position.y = 1.09 * pt;
    });
    const roofT = smoothstep(0.18, 0.42, t);
    const roofVisible = roofT > 0.04;
    roofL.visible = roofVisible;
    roofR.visible = roofVisible;
    beam.visible = roofVisible;
    beamZ.visible = roofVisible;
    roofL.position.y = 2.52 + (1 - roofT) * 0.5;
    roofR.position.y = 2.52 + (1 - roofT) * 0.5;
    beam.position.y = 2.18 + (1 - roofT) * 0.4;
    beamZ.position.y = 2.18 + (1 - roofT) * 0.4;
    awning.scale.setScalar(Math.max(0.001, smoothstep(0.28, 0.48, t)));
    awning.visible = roofT > 0.12;
    sign.scale.setScalar(Math.max(0.001, smoothstep(0.36, 0.52, t)));
    signFrame.scale.setScalar(Math.max(0.001, smoothstep(0.36, 0.52, t)));
    counterGroup.scale.x = Math.max(0.001, stallT);

    const prodT = smoothstep(0.32, 0.5, t);
    products.scale.setScalar(Math.max(0.001, prodT));
    products.visible = prodT > 0.02;
    if (prodT > 0.85 && !didFlash) {
      didFlash = true;
      flashUntil = performance.now() + 220;
    }
    if (t < 0.35) didFlash = false;

    const camT = smoothstep(0.05, 0.28, t);
    camProp.scale.setScalar(Math.max(0.001, camT * (1 - smoothstep(0.45, 0.65, t) * 0.15)));
    camProp.visible = camT > 0.05;

    const phoneT = smoothstep(0.5, 0.72, t);
    phone.scale.setScalar(Math.max(0.001, phoneT));
    phone.position.y = 1.48 + (1 - phoneT) * 1.15;
    phone.visible = phoneT > 0.02;

    const chatT = smoothstep(0.68, 0.86, t);
    chat.scale.setScalar(Math.max(0.001, chatT));
    chat.visible = chatT > 0.02;

    const payT = smoothstep(0.8, 0.98, t);
    pay.scale.setScalar(Math.max(0.001, payT));
    pay.position.y = 1.25 + (1 - payT) * 0.8;
    pay.visible = payT > 0.02;

    const dolly = smoothstep(0.05, 0.75, t);
    camHome.set(4.25 - dolly * 0.5, 2.85 - dolly * 0.2, 8.35 - dolly * 1.0);
    camLook.set(0.15 + dolly * 0.12, 1.12 + dolly * 0.12, 0.04);
  };

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
    const width = Math.max(1, Math.floor(w));
    const height = Math.max(1, Math.floor(h));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const tick = (now: number) => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(0.05, clock.getDelta());
    const tsec = now * 0.001;
    pointer.x += (targetPointer.x - pointer.x) * (1 - Math.pow(0.001, dt));
    pointer.y += (targetPointer.y - pointer.y) * (1 - Math.pow(0.001, dt));

    applyAssembly(progress);

    const px = pointer.x + gyro.x;
    const py = pointer.y + gyro.y;
    const mobile = frame === 'mobile';
    camera.position.x = camHome.x + px * 0.5 + (mobile ? 0.05 : 0);
    camera.position.y = camHome.y + py * 0.32 + (mobile ? 0.15 : 0);
    camera.position.z = camHome.z + (mobile ? 1.1 : 0);
    camera.lookAt(
      camLook.x + px * 0.15,
      camLook.y + py * 0.1 - (mobile ? 0.25 : 0),
      camLook.z,
    );

    if (!reducedMotion) {
      palmL.rotation.z = Math.sin(tsec * 0.55) * 0.035;
      palmR.rotation.z = Math.sin(tsec * 0.48 + 1.1) * 0.03;
      palmB.rotation.z = Math.sin(tsec * 0.62 + 2) * 0.028;
      water.position.y = -0.1 + Math.sin(tsec * 0.9) * 0.012;
      phone.rotation.y = -0.48 + Math.sin(tsec * 0.7) * 0.035;
      chat.rotation.y = Math.sin(tsec * 1.05) * 0.14;
      chat.position.y = 1.88 + Math.sin(tsec * 1.6) * 0.025;
      // awning sway
      awning.rotation.x = Math.sin(tsec * 1.15) * 0.025;
      awning.position.y = Math.sin(tsec * 1.15) * 0.008;
      // steam
      steams.forEach((sp) => {
        const ph = (tsec * 0.45 + sp.userData.phase) % 2.4;
        const k = ph / 2.4;
        sp.position.set(Math.sin(ph * 2 + sp.userData.phase) * 0.07, 0.3 + k * 0.72, Math.cos(ph + 1) * 0.055);
        sp.scale.set(0.26 + k * 0.38, 0.38 + k * 0.55, 1);
        (sp.material as THREE.SpriteMaterial).opacity = (1 - k) * 0.8;
      });
    }

    if (flashUntil > now) flash.intensity = 3.0;
    else flash.intensity = 0;

    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (raf || !visible) return;
    clock.start();
    raf = requestAnimationFrame(tick);
  };
  const stopLoop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  resize();
  if (reducedMotion) {
    progress = 1;
    applyAssembly(1);
    renderer.render(scene, camera);
  } else {
    startLoop();
  }

  const textures = [
    woodMap, woodDarkMap, paperMap, skyMap, phoneMap, signMap, billMap,
    steamMap, contactMap, sandMap, wamMap, envMap,
  ];

  return {
    setProgress(t: number) {
      progress = Math.min(1, Math.max(0, t));
    },
    setPointer(x: number, y: number) {
      targetPointer.x = Math.max(-1, Math.min(1, x));
      targetPointer.y = Math.max(-1, Math.min(1, y));
    },
    setGyro(beta: number, gamma: number) {
      gyro.y = Math.max(-1, Math.min(1, beta / 35)) * 0.35;
      gyro.x = Math.max(-1, Math.min(1, gamma / 35)) * 0.45;
    },
    setVisible(v: boolean) {
      visible = v;
      if (v) startLoop();
      else stopLoop();
    },
    setFrame(f: 'mobile' | 'desktop') {
      frame = f;
    },
    resize,
    dispose() {
      stopLoop();
      disposeObject(scene);
      textures.forEach((tx) => tx.dispose?.());
      sauces.forEach(() => { /* labels disposed via mesh traverse */ });
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };
}
