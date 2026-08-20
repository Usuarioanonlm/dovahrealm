// DovahRealm — tela de título: arte hero gerada, logo dragão, opções de jogo
import { hasSave } from "@/game/save";

const TITLE_ART = "/manus-storage/title-hero_2edac150.png";
const LOGO = "/manus-storage/logo-dragon_043d8df9.png";

export default function TitleScreen({
  onNewGame,
  onContinue,
}: {
  onNewGame: () => void;
  onContinue: () => void;
}) {
  const saveExists = hasSave();
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#101820]">
      <img
        src={TITLE_ART}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a06] via-transparent to-[#0d0a06]/60" />

      <div className="relative flex flex-1 flex-col items-center justify-between px-6 py-10">
        <div className="flex flex-col items-center" style={{ animation: "titleIn 900ms cubic-bezier(0.23,1,0.32,1)" }}>
          <img src={LOGO} alt="DovahRealm" className="h-24 w-24 drop-shadow-[0_0_20px_rgba(176,141,63,0.5)]" />
          <h1
            className="mt-3 text-center font-display text-5xl font-black tracking-[0.12em] text-[#e8d5a8]"
            style={{ textShadow: "0 0 24px rgba(176,141,63,0.6), 0 3px 0 #2b1d0e" }}
          >
            DOVAH<span className="text-[#b08d3f]">REALM</span>
          </h1>
          <p className="mt-2 max-w-xs text-center font-body text-sm italic text-[#cfdce6]/90" style={{ textShadow: "0 1px 4px #000" }}>
            O norte chama. Responda com aço e fúria.
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3" style={{ animation: "titleIn 900ms 200ms cubic-bezier(0.23,1,0.32,1) backwards" }}>
          {saveExists && (
            <button
              onClick={onContinue}
              className="rounded-sm border-2 border-[#b08d3f] bg-[#b08d3f] px-6 py-4 font-display text-lg font-bold tracking-wide text-[#2b1d0e] shadow-[0_0_30px_rgba(176,141,63,0.4)] transition-transform duration-150 active:scale-95"
            >
              Continuar Jornada
            </button>
          )}
          <button
            onClick={onNewGame}
            className={`rounded-sm border-2 px-6 py-4 font-display text-lg font-bold tracking-wide transition-transform duration-150 active:scale-95 ${
              saveExists
                ? "border-[#e8d5a8]/60 bg-[#1a120a]/70 text-[#e8d5a8] backdrop-blur-sm"
                : "border-[#b08d3f] bg-[#b08d3f] text-[#2b1d0e] shadow-[0_0_30px_rgba(176,141,63,0.4)]"
            }`}
          >
            {saveExists ? "Nova Jornada" : "Iniciar Jornada"}
          </button>
          <p className="text-center text-[11px] text-[#cfdce6]/70" style={{ textShadow: "0 1px 3px #000" }}>
            Mundo aberto · Missões · Magia · Dragões · Salva automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}
