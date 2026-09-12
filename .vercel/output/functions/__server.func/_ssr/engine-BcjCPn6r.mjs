import { A as SIDEWALK, B as yawForward, C as JUMP_SPEED, D as PLAYER_RADIUS, E as MAX_FRAME_DT, F as dist2, I as lerp, L as lerpAngle, M as WALK_SPEED, N as blockBounds, O as RUN_SPEED, P as clamp, R as roadCoord, S as FIXED_DT, T as MAX_ACCUM, V as yawRight, _ as CAR_DRAG, a as NPC_PROFILES, b as CAR_TURN_RATE, c as placeById, d as CAM_H_CAR, f as CAM_H_FOOT, g as CAM_SHOULDER_FOOT, h as CAM_SHOULDER_CAR, i as MISSIONS, j as TALK_DIST, k as SHOP_DIST, l as CAM_DIST_CAR, m as CAM_LOOK_Y_FOOT, o as PLACES, p as CAM_LOOK_Y_CAR, r as useHud, s as UI, u as CAM_DIST_FOOT, v as CAR_HANDBRAKE_GRIP, w as LANE_OFFSET, x as ENTER_DIST, y as CAR_RADIUS, z as wrapAngle } from "./routes-DjjZbf5E.mjs";
import { C as TorusGeometry, S as TextureLoader, _ as PlaneGeometry, a as CircleGeometry, b as Scene, c as CylinderGeometry, d as Group, f as HemisphereLight, g as PerspectiveCamera, h as MeshStandardMaterial, i as CanvasTexture, l as DirectionalLight, m as MeshBasicMaterial, n as AmbientLight, o as ClampToEdgeWrapping, p as Mesh, r as BoxGeometry, s as ConeGeometry, t as WebGLRenderer, u as Fog, v as RepeatWrapping, w as Vector3, x as SphereGeometry, y as SRGBColorSpace } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-BcjCPn6r.js
function resolveCircleAabb(x, z, r, b) {
	const nx0 = clamp(x, b.minX, b.maxX);
	const nz0 = clamp(z, b.minZ, b.maxZ);
	let dx = x - nx0;
	let dz = z - nz0;
	const d2 = dx * dx + dz * dz;
	if (d2 > r * r && d2 > 1e-10) return {
		x,
		z,
		hit: false,
		nx: 0,
		nz: 0,
		depth: 0
	};
	if (d2 < 1e-8) {
		const left = x - b.minX + r;
		const right = b.maxX - x + r;
		const top = z - b.minZ + r;
		const bot = b.maxZ - z + r;
		const m = Math.min(left, right, top, bot);
		if (m === left) return {
			x: b.minX - r,
			z,
			hit: true,
			nx: -1,
			nz: 0,
			depth: m
		};
		if (m === right) return {
			x: b.maxX + r,
			z,
			hit: true,
			nx: 1,
			nz: 0,
			depth: m
		};
		if (m === top) return {
			x,
			z: b.minZ - r,
			hit: true,
			nx: 0,
			nz: -1,
			depth: m
		};
		return {
			x,
			z: b.maxZ + r,
			hit: true,
			nx: 0,
			nz: 1,
			depth: m
		};
	}
	const d = Math.sqrt(d2);
	const nx = dx / d;
	const nz = dz / d;
	const depth = r - d;
	return {
		x: x + nx * depth,
		z: z + nz * depth,
		hit: true,
		nx,
		nz,
		depth
	};
}
function resolveCircleList(x, z, r, list) {
	let hit = false;
	let nx = 0;
	let nz = 0;
	let depth = 0;
	for (let i = 0; i < list.length; i++) {
		const res = resolveCircleAabb(x, z, r, list[i]);
		if (res.hit) {
			x = res.x;
			z = res.z;
			hit = true;
			nx = res.nx;
			nz = res.nz;
			depth = Math.max(depth, res.depth);
		}
	}
	return {
		x,
		z,
		hit,
		nx,
		nz,
		depth
	};
}
function circlesOverlap(ax, az, ar, bx, bz, br) {
	const dx = ax - bx;
	const dz = az - bz;
	const r = ar + br;
	return dx * dx + dz * dz < r * r;
}
function separateCircles(ax, az, ar, bx, bz, br, massA = 1, massB = 1) {
	const dx = ax - bx;
	const dz = az - bz;
	let d2 = dx * dx + dz * dz;
	const min = ar + br;
	if (d2 >= min * min) return {
		ax,
		az,
		bx,
		bz,
		hit: false,
		nx: 0,
		nz: 0
	};
	const d = Math.sqrt(Math.max(d2, 1e-8));
	const nx = dx / d;
	const nz = dz / d;
	const pen = min - d;
	const inv = 1 / (massA + massB);
	return {
		ax: ax + nx * pen * massB * inv,
		az: az + nz * pen * massB * inv,
		bx: bx - nx * pen * massA * inv,
		bz: bz - nz * pen * massA * inv,
		hit: true,
		nx,
		nz
	};
}
/**
* Scripted dialogue. Swap this for an LLM-backed provider later:
*
*   engine.setDialogueProvider(new LlmDialogueProvider("/api/npc-chat"))
*
* The provider only needs to implement `getGreeting`.
*/
var ScriptedDialogueProvider = class {
	getGreeting(npc, ctx) {
		const lines = [{
			speaker: npc.name,
			text: greetByJob(npc, ctx)
		}];
		if (ctx.wantedStars >= 2) lines.push({
			speaker: npc.name,
			text: "你後面那幾輛警車……最好別在我旁邊久留。"
		});
		else if (ctx.wantedStars >= 1) lines.push({
			speaker: npc.name,
			text: "城南那邊好像在廣播通緝，最近開車小心點。"
		});
		else lines.push({
			speaker: npc.name,
			text: flavorByPersonality(npc, ctx)
		});
		return lines;
	}
};
function greetByJob(npc, ctx) {
	switch (npc.id) {
		case "chen": return ctx.inVehicle ? "嘿，同行啊？潮港這點路，熟就好開。" : "要車嗎？我剛好要收工，不過短程還是可以載。";
		case "lin": return "今天海灣風有點大，店裡沒什麼客人。你要不要進去坐一下？";
		case "wang": return "請不要擋人行道。有事去城南警察局報案。";
		case "huang": return "抱歉我趕時間。東城那棟大樓的電梯總是在整修。";
		case "chang": return "這城市晚上意外地好逛。你是外地來的？";
		case "wu": return "如果頭暈或受傷，別硬撐，先找地方坐一下。";
		case "lee": return "西港那邊的管線又爆了，我正要過去。";
		case "chou": return "中央大道的招牌字體真的有夠亂。誰准他們用三種粗細的？";
		case "hsu": return "晚上新生公園旁邊人比較多，想吃鹽酥雞就那邊找我表弟。";
		case "tsai": return "請注意交通。潮港的肇事鑑定我接過太多次了。";
		case "passenger": return "……你是來接我的嗎？東城商業區，謝謝。";
		default: return `你好，我是${npc.name}，${npc.job}。`;
	}
}
function flavorByPersonality(npc, ctx) {
	if (npc.personality.includes("急性子")) return "別磨蹭，紅燈也別一直按喇叭，這邊警察記仇。";
	if (npc.personality.includes("溫柔")) return `最近${ctx.location}氣氛還不錯，慢慢逛就好。`;
	if (npc.personality.includes("正經")) return "保持車距，禮讓行人。這不是建議，是規定。";
	if (npc.personality.includes("好奇")) return "聽說港灣停車場晚上有人飆車。我只是聽說。";
	if (npc.personality.includes("嘴毒")) return "你那走路姿勢，很像剛從遊戲教學關卡走出來。";
	return `我現在的狀態是：${npc.status}。`;
}
var GAME_CODES = /* @__PURE__ */ new Set([
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
	"Escape"
]);
function radialDeadzone(x, y, dz = .18) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0
	};
	const scale = (m - dz) / (1 - dz) / m;
	return {
		x: x * scale,
		y: y * scale
	};
}
var Input = class {
	keys = /* @__PURE__ */ new Set();
	qaKeys = null;
	qaSteer = null;
	prevJump = false;
	prevUse = false;
	prevTalk = false;
	prevPause = false;
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
	touchUseLatch = false;
	touchTalkLatch = false;
	unbind = [];
	attach(target) {
		const onDown = (e) => {
			if (GAME_CODES.has(e.code)) e.preventDefault();
			this.keys.add(e.code);
		};
		const onUp = (e) => {
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
		let pid = null;
		const onPtrDown = (e) => {
			if (e.pointerType === "touch") return;
			dragging = true;
			pid = e.pointerId;
			target.setPointerCapture(e.pointerId);
		};
		const onPtrMove = (e) => {
			if (document.pointerLockElement === target) {
				this.lookX += e.movementX;
				this.lookY += e.movementY;
				return;
			}
			if (!dragging || e.pointerId !== pid) return;
			this.lookX += e.movementX;
			this.lookY += e.movementY;
		};
		const onPtrUp = (e) => {
			if (e.pointerId === pid) {
				dragging = false;
				pid = null;
			}
		};
		target.addEventListener("pointerdown", onPtrDown);
		window.addEventListener("pointermove", onPtrMove);
		window.addEventListener("pointerup", onPtrUp);
		window.addEventListener("pointercancel", onPtrUp);
		const onWheel = (e) => {
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
	consumeLook() {
		const x = this.lookX + this.touchLookX;
		const y = this.lookY + this.touchLookY;
		this.lookX = 0;
		this.lookY = 0;
		this.touchLookX = 0;
		this.touchLookY = 0;
		return {
			x,
			y
		};
	}
	consumeWheel() {
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
	sample() {
		const k = this.qaKeys ?? this.keys;
		let moveX = this.touchMoveX;
		let moveY = this.touchMoveY;
		if (k.has("KeyA") || k.has("ArrowLeft")) moveX -= 1;
		if (k.has("KeyD") || k.has("ArrowRight")) moveX += 1;
		if (k.has("KeyW") || k.has("ArrowUp")) moveY += 1;
		if (k.has("KeyS") || k.has("ArrowDown")) moveY -= 1;
		const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
		if (pads) for (const pad of pads) {
			if (!pad || pad.mapping !== "standard") continue;
			const st = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
			moveX += st.x;
			moveY += -st.y;
			const look = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0, .12);
			this.lookX += look.x * 10;
			this.lookY += look.y * 8;
		}
		moveX = Math.max(-1, Math.min(1, moveX));
		moveY = Math.max(-1, Math.min(1, moveY));
		let steer = 0;
		if (k.has("KeyA") || k.has("ArrowLeft")) steer += 1;
		if (k.has("KeyD") || k.has("ArrowRight")) steer -= 1;
		if (Math.abs(this.touchMoveX) > .12) {
			steer += this.touchMoveX > 0 ? -1 : 1;
			if (steer > 1) steer = 1;
			if (steer < -1) steer = -1;
		}
		if (this.qaSteer != null) steer = this.qaSteer;
		const jump = k.has("Space") || this.touchJump;
		const use = k.has("KeyE") || this.touchUseLatch;
		const talk = k.has("KeyF") || this.touchTalkLatch;
		const pause = k.has("Escape");
		const actions = {
			moveX,
			moveY,
			steer,
			throttle: moveY > .1 ? moveY : 0,
			brake: moveY < -.1 ? -moveY : 0,
			sprint: k.has("ShiftLeft") || k.has("ShiftRight") || this.touchSprint,
			jump,
			jumpPressed: jump && !this.prevJump,
			handbrake: k.has("Space") || this.touchHandbrake,
			lookBack: k.has("KeyC") || this.touchLookBack,
			usePressed: use && !this.prevUse,
			talkPressed: talk && !this.prevTalk,
			pausePressed: pause && !this.prevPause,
			lookX: 0,
			lookY: 0
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
};
var texCache = /* @__PURE__ */ new Map();
function canvasTex(key, w, h, draw) {
	const hit = texCache.get(key);
	if (hit) return hit;
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	draw(c.getContext("2d"), w, h);
	const t = new CanvasTexture(c);
	t.anisotropy = 4;
	t.colorSpace = SRGBColorSpace;
	t.needsUpdate = true;
	texCache.set(key, t);
	return t;
}
function buildingTexture(base, accent, floors, seed) {
	return canvasTex(`b:${base}:${accent}:${floors}:${seed}`, 256, 512, (ctx, w, h) => {
		ctx.fillStyle = base;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = "rgba(0,0,0,0.18)";
		ctx.fillRect(0, 0, w, 18);
		const rng = mulberry$1(seed);
		const cols = 4 + Math.floor(rng() * 3);
		const rows = Math.max(4, floors);
		const padX = 18;
		const padY = 28;
		const gw = (w - 36) / cols;
		const gh = (h - 56) / rows;
		for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
			ctx.fillStyle = rng() > .28 ? accent : "rgba(12,16,22,0.85)";
			const x = padX + c * gw + 4;
			const y = padY + r * gh + 4;
			ctx.fillRect(x, y, gw - 8, gh - 10);
		}
		ctx.fillStyle = "rgba(255,255,255,0.05)";
		ctx.fillRect(0, 0, 8, h);
	});
}
function asphaltTexture() {
	return canvasTex("asphalt", 128, 128, (ctx, w, h) => {
		ctx.fillStyle = "#2a2d32";
		ctx.fillRect(0, 0, w, h);
		for (let i = 0; i < 80; i++) {
			ctx.fillStyle = `rgba(255,255,255,${.02 + Math.random() * .04})`;
			ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
		}
	});
}
function grassTexture() {
	return canvasTex("grass", 128, 128, (ctx, w, h) => {
		ctx.fillStyle = "#2f5a3a";
		ctx.fillRect(0, 0, w, h);
		for (let i = 0; i < 120; i++) {
			ctx.fillStyle = i % 2 ? "#3a6c44" : "#274e32";
			ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
		}
	});
}
function makeSign(text, bg = "#1a2430", fg = "#e8eaee") {
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
	const mat = new MeshStandardMaterial({
		map: tex,
		roughness: .55,
		metalness: .05
	});
	const mesh = new Mesh(new PlaneGeometry(6.4, 2), mat);
	mesh.castShadow = false;
	return mesh;
}
function shareMat(color, extra) {
	return new MeshStandardMaterial({
		color,
		roughness: .65,
		...extra
	});
}
function createPerson(opts) {
	const g = new Group();
	const skin = opts.skin ?? 14727320;
	const shirt = shareMat(opts.shirt, { roughness: .7 });
	const pants = shareMat(opts.pants, { roughness: .75 });
	const skinM = shareMat(skin, { roughness: .52 });
	const hairM = shareMat(opts.hair, { roughness: .82 });
	const shoeM = shareMat(1710622, { roughness: .55 });
	const eyeM = shareMat(1709072, { roughness: .4 });
	const hips = new Mesh(new BoxGeometry(.38, .18, .24), pants);
	hips.position.y = .74;
	g.add(hips);
	const torso = new Mesh(new BoxGeometry(.44, .52, .27), shirt);
	torso.position.y = 1.1;
	g.add(torso);
	const hem = new Mesh(new BoxGeometry(.46, .08, .28), shirt);
	hem.position.y = .84;
	g.add(hem);
	const neck = new Mesh(new CylinderGeometry(.06, .07, .1, 6), skinM);
	neck.position.y = 1.38;
	g.add(neck);
	const head = new Mesh(new BoxGeometry(.28, .3, .26), skinM);
	head.position.y = 1.56;
	g.add(head);
	const hair = new Mesh(new BoxGeometry(.3, .12, .28), hairM);
	hair.position.y = 1.7;
	g.add(hair);
	const bang = new Mesh(new BoxGeometry(.28, .06, .08), hairM);
	bang.position.set(0, 1.68, -.12);
	g.add(bang);
	const eyeL = new Mesh(new BoxGeometry(.05, .035, .04), eyeM);
	eyeL.position.set(-.06, 1.56, -.12);
	g.add(eyeL);
	const eyeR = eyeL.clone();
	eyeR.position.x = .06;
	g.add(eyeR);
	const leftArm = new Mesh(new BoxGeometry(.12, .5, .12), shirt);
	leftArm.position.set(-.3, 1.04, 0);
	leftArm.name = "leftArm";
	g.add(leftArm);
	const rightArm = new Mesh(new BoxGeometry(.12, .5, .12), shirt);
	rightArm.position.set(.3, 1.04, 0);
	rightArm.name = "rightArm";
	g.add(rightArm);
	const handL = new Mesh(new BoxGeometry(.1, .1, .1), skinM);
	handL.position.set(-.3, .76, 0);
	g.add(handL);
	const handR = handL.clone();
	handR.position.x = .3;
	g.add(handR);
	const leftLeg = new Mesh(new BoxGeometry(.16, .52, .16), pants);
	leftLeg.position.set(-.12, .42, 0);
	leftLeg.name = "leftLeg";
	g.add(leftLeg);
	const rightLeg = new Mesh(new BoxGeometry(.16, .52, .16), pants);
	rightLeg.position.set(.12, .42, 0);
	rightLeg.name = "rightLeg";
	g.add(rightLeg);
	const shoeL = new Mesh(new BoxGeometry(.15, .08, .24), shoeM);
	shoeL.position.set(-.12, .08, .03);
	g.add(shoeL);
	const shoeR = shoeL.clone();
	shoeR.position.x = .12;
	g.add(shoeR);
	g.traverse((o) => {
		if (o instanceof Mesh) {
			o.castShadow = true;
			o.receiveShadow = true;
		}
	});
	return g;
}
function createCar(color, kind) {
	const g = new Group();
	g.rotation.order = "YXZ";
	const bodyM = new MeshStandardMaterial({
		color,
		roughness: .34,
		metalness: .32
	});
	const dark = new MeshStandardMaterial({
		color: 1315864,
		roughness: .48,
		metalness: .22
	});
	const chrome = new MeshStandardMaterial({
		color: 11055288,
		roughness: .26,
		metalness: .72
	});
	const glass = new MeshStandardMaterial({
		color: 6983844,
		roughness: .12,
		metalness: .45,
		transparent: true,
		opacity: .48
	});
	const lightM = new MeshStandardMaterial({
		color: 16773832,
		emissive: 16769162,
		emissiveIntensity: .95
	});
	const tailM = new MeshStandardMaterial({
		color: 11149848,
		emissive: 5574664,
		emissiveIntensity: .45
	});
	const rubber = new MeshStandardMaterial({
		color: 1710622,
		roughness: .85,
		metalness: .05
	});
	const rimM = new MeshStandardMaterial({
		color: 12963028,
		roughness: .3,
		metalness: .65
	});
	const bodyH = kind === "van" ? .92 : kind === "sport" ? .4 : .5;
	const bodyL = kind === "sport" ? 4.15 : kind === "van" ? 4.7 : 4.25;
	const bodyW = kind === "sport" ? 1.92 : 1.85;
	const cabinH = kind === "van" ? .78 : .52;
	const cabinL = kind === "sport" ? 1.42 : kind === "van" ? 2.25 : 1.78;
	const chassis = new Mesh(new BoxGeometry(bodyW - .16, .16, bodyL * .9), dark);
	chassis.position.y = .26;
	g.add(chassis);
	const body = new Mesh(new BoxGeometry(bodyW, bodyH, bodyL), bodyM);
	body.position.y = .5;
	g.add(body);
	const skirt = new Mesh(new BoxGeometry(bodyW + .06, .12, bodyL * .72), dark);
	skirt.position.y = .34;
	g.add(skirt);
	const hood = new Mesh(new BoxGeometry(bodyW - .18, .07, bodyL * .28), bodyM);
	hood.position.set(0, .5 + bodyH * .5 + .02, -bodyL * .28);
	g.add(hood);
	const fBumper = new Mesh(new BoxGeometry(bodyW + .04, .22, .2), dark);
	fBumper.position.set(0, .36, -bodyL / 2 + .02);
	g.add(fBumper);
	const rBumper = new Mesh(new BoxGeometry(bodyW + .04, .22, .2), dark);
	rBumper.position.set(0, .36, bodyL / 2 - .02);
	g.add(rBumper);
	const cabin = new Mesh(new BoxGeometry(bodyW - .22, cabinH, cabinL), glass);
	cabin.position.set(0, .5 + bodyH * .55 + cabinH / 2, kind === "sport" ? .18 : .12);
	g.add(cabin);
	const roof = new Mesh(new BoxGeometry(bodyW - .32, .06, cabinL * .82), bodyM);
	roof.position.set(0, cabin.position.y + cabinH / 2, cabin.position.z);
	g.add(roof);
	const wind = new Mesh(new BoxGeometry(bodyW - .3, .4, .05), glass);
	wind.position.set(0, .92, cabin.position.z - cabinL * .42);
	wind.rotation.x = -.48;
	g.add(wind);
	const rearGlass = new Mesh(new BoxGeometry(bodyW - .34, .34, .04), glass);
	rearGlass.position.set(0, .92, cabin.position.z + cabinL * .42);
	rearGlass.rotation.x = .4;
	g.add(rearGlass);
	for (const x of [-bodyW * .52, bodyW * .52]) {
		const mirror = new Mesh(new BoxGeometry(.16, .1, .2), dark);
		mirror.position.set(x, .92, -.12);
		g.add(mirror);
		const glassM = new Mesh(new BoxGeometry(.04, .08, .14), chrome);
		glassM.position.set(x + Math.sign(x) * .08, .92, -.12);
		g.add(glassM);
	}
	const wheelZ = kind === "van" ? .34 : .32;
	for (const z of [-bodyL * .33, bodyL * .33]) for (const x of [-bodyW * .42, bodyW * .42]) {
		const wh = new Group();
		wh.name = "wheel";
		const tire = new Mesh(new CylinderGeometry(.34, .34, .24, 12), rubber);
		tire.rotation.z = Math.PI / 2;
		wh.add(tire);
		const rim = new Mesh(new CylinderGeometry(.2, .2, .26, 10), rimM);
		rim.rotation.z = Math.PI / 2;
		wh.add(rim);
		wh.position.set(x, wheelZ, z);
		g.add(wh);
	}
	const hl = new Mesh(new BoxGeometry(.32, .13, .08), lightM);
	hl.position.set(-.55, .5, -bodyL / 2 + .02);
	g.add(hl);
	const hr = hl.clone();
	hr.position.x = .55;
	g.add(hr);
	const tl = new Mesh(new BoxGeometry(.3, .1, .06), tailM);
	tl.position.set(-.58, .52, bodyL / 2 - .02);
	g.add(tl);
	const tr = tl.clone();
	tr.position.x = .58;
	g.add(tr);
	const plate = new Mesh(new BoxGeometry(.42, .14, .04), chrome);
	plate.position.set(0, .38, bodyL / 2 + .02);
	g.add(plate);
	const exhaust = new Mesh(new CylinderGeometry(.05, .05, .22, 6), chrome);
	exhaust.rotation.x = Math.PI / 2;
	exhaust.position.set(.48, .22, bodyL / 2 - .08);
	g.add(exhaust);
	if (kind === "sport") {
		const spoiler = new Mesh(new BoxGeometry(bodyW - .3, .07, .32), bodyM);
		spoiler.position.set(0, 1.08, bodyL * .38);
		g.add(spoiler);
		const stemL = new Mesh(new BoxGeometry(.06, .22, .06), dark);
		stemL.position.set(-.5, .96, bodyL * .36);
		g.add(stemL);
		const stemR = stemL.clone();
		stemR.position.x = .5;
		g.add(stemR);
	}
	if (kind === "taxi") {
		const lamp = new Mesh(new BoxGeometry(.52, .16, .3), new MeshStandardMaterial({
			color: 15913290,
			emissive: 11044880,
			emissiveIntensity: .45
		}));
		lamp.position.set(0, 1.28, 0);
		g.add(lamp);
	}
	if (kind === "police") {
		const bar = new Mesh(new BoxGeometry(.78, .14, .3), new MeshStandardMaterial({
			color: 1118481,
			roughness: .4
		}));
		bar.position.set(0, 1.24, .08);
		g.add(bar);
		const red = new Mesh(new BoxGeometry(.3, .12, .24), new MeshStandardMaterial({
			color: 16722474,
			emissive: 16720418,
			emissiveIntensity: 1.2
		}));
		red.position.set(-.2, 1.34, .08);
		red.name = "copRed";
		g.add(red);
		const blu = new Mesh(new BoxGeometry(.3, .12, .24), new MeshStandardMaterial({
			color: 2254591,
			emissive: 2254591,
			emissiveIntensity: 1.2
		}));
		blu.position.set(.2, 1.34, .08);
		blu.name = "copBlue";
		g.add(blu);
		const stripe = new Mesh(new BoxGeometry(bodyW + .04, .12, 2.3), new MeshStandardMaterial({ color: 2775768 }));
		stripe.position.set(0, .62, 0);
		g.add(stripe);
	}
	g.traverse((o) => {
		if (o instanceof Mesh) {
			o.castShadow = true;
			o.receiveShadow = true;
		}
	});
	return g;
}
function createTree() {
	const g = new Group();
	const trunk = new Mesh(new CylinderGeometry(.16, .24, 1.5, 6), new MeshStandardMaterial({
		color: 5913124,
		roughness: .9
	}));
	trunk.position.y = .75;
	g.add(trunk);
	const leafM = new MeshStandardMaterial({
		color: 3111496,
		roughness: .78
	});
	const leaf = new Mesh(new ConeGeometry(1.2, 2, 8), leafM);
	leaf.position.y = 2.15;
	g.add(leaf);
	const leaf2 = new Mesh(new ConeGeometry(.85, 1.4, 8), leafM);
	leaf2.position.y = 2.85;
	g.add(leaf2);
	g.traverse((o) => {
		if (o instanceof Mesh) {
			o.castShadow = true;
			o.receiveShadow = true;
		}
	});
	return g;
}
function createLamp() {
	const g = new Group();
	const poleM = new MeshStandardMaterial({
		color: 2764856,
		roughness: .45,
		metalness: .4
	});
	const pole = new Mesh(new CylinderGeometry(.08, .1, 5.2, 6), poleM);
	pole.position.y = 2.6;
	g.add(pole);
	const arm = new Mesh(new BoxGeometry(.1, .08, 1.1), poleM);
	arm.position.set(0, 5.1, -.4);
	g.add(arm);
	const bulb = new Mesh(new SphereGeometry(.16, 8, 8), new MeshStandardMaterial({
		color: 16770728,
		emissive: 16762986,
		emissiveIntensity: 1.4
	}));
	bulb.position.set(0, 5, -.9);
	g.add(bulb);
	const shade = new Mesh(new CylinderGeometry(.22, .28, .12, 8), new MeshStandardMaterial({
		color: 2764856,
		roughness: .5
	}));
	shade.position.set(0, 5.12, -.9);
	g.add(shade);
	return g;
}
function createTrafficLight() {
	const g = new Group();
	const pole = new Mesh(new CylinderGeometry(.08, .09, 4.2, 6), new MeshStandardMaterial({
		color: 2237996,
		roughness: .5,
		metalness: .35
	}));
	pole.position.y = 2.1;
	g.add(pole);
	const box = new Mesh(new BoxGeometry(.28, .82, .22), new MeshStandardMaterial({ color: 1447964 }));
	box.position.y = 4.15;
	g.add(box);
	const mk = (y, color, name) => {
		const m = new Mesh(new CircleGeometry(.08, 10), new MeshStandardMaterial({
			color,
			emissive: color,
			emissiveIntensity: .2
		}));
		m.position.set(0, y, .12);
		m.name = name;
		g.add(m);
	};
	mk(4.4, 16724787, "tlRed");
	mk(4.15, 16763955, "tlYellow");
	mk(3.9, 3399014, "tlGreen");
	return g;
}
function createHydrant() {
	const g = new Group();
	const red = new MeshStandardMaterial({
		color: 11811378,
		roughness: .45,
		metalness: .2
	});
	const body = new Mesh(new CylinderGeometry(.14, .16, .55, 8), red);
	body.position.y = .32;
	g.add(body);
	const cap = new Mesh(new CylinderGeometry(.1, .12, .1, 8), red);
	cap.position.y = .64;
	g.add(cap);
	const side = new Mesh(new CylinderGeometry(.05, .05, .22, 6), red);
	side.rotation.z = Math.PI / 2;
	side.position.set(0, .42, 0);
	g.add(side);
	return g;
}
function createDumpster() {
	const g = new Group();
	const body = new Mesh(new BoxGeometry(1.6, 1.1, .9), new MeshStandardMaterial({
		color: 4024904,
		roughness: .7,
		metalness: .15
	}));
	body.position.y = .55;
	body.castShadow = true;
	g.add(body);
	const lid = new Mesh(new BoxGeometry(1.64, .08, .94), new MeshStandardMaterial({
		color: 2903606,
		roughness: .65
	}));
	lid.position.y = 1.14;
	g.add(lid);
	return g;
}
function markerMesh(color = 6210232) {
	const g = new Group();
	const ring = new Mesh(new TorusGeometry(1.6, .08, 8, 24), new MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: .7,
		transparent: true,
		opacity: .9
	}));
	ring.rotation.x = Math.PI / 2;
	ring.position.y = .15;
	g.add(ring);
	const beam = new Mesh(new CylinderGeometry(.08, .08, 8, 8), new MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: .55,
		transparent: true,
		opacity: .35
	}));
	beam.position.y = 4;
	g.add(beam);
	return g;
}
function disposeTexCache() {
	for (const t of texCache.values()) t.dispose();
	texCache.clear();
}
function mulberry$1(seed) {
	let s = seed | 0;
	return () => {
		s = s + 1831565813 | 0;
		let t = Math.imul(s ^ s >>> 15, 1 | s);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function loadTex(url, tile) {
	return new Promise((resolve, reject) => {
		const loader = new TextureLoader();
		loader.setCrossOrigin("anonymous");
		loader.load(url, (t) => {
			t.colorSpace = SRGBColorSpace;
			t.anisotropy = 8;
			t.wrapS = t.wrapT = tile ? RepeatWrapping : ClampToEdgeWrapping;
			t.repeat.set(1, 1);
			t.needsUpdate = true;
			resolve(t);
		}, void 0, () => reject(new Error(url)));
	});
}
async function loadWorldTextures() {
	try {
		const [glass, apt, street, industrial, civic, asphalt, sidewalk, grass, roof, sky] = await Promise.all([
			loadTex("/textures/facade-glass.jpg", false),
			loadTex("/textures/facade-apt.jpg", true),
			loadTex("/textures/facade-street.jpg", true),
			loadTex("/textures/facade-industrial.jpg", true),
			loadTex("/textures/facade-civic.jpg", false),
			loadTex("/textures/asphalt.jpg", true),
			loadTex("/textures/sidewalk.jpg", true),
			loadTex("/textures/grass.jpg", true),
			loadTex("/textures/roof.jpg", true),
			loadTex("/textures/sky.jpg", false)
		]);
		return {
			glass,
			apt,
			street,
			industrial,
			civic,
			asphalt,
			sidewalk,
			grass,
			roof,
			sky
		};
	} catch {
		return null;
	}
}
function disposeWorldTextures(tex) {
	if (!tex) return;
	for (const t of Object.values(tex)) t.dispose();
}
function tileBoxUVs(geo, sx, sy, sz, tile) {
	const uv = geo.attributes.uv;
	if (!uv) return;
	const faces = [
		[sz / tile, sy / tile],
		[sz / tile, sy / tile],
		[sx / tile, sz / tile],
		[sx / tile, sz / tile],
		[sx / tile, sy / tile],
		[sx / tile, sy / tile]
	];
	for (let f = 0; f < 6; f++) {
		const [su, sv] = faces[f];
		for (let i = 0; i < 4; i++) {
			const idx = f * 4 + i;
			uv.setXY(idx, uv.getX(idx) * su, uv.getY(idx) * sv);
		}
	}
	uv.needsUpdate = true;
}
function scaleFacadeUVs(geo, w, h, d) {
	const uv = geo.attributes.uv;
	if (!uv) return;
	const su = (len) => len > 18 ? 2 : 1;
	const sv = h > 22 ? 2 : 1;
	const roofU = Math.max(1.2, w / 9);
	const roofV = Math.max(1.2, d / 9);
	const scales = [
		[su(d), sv],
		[su(d), sv],
		[roofU, roofV],
		[roofU, roofV],
		[su(w), sv],
		[su(w), sv]
	];
	for (let f = 0; f < 6; f++) {
		const [u, v] = scales[f];
		for (let i = 0; i < 4; i++) {
			const idx = f * 4 + i;
			uv.setXY(idx, uv.getX(idx) * u, uv.getY(idx) * v);
		}
	}
	uv.needsUpdate = true;
}
function tilePlaneUVs(geo, worldU, worldV, tile) {
	const uv = geo.attributes.uv;
	if (!uv) return;
	const su = worldU / tile;
	const sv = worldV / tile;
	for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
	uv.needsUpdate = true;
}
var BUILDING_MATS = [
	{
		base: "#8a9098",
		accent: "#d7e6c8",
		hex: 9080984
	},
	{
		base: "#6e7884",
		accent: "#b7d6e4",
		hex: 7239812
	},
	{
		base: "#9a8f84",
		accent: "#efe4c8",
		hex: 10129284
	},
	{
		base: "#5c6a72",
		accent: "#9fd0d4",
		hex: 6056562
	},
	{
		base: "#7a7068",
		accent: "#eadcc0",
		hex: 8024168
	},
	{
		base: "#4f5d68",
		accent: "#89c4d2",
		hex: 5201256
	}
];
function mulberry(seed) {
	let s = seed | 0;
	return () => {
		s = s + 1831565813 | 0;
		let t = Math.imul(s ^ s >>> 15, 1 | s);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function makeMats(tex) {
	const photo = !!tex;
	const tint = photo ? 16777215 : 10133156;
	const asphalt = new MeshStandardMaterial({
		map: tex?.asphalt ?? asphaltTexture(),
		roughness: .95,
		metalness: .02,
		color: tint
	});
	const sidewalk = new MeshStandardMaterial({
		map: tex?.sidewalk ?? void 0,
		color: photo ? 16777215 : 12040380,
		roughness: .9
	});
	const grass = new MeshStandardMaterial({
		map: tex?.grass ?? grassTexture(),
		roughness: .95,
		color: photo ? 16777215 : 9087610
	});
	const roof = new MeshStandardMaterial({
		map: tex?.roof ?? void 0,
		color: photo ? 16777215 : 3817544,
		roughness: .68
	});
	const facades = {
		glass: new MeshStandardMaterial({
			map: tex?.glass ?? void 0,
			color: photo ? 16777215 : 9085104,
			roughness: .38,
			metalness: .28
		}),
		apt: new MeshStandardMaterial({
			map: tex?.apt ?? void 0,
			color: photo ? 16777215 : 10129284,
			roughness: .62,
			metalness: .06
		}),
		street: new MeshStandardMaterial({
			map: tex?.street ?? void 0,
			color: photo ? 16777215 : 9080984,
			roughness: .58,
			metalness: .08
		}),
		industrial: new MeshStandardMaterial({
			map: tex?.industrial ?? void 0,
			color: photo ? 16777215 : 8024168,
			roughness: .7,
			metalness: .12
		}),
		civic: new MeshStandardMaterial({
			map: tex?.civic ?? void 0,
			color: photo ? 16777215 : 14212322,
			roughness: .5,
			metalness: .1
		})
	};
	return {
		asphalt,
		sidewalk,
		grass,
		roof,
		plinth: new MeshStandardMaterial({
			color: 4869716,
			roughness: .88
		}),
		curb: new MeshStandardMaterial({
			color: 9343126,
			roughness: .85
		}),
		ac: new MeshStandardMaterial({
			color: 6976120,
			roughness: .45,
			metalness: .35
		}),
		facades,
		photo
	};
}
function buildCity(scene, tex = null) {
	const group = new Group();
	group.name = "city";
	const colliders = [];
	const treeColliders = [];
	const parkedSpots = [];
	const npcLoops = [];
	const policeSpawn = [];
	const mats = makeMats(tex);
	const groundGeo = new PlaneGeometry(322, 332);
	tilePlaneUVs(groundGeo, 322, 332, 12);
	const ground = new Mesh(groundGeo, mats.grass);
	ground.rotation.x = -Math.PI / 2;
	ground.position.set(0, -.02, -8);
	ground.receiveShadow = true;
	group.add(ground);
	const water = new Mesh(new PlaneGeometry(342, 48), new MeshStandardMaterial({
		color: 1722968,
		roughness: .22,
		metalness: .35,
		transparent: true,
		opacity: .92
	}));
	water.rotation.x = -Math.PI / 2;
	water.position.set(0, -.08, -143);
	group.add(water);
	const seawall = new Mesh(new BoxGeometry(262, 1.4, 1.2), mats.curb);
	seawall.position.set(0, .5, -122.2);
	group.add(seawall);
	colliders.push({
		minX: -131,
		maxX: 131,
		minZ: -123.2,
		maxZ: -121.2
	});
	const lineM = new MeshStandardMaterial({
		color: 14206314,
		emissive: 3814416,
		roughness: .6
	});
	const zebraM = new MeshStandardMaterial({
		color: 15264494,
		roughness: .7
	});
	const aw = ASPHALT_W();
	for (let i = 0; i <= 5; i++) {
		const x = roadCoord(i);
		const roadGeo = new BoxGeometry(aw, .04, 242);
		tileBoxUVs(roadGeo, aw, .04, 242, 8);
		const road = new Mesh(roadGeo, mats.asphalt);
		road.position.set(x, .01, 0);
		road.receiveShadow = true;
		group.add(road);
		for (const side of [-1, 1]) {
			const swGeo = new BoxGeometry(SIDEWALK, .08, 242);
			tileBoxUVs(swGeo, SIDEWALK, .08, 242, 4);
			const sw = new Mesh(swGeo, mats.sidewalk);
			sw.position.set(x + side * (aw / 2 + SIDEWALK / 2), .04, 0);
			sw.receiveShadow = true;
			group.add(sw);
		}
		for (let s = -115; s < 121; s += 8) {
			const dash = new Mesh(new BoxGeometry(.12, .03, 3.2), lineM);
			dash.position.set(x, .04, s);
			group.add(dash);
		}
	}
	for (let j = 0; j <= 5; j++) {
		const z = roadCoord(j);
		const roadGeo = new BoxGeometry(242, .05, aw);
		tileBoxUVs(roadGeo, 242, .05, aw, 8);
		const road = new Mesh(roadGeo, mats.asphalt);
		road.position.set(0, .015, z);
		road.receiveShadow = true;
		group.add(road);
		for (const side of [-1, 1]) {
			const swGeo = new BoxGeometry(242, .09, SIDEWALK);
			tileBoxUVs(swGeo, 242, .09, SIDEWALK, 4);
			const sw = new Mesh(swGeo, mats.sidewalk);
			sw.position.set(0, .045, z + side * (aw / 2 + SIDEWALK / 2));
			sw.receiveShadow = true;
			group.add(sw);
		}
	}
	const park = {
		i: 1,
		j: 1
	};
	const station = {
		i: 2,
		j: 2
	};
	const police = {
		i: 2,
		j: 4
	};
	const parking = {
		i: 4,
		j: 3
	};
	const shopBlock = {
		i: 4,
		j: 2
	};
	for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
		const b = blockBounds(i, j);
		const loop = [
			{
				x: b.minX - 1.1,
				z: b.minZ - 1.1
			},
			{
				x: b.maxX + 1.1,
				z: b.minZ - 1.1
			},
			{
				x: b.maxX + 1.1,
				z: b.maxZ + 1.1
			},
			{
				x: b.minX - 1.1,
				z: b.maxZ + 1.1
			}
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
	for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) {
		if (i < 5) {
			const x = (roadCoord(i) + roadCoord(i + 1)) / 2;
			const z = roadCoord(j);
			addLamp(group, x, z - aw / 2 - .6, Math.PI);
			addLamp(group, x, z + aw / 2 + .6, 0);
		}
		if (j < 5 && (i + j) % 2 === 0) {
			const z = (roadCoord(j) + roadCoord(j + 1)) / 2;
			addLamp(group, roadCoord(i) - aw / 2 - .6, z, Math.PI / 2);
		}
	}
	for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) {
		if ((i + j) % 2 !== 0) continue;
		const tl = createTrafficLight();
		tl.position.set(roadCoord(i) + 3.4, 0, roadCoord(j) + 3.4);
		group.add(tl);
		addCrosswalk(group, roadCoord(i), roadCoord(j), zebraM);
	}
	addStreetProps(group, colliders);
	if (tex?.sky) {
		const skyMat = new MeshBasicMaterial({
			map: tex.sky,
			side: 1,
			fog: false,
			depthWrite: false
		});
		const sky = new Mesh(new SphereGeometry(210, 32, 16), skyMat);
		sky.renderOrder = -10;
		sky.frustumCulled = false;
		group.add(sky);
	}
	addCurbParked(parkedSpots);
	const hero = {
		x: roadCoord(3) + 3.6,
		z: 18,
		yaw: 0,
		color: 3065014,
		kind: "sport"
	};
	parkedSpots.unshift(hero);
	const nodes = [];
	for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) nodes.push({
		i,
		j,
		x: roadCoord(i),
		z: roadCoord(j)
	});
	const ave = makeSign("中央大道");
	ave.position.set(roadCoord(3) + 6.5, 3.4, 4);
	ave.rotation.y = -Math.PI / 2;
	group.add(ave);
	const baySign = makeSign("海灣區", "#16323c");
	baySign.position.set(0, 3.4, -113);
	group.add(baySign);
	const east = makeSign("東城商業區", "#1c3040");
	east.position.set(blockBounds(4, 2).cx, 3.4, blockBounds(4, 2).minZ - 1.5);
	group.add(east);
	const west = makeSign("西港工業區", "#3a3024");
	west.position.set(blockBounds(0, 2).cx, 3.4, blockBounds(0, 2).minZ - 1.5);
	group.add(west);
	colliders.push({
		minX: -129,
		maxX: 129,
		minZ: -161,
		maxZ: -123
	}, {
		minX: -129,
		maxX: 129,
		minZ: 123,
		maxZ: 129
	}, {
		minX: -129,
		maxX: -122,
		minZ: -161,
		maxZ: 129
	}, {
		minX: 122,
		maxX: 129,
		minZ: -161,
		maxZ: 129
	});
	scene.add(group);
	const shopPlace = PLACES.find((p) => p.id === "shop");
	return {
		group,
		colliders,
		treeColliders,
		parkedSpots,
		npcLoops,
		nodes,
		spawn: {
			x: hero.x - 5.5,
			z: hero.z + 1.2,
			yaw: Math.PI / 2
		},
		shop: {
			x: shopPlace.x,
			z: shopPlace.z
		},
		policeSpawn,
		waterZ: -129,
		places: PLACES
	};
}
function ASPHALT_W() {
	return 12 - SIDEWALK * 2;
}
function addLamp(group, x, z, rot) {
	const lamp = createLamp();
	lamp.position.set(x, 0, z);
	lamp.rotation.y = rot;
	group.add(lamp);
}
function addCrosswalk(group, x, z, mat) {
	const aw = ASPHALT_W();
	for (const dir of [0, 1]) for (const sign of [-1, 1]) for (let i = 0; i < 5; i++) {
		const stripe = new Mesh(dir === 0 ? new BoxGeometry(.42, .035, 2.6) : new BoxGeometry(2.6, .035, .42), mat);
		const off = (i - 2) * .7;
		if (dir === 0) stripe.position.set(x + sign * (aw / 2 + .2), .045, z + off);
		else stripe.position.set(x + off, .045, z + sign * (aw / 2 + .2));
		group.add(stripe);
	}
}
function addStreetProps(group, colliders) {
	const hydrants = [
		[roadCoord(3) + 5.2, 12],
		[roadCoord(2) + 5.2, -16],
		[roadCoord(4) - 5.2, 22],
		[18, roadCoord(2) + 5.2],
		[-24, roadCoord(3) - 5.2]
	];
	for (const [x, z] of hydrants) {
		const h = createHydrant();
		h.position.set(x, 0, z);
		group.add(h);
	}
	const dumps = [
		[
			blockBounds(0, 2).cx + 12,
			blockBounds(0, 2).cz + 10,
			0
		],
		[
			blockBounds(0, 3).cx + 10,
			blockBounds(0, 3).cz - 8,
			Math.PI / 2
		],
		[
			blockBounds(4, 1).cx - 10,
			blockBounds(4, 1).cz + 10,
			.3
		]
	];
	for (const [x, z, yaw] of dumps) {
		const d = createDumpster();
		d.position.set(x, 0, z);
		d.rotation.y = yaw;
		group.add(d);
		colliders.push({
			minX: x - .9,
			maxX: x + .9,
			minZ: z - .6,
			maxZ: z + .6
		});
	}
}
function addBuilding(group, colliders, x, z, w, d, h, seed, mats, kind) {
	const geo = new BoxGeometry(w, h, d);
	let mat;
	if (mats.photo) {
		scaleFacadeUVs(geo, w, h, d);
		const face = mats.facades[kind];
		mat = [
			face,
			face,
			mats.roof,
			mats.plinth,
			face,
			face
		];
	} else {
		const pal = BUILDING_MATS[seed % BUILDING_MATS.length];
		const floors = Math.max(3, Math.round(h / 3.2));
		const tex = buildingTexture(pal.base, pal.accent, floors, seed);
		mat = new MeshStandardMaterial({
			map: tex,
			roughness: .62,
			metalness: .08,
			color: 14343392
		});
	}
	const mesh = new Mesh(geo, mat);
	mesh.position.set(x, h / 2, z);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	group.add(mesh);
	const plinth = new Mesh(new BoxGeometry(w + .28, .82, d + .28), mats.plinth);
	plinth.position.set(x, .4, z);
	plinth.castShadow = true;
	group.add(plinth);
	const ledge = new Mesh(new BoxGeometry(w + .38, .14, d + .38), mats.plinth);
	ledge.position.set(x, h - .18, z);
	group.add(ledge);
	const roof = new Mesh(new BoxGeometry(w + .3, .25, d + .3), mats.roof);
	roof.position.set(x, h + .1, z);
	group.add(roof);
	const rng = mulberry(seed + 91);
	const acCount = 1 + Math.floor(rng() * 3);
	for (let i = 0; i < acCount; i++) {
		const aw = 1.1 + rng() * .6;
		const ad = .85 + rng() * .4;
		const ah = .55 + rng() * .25;
		const ac = new Mesh(new BoxGeometry(aw, ah, ad), mats.ac);
		ac.position.set(x + (rng() - .5) * (w * .55), h + .35 + ah / 2, z + (rng() - .5) * (d * .55));
		ac.castShadow = true;
		group.add(ac);
	}
	if (h > 14) {
		const ant = new Mesh(new CylinderGeometry(.05, .07, 2.4, 6), new MeshStandardMaterial({
			color: 9080984,
			metalness: .5,
			roughness: .4
		}));
		ant.position.set(x + w * .2, h + 1.4, z - d * .15);
		group.add(ant);
	}
	const pad = .15;
	colliders.push({
		minX: x - w / 2 - pad,
		maxX: x + w / 2 + pad,
		minZ: z - d / 2 - pad,
		maxZ: z + d / 2 + pad
	});
}
function fillGeneric(group, b, colliders, mats, seed, commercial) {
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
	for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
		const h = commercial ? 14 + rng() * 16 : 8 + rng() * 12;
		const kind = commercial ? rng() > .42 ? "glass" : "street" : rng() > .45 ? "apt" : "street";
		addBuilding(group, colliders, ox + bw * c + bw / 2 + (c === 1 ? gap : 0), oz + bd * r + bd / 2 + (r === 1 ? gap : 0), bw * (.86 + rng() * .1), bd * (.86 + rng() * .1), h, seed + c * 10 + r, mats, kind);
	}
}
function fillIndustrial(group, b, colliders, mats, seed) {
	const rng = mulberry(seed);
	addBuilding(group, colliders, b.cx - 7, b.cz, 14, 22, 8 + rng() * 4, seed, mats, "industrial");
	addBuilding(group, colliders, b.cx + 8, b.cz - 4, 12, 16, 6 + rng() * 3, seed + 3, mats, "industrial");
	const tank = new Mesh(new CylinderGeometry(2.4, 2.4, 5, 10), new MeshStandardMaterial({
		color: 9075304,
		roughness: .55,
		metalness: .3
	}));
	tank.position.set(b.cx + 8, 2.5, b.cz + 10);
	tank.castShadow = true;
	group.add(tank);
	colliders.push({
		minX: tank.position.x - 2.6,
		maxX: tank.position.x + 2.6,
		minZ: tank.position.z - 2.6,
		maxZ: tank.position.z + 2.6
	});
}
function fillBay(group, b, colliders, mats, seed) {
	addBuilding(group, colliders, b.cx, b.cz + 4, 22, 16, 11, seed, mats, "glass");
	addBuilding(group, colliders, b.cx - 8, b.cz - 8, 10, 10, 7, seed + 2, mats, "street");
}
function fillPark(group, b, grassM, trees) {
	const pad = new Mesh(new BoxGeometry(b.maxX - b.minX - 1, .08, b.maxZ - b.minZ - 1), grassM);
	pad.position.set(b.cx, .04, b.cz);
	pad.receiveShadow = true;
	group.add(pad);
	const path = new Mesh(new BoxGeometry(3.2, .1, b.maxZ - b.minZ - 2), new MeshStandardMaterial({
		color: 12761252,
		roughness: .9
	}));
	path.position.set(b.cx, .06, b.cz);
	group.add(path);
	const positions = [
		[b.cx - 8, b.cz - 8],
		[b.cx + 8, b.cz - 7],
		[b.cx - 9, b.cz + 6],
		[b.cx + 7, b.cz + 8],
		[b.cx - 4, b.cz + 10],
		[b.cx + 10, b.cz],
		[b.cx - 11, b.cz],
		[b.cx + 3, b.cz - 10]
	];
	for (const [x, z] of positions) {
		const t = createTree();
		t.position.set(x, 0, z);
		group.add(t);
		trees.push({
			x,
			z,
			r: .7
		});
	}
	const benchM = new MeshStandardMaterial({
		color: 5916212,
		roughness: .8
	});
	for (const z of [b.cz - 4, b.cz + 4]) {
		const bench = new Mesh(new BoxGeometry(2.2, .4, .5), benchM);
		bench.position.set(b.cx + 3.2, .3, z);
		group.add(bench);
	}
}
function fillParking(group, b, asphalt, spots) {
	const lot = new Mesh(new BoxGeometry(b.maxX - b.minX - 1.2, .06, b.maxZ - b.minZ - 1.2), asphalt);
	lot.position.set(b.cx, .03, b.cz);
	lot.receiveShadow = true;
	group.add(lot);
	const stall = new MeshStandardMaterial({
		color: 13685978,
		roughness: .7
	});
	const colors = [
		12868682,
		3829416,
		14210254,
		4869718,
		6987882,
		13148746
	];
	let n = 0;
	for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
		const x = b.minX + 6 + col * 8;
		const z = b.minZ + 6 + row * 8;
		const line = new Mesh(new BoxGeometry(2.4, .04, 4.6), stall);
		line.position.set(x, .06, z);
		group.add(line);
		if (n < 6) {
			spots.push({
				x,
				z,
				yaw: 0,
				color: colors[n % colors.length],
				kind: n === 2 ? "taxi" : n === 4 ? "van" : "civilian"
			});
			n++;
		}
	}
}
function fillStation(group, b, colliders, mats) {
	addBuilding(group, colliders, b.cx, b.cz + 2, 26, 14, 10, 90, mats, "civic");
	const canopy = new Mesh(new BoxGeometry(20, .35, 8), new MeshStandardMaterial({
		color: 12963288,
		metalness: .35,
		roughness: .4
	}));
	canopy.position.set(b.cx, 5.2, b.minZ + 6);
	group.add(canopy);
	for (const x of [
		b.cx - 8,
		b.cx,
		b.cx + 8
	]) {
		const col = new Mesh(new CylinderGeometry(.22, .22, 5.2, 8), new MeshStandardMaterial({
			color: 8950428,
			metalness: .4,
			roughness: .4
		}));
		col.position.set(x, 2.6, b.minZ + 6);
		group.add(col);
	}
	const sign = makeSign("中央車站", "#1a2838", "#5ec2b8");
	sign.position.set(b.cx, 7.4, b.minZ + 1.6);
	group.add(sign);
}
function fillPolice(group, b, colliders, policeSpawn, mats) {
	const w = 22;
	const d = 16;
	addBuilding(group, colliders, b.cx, b.cz - 2, w, d, 12, 7, mats, "civic");
	const stripe = new Mesh(new BoxGeometry(22.2, 1.1, .2), new MeshStandardMaterial({
		color: 2775768,
		emissive: 1059456,
		emissiveIntensity: .3
	}));
	stripe.position.set(b.cx, 6, b.cz - 2 - d / 2);
	group.add(stripe);
	const sign = makeSign("城南警察局", "#102038", "#dce6f2");
	sign.position.set(b.cx, 8.2, b.cz - 2 - d / 2 - .2);
	group.add(sign);
	policeSpawn.push({
		x: b.cx - 6,
		z: b.maxZ - 4,
		yaw: Math.PI
	}, {
		x: b.cx,
		z: b.maxZ - 4,
		yaw: Math.PI
	}, {
		x: b.cx + 6,
		z: b.maxZ - 4,
		yaw: Math.PI
	}, {
		x: b.minX + 4,
		z: b.cz + 10,
		yaw: Math.PI / 2
	});
}
function fillCommercial(group, b, colliders, mats, withShop) {
	addBuilding(group, colliders, b.cx - 7, b.cz + 4, 14, 18, 22, 44, mats, "glass");
	addBuilding(group, colliders, b.cx + 8, b.cz + 6, 12, 14, 18, 45, mats, "street");
	if (withShop) {
		addBuilding(group, colliders, b.cx + 6, b.minZ + 6, 10, 8, 6, 12, mats, "street");
		const sign = makeSign("東城便利商店", "#c4584a", "#fff6e8");
		sign.position.set(b.cx + 6, 6.6, b.minZ + 2.1);
		group.add(sign);
	}
}
function addCurbParked(spots) {
	const colors = [
		11580602,
		4025512,
		12732986,
		15262940,
		5934946,
		2764342,
		13672528
	];
	[
		{
			x: roadCoord(2) + 3.6,
			z: -22,
			yaw: 0
		},
		{
			x: roadCoord(2) + 3.6,
			z: -8,
			yaw: 0
		},
		{
			x: roadCoord(4) - 3.6,
			z: 10,
			yaw: Math.PI
		},
		{
			x: roadCoord(1) + 3.6,
			z: 40,
			yaw: 0
		},
		{
			x: 20,
			z: roadCoord(3) + 3.6,
			yaw: Math.PI / 2
		},
		{
			x: -30,
			z: roadCoord(1) - 3.6,
			yaw: -Math.PI / 2
		},
		{
			x: roadCoord(0) + 3.6,
			z: 8,
			yaw: 0
		},
		{
			x: blockBounds(3, 0).cx,
			z: roadCoord(0) + 3.6,
			yaw: Math.PI / 2
		}
	].forEach((c, i) => {
		spots.push({
			...c,
			color: colors[i % colors.length],
			kind: i === 1 ? "taxi" : i === 5 ? "van" : "civilian"
		});
	});
}
var SENS = .0026;
var GameEngine = class GameEngine {
	renderer;
	scene = new Scene();
	camera = new PerspectiveCamera(60, 1, .1, 280);
	input = new Input();
	city;
	player;
	playerMesh;
	cars = [];
	npcs = [];
	npcMeshes = [];
	wanted = {
		stars: 0,
		lastCrime: -99,
		lastSeen: -99,
		searching: false,
		notifiedSearch: false
	};
	mission;
	marker;
	dialogue = new ScriptedDialogueProvider();
	camYaw = 0;
	camPitch = .22;
	lookYaw = 0;
	camDistMul = 1;
	lookIdle = 0;
	lookBackBlend = 0;
	mouseLook = false;
	tex = null;
	camLook = new Vector3();
	lookTarget = new Vector3();
	phase = "menu";
	time = 0;
	acc = 0;
	lastNow = 0;
	raf = 0;
	running = false;
	notifyText = null;
	notifyT = 0;
	tutorialI = 0;
	tutorialT = 6;
	missionComplete = null;
	missionCompleteT = 0;
	dialogueUi = null;
	shopOpen = false;
	frames = 0;
	fpsT = 0;
	fps = 0;
	sun;
	minimap = null;
	nextCarId = 1;
	crashShake = 0;
	disposed = false;
	canvas;
	passengerCarried = false;
	hudDirty = true;
	lastHudJson = "";
	attractA = .6;
	camSnap = false;
	resizeObs = null;
	audio = null;
	static async create(canvas) {
		const tex = await loadWorldTextures();
		return new GameEngine(canvas, tex);
	}
	constructor(canvas, tex = null) {
		this.canvas = canvas;
		this.tex = tex;
		this.renderer = new WebGLRenderer({
			canvas,
			antialias: false,
			alpha: false,
			powerPreference: "high-performance"
		});
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
		this.renderer.setClearColor(7175304, 1);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = 2;
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.camera.far = 360;
		this.camera.updateProjectionMatrix();
		this.scene.fog = new Fog(7175304, 48, 175);
		const hemi = new HemisphereLight(13945016, 3291184, .95);
		this.scene.add(hemi);
		const amb = new AmbientLight(4871264, .72);
		this.scene.add(amb);
		this.sun = new DirectionalLight(16771280, 1.4);
		this.sun.position.set(40, 62, 28);
		this.sun.castShadow = true;
		this.sun.shadow.mapSize.set(1024, 1024);
		this.sun.shadow.camera.near = 4;
		this.sun.shadow.camera.far = 140;
		this.sun.shadow.camera.left = -42;
		this.sun.shadow.camera.right = 42;
		this.sun.shadow.camera.top = 42;
		this.sun.shadow.camera.bottom = -42;
		this.sun.shadow.bias = -7e-4;
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
			money: 2500
		};
		this.camYaw = this.player.yaw;
		this.playerMesh = createPerson({
			shirt: 2779750,
			pants: 1844272,
			hair: 1708558
		});
		this.scene.add(this.playerMesh);
		this.spawnParked();
		this.spawnTraffic();
		this.spawnPolice();
		this.spawnNpcs();
		this.mission = {
			id: MISSIONS[0].id,
			step: 0,
			complete: false,
			marker: null,
			passengerId: null
		};
		this.marker = markerMesh(6210232);
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
	onCanvasClick = () => {
		if (this.phase === "playing") this.tryPointerLock();
	};
	setDialogueProvider(p) {
		this.dialogue = p;
	}
	attachMinimap(c) {
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
			if (o instanceof Mesh) {
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
	shopBuy(item) {
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
	touchJump(v) {
		this.input.touchJump = v;
	}
	touchSprint(v) {
		this.input.touchSprint = v;
	}
	setTouchMove(x, y) {
		this.input.touchMoveX = x;
		this.input.touchMoveY = y;
	}
	addTouchLook(x, y) {
		this.input.touchLookX += x;
		this.input.touchLookY += y;
	}
	touchUse() {
		this.input.latchTouchUse();
	}
	touchTalk() {
		this.input.latchTouchTalk();
	}
	touchHandbrake(v) {
		this.input.touchHandbrake = v;
	}
	touchLookBack(v) {
		this.input.touchLookBack = v;
	}
	tryPointerLock() {
		this.canvas.requestPointerLock?.();
	}
	unlockAudio() {
		if (this.audio) return;
		try {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			this.audio = new Ctx();
		} catch {
			this.audio = null;
		}
	}
	beep(freq, dur = .12, gain = .05) {
		if (!this.audio) return;
		const t = this.audio.currentTime;
		const o = this.audio.createOscillator();
		const g = this.audio.createGain();
		o.type = "square";
		o.frequency.value = freq;
		g.gain.setValueAtTime(gain, t);
		g.gain.exponentialRampToValueAtTime(.001, t + dur);
		o.connect(g);
		g.connect(this.audio.destination);
		o.start(t);
		o.stop(t + dur);
	}
	layout() {
		const parent = this.canvas.parentElement ?? this.canvas;
		const w = Math.max(1, parent.clientWidth);
		const h = Math.max(1, parent.clientHeight);
		this.renderer.setSize(w, h, false);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
	}
	tick(now) {
		if (this.disposed) return;
		this.raf = requestAnimationFrame(this.tick);
		let dt = (now - this.lastNow) / 1e3;
		this.lastNow = now;
		if (dt > .1) dt = MAX_FRAME_DT;
		this.frames++;
		this.fpsT += dt;
		if (this.fpsT >= .4) {
			this.fps = this.frames / this.fpsT;
			this.frames = 0;
			this.fpsT = 0;
			this.hudDirty = true;
		}
		const look = this.input.consumeLook();
		this.mouseLook = Math.abs(look.x) + Math.abs(look.y) > .2;
		if (this.phase === "playing" || this.phase === "dialogue") {
			if (this.player.vehicleId != null) this.lookYaw = wrapAngle(this.lookYaw - look.x * SENS);
			else this.camYaw -= look.x * SENS;
			this.camPitch = clamp(this.camPitch - look.y * SENS * .85, -.18, .72);
			this.camDistMul = clamp(this.camDistMul + this.input.consumeWheel() * .08, .72, 1.45);
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
			if (this.acc > .25) this.acc = MAX_ACCUM;
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
			this.attractA += dt * .11;
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
	fixedMenu(dt) {
		this.updateTraffic(dt);
		this.updateNpcs(dt, true);
		this.blinkLights();
	}
	fixed(dt, a) {
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
	walkPlayer(dt, a) {
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
		const k = 1 - Math.exp(-(mag > .08 ? 22 : 16) * dt);
		this.player.vx = lerp(this.player.vx, targetVx, k);
		this.player.vz = lerp(this.player.vz, targetVz, k);
		let nx = this.player.x + this.player.vx * dt;
		let nz = this.player.z + this.player.vz * dt;
		const res = resolveCircleList(nx, nz, PLAYER_RADIUS, this.city.colliders);
		nx = res.x;
		nz = res.z;
		if (res.hit) {
			this.player.vx *= .25;
			this.player.vz *= .25;
		}
		for (const t of this.city.treeColliders) if (circlesOverlap(nx, nz, .42, t.x, t.z, t.r)) {
			const s = separateCircles(nx, nz, PLAYER_RADIUS, t.x, t.z, t.r, 1, 99);
			nx = s.ax;
			nz = s.az;
			this.player.vx *= .4;
			this.player.vz *= .4;
		}
		this.player.x = nx;
		this.player.z = nz;
		if (mag > .08) this.player.yaw = lerpAngle(this.player.yaw, Math.atan2(-mx, -mz), 1 - Math.exp(-14 * dt));
		if (a.jumpPressed && this.player.grounded) {
			this.player.vy = JUMP_SPEED;
			this.player.grounded = false;
		}
		this.player.vy -= 22 * dt;
		this.player.y += this.player.vy * dt;
		if (this.player.y <= 0) {
			this.player.y = 0;
			this.player.vy = 0;
			this.player.grounded = true;
		}
	}
	drivePlayer(dt, a) {
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
	integrateCar(car, dt, throttle, brake, steer, isPlayer, handbrake = false) {
		const max = car.kind === "sport" ? 40 : car.kind === "van" ? 28 : 34;
		if (throttle > 0) car.speed += 18 * throttle * dt;
		else if (brake > 0) {
			if (car.speed > .45) car.speed -= 32 * brake * dt;
			else car.speed -= 9 * brake * dt;
		} else {
			const sign = Math.sign(car.speed);
			car.speed -= sign * CAR_DRAG * 3.2 * dt;
			if (Math.abs(car.speed) < .18) car.speed = 0;
		}
		if (handbrake) {
			const s = Math.sign(car.speed);
			car.speed -= s * 26 * dt;
			if (Math.abs(car.speed) < .35) car.speed = 0;
		}
		car.speed = clamp(car.speed, -11, max);
		const speedFactor = clamp(Math.abs(car.speed) / 7, 0, 1);
		const reverse = car.speed >= 0 ? 1 : -1;
		const turnMul = handbrake ? 1.45 : 1;
		car.yaw += steer * CAR_TURN_RATE * speedFactor * reverse * turnMul * dt;
		const f = yawForward(car.yaw);
		const r = yawRight(car.yaw);
		car.lateral *= Math.max(0, 1 - (handbrake ? CAR_HANDBRAKE_GRIP : 9) * dt);
		if (handbrake) car.lateral += -steer * Math.abs(car.speed) * .38 * dt;
		const px = car.x + (f.x * car.speed + r.x * car.lateral) * dt;
		const pz = car.z + (f.z * car.speed + r.z * car.lateral) * dt;
		const before = Math.abs(car.speed);
		const hit = resolveCircleList(px, pz, CAR_RADIUS, this.city.colliders);
		car.x = hit.x;
		car.z = hit.z;
		if (hit.hit) {
			const impact = before;
			car.speed *= .28;
			car.lateral += (hit.nx * r.x + hit.nz * r.z) * impact * .15;
			if (impact > 6) {
				const dmg = (impact - 5) * (isPlayer ? 2.4 : 1.2);
				car.hp = Math.max(0, car.hp - dmg);
				if (isPlayer) {
					this.player.health = Math.max(0, this.player.health - dmg * .25);
					this.crashShake = Math.min(1.2, impact / 18);
					this.beep(90, .1, .06);
					if (impact > 12) this.addWanted(1, "reckless");
				}
			}
		}
		const wantRoll = -steer * clamp(Math.abs(car.speed) / 28, 0, 1) * .18;
		const wantPitch = throttle * .045 - (brake > 0 || handbrake ? .055 : 0);
		car.roll = lerp(car.roll, wantRoll, 1 - Math.exp(-8 * dt));
		car.pitch = lerp(car.pitch, wantPitch, 1 - Math.exp(-6 * dt));
	}
	handleInteract(a) {
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
		if (a.talkPressed && this.player.vehicleId == null && nearNpc) this.openTalk(nearNpc);
	}
	enterVehicle(car) {
		this.player.vehicleId = car.id;
		car.occupant = "player";
		car.parked = false;
		car.ai = false;
		this.camYaw = car.yaw;
		this.lookYaw = 0;
		this.camSnap = true;
		this.beep(220, .08, .04);
		if (this.mission.id === "intro" && this.mission.step === 0) {
			this.mission.step = 1;
			this.syncMissionMarker();
			this.notify("很好。現在把車開到中央車站。");
		}
		this.hudDirty = true;
	}
	exitVehicle() {
		const car = this.currentCar();
		this.player.vehicleId = null;
		if (car) {
			car.occupant = null;
			car.speed = 0;
			const r = yawRight(car.yaw);
			const hit = resolveCircleList(car.x + r.x * 2.3, car.z + r.z * 2.3, PLAYER_RADIUS, this.city.colliders);
			this.player.x = hit.x;
			this.player.z = hit.z;
			this.player.yaw = car.yaw;
			this.camYaw = car.yaw;
			this.lookYaw = 0;
		}
		this.hudDirty = true;
	}
	openTalk(npc) {
		const loc = this.locationName();
		const lines = this.dialogue.getGreeting(npc.profile, {
			wantedStars: this.wanted.stars,
			location: loc,
			missionId: this.mission.complete ? null : this.mission.id,
			inVehicle: this.player.vehicleId != null
		});
		const resolved = Array.isArray(lines) ? lines : [];
		if (!Array.isArray(lines)) {
			Promise.resolve(lines).then((ls) => {
				this.dialogueUi = {
					name: npc.profile.name,
					job: npc.profile.job,
					personality: npc.profile.personality,
					status: npc.profile.status,
					lines: ls,
					index: 0
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
			index: 0
		};
		this.phase = "dialogue";
		this.hudDirty = true;
	}
	advanceDialogue() {
		if (!this.dialogueUi) return;
		if (this.dialogueUi.index < this.dialogueUi.lines.length - 1) this.dialogueUi = {
			...this.dialogueUi,
			index: this.dialogueUi.index + 1
		};
		else this.closeDialogue();
		this.hudDirty = true;
	}
	spawnParked() {
		for (const s of this.city.parkedSpots) this.addCar({
			kind: s.kind,
			x: s.x,
			z: s.z,
			yaw: s.yaw,
			color: s.color,
			parked: true,
			ai: false,
			police: false
		});
	}
	spawnTraffic() {
		const colors = [
			12107462,
			3960485,
			12667708,
			14209734,
			5012568,
			15777856,
			2895928
		];
		const kinds = [
			"civilian",
			"civilian",
			"taxi",
			"van",
			"civilian",
			"sport",
			"civilian",
			"taxi"
		];
		for (let n = 0; n < 8; n++) {
			const a = this.city.nodes[n * 3];
			const b = this.pickNeighbor(a) ?? a;
			const f = this.laneAt(a, b, true);
			const yaw = Math.atan2(-(b.x - a.x), -(b.z - a.z));
			const car = this.addCar({
				kind: kinds[n],
				x: f.x,
				z: f.z,
				yaw,
				color: colors[n % colors.length],
				parked: false,
				ai: true,
				police: false
			});
			car.state.nextNode = {
				i: a.i,
				j: a.j
			};
			car.state.destNode = {
				i: b.i,
				j: b.j
			};
		}
	}
	spawnPolice() {
		for (const s of this.city.policeSpawn) {
			const car = this.addCar({
				kind: "police",
				x: s.x,
				z: s.z,
				yaw: s.yaw,
				color: 15264494,
				parked: true,
				ai: false,
				police: true
			});
			car.state.hp = 140;
		}
	}
	addCar(init) {
		const state = {
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
			t: 0
		};
		const mesh = createCar(init.color, init.kind);
		mesh.position.set(state.x, 0, state.z);
		mesh.rotation.y = state.yaw;
		this.scene.add(mesh);
		const view = {
			state,
			mesh
		};
		this.cars.push(view);
		return view;
	}
	spawnNpcs() {
		NPC_PROFILES.filter((p) => p.id !== "passenger").forEach((profile, i) => {
			const loop = this.city.npcLoops[i % this.city.npcLoops.length];
			const start = loop[i % loop.length];
			const npc = {
				profile,
				x: start.x,
				z: start.z,
				yaw: 0,
				walkT: Math.random() * 10,
				waypoints: loop,
				wp: i % loop.length,
				wait: Math.random() * 3,
				react: 0
			};
			this.npcs.push(npc);
			const mesh = createPerson({
				shirt: profile.shirt,
				pants: profile.pants,
				hair: profile.hair
			});
			this.npcMeshes.push(mesh);
			this.scene.add(mesh);
		});
		const p = NPC_PROFILES.find((x) => x.id === "passenger");
		const park = placeById("park");
		const passenger = {
			profile: p,
			x: park.x + 4,
			z: park.z + 2,
			yaw: Math.PI,
			walkT: 0,
			waypoints: [{
				x: park.x + 4,
				z: park.z + 2
			}],
			wp: 0,
			wait: 99,
			react: 0
		};
		this.npcs.push(passenger);
		const mesh = createPerson({
			shirt: p.shirt,
			pants: p.pants,
			hair: p.hair
		});
		mesh.visible = false;
		this.npcMeshes.push(mesh);
		this.scene.add(mesh);
	}
	updateNpcs(dt, menu) {
		const px = this.player.x;
		const pz = this.player.z;
		for (let i = 0; i < this.npcs.length; i++) {
			const n = this.npcs[i];
			if (n.profile.id === "passenger") {
				const show = this.mission.id === "night-fare" && this.mission.step === 0 && !this.passengerCarried;
				this.npcMeshes[i].visible = show;
				if (!show) continue;
			}
			if (n.react > 0) {
				n.react -= dt;
				continue;
			}
			if (!menu && dist2(n.x, n.z, px, pz) < 9) {
				n.yaw = Math.atan2(-(px - n.x), -(pz - n.z));
				n.react = .6;
				continue;
			}
			if (n.wait > 0) {
				n.wait -= dt;
				continue;
			}
			const dest = n.waypoints[n.wp];
			const dx = dest.x - n.x;
			const dz = dest.z - n.z;
			const d = Math.hypot(dx, dz);
			if (d < .4) {
				n.wp = (n.wp + 1) % n.waypoints.length;
				if (Math.random() < .28) n.wait = 1.2 + Math.random() * 2.4;
				continue;
			}
			const sp = 1.35;
			n.x += dx / d * sp * dt;
			n.z += dz / d * sp * dt;
			n.yaw = Math.atan2(-dx, -dz);
			n.walkT += dt * 6;
		}
	}
	updateTraffic(dt) {
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
			let throttle = .55;
			if (this.carAhead(car, 9)) throttle = .05;
			this.integrateCar(car, dt, throttle, throttle < .1 ? .4 : 0, steer, false);
			car.speed = clamp(car.speed, 0, 13.5);
			if (d < 3.2) {
				const nxt = this.pickNeighbor(dest, from);
				car.nextNode = {
					i: dest.i,
					j: dest.j
				};
				car.destNode = nxt ? {
					i: nxt.i,
					j: nxt.j
				} : car.nextNode;
			}
		}
	}
	updatePolice(dt) {
		const active = this.wanted.stars > 0;
		const cops = this.cars.filter((c) => c.state.police);
		let i = 0;
		for (const v of cops) {
			const car = v.state;
			const shouldChase = active && i < this.wanted.stars + 1;
			i++;
			if (!shouldChase) {
				car.ai = false;
				if (Math.abs(car.speed) > .2) this.integrateCar(car, dt, 0, .8, 0, false);
				continue;
			}
			car.parked = false;
			car.ai = true;
			const tx = this.player.x;
			const tz = this.player.z;
			const dx = tx - car.x;
			const dz = tz - car.z;
			const d = Math.hypot(dx, dz);
			if (d < 60) {
				this.wanted.lastSeen = this.time;
				this.wanted.searching = false;
				this.wanted.notifiedSearch = false;
			}
			const desiredYaw = Math.atan2(-dx, -dz);
			let steer = clamp(wrapAngle(desiredYaw - car.yaw) * 2.8, -1, 1);
			const throttle = d > 6 ? .9 : .2;
			this.integrateCar(car, dt, throttle, 0, steer, false);
			car.speed = clamp(car.speed, -6, 22 + this.wanted.stars * 1.5);
			if (d < 4.5 && this.player.vehicleId != null) this.player.health = Math.max(0, this.player.health - 8 * dt);
		}
	}
	carAhead(car, dist) {
		const f = yawForward(car.yaw);
		for (const o of this.cars) {
			if (o.state.id === car.id) continue;
			const dx = o.state.x - car.x;
			const dz = o.state.z - car.z;
			const along = dx * f.x + dz * f.z;
			if (along < 1.4 || along > dist) continue;
			if (Math.abs(dx * -f.z + dz * f.x) < 2.1) return true;
		}
		return false;
	}
	carCarHits() {
		for (let i = 0; i < this.cars.length; i++) for (let j = i + 1; j < this.cars.length; j++) {
			const a = this.cars[i].state;
			const b = this.cars[j].state;
			const rel = Math.abs(a.speed - b.speed);
			const sep = separateCircles(a.x, a.z, CAR_RADIUS * .92, b.x, b.z, CAR_RADIUS * .92, 1, 1);
			if (!sep.hit) continue;
			a.x = sep.ax;
			a.z = sep.az;
			b.x = sep.bx;
			b.z = sep.bz;
			const impact = rel + Math.abs(a.speed) * .3;
			if (impact > 7) {
				a.speed *= .55;
				b.speed *= .55;
				if (a.occupant === "player" || b.occupant === "player") {
					const dmg = (impact - 6) * 1.8;
					a.hp -= dmg * .5;
					b.hp -= dmg * .5;
					this.player.health = Math.max(0, this.player.health - dmg * .2);
					this.crashShake = .5;
					if (impact > 9) this.addWanted(1, "crash");
				}
			}
		}
	}
	playerCarHits(_dt) {
		if (this.player.vehicleId != null) return;
		for (const v of this.cars) {
			const c = v.state;
			if (!circlesOverlap(this.player.x, this.player.z, .42, c.x, c.z, 1.3175)) continue;
			const sep = separateCircles(this.player.x, this.player.z, PLAYER_RADIUS, c.x, c.z, CAR_RADIUS * .85, 1, 4);
			this.player.x = sep.ax;
			this.player.z = sep.az;
			if (Math.abs(c.speed) > 8) {
				this.player.health = Math.max(0, this.player.health - 18);
				this.addWanted(1, "hit-player");
			}
		}
		for (let i = 0; i < this.npcs.length; i++) {
			const n = this.npcs[i];
			if (!this.npcMeshes[i]?.visible) continue;
			const driver = this.currentCar();
			const px = this.player.x;
			const pz = this.player.z;
			if (!circlesOverlap(px, pz, this.player.vehicleId != null ? 1.55 : .42, n.x, n.z, .4)) continue;
			if (this.player.vehicleId != null && driver && Math.abs(driver.speed) > 6) {
				n.react = 2;
				n.x += (n.x - px) * .4;
				n.z += (n.z - pz) * .4;
				this.addWanted(2, "ped");
				this.player.health = Math.max(0, this.player.health - 4);
				this.notify("你撞到路人了！");
			}
		}
	}
	addWanted(delta, _why) {
		if (this.time - this.wanted.lastCrime < 1.4) return;
		const prev = this.wanted.stars;
		this.wanted.stars = clamp(this.wanted.stars + delta, 0, 5);
		this.wanted.lastCrime = this.time;
		this.wanted.lastSeen = this.time;
		this.wanted.searching = false;
		this.wanted.notifiedSearch = false;
		if (this.wanted.stars > prev) {
			this.beep(140, .2, .07);
			if (prev === 0) this.notify(UI.wantedStart);
			this.notify(UI.wantedUp(this.wanted.stars));
		}
	}
	updateWanted() {
		if (this.wanted.stars <= 0) return;
		let seen = false;
		for (const v of this.cars) {
			if (!v.state.police) continue;
			if (dist2(v.state.x, v.state.z, this.player.x, this.player.z) < 2704) {
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
		if (hidden > 14 && !this.wanted.searching) {
			this.wanted.searching = true;
			if (!this.wanted.notifiedSearch) {
				this.wanted.notifiedSearch = true;
				this.notify(UI.wantedSearch);
			}
		}
		if (hidden > 24) {
			this.wanted.stars -= 1;
			this.wanted.lastSeen = this.time - 14;
			if (this.wanted.stars <= 0) {
				this.wanted.stars = 0;
				this.wanted.searching = false;
				this.notify(UI.wantedClear);
			} else this.notify(`通緝等級降至 ${this.wanted.stars} 星`);
		}
	}
	updateMissions() {
		if (this.mission.complete || this.missionComplete) return;
		if (!MISSIONS.find((m) => m.id === this.mission.id)) return;
		if (this.mission.id === "intro") {
			if (this.mission.step === 0 && this.player.vehicleId != null) {
				this.mission.step = 1;
				this.syncMissionMarker();
			}
			if (this.mission.step === 1) {
				const st = placeById("station");
				if (dist2(this.player.x, this.player.z, st.x, st.z) < 196) this.completeMission();
			}
		} else if (this.mission.id === "night-fare") {
			if (this.mission.step === 1) {
				const east = placeById("eastBiz");
				if (this.passengerCarried && dist2(this.player.x, this.player.z, east.x, east.z) < 256) {
					this.dropPassenger();
					this.completeMission();
				}
			}
		} else if (this.mission.id === "escape") {
			if (this.wanted.stars === 0 && this.time - this.wanted.lastCrime > 1) this.completeMission();
		}
	}
	tryPickup() {
		if (this.mission.id !== "night-fare" || this.mission.step !== 0) return false;
		if (this.player.vehicleId == null) {
			this.notify("先上車，再接乘客。");
			return true;
		}
		const p = this.passengerNpc();
		if (!p) return false;
		if (dist2(this.player.x, this.player.z, p.x, p.z) > 64) return false;
		this.passengerCarried = true;
		this.mission.step = 1;
		this.mission.passengerId = "passenger";
		this.syncMissionMarker();
		this.notify("乘客已上車。前往東城商業區。");
		return true;
	}
	dropPassenger() {
		const p = this.passengerNpc();
		const east = placeById("eastBiz");
		if (p) {
			p.x = east.x + 5;
			p.z = east.z + 4;
		}
		this.passengerCarried = false;
	}
	completeMission() {
		const def = MISSIONS.find((m) => m.id === this.mission.id);
		this.mission.complete = true;
		this.player.money += def.reward;
		this.missionComplete = UI.missionComplete(def.title, def.reward);
		this.missionCompleteT = 3.2;
		this.beep(440, .18, .05);
		this.hudDirty = true;
	}
	advanceMissionChain() {
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
			passengerId: null
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
	syncMissionMarker() {
		const pos = this.markerPos();
		if (!pos) {
			this.marker.visible = false;
			return;
		}
		this.marker.visible = true;
		this.marker.position.set(pos.x, 0, pos.z);
		this.mission.marker = pos;
	}
	markerPos() {
		if (this.mission.complete) return null;
		if (this.mission.id === "intro") {
			if (this.mission.step === 0) {
				const c = this.cars[0]?.state;
				return c ? {
					x: c.x,
					z: c.z
				} : null;
			}
			const st = placeById("station");
			return {
				x: st.x,
				z: st.z
			};
		}
		if (this.mission.id === "night-fare") {
			if (this.mission.step === 0) {
				const p = this.passengerNpc();
				return p ? {
					x: p.x,
					z: p.z
				} : placeById("park");
			}
			const e = placeById("eastBiz");
			return {
				x: e.x,
				z: e.z
			};
		}
		return null;
	}
	blinkLights() {
		const t = this.time;
		for (const v of this.cars) {
			if (!v.state.police) continue;
			const on = this.wanted.stars > 0;
			v.mesh.traverse((o) => {
				if (!(o instanceof Mesh)) return;
				if (o.name === "copRed") {
					const m = o.material;
					m.emissiveIntensity = on && Math.sin(t * 14) > 0 ? 1.6 : .15;
				}
				if (o.name === "copBlue") {
					const m = o.material;
					m.emissiveIntensity = on && Math.sin(t * 14) < 0 ? 1.6 : .15;
				}
			});
		}
		this.marker.rotation.y = t * .9;
		this.marker.position.y = .12 + Math.sin(t * 2.4) * .12;
	}
	syncVisuals() {
		const p = this.player;
		this.playerMesh.visible = p.vehicleId == null && this.phase !== "menu";
		this.playerMesh.position.set(p.x, p.y, p.z);
		this.playerMesh.rotation.y = p.yaw;
		const moving = p.vehicleId == null && this.phase === "playing";
		this.swingLimbs(this.playerMesh, moving ? this.time * 8 : 0);
		for (let i = 0; i < this.npcs.length; i++) {
			const n = this.npcs[i];
			const m = this.npcMeshes[i];
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
			const spin = v.state.speed * .35;
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
	swingLimbs(root, t) {
		const a = Math.sin(t) * .45;
		root.traverse((o) => {
			if (o.name === "leftArm" || o.name === "rightLeg") o.rotation.x = a;
			if (o.name === "rightArm" || o.name === "leftLeg") o.rotation.x = -a;
		});
	}
	updateCamera(dt) {
		if (this.phase === "menu") {
			const r = 78;
			this.camera.position.set(Math.sin(this.attractA) * r, 38, Math.cos(this.attractA) * r);
			this.camera.lookAt(0, 2, -8);
			this.camera.fov = 52;
			this.camera.updateProjectionMatrix();
			return;
		}
		const car = this.currentCar();
		const inCar = !!car;
		this.lookBackBlend = lerp(this.lookBackBlend, this.input.touchLookBack || this.input.keys.has("KeyC") ? 1 : 0, 1 - Math.exp(-12 * dt));
		if (car) {
			if (this.mouseLook) this.lookIdle = 0;
			else this.lookIdle += dt;
			if (this.lookIdle > .4) {
				const rec = 2.8 + (Math.abs(car.speed) > 8 ? 1.6 : 0);
				this.lookYaw = lerpAngle(this.lookYaw, 0, 1 - Math.exp(-rec * dt));
			}
		}
		const heading = car ? car.yaw + this.lookYaw + this.lookBackBlend * Math.PI : this.camYaw + this.lookBackBlend * Math.PI;
		const fwd = yawForward(heading);
		const right = yawRight(heading);
		const dist = (inCar ? CAM_DIST_CAR : CAM_DIST_FOOT) * this.camDistMul;
		const height = (inCar ? CAM_H_CAR : CAM_H_FOOT) + this.player.y;
		const lookY = (inCar ? CAM_LOOK_Y_CAR : CAM_LOOK_Y_FOOT) + this.player.y;
		const shoulder = inCar ? CAM_SHOULDER_CAR : CAM_SHOULDER_FOOT;
		const pitch = this.camPitch;
		let wantX = this.player.x - fwd.x * dist * Math.cos(pitch * .4) + right.x * shoulder;
		let wantZ = this.player.z - fwd.z * dist * Math.cos(pitch * .4) + right.z * shoulder;
		let wantY = height + Math.sin(pitch) * dist * .55;
		if (!inCar) {
			const spd = Math.hypot(this.player.vx, this.player.vz);
			wantY += Math.sin(this.time * 9) * Math.min(.045, spd * .008);
		}
		let pull = 1;
		for (let i = 0; i < 6; i++) {
			if (!resolveCircleList(this.player.x + (wantX - this.player.x) * pull, this.player.z + (wantZ - this.player.z) * pull, .45, this.city.colliders).hit) break;
			pull *= .7;
		}
		wantX = this.player.x + (wantX - this.player.x) * pull;
		wantZ = this.player.z + (wantZ - this.player.z) * pull;
		if (pull < .45) wantY = Math.max(wantY, this.player.y + 1.55);
		const k = this.camSnap ? 1 : 1 - Math.exp(-(inCar ? 10 : 13) * dt);
		this.camSnap = false;
		let camX = lerp(this.camera.position.x, wantX, k);
		let camY = lerp(this.camera.position.y, wantY, k);
		let camZ = lerp(this.camera.position.z, wantZ, k);
		if (this.crashShake > 0) {
			camX += (Math.random() - .5) * this.crashShake * .35;
			camY += (Math.random() - .5) * this.crashShake * .2;
		}
		this.camera.position.set(camX, camY, camZ);
		const cf = yawForward(car ? car.yaw : this.player.yaw);
		this.lookTarget.set(this.player.x + cf.x * 1.15 + right.x * shoulder * .35, lookY, this.player.z + cf.z * 1.15 + right.z * shoulder * .35);
		if (this.camLook.lengthSq() < .01) this.camLook.copy(this.lookTarget);
		this.camLook.lerp(this.lookTarget, k);
		this.camera.lookAt(this.camLook);
		const spd = car?.speed ?? 0;
		const wantFov = inCar ? 56 + clamp(Math.abs(spd) * .28, 0, 10) : 58;
		this.camera.fov = lerp(this.camera.fov, wantFov, .08);
		this.camera.updateProjectionMatrix();
		this.sun.position.set(this.player.x + 28, 60, this.player.z + 18);
		this.sun.target.position.set(this.player.x, 0, this.player.z);
		this.sun.target.updateMatrixWorld();
	}
	drawMinimap() {
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
		const scale = w * .92 / 242;
		const toX = (x) => w / 2 + (x - this.player.x) * scale;
		const toY = (z) => h / 2 + (z - this.player.z) * scale;
		ctx.fillStyle = "#2f5a3a";
		ctx.fillRect(toX(-121), toY(-121), 242 * scale, 242 * scale);
		ctx.fillStyle = "#3a3e44";
		ctx.strokeStyle = "#3a3e44";
		ctx.lineWidth = 3.2;
		for (let i = 0; i <= 5; i++) {
			const a = -121 + i * (242 / 5);
			ctx.beginPath();
			ctx.moveTo(toX(a), toY(-121));
			ctx.lineTo(toX(a), toY(121));
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(toX(-121), toY(a));
			ctx.lineTo(toX(121), toY(a));
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
	pushHud() {
		if (!this.hudDirty && this.phase === "playing") {}
		const car = this.currentCar();
		const def = MISSIONS.find((m) => m.id === this.mission.id);
		const step = def && !this.mission.complete ? def.steps[this.mission.step] : void 0;
		const snap = {
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
			missionTitle: this.mission.complete && !def ? null : def && !this.mission.complete ? def.title : null,
			missionObjective: step?.objective ?? null,
			notification: this.notifyText,
			dialogue: this.dialogueUi,
			shop: this.shopOpen,
			tutorial: this.phase === "playing" && this.tutorialI < UI.tutorial.length && this.tutorialT > 0 ? UI.tutorial[this.tutorialI] : null,
			canStart: true,
			missionComplete: this.missionComplete,
			fps: Math.round(this.fps)
		};
		const key = JSON.stringify(snap);
		if (key === this.lastHudJson) return;
		this.lastHudJson = key;
		this.hudDirty = false;
		useHud.getState().setHud(snap);
	}
	promptText() {
		if (this.phase !== "playing") return null;
		if (this.player.vehicleId != null) {
			if (this.mission.id === "night-fare" && this.mission.step === 0) {
				const p = this.passengerNpc();
				if (p && dist2(this.player.x, this.player.z, p.x, p.z) < 64) return UI.promptPickup;
			}
			return UI.promptExit;
		}
		if (this.nearestEnterable()) return UI.promptEnter;
		if (dist2(this.player.x, this.player.z, this.city.shop.x, this.city.shop.z) < 17.64) return UI.promptShop;
		if (this.nearestNpc()) return UI.promptTalk;
		return null;
	}
	locationName() {
		let best = this.city.places[0];
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
	nearestEnterable() {
		let best = null;
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
	nearestNpc() {
		let best = null;
		let bestD = TALK_DIST * TALK_DIST;
		for (let i = 0; i < this.npcs.length; i++) {
			if (!this.npcMeshes[i]?.visible) continue;
			const n = this.npcs[i];
			const d = dist2(this.player.x, this.player.z, n.x, n.z);
			if (d < bestD) {
				bestD = d;
				best = n;
			}
		}
		return best;
	}
	passengerNpc() {
		return this.npcs.find((n) => n.profile.id === "passenger");
	}
	currentCar() {
		if (this.player.vehicleId == null) return null;
		return this.cars.find((c) => c.state.id === this.player.vehicleId)?.state ?? null;
	}
	node(i, j) {
		return this.city.nodes.find((n) => n.i === i && n.j === j) ?? null;
	}
	pickNeighbor(n, avoid) {
		const opts = [];
		for (const o of this.city.nodes) {
			if (Math.abs(o.i - n.i) + Math.abs(o.j - n.j) !== 1) continue;
			if (avoid && o.i === avoid.i && o.j === avoid.j) continue;
			opts.push(o);
		}
		if (!opts.length) {
			for (const o of this.city.nodes) if (Math.abs(o.i - n.i) + Math.abs(o.j - n.j) === 1) opts.push(o);
		}
		return opts[Math.floor(Math.random() * opts.length)] ?? null;
	}
	laneAt(from, to, atFrom) {
		const dx = to.x - from.x;
		const dz = to.z - from.z;
		const len = Math.hypot(dx, dz) || 1;
		const rx = -dz / len;
		const rz = dx / len;
		const base = atFrom ? from : to;
		return {
			x: base.x + rx * LANE_OFFSET,
			z: base.z + rz * LANE_OFFSET
		};
	}
	enterNearestVehicleSafe() {
		const n = this.nearestEnterable() ?? this.cars[0];
		if (!n) return;
		this.enterVehicle(n.state);
	}
	notify(msg) {
		this.notifyText = msg;
		this.notifyT = 3.4;
		this.hudDirty = true;
	}
	respawn() {
		this.exitVehicle();
		this.player.x = this.city.spawn.x;
		this.player.z = this.city.spawn.z;
		this.player.y = 0;
		this.player.vx = 0;
		this.player.vz = 0;
		this.player.health = 70;
		this.notify("你受傷過重，已在中央大道醒來。");
	}
	wireQa() {
		window.__controlsTest = {
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
			getPosition: () => ({
				x: this.player.x,
				y: this.player.y,
				z: this.player.z
			}),
			getMode: () => this.player.vehicleId != null ? "vehicle" : "foot",
			setWanted: (n) => {
				this.wanted.stars = clamp(n, 0, 5);
				this.wanted.lastSeen = this.time;
				this.hudDirty = true;
			},
			startPlay: () => this.startPlay()
		};
		window.__chaoGang = {
			startPlay: () => this.startPlay(),
			getState: () => ({
				wanted: this.wanted.stars,
				inVehicle: this.player.vehicleId != null,
				mission: this.mission.complete ? null : this.mission.id,
				x: this.player.x,
				z: this.player.z
			})
		};
	}
};
//#endregion
export { GameEngine };
