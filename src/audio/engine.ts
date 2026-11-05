// A tiny synthesizer built on the Web Audio API. No sound files needed.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function audio(): { ctx: AudioContext; out: GainNode } {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

export const now = () => audio().ctx.currentTime;

export const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export type Instrument = 'piano' | 'chip' | 'pad' | 'bass' | 'pluck' | 'lead';

export const INSTRUMENTS: { id: Instrument; name: string; gm: number }[] = [
  { id: 'piano', name: 'Soft Piano', gm: 0 },
  { id: 'chip', name: '8-bit Chip', gm: 80 },
  { id: 'pad', name: 'Dreamy Pad', gm: 89 },
  { id: 'pluck', name: 'Pluck', gm: 45 },
  { id: 'lead', name: 'Synth Lead', gm: 81 },
  { id: 'bass', name: 'Bass', gm: 38 },
];

interface NoteOpts {
  time?: number;
  duration?: number;
  instrument?: Instrument;
  volume?: number;
}

export function playNote(midi: number, opts: NoteOpts = {}) {
  const { ctx, out } = audio();
  const t = Math.max(opts.time ?? ctx.currentTime, ctx.currentTime);
  const dur = opts.duration ?? 0.5;
  const vol = opts.volume ?? 0.25;
  const inst = opts.instrument ?? 'piano';
  const f = midiToFreq(midi);

  const amp = ctx.createGain();
  amp.gain.value = 0;
  amp.connect(out);
  const oscs: OscillatorNode[] = [];
  const osc = (type: OscillatorType, freq: number, detune = 0, gain = 1, dest: AudioNode = amp) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = gain;
    o.connect(g).connect(dest);
    oscs.push(o);
    return o;
  };
  let end = t + dur;
  const g = amp.gain;

  switch (inst) {
    case 'piano': {
      osc('triangle', f, 0, 1);
      osc('sine', f * 2, 0, 0.25);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(vol, t + 0.01);
      g.exponentialRampToValueAtTime(vol * 0.3, t + 0.3);
      g.setValueAtTime(vol * 0.3, Math.max(t + 0.3, end - 0.01));
      g.exponentialRampToValueAtTime(0.0001, end + 0.4);
      end += 0.4;
      break;
    }
    case 'chip': {
      osc('square', f, 0, 0.5);
      g.setValueAtTime(vol * 0.7, t);
      g.setValueAtTime(vol * 0.5, t + 0.05);
      g.setValueAtTime(vol * 0.5, end - 0.005);
      g.linearRampToValueAtTime(0, end);
      break;
    }
    case 'pad': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      lp.connect(amp);
      osc('sawtooth', f, -8, 0.5, lp);
      osc('sawtooth', f, 8, 0.5, lp);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(vol * 0.6, t + Math.min(0.3, dur / 2));
      g.setValueAtTime(vol * 0.6, end);
      g.linearRampToValueAtTime(0, end + 0.5);
      end += 0.5;
      break;
    }
    case 'pluck': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(4000, t);
      lp.frequency.exponentialRampToValueAtTime(400, t + 0.3);
      lp.connect(amp);
      osc('sawtooth', f, 0, 0.6, lp);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(vol, t + 0.005);
      g.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, Math.min(dur, 1)));
      end = t + Math.max(0.35, Math.min(dur, 1));
      break;
    }
    case 'lead': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3000;
      lp.connect(amp);
      const o = osc('sawtooth', f, 0, 0.5, lp);
      osc('square', f, 5, 0.3, lp);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0, t);
      lfoGain.gain.linearRampToValueAtTime(12, t + 0.4);
      lfo.connect(lfoGain).connect(o.detune);
      oscs.push(lfo);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(vol * 0.8, t + 0.02);
      g.setValueAtTime(vol * 0.8, end - 0.02);
      g.linearRampToValueAtTime(0, end + 0.05);
      end += 0.05;
      break;
    }
    case 'bass': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      lp.connect(amp);
      osc('sawtooth', f, 0, 0.7, lp);
      osc('sine', f / 2, 0, 0.6, lp);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(vol * 1.2, t + 0.01);
      g.setValueAtTime(vol * 1.2, end - 0.03);
      g.linearRampToValueAtTime(0, end);
      break;
    }
  }
  oscs.forEach((o) => {
    o.start(t);
    o.stop(end + 0.05);
  });
}

