import * as THREE from "three";
import {
  CITY,
  GRID,
  HALF,
  ROAD,
  SIDEWALK,
  blockBounds,
  roadCoord,
} from "./constants";
import { PLACES } from "./data";
import {
  asphaltTexture,
  buildingTexture,
  createDumpster,
  createHydrant,
  createLamp,
  createTrafficLight,
  createTree,
  grassTexture,
  makeSign,
} from "./meshes";
import {
  scaleFacadeUVs,
  tileBoxUVs,
  tilePlaneUVs,
  type WorldTextures,
} from "./textures";
import type { AABB, Place, Vec2 } from "./types";

export type RoadNode = { i: number; j: number; x: number; z: number };

export type CityWorld = {
  group: THREE.Group;
  colliders: AABB[];
  treeColliders: { x: number; z: number; r: number }[];
  parkedSpots: { x: number; z: number; yaw: number; color: number; kind: "civilian" | "sport" | "taxi" | "van" }[];
  npcLoops: Vec2[][];
  nodes: RoadNode[];
  spawn: { x: number; z: number; yaw: number };
  shop: { x: number; z: number };
  policeSpawn: { x: number; z: number; yaw: number }[];
  waterZ: number;
  places: Place[];
};

export type FacadeKind = "glass" | "apt" | "street" | "industrial" | "civic";

type CityMats = {
  asphalt: THREE.MeshStandardMaterial;
  sidewalk: THREE.MeshStandardMaterial;
  grass: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  plinth: THREE.MeshStandardMaterial;
  curb: THREE.MeshStandardMaterial;
  ac: THREE.MeshStandardMaterial;
  facades: Record<FacadeKind, THREE.MeshStandardMaterial>;
  photo: boolean;
};

const BUILDING_MATS = [
  { base: "#8a9098", accent: "#d7e6c8", hex: 0x8a9098 },
  { base: "#6e7884", accent: "#b7d6e4", hex: 0x6e7884 },
  { base: "#9a8f84", accent: "#efe4c8", hex: 0x9a8f84 },
  { base: "#5c6a72", accent: "#9fd0d4", hex: 0x5c6a72 },
  { base: "#7a7068", accent: "#eadcc0", hex: 0x7a7068 },
  { base: "#4f5d68", accent: "#89c4d2", hex: 0x4f5d68 },
];

function mulberry(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMats(tex: WorldTextures | null): CityMats {
  const photo = !!tex;
  const tint = photo ? 0xffffff : 0x9a9ea4;
  const asphalt = new THREE.MeshStandardMaterial({
    map: tex?.asphalt ?? asphaltTexture(),
    roughness: 0.95,
    metalness: 0.02,
    color: tint,
  });
  const sidewalk = new THREE.MeshStandardMaterial({
    map: tex?.sidewalk ?? undefined,
    color: photo ? 0xffffff : 0xb7b8bc,
    roughness: 0.9,
  });
  const grass = new THREE.MeshStandardMaterial({
    map: tex?.grass ?? grassTexture(),
    roughness: 0.95,
    color: photo ? 0xffffff : 0x8aaa7a,
  });
  const roof = new THREE.MeshStandardMaterial({
    map: tex?.roof ?? undefined,
    color: photo ? 0xffffff : 0x3a4048,
    roughness: 0.68,
  });
  const facades: CityMats["facades"] = {
    glass: new THREE.MeshStandardMaterial({
      map: tex?.glass ?? undefined,
      color: photo ? 0xffffff : 0x8aa0b0,
      roughness: 0.38,
      metalness: 0.28,
    }),
    apt: new THREE.MeshStandardMaterial({
      map: tex?.apt ?? undefined,
      color: photo ? 0xffffff : 0x9a8f84,
      roughness: 0.62,
      metalness: 0.06,
    }),
    street: new THREE.MeshStandardMaterial({
      map: tex?.street ?? undefined,
      color: photo ? 0xffffff : 0x8a9098,
      roughness: 0.58,
      metalness: 0.08,
    }),
    industrial: new THREE.MeshStandardMaterial({
      map: tex?.industrial ?? undefined,
      color: photo ? 0xffffff : 0x7a7068,
      roughness: 0.7,
      metalness: 0.12,
    }),
    civic: new THREE.MeshStandardMaterial({
      map: tex?.civic ?? undefined,
      color: photo ? 0xffffff : 0xd8dce2,
      roughness: 0.5,
      metalness: 0.1,
    }),
  };
  return {
    asphalt,
    sidewalk,
    grass,
    roof,
    plinth: new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.88 }),
    curb: new THREE.MeshStandardMaterial({ color: 0x8e9096, roughness: 0.85 }),
    ac: new THREE.MeshStandardMaterial({ color: 0x6a7278, roughness: 0.45, metalness: 0.35 }),
    facades,
    photo,
  };
}

