/**
 * Lazy-loaded Three.js island market stall.
 * Assembles with scroll progress. Pointer / tilt parallax.
 * No textures from the network — canvas-generated only.
 */
import * as THREE from 'three';

export type HeroSceneHandle = {
  setProgress: (t: number) => void;
  setPointer: (x: number, y: number) => void;
  setGyro: (beta: number, gamma: number) => void;
  setVisible: (v: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

function smoothstep(e0: number, e1: number, x: number): number {
  if (e1 === e0) return x >= e1 ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function makeSkyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 512;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#0c2c38');
  grd.addColorStop(0.38, '#1b5a6b');
  grd.addColorStop(0.55, '#e08a4a');
  grd.addColorStop(0.72, '#f3c78a');
  grd.addColorStop(1, '#f6e6c8');
  g.fillStyle = grd;
  g.fillRect(0, 0, 8, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makePhoneTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff8f0';
  g.fillRect(0, 0, 256, 512);
  // status bar
  g.fillStyle = '#0b1f24';
  g.fillRect(0, 0, 256, 48);
  g.fillStyle = '#f5c14a';
  g.font = 'bold 22px system-ui,sans-serif';
  g.fillText('Juvay', 16, 32);
  g.fillStyle = '#fff8f0';
  g.font = '12px system-ui,sans-serif';
  g.fillText('Your store', 150, 31);
  // hero block
  g.fillStyle = '#ce1126';
  g.fillRect(16, 64, 224, 96);
  g.fillStyle = '#fff8f0';
  g.font = 'bold 16px system-ui,sans-serif';
  g.fillText('Add your first item', 32, 118);
  // product rows (empty honest slots)
  const rows = [
    { label: 'Cash pickup', sub: '0% commission' },
    { label: 'Cash on delivery', sub: '0% commission' },
    { label: 'Wam online', sub: 'When you are ready' },
  ];
  rows.forEach((r, i) => {
    const y = 180 + i * 86;
    g.fillStyle = '#ffffff';
    g.strokeStyle = 'rgba(20,20,20,0.12)';
    g.lineWidth = 2;
    roundRect(g, 16, y, 224, 74, 12);
    g.fill();
    g.stroke();
    g.fillStyle = '#f5c14a';
    g.fillRect(28, y + 14, 46, 46);
    g.fillStyle = '#141414';
    g.font = 'bold 15px system-ui,sans-serif';
    g.fillText(r.label, 86, y + 32);
    g.fillStyle = '#5c574e';
    g.font = '12px system-ui,sans-serif';
    g.fillText(r.sub, 86, y + 52);
  });
  g.fillStyle = '#6b6256';
  g.font = '11px system-ui,sans-serif';
  g.fillText('Illustrative store preview', 16, 492);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function makeSignTexture(text: string, bg: string, fg: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 96);
  g.fillStyle = fg;
  g.font = 'bold 48px system-ui,sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBillTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1f6b45';
  g.fillRect(0, 0, 128, 64);
  g.strokeStyle = '#c9e6c0';
  g.strokeRect(6, 6, 116, 52);
  g.fillStyle = '#e8f8e0';
  g.font = 'bold 16px system-ui,sans-serif';
  g.textAlign = 'center';
  g.fillText('CASH', 64, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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

function palm(height = 2.4): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3f1f, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.7, flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, height, 6), trunkMat);
  trunk.position.y = height / 2;
  trunk.castShadow = false;
  g.add(trunk);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.15, 4), leafMat);
    leaf.position.y = height + 0.05;
    leaf.rotation.z = 0.95;
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    leaf.translateY(0.4);
    g.add(leaf);
  }
  return g;
}

