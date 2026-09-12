import { i as __toESM } from "../_runtime.mjs";
import { I as require_jsx_runtime, L as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
import { i as Heart, r as Pause, t as Wallet } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DjjZbf5E.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var SIDEWALK = 2.2;
12 - SIDEWALK * 2;
var FIXED_DT = 1 / 60;
var MAX_FRAME_DT = .1;
var MAX_ACCUM = .25;
var PLAYER_RADIUS = .42;
var WALK_SPEED = 5.2;
var RUN_SPEED = 8.4;
var JUMP_SPEED = 7.2;
var CAR_RADIUS = 1.55;
var CAR_DRAG = 1.6;
var CAR_TURN_RATE = 1.85;
var CAR_HANDBRAKE_GRIP = 2.8;
var LANE_OFFSET = 2.15;
var CAM_DIST_FOOT = 4.9;
var CAM_H_FOOT = 1.78;
var CAM_DIST_CAR = 7.4;
var CAM_H_CAR = 2.85;
var CAM_SHOULDER_FOOT = .38;
var CAM_SHOULDER_CAR = .58;
var CAM_LOOK_Y_FOOT = 1.32;
var CAM_LOOK_Y_CAR = 1.12;
var ENTER_DIST = 3.6;
var TALK_DIST = 3.2;
var SHOP_DIST = 4.2;
function roadCoord(i) {
	return i * 46 + 6 - 121;
}
function blockBounds(i, j) {
	const minX = i * 46 + 12 - 121;
	const maxX = (i + 1) * 46 - 121;
	const minZ = j * 46 + 12 - 121;
	const maxZ = (j + 1) * 46 - 121;
	return {
		minX,
		maxX,
		minZ,
		maxZ,
		cx: (minX + maxX) / 2,
		cz: (minZ + maxZ) / 2
	};
}
function yawForward(yaw) {
	return {
		x: -Math.sin(yaw),
		z: -Math.cos(yaw)
	};
}
function yawRight(yaw) {
	return {
		x: Math.cos(yaw),
		z: -Math.sin(yaw)
	};
}
function wrapAngle(a) {
	return Math.atan2(Math.sin(a), Math.cos(a));
}
function clamp(v, lo, hi) {
	return v < lo ? lo : v > hi ? hi : v;
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
function lerpAngle(a, b, t) {
	return a + wrapAngle(b - a) * t;
}
function dist2(ax, az, bx, bz) {
	const dx = ax - bx;
	const dz = az - bz;
	return dx * dx + dz * dz;
}
var PLACES = [
	{
		id: "centralAve",
		name: "中央大道",
		x: roadCoord(3),
		z: 0,
		radius: 28
	},
	{
		id: "bay",
		name: "海灣區",
		x: 0,
		z: blockBounds(2, 0).cz - 8,
		radius: 36
	},
	{
		id: "park",
		name: "新生公園",
		x: blockBounds(1, 1).cx,
		z: blockBounds(1, 1).cz,
		radius: 22
	},
	{
		id: "eastBiz",
		name: "東城商業區",
		x: blockBounds(4, 2).cx,
		z: blockBounds(4, 2).cz,
		radius: 26
	},
	{
		id: "westInd",
		name: "西港工業區",
		x: blockBounds(0, 2).cx,
		z: blockBounds(0, 2).cz,
		radius: 26
	},
	{
		id: "station",
		name: "中央車站",
		x: blockBounds(2, 2).cx,
		z: blockBounds(2, 2).cz,
		radius: 18
	},
	{
		id: "police",
		name: "城南警察局",
		x: blockBounds(2, 4).cx,
		z: blockBounds(2, 4).cz,
		radius: 18
	},
	{
		id: "parking",
		name: "港灣停車場",
		x: blockBounds(4, 3).cx,
		z: blockBounds(4, 3).cz,
		radius: 16
	},
	{
		id: "shop",
		name: "東城便利商店",
		x: blockBounds(4, 2).cx + 6,
		z: blockBounds(4, 2).cz - 8,
		radius: 10
	}
];
function placeById(id) {
	const p = PLACES.find((x) => x.id === id);
	if (!p) throw new Error(`missing place ${id}`);
	return p;
}
var NPC_PROFILES = [
	{
		id: "chen",
		name: "陳志豪",
		job: "計程車司機",
		personality: "健談、急性子",
		status: "準備下班",
		shirt: 15777856,
		pants: 2764342,
		hair: 1708556
	},
	{
		id: "lin",
		name: "林雅婷",
		job: "咖啡店員",
		personality: "溫柔、觀察力強",
		status: "休息中",
		shirt: 14206128,
		pants: 4074018,
		hair: 3809812
	},
	{
		id: "wang",
		name: "王大偉",
		job: "巡警",
		personality: "正經、不苟言笑",
		status: "巡邏中",
		shirt: 2968180,
		pants: 1844272,
		hair: 1118481
	},
	{
		id: "huang",
		name: "黃淑芬",
		job: "會計師",
		personality: "謹慎、講效率",
		status: "趕著開會",
		shirt: 4872810,
		pants: 2238512,
		hair: 2824722
	},
	{
		id: "chang",
		name: "張偉傑",
		job: "大學生",
		personality: "好奇、愛吐槽",
		status: "晃來晃去",
		shirt: 3842248,
		pants: 3950164,
		hair: 1840144
	},
	{
		id: "wu",
		name: "吳佳蓉",
		job: "護理師",
		personality: "沉穩、關心人",
		status: "剛下班",
		shirt: 15265522,
		pants: 5939380,
		hair: 2364942
	},
	{
		id: "lee",
		name: "李國強",
		job: "水電工",
		personality: "直球、熱心",
		status: "找工具行",
		shirt: 12868138,
		pants: 3814184,
		hair: 2760728
	},
	{
		id: "chou",
		name: "周子涵",
		job: "平面設計師",
		personality: "慢熱、嘴毒",
		status: "找靈感",
		shirt: 5913176,
		pants: 1973796,
		hair: 921106
	},
	{
		id: "hsu",
		name: "許明輝",
		job: "夜市攤販",
		personality: "豪爽、愛開玩笑",
		status: "進貨途中",
		shirt: 13781578,
		pants: 2894896,
		hair: 1710618
	},
	{
		id: "tsai",
		name: "蔡依靜",
		job: "律師",
		personality: "冷靜、用字精準",
		status: "散步思考案情",
		shirt: 1842210,
		pants: 2763314,
		hair: 1446414
	},
	{
		id: "passenger",
		name: "鄭浩然",
		job: "夜班工程師",
		personality: "疲憊、話少",
		status: "等車回家",
		shirt: 4021322,
		pants: 2368552,
		hair: 1709586
	}
];
var MISSIONS = [
	{
		id: "intro",
		title: "城市初體驗",
		brief: "先搞到一台車，再開去中央車站熟悉路況。",
		reward: 1500,
		steps: [{
			id: "get-car",
			objective: "取得一台車輛",
			hint: "靠近路邊車輛後按 E 上車"
		}, {
			id: "to-station",
			objective: "駕駛前往中央車站",
			hint: "跟著小地圖上的目標標記前進"
		}]
	},
	{
		id: "night-fare",
		title: "午夜載客",
		brief: "去新生公園接一名乘客，再把他送到東城商業區。",
		reward: 3200,
		steps: [{
			id: "pickup",
			objective: "前往新生公園接送乘客",
			hint: "開到公園入口，靠近乘客後按 E 或 F"
		}, {
			id: "dropoff",
			objective: "將乘客送往東城商業區",
			hint: "載客時請盡量避免嚴重車禍"
		}]
	},
	{
		id: "escape",
		title: "逃出生天",
		brief: "你已被通緝兩星。甩掉警車並解除通緝。",
		reward: 5e3,
		steps: [{
			id: "lose-cops",
			objective: "躲避警方並解除通緝",
			hint: "拉開距離後找地方躲藏，通緝會逐漸下降"
		}]
	}
];
var UI = {
	title: "潮港都市",
	tagline: "海灣邊上的低密度都市沙盒",
	play: "開始遊戲",
	resume: "繼續遊戲",
	pause: "暫停",
	how: "操作說明",
	back: "返回",
	missions: "任務",
	shopTitle: "東城便利商店",
	shopClosed: "目前沒有可購買的物品。",
	buyHeal: "能量飲料　回復生命　$200",
	buyRepair: "簡易修車包　修復車輛　$500",
	boughtHeal: "你喝下能量飲料，感覺好多了。",
	boughtRepair: "車輛已大致修復。",
	noMoney: "現金不足。",
	noCar: "你現在沒有可修復的車輛。",
	healthFull: "生命值已滿。",
	carFull: "車輛耐久度已滿。",
	close: "關閉",
	health: "生命值",
	cash: "現金",
	wanted: "通緝",
	speed: "時速",
	durability: "車輛耐久度",
	mission: "目前任務",
	objective: "目標",
	location: "所在位置",
	promptEnter: "按 E 進入車輛",
	promptExit: "按 E 下車",
	promptTalk: "按 F 與市民交談",
	promptShop: "按 E 進入商店",
	promptPickup: "按 E 讓乘客上車",
	wantedUp: (n) => `通緝等級提升至 ${n} 星`,
	wantedStart: "你已被警方通緝！",
	wantedSearch: "警方正在搜索你……",
	wantedClear: "你已成功擺脫警方。",
	missionComplete: (title, reward) => `任務完成：${title}　獲得 $${reward.toLocaleString("zh-TW")}`,
	allMissions: "所有任務已完成。城市仍開放探索。",
	paused: "遊戲暫停",
	howBody: [
		"第三人稱視角　點擊畫面鎖定游標後即可轉動鏡頭，也可按住滑鼠拖曳",
		"WASD　步行移動／駕駛",
		"Shift　跑步",
		"空白鍵　步行時跳躍；駕車時手煞車",
		"C　向後看",
		"滾輪　拉近或拉遠鏡頭",
		"E　互動、上車、下車",
		"F　與市民交談",
		"Esc　暫停",
		"造成嚴重車禍或衝撞路人會提升通緝等級，警車會追捕你。拉開距離並躲藏即可解除通緝。"
	],
	tutorial: ["歡迎來到潮港都市。WASD 走動，滑鼠轉動視角，滾輪縮放鏡頭。", "前方路邊有車輛。靠近後按 E 上車。駕車時鏡頭會跟著車頭，空白鍵為手煞車，C 向後看。"],
	nextDialogue: "繼續",
	endDialogue: "結束對話",
	controlsHintFoot: "WASD 移動　Shift 跑　空白 跳　C 回看　滾輪 縮放　E 互動　F 交談",
	controlsHintCar: "W 加速　S 煞車／倒車　A／D 轉向　空白 手煞　C 回看　E 下車",
	lookHint: "點擊畫面鎖定游標以轉動鏡頭",
	touchJump: "跳",
	touchRun: "跑",
	touchBrake: "手煞",
	touchLookBack: "回看",
	touchUse: "E",
	touchTalk: "F",
	touchLook: "視角"
};
var defaultHud = {
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
	fps: 0
};
var useHud = create((set) => ({
	hud: defaultHud,
	setHud: (hud) => set({ hud })
}));
function TouchControls({ engineRef, inVehicle }) {
	const origin = (0, import_react.useRef)(null);
	const look = (0, import_react.useRef)(null);
	const onStickDown = (e) => {
		origin.current = {
			id: e.pointerId,
			x: e.clientX,
			y: e.clientY
		};
		e.currentTarget.setPointerCapture(e.pointerId);
	};
	const onStickMove = (e) => {
		if (!origin.current || origin.current.id !== e.pointerId) return;
		const dx = (e.clientX - origin.current.x) / 46;
		const dy = (e.clientY - origin.current.y) / 46;
		const m = Math.hypot(dx, dy);
		const s = m > 1 ? 1 / m : 1;
		engineRef.current?.setTouchMove(dx * s, -dy * s);
	};
	const onStickUp = (e) => {
		if (origin.current?.id !== e.pointerId) return;
		origin.current = null;
		engineRef.current?.setTouchMove(0, 0);
	};
	const onLookDown = (e) => {
		look.current = {
			id: e.pointerId,
			x: e.clientX,
			y: e.clientY
		};
		e.currentTarget.setPointerCapture(e.pointerId);
	};
	const onLookMove = (e) => {
		if (!look.current || look.current.id !== e.pointerId) return;
		engineRef.current?.addTouchLook(e.movementX, e.movementY);
	};
	const onLookUp = (e) => {
		if (look.current?.id === e.pointerId) look.current = null;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 sm:hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto absolute bottom-8 left-5 size-32 rounded-full border border-border bg-surface/50",
				onPointerDown: onStickDown,
				onPointerMove: onStickMove,
				onPointerUp: onStickUp,
				onPointerCancel: onStickUp
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto absolute right-3 bottom-32 h-40 w-28",
				onPointerDown: onLookDown,
				onPointerMove: onLookMove,
				onPointerUp: onLookUp,
				onPointerCancel: onLookUp
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto absolute right-4 bottom-8 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PadBtn, {
						onPress: () => engineRef.current?.touchUse(),
						children: UI.touchUse
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PadBtn, {
						onPress: () => engineRef.current?.touchTalk(),
						children: UI.touchTalk
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PadBtn, {
						hold: true,
						onHold: (v) => inVehicle ? engineRef.current?.touchHandbrake(v) : engineRef.current?.touchJump(v),
						children: inVehicle ? UI.touchBrake : UI.touchJump
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PadBtn, {
						hold: true,
						onHold: (v) => inVehicle ? engineRef.current?.touchLookBack(v) : engineRef.current?.touchSprint(v),
						children: inVehicle ? UI.touchLookBack : UI.touchRun
					})
				]
			})
		]
	});
}
function PadBtn({ children, onPress, onHold, hold }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "flex size-12 items-center justify-center rounded-full border border-border bg-surface/85 text-sm font-medium",
		onPointerDown: (e) => {
			e.preventDefault();
			if (hold) onHold?.(true);
			else onPress?.();
		},
		onPointerUp: () => {
			if (hold) onHold?.(false);
		},
		onPointerCancel: () => {
			if (hold) onHold?.(false);
		},
		children
	});
}
function GameHud({ engineRef, minimapRef }) {
	const hud = useHud((s) => s.hud);
	const engine = () => engineRef.current;
	const playing = hud.phase === "playing";
	const overlay = hud.phase !== "playing";
	(0, import_react.useEffect)(() => {
		engineRef.current?.attachMinimap(minimapRef.current);
	}, [
		engineRef,
		hud.phase,
		minimapRef
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 font-sans text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-4 left-4 flex max-w-[min(22rem,calc(100%-9rem))] flex-col gap-2 sm:top-5 sm:left-5",
				children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hud-panel flex flex-col gap-2 px-3 py-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
									className: "size-4 text-health",
									strokeWidth: 2.2
								}),
								label: UI.health,
								value: String(hud.health)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-1.5 overflow-hidden rounded-full bg-surface-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-health transition-[width] duration-200",
									style: { width: `${hud.health}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
									className: "size-4 text-cash",
									strokeWidth: 2.2
								}),
								label: UI.cash,
								value: `$${hud.money.toLocaleString("zh-TW")}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3 pt-0.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs tracking-wide text-muted",
									children: UI.wanted
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WantedStars, { n: hud.wanted })]
							})
						]
					}),
					hud.missionTitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hud-panel px-3 py-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] tracking-wide text-muted",
								children: UI.mission
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: hud.missionTitle
							}),
							hud.missionObjective ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-primary",
								children: [
									UI.objective,
									"：",
									hud.missionObjective
								]
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "px-1 text-xs text-muted",
						children: [
							UI.location,
							" · ",
							hud.location
						]
					})
				] }) : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-4 right-4 flex flex-col items-end gap-2 sm:top-5 sm:right-5",
				children: [
					playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "pointer-events-auto flex size-11 items-center justify-center rounded-xl border border-border bg-surface/90 text-fg",
						onClick: () => engine()?.pause(),
						"aria-label": UI.pause,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" })
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: minimapRef,
						width: 176,
						height: 176,
						className: playing ? "size-[7.2rem] rounded-full border border-border sm:size-44" : "hidden"
					}),
					playing && hud.inVehicle ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hud-panel min-w-[9.5rem] px-3 py-2 text-right",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "hud-stat text-lg font-medium",
								children: [
									UI.speed,
									"：",
									hud.speedKmh,
									" km/h"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									UI.durability,
									"：",
									hud.vehicleHp ?? 0,
									"%"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-primary",
									style: { width: `${hud.vehicleHp ?? 0}%` }
								})
							})
						]
					}) : null
				]
			}),
			playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-5 left-1/2 flex w-[min(36rem,calc(100%-1.5rem))] -translate-x-1/2 flex-col items-center gap-2 pb-[max(0px,env(safe-area-inset-bottom))]",
				children: [
					hud.wantedFlash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hud-panel px-3 py-1.5 text-sm text-wanted",
						children: hud.wantedFlash
					}) : null,
					hud.notification ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hud-panel px-3 py-1.5 text-sm",
						children: hud.notification
					}) : null,
					hud.tutorial ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hud-panel px-3 py-2 text-center text-sm",
						children: hud.tutorial
					}) : null,
					hud.prompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-full border border-primary/40 bg-surface/90 px-4 py-2 text-sm font-medium text-primary",
						children: hud.prompt
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-[11px] text-subtle sm:block",
						children: hud.inVehicle ? UI.controlsHintCar : UI.controlsHintFoot
					})
				]
			}) : null,
			playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchControls, {
				engineRef,
				inVehicle: hud.inVehicle
			}) : null,
			hud.missionComplete && playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-x-0 top-1/3 flex justify-center px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hud-panel max-w-md px-5 py-4 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base font-medium",
						children: hud.missionComplete
					})
				})
			}) : null,
			overlay ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/55 px-4",
				children: [
					hud.phase === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainMenu, { onPlay: () => engine()?.startPlay() }) : null,
					hud.phase === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseMenu, { onResume: () => engine()?.resume() }) : null,
					hud.phase === "dialogue" && hud.dialogue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialoguePanel, {
						data: hud.dialogue,
						onNext: () => engine()?.touchTalk(),
						onClose: () => engine()?.closeDialogue()
					}) : null,
					hud.phase === "shop" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopPanel, {
						money: hud.money,
						inVehicle: hud.inVehicle,
						onHeal: () => engine()?.shopBuy("heal"),
						onRepair: () => engine()?.shopBuy("repair"),
						onClose: () => engine()?.closeShop()
					}) : null
				]
			}) : null
		]
	});
}
function StatRow({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			icon,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hud-stat ml-auto text-sm font-medium",
				children: value
			})
		]
	});
}
function WantedStars({ n }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "hud-stat text-base tracking-[0.14em] text-wanted",
		"aria-label": `${UI.wanted} ${n}`,
		children: Array.from({ length: 5 }, (_, i) => i < n ? "★" : "☆").join(" ")
	});
}
function MainMenu({ onPlay }) {
	const [how, setHow] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full max-w-md max-h-[min(38rem,calc(100dvh-2rem))] overflow-y-auto rounded-xl border border-border bg-surface px-6 py-7 shadow-lg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.22em] text-primary",
				children: UI.tagline
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl font-semibold tracking-tight",
				children: UI.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: "在這座海灣邊上的低密度都市裡步行、駕車、接任務，並設法甩掉通緝。"
			}),
			how ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-2 text-sm text-fg",
				children: [UI.howBody.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted",
					children: line
				}, line)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
					onClick: () => setHow(false),
					children: UI.back
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
						primary: true,
						onClick: onPlay,
						children: UI.play
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
						onClick: () => setHow(true),
						children: UI.how
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-1 text-xs text-subtle",
						children: MISSIONS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							m.title,
							"　",
							m.brief
						] }, m.id))
					})
				]
			})
		]
	});
}
function PauseMenu({ onResume }) {
	const [how, setHow] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full max-w-md max-h-[min(38rem,calc(100dvh-2rem))] overflow-y-auto rounded-xl border border-border bg-surface px-6 py-7",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-2xl font-semibold",
			children: UI.paused
		}), how ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-2 text-sm text-muted",
			children: [UI.howBody.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: line }, line)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
				onClick: () => setHow(false),
				children: UI.back
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
				primary: true,
				onClick: onResume,
				children: UI.resume
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
				onClick: () => setHow(true),
				children: UI.how
			})]
		})]
	});
}
function DialoguePanel({ data, onNext, onClose }) {
	const line = data.lines[data.index];
	const last = data.index >= data.lines.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full max-w-lg rounded-xl border border-border bg-surface px-5 py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg font-medium",
				children: data.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-muted",
				children: [
					"職業：",
					data.job,
					"　個性：",
					data.personality,
					"　目前狀態：",
					data.status
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm leading-relaxed",
				children: line?.text
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex justify-end gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
					onClick: last ? onClose : onNext,
					children: last ? UI.endDialogue : UI.nextDialogue
				})
			})
		]
	});
}
function ShopPanel({ money, inVehicle, onHeal, onRepair, onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full max-w-md rounded-xl border border-border bg-surface px-5 py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-semibold",
				children: UI.shopTitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					UI.cash,
					"：$",
					money.toLocaleString("zh-TW")
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
						onClick: onHeal,
						children: UI.buyHeal
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
						onClick: onRepair,
						disabled: !inVehicle,
						children: UI.buyRepair
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuButton, {
						primary: true,
						onClick: onClose,
						children: UI.close
					})
				]
			})
		]
	});
}
function MenuButton({ children, onClick, primary, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		disabled,
		onClick,
		className: "h-11 rounded-lg px-4 text-sm font-medium transition-opacity duration-150 disabled:opacity-40 " + (primary ? "bg-primary text-primary-fg" : "border border-border bg-surface-2 text-fg"),
		children
	});
}
function GameApp() {
	const canvasRef = (0, import_react.useRef)(null);
	const minimapRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!canvasRef.current) return;
		let cancelled = false;
		let engine = null;
		import("./engine-BcjCPn6r.mjs").then(async ({ GameEngine }) => {
			if (cancelled || !canvasRef.current) return;
			engine = await GameEngine.create(canvasRef.current);
			if (cancelled) {
				engine.dispose();
				return;
			}
			engineRef.current = engine;
			engine.attachMinimap(minimapRef.current);
			engine.start();
			setReady(true);
		});
		const onVis = () => {
			if (document.hidden) engineRef.current?.pause();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			cancelled = true;
			document.removeEventListener("visibilitychange", onVis);
			engine?.dispose();
			engineRef.current = null;
			useHud.setState({ hud: defaultHud });
		};
	}, []);
	(0, import_react.useEffect)(() => {
		engineRef.current?.attachMinimap(minimapRef.current);
	}, [ready]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "absolute inset-0 h-full w-full touch-none",
			onContextMenu: (e) => e.preventDefault()
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameHud, {
			engineRef,
			minimapRef
		})]
	});
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
function Home() {
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMounted(true);
	}, []);
	if (!mounted) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex h-dvh items-center justify-center bg-bg text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm tracking-wide text-muted",
			children: "潮港都市載入中"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameApp, {});
}
//#endregion
export { SIDEWALK as A, yawForward as B, JUMP_SPEED as C, PLAYER_RADIUS as D, MAX_FRAME_DT as E, dist2 as F, lerp as I, lerpAngle as L, WALK_SPEED as M, blockBounds as N, RUN_SPEED as O, clamp as P, roadCoord as R, FIXED_DT as S, MAX_ACCUM as T, yawRight as V, CAR_DRAG as _, NPC_PROFILES as a, CAR_TURN_RATE as b, placeById as c, CAM_H_CAR as d, CAM_H_FOOT as f, CAM_SHOULDER_FOOT as g, CAM_SHOULDER_CAR as h, MISSIONS as i, TALK_DIST as j, SHOP_DIST as k, CAM_DIST_CAR as l, CAM_LOOK_Y_FOOT as m, PLACES as o, CAM_LOOK_Y_CAR as p, useHud as r, UI as s, routes_exports as t, CAM_DIST_FOOT as u, CAR_HANDBRAKE_GRIP as v, LANE_OFFSET as w, ENTER_DIST as x, CAR_RADIUS as y, wrapAngle as z };