export function buildCity(scene: THREE.Scene, tex: WorldTextures | null = null): CityWorld {
  const group = new THREE.Group();
  group.name = "city";
  const colliders: AABB[] = [];
  const treeColliders: { x: number; z: number; r: number }[] = [];
  const parkedSpots: CityWorld["parkedSpots"] = [];
  const npcLoops: Vec2[][] = [];
  const policeSpawn: CityWorld["policeSpawn"] = [];
  const mats = makeMats(tex);

  const groundGeo = new THREE.PlaneGeometry(CITY + 80, CITY + 90);
  tilePlaneUVs(groundGeo, CITY + 80, CITY + 90, 12);
  const ground = new THREE.Mesh(groundGeo, mats.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.02, -8);
  ground.receiveShadow = true;
  group.add(ground);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY + 100, 48),
    new THREE.MeshStandardMaterial({
      color: 0x1a4a58,
      roughness: 0.22,
      metalness: 0.35,
      transparent: true,
      opacity: 0.92,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.08, -HALF - 22);
  group.add(water);
  const seawall = new THREE.Mesh(new THREE.BoxGeometry(CITY + 20, 1.4, 1.2), mats.curb);
  seawall.position.set(0, 0.5, -HALF - 1.2);
  group.add(seawall);
  colliders.push({
    minX: -HALF - 10,
    maxX: HALF + 10,
    minZ: -HALF - 2.2,
    maxZ: -HALF - 0.2,
  });

  const lineM = new THREE.MeshStandardMaterial({
    color: 0xd8c56a,
    emissive: 0x3a3410,
    roughness: 0.6,
  });
  const zebraM = new THREE.MeshStandardMaterial({ color: 0xe8eaee, roughness: 0.7 });

  const aw = ASPHALT_W();
  for (let i = 0; i <= GRID; i++) {
    const x = roadCoord(i);
    const roadGeo = new THREE.BoxGeometry(aw, 0.04, CITY);
    tileBoxUVs(roadGeo, aw, 0.04, CITY, 8);
    const road = new THREE.Mesh(roadGeo, mats.asphalt);
    road.position.set(x, 0.01, 0);
    road.receiveShadow = true;
    group.add(road);
    for (const side of [-1, 1]) {
      const swGeo = new THREE.BoxGeometry(SIDEWALK, 0.08, CITY);
      tileBoxUVs(swGeo, SIDEWALK, 0.08, CITY, 4);
      const sw = new THREE.Mesh(swGeo, mats.sidewalk);
      sw.position.set(x + side * (aw / 2 + SIDEWALK / 2), 0.04, 0);
      sw.receiveShadow = true;
      group.add(sw);
    }
    for (let s = -HALF + 6; s < HALF; s += 8) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 3.2), lineM);
      dash.position.set(x, 0.04, s);
      group.add(dash);
    }
  }
  for (let j = 0; j <= GRID; j++) {
    const z = roadCoord(j);
    const roadGeo = new THREE.BoxGeometry(CITY, 0.05, aw);
    tileBoxUVs(roadGeo, CITY, 0.05, aw, 8);
    const road = new THREE.Mesh(roadGeo, mats.asphalt);
    road.position.set(0, 0.015, z);
    road.receiveShadow = true;
    group.add(road);
    for (const side of [-1, 1]) {
      const swGeo = new THREE.BoxGeometry(CITY, 0.09, SIDEWALK);
      tileBoxUVs(swGeo, CITY, 0.09, SIDEWALK, 4);
      const sw = new THREE.Mesh(swGeo, mats.sidewalk);
      sw.position.set(0, 0.045, z + side * (aw / 2 + SIDEWALK / 2));
      sw.receiveShadow = true;
      group.add(sw);
    }
  }

  const park = { i: 1, j: 1 };
  const station = { i: 2, j: 2 };
  const police = { i: 2, j: 4 };
  const parking = { i: 4, j: 3 };
  const shopBlock = { i: 4, j: 2 };

  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const b = blockBounds(i, j);
      const loop: Vec2[] = [
        { x: b.minX - 1.1, z: b.minZ - 1.1 },
        { x: b.maxX + 1.1, z: b.minZ - 1.1 },
        { x: b.maxX + 1.1, z: b.maxZ + 1.1 },
        { x: b.minX - 1.1, z: b.maxZ + 1.1 },
      ];
      npcLoops.push(loop);

      if (i === park.i && j === park.j) {
        fillPark(group, b, mats.grass, treeColliders);
        const sign = makeSign("新生公園", "#1e3a2a");
        sign.position.set(b.cx, 3.2, b.minZ - 1.4);
        group.add(sign);
        continue;
      }
      if (i === parking.i && j === parking.j) {
        fillParking(group, b, mats.asphalt, parkedSpots);
        const sign = makeSign("港灣停車場", "#243044");
        sign.position.set(b.cx, 3.2, b.minZ - 1.4);
        group.add(sign);
        continue;
      }
      if (i === station.i && j === station.j) {
        fillStation(group, b, colliders, mats);
        continue;
      }
      if (i === police.i && j === police.j) {
        fillPolice(group, b, colliders, policeSpawn, mats);
        continue;
      }
      if (i === shopBlock.i && j === shopBlock.j) {
        fillCommercial(group, b, colliders, mats, true);
        continue;
      }
      if (i === 0) {
        fillIndustrial(group, b, colliders, mats, i * 17 + j * 9);
        continue;
      }
      if (j === 0) {
        fillBay(group, b, colliders, mats, i * 13 + j);
        continue;
      }
      fillGeneric(group, b, colliders, mats, i * 31 + j * 17, i >= 3);
    }
  }

  for (let i = 0; i <= GRID; i++) {
    for (let j = 0; j <= GRID; j++) {
      if (i < GRID) {
        const x = (roadCoord(i) + roadCoord(i + 1)) / 2;
        const z = roadCoord(j);
        addLamp(group, x, z - aw / 2 - 0.6, Math.PI);
        addLamp(group, x, z + aw / 2 + 0.6, 0);
      }
      if (j < GRID && (i + j) % 2 === 0) {
        const z = (roadCoord(j) + roadCoord(j + 1)) / 2;
        const x = roadCoord(i);
        addLamp(group, x - aw / 2 - 0.6, z, Math.PI / 2);
      }
    }
  }

  for (let i = 0; i <= GRID; i++) {
    for (let j = 0; j <= GRID; j++) {
      if ((i + j) % 2 !== 0) continue;
      const tl = createTrafficLight();
      tl.position.set(roadCoord(i) + 3.4, 0, roadCoord(j) + 3.4);
      group.add(tl);
      addCrosswalk(group, roadCoord(i), roadCoord(j), zebraM);
    }
  }

  addStreetProps(group, colliders);

  if (tex?.sky) {
    const skyMat = new THREE.MeshBasicMaterial({
      map: tex.sky,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(210, 32, 16), skyMat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    group.add(sky);
  }

  addCurbParked(parkedSpots);
  const hero = {
    x: roadCoord(3) + 3.6,
    z: 18,
    yaw: 0,
    color: 0x2ec4b6,
    kind: "sport" as const,
  };
  parkedSpots.unshift(hero);

  const nodes: RoadNode[] = [];
  for (let i = 0; i <= GRID; i++) {
    for (let j = 0; j <= GRID; j++) {
      nodes.push({ i, j, x: roadCoord(i), z: roadCoord(j) });
    }
  }

  const ave = makeSign("中央大道");
  ave.position.set(roadCoord(3) + 6.5, 3.4, 4);
  ave.rotation.y = -Math.PI / 2;
  group.add(ave);
  const baySign = makeSign("海灣區", "#16323c");
  baySign.position.set(0, 3.4, -HALF + 8);
  group.add(baySign);
  const east = makeSign("東城商業區", "#1c3040");
  east.position.set(blockBounds(4, 2).cx, 3.4, blockBounds(4, 2).minZ - 1.5);
  group.add(east);
  const west = makeSign("西港工業區", "#3a3024");
  west.position.set(blockBounds(0, 2).cx, 3.4, blockBounds(0, 2).minZ - 1.5);
  group.add(west);

  const worldWall = 8;
  colliders.push(
    { minX: -HALF - worldWall, maxX: HALF + worldWall, minZ: -HALF - 40, maxZ: -HALF - 2 },
    { minX: -HALF - worldWall, maxX: HALF + worldWall, minZ: HALF + 2, maxZ: HALF + worldWall },
    { minX: -HALF - worldWall, maxX: -HALF - 1, minZ: -HALF - 40, maxZ: HALF + worldWall },
    { minX: HALF + 1, maxX: HALF + worldWall, minZ: -HALF - 40, maxZ: HALF + worldWall },
  );

  scene.add(group);

  const shopPlace = PLACES.find((p) => p.id === "shop")!;
  return {
    group,
    colliders,
    treeColliders,
    parkedSpots,
    npcLoops,
    nodes,
    spawn: { x: hero.x - 5.5, z: hero.z + 1.2, yaw: Math.PI / 2 },
    shop: { x: shopPlace.x, z: shopPlace.z },
    policeSpawn,
    waterZ: -HALF - 8,
    places: PLACES,
  };
}

function ASPHALT_W() {
  return ROAD - SIDEWALK * 2;
}

function addLamp(group: THREE.Group, x: number, z: number, rot: number) {
  const lamp = createLamp();
  lamp.position.set(x, 0, z);
  lamp.rotation.y = rot;
  group.add(lamp);
}

function addCrosswalk(group: THREE.Group, x: number, z: number, mat: THREE.Material) {
  const aw = ASPHALT_W();
  for (const dir of [0, 1] as const) {
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const stripe = new THREE.Mesh(
          dir === 0
            ? new THREE.BoxGeometry(0.42, 0.035, 2.6)
            : new THREE.BoxGeometry(2.6, 0.035, 0.42),
          mat,
        );
        const off = (i - 2) * 0.7;
        if (dir === 0) {
          stripe.position.set(x + sign * (aw / 2 + 0.2), 0.045, z + off);
        } else {
          stripe.position.set(x + off, 0.045, z + sign * (aw / 2 + 0.2));
        }
        group.add(stripe);
      }
    }
  }
}

