import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { Heart, Pause, Wallet } from "lucide-react";
import type { GameEngine } from "@/game/engine";
import { useHud } from "@/game/hud-store";
import { MISSIONS, UI } from "@/game/data";
import type { HudSnapshot } from "@/game/types";
import { TouchControls } from "./TouchControls";

export function GameHud({
  engineRef,
  minimapRef,
}: {
  engineRef: RefObject<GameEngine | null>;
  minimapRef: RefObject<HTMLCanvasElement | null>;
}) {
  const hud = useHud((s) => s.hud);
  const engine = () => engineRef.current;
  const playing = hud.phase === "playing";
  const overlay = hud.phase !== "playing";

  useEffect(() => {
    engineRef.current?.attachMinimap(minimapRef.current);
  }, [engineRef, hud.phase, minimapRef]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-sans text-fg">
      <div className="absolute top-4 left-4 flex max-w-[min(22rem,calc(100%-9rem))] flex-col gap-2 sm:top-5 sm:left-5">
        {playing ? (
          <>
            <div className="hud-panel flex flex-col gap-2 px-3 py-2.5">
              <StatRow
                icon={<Heart className="size-4 text-health" strokeWidth={2.2} />}
                label={UI.health}
                value={String(hud.health)}
              />
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-health transition-[width] duration-200"
                  style={{ width: `${hud.health}%` }}
                />
              </div>
              <StatRow
                icon={<Wallet className="size-4 text-cash" strokeWidth={2.2} />}
                label={UI.cash}
                value={`$${hud.money.toLocaleString("zh-TW")}`}
              />
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <span className="text-xs tracking-wide text-muted">{UI.wanted}</span>
                <WantedStars n={hud.wanted} />
              </div>
            </div>
            {hud.missionTitle ? (
              <div className="hud-panel px-3 py-2.5">
                <p className="text-[11px] tracking-wide text-muted">{UI.mission}</p>
                <p className="text-sm font-medium">{hud.missionTitle}</p>
                {hud.missionObjective ? (
                  <p className="mt-1 text-xs text-primary">
                    {UI.objective}：{hud.missionObjective}
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="px-1 text-xs text-muted">
              {UI.location} · {hud.location}
            </p>
          </>
        ) : null}
      </div>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 sm:top-5 sm:right-5">
        {playing ? (
          <button
            type="button"
            className="pointer-events-auto flex size-11 items-center justify-center rounded-xl border border-border bg-surface/90 text-fg"
            onClick={() => engine()?.pause()}
            aria-label={UI.pause}
          >
            <Pause className="size-5" />
          </button>
        ) : null}
        <canvas
          ref={minimapRef}
          width={176}
          height={176}
          className={
            playing
              ? "size-[7.2rem] rounded-full border border-border sm:size-44"
              : "hidden"
          }
        />
        {playing && hud.inVehicle ? (
          <div className="hud-panel min-w-[9.5rem] px-3 py-2 text-right">
            <p className="hud-stat text-lg font-medium">
              {UI.speed}：{hud.speedKmh} km/h
            </p>
            <p className="text-xs text-muted">
              {UI.durability}：{hud.vehicleHp ?? 0}%
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${hud.vehicleHp ?? 0}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {playing ? (
        <div className="absolute bottom-5 left-1/2 flex w-[min(36rem,calc(100%-1.5rem))] -translate-x-1/2 flex-col items-center gap-2 pb-[max(0px,env(safe-area-inset-bottom))]">
          {hud.wantedFlash ? (
            <p className="hud-panel px-3 py-1.5 text-sm text-wanted">{hud.wantedFlash}</p>
          ) : null}
          {hud.notification ? (
            <p className="hud-panel px-3 py-1.5 text-sm">{hud.notification}</p>
          ) : null}
          {hud.tutorial ? (
            <p className="hud-panel px-3 py-2 text-center text-sm">{hud.tutorial}</p>
          ) : null}
          {hud.prompt ? (
            <p className="rounded-full border border-primary/40 bg-surface/90 px-4 py-2 text-sm font-medium text-primary">
              {hud.prompt}
            </p>
          ) : null}
          <p className="hidden text-[11px] text-subtle sm:block">
            {hud.inVehicle ? UI.controlsHintCar : UI.controlsHintFoot}
          </p>
        </div>
      ) : null}

      {playing ? <TouchControls engineRef={engineRef} inVehicle={hud.inVehicle} /> : null}

      {hud.missionComplete && playing ? (
        <div className="absolute inset-x-0 top-1/3 flex justify-center px-4">
          <div className="hud-panel max-w-md px-5 py-4 text-center">
            <p className="text-base font-medium">{hud.missionComplete}</p>
          </div>
        </div>
      ) : null}

      {overlay ? (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/55 px-4">
          {hud.phase === "menu" ? <MainMenu onPlay={() => engine()?.startPlay()} /> : null}
          {hud.phase === "paused" ? <PauseMenu onResume={() => engine()?.resume()} /> : null}
          {hud.phase === "dialogue" && hud.dialogue ? (
            <DialoguePanel
              data={hud.dialogue}
              onNext={() => engine()?.touchTalk()}
              onClose={() => engine()?.closeDialogue()}
            />
          ) : null}
          {hud.phase === "shop" ? (
            <ShopPanel
              money={hud.money}
              inVehicle={hud.inVehicle}
              onHeal={() => engine()?.shopBuy("heal")}
              onRepair={() => engine()?.shopBuy("repair")}
              onClose={() => engine()?.closeShop()}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted">{label}</span>
      <span className="hud-stat ml-auto text-sm font-medium">{value}</span>
    </div>
  );
}

function WantedStars({ n }: { n: number }) {
  return (
    <span className="hud-stat text-base tracking-[0.14em] text-wanted" aria-label={`${UI.wanted} ${n}`}>
      {Array.from({ length: 5 }, (_, i) => (i < n ? "★" : "☆")).join(" ")}
    </span>
  );
}

function MainMenu({ onPlay }: { onPlay: () => void }) {
  const [how, setHow] = useState(false);
  return (
    <div className="w-full max-w-md max-h-[min(38rem,calc(100dvh-2rem))] overflow-y-auto rounded-xl border border-border bg-surface px-6 py-7 shadow-lg">
      <p className="text-xs tracking-[0.22em] text-primary">{UI.tagline}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{UI.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        在這座海灣邊上的低密度都市裡步行、駕車、接任務，並設法甩掉通緝。
      </p>
      {how ? (
        <div className="mt-5 space-y-2 text-sm text-fg">
          {UI.howBody.map((line) => (
            <p key={line} className="text-muted">
              {line}
            </p>
          ))}
          <MenuButton onClick={() => setHow(false)}>{UI.back}</MenuButton>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <MenuButton primary onClick={onPlay}>
            {UI.play}
          </MenuButton>
          <MenuButton onClick={() => setHow(true)}>{UI.how}</MenuButton>
          <ul className="mt-3 space-y-1 text-xs text-subtle">
            {MISSIONS.map((m) => (
              <li key={m.id}>
                {m.title}　{m.brief}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PauseMenu({ onResume }: { onResume: () => void }) {
  const [how, setHow] = useState(false);
  return (
    <div className="w-full max-w-md max-h-[min(38rem,calc(100dvh-2rem))] overflow-y-auto rounded-xl border border-border bg-surface px-6 py-7">
      <h2 className="text-2xl font-semibold">{UI.paused}</h2>
      {how ? (
        <div className="mt-4 space-y-2 text-sm text-muted">
          {UI.howBody.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <MenuButton onClick={() => setHow(false)}>{UI.back}</MenuButton>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <MenuButton primary onClick={onResume}>
            {UI.resume}
          </MenuButton>
          <MenuButton onClick={() => setHow(true)}>{UI.how}</MenuButton>
        </div>
      )}
    </div>
  );
}

function DialoguePanel({
  data,
  onNext,
  onClose,
}: {
  data: NonNullable<HudSnapshot["dialogue"]>;
  onNext: () => void;
  onClose: () => void;
}) {
  const line = data.lines[data.index];
  const last = data.index >= data.lines.length - 1;
  return (
    <div className="w-full max-w-lg rounded-xl border border-border bg-surface px-5 py-5">
      <p className="text-lg font-medium">{data.name}</p>
      <p className="mt-1 text-xs text-muted">
        職業：{data.job}　個性：{data.personality}　目前狀態：{data.status}
      </p>
      <p className="mt-4 text-sm leading-relaxed">{line?.text}</p>
      <div className="mt-5 flex justify-end gap-2">
        <MenuButton onClick={last ? onClose : onNext}>{last ? UI.endDialogue : UI.nextDialogue}</MenuButton>
      </div>
    </div>
  );
}

function ShopPanel({
  money,
  inVehicle,
  onHeal,
  onRepair,
  onClose,
}: {
  money: number;
  inVehicle: boolean;
  onHeal: () => void;
  onRepair: () => void;
  onClose: () => void;
}) {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface px-5 py-5">
      <h2 className="text-xl font-semibold">{UI.shopTitle}</h2>
      <p className="mt-1 text-sm text-muted">
        {UI.cash}：${money.toLocaleString("zh-TW")}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <MenuButton onClick={onHeal}>{UI.buyHeal}</MenuButton>
        <MenuButton onClick={onRepair} disabled={!inVehicle}>
          {UI.buyRepair}
        </MenuButton>
        <MenuButton primary onClick={onClose}>
          {UI.close}
        </MenuButton>
      </div>
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "h-11 rounded-lg px-4 text-sm font-medium transition-opacity duration-150 disabled:opacity-40 " +
        (primary ? "bg-primary text-primary-fg" : "border border-border bg-surface-2 text-fg")
      }
    >
      {children}
    </button>
  );
}
