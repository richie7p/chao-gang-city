import * as THREE from "three";

const texCache = new Map<string, THREE.CanvasTexture>();

function canvasTex(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  texCache.set(key, t);
  return t;
}

export function buildingTexture(base: string, accent: string, floors: number, seed: number): THREE.CanvasTexture {
  return canvasTex(`b:${base}:${accent}:${floors}:${seed}`, 256, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, w, 18);
    const rng = mulberry(seed);
    const cols = 4 + Math.floor(rng() * 3);
    const rows = Math.max(4, floors);
    const padX = 18;
    const padY = 28;
    const gw = (w - padX * 2) / cols;
    const gh = (h - padY * 2) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = rng() > 0.28;
        ctx.fillStyle = on ? accent : "rgba(12,16,22,0.85)";
        const x = padX + c * gw + 4;
        const y = padY + r * gh + 4;
        ctx.fillRect(x, y, gw - 8, gh - 10);
      }
    }
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, 0, 8, h);
  });
}

export function asphaltTexture(): THREE.CanvasTexture {
  return canvasTex("asphalt", 128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#2a2d32";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
}

export function grassTexture(): THREE.CanvasTexture {
  return canvasTex("grass", 128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#2f5a3a";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = i % 2 ? "#3a6c44" : "#274e32";
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  });
}

export function makeSign(text: string, bg = "#1a2430", fg = "#e8eaee"): THREE.Mesh {
  const tex = canvasTex(`sign:${text}:${bg}`, 512, 160, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#5ec2b8";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = fg;
    ctx.font = "700 64px 'Noto Sans TC', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.55,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2), mat);
  mesh.castShadow = false;
  return mesh;
}

function shareMat(color: number, extra?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
}

export function createPerson(opts: {
  shirt: number;
  pants: number;
  hair: number;
  skin?: number;
}): THREE.Group {
  const g = new THREE.Group();
  const skin = opts.skin ?? 0xe0b898;
  const shirt = shareMat(opts.shirt, { roughness: 0.7 });
  const pants = shareMat(opts.pants, { roughness: 0.75 });
  const skinM = shareMat(skin, { roughness: 0.52 });
  const hairM = shareMat(opts.hair, { roughness: 0.82 });
  const shoeM = shareMat(0x1a1a1e, { roughness: 0.55 });
  const eyeM = shareMat(0x1a1410, { roughness: 0.4 });

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.24), pants);
  hips.position.y = 0.74;
  g.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.27), shirt);
  torso.position.y = 1.1;
  g.add(torso);

  const hem = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.28), shirt);
  hem.position.y = 0.84;
  g.add(hem);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 6), skinM);
  neck.position.y = 1.38;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.26), skinM);
  head.position.y = 1.56;
  g.add(head);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.28), hairM);
  hair.position.y = 1.7;
  g.add(hair);
  const bang = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.08), hairM);
  bang.position.set(0, 1.68, -0.12);
  g.add(bang);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.04), eyeM);
  eyeL.position.set(-0.06, 1.56, -0.12);
  g.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.06;
  g.add(eyeR);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), shirt);
  leftArm.position.set(-0.3, 1.04, 0);
  leftArm.name = "leftArm";
  g.add(leftArm);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), shirt);
  rightArm.position.set(0.3, 1.04, 0);
  rightArm.name = "rightArm";
  g.add(rightArm);

  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), skinM);
  handL.position.set(-0.3, 0.76, 0);
  g.add(handL);
  const handR = handL.clone();
  handR.position.x = 0.3;
  g.add(handR);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.16), pants);
  leftLeg.position.set(-0.12, 0.42, 0);
  leftLeg.name = "leftLeg";
  g.add(leftLeg);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.16), pants);
  rightLeg.position.set(0.12, 0.42, 0);
  rightLeg.name = "rightLeg";
  g.add(rightLeg);

  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.24), shoeM);
  shoeL.position.set(-0.12, 0.08, 0.03);
  g.add(shoeL);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.12;
  g.add(shoeR);

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

