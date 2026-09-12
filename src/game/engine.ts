import * as THREE from "three";
import { circlesOverlap, resolveCircleList, separateCircles } from "./collision";
import {
  CAM_DIST_CAR,
  CAM_DIST_FOOT,
  CAM_H_CAR,
  CAM_H_FOOT,
  CAM_LOOK_Y_CAR,
  CAM_LOOK_Y_FOOT,
  CAM_SHOULDER_CAR,
  CAM_SHOULDER_FOOT,
  CAR_ACCEL,
  CAR_BRAKE,
  CAR_DRAG,
  CAR_GRIP,
  CAR_HANDBRAKE,
  CAR_HANDBRAKE_GRIP,
  CAR_MAX_SPEED,
  CAR_RADIUS,
  CAR_REVERSE_MAX,
  CAR_TURN_RATE,
  CITY,
  ENTER_DIST,
  FIXED_DT,
  GRAVITY,
  HALF,
  JUMP_SPEED,
  LANE_OFFSET,
  MAX_ACCUM,
  MAX_FRAME_DT,
  PLAYER_RADIUS,
  POLICE_SIGHT,
  RUN_SPEED,
  SHOP_DIST,
  TALK_DIST,
  WALK_ACCEL,
  WALK_FRICTION,
  WALK_SPEED,
  WANTED_DECAY_HIDE,
  WANTED_DECAY_STEP,
  clamp,
  dist2,
  lerp,
  lerpAngle,
  yawForward,
  yawRight,
  wrapAngle,
} from "./constants";
import { MISSIONS, NPC_PROFILES, UI, placeById } from "./data";
import { ScriptedDialogueProvider } from "./dialogue";
import { defaultHud, useHud } from "./hud-store";
import { Input, type Actions } from "./input";
import { createCar, createPerson, disposeTexCache, markerMesh } from "./meshes";
import { buildCity, type CityWorld, type RoadNode } from "./city";
import { disposeWorldTextures, loadWorldTextures, type WorldTextures } from "./textures";
import type {
  ControlsProbe,
  DialogueProvider,
  HudSnapshot,
  MissionRuntime,
  NpcState,
  PlayerState,
  VehicleKind,
  VehicleState,
  WantedState,
} from "./types";

const SENS = 0.0026;

type CarView = {
  state: VehicleState;
  mesh: THREE.Group;
};