function addStreetProps(group: THREE.Group, colliders: AABB[]) {
  const hydrants: Array<[number, number]> = [
    [roadCoord(3) + 5.2, 12],
    [roadCoord(2) + 5.2, -16],
    [roadCoord(4) - 5.2, 22],
    [18, roadCoord(2) + 5.2],
    [-24, roadCoord(3) - 5.2],
  ];
  for (const [x, z] of hydrants) {
    const h = createHydrant();
    h.position.set(x, 0, z);
    group.add(h);
  }
  const dumps: Array<[number, number, number]> = [
    [blockBounds(0, 2).cx + 12, blockBounds(0, 2).cz + 10, 0],
    [blockBounds(0, 3).cx + 10, blockBounds(0, 3).cz - 8, Math.PI / 2],
    [blockBounds(4, 1).cx - 10, blockBounds(4, 1).cz + 10, 0.3],
  ];
  for (const [x, z, yaw] of dumps) {
    const d = createDumpster();
    d.position.set(x, 0, z);
    d.rotation.y = yaw;
    group.add(d);
    colliders.push({ minX: x - 0.9, maxX: x + 0.9, minZ: z - 0.6, maxZ: z + 0.6 });
  }
}

function addBuilding(
  group: THREE.Group,
  colliders: AABB[],
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  seed: number,
  mats: CityMats,
  kind: FacadeKind,
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  let mat: THREE.Material | THREE.Material[];
  if (mats.photo) {
    scaleFacadeUVs(geo, w, h, d);
    const face = mats.facades[kind];
    mat = [face, face, mats.roof, mats.plinth, face, face];
  } else {
    const pal = BUILDING_MATS[seed % BUILDING_MATS.length]!;
    const floors = Math.max(3, Math.round(h / 3.2));
    const tex = buildingTexture(pal.base, pal.accent, floors, seed);
    mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.62,
      metalness: 0.08,
      color: 0xdadce0,
    });
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.28, 0.82, d + 0.28), mats.plinth);
  plinth.position.set(x, 0.4, z);
  plinth.castShadow = true;
  group.add(plinth);

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.38, 0.14, d + 0.38), mats.plinth);
  ledge.position.set(x, h - 0.18, z);
  group.add(ledge);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.25, d + 0.3), mats.roof);
  roof.position.set(x, h + 0.1, z);
  group.add(roof);

  const rng = mulberry(seed + 91);
  const acCount = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < acCount; i++) {
    const aw = 1.1 + rng() * 0.6;
    const ad = 0.85 + rng() * 0.4;
    const ah = 0.55 + rng() * 0.25;
    const ac = new THREE.Mesh(new THREE.BoxGeometry(aw, ah, ad), mats.ac);
    ac.position.set(x + (rng() - 0.5) * (w * 0.55), h + 0.35 + ah / 2, z + (rng() - 0.5) * (d * 0.55));
    ac.castShadow = true;
    group.add(ac);
  }
  if (h > 14) {
    const ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 2.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x8a9098, metalness: 0.5, roughness: 0.4 }),
    );
    ant.position.set(x + w * 0.2, h + 1.4, z - d * 0.15);
    group.add(ant);
  }

  const pad = 0.15;
  colliders.push({ minX: x - w / 2 - pad, maxX: x + w / 2 + pad, minZ: z - d / 2 - pad, maxZ: z + d / 2 + pad });
}

