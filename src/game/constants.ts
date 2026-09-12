export const GRID = 5;
export const BLOCK = 34;
export const ROAD = 12;
export const SIDEWALK = 2.2;
export const ASPHALT = ROAD - SIDEWALK * 2;
export const CELL = BLOCK + ROAD;
export const CITY = GRID * CELL + ROAD;
export const HALF = CITY / 2;

export const FIXED_DT = 1 / 60;
export const MAX_FRAME_DT = 0.1;
export const MAX_ACCUM = 0.25;

export const PLAYER_RADIUS = 0.42;
export const PLAYER_HEIGHT = 1.72;
export const WALK_SPEED = 5.2;
export const RUN_SPEED = 8.4;
export const JUMP_SPEED = 7.2;
export const GRAVITY = 22;
export const WALK_ACCEL = 22;
export const WALK_FRICTION = 16;

export const CAR_RADIUS = 1.55;
export const CAR_LENGTH = 4.2;
export const CAR_WIDTH = 1.9;
export const CAR_ACCEL = 18;
export const CAR_BRAKE = 32;
export const CAR_DRAG = 1.6;
export const CAR_MAX_SPEED = 34;
export const CAR_REVERSE_MAX = 11;
export const CAR_TURN_RATE = 1.85;
export const CAR_HANDBRAKE = 26;
export const CAR_GRIP = 9;
export const CAR_HANDBRAKE_GRIP = 2.8;
export const LANE_OFFSET = 2.15;

export const CAM_DIST_FOOT = 4.9;
export const CAM_H_FOOT = 1.78;
export const CAM_DIST_CAR = 7.4;
export const CAM_H_CAR = 2.85;
export const CAM_SHOULDER_FOOT = 0.38;
export const CAM_SHOULDER_CAR = 0.58;
export const CAM_LOOK_Y_FOOT = 1.32;
export const CAM_LOOK_Y_CAR = 1.12;

export const ENTER_DIST = 3.6;
export const TALK_DIST = 3.2;
export const SHOP_DIST = 4.2;

export const WANTED_DECAY_HIDE = 14;
export const WANTED_DECAY_STEP = 10;
export const POLICE_SIGHT = 52;

export function roadCoord(i: number): number {
  return i * CELL + ROAD / 2 - HALF;
}

export function blockBounds(i: number, j: number) {
  const minX = i * CELL + ROAD - HALF;
  const maxX = (i + 1) * CELL - HALF;
  const minZ = j * CELL + ROAD - HALF;
  const maxZ = (j + 1) * CELL - HALF;
  return { minX, maxX, minZ, maxZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 };
}

export function yawForward(yaw: number): { x: number; z: number } {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

export function yawRight(yaw: number): { x: number; z: number } {
  return { x: Math.cos(yaw), z: -Math.sin(yaw) };
}

export function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpAngle(a: number, b: number, t: number): number {
  return a + wrapAngle(b - a) * t;
}

export function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}