export function createJuvayHeroScene(
  canvas: HTMLCanvasElement,
  opts: { dprCap?: number; reducedMotion?: boolean } = {},
): HeroSceneHandle {
  const dprCap = opts.dprCap ?? 1.5;
  const reducedMotion = !!opts.reducedMotion;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: dprCap > 1.15,
    alpha: true,
    powerPreference: 'low-power',
    stencil: false,
    depth: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setClearColor(0x0c2c38, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  const skyTex = makeSkyTexture();
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 12), skyMat);
  scene.add(sky);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const camHome = new THREE.Vector3(4.05, 2.85, 8.15);
  const camLook = new THREE.Vector3(0.2, 1.2, 0);
  camera.position.copy(camHome);

  const hemi = new THREE.HemisphereLight(0xffe2b0, 0x1b4a45, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd09a, 1.35);
  sun.position.set(-6, 8, 4);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x88c4c8, 0.35);
  fill.position.set(5, 2, -3);
  scene.add(fill);
  const flash = new THREE.PointLight(0xfff4d0, 0, 8);
  flash.position.set(0.4, 2.2, 1.6);
  scene.add(flash);

  const root = new THREE.Group();
  scene.add(root);

  // Ground + water
  const sand = new THREE.Mesh(
    new THREE.CircleGeometry(10, 40),
    new THREE.MeshStandardMaterial({ color: 0xe8d5b0, roughness: 1 }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = 0;
  root.add(sand);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(16, 40),
    new THREE.MeshStandardMaterial({
      color: 0x0d6e72,
      roughness: 0.25,
      metalness: 0.15,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.08;
  water.position.z = -3;
  root.add(water);

  // Distant hills
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x1a4d3e, roughness: 0.95, flatShading: true });
  for (const [x, z, s] of [
    [-6.5, -8, 2.4],
    [-3.2, -9.5, 1.8],
    [5.5, -9, 2.8],
    [8.2, -7.5, 1.6],
  ] as Array<[number, number, number]>) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), hillMat);
    hill.position.set(x, s * 0.25, z);
    hill.scale.y = 0.55;
    root.add(hill);
  }

  const palmL = palm(2.6);
  palmL.position.set(-3.4, 0, -1.5);
  const palmR = palm(2.1);
  palmR.position.set(4.2, 0, -0.8);
  const palmB = palm(1.7);
  palmB.position.set(-5.2, 0, 1.2);
  root.add(palmL, palmR, palmB);

  // Stall group — assembled by progress
  const stall = new THREE.Group();
  stall.position.set(0, 0, 0);
  stall.rotation.y = 0.22;
  root.add(stall);

  const wood = new THREE.MeshStandardMaterial({ color: 0x6b3f1f, roughness: 0.85 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x3d2414, roughness: 0.9 });
  const posts: THREE.Mesh[] = [];
  const postGeom = new THREE.CylinderGeometry(0.07, 0.08, 2.15, 8);
  const postPos: Array<[number, number, number]> = [
    [-1.35, 1.07, 0.55],
    [1.35, 1.07, 0.55],
    [-1.35, 1.07, -0.7],
    [1.35, 1.07, -0.7],
  ];
  postPos.forEach((p) => {
    const m = new THREE.Mesh(postGeom, wood);
    m.position.set(p[0], p[1], p[2]);
    posts.push(m);
    stall.add(m);
  });

  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.1, 0.1), woodDark);
  beam.position.set(0, 2.16, 0);
  stall.add(beam);
  const beamZ = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.45), woodDark);
  beamZ.position.set(0, 2.16, -0.05);
  stall.add(beamZ);

  const roofL = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 2.0), woodDark);
  roofL.position.set(-0.8, 2.48, -0.05);
  roofL.rotation.z = 0.38;
  const roofR = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 2.0), woodDark);
  roofR.position.set(0.8, 2.48, -0.05);
  roofR.rotation.z = -0.38;
  stall.add(roofL, roofR);

  // corrugated ridges
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.7, metalness: 0.15 });
  for (let i = 0; i < 6; i++) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.08), ridgeMat);
    ridge.position.set(-0.8, 2.52, -0.75 + i * 0.3);
    ridge.rotation.z = 0.38;
    ridge.userData.ridge = true;
    stall.add(ridge);
    const ridge2 = ridge.clone();
    ridge2.position.x = 0.8;
    ridge2.rotation.z = -0.38;
    ridge2.userData.ridge = true;
    stall.add(ridge2);
  }

  // Awning stripes (mango / cream / teal)
  const awning = new THREE.Group();
  const stripeColors = [0xf5c14a, 0xfff4dc, 0x0d9488, 0xf5c14a, 0xfff4dc, 0xce1126];
  stripeColors.forEach((col, i) => {
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.04, 1.05),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.65 }),
    );
    s.position.set(-1.05 + i * 0.42, 2.05, 0.85);
    s.rotation.x = 0.35;
    awning.add(s);
  });
  stall.add(awning);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 0.85), wood);
  counter.position.set(0, 0.92, 0.35);
  stall.add(counter);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.7, 0.08), woodDark);
  apron.position.set(0, 0.52, 0.72);
  stall.add(apron);

  const signTex = makeSignTexture('OPEN', '#0d9488', '#fff8f0');
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.28),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.5 }),
  );
  sign.position.set(0, 1.72, 0.72);
  stall.add(sign);

  // Products
  const products = new THREE.Group();
  stall.add(products);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 });
  const wraps = [0xf5c14a, 0xe8d5b0, 0xce1126, 0xf97316, 0x2dd4bf];
  wraps.forEach((col, i) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.32), crateMat);
    crate.position.set(-0.95 + i * 0.48, 1.12, 0.28);
    products.add(crate);
    const wrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.14, 0.22),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 }),
    );
    wrap.position.set(-0.95 + i * 0.48, 1.3, 0.28);
    products.add(wrap);
  });
  // sauce bottles
  const bottleColors = [0xce1126, 0xf5c14a, 0x1f6b3a, 0x7c2d12];
  bottleColors.forEach((col, i) => {
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.06, 0.28, 8),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.1 }),
    );
    bottle.position.set(0.15 + i * 0.16, 1.2, 0.55);
    products.add(bottle);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 }),
    );
    cap.position.set(0.15 + i * 0.16, 1.36, 0.55);
    products.add(cap);
  });

  // Phone
  const phone = new THREE.Group();
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 1.42, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.4 }),
  );
  const phoneTex = makePhoneTexture();
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.64, 1.28),
    new THREE.MeshStandardMaterial({ map: phoneTex, roughness: 0.3 }),
  );
  phoneScreen.position.z = 0.04;
  phone.add(phoneBody, phoneScreen);
  phone.position.set(2.15, 1.45, 1.55);
  phone.rotation.y = -0.45;
  phone.rotation.x = 0.08;
  root.add(phone);

  // WhatsApp-style chat bubble (generic speech bubble, not the official logo)
  const chat = new THREE.Group();
  const chatMat = new THREE.MeshStandardMaterial({ color: 0x19a15f, roughness: 0.45 });
  const chatBall = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), chatMat);
  const chatTail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 8), chatMat);
  chatTail.position.set(-0.16, -0.26, 0);
  chatTail.rotation.z = 0.7;
  chat.add(chatBall, chatTail);
  // simple message lines
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xeffff3 });
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.04), lineMat);
  l1.position.set(0, 0.06, 0.22);
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), lineMat);
  l2.position.set(-0.04, -0.04, 0.22);
  chat.add(l1, l2);
  chat.position.set(-1.85, 1.85, 1.6);
  root.add(chat);

  // Cash + Wam chip
  const pay = new THREE.Group();
  const billTex = makeBillTexture();
  for (let i = 0; i < 3; i++) {
    const bill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.36),
      new THREE.MeshStandardMaterial({ map: billTex, roughness: 0.6, side: THREE.DoubleSide }),
    );
    bill.position.set(0, 0.02 * i, 0.01 * i);
    bill.rotation.x = -0.9;
    bill.rotation.z = -0.15 + i * 0.08;
    pay.add(bill);
  }
  const chip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.35, metalness: 0.25 }),
  );
  chip.rotation.x = Math.PI / 2.4;
  chip.position.set(0.62, 0.08, 0.05);
  pay.add(chip);
  const wamTex = makeSignTexture('Wam', '#0d9488', '#fff8f0');
  const wamLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.18),
    new THREE.MeshStandardMaterial({ map: wamTex, roughness: 0.4 }),
  );
  wamLabel.position.set(0.62, 0.14, 0.1);
  wamLabel.rotation.x = -0.4;
  pay.add(wamLabel);
  pay.position.set(-1.15, 1.25, 1.95);
  root.add(pay);

  // Camera (photo snap) — a simple body that appears early
  const camProp = new THREE.Group();
  const camBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.3, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.3 }),
  );
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.11, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x1b3a4a, roughness: 0.2, metalness: 0.6 }),
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.12;
  camProp.add(camBody, lens);
  camProp.position.set(-2.0, 1.4, 1.4);
  camProp.rotation.y = 0.5;
  root.add(camProp);

  // Island ring (subtle)
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(7.4, 0.08, 6, 40),
    new THREE.MeshStandardMaterial({ color: 0x1a5a5c, roughness: 0.5 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  let progress = reducedMotion ? 1 : 0;
  let pointer = { x: 0, y: 0 };
  let gyro = { x: 0, y: 0 };
  let targetPointer = { x: 0, y: 0 };
  let visible = true;
  let raf = 0;
  let last = 0;
  let flashUntil = 0;
  let didFlash = false;
  const clock = new THREE.Clock();

  const applyAssembly = (t: number) => {
    // 0–0.2 empty island, camera dollies in
    // 0.15–0.4 stall posts + roof
    // 0.35–0.55 products + photo snap
    // 0.5–0.72 phone (store is live)
    // 0.68–0.85 chat bubble (WhatsApp)
    // 0.8–1 cash + Wam
    const stallT = smoothstep(0.12, 0.42, t);
    posts.forEach((p, i) => {
      const pt = smoothstep(0.12 + i * 0.03, 0.32 + i * 0.03, t);
      p.scale.y = Math.max(0.001, pt);
      p.position.y = 1.07 * pt;
    });
    const roofT = smoothstep(0.18, 0.42, t);
    const roofVisible = roofT > 0.04;
    roofL.visible = roofVisible;
    roofR.visible = roofVisible;
    beam.visible = roofVisible;
    beamZ.visible = roofVisible;
    roofL.position.y = 2.48 + (1 - roofT) * 0.55;
    roofR.position.y = 2.48 + (1 - roofT) * 0.55;
    beam.position.y = 2.16 + (1 - roofT) * 0.45;
    beamZ.position.y = 2.16 + (1 - roofT) * 0.45;
    // corrugated ridges follow the roof
    stall.children.forEach((ch) => {
      if (ch.userData && ch.userData.ridge) {
        ch.visible = roofVisible;
      }
    });
    awning.scale.setScalar(Math.max(0.001, smoothstep(0.28, 0.48, t)));
    awning.visible = roofT > 0.12;
    sign.scale.setScalar(Math.max(0.001, smoothstep(0.36, 0.52, t)));
    counter.scale.x = Math.max(0.001, stallT);
    apron.scale.x = Math.max(0.001, stallT);

    const prodT = smoothstep(0.32, 0.5, t);
    products.scale.setScalar(Math.max(0.001, prodT));
    products.visible = prodT > 0.02;
    if (prodT > 0.85 && !didFlash) {
      didFlash = true;
      flashUntil = performance.now() + 220;
    }
    if (t < 0.35) {
      didFlash = false;
    }

    const camT = smoothstep(0.05, 0.28, t);
    camProp.scale.setScalar(Math.max(0.001, camT * (1 - smoothstep(0.45, 0.65, t) * 0.15)));
    camProp.visible = camT > 0.05;

    const phoneT = smoothstep(0.5, 0.72, t);
    phone.scale.setScalar(Math.max(0.001, phoneT));
    phone.position.y = 1.45 + (1 - phoneT) * 1.2;
    phone.visible = phoneT > 0.02;

    const chatT = smoothstep(0.68, 0.86, t);
    chat.scale.setScalar(Math.max(0.001, chatT));
    chat.position.y = 1.85 + Math.sin(t * 6) * 0.02 * chatT;
    chat.visible = chatT > 0.02;

    const payT = smoothstep(0.8, 0.98, t);
    pay.scale.setScalar(Math.max(0.001, payT));
    pay.position.y = 1.55 + (1 - payT) * 0.8;
    pay.visible = payT > 0.02;

    // Camera: wide establishing shot, then a gentle 3/4 close-in on the stall.
    const dolly = smoothstep(0.05, 0.75, t);
    camHome.set(4.35 - dolly * 0.55, 2.95 - dolly * 0.25, 8.55 - dolly * 1.05);
    camLook.set(0.15 + dolly * 0.15, 1.15 + dolly * 0.15, 0.05);
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
    pointer.x += (targetPointer.x - pointer.x) * (1 - Math.pow(0.001, dt));
    pointer.y += (targetPointer.y - pointer.y) * (1 - Math.pow(0.001, dt));

    applyAssembly(progress);

    const px = pointer.x + gyro.x;
    const py = pointer.y + gyro.y;
    const portrait = camera.aspect < 0.9;
    // On a tall phone the copy panel covers the lower 2/3 — keep the stall in the top band.
    camera.position.x = camHome.x + px * 0.55 + (portrait ? 0.15 : 0);
    camera.position.y = camHome.y + py * 0.35 + (portrait ? 0.35 : 0);
    camera.position.z = camHome.z + (portrait ? 0.4 : 0);
    camera.lookAt(
      camLook.x + px * 0.15,
      camLook.y + py * 0.1 - (portrait ? 1.45 : 0),
      camLook.z,
    );

    // gentle palm sway
    const t = now * 0.0006;
    palmL.rotation.z = Math.sin(t) * 0.04;
    palmR.rotation.z = Math.sin(t + 1.2) * 0.035;
    palmB.rotation.z = Math.sin(t + 2.1) * 0.03;
    water.position.y = -0.08 + Math.sin(t * 1.6) * 0.015;
    phone.rotation.y = -0.45 + Math.sin(t * 0.8) * 0.04;
    chat.rotation.y = Math.sin(t * 1.1) * 0.15;

    if (flashUntil > now) {
      flash.intensity = 3.2;
    } else {
      flash.intensity = 0;
    }

    renderer.render(scene, camera);
    last = now;
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

  return {
    setProgress(t: number) {
      progress = Math.min(1, Math.max(0, t));
    },
    setPointer(x: number, y: number) {
      targetPointer.x = Math.max(-1, Math.min(1, x));
      targetPointer.y = Math.max(-1, Math.min(1, y));
    },
    setGyro(beta: number, gamma: number) {
      // beta: front-back (-180..180), gamma: left-right (-90..90)
      gyro.y = Math.max(-1, Math.min(1, beta / 35)) * 0.35;
      gyro.x = Math.max(-1, Math.min(1, gamma / 35)) * 0.45;
    },
    setVisible(v: boolean) {
      visible = v;
      if (v) startLoop();
      else stopLoop();
    },
    resize,
    dispose() {
      stopLoop();
      disposeObject(scene);
      skyTex.dispose();
      phoneTex.dispose();
      signTex.dispose();
      billTex.dispose();
      wamTex.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };
}
