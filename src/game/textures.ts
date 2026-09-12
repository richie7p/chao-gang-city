import * as THREE from "three";

export type WorldTextures = {
  glass: THREE.Texture;
  apt: THREE.Texture;
  street: THREE.Texture;
  industrial: THREE.Texture;
  civic: THREE.Texture;
  asphalt: THREE.Texture;
  sidewalk: THREE.Texture;
  grass: THREE.Texture;
  roof: THREE.Texture;
  sky: THREE.Texture;
};

function loadTex(url: string, tile: boolean): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.wrapS = t.wrapT = tile ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
        t.repeat.set(1, 1);
        t.needsUpdate = true;
        resolve(t);
      },
      undefined,
      () => reject(new Error(url)),
    );
  });
}

export async function loadWorldTextures(): Promise<WorldTextures | null> {
  try {
    const [glass, apt, street, industrial, civic, asphalt, sidewalk, grass, roof, sky] =
      await Promise.all([
        loadTex("/textures/facade-glass.jpg", false),
        loadTex("/textures/facade-apt.jpg", true),
        loadTex("/textures/facade-street.jpg", true),
        loadTex("/textures/facade-industrial.jpg", true),
        loadTex("/textures/facade-civic.jpg", false),
        loadTex("/textures/asphalt.jpg", true),
        loadTex("/textures/sidewalk.jpg", true),
        loadTex("/textures/grass.jpg", true),
        loadTex("/textures/roof.jpg", true),
        loadTex("/textures/sky.jpg", false),
      ]);
    return { glass, apt, street, industrial, civic, asphalt, sidewalk, grass, roof, sky };
  } catch {
    return null;
  }
}

export function disposeWorldTextures(tex: WorldTextures | null) {
  if (!tex) return;
  for (const t of Object.values(tex)) t.dispose();
}

export function tileBoxUVs(geo: THREE.BoxGeometry, sx: number, sy: number, sz: number, tile: number) {
  const uv = geo.attributes.uv;
  if (!uv) return;
  const faces: Array<[number, number]> = [
    [sz / tile, sy / tile],
    [sz / tile, sy / tile],
    [sx / tile, sz / tile],
    [sx / tile, sz / tile],
    [sx / tile, sy / tile],
    [sx / tile, sy / tile],
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = faces[f]!;
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      uv.setXY(idx, uv.getX(idx) * su, uv.getY(idx) * sv);
    }
  }
  uv.needsUpdate = true;
}

export function scaleFacadeUVs(geo: THREE.BoxGeometry, w: number, h: number, d: number) {
  const uv = geo.attributes.uv;
  if (!uv) return;
  const su = (len: number) => (len > 18 ? 2 : 1);
  const sv = h > 22 ? 2 : 1;
  const roofU = Math.max(1.2, w / 9);
  const roofV = Math.max(1.2, d / 9);
  const scales: Array<[number, number]> = [
    [su(d), sv],
    [su(d), sv],
    [roofU, roofV],
    [roofU, roofV],
    [su(w), sv],
    [su(w), sv],
  ];
  for (let f = 0; f < 6; f++) {
    const [u, v] = scales[f]!;
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      uv.setXY(idx, uv.getX(idx) * u, uv.getY(idx) * v);
    }
  }
  uv.needsUpdate = true;
}

export function tilePlaneUVs(geo: THREE.PlaneGeometry, worldU: number, worldV: number, tile: number) {
  const uv = geo.attributes.uv;
  if (!uv) return;
  const su = worldU / tile;
  const sv = worldV / tile;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
  uv.needsUpdate = true;
}