export function playChord(notes: number[], opts: NoteOpts = {}) {
  notes.forEach((n) => playNote(n, { ...opts, volume: (opts.volume ?? 0.25) * 0.6 }));
}

function noise(ctx: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  return src;
}

export type Drum = 'kick' | 'snare' | 'clap' | 'hat';

export const DRUMS: { id: Drum; name: string; plain: string; gm: number }[] = [
  { id: 'kick', name: 'Kick', plain: 'The big low "boom". Your foot taps with it.', gm: 36 },
  { id: 'snare', name: 'Snare', plain: 'The sharp "tak". Usually on beats 2 and 4.', gm: 38 },
  { id: 'clap', name: 'Clap', plain: 'A hand clap. Like snare, popular in EDM.', gm: 39 },
  { id: 'hat', name: 'Hi-hat', plain: 'The tiny "tss". Keeps time between big hits.', gm: 42 },
];

export function playDrum(drum: Drum, time?: number, volume = 1) {
  const { ctx, out } = audio();
  const t = Math.max(time ?? ctx.currentTime, ctx.currentTime);
  const amp = ctx.createGain();
  amp.connect(out);
  if (drum === 'kick') {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    amp.gain.setValueAtTime(0.9 * volume, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(amp);
    o.start(t);
    o.stop(t + 0.45);
  } else if (drum === 'snare' || drum === 'clap') {
    const n = noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = drum === 'snare' ? 'highpass' : 'bandpass';
    bp.frequency.value = drum === 'snare' ? 1200 : 1500;
    n.connect(bp).connect(amp);
    const len = drum === 'snare' ? 0.18 : 0.15;
    amp.gain.setValueAtTime(0.5 * volume, t);
    if (drum === 'clap') {
      amp.gain.setValueAtTime(0.1 * volume, t + 0.01);
      amp.gain.setValueAtTime(0.5 * volume, t + 0.02);
    }
    amp.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.start(t);
    n.stop(t + len + 0.02);
    if (drum === 'snare') {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = 200;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.4 * volume, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(og).connect(out);
      o.start(t);
      o.stop(t + 0.1);
    }
  } else {
    const n = noise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    n.connect(hp).connect(amp);
    amp.gain.setValueAtTime(0.25 * volume, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.start(t);
    n.stop(t + 0.07);
  }
}

export function click(time: number, accent: boolean) {
  const { ctx, out } = audio();
  const o = ctx.createOscillator();
  o.frequency.value = accent ? 1600 : 1000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.4, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  o.connect(g).connect(out);
  o.start(time);
  o.stop(time + 0.06);
}

/**
 * A step clock. Calls onStep(step, audioTime) a little ahead of time so sound
 * is perfectly in time, and onVisual(step) when that step is actually heard.
 */
export class StepClock {
  bpm = 120;
  stepsPerBeat = 4;
  totalSteps = 16;
  onStep: (step: number, time: number) => void = () => {};
  onVisual: (step: number) => void = () => {};
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private timeouts: number[] = [];

  get running() {
    return this.timer !== null;
  }

  get stepDur() {
    return 60 / this.bpm / this.stepsPerBeat;
  }

  start() {
    if (this.timer !== null) return;
    const { ctx } = audio();
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.tick(), 25);
    this.tick();
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.timeouts.forEach((t) => window.clearTimeout(t));
    this.timeouts = [];
    this.onVisual(-1);
  }

  private tick() {
    const { ctx } = audio();
    while (this.nextTime < ctx.currentTime + 0.12) {
      const s = this.step;
      const time = this.nextTime;
      this.onStep(s, time);
      const delay = Math.max(0, (time - ctx.currentTime) * 1000);
      const id = window.setTimeout(() => {
        this.timeouts = this.timeouts.filter((x) => x !== id);
        if (this.timer !== null) this.onVisual(s);
      }, delay);
      this.timeouts.push(id);
      this.nextTime += this.stepDur;
      this.step = (this.step + 1) % this.totalSteps;
    }
  }
}
