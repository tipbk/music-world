// Write a Song to a standard .mid file so it can be opened in any music app (DAW).
import { DRUMS, INSTRUMENTS } from '../audio/engine';
import { eventsAtStep, Song, totalSteps } from './song';

const PPQ = 480;
const TICKS_PER_STEP = PPQ / 4;

function vlq(n: number) {
  const bytes = [n & 0x7f];
  while ((n >>= 7)) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
}

const str = (s: string) => s.split('').map((c) => c.charCodeAt(0));
const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

export function songToMidi(song: Song, repeats = 2): Uint8Array {
  type Ev = { tick: number; order: number; data: number[] };
  const evs: Ev[] = [];
  const us = Math.round(60000000 / song.bpm);
  evs.push({ tick: 0, order: 0, data: [0xff, 0x51, 0x03, (us >> 16) & 255, (us >> 8) & 255, us & 255] });
  const gm = (id: string) => INSTRUMENTS.find((i) => i.id === id)?.gm ?? 0;
  evs.push({ tick: 0, order: 0, data: [0xc0, gm(song.chordInstrument)] });
  evs.push({ tick: 0, order: 0, data: [0xc1, gm(song.melodyInstrument)] });
  evs.push({ tick: 0, order: 0, data: [0xc2, gm('bass')] });
  const chan = { chord: 0, melody: 1, bass: 2 } as const;

  const steps = totalSteps(song) * repeats;
  for (let s = 0; s < steps; s++) {
    const { notes, drums } = eventsAtStep(song, s);
    const tick = s * TICKS_PER_STEP;
    notes.forEach((n) => {
      const c = chan[n.kind];
      evs.push({ tick, order: 2, data: [0x90 | c, n.midi, 90] });
      evs.push({ tick: tick + n.len * TICKS_PER_STEP - 10, order: 1, data: [0x80 | c, n.midi, 0] });
    });
    drums.forEach((d) => {
      const note = DRUMS.find((x) => x.id === d.drum)!.gm;
      evs.push({ tick, order: 2, data: [0x99, note, 100] });
      evs.push({ tick: tick + TICKS_PER_STEP / 2, order: 1, data: [0x89, note, 0] });
    });
  }
  evs.sort((a, b) => a.tick - b.tick || a.order - b.order);

  const track: number[] = [];
  let last = 0;
  evs.forEach((e) => {
    track.push(...vlq(e.tick - last), ...e.data);
    last = e.tick;
  });
  track.push(0, 0xff, 0x2f, 0x00);

  const header = [...str('MThd'), ...u32(6), 0, 0, 0, 1, (PPQ >> 8) & 255, PPQ & 255];
  return new Uint8Array([...header, ...str('MTrk'), ...u32(track.length), ...track]);
}

export function downloadMidi(song: Song, filename = 'my-game-loop.mid') {
  const bytes = songToMidi(song);
  const blob = new Blob([bytes], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
