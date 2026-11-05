import { audio, Drum, Instrument, playChord, playDrum, playNote } from '../audio/engine';
import { chordOnDegree, degreeToMidi, ScaleId, tonicFor } from './theory';

export type DrumPattern = Record<Drum, boolean[]>;
export type ChordStyle = 'block' | 'pulse' | 'arp';

export interface Song {
  bpm: number;
  key: number; // 0 = C, 1 = C#, ...
  scale: ScaleId;
  progression: number[]; // one chord (scale degree) per bar
  drums: DrumPattern; // 16 steps, repeats every bar
  melody: (number | null)[]; // one cell per 8th note, value = scale degree row
  chordInstrument: Instrument;
  melodyInstrument: Instrument;
  chordStyle: ChordStyle;
  bass: boolean;
  mute?: Partial<Record<'drums' | 'chords' | 'bass' | 'melody', boolean>>;
}

export const MELODY_ROWS = 10; // home note up to a bit past the octave

export const pattern = (s: string) => s.split('').map((c) => c === 'x');

export function drumsFrom(p: Partial<Record<Drum, string>>): DrumPattern {
  const empty = '................';
  return {
    kick: pattern(p.kick ?? empty),
    snare: pattern(p.snare ?? empty),
    clap: pattern(p.clap ?? empty),
    hat: pattern(p.hat ?? empty),
  };
}

export const DRUM_PRESETS: { id: string; name: string; plain: string; p: Partial<Record<Drum, string>> }[] = [
  {
    id: 'rock',
    name: 'Basic Rock',
    plain: 'Boom (kick) on 1 and 3, tak (snare) on 2 and 4. The most common beat in the world.',
    p: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
  },
  {
    id: 'edm',
    name: 'Four on the Floor (EDM)',
    plain: 'Kick on every beat. Perfect for rhythm games because the beat is super clear.',
    p: { kick: 'x...x...x...x...', clap: '....x.......x...', hat: '..x...x...x...x.' },
  },
  {
    id: 'chip',
    name: 'Chiptune Run',
    plain: 'Fast, busy and bouncy like old console games.',
    p: { kick: 'x.....x...x.....', snare: '....x.......x..x', hat: 'xxxxxxxxxxxxxxxx' },
  },
  {
    id: 'battle',
    name: 'Battle Drive',
    plain: 'Lots of kicks push forward. Makes you feel urgent.',
    p: { kick: 'x.x...x.x.x...x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
  },
  {
    id: 'lofi',
    name: 'Lo-fi Chill',
    plain: 'Lazy, laid-back kicks. Good for menus and cozy games.',
    p: { kick: 'x......x..x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xx' },
  },
  {
    id: 'calm',
    name: 'Calm Walk',
    plain: 'Very few hits. Leaves space for the melody.',
    p: { kick: 'x.......x.......', hat: '....x.......x...' },
  },
  { id: 'none', name: 'No drums', plain: 'Silence. Good for intros or sad scenes.', p: {} },
];

export const drumPreset = (id: string) => drumsFrom((DRUM_PRESETS.find((d) => d.id === id) ?? DRUM_PRESETS[0]).p);

export const emptyMelody = (bars: number) => Array<number | null>(bars * 8).fill(null);

/** Everything that should sound at one 16th-note step. Shared by playback and MIDI export. */
export interface NoteEvent {
  kind: 'chord' | 'bass' | 'melody';
  midi: number;
  step: number; // absolute 16th step
  len: number; // length in 16th steps
}
export interface DrumEvent {
  drum: Drum;
  step: number;
}

export function eventsAtStep(song: Song, s: number): { notes: NoteEvent[]; drums: DrumEvent[] } {
  const bars = song.progression.length;
  const bar = Math.floor(s / 16) % bars;
  const inBar = s % 16;
  const tonic = tonicFor(song.key);
  const notes: NoteEvent[] = [];
  const drums: DrumEvent[] = [];
  const mute = song.mute ?? {};

  if (!mute.drums) {
    (Object.keys(song.drums) as Drum[]).forEach((d) => {
      if (song.drums[d][inBar]) drums.push({ drum: d, step: s });
    });
  }

  const chord = chordOnDegree(tonic, song.scale, song.progression[bar]);
  // Keep chords from climbing too high: move notes above G4 down an octave.
  const voiced = chord.notes.map((n) => (n > 67 ? n - 12 : n)).sort((a, b) => a - b);

  if (!mute.chords) {
    if (song.chordStyle === 'block' && inBar === 0) {
      voiced.forEach((n) => notes.push({ kind: 'chord', midi: n, step: s, len: 16 }));
    } else if (song.chordStyle === 'pulse' && inBar % 4 === 0) {
      voiced.forEach((n) => notes.push({ kind: 'chord', midi: n, step: s, len: 3 }));
    } else if (song.chordStyle === 'arp' && inBar % 2 === 0) {
      const order = [0, 1, 2, 1];
      const i = (inBar / 2) % 4;
      const n = voiced[order[i]] + (inBar >= 8 && i === 2 ? 12 : 0);
      notes.push({ kind: 'chord', midi: n, step: s, len: 2 });
    }
  }

  if (song.bass && !mute.bass && (inBar === 0 || inBar === 8 || inBar === 14)) {
    const root = chord.root - 24;
    notes.push({ kind: 'bass', midi: root, step: s, len: inBar === 14 ? 2 : 6 });
  }

  if (!mute.melody && s % 2 === 0) {
    const idx = (s / 2) % song.melody.length;
    const row = song.melody[idx];
    if (row !== null && row !== undefined) {
      notes.push({ kind: 'melody', midi: degreeToMidi(tonic + 12, song.scale, row), step: s, len: 2 });
    }
  }
  return { notes, drums };
}

export function playStep(song: Song, s: number, time: number, stepDur: number) {
  const { notes, drums } = eventsAtStep(song, s);
  drums.forEach((d) => playDrum(d.drum, time, 0.9));
  const chordNotes = notes.filter((n) => n.kind === 'chord');
  if (chordNotes.length > 1) {
    playChord(
      chordNotes.map((n) => n.midi),
      { time, duration: chordNotes[0].len * stepDur * 0.95, instrument: song.chordInstrument, volume: 0.3 },
    );
  } else if (chordNotes.length === 1) {
    playNote(chordNotes[0].midi, { time, duration: chordNotes[0].len * stepDur, instrument: song.chordInstrument, volume: 0.18 });
  }
  notes
    .filter((n) => n.kind === 'bass')
    .forEach((n) => playNote(n.midi, { time, duration: n.len * stepDur * 0.9, instrument: 'bass', volume: 0.3 }));
  notes
    .filter((n) => n.kind === 'melody')
    .forEach((n) => playNote(n.midi, { time, duration: n.len * stepDur * 0.9, instrument: song.melodyInstrument, volume: 0.22 }));
}

export const totalSteps = (song: Song) => song.progression.length * 16;

/** Melody from a compact string: digits are rows, "." is silence, spaces ignored. */
export const mel = (s: string) =>
  s
    .replace(/\s/g, '')
    .split('')
    .map((c) => (c === '.' ? null : Number(c)));

/** Play a song from the start, once, for some bars. Used by quizzes. */
export function playOnce(song: Song, bars = 2, startTime?: number) {
  const t0 = startTime ?? audio().ctx.currentTime + 0.05;
  const stepDur = 60 / song.bpm / 4;
  for (let s = 0; s < bars * 16; s++) playStep(song, s, t0 + s * stepDur, stepDur);
}
