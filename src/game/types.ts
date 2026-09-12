export type Vec2 = { x: number; z: number };

export type AABB = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
};

export type PlaceId =
  | "centralAve"
  | "bay"
  | "park"
  | "eastBiz"
  | "westInd"
  | "station"
  | "police"
  | "parking"
  | "shop";

export type Place = {
  id: PlaceId;
  name: string;
  x: number;
  z: number;
  radius: number;
};

export type NpcProfile = {
  id: string;
  name: string;
  job: string;
  personality: string;
  status: string;
  shirt: number;
  pants: number;
  hair: number;
};

export type DialogueLine = {
  speaker: string;
  text: string;
};

export type DialogueContext = {
  wantedStars: number;
  location: string;
  missionId: string | null;
  inVehicle: boolean;
};

export interface DialogueProvider {
  getGreeting(npc: NpcProfile, ctx: DialogueContext): Promise<DialogueLine[]> | DialogueLine[];
}

export type VehicleKind = "civilian" | "sport" | "taxi" | "police" | "van";

export type VehicleState = {
  id: number;
  kind: VehicleKind;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  lateral: number;
  roll: number;
  pitch: number;
  hp: number;
  color: number;
  parked: boolean;
  ai: boolean;
  police: boolean;
  occupant: "player" | "ai" | null;
  nextNode?: { i: number; j: number };
  destNode?: { i: number; j: number };
  t: number;
};

export type NpcState = {
  profile: NpcProfile;
  x: number;
  z: number;
  yaw: number;
  walkT: number;
  waypoints: Vec2[];
  wp: number;
  wait: number;
  react: number;
};

export type PlayerState = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  vx: number;
  vz: number;
  vy: number;
  grounded: boolean;
  vehicleId: number | null;
  health: number;
  money: number;
};

export type MissionStep = {
  id: string;
  objective: string;
  hint: string;
};

export type MissionDef = {
  id: string;
  title: string;
  brief: string;
  reward: number;
  steps: MissionStep[];
};

export type MissionRuntime = {
  id: string;
  step: number;
  complete: boolean;
  marker: Vec2 | null;
  passengerId: string | null;
};

export type WantedState = {
  stars: number;
  lastCrime: number;
  lastSeen: number;
  searching: boolean;
  notifiedSearch: boolean;
};

export type HudSnapshot = {
  phase: "menu" | "playing" | "paused" | "dialogue" | "shop";
  health: number;
  money: number;
  wanted: number;
  wantedFlash: string | null;
  speedKmh: number;
  vehicleHp: number | null;
  inVehicle: boolean;
  prompt: string | null;
  location: string;
  missionTitle: string | null;
  missionObjective: string | null;
  notification: string | null;
  dialogue: {
    name: string;
    job: string;
    personality: string;
    status: string;
    lines: DialogueLine[];
    index: number;
  } | null;
  shop: boolean;
  tutorial: string | null;
  canStart: boolean;
  missionComplete: string | null;
  fps: number;
};

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  setSteer?: (v: number) => void;
  setKeys?: (codes: string[]) => void;
  enterNearestVehicle?: () => boolean;
  setVehiclePose?: (x: number, z: number, yaw: number, speed: number) => void;
  getPosition?: () => { x: number; y: number; z: number };
  getMode?: () => "foot" | "vehicle";
  setWanted?: (n: number) => void;
  startPlay?: () => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
    __chaoGang?: {
      startPlay: () => void;
      getState: () => {
        wanted: number;
        inVehicle: boolean;
        mission: string | null;
        x: number;
        z: number;
      };
    };
  }
}
