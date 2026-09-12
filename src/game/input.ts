export type Actions = {
  moveX: number;
  moveY: number;
  steer: number;
  throttle: number;
  brake: number;
  sprint: boolean;
  jump: boolean;
  jumpPressed: boolean;
  handbrake: boolean;
  lookBack: boolean;
  usePressed: boolean;
  talkPressed: boolean;
  pausePressed: boolean;
  lookX: number;
  lookY: number;
};

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "Space",
  "KeyE",
  "KeyF",
  "KeyC",
  "Escape",
]);

function radialDeadzone(x: number, y: number, dz = 0.18): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export class Input {
  keys = new Set<string>();
  qaKeys: Set<string> | null = null;
  qaSteer: number | null = null;
  private prevJump = false;
  private prevUse = false;
  private prevTalk = false;
  private prevPause = false;
  lookX = 0;
  lookY = 0;
  touchMoveX = 0;
  touchMoveY = 0;
  touchLookX = 0;
  touchLookY = 0;
  touchSprint = false;
  touchJump = false;
  touchUse = false;
  touchTalk = false;
  touchHandbrake = false;
  touchLookBack = false;
  wheelDelta = 0;
  private touchUseLatch = false;
  private touchTalkLatch = false;
  private unbind: Array<() => void> = [];

  attach(target: HTMLElement) {
    const onDown = (e: KeyboardEvent) => {
      if (GAME_CODES.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const clear = () => this.keys.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });
    this.unbind.push(() => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
    });

    let dragging = false;
    let pid: number | null = null;
    const onPtrDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      dragging = true;
      pid = e.pointerId;
      target.setPointerCapture(e.pointerId);
    };
    const onPtrMove = (e: PointerEvent) => {
      const locked = document.pointerLockElement === target;
      if (locked) {
        this.lookX += e.movementX;
        this.lookY += e.movementY;
        return;
      }
      if (!dragging || e.pointerId !== pid) return;
      this.lookX += e.movementX;
      this.lookY += e.movementY;
    };
    const onPtrUp = (e: PointerEvent) => {
      if (e.pointerId === pid) {
        dragging = false;
        pid = null;
      }
    };
    target.addEventListener("pointerdown", onPtrDown);
    window.addEventListener("pointermove", onPtrMove);
    window.addEventListener("pointerup", onPtrUp);
    window.addEventListener("pointercancel", onPtrUp);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.wheelDelta += Math.sign(e.deltaY);
    };
    target.addEventListener("wheel", onWheel, { passive: false });
    this.unbind.push(() => {
      target.removeEventListener("pointerdown", onPtrDown);
      window.removeEventListener("pointermove", onPtrMove);
      window.removeEventListener("pointerup", onPtrUp);
      window.removeEventListener("pointercancel", onPtrUp);
      target.removeEventListener("wheel", onWheel);
    });
  }

  dispose() {
    for (const fn of this.unbind) fn();
    this.unbind = [];
  }

  consumeLook(): { x: number; y: number } {
    const x = this.lookX + this.touchLookX;
    const y = this.lookY + this.touchLookY;
    this.lookX = 0;
    this.lookY = 0;
    this.touchLookX = 0;
    this.touchLookY = 0;
    return { x, y };
  }

  consumeWheel(): number {
    const w = this.wheelDelta;
    this.wheelDelta = 0;
    return w;
  }

  latchTouchUse() {
    this.touchUseLatch = true;
  }
  latchTouchTalk() {
    this.touchTalkLatch = true;
  }

  sample(): Actions {
    const k = this.qaKeys ?? this.keys;
    let moveX = this.touchMoveX;
    let moveY = this.touchMoveY;
    if (k.has("KeyA") || k.has("ArrowLeft")) moveX -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) moveX += 1;
    if (k.has("KeyW") || k.has("ArrowUp")) moveY += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) moveY -= 1;

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
    if (pads) {
      for (const pad of pads) {
        if (!pad || pad.mapping !== "standard") continue;
        const st = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
        moveX += st.x;
        moveY += -st.y;
        const look = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0, 0.12);
        this.lookX += look.x * 10;
        this.lookY += look.y * 8;
      }
    }

    moveX = Math.max(-1, Math.min(1, moveX));
    moveY = Math.max(-1, Math.min(1, moveY));

    let steer = 0;
    if (k.has("KeyA") || k.has("ArrowLeft")) steer += 1;
    if (k.has("KeyD") || k.has("ArrowRight")) steer -= 1;
    if (Math.abs(this.touchMoveX) > 0.12) {
      steer += this.touchMoveX > 0 ? -1 : 1;
      if (steer > 1) steer = 1;
      if (steer < -1) steer = -1;
    }
    if (this.qaSteer != null) steer = this.qaSteer;

    const jump = k.has("Space") || this.touchJump;
    const use = k.has("KeyE") || this.touchUseLatch;
    const talk = k.has("KeyF") || this.touchTalkLatch;
    const pause = k.has("Escape");

    const actions: Actions = {
      moveX,
      moveY,
      steer,
      throttle: moveY > 0.1 ? moveY : 0,
      brake: moveY < -0.1 ? -moveY : 0,
      sprint: k.has("ShiftLeft") || k.has("ShiftRight") || this.touchSprint,
      jump,
      jumpPressed: jump && !this.prevJump,
      handbrake: k.has("Space") || this.touchHandbrake,
      lookBack: k.has("KeyC") || this.touchLookBack,
      usePressed: use && !this.prevUse,
      talkPressed: talk && !this.prevTalk,
      pausePressed: pause && !this.prevPause,
      lookX: 0,
      lookY: 0,
    };
    this.prevJump = jump;
    this.prevUse = use;
    this.prevTalk = talk;
    this.prevPause = pause;
    this.touchUseLatch = false;
    this.touchTalkLatch = false;
    this.touchUse = false;
    this.touchTalk = false;
    return actions;
  }
}
