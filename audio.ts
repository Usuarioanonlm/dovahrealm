// DovahRealm — áudio procedural via WebAudio (sem arquivos): espada, magia, dano, nível
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide !== 0) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

function noise(dur: number, vol: number, low = 400) {
  const a = ac();
  if (!a) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = low;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(a.destination);
  src.start();
}

export const sfx = {
  swing: () => noise(0.12, 0.12, 1800),
  hit: () => {
    noise(0.1, 0.2, 700);
    blip(140, 0.1, "square", 0.08, -60);
  },
  hurt: () => blip(110, 0.22, "sawtooth", 0.14, -50),
  fire: () => noise(0.3, 0.16, 1200),
  frost: () => blip(880, 0.2, "sine", 0.1, -400),
  heal: () => blip(520, 0.35, "sine", 0.1, 260),
  shout: () => {
    noise(0.5, 0.3, 500);
    blip(90, 0.5, "sawtooth", 0.2, -40);
  },
  levelup: () => {
    blip(392, 0.15, "triangle", 0.12);
    setTimeout(() => blip(523, 0.15, "triangle", 0.12), 120);
    setTimeout(() => blip(659, 0.3, "triangle", 0.12), 240);
  },
  coin: () => blip(1200, 0.08, "square", 0.06, 300),
  quest: () => {
    blip(440, 0.12, "triangle", 0.1);
    setTimeout(() => blip(587, 0.25, "triangle", 0.1), 110);
  },
  death: () => blip(220, 0.8, "sawtooth", 0.16, -160),
  dragon: () => {
    noise(0.7, 0.25, 350);
    blip(70, 0.7, "sawtooth", 0.2, -20);
  },
};

