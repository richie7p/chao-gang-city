import { test } from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../../src/game/engine";
import { resolveCircleAabb, separateCircles, circlesOverlap } from "../../src/game/collision";
import { CAR_MAX_SPEED, CAR_REVERSE_MAX } from "../../src/game/constants";
import { MISSIONS, placeById } from "../../src/game/data";
import type { VehicleState } from "../../src/game/types";

// Exercise the actual engine methods without constructing a GPU renderer.
function engine() {
  return Object.assign(Object.create(GameEngine.prototype), {
    city: { colliders: [] }, player: { x: 0, z: 0, money: 0, health: 100, vehicleId: null },
    mission: { id: "intro", step: 0, complete: false }, missionComplete: null,
    wanted: { stars: 0, lastCrime: 0 }, time: 5, passengerCarried: false,
    syncMissionMarker() {}, beep() {}, notify() {}, dropPassenger() { this.passengerCarried = false; },
  });
}
function car(): VehicleState {
  return { id: 1, kind: "civilian", x: 0, z: 0, yaw: 0, speed: 0, lateral: 0,
    roll: 0, pitch: 0, hp: 100, color: 0, parked: true, ai: true, police: false, occupant: null, t: 0 };
}
test("collision resolves a circle inside a wall to its nearest exterior", () => {
  const hit = resolveCircleAabb(0.2, 1, 0.5, { minX: 0, maxX: 2, minZ: 0, maxZ: 2 });
  assert.equal(hit.x, -0.5); assert.equal(hit.z, 1); assert.equal(hit.hit, true);
});
test("corner collision produces a unit normal and no remaining penetration", () => {
  const box = { minX: 0, maxX: 2, minZ: 0, maxZ: 2 };
  const hit = resolveCircleAabb(-0.2, -0.2, 1, box);
  assert.ok(Math.abs(Math.hypot(hit.x, hit.z) - 1) < 1e-9);
  assert.ok(Math.abs(Math.hypot(hit.nx, hit.nz) - 1) < 1e-9);
});
test("coincident bodies separate deterministically with mass weighting", () => {
  const hit = separateCircles(0, 0, 1, 0, 0, 1, 3, 1);
  assert.equal(hit.ax, 0.5); assert.equal(hit.bx, -1.5);
  assert.equal(circlesOverlap(hit.ax, hit.az, 1, hit.bx, hit.bz, 1), false);
});
test("forward and reverse speed stay bounded after sustained input", () => {
  const e = engine(); const c = car();
  for (let i = 0; i < 600; i++) e.integrateCar(c, 1/60, 1, 0, 0, false);
  assert.equal(c.speed, CAR_MAX_SPEED);
  for (let i = 0; i < 600; i++) e.integrateCar(c, 1/60, 0, 1, 0, false);
  assert.equal(c.speed, -CAR_REVERSE_MAX);
});
test("handbrake and drag stop without reversing direction", () => {
  const e = engine(); const c = car(); c.speed = 0.4;
  e.integrateCar(c, 0.1, 0, 0, 0, false, true); assert.equal(c.speed, 0);
  c.speed = -0.2; e.integrateCar(c, 0.1, 0, 0, 0, false); assert.equal(Math.abs(c.speed), 0);
});
test("steering left turns toward negative X, right toward positive X", () => {
  const e = engine(); const left = car(); const right = car(); left.speed = right.speed = 12;
  e.integrateCar(left, 0.1, 1, 0, 1, false); e.integrateCar(right, 0.1, 1, 0, -1, false);
  assert.ok(left.yaw > 0 && left.x < 0); assert.ok(right.yaw < 0 && right.x > 0);
});
test("entering a vehicle transfers occupancy and advances the intro objective", () => {
  const e = engine(); const c = car(); e.enterVehicle(c);
  assert.equal(e.player.vehicleId, c.id); assert.equal(c.occupant, "player");
  assert.equal(c.ai, false); assert.equal(c.parked, false); assert.equal(e.mission.step, 1);
});
test("intro destination completes once and pays the configured reward once", () => {
  const e = engine(); e.mission.step = 1; Object.assign(e.player, placeById("station"));
  e.updateMissions(); e.completeMission();
  assert.equal(e.mission.complete, true); assert.equal(e.player.money, MISSIONS[0]!.reward);
});
test("passenger delivery requires a passenger and reaching the destination", () => {
  const e = engine(); e.mission = { id: "night-fare", step: 1, complete: false };
  Object.assign(e.player, placeById("eastBiz")); e.updateMissions(); assert.equal(e.mission.complete, false);
  e.passengerCarried = true; e.updateMissions(); assert.equal(e.mission.complete, true);
});
test("escape cannot complete while wanted or during the crime grace period", () => {
  const e = engine(); e.mission = { id: "escape", step: 0, complete: false };
  e.wanted.stars = 1; e.updateMissions(); assert.equal(e.mission.complete, false);
  e.wanted.stars = 0; e.time = 0.5; e.updateMissions(); assert.equal(e.mission.complete, false);
  e.time = 2; e.updateMissions(); assert.equal(e.mission.complete, true);
});
