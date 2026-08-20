// DovahRealm — canvas do jogo dentro do React (moldura). Contrato: init único, dispose no unmount.
import { useEffect, useRef } from "react";
import { createGame, type GameHandle } from "@/game/engine";

export default function GameCanvas({
  onReady,
}: {
  onReady: (h: GameHandle) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return; // guard StrictMode double-mount
    startedRef.current = true;
    const canvas = canvasRef.current!;
    const handle = createGame(canvas);
    onReady(handle);
    return () => {
      handle.dispose();
      startedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full touch-none select-none"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