export class GameEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.1, 280);
  readonly input = new Input();
  private city: CityWorld;
  private player: PlayerState;
  private playerMesh: THREE.Group;
  private cars: CarView[] = [];
  private npcs: NpcState[] = [];
  private npcMeshes: THREE.Group[] = [];
  private wanted: WantedState = { stars: 0, lastCrime: -99, lastSeen: -99, searching: false, notifiedSearch: false };
  private mission: MissionRuntime;
  private marker: THREE.Group;
  private dialogue = new ScriptedDialogueProvider() as DialogueProvider;
  private camYaw = 0;
  private camPitch = 0.22;
  private lookYaw = 0;
  private camDistMul = 1;
  private lookIdle = 0;
  private lookBackBlend = 0;
  private mouseLook = false;
  private tex: WorldTextures | null = null;
  private camLook = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private phase: HudSnapshot["phase"] = "menu";
  private time = 0;
  private acc = 0;
  private lastNow = 0;
  private raf = 0;
  private running = false;
  private notifyText: string | null = null;
  private notifyT = 0;
  private tutorialI = 0;
  private tutorialT = 6;
  private missionComplete: string | null = null;
  private missionCompleteT = 0;
  private dialogueUi: HudSnapshot["dialogue"] = null;
  private shopOpen = false;
  private frames = 0;
  private fpsT = 0;
  private fps = 0;
  private sun: THREE.DirectionalLight;
  private minimap: HTMLCanvasElement | null = null;
  private nextCarId = 1;
  private crashShake = 0;
  private disposed = false;
  private canvas: HTMLCanvasElement;
  private passengerCarried = false;
  private hudDirty = true;
  private lastHudJson = "";
  private attractA = 0.6;
  private camSnap = false;
  private resizeObs: ResizeObserver | null = null;
  private audio: AudioContext | null = null;

  static async create(canvas: HTMLCanvasElement) {
    const tex = await loadWorldTextures();
    return new GameEngine(canvas, tex);
  }

  constructor(canvas: HTMLCanvasElement, tex: WorldTextures | null = null) {
    this.canvas = canvas;
    this.tex = tex;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setClearColor(0x6d7c88, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.far = 360;
    this.camera.updateProjectionMatrix();
    this.scene.fog = new THREE.Fog(0x6d7c88, 48, 175);

    const hemi = new THREE.HemisphereLight(0xd4c8b8, 0x323830, 0.95);
    this.scene.add(hemi);
    const amb = new THREE.AmbientLight(0x4a5460, 0.72);
    this.scene.add(amb);
    this.sun = new THREE.DirectionalLight(0xffe8d0, 1.4);
    this.sun.position.set(40, 62, 28);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 4;
    this.sun.shadow.camera.far = 140;
    this.sun.shadow.camera.left = -42;
    this.sun.shadow.camera.right = 42;
    this.sun.shadow.camera.top = 42;
    this.sun.shadow.camera.bottom = -42;
    this.sun.shadow.bias = -0.0007;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.city = buildCity(this.scene, tex);
    this.player = {
      x: this.city.spawn.x,
      y: 0,
      z: this.city.spawn.z,
      yaw: this.city.spawn.yaw,
      vx: 0,
      vz: 0,
      vy: 0,
      grounded: true,
      vehicleId: null,
      health: 100,
      money: 2500,
    };
    this.camYaw = this.player.yaw;
    this.playerMesh = createPerson({ shirt: 0x2a6a66, pants: 0x1c2430, hair: 0x1a120e });
    this.scene.add(this.playerMesh);

    this.spawnParked();
    this.spawnTraffic();
    this.spawnPolice();
    this.spawnNpcs();

    this.mission = {
      id: MISSIONS[0]!.id,
      step: 0,
      complete: false,
      marker: null,
      passengerId: null,
    };
    this.marker = markerMesh(0x5ec2b8);
    this.scene.add(this.marker);
    this.syncMissionMarker();

    this.input.attach(canvas);
    this.canvas.addEventListener("click", this.onCanvasClick);
    this.layout();
    this.resizeObs = new ResizeObserver(() => this.layout());
    this.resizeObs.observe(canvas.parentElement ?? canvas);

    this.wireQa();
    this.tick = this.tick.bind(this);
  }

  private onCanvasClick = () => {
    if (this.phase === "playing") this.tryPointerLock();
  };

  setDialogueProvider(p: DialogueProvider) {
    this.dialogue = p;
  }

  attachMinimap(c: HTMLCanvasElement | null) {
    this.minimap = c;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastNow = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.input.dispose();
    this.canvas.removeEventListener("click", this.onCanvasClick);
    this.resizeObs?.disconnect();
    disposeTexCache();
    disposeWorldTextures(this.tex);
    this.tex = null;
    this.renderer.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
    if (window.__controlsTest) delete window.__controlsTest;
    if (window.__chaoGang) delete window.__chaoGang;
  }

  startPlay() {
    this.unlockAudio();
    this.phase = "playing";
    this.tutorialI = 0;
    this.tutorialT = 6.5;
    this.camSnap = true;
    this.tryPointerLock();
    this.hudDirty = true;
  }

  pause() {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    document.exitPointerLock?.();
    this.hudDirty = true;
  }

  resume() {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.tryPointerLock();
    this.hudDirty = true;
  }

  closeDialogue() {
    this.dialogueUi = null;
    if (this.phase === "dialogue") this.phase = "playing";
    this.hudDirty = true;
  }

  shopBuy(item: "heal" | "repair") {
    if (item === "heal") {
      if (this.player.health >= 100) return this.notify(UI.healthFull);
      if (this.player.money < 200) return this.notify(UI.noMoney);
      this.player.money -= 200;
      this.player.health = Math.min(100, this.player.health + 45);
      this.notify(UI.boughtHeal);
    } else {
      const car = this.currentCar();
      if (!car) return this.notify(UI.noCar);
      if (car.hp >= 100) return this.notify(UI.carFull);
      if (this.player.money < 500) return this.notify(UI.noMoney);
      this.player.money -= 500;
      car.hp = Math.min(100, car.hp + 55);
      this.notify(UI.boughtRepair);
    }
    this.hudDirty = true;
  }

  closeShop() {
    this.shopOpen = false;
    if (this.phase === "shop") this.phase = "playing";
    this.hudDirty = true;
  }

  touchJump(v: boolean) {
    this.input.touchJump = v;
  }
  touchSprint(v: boolean) {
    this.input.touchSprint = v;
  }
  setTouchMove(x: number, y: number) {
    this.input.touchMoveX = x;
    this.input.touchMoveY = y;
  }
  addTouchLook(x: number, y: number) {
    this.input.touchLookX += x;
    this.input.touchLookY += y;
  }
  touchUse() {
    this.input.latchTouchUse();
  }
  touchTalk() {
    this.input.latchTouchTalk();
  }
  touchHandbrake(v: boolean) {
    this.input.touchHandbrake = v;
  }
  touchLookBack(v: boolean) {
    this.input.touchLookBack = v;
  }

  private tryPointerLock() {
    this.canvas.requestPointerLock?.();
  }

  private unlockAudio() {
    if (this.audio) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audio = new Ctx();
    } catch {
      this.audio = null;
    }
  }

  private beep(freq: number, dur = 0.12, gain = 0.05) {
    if (!this.audio) return;
    const t = this.audio.currentTime;
    const o = this.audio.createOscillator();
    const g = this.audio.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.audio.destination);
    o.start(t);
    o.stop(t + dur);
  }

  private layout() {
    const parent = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private tick(now: number) {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    let dt = (now - this.lastNow) / 1000;
    this.lastNow = now;
    if (dt > MAX_FRAME_DT) dt = MAX_FRAME_DT;
    this.frames++;
    this.fpsT += dt;
    if (this.fpsT >= 0.4) {
      this.fps = this.frames / this.fpsT;
      this.frames = 0;
      this.fpsT = 0;
      this.hudDirty = true;
    }

    const look = this.input.consumeLook();
    this.mouseLook = Math.abs(look.x) + Math.abs(look.y) > 0.2;
    if (this.phase === "playing" || this.phase === "dialogue") {
      if (this.player.vehicleId != null) this.lookYaw = wrapAngle(this.lookYaw - look.x * SENS);
      else this.camYaw -= look.x * SENS;
      this.camPitch = clamp(this.camPitch - look.y * SENS * 0.85, -0.18, 0.72);
      this.camDistMul = clamp(this.camDistMul + this.input.consumeWheel() * 0.08, 0.72, 1.45);
    }

    const actions = this.input.sample();
    if (actions.pausePressed) {
      if (this.phase === "playing") this.pause();
      else if (this.phase === "paused") this.resume();
      else if (this.phase === "dialogue") this.closeDialogue();
      else if (this.phase === "shop") this.closeShop();
    }

    if (this.phase === "playing") {
      this.acc += dt;
      if (this.acc > MAX_ACCUM) this.acc = MAX_ACCUM;
      while (this.acc >= FIXED_DT) {
        this.fixed(FIXED_DT, actions);
        this.acc -= FIXED_DT;
        this.time += FIXED_DT;
      }
    } else if (this.phase === "menu") {
      this.acc += dt;
      while (this.acc >= FIXED_DT) {
        this.fixedMenu(FIXED_DT);
        this.acc -= FIXED_DT;
        this.time += FIXED_DT;
      }
      this.attractA += dt * 0.11;
    } else if (this.phase === "dialogue") {
      if (actions.talkPressed || actions.usePressed) this.advanceDialogue();
    }

    if (this.notifyT > 0) {
      this.notifyT -= dt;
      if (this.notifyT <= 0) {
        this.notifyText = null;
        this.hudDirty = true;
      }
    }
    if (this.missionCompleteT > 0) {
      this.missionCompleteT -= dt;
      if (this.missionCompleteT <= 0) {
        this.missionComplete = null;
        this.advanceMissionChain();
      }
    }
    if (this.tutorialT > 0 && this.phase === "playing") {
      this.tutorialT -= dt;
      if (this.tutorialT <= 0) {
        this.tutorialI += 1;
        this.tutorialT = this.tutorialI < UI.tutorial.length ? 6 : 0;
        this.hudDirty = true;
      }
    }
    this.crashShake = Math.max(0, this.crashShake - dt * 4);

    this.syncVisuals();
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    this.drawMinimap();
    this.pushHud();
  }

  private fixedMenu(dt: number) {
    this.updateTraffic(dt);
    this.updateNpcs(dt, true);
    this.blinkLights();
  }

  private fixed(dt: number, a: Actions) {
    if (this.player.vehicleId != null) this.drivePlayer(dt, a);
    else this.walkPlayer(dt, a);
    this.updateTraffic(dt);
    this.updatePolice(dt);
    this.updateNpcs(dt, false);
    this.carCarHits();
    this.playerCarHits(dt);
    this.updateWanted();
    this.updateMissions();
    this.handleInteract(a);
    this.blinkLights();
    if (this.player.health <= 0) this.respawn();
  }

  private walkPlayer(dt: number, a: Actions) {
    const speed = a.sprint ? RUN_SPEED : WALK_SPEED;
    const fwd = yawForward(this.camYaw);
    const right = yawRight(this.camYaw);
    let mx = right.x * a.moveX + fwd.x * a.moveY;
    let mz = right.z * a.moveX + fwd.z * a.moveY;
    const mag = Math.hypot(mx, mz);
    if (mag > 1) {
      mx /= mag;
      mz /= mag;
    }
    const targetVx = mx * speed;
    const targetVz = mz * speed;
    const rate = mag > 0.08 ? WALK_ACCEL : WALK_FRICTION;
    const k = 1 - Math.exp(-rate * dt);
    this.player.vx = lerp(this.player.vx, targetVx, k);
    this.player.vz = lerp(this.player.vz, targetVz, k);
    let nx = this.player.x + this.player.vx * dt;
    let nz = this.player.z + this.player.vz * dt;
    const res = resolveCircleList(nx, nz, PLAYER_RADIUS, this.city.colliders);
    nx = res.x;
    nz = res.z;
    if (res.hit) {
      this.player.vx *= 0.25;
      this.player.vz *= 0.25;
    }
    for (const t of this.city.treeColliders) {
      if (circlesOverlap(nx, nz, PLAYER_RADIUS, t.x, t.z, t.r)) {
        const s = separateCircles(nx, nz, PLAYER_RADIUS, t.x, t.z, t.r, 1, 99);
        nx = s.ax;
        nz = s.az;
        this.player.vx *= 0.4;
        this.player.vz *= 0.4;
      }
    }
    this.player.x = nx;
    this.player.z = nz;
    if (mag > 0.08) {
      this.player.yaw = lerpAngle(this.player.yaw, Math.atan2(-mx, -mz), 1 - Math.exp(-14 * dt));
    }

    if (a.jumpPressed && this.player.grounded) {
      this.player.vy = JUMP_SPEED;
      this.player.grounded = false;
    }
    this.player.vy -= GRAVITY * dt;
    this.player.y += this.player.vy * dt;
    if (this.player.y <= 0) {
      this.player.y = 0;
      this.player.vy = 0;
      this.player.grounded = true;
    }
  }

  private drivePlayer(dt: number, a: Actions) {
    const car = this.currentCar();
    if (!car) {
      this.player.vehicleId = null;
      return;
    }
    this.integrateCar(car, dt, a.throttle, a.brake, a.steer, true, a.handbrake);
    this.player.x = car.x;
    this.player.z = car.z;
    this.player.y = 0;
    this.player.yaw = car.yaw;
    this.player.grounded = true;
    if (car.hp <= 0) {
      this.notify("車輛已損壞，你被迫下車。");
      this.exitVehicle();
    }
  }

  private integrateCar(
    car: VehicleState,
    dt: number,
    throttle: number,
    brake: number,
    steer: number,
    isPlayer: boolean,
    handbrake = false,
  ) {
    const max = car.kind === "sport" ? CAR_MAX_SPEED + 6 : car.kind === "van" ? CAR_MAX_SPEED - 6 : CAR_MAX_SPEED;
    if (throttle > 0) car.speed += CAR_ACCEL * throttle * dt;
    else if (brake > 0) {
      if (car.speed > 0.45) car.speed -= CAR_BRAKE * brake * dt;
      else car.speed -= CAR_ACCEL * 0.5 * brake * dt;
    } else {
      const sign = Math.sign(car.speed);
      car.speed -= sign * CAR_DRAG * 3.2 * dt;
      if (Math.abs(car.speed) < 0.18) car.speed = 0;
    }
    if (handbrake) {
      const s = Math.sign(car.speed);
      car.speed -= s * CAR_HANDBRAKE * dt;
      if (Math.abs(car.speed) < 0.35) car.speed = 0;
    }
    car.speed = clamp(car.speed, -CAR_REVERSE_MAX, max);
    const speedFactor = clamp(Math.abs(car.speed) / 7, 0, 1);
    const reverse = car.speed >= 0 ? 1 : -1;
    const turnMul = handbrake ? 1.45 : 1;
    car.yaw += steer * CAR_TURN_RATE * speedFactor * reverse * turnMul * dt;

    const f = yawForward(car.yaw);
    const r = yawRight(car.yaw);
    const grip = handbrake ? CAR_HANDBRAKE_GRIP : CAR_GRIP;
    car.lateral *= Math.max(0, 1 - grip * dt);
    if (handbrake) car.lateral += -steer * Math.abs(car.speed) * 0.38 * dt;
    const px = car.x + (f.x * car.speed + r.x * car.lateral) * dt;
    const pz = car.z + (f.z * car.speed + r.z * car.lateral) * dt;
    const before = Math.abs(car.speed);
    const hit = resolveCircleList(px, pz, CAR_RADIUS, this.city.colliders);
    car.x = hit.x;
    car.z = hit.z;
    if (hit.hit) {
      const impact = before;
      car.speed *= 0.28;
      car.lateral += (hit.nx * r.x + hit.nz * r.z) * impact * 0.15;
      if (impact > 6) {
        const dmg = (impact - 5) * (isPlayer ? 2.4 : 1.2);
        car.hp = Math.max(0, car.hp - dmg);
        if (isPlayer) {
          this.player.health = Math.max(0, this.player.health - dmg * 0.25);
          this.crashShake = Math.min(1.2, impact / 18);
          this.beep(90, 0.1, 0.06);
          if (impact > 12) this.addWanted(1, "reckless");
        }
      }
    }
    const wantRoll = -steer * clamp(Math.abs(car.speed) / 28, 0, 1) * 0.18;
    const wantPitch = throttle * 0.045 - (brake > 0 || handbrake ? 0.055 : 0);
    car.roll = lerp(car.roll, wantRoll, 1 - Math.exp(-8 * dt));
    car.pitch = lerp(car.pitch, wantPitch, 1 - Math.exp(-6 * dt));
  }

  private handleInteract(a: Actions) {
    const nearCar = this.nearestEnterable();
    const nearNpc = this.nearestNpc();
    const nearShop = dist2(this.player.x, this.player.z, this.city.shop.x, this.city.shop.z) < SHOP_DIST * SHOP_DIST;
    const nearPassenger = this.mission.id === "night-fare" && this.mission.step === 0 && this.passengerNpc();

    if (a.usePressed) {
      if (this.player.vehicleId != null) {
        if (nearPassenger && this.tryPickup()) return;
        this.exitVehicle();
        return;
      }
      if (nearCar) {
        this.enterVehicle(nearCar.state);
        return;
      }
      if (nearShop) {
        this.shopOpen = true;
        this.phase = "shop";
        this.hudDirty = true;
        return;
      }
      if (nearPassenger && this.tryPickup()) return;
    }
    if (a.talkPressed && this.player.vehicleId == null && nearNpc) {
      this.openTalk(nearNpc);
    }
  }

  private enterVehicle(car: VehicleState) {
    this.player.vehicleId = car.id;
    car.occupant = "player";
    car.parked = false;
    car.ai = false;
    this.camYaw = car.yaw;
    this.lookYaw = 0;
    this.camSnap = true;
    this.beep(220, 0.08, 0.04);
    if (this.mission.id === "intro" && this.mission.step === 0) {
      this.mission.step = 1;
      this.syncMissionMarker();
      this.notify("很好。現在把車開到中央車站。");
    }
    this.hudDirty = true;
  }

  private exitVehicle() {
    const car = this.currentCar();
    this.player.vehicleId = null;
    if (car) {
      car.occupant = null;
      car.speed = 0;
      const r = yawRight(car.yaw);
      let x = car.x + r.x * 2.3;
      let z = car.z + r.z * 2.3;
      const hit = resolveCircleList(x, z, PLAYER_RADIUS, this.city.colliders);
      this.player.x = hit.x;
      this.player.z = hit.z;
      this.player.yaw = car.yaw;
      this.camYaw = car.yaw;
      this.lookYaw = 0;
    }
    this.hudDirty = true;
  }

  private openTalk(npc: NpcState) {
    const loc = this.locationName();
    const lines = this.dialogue.getGreeting(npc.profile, {
      wantedStars: this.wanted.stars,
      location: loc,
      missionId: this.mission.complete ? null : this.mission.id,
      inVehicle: this.player.vehicleId != null,
    });
    const resolved = Array.isArray(lines) ? lines : [];
    if (!Array.isArray(lines)) {
      void Promise.resolve(lines).then((ls) => {
        this.dialogueUi = {
          name: npc.profile.name,
          job: npc.profile.job,
          personality: npc.profile.personality,
          status: npc.profile.status,
          lines: ls,
          index: 0,
        };
        this.phase = "dialogue";
        this.hudDirty = true;
      });
      return;
    }
    this.dialogueUi = {
      name: npc.profile.name,
      job: npc.profile.job,
      personality: npc.profile.personality,
      status: npc.profile.status,
      lines: resolved,
      index: 0,
    };
    this.phase = "dialogue";
    this.hudDirty = true;
  }

  private advanceDialogue() {
    if (!this.dialogueUi) return;
    if (this.dialogueUi.index < this.dialogueUi.lines.length - 1) {
      this.dialogueUi = { ...this.dialogueUi, index: this.dialogueUi.index + 1 };
    } else {
      this.closeDialogue();
    }
    this.hudDirty = true;
  }

  private spawnParked() {
    for (const s of this.city.parkedSpots) {
      this.addCar({
        kind: s.kind,
        x: s.x,
        z: s.z,
        yaw: s.yaw,
        color: s.color,
        parked: true,
        ai: false,
        police: false,
      });
    }
  }

  private spawnTraffic() {
    const colors = [0xb8bec6, 0x3c6ea5, 0xc14b3c, 0xd8d2c6, 0x4c7c58, 0xf0c040, 0x2c3038];
    const kinds: VehicleKind[] = ["civilian", "civilian", "taxi", "van", "civilian", "sport", "civilian", "taxi"];
    for (let n = 0; n < 8; n++) {
      const a = this.city.nodes[n * 3]!;
      const b = this.pickNeighbor(a) ?? a;
      const f = this.laneAt(a, b, true);
      const yaw = Math.atan2(-(b.x - a.x), -(b.z - a.z));
      const car = this.addCar({
        kind: kinds[n]!,
        x: f.x,
        z: f.z,
        yaw,
        color: colors[n % colors.length]!,
        parked: false,
        ai: true,
        police: false,
      });
      car.state.nextNode = { i: a.i, j: a.j };
      car.state.destNode = { i: b.i, j: b.j };
    }
  }

  private spawnPolice() {
    for (const s of this.city.policeSpawn) {
      const car = this.addCar({
        kind: "police",
        x: s.x,
        z: s.z,
        yaw: s.yaw,
        color: 0xe8eaee,
        parked: true,
        ai: false,
        police: true,
      });
      car.state.hp = 140;
    }
  }

  private addCar(init: {
    kind: VehicleKind;
    x: number;
    z: number;
    yaw: number;
    color: number;
    parked: boolean;
    ai: boolean;
    police: boolean;
  }): CarView {
    const state: VehicleState = {
      id: this.nextCarId++,
      kind: init.kind,
      x: init.x,
      z: init.z,
      yaw: init.yaw,
      speed: 0,
      lateral: 0,
      roll: 0,
      pitch: 0,
      hp: 100,
      color: init.color,
      parked: init.parked,
      ai: init.ai,
      police: init.police,
      occupant: null,
      t: 0,
    };
    const mesh = createCar(init.color, init.kind);
    mesh.position.set(state.x, 0, state.z);
    mesh.rotation.y = state.yaw;
    this.scene.add(mesh);
    const view = { state, mesh };
    this.cars.push(view);
    return view;
  }

  private spawnNpcs() {
    const profiles = NPC_PROFILES.filter((p) => p.id !== "passenger");
    profiles.forEach((profile, i) => {
      const loop = this.city.npcLoops[i % this.city.npcLoops.length]!;
      const start = loop[i % loop.length]!;
      const npc: NpcState = {
        profile,
        x: start.x,
        z: start.z,
        yaw: 0,
        walkT: Math.random() * 10,
        waypoints: loop,
        wp: i % loop.length,
        wait: Math.random() * 3,
        react: 0,
      };
      this.npcs.push(npc);
      const mesh = createPerson({
        shirt: profile.shirt,
        pants: profile.pants,
        hair: profile.hair,
      });
      this.npcMeshes.push(mesh);
      this.scene.add(mesh);
    });
    const p = NPC_PROFILES.find((x) => x.id === "passenger")!;
    const park = placeById("park");
    const passenger: NpcState = {
      profile: p,
      x: park.x + 4,
      z: park.z + 2,
      yaw: Math.PI,
      walkT: 0,
      waypoints: [{ x: park.x + 4, z: park.z + 2 }],
      wp: 0,
      wait: 99,
      react: 0,
    };
    this.npcs.push(passenger);
    const mesh = createPerson({ shirt: p.shirt, pants: p.pants, hair: p.hair });
    mesh.visible = false;
    this.npcMeshes.push(mesh);
    this.scene.add(mesh);
  }

  private updateNpcs(dt: number, menu: boolean) {
    const px = this.player.x;
    const pz = this.player.z;
    for (let i = 0; i < this.npcs.length; i++) {
      const n = this.npcs[i]!;
      if (n.profile.id === "passenger") {
        const show = this.mission.id === "night-fare" && this.mission.step === 0 && !this.passengerCarried;
        this.npcMeshes[i]!.visible = show;
        if (!show) continue;
      }
      if (n.react > 0) {
        n.react -= dt;
        continue;
      }
      if (!menu && dist2(n.x, n.z, px, pz) < 9) {
        n.yaw = Math.atan2(-(px - n.x), -(pz - n.z));
        n.react = 0.6;
        continue;
      }
      if (n.wait > 0) {
        n.wait -= dt;
        continue;
      }
      const dest = n.waypoints[n.wp]!;
      const dx = dest.x - n.x;
      const dz = dest.z - n.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.4) {
        n.wp = (n.wp + 1) % n.waypoints.length;
        if (Math.random() < 0.28) n.wait = 1.2 + Math.random() * 2.4;
        continue;
      }
      const sp = 1.35;
      n.x += (dx / d) * sp * dt;
      n.z += (dz / d) * sp * dt;
      n.yaw = Math.atan2(-dx, -dz);
      n.walkT += dt * 6;
    }
  }

  private updateTraffic(dt: number) {
    for (const v of this.cars) {
      const car = v.state;
      if (!car.ai || car.police || car.occupant === "player") continue;
      const dest = car.destNode ? this.node(car.destNode.i, car.destNode.j) : null;
      const from = car.nextNode ? this.node(car.nextNode.i, car.nextNode.j) : null;
      if (!dest || !from) continue;
      const target = this.laneAt(from, dest, false);
      const dx = target.x - car.x;
      const dz = target.z - car.z;
      const d = Math.hypot(dx, dz);
      const desiredYaw = Math.atan2(-dx, -dz);
      let steer = wrapAngle(desiredYaw - car.yaw);
      steer = clamp(steer * 2.4, -1, 1);
      let throttle = 0.55;
      if (this.carAhead(car, 9)) throttle = 0.05;
      this.integrateCar(car, dt, throttle, throttle < 0.1 ? 0.4 : 0, steer, false);
      car.speed = clamp(car.speed, 0, 13.5);
      if (d < 3.2) {
        const nxt = this.pickNeighbor(dest, from);
        car.nextNode = { i: dest.i, j: dest.j };
        car.destNode = nxt ? { i: nxt.i, j: nxt.j } : car.nextNode;
      }
    }
  }

  private updatePolice(dt: number) {
    const active = this.wanted.stars > 0;
    const cops = this.cars.filter((c) => c.state.police);
    let i = 0;
    for (const v of cops) {
      const car = v.state;
      const shouldChase = active && i < this.wanted.stars + 1;
      i++;
      if (!shouldChase) {
        car.ai = false;
        if (Math.abs(car.speed) > 0.2) this.integrateCar(car, dt, 0, 0.8, 0, false);
        continue;
      }
      car.parked = false;
      car.ai = true;
      const tx = this.player.x;
      const tz = this.player.z;
      const dx = tx - car.x;
      const dz = tz - car.z;
      const d = Math.hypot(dx, dz);
      if (d < POLICE_SIGHT + 8) {
        this.wanted.lastSeen = this.time;
        this.wanted.searching = false;
        this.wanted.notifiedSearch = false;
      }
      const desiredYaw = Math.atan2(-dx, -dz);
      let steer = clamp(wrapAngle(desiredYaw - car.yaw) * 2.8, -1, 1);
      const throttle = d > 6 ? 0.9 : 0.2;
      this.integrateCar(car, dt, throttle, 0, steer, false);
      car.speed = clamp(car.speed, -6, 22 + this.wanted.stars * 1.5);
      if (d < 4.5 && this.player.vehicleId != null) {
        this.player.health = Math.max(0, this.player.health - 8 * dt);
      }
    }
  }

  private carAhead(car: VehicleState, dist: number): boolean {
    const f = yawForward(car.yaw);
    for (const o of this.cars) {
      if (o.state.id === car.id) continue;
      const dx = o.state.x - car.x;
      const dz = o.state.z - car.z;
      const along = dx * f.x + dz * f.z;
      if (along < 1.4 || along > dist) continue;
      const side = Math.abs(dx * -f.z + dz * f.x);
      if (side < 2.1) return true;
    }
    return false;
  }

  private carCarHits() {
    for (let i = 0; i < this.cars.length; i++) {
      for (let j = i + 1; j < this.cars.length; j++) {
        const a = this.cars[i]!.state;
        const b = this.cars[j]!.state;
        const rel = Math.abs(a.speed - b.speed);
        const sep = separateCircles(a.x, a.z, CAR_RADIUS * 0.92, b.x, b.z, CAR_RADIUS * 0.92, 1, 1);
        if (!sep.hit) continue;
        a.x = sep.ax;
        a.z = sep.az;
        b.x = sep.bx;
        b.z = sep.bz;
        const impact = rel + Math.abs(a.speed) * 0.3;
        if (impact > 7) {
          a.speed *= 0.55;
          b.speed *= 0.55;
          if (a.occupant === "player" || b.occupant === "player") {
            const dmg = (impact - 6) * 1.8;
            a.hp -= dmg * 0.5;
            b.hp -= dmg * 0.5;
            this.player.health = Math.max(0, this.player.health - dmg * 0.2);
            this.crashShake = 0.5;
            if (impact > 9) this.addWanted(1, "crash");
          }
        }
      }
    }
  }

  private playerCarHits(_dt: number) {
    if (this.player.vehicleId != null) return;
    for (const v of this.cars) {
      const c = v.state;
      if (!circlesOverlap(this.player.x, this.player.z, PLAYER_RADIUS, c.x, c.z, CAR_RADIUS * 0.85)) continue;
      const sep = separateCircles(this.player.x, this.player.z, PLAYER_RADIUS, c.x, c.z, CAR_RADIUS * 0.85, 1, 4);
      this.player.x = sep.ax;
      this.player.z = sep.az;
      if (Math.abs(c.speed) > 8) {
        this.player.health = Math.max(0, this.player.health - 18);
        this.addWanted(1, "hit-player");
      }
    }
    for (let i = 0; i < this.npcs.length; i++) {
      const n = this.npcs[i]!;
      if (!this.npcMeshes[i]?.visible) continue;
      const driver = this.currentCar();
      const px = this.player.x;
      const pz = this.player.z;
      const r = this.player.vehicleId != null ? CAR_RADIUS : PLAYER_RADIUS;
      if (!circlesOverlap(px, pz, r, n.x, n.z, 0.4)) continue;
      if (this.player.vehicleId != null && driver && Math.abs(driver.speed) > 6) {
        n.react = 2;
        n.x += (n.x - px) * 0.4;
        n.z += (n.z - pz) * 0.4;
        this.addWanted(2, "ped");
        this.player.health = Math.max(0, this.player.health - 4);
        this.notify("你撞到路人了！");
      }
    }
  }

  private addWanted(delta: number, _why: string) {
    if (this.time - this.wanted.lastCrime < 1.4) return;
    const prev = this.wanted.stars;
    this.wanted.stars = clamp(this.wanted.stars + delta, 0, 5);
    this.wanted.lastCrime = this.time;
    this.wanted.lastSeen = this.time;
    this.wanted.searching = false;
    this.wanted.notifiedSearch = false;
    if (this.wanted.stars > prev) {
      this.beep(140, 0.2, 0.07);
      if (prev === 0) this.notify(UI.wantedStart);
      this.notify(UI.wantedUp(this.wanted.stars));
    }
  }

  private updateWanted() {
    if (this.wanted.stars <= 0) return;
    let seen = false;
    for (const v of this.cars) {
      if (!v.state.police) continue;
      if (dist2(v.state.x, v.state.z, this.player.x, this.player.z) < POLICE_SIGHT * POLICE_SIGHT) {
        seen = true;
        break;
      }
    }
    if (seen) {
      this.wanted.lastSeen = this.time;
      if (this.wanted.searching) {
        this.wanted.searching = false;
        this.wanted.notifiedSearch = false;
      }
      return;
    }
    const hidden = this.time - this.wanted.lastSeen;
    if (hidden > WANTED_DECAY_HIDE && !this.wanted.searching) {
      this.wanted.searching = true;
      if (!this.wanted.notifiedSearch) {
        this.wanted.notifiedSearch = true;
        this.notify(UI.wantedSearch);
      }
    }
    if (hidden > WANTED_DECAY_HIDE + WANTED_DECAY_STEP) {
      this.wanted.stars -= 1;
      this.wanted.lastSeen = this.time - WANTED_DECAY_HIDE;
      if (this.wanted.stars <= 0) {
        this.wanted.stars = 0;
        this.wanted.searching = false;
        this.notify(UI.wantedClear);
      } else {
        this.notify(`通緝等級降至 ${this.wanted.stars} 星`);
      }
    }
  }

  private updateMissions() {
    if (this.mission.complete || this.missionComplete) return;
    const def = MISSIONS.find((m) => m.id === this.mission.id);
    if (!def) return;
    if (this.mission.id === "intro") {
      if (this.mission.step === 0 && this.player.vehicleId != null) {
        this.mission.step = 1;
        this.syncMissionMarker();
      }
      if (this.mission.step === 1) {
        const st = placeById("station");
        if (dist2(this.player.x, this.player.z, st.x, st.z) < 14 * 14) this.completeMission();
      }
    } else if (this.mission.id === "night-fare") {
      if (this.mission.step === 1) {
        const east = placeById("eastBiz");
        if (this.passengerCarried && dist2(this.player.x, this.player.z, east.x, east.z) < 16 * 16) {
          this.dropPassenger();
          this.completeMission();
        }
      }
    } else if (this.mission.id === "escape") {
      if (this.wanted.stars === 0 && this.time - this.wanted.lastCrime > 1) this.completeMission();
    }
  }

  private tryPickup(): boolean {
    if (this.mission.id !== "night-fare" || this.mission.step !== 0) return false;
    if (this.player.vehicleId == null) {
      this.notify("先上車，再接乘客。");
      return true;
    }
    const p = this.passengerNpc();
    if (!p) return false;
    if (dist2(this.player.x, this.player.z, p.x, p.z) > 8 * 8) return false;
    this.passengerCarried = true;
    this.mission.step = 1;
    this.mission.passengerId = "passenger";
    this.syncMissionMarker();
    this.notify("乘客已上車。前往東城商業區。");
    return true;
  }

  private dropPassenger() {
    const p = this.passengerNpc();
    const east = placeById("eastBiz");
    if (p) {
      p.x = east.x + 5;
      p.z = east.z + 4;
    }
    this.passengerCarried = false;
  }

  private completeMission() {
    const def = MISSIONS.find((m) => m.id === this.mission.id)!;
    this.mission.complete = true;
    this.player.money += def.reward;
    this.missionComplete = UI.missionComplete(def.title, def.reward);
    this.missionCompleteT = 3.2;
    this.beep(440, 0.18, 0.05);
    this.hudDirty = true;
  }

  private advanceMissionChain() {
    const idx = MISSIONS.findIndex((m) => m.id === this.mission.id);
    const next = MISSIONS[idx + 1];
    if (!next) {
      this.mission.complete = true;
      this.notify(UI.allMissions);
      this.marker.visible = false;
      this.hudDirty = true;
      return;
    }
    this.mission = {
      id: next.id,
      step: 0,
      complete: false,
      marker: null,
      passengerId: null,
    };
    if (next.id === "escape") {
      this.wanted.stars = 2;
      this.wanted.lastCrime = this.time;
      this.wanted.lastSeen = this.time;
      this.notify(UI.wantedStart);
      this.notify(UI.wantedUp(2));
    }
    this.syncMissionMarker();
    this.notify(`新任務：${next.title}`);
    this.hudDirty = true;
  }

  private syncMissionMarker() {
    const pos = this.markerPos();
    if (!pos) {
      this.marker.visible = false;
      return;
    }
    this.marker.visible = true;
    this.marker.position.set(pos.x, 0, pos.z);
    this.mission.marker = pos;
  }

  private markerPos(): { x: number; z: number } | null {
    if (this.mission.complete) return null;
    if (this.mission.id === "intro") {
      if (this.mission.step === 0) {
        const c = this.cars[0]?.state;
        return c ? { x: c.x, z: c.z } : null;
      }
      const st = placeById("station");
      return { x: st.x, z: st.z };
    }
    if (this.mission.id === "night-fare") {
      if (this.mission.step === 0) {
        const p = this.passengerNpc();
        return p ? { x: p.x, z: p.z } : placeById("park");
      }
      const e = placeById("eastBiz");
      return { x: e.x, z: e.z };
    }
    return null;
  }

  private blinkLights() {
    const t = this.time;
    for (const v of this.cars) {
      if (!v.state.police) continue;
      const on = this.wanted.stars > 0;
      v.mesh.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        if (o.name === "copRed") {
          const m = o.material as THREE.MeshStandardMaterial;
          m.emissiveIntensity = on && Math.sin(t * 14) > 0 ? 1.6 : 0.15;
        }
        if (o.name === "copBlue") {
          const m = o.material as THREE.MeshStandardMaterial;
          m.emissiveIntensity = on && Math.sin(t * 14) < 0 ? 1.6 : 0.15;
        }
      });
    }
    this.marker.rotation.y = t * 0.9;
    this.marker.position.y = 0.12 + Math.sin(t * 2.4) * 0.12;
  }

  private syncVisuals() {
    const p = this.player;
    this.playerMesh.visible = p.vehicleId == null && this.phase !== "menu";
    this.playerMesh.position.set(p.x, p.y, p.z);
    this.playerMesh.rotation.y = p.yaw;
    const moving = p.vehicleId == null && this.phase === "playing";
    this.swingLimbs(this.playerMesh, moving ? this.time * 8 : 0);

    for (let i = 0; i < this.npcs.length; i++) {
      const n = this.npcs[i]!;
      const m = this.npcMeshes[i]!;
      m.position.set(n.x, 0, n.z);
      m.rotation.y = n.yaw;
      this.swingLimbs(m, n.wait > 0 || n.react > 0 ? 0 : n.walkT);
    }
    for (const v of this.cars) {
      v.mesh.position.set(v.state.x, 0, v.state.z);
      v.mesh.rotation.order = "YXZ";
      v.mesh.rotation.x = v.state.pitch;
      v.mesh.rotation.y = v.state.yaw;
      v.mesh.rotation.z = v.state.roll;
      const spin = v.state.speed * 0.35;
      v.mesh.traverse((o) => {
        if (o.name === "wheel") o.rotation.x += spin;
      });
    }
    const pos = this.markerPos();
    if (pos && this.marker.visible) {
      this.marker.position.x = pos.x;
      this.marker.position.z = pos.z;
    }
  }

  private swingLimbs(root: THREE.Group, t: number) {
    const a = Math.sin(t) * 0.45;
    root.traverse((o) => {
      if (o.name === "leftArm" || o.name === "rightLeg") o.rotation.x = a;
      if (o.name === "rightArm" || o.name === "leftLeg") o.rotation.x = -a;
    });
  }

  private updateCamera(dt: number) {
    if (this.phase === "menu") {
      const r = 78;
      const y = 38;
      this.camera.position.set(Math.sin(this.attractA) * r, y, Math.cos(this.attractA) * r);
      this.camera.lookAt(0, 2, -8);
      this.camera.fov = 52;
      this.camera.updateProjectionMatrix();
      return;
    }
    const car = this.currentCar();
    const inCar = !!car;
    this.lookBackBlend = lerp(
      this.lookBackBlend,
      this.input.touchLookBack || this.input.keys.has("KeyC") ? 1 : 0,
      1 - Math.exp(-12 * dt),
    );

    if (car) {
      if (this.mouseLook) this.lookIdle = 0;
      else this.lookIdle += dt;
      if (this.lookIdle > 0.4) {
        const rec = 2.8 + (Math.abs(car.speed) > 8 ? 1.6 : 0);
        this.lookYaw = lerpAngle(this.lookYaw, 0, 1 - Math.exp(-rec * dt));
      }
    }

    const heading = car
      ? car.yaw + this.lookYaw + this.lookBackBlend * Math.PI
      : this.camYaw + this.lookBackBlend * Math.PI;
    const fwd = yawForward(heading);
    const right = yawRight(heading);
    const dist = (inCar ? CAM_DIST_CAR : CAM_DIST_FOOT) * this.camDistMul;
    const height = (inCar ? CAM_H_CAR : CAM_H_FOOT) + this.player.y;
    const lookY = (inCar ? CAM_LOOK_Y_CAR : CAM_LOOK_Y_FOOT) + this.player.y;
    const shoulder = inCar ? CAM_SHOULDER_CAR : CAM_SHOULDER_FOOT;
    const pitch = this.camPitch;

    let wantX = this.player.x - fwd.x * dist * Math.cos(pitch * 0.4) + right.x * shoulder;
    let wantZ = this.player.z - fwd.z * dist * Math.cos(pitch * 0.4) + right.z * shoulder;
    let wantY = height + Math.sin(pitch) * dist * 0.55;
    if (!inCar) {
      const spd = Math.hypot(this.player.vx, this.player.vz);
      wantY += Math.sin(this.time * 9) * Math.min(0.045, spd * 0.008);
    }

    let pull = 1;
    for (let i = 0; i < 6; i++) {
      const x = this.player.x + (wantX - this.player.x) * pull;
      const z = this.player.z + (wantZ - this.player.z) * pull;
      const hit = resolveCircleList(x, z, 0.45, this.city.colliders);
      if (!hit.hit) break;
      pull *= 0.7;
    }
    wantX = this.player.x + (wantX - this.player.x) * pull;
    wantZ = this.player.z + (wantZ - this.player.z) * pull;
    if (pull < 0.45) wantY = Math.max(wantY, this.player.y + 1.55);

    const k = this.camSnap ? 1 : 1 - Math.exp(-(inCar ? 10 : 13) * dt);
    this.camSnap = false;
    let camX = lerp(this.camera.position.x, wantX, k);
    let camY = lerp(this.camera.position.y, wantY, k);
    let camZ = lerp(this.camera.position.z, wantZ, k);
    if (this.crashShake > 0) {
      camX += (Math.random() - 0.5) * this.crashShake * 0.35;
      camY += (Math.random() - 0.5) * this.crashShake * 0.2;
    }
    this.camera.position.set(camX, camY, camZ);

    const cf = yawForward(car ? car.yaw : this.player.yaw);
    this.lookTarget.set(
      this.player.x + cf.x * 1.15 + right.x * shoulder * 0.35,
      lookY,
      this.player.z + cf.z * 1.15 + right.z * shoulder * 0.35,
    );
    if (this.camLook.lengthSq() < 0.01) this.camLook.copy(this.lookTarget);
    this.camLook.lerp(this.lookTarget, k);
    this.camera.lookAt(this.camLook);

    const spd = car?.speed ?? 0;
    const wantFov = inCar ? 56 + clamp(Math.abs(spd) * 0.28, 0, 10) : 58;
    this.camera.fov = lerp(this.camera.fov, wantFov, 0.08);
    this.camera.updateProjectionMatrix();
    this.sun.position.set(this.player.x + 28, 60, this.player.z + 18);
    this.sun.target.position.set(this.player.x, 0, this.player.z);
    this.sun.target.updateMatrixWorld();
  }

  private drawMinimap() {
    const c = this.minimap;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#10161c";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    const scale = (w * 0.92) / CITY;
    const toX = (x: number) => w / 2 + (x - this.player.x) * scale;
    const toY = (z: number) => h / 2 + (z - this.player.z) * scale;
    ctx.fillStyle = "#2f5a3a";
    ctx.fillRect(toX(-HALF), toY(-HALF), CITY * scale, CITY * scale);
    ctx.fillStyle = "#3a3e44";
    ctx.strokeStyle = "#3a3e44";
    ctx.lineWidth = 3.2;
    for (let i = 0; i <= 5; i++) {
      const a = -HALF + i * (CITY / 5);
      ctx.beginPath();
      ctx.moveTo(toX(a), toY(-HALF));
      ctx.lineTo(toX(a), toY(HALF));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toX(-HALF), toY(a));
      ctx.lineTo(toX(HALF), toY(a));
      ctx.stroke();
    }
    for (const v of this.cars) {
      ctx.fillStyle = v.state.police ? "#3a6adf" : "#c5ccd4";
      ctx.fillRect(toX(v.state.x) - 1.5, toY(v.state.z) - 1.5, 3, 3);
    }
    const mk = this.markerPos();
    if (mk) {
      ctx.fillStyle = "#5ec2b8";
      ctx.beginPath();
      ctx.arc(toX(mk.x), toY(mk.z), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-this.player.yaw);
    ctx.fillStyle = "#f2f4f7";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(4.5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(232,234,238,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  private pushHud() {
    if (!this.hudDirty && this.phase === "playing") {
      /* still push occasionally */
    }
    const car = this.currentCar();
    const def = MISSIONS.find((m) => m.id === this.mission.id);
    const step = def && !this.mission.complete ? def.steps[this.mission.step] : undefined;
    const snap: HudSnapshot = {
      phase: this.phase,
      health: Math.round(this.player.health),
      money: Math.round(this.player.money),
      wanted: this.wanted.stars,
      wantedFlash: this.wanted.searching ? UI.wantedSearch : null,
      speedKmh: car ? Math.round(Math.abs(car.speed) * 3.6) : 0,
      vehicleHp: car ? Math.max(0, Math.round(car.hp)) : null,
      inVehicle: car != null,
      prompt: this.promptText(),
      location: this.locationName(),
      missionTitle: this.mission.complete && !def ? null : (def && !this.mission.complete ? def.title : null),
      missionObjective: step?.objective ?? null,
      notification: this.notifyText,
      dialogue: this.dialogueUi,
      shop: this.shopOpen,
      tutorial:
        this.phase === "playing" && this.tutorialI < UI.tutorial.length && this.tutorialT > 0
          ? UI.tutorial[this.tutorialI]!
          : null,
      canStart: true,
      missionComplete: this.missionComplete,
      fps: Math.round(this.fps),
    };
    const key = JSON.stringify(snap);
    if (key === this.lastHudJson) return;
    this.lastHudJson = key;
    this.hudDirty = false;
    useHud.getState().setHud(snap);
  }

  private promptText(): string | null {
    if (this.phase !== "playing") return null;
    if (this.player.vehicleId != null) {
      if (this.mission.id === "night-fare" && this.mission.step === 0) {
        const p = this.passengerNpc();
        if (p && dist2(this.player.x, this.player.z, p.x, p.z) < 8 * 8) return UI.promptPickup;
      }
      return UI.promptExit;
    }
    if (this.nearestEnterable()) return UI.promptEnter;
    if (dist2(this.player.x, this.player.z, this.city.shop.x, this.city.shop.z) < SHOP_DIST * SHOP_DIST)
      return UI.promptShop;
    if (this.nearestNpc()) return UI.promptTalk;
    return null;
  }

  private locationName(): string {
    let best = this.city.places[0]!;
    let bestD = Infinity;
    for (const p of this.city.places) {
      const d = dist2(this.player.x, this.player.z, p.x, p.z);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best.name;
  }

  private nearestEnterable(): CarView | null {
    let best: CarView | null = null;
    let bestD = ENTER_DIST * ENTER_DIST;
    for (const v of this.cars) {
      if (v.state.occupant === "player") continue;
      if (Math.abs(v.state.speed) > 4.5) continue;
      const d = dist2(this.player.x, this.player.z, v.state.x, v.state.z);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  private nearestNpc(): NpcState | null {
    let best: NpcState | null = null;
    let bestD = TALK_DIST * TALK_DIST;
    for (let i = 0; i < this.npcs.length; i++) {
      if (!this.npcMeshes[i]?.visible) continue;
      const n = this.npcs[i]!;
      const d = dist2(this.player.x, this.player.z, n.x, n.z);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  private passengerNpc(): NpcState | undefined {
    return this.npcs.find((n) => n.profile.id === "passenger");
  }

  private currentCar(): VehicleState | null {
    if (this.player.vehicleId == null) return null;
    return this.cars.find((c) => c.state.id === this.player.vehicleId)?.state ?? null;
  }

  private node(i: number, j: number): RoadNode | null {
    return this.city.nodes.find((n) => n.i === i && n.j === j) ?? null;
  }

  private pickNeighbor(n: RoadNode, avoid?: RoadNode): RoadNode | null {
    const opts: RoadNode[] = [];
    for (const o of this.city.nodes) {
      const di = Math.abs(o.i - n.i);
      const dj = Math.abs(o.j - n.j);
      if (di + dj !== 1) continue;
      if (avoid && o.i === avoid.i && o.j === avoid.j) continue;
      opts.push(o);
    }
    if (!opts.length) {
      for (const o of this.city.nodes) {
        if (Math.abs(o.i - n.i) + Math.abs(o.j - n.j) === 1) opts.push(o);
      }
    }
    return opts[Math.floor(Math.random() * opts.length)] ?? null;
  }

  private laneAt(from: RoadNode, to: RoadNode, atFrom: boolean): { x: number; z: number } {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.hypot(dx, dz) || 1;
    const rx = -dz / len;
    const rz = dx / len;
    const base = atFrom ? from : to;
    return { x: base.x + rx * LANE_OFFSET, z: base.z + rz * LANE_OFFSET };
  }

  private enterNearestVehicleSafe() {
    const n = this.nearestEnterable() ?? this.cars[0];
    if (!n) return;
    this.enterVehicle(n.state);
  }

  private notify(msg: string) {
    this.notifyText = msg;
    this.notifyT = 3.4;
    this.hudDirty = true;
  }

  private respawn() {
    this.exitVehicle();
    this.player.x = this.city.spawn.x;
    this.player.z = this.city.spawn.z;
    this.player.y = 0;
    this.player.vx = 0;
    this.player.vz = 0;
    this.player.health = 70;
    this.notify("你受傷過重，已在中央大道醒來。");
  }

  private wireQa() {
    const probe: ControlsProbe = {
      getYaw: () => this.currentCar()?.yaw ?? this.player.yaw,
      getSpeed: () => this.currentCar()?.speed ?? 0,
      setSteer: (v) => {
        this.input.qaSteer = v;
      },
      setKeys: (codes) => {
        this.input.qaKeys = new Set(codes);
      },
      enterNearestVehicle: () => {
        if (this.phase !== "playing") this.startPlay();
        const n = this.nearestEnterable() ?? this.cars[0];
        if (!n) return false;
        this.player.x = n.state.x + 2;
        this.player.z = n.state.z;
        this.enterVehicle(n.state);
        n.state.speed = 12;
        return true;
      },
      setVehiclePose: (x, z, yaw, speed) => {
        if (this.phase !== "playing") this.startPlay();
        let car = this.currentCar();
        if (!car) {
          this.enterNearestVehicleSafe();
          car = this.currentCar();
        }
        if (!car) return;
        car.x = x;
        car.z = z;
        car.yaw = yaw;
        car.speed = speed;
        car.lateral = 0;
        this.player.x = x;
        this.player.z = z;
        this.player.yaw = yaw;
        this.camYaw = yaw;
        this.lookYaw = 0;
        this.camSnap = true;
      },
      getPosition: () => ({ x: this.player.x, y: this.player.y, z: this.player.z }),
      getMode: () => (this.player.vehicleId != null ? "vehicle" : "foot"),
      setWanted: (n) => {
        this.wanted.stars = clamp(n, 0, 5);
        this.wanted.lastSeen = this.time;
        this.hudDirty = true;
      },
      startPlay: () => this.startPlay(),
    };
    window.__controlsTest = probe;
    window.__chaoGang = {
      startPlay: () => this.startPlay(),
      getState: () => ({
        wanted: this.wanted.stars,
        inVehicle: this.player.vehicleId != null,
        mission: this.mission.complete ? null : this.mission.id,
        x: this.player.x,
        z: this.player.z,
      }),
    };
  }
}

export { defaultHud };