function fillGeneric(
  group: THREE.Group,
  b: ReturnType<typeof blockBounds>,
  colliders: AABB[],
  mats: CityMats,
  seed: number,
  commercial: boolean,
) {
  const rng = mulberry(seed);
  const inset = 2.2;
  const ox = b.minX + inset;
  const oz = b.minZ + inset;
  const w = b.maxX - b.minX - inset * 2;
  const d = b.maxZ - b.minZ - inset * 2;
  const gap = 2.4;
  const cols = 2;
  const rows = 2;
  const bw = (w - gap) / cols;
  const bd = (d - gap) / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const h = commercial ? 14 + rng() * 16 : 8 + rng() * 12;
      const kind: FacadeKind = commercial
        ? rng() > 0.42
          ? "glass"
          : "street"
        : rng() > 0.45
          ? "apt"
          : "street";
      addBuilding(
        group,
        colliders,
        ox + bw * c + bw / 2 + (c === 1 ? gap : 0),
        oz + bd * r + bd / 2 + (r === 1 ? gap : 0),
        bw * (0.86 + rng() * 0.1),
        bd * (0.86 + rng() * 0.1),
        h,
        seed + c * 10 + r,
        mats,
        kind,
      );
    }
  }
}

function fillIndustrial(
  group: THREE.Group,
  b: ReturnType<typeof blockBounds>,
  colliders: AABB[],
  mats: CityMats,
  seed: number,
) {
  const rng = mulberry(seed);
  addBuilding(group, colliders, b.cx - 7, b.cz, 14, 22, 8 + rng() * 4, seed, mats, "industrial");
  addBuilding(group, colliders, b.cx + 8, b.cz - 4, 12, 16, 6 + rng() * 3, seed + 3, mats, "industrial");
  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 5, 10),
    new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.55, metalness: 0.3 }),
  );
  tank.position.set(b.cx + 8, 2.5, b.cz + 10);
  tank.castShadow = true;
  group.add(tank);
  colliders.push({
    minX: tank.position.x - 2.6,
    maxX: tank.position.x + 2.6,
    minZ: tank.position.z - 2.6,
    maxZ: tank.position.z + 2.6,
  });
}

