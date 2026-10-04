import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { defaultHud, useHud } from "@/game/hud-store";
import { GameHud } from "./GameHud";
import type { GameEngine } from "@/game/engine";

const loadEngine = createClientOnlyFn(() => import("@/game/engine"));

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let engine: GameEngine | null = null;

    void loadEngine().then(async ({ GameEngine }) => {
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
    }).catch(() => { if (!cancelled) setError(true); });

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
      {error ? <div role="alert" className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg text-fg"><p>無法啟動 3D 城市，請確認瀏覽器支援 WebGL。</p><button type="button" onClick={() => window.location.reload()}>重新載入</button></div> : null}
      <GameHud engineRef={engineRef} minimapRef={minimapRef} />
    </div>
  );
}
