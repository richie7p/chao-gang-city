import { useEffect, useRef, useState } from "react";
import { defaultHud, useHud } from "@/game/hud-store";
import { GameHud } from "./GameHud";
import type { GameEngine } from "@/game/engine";

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let engine: GameEngine | null = null;

    void import("@/game/engine").then(async ({ GameEngine }) => {
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

  useEffect(() => {
    engineRef.current?.attachMinimap(minimapRef.current);
  }, [ready]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onContextMenu={(e) => e.preventDefault()}
      />
      <GameHud engineRef={engineRef} minimapRef={minimapRef} />
    </div>
  );
}