function fillBay(
  group: THREE.Group,
  b: ReturnType<typeof blockBounds>,
  colliders: AABB[],
  mats: CityMats,
  seed: number,
) {
  addBuilding(group, colliders, b.cx, b.cz + 4, 22, 16, 11, seed, mats, "glass");
  addBuilding(group, colliders, b.cx - 8, b.cz - 8, 10, 10, 7, seed + 2, mats, "street");
}

function fillPark(
  group: THREE.Group,
  b: ReturnType<typeof blockBounds>,
  grassM: THREE.Material,
  trees: { x: number; z: number; r: number }[],
) {
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(b.maxX - b.minX - 1, 0.08, b.maxZ - b.minZ - 1),
    grassM,
  );
  pad.position.set(b.cx, 0.04, b.cz);
  pad.receiveShadow = true;
  group.add(pad);
  const path = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.1, b.maxZ - b.minZ - 2),
    new THREE.MeshStandardMaterial({ color: 0xc2b8a4, roughness: 0.9 }),
  );
  path.position.set(b.cx, 0.06, b.cz);
  group.add(path);
  const positions = [
    [b.cx - 8, b.cz - 8],
    [b.cx + 8, b.cz - 7],
    [b.cx - 9, b.cz + 6],
    [b.cx + 7, b.cz + 8],
    [b.cx - 4, b.cz + 10],
    [b.cx + 10, b.cz],
    [b.cx - 11, b.cz],
    [b.cx + 3, b.cz - 10],
  ];
  for (const [x, z] of positions) {
    const t = createTree();
    t.position.set(x!, 0, z!);
    group.add(t);
    trees.push({ x: x!, z: z!, r: 0.7 });
  }
  const benchM = new THREE.MeshStandardMaterial({ color: 0x5a4634, roughness: 0.8 });
  for (const z of [b.cz - 4, b.cz + 4]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.5), benchM);
    bench.position.set(b.cx + 3.2, 0.3, z);
    group.add(bench);
  }
}

