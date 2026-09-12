import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/game/GameApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="flex h-dvh items-center justify-center bg-bg text-fg">
        <p className="text-sm tracking-wide text-muted">潮港都市載入中</p>
      </main>
    );
  }

  return <GameApp />;
}