export function createCar(color: number, kind: "civilian" | "sport" | "taxi" | "police" | "van"): THREE.Group {
  const g = new THREE.Group();
  g.rotation.order = "YXZ";
  const bodyM = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.32 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.48, metalness: 0.22 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xa8b0b8, roughness: 0.26, metalness: 0.72 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x6a90a4,
    roughness: 0.12,
    metalness: 0.45,
    transparent: true,
    opacity: 0.48,
  });
  const lightM = new THREE.MeshStandardMaterial({
    color: 0xfff2c8,
    emissive: 0xffe08a,
    emissiveIntensity: 0.95,
  });
  const tailM = new THREE.MeshStandardMaterial({
    color: 0xaa2218,
    emissive: 0x551008,
    emissiveIntensity: 0.45,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.85, metalness: 0.05 });
  const rimM = new THREE.MeshStandardMaterial({ color: 0xc5ccd4, roughness: 0.3, metalness: 0.65 });

  const bodyH = kind === "van" ? 0.92 : kind === "sport" ? 0.4 : 0.5;
  const bodyL = kind === "sport" ? 4.15 : kind === "van" ? 4.7 : 4.25;
  const bodyW = kind === "sport" ? 1.92 : 1.85;
  const cabinH = kind === "van" ? 0.78 : 0.52;
  const cabinL = kind === "sport" ? 1.42 : kind === "van" ? 2.25 : 1.78;

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.16, 0.16, bodyL * 0.9), dark);
  chassis.position.y = 0.26;
  g.add(chassis);

  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), bodyM);
  body.position.y = 0.5;
  g.add(body);

  const skirt = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.06, 0.12, bodyL * 0.72), dark);
  skirt.position.y = 0.34;
  g.add(skirt);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.18, 0.07, bodyL * 0.28), bodyM);
  hood.position.set(0, 0.5 + bodyH * 0.5 + 0.02, -bodyL * 0.28);
  g.add(hood);

  const fBumper = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.04, 0.22, 0.2), dark);
  fBumper.position.set(0, 0.36, -bodyL / 2 + 0.02);
  g.add(fBumper);
  const rBumper = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.04, 0.22, 0.2), dark);
  rBumper.position.set(0, 0.36, bodyL / 2 - 0.02);
  g.add(rBumper);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.22, cabinH, cabinL), glass);
  cabin.position.set(0, 0.5 + bodyH * 0.55 + cabinH / 2, kind === "sport" ? 0.18 : 0.12);
  g.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.32, 0.06, cabinL * 0.82), bodyM);
  roof.position.set(0, cabin.position.y + cabinH / 2, cabin.position.z);
  g.add(roof);

  const wind = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.3, 0.4, 0.05), glass);
  wind.position.set(0, 0.92, cabin.position.z - cabinL * 0.42);
  wind.rotation.x = -0.48;
  g.add(wind);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.34, 0.34, 0.04), glass);
  rearGlass.position.set(0, 0.92, cabin.position.z + cabinL * 0.42);
  rearGlass.rotation.x = 0.4;
  g.add(rearGlass);

  for (const x of [-bodyW * 0.52, bodyW * 0.52]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.2), dark);
    mirror.position.set(x, 0.92, -0.12);
    g.add(mirror);
    const glassM = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.14), chrome);
    glassM.position.set(x + Math.sign(x) * 0.08, 0.92, -0.12);
    g.add(glassM);
  }

  const wheelZ = kind === "van" ? 0.34 : 0.32;
  for (const z of [-bodyL * 0.33, bodyL * 0.33]) {
    for (const x of [-bodyW * 0.42, bodyW * 0.42]) {
      const wh = new THREE.Group();
      wh.name = "wheel";
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12), rubber);
      tire.rotation.z = Math.PI / 2;
      wh.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.26, 10), rimM);
      rim.rotation.z = Math.PI / 2;
      wh.add(rim);
      wh.position.set(x, wheelZ, z);
      g.add(wh);
    }
  }

  const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.13, 0.08), lightM);
  hl.position.set(-0.55, 0.5, -bodyL / 2 + 0.02);
  g.add(hl);
  const hr = hl.clone();
  hr.position.x = 0.55;
  g.add(hr);

  const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.06), tailM);
  tl.position.set(-0.58, 0.52, bodyL / 2 - 0.02);
  g.add(tl);
  const tr = tl.clone();
  tr.position.x = 0.58;
  g.add(tr);

  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.04), chrome);
  plate.position.set(0, 0.38, bodyL / 2 + 0.02);
  g.add(plate);

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6), chrome);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0.48, 0.22, bodyL / 2 - 0.08);
  g.add(exhaust);

  if (kind === "sport") {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.3, 0.07, 0.32), bodyM);
    spoiler.position.set(0, 1.08, bodyL * 0.38);
    g.add(spoiler);
    const stemL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), dark);
    stemL.position.set(-0.5, 0.96, bodyL * 0.36);
    g.add(stemL);
    const stemR = stemL.clone();
    stemR.position.x = 0.5;
    g.add(stemR);
  }

  if (kind === "taxi") {
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.16, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf2d14a, emissive: 0xa88810, emissiveIntensity: 0.45 }),
    );
    lamp.position.set(0, 1.28, 0);
    g.add(lamp);
  }
  if (kind === "police") {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.14, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }),
    );
    bar.position.set(0, 1.24, 0.08);
    g.add(bar);
    const red = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.12, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff2222, emissiveIntensity: 1.2 }),
    );
    red.position.set(-0.2, 1.34, 0.08);
    red.name = "copRed";
    g.add(red);
    const blu = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.12, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x2266ff, emissive: 0x2266ff, emissiveIntensity: 1.2 }),
    );
    blu.position.set(0.2, 1.34, 0.08);
    blu.name = "copBlue";
    g.add(blu);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW + 0.04, 0.12, 2.3),
      new THREE.MeshStandardMaterial({ color: 0x2a5ad8 }),
    );
    stripe.position.set(0, 0.62, 0);
    g.add(stripe);
  }

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

