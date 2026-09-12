import { create } from "zustand";
import type { HudSnapshot } from "./types";

export const defaultHud: HudSnapshot = {
  phase: "menu",
  health: 100,
  money: 2500,
  wanted: 0,
  wantedFlash: null,
  speedKmh: 0,
  vehicleHp: null,
  inVehicle: false,
  prompt: null,
  location: "中央大道",
  missionTitle: null,
  missionObjective: null,
  notification: null,
  dialogue: null,
  shop: false,
  tutorial: null,
  canStart: true,
  missionComplete: null,
  fps: 0,
};

export const useHud = create<{
  hud: HudSnapshot;
  setHud: (h: HudSnapshot) => void;
}>((set) => ({
  hud: defaultHud,
  setHud: (hud) => set({ hud }),
}));