function fillParking(
  group: THREE.Group,
  b: ReturnType<typeof blockBounds>,
  asphalt: THREE.Material,
  spots: CityWorld["parkedSpots"],
) {
  const lot = new THREE.Mesh(
    new THREE.BoxGeometry(b.maxX - b.minX - 1.2, 0.06, b.maxZ - b.minZ - 1.2),
    asphalt,
  );
  lot.position.set(b.cx, 0.03, b.cz);
  lot.receiveShadow = true;
  group.add(lot);
  const stall = new THREE.MeshStandardMaterial({ color: 0xd0d4da, roughness: 0.7 });
  const colors = [0xc45c4a, 0x3a6ea8, 0xd8d4ce, 0x4a4e56, 0x6aa06a, 0xc8a24a];
  let n = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = b.minX + 6 + col * 8;
      const z = b.minZ + 6 + row * 8;
      const line = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 4.6), stall);
      line.position.set(x, 0.06, z);
      group.add(line);
      if (n < 6) {
        spots.push({
          x,
          z,
          yaw: 0,
          color: colors[n % colors.length]!,
          kind: n === 2 ? "taxi" : n === 4 ? "van" : "civilian",
        });
        n++;
      }
    }
  }
}

function fillStation(
  group: THREE.Group,
  b: ReturnType<typeof blockBounds>,
  colliders: AABB[],
  mats: CityMats,
) {
  addBuilding(group, colliders, b.cx, b.cz + 2, 26, 14, 10, 90, mats, "civic");
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0xc5cdd8, metalness: 0.35, roughness: 0.4 }),
  );
  canopy.position.set(b.cx, 5.2, b.minZ + 6);
  group.add(canopy);
  for (const x of [b.cx - 8, b.cx, b.cx + 8]) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 5.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x88929c, metalness: 0.4, roughness: 0.4 }),
    );
    col.position.set(x, 2.6, b.minZ + 6);
    group.add(col);
  }
  const sign = makeSign("中央車站", "#1a2838", "#5ec2b8");
  sign.position.set(b.cx, 7.4, b.minZ + 1.6);
  group.add(sign);
}