export function createTree(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.24, 1.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.9 }),
  );
  trunk.position.y = 0.75;
  g.add(trunk);
  const leafM = new THREE.MeshStandardMaterial({ color: 0x2f7a48, roughness: 0.78 });
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.0, 8), leafM);
  leaf.position.y = 2.15;
  g.add(leaf);
  const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.4, 8), leafM);
  leaf2.position.y = 2.85;
  g.add(leaf2);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

export function createLamp(): THREE.Group {
  const g = new THREE.Group();
  const poleM = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.45, metalness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 6), poleM);
  pole.position.y = 2.6;
  g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 1.1), poleM);
  arm.position.set(0, 5.1, -0.4);
  g.add(arm);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffe6a8,
      emissive: 0xffc86a,
      emissiveIntensity: 1.4,
    }),
  );
  bulb.position.set(0, 5.0, -0.9);
  g.add(bulb);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.5 }),
  );
  shade.position.set(0, 5.12, -0.9);
  g.add(shade);
  return g;
}

export function createTrafficLight(): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 4.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.5, metalness: 0.35 }),
  );
  pole.position.y = 2.1;
  g.add(pole);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.82, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x16181c }),
  );
  box.position.y = 4.15;
  g.add(box);
  const mk = (y: number, color: number, name: string) => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 10),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 }),
    );
    m.position.set(0, y, 0.12);
    m.name = name;
    g.add(m);
  };
  mk(4.4, 0xff3333, "tlRed");
  mk(4.15, 0xffcc33, "tlYellow");
  mk(3.9, 0x33dd66, "tlGreen");
  return g;
}

export function createHydrant(): THREE.Group {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xb43a32, roughness: 0.45, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.55, 8), red);
  body.position.y = 0.32;
  g.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 8), red);
  cap.position.y = 0.64;
  g.add(cap);
  const side = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6), red);
  side.rotation.z = Math.PI / 2;
  side.position.set(0, 0.42, 0);
  g.add(side);
  return g;
}

export function createDumpster(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.1, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x3d6a48, roughness: 0.7, metalness: 0.15 }),
  );
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.64, 0.08, 0.94),
    new THREE.MeshStandardMaterial({ color: 0x2c4e36, roughness: 0.65 }),
  );
  lid.position.y = 1.14;
  g.add(lid);
  return g;
}

export function markerMesh(color = 0x5ec2b8): THREE.Group {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.08, 8, 24),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.15;
  g.add(ring);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 8, 8),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.35,
    }),
  );
  beam.position.y = 4;
  g.add(beam);
  return g;
}

export function disposeTexCache() {
  for (const t of texCache.values()) t.dispose();
  texCache.clear();
}

function mulberry(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
