import { useRef, type PointerEvent, type ReactNode, type RefObject } from "react";
import type { GameEngine } from "@/game/engine";
import { UI } from "@/game/data";

export function TouchControls({
  engineRef,
  inVehicle,
}: {
  engineRef: RefObject<GameEngine | null>;
  inVehicle: boolean;
}) {
  const origin = useRef<{ id: number; x: number; y: number } | null>(null);
  const look = useRef<{ id: number; x: number; y: number } | null>(null);

  const onStickDown = (e: PointerEvent<HTMLDivElement>) => {
    origin.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onStickMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!origin.current || origin.current.id !== e.pointerId) return;
    const dx = (e.clientX - origin.current.x) / 46;
    const dy = (e.clientY - origin.current.y) / 46;
    const m = Math.hypot(dx, dy);
    const s = m > 1 ? 1 / m : 1;
    engineRef.current?.setTouchMove(dx * s, -dy * s);
  };
  const onStickUp = (e: PointerEvent<HTMLDivElement>) => {
    if (origin.current?.id !== e.pointerId) return;
    origin.current = null;
    engineRef.current?.setTouchMove(0, 0);
  };

  const onLookDown = (e: PointerEvent<HTMLDivElement>) => {
    look.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onLookMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!look.current || look.current.id !== e.pointerId) return;
    engineRef.current?.addTouchLook(e.movementX, e.movementY);
  };
  const onLookUp = (e: PointerEvent<HTMLDivElement>) => {
    if (look.current?.id === e.pointerId) look.current = null;
  };

  return (
    <div className="pointer-events-none absolute inset-0 sm:hidden">
      <div
        className="pointer-events-auto absolute bottom-8 left-5 size-32 rounded-full border border-border bg-surface/50"
        onPointerDown={onStickDown}
        onPointerMove={onStickMove}
        onPointerUp={onStickUp}
        onPointerCancel={onStickUp}
      />
      <div
        className="pointer-events-auto absolute right-3 bottom-32 h-40 w-28"
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={onLookUp}
        onPointerCancel={onLookUp}
      />
      <div className="pointer-events-auto absolute right-4 bottom-8 flex flex-col gap-2">
        <PadBtn onPress={() => engineRef.current?.touchUse()}>{UI.touchUse}</PadBtn>
        <PadBtn onPress={() => engineRef.current?.touchTalk()}>{UI.touchTalk}</PadBtn>
        <PadBtn
          hold
          onHold={(v) =>
            inVehicle ? engineRef.current?.touchHandbrake(v) : engineRef.current?.touchJump(v)
          }
        >
          {inVehicle ? UI.touchBrake : UI.touchJump}
        </PadBtn>
        <PadBtn
          hold
          onHold={(v) =>
            inVehicle ? engineRef.current?.touchLookBack(v) : engineRef.current?.touchSprint(v)
          }
        >
          {inVehicle ? UI.touchLookBack : UI.touchRun}
        </PadBtn>
      </div>
    </div>
  );
}

function PadBtn({
  children,
  onPress,
  onHold,
  hold,
}: {
  children: ReactNode;
  onPress?: () => void;
  onHold?: (v: boolean) => void;
  hold?: boolean;
}) {
  return (
    <button
      type="button"
      className="flex size-12 items-center justify-center rounded-full border border-border bg-surface/85 text-sm font-medium"
      onPointerDown={(e) => {
        e.preventDefault();
        if (hold) onHold?.(true);
        else onPress?.();
      }}
      onPointerUp={() => {
        if (hold) onHold?.(false);
      }}
      onPointerCancel={() => {
        if (hold) onHold?.(false);
      }}
    >
      {children}
    </button>
  );
}
