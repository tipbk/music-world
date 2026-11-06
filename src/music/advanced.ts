// Building blocks for the "Level Up" lessons: grooves with loud/soft hits, fills, smarter bass lines and melodies.
import { audio, Instrument, KitSound, playKit, playNote } from '../audio/engine';
import { chordOnDegree, degreeToMidi, ScaleId, tonicFor } from './theory';
import { ChordStyle, drumsFrom, emptyMelody, playStep, Song } from './song';

/**
 * A groove is one text line per drum. Each character is one 16th-note box:
 * "." = nothing, "g" = ghost note (very soft), "x" = normal hit, "X" = accent (loud).
 * A line can be 16 long (repeats every bar) or longer (for several bars).
 */
export type Groove = Partial<Record<KitSound, string>>;

export const HIT_VOLUME: Record<string, number> = { g: 0.22, x: 0.75, X: 1.15 };

export interface GroovePreset {
  id: string;
  name: string;
  bpm: number;
  swing?: number;
  plain: string;
  game: string;
  g: Groove;
}

export const GROOVES: GroovePreset[] = [
  {
    id: 'rock',
    name: 'Plain Rock',
    bpm: 110,
    plain: 'Every hit is the same loudness. It works, but it sounds a bit like a robot.',
    game: 'A safe base for anything.',
    g: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
  },
  {
    id: 'rockGhost',
    name: 'Rock with Ghost Notes',
    bpm: 110,
    plain: 'Same beat, but the hi-hat is loud on the beat and soft between, and tiny "ghost" snares sneak in. Sounds like a real drummer.',
    game: 'Rock stages, hero themes, anime openings.',
    g: { kick: 'X.......X.x.....', snare: '....X..g.g..X..g', hat: 'X.x.X.x.X.x.X.x.' },
  },
  {
    id: 'house',
    name: 'House / Four on the Floor',
    bpm: 124,
    plain: 'Kick on every beat, and an open hi-hat on every "and" between the kicks: boom-TSS, boom-TSS.',
    game: 'Easy rhythm game songs, dance stages, menus with energy.',
    g: { kick: 'X...X...X...X...', clap: '....x.......x...', openhat: '..x...x...x...x.', hat: 'g.g.g.g.g.g.g.g.' },
  },
  {
    id: 'breakbeat',
    name: 'Breakbeat',
    bpm: 130,
    plain: 'The kick jumps around instead of sitting on each beat. Bouncy, a bit messy in a cool way.',
    game: 'Street, city, skateboard and racing games.',
    g: { kick: 'X.x.......xx....', snare: '....X..g.g..X..g', hat: 'x.x.x.x.x.x.x.x.' },
  },
  {
    id: 'dnb',
    name: 'Drum & Bass',
    bpm: 172,
    plain: 'Very fast. Kick on 1, snare on 2 and 4, and the second kick comes late, between beats 3 and 4.',
    game: 'Hard rhythm game songs, speed levels, futuristic racing.',
    g: { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.xgx.xgx.xgx.xg' },
  },
  {
    id: 'halftime',
    name: 'Half-time (Trap / Dubstep)',
    bpm: 140,
    plain: 'The snare comes only once per bar, on beat 3. The song feels half as fast and heavy, even with a fast BPM.',
    game: 'Boss drops, heavy villain themes, slow-motion moments.',
    g: { kick: 'X......x..x.....', snare: '........X.......', hat: 'x.x.x.x.x.x.xxxx' },
  },
  {
    id: 'shuffle',
    name: 'Lo-fi Shuffle',
    bpm: 85,
    swing: 0.35,
    plain: 'Lazy kicks, soft snare, and "swing": every second little box comes a bit late. Feels relaxed and human.',
    game: 'Cafes, cozy menus, night town, study music.',
    g: { kick: 'X......x..x.....', snare: '....x.......x...', rim: '..........g.....', hat: 'x.gxx.gxx.gxx.gx' },
  },
  {
    id: 'dembow',
    name: 'Reggaeton (Dembow)',
    bpm: 96,
    plain: 'Kick on every beat, snare on a "boom-ch-boom-chick" pattern. Very easy to dance to.',
    game: 'Beach levels, party scenes, summer events.',
    g: { kick: 'X...X...X...X...', snare: '...x..x....x..x.', hat: 'x.x.x.x.x.x.x.x.' },
  },
  {
    id: 'jcore',
    name: 'Rhythm Game Rush',
    bpm: 176,
    plain: 'Kick on every beat, fast 16th hi-hats with loud-soft accents, and an extra snare at the end of the bar.',
    game: 'The classic fast rhythm game chorus (J-core, speedy anime style).',
    g: { kick: 'X...X...X...X...', snare: '....X.......X.x.', hat: 'XgxgXgxgXgxgXgxg', openhat: '..............x.' },
  },
];

export const findGroove = (id: string) => GROOVES.find((g) => g.id === id) ?? GROOVES[0];

export interface FillPreset {
  id: string;
  name: string;
  plain: string;
  g: Groove | null;
}

/** A fill replaces the drums in the LAST bar of a 4-bar loop. */
export const FILLS: FillPreset[] = [
  { id: 'none', name: 'No fill', plain: 'The same beat 4 times. Fine, but you never feel the loop restart.', g: null },
  {
    id: 'snareRoll',
    name: 'Snare roll',
    plain: 'The snare plays faster and louder at the end of bar 4. Says "here it comes again!"',
    g: { kick: 'X.......X.......', hat: 'x.x.x.x.........', snare: '........xxxxXXXX' },
  },
  {
    id: 'toms',
    name: 'Tom run',
    plain: 'Rolls down from snare to high tom to low tom, like a real drummer going around the kit.',
    g: { kick: 'X...............', hat: 'x.x.x.x.........', snare: '........XX......', tomHi: '..........xx....', tomLo: '............xxXX' },
  },
  {
    id: 'stop',
    name: 'Stop! (break)',
    plain: 'The drums stop after beat 2. The silence makes the next bar hit really hard.',
    g: { kick: 'X.......', snare: '....X...' },
  },
  {
    id: 'kicks',
    name: 'Kick & snare hits',
    plain: 'The whole band hits together on short accents. Sounds like a big punch before the next part.',
    g: { kick: 'X.....X.....X...', snare: 'X.....X.....X.xx', crash: '............x...' },
  },
];

export const findFill = (id: string) => FILLS.find((f) => f.id === id) ?? FILLS[0];

/**
 * Bass lines: one character per 16th box. Notes come from the chord playing now:
 * R = root, 3 = third, 5 = fifth, O = root an octave up,
 * N = the NEXT chord's root (played early),
 * A = lead-in: the scale note just below the next chord's root,
 * C = lead-in: the note a half step (one piano key) below the next chord's root,
 * "-" = keep holding, "." = silence.
 */
export interface BassStyle {
  id: string;
  name: string;
  line: string;
  plain: string;
  game: string;
}

export const BASS_STYLES: BassStyle[] = [
  { id: 'long', name: 'Long Notes', line: 'R---------------', plain: 'One long root note per chord. The starting point.', game: 'Calm and sad scenes.' },
  { id: 'disco', name: 'Disco Octaves', line: 'R.O.R.O.R.O.R.O.', plain: 'Short notes jumping between low and high root. Each note is cut short, so it bounces.', game: 'Dance stages, happy rhythm game songs.' },
  { id: 'offbeat', name: 'Off-beat Pump', line: '..R-..R-..R-..R-', plain: 'Plays only between the kicks. Kick and bass take turns: boom-WOM, boom-WOM.', game: 'EDM, trance, fast rhythm game choruses.' },
  { id: 'walk', name: 'Walking Bass', line: 'R---3---5---A---', plain: 'One note per beat, climbing through the chord, and the last note steps into the next chord.', game: 'Cafes, jazzy shops, detective scenes.' },
  { id: 'funk', name: 'Funky Syncopation', line: 'R..R..O...R.5.R.', plain: 'Notes land between the beats a lot. Bouncy and groovy.', game: 'City levels, cool characters, shops.' },
  { id: 'chip', name: 'Chiptune Arpeggio', line: 'R.O.5.O.R.O.5.O.', plain: 'Root, octave and fifth hopping fast, like old game consoles.', game: 'Retro 8-bit levels.' },
  { id: 'drive', name: 'Driving 8ths + Lead-in', line: 'R.R.R.R.R.R.5.A.', plain: 'Steady root 8ths, then 2 notes that walk into the next chord.', game: 'Battle, racing, rock stages.' },
  { id: 'push', name: 'Pushed (plays early)', line: '-------.R.R...N-', plain: 'The next chord\'s root comes one box early and keeps ringing. It pulls the song forward.', game: 'Anime openings, emotional rhythm game choruses.' },
  { id: 'wobble', name: 'Half-time Heavy', line: 'R-------.....O-5', plain: 'One huge long note, then a little jump at the end. Heavy and slow-feeling.', game: 'Boss drops, dubstep-style breakdowns.' },
];

export const findBass = (id: string) => BASS_STYLES.find((b) => b.id === id) ?? BASS_STYLES[0];

/** Bass that plays exactly where the kick plays. */
export const bassFollowKick = (kick: string) =>
  kick
    .slice(0, 16)
    .split('')
    .map((c) => (c === '.' ? '.' : 'R'))
    .join('');

/** Bass that plays on the 8th-note boxes where the kick does NOT play. */
export const bassFillGaps = (kick: string) =>
  kick
    .slice(0, 16)
    .split('')
    .map((c, i) => (c === '.' && i % 2 === 0 && kick[i + 1] !== 'x' && kick[i + 1] !== 'X' ? 'R' : '.'))
    .join('');

/** A melody note: start box (16ths), scale row (0 = home note), length in boxes. */
export type MNote = [step: number, row: number, len: number];

/** 8th-note grid (like MelodyGrid) to notes. Each note holds until the next note, at most a beat. */
export function notesFrom8ths(cells: (number | null)[], offset = 0): MNote[] {
  const out: MNote[] = [];
  cells.forEach((r, i) => {
    if (r === null || r === undefined) return;
    let len = 1;
    while (len < 2 && i + len < cells.length && cells[i + len] === null) len++;
    out.push([offset + i * 2, r, len * 2]);
  });
  return out;
}

export interface Jam {
  bpm: number;
  key: number;
  scale: ScaleId;
  progression: number[];
  groove: Groove;
  fill?: Groove | null; // replaces the groove in the last bar
  crash?: boolean; // crash cymbal on the very first beat of the loop
  swing?: number; // 0 = straight, 0.5 = very swung
  bass?: string | null;
  chordStyle: ChordStyle | 'none';
  chordInstrument: Instrument;
  melody?: MNote[];
  melodyInstrument?: Instrument;
  mute?: Partial<Record<'drums' | 'chords' | 'bass' | 'melody', boolean>>;
}

export const jamSteps = (j: Jam) => j.progression.length * 16;

function bassMidi(j: Jam, bar: number, c: string) {
  const tonic = tonicFor(j.key);
  const deg = j.progression[bar % j.progression.length];
  const nextDeg = j.progression[(bar + 1) % j.progression.length];
  const chord = chordOnDegree(tonic, j.scale, deg);
  const root = chord.notes[0] - 24;
  const nextRoot = chordOnDegree(tonic, j.scale, nextDeg).notes[0] - 24;
  // Keep "next" notes close to the current root.
  const near = (n: number) => (n - root > 7 ? n - 12 : root - n > 7 ? n + 12 : n);
  switch (c) {
    case '3':
      return chord.notes[1] - 24;
    case '5':
      return chord.notes[2] - 24;
    case 'O':
      return root + 12;
    case 'N':
      return near(nextRoot);
    case 'A':
      return near(degreeToMidi(tonic, j.scale, nextDeg - 1) - 24);
    case 'C':
      return near(nextRoot) - 1;
    default:
      return root;
  }
}

/** Play everything for one 16th box of a jam. */
export function playJamStep(j: Jam, s: number, time: number, stepDur: number) {
  const bars = j.progression.length;
  const bar = Math.floor(s / 16) % bars;
  const inBar = s % 16;
  const t = time + (s % 2 === 1 ? (j.swing ?? 0) * stepDur : 0);
  const mute = j.mute ?? {};

  if (!mute.chords && j.chordStyle !== 'none') {
    const song: Song = {
      bpm: j.bpm,
      key: j.key,
      scale: j.scale,
      progression: j.progression,
      drums: drumsFrom({}),
      melody: emptyMelody(bars),
      chordInstrument: j.chordInstrument,
      melodyInstrument: 'piano',
      chordStyle: j.chordStyle,
      bass: false,
    };
    playStep(song, s, t, stepDur);
  }

  if (!mute.drums) {
    const useFill = j.fill && bar === bars - 1;
    const g = useFill ? j.fill! : j.groove;
    (Object.keys(g) as KitSound[]).forEach((d) => {
      const line = g[d]!;
      const c = useFill ? line[inBar] : line[s % line.length];
      if (c && HIT_VOLUME[c]) playKit(d, t, HIT_VOLUME[c]);
    });
    if (j.crash && s === 0) playKit('crash', t, 0.9);
  }

  if (j.bass && !mute.bass) {
    const line = j.bass;
    const i = s % line.length;
    let c = line[i];
    if (c === '-' && s === 0) c = 'R'; // nothing to hold at the very start
    if (c && c !== '.' && c !== '-') {
      let len = 1;
      while (len < 16 && line[(i + len) % line.length] === '-') len++;
      playNote(bassMidi(j, bar, c), { time: t, duration: len * stepDur * 0.92, instrument: 'bass', volume: 0.32 });
    }
  }

  if (j.melody && !mute.melody) {
    const tonic = tonicFor(j.key) + 12;
    const total = bars * 16;
    j.melody.forEach(([st, row, len]) => {
      if (((st % total) + total) % total === s % total)
        playNote(degreeToMidi(tonic, j.scale, row), { time: t, duration: len * stepDur * 0.9, instrument: j.melodyInstrument ?? 'lead', volume: 0.22 });
    });
  }
}

/** Play a jam once from the start. Used by quizzes. */
export function playJamOnce(j: Jam, bars = 2) {
  const t0 = audio().ctx.currentTime + 0.05;
  const stepDur = 60 / j.bpm / 4;
  for (let s = 0; s < bars * 16; s++) playJamStep(j, s, t0 + s * stepDur, stepDur);
}

// --- Motifs: a 1-bar idea (8 cells of 8th notes) that grows into 4 bars ---

export type Cells = (number | null)[];

export const MOTIF_MOVES: { id: string; name: string; plain: string }[] = [
  { id: 'same', name: 'Same again', plain: 'Exact copy. Repetition makes it catchy.' },
  { id: 'follow', name: 'Follow the chord', plain: 'Moves the whole idea up or down so it starts on the new chord. Very common trick.' },
  { id: 'up', name: 'Move up 1', plain: 'Same shape, one note higher. Feels like rising.' },
  { id: 'down', name: 'Move down 1', plain: 'Same shape, one note lower. Feels like calming down.' },
  { id: 'answer', name: 'Answer (go home)', plain: 'Same start, but the last note lands on the home note. Feels finished.' },
  { id: 'half', name: 'First half twice', plain: 'Takes only the first half and says it twice. Short and punchy.' },
  { id: 'back', name: 'Backwards', plain: 'Plays the notes in reverse order. Same notes, new shape.' },
  { id: 'rest', name: 'Silence', plain: 'Nothing. Leaves space so the next idea feels fresh.' },
];

const fitRange = (cells: Cells, max = 9): Cells => {
  const vals = cells.filter((x): x is number => x !== null);
  if (!vals.length) return cells;
  let shift = 0;
  if (Math.max(...vals) > max) shift = -7;
  if (Math.min(...vals) < 0) shift = 7;
  return cells.map((x) => (x === null ? null : Math.max(0, Math.min(max, x + shift))));
};

export function moveMotif(motif: Cells, move: string, fromDeg: number, toDeg: number): Cells {
  const shift = (n: number) => fitRange(motif.map((x) => (x === null ? null : x + n)));
  switch (move) {
    case 'follow': {
      let d = (((toDeg - fromDeg) % 7) + 7) % 7;
      if (d > 3) d -= 7;
      return shift(d);
    }
    case 'up':
      return shift(1);
    case 'down':
      return shift(-1);
    case 'answer': {
      const out = [...motif];
      let last = -1;
      out.forEach((x, i) => x !== null && (last = i));
      if (last >= 0) out[last] = Math.abs(out[last]! - 7) < Math.abs(out[last]!) ? 7 : 0;
      return out;
    }
    case 'half': {
      const h = motif.slice(0, motif.length / 2);
      return [...h, ...h];
    }
    case 'back': {
      const notes = motif.filter((x) => x !== null);
      let k = notes.length - 1;
      return motif.map((x) => (x === null ? null : notes[k--]));
    }
    case 'rest':
      return motif.map(() => null);
    default:
      return [...motif];
  }
}

/** Bar 1 = the motif, bars 2..4 = the motif changed by each move. */
export function growMotif(motif: Cells, progression: number[], plan: string[]): Cells {
  const out: Cells = [...motif];
  plan.forEach((m, i) => out.push(...moveMotif(motif, m, progression[0], progression[(i + 1) % progression.length])));
  return out;
}