function fillPolice(
  group: THREE.Group,
  b: ReturnType<typeof blockBounds>,
  colliders: AABB[],
  policeSpawn: CityWorld["policeSpawn"],
  mats: CityMats,
) {
  const w = 22;
  const d = 16;
  const h = 12;
  addBuilding(group, colliders, b.cx, b.cz - 2, w, d, h, 7, mats, "civic");
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.2, 1.1, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x2a5ad8, emissive: 0x102a80, emissiveIntensity: 0.3 }),
  );
  stripe.position.set(b.cx, 6, b.cz - 2 - d / 2);
  group.add(stripe);
  const sign = makeSign("城南警察局", "#102038", "#dce6f2");
  sign.position.set(b.cx, 8.2, b.cz - 2 - d / 2 - 0.2);
  group.add(sign);
  policeSpawn.push(
    { x: b.cx - 6, z: b.maxZ - 4, yaw: Math.PI },
    { x: b.cx, z: b.maxZ - 4, yaw: Math.PI },
    { x: b.cx + 6, z: b.maxZ - 4, yaw: Math.PI },
    { x: b.minX + 4, z: b.cz + 10, yaw: Math.PI / 2 },
  );
}

function fillCommercial(
  group: THREE.Group,
  b: ReturnType<typeof blockBounds>,
  colliders: AABB[],
  mats: CityMats,
  withShop: boolean,
) {
  addBuilding(group, colliders, b.cx - 7, b.cz + 4, 14, 18, 22, 44, mats, "glass");
  addBuilding(group, colliders, b.cx + 8, b.cz + 6, 12, 14, 18, 45, mats, "street");
  if (withShop) {
    addBuilding(group, colliders, b.cx + 6, b.minZ + 6, 10, 8, 6, 12, mats, "street");
    const sign = makeSign("東城便利商店", "#c4584a", "#fff6e8");
    sign.position.set(b.cx + 6, 6.6, b.minZ + 2.1);
    group.add(sign);
  }
}

function addCurbParked(spots: CityWorld["parkedSpots"]) {
  const colors = [0xb0b4ba, 0x3d6ca8, 0xc24a3a, 0xe8e4dc, 0x5a8f62, 0x2a2e36, 0xd0a050];
  const curbs: { x: number; z: number; yaw: number }[] = [
    { x: roadCoord(2) + 3.6, z: -22, yaw: 0 },
    { x: roadCoord(2) + 3.6, z: -8, yaw: 0 },
    { x: roadCoord(4) - 3.6, z: 10, yaw: Math.PI },
    { x: roadCoord(1) + 3.6, z: 40, yaw: 0 },
    { x: 20, z: roadCoord(3) + 3.6, yaw: Math.PI / 2 },
    { x: -30, z: roadCoord(1) - 3.6, yaw: -Math.PI / 2 },
    { x: roadCoord(0) + 3.6, z: 8, yaw: 0 },
    { x: blockBounds(3, 0).cx, z: roadCoord(0) + 3.6, yaw: Math.PI / 2 },
  ];
  curbs.forEach((c, i) => {
    spots.push({
      ...c,
      color: colors[i % colors.length]!,
      kind: i === 1 ? "taxi" : i === 5 ? "van" : "civilian",
    });
  });
}
