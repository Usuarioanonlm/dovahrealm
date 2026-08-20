// DovahRealm — telas de morte e vitória
const LOGO = "/manus-storage/logo-dragon_043d8df9.png";

export function GameOverScreen({ onRespawn, onTitle }: { onRespawn: () => void; onTitle: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0a06]/95 px-6">
      <h1 className="font-display text-4xl font-black tracking-wide text-[#8e2f22]" style={{ animation: "titleIn 600ms cubic-bezier(0.23,1,0.32,1)" }}>
        VOCÊ CAIU
      </h1>
      <p className="mt-3 max-w-xs text-center font-body text-sm italic text-[#cfdce6]/80">
        A neve cobre seu corpo... mas os deuses ainda têm planos para você.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onRespawn}
          className="rounded-sm border-2 border-[#b08d3f] bg-[#b08d3f] px-6 py-4 font-display text-lg font-bold text-[#2b1d0e] transition-transform active:scale-95"
        >
          Despertar em Riofrio
        </button>
        <button
          onClick={onTitle}
          className="rounded-sm border-2 border-[#e8d5a8]/40 bg-transparent px-6 py-3 font-display text-sm font-bold text-[#e8d5a8] transition-transform active:scale-95"
        >
          Voltar ao Título
        </button>
      </div>
    </div>
  );
}

export function VictoryScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0a06]/95 px-6">
      <img src={LOGO} alt="" className="h-28 w-28 drop-shadow-[0_0_30px_rgba(176,141,63,0.7)]" style={{ animation: "titleIn 800ms cubic-bezier(0.23,1,0.32,1)" }} />
      <h1 className="mt-4 text-center font-display text-4xl font-black tracking-wide text-[#b08d3f]" style={{ textShadow: "0 0 24px rgba(176,141,63,0.5)" }}>
        ALDUIN CAIU
      </h1>
      <p className="mt-3 max-w-sm text-center font-body text-sm italic leading-relaxed text-[#cfdce6]/90">
        O Devorador de Mundos virou cinza e lenda. Os bardos cantarão seu nome nas tavernas do norte por mil anos, Dovahkiin.
      </p>
      <p className="mt-2 font-display text-xs uppercase tracking-[0.3em] text-[#e8c23a]">O norte está salvo</p>
      <button
        onClick={onContinue}
        className="mt-8 rounded-sm border-2 border-[#b08d3f] bg-[#b08d3f] px-8 py-4 font-display text-lg font-bold text-[#2b1d0e] transition-transform active:scale-95"
      >
        Continuar Explorando
      </button>
    </div>
  );
}
