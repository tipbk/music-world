// Plain music theory helpers. Notes are MIDI numbers: 60 = middle C.

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const noteName = (midi: number, withOctave = false) =>
  NOTE_NAMES[((midi % 12) + 12) % 12] + (withOctave ? String(Math.floor(midi / 12) - 1) : '');

export const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);

export type ScaleId =
  | 'major'
  | 'minor'
  | 'majorPenta'
  | 'minorPenta'
  | 'dorian'
  | 'mixolydian'
  | 'harmonicMinor';

export interface ScaleInfo {
  id: ScaleId;
  name: string;
  steps: number[]; // semitones from the home note
  mood: string;
  gameUse: string;
  sevenNotes: boolean; // can build chords on every note
}

export const SCALES: Record<ScaleId, ScaleInfo> = {
  major: {
    id: 'major',
    name: 'Major',
    steps: [0, 2, 4, 5, 7, 9, 11],
    mood: 'Happy, bright, safe',
    gameUse: 'Title screens, towns, victory, cute rhythm game songs',
    sevenNotes: true,
  },
  minor: {
    id: 'minor',
    name: 'Minor',
    steps: [0, 2, 3, 5, 7, 8, 10],
    mood: 'Sad, serious, emotional',
    gameUse: 'Battles, dramatic story scenes, cool EDM/rock rhythm tracks',
    sevenNotes: true,
  },
  majorPenta: {
    id: 'majorPenta',
    name: 'Major Pentatonic (5 notes)',
    steps: [0, 2, 4, 7, 9],
    mood: 'Happy and impossible to sound wrong',
    gameUse: 'Easy melodies, adventure fields, Asian-flavored themes',
    sevenNotes: false,
  },
  minorPenta: {
    id: 'minorPenta',
    name: 'Minor Pentatonic (5 notes)',
    steps: [0, 3, 5, 7, 10],
    mood: 'Cool, bluesy, rock',
    gameUse: 'Guitar solos, action stages, boss intros',
    sevenNotes: false,
  },
  dorian: {
    id: 'dorian',
    name: 'Dorian',
    steps: [0, 2, 3, 5, 7, 9, 10],
    mood: 'Minor but hopeful, mysterious',
    gameUse: 'Adventure, exploring ruins, fantasy forests',
    sevenNotes: true,
  },
  mixolydian: {
    id: 'mixolydian',
    name: 'Mixolydian',
    steps: [0, 2, 4, 5, 7, 9, 10],
    mood: 'Happy but tough, heroic',
    gameUse: 'Hero themes, racing, rock stages',
    sevenNotes: true,
  },
  harmonicMinor: {
    id: 'harmonicMinor',
    name: 'Harmonic Minor',
    steps: [0, 2, 3, 5, 7, 8, 11],
    mood: 'Dark, dramatic, exotic',
    gameUse: 'Boss fights, dungeons, villains, desert levels',
    sevenNotes: true,
  },
};

export const HARMONY_SCALES: ScaleId[] = ['major', 'minor', 'dorian', 'mixolydian', 'harmonicMinor'];

/** MIDI note for a scale degree (0 = home note). Degrees past the scale wrap into the next octave. */
export function degreeToMidi(tonic: number, scale: ScaleId, degree: number) {
  const steps = SCALES[scale].steps;
  const len = steps.length;
  const oct = Math.floor(degree / len);
  const idx = ((degree % len) + len) % len;
  return tonic + steps[idx] + 12 * oct;
}

export type ChordQuality = 'major' | 'minor' | 'dim' | 'aug';

export interface Chord {
  degree: number;
  notes: number[];
  root: number;
  quality: ChordQuality;
  name: string;
  roman: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function qualityOf(notes: number[]): ChordQuality {
  const third = notes[1] - notes[0];
  const fifth = notes[2] - notes[0];
  if (third === 4 && fifth === 8) return 'aug';
  if (third === 3 && fifth === 6) return 'dim';
  return third === 4 ? 'major' : 'minor';
}

/** Build a 3-note chord on a scale degree by stacking every other note of the scale. */
export function chordOnDegree(tonic: number, scale: ScaleId, degree: number): Chord {
  const notes = [0, 2, 4].map((d) => degreeToMidi(tonic, scale, degree + d));
  const quality = qualityOf(notes);
  const r = ROMAN[degree % 7];
  const roman =
    quality === 'major' ? r : quality === 'minor' ? r.toLowerCase() : quality === 'dim' ? r.toLowerCase() + '°' : r + '+';
  const suffix = quality === 'major' ? '' : quality === 'minor' ? 'm' : quality === 'dim' ? 'dim' : 'aug';
  return { degree, notes, root: notes[0], quality, name: noteName(notes[0]) + suffix, roman };
}

export function buildChord(root: number, quality: ChordQuality) {
  const shape = { major: [0, 4, 7], minor: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8] }[quality];
  return shape.map((s) => root + s);
}

/** Keep the home note in a comfortable range around middle C. */
export const tonicFor = (key: number) => 60 + (key > 6 ? key - 12 : key);

export interface Progression {
  id: string;
  name: string;
  scale: ScaleId;
  degrees: number[];
  feel: string;
  gameUse: string;
}

export const PROGRESSIONS: Progression[] = [
  {
    id: 'pop',
    name: 'The Hit Maker',
    scale: 'major',
    degrees: [0, 4, 5, 3],
    feel: 'Happy and catchy. Used in thousands of pop songs.',
    gameUse: 'Opening themes, happy rhythm game songs',
  },
  {
    id: 'royal',
    name: 'Royal Road (Japanese pop favorite)',
    scale: 'major',
    degrees: [3, 4, 2, 5],
    feel: 'Emotional, rising, makes your heart move. Very common in J-pop and anime.',
    gameUse: 'Rhythm game choruses, anime-style openings, emotional story moments',
  },
  {
    id: 'epic',
    name: 'Epic Battle',
    scale: 'minor',
    degrees: [0, 5, 2, 6],
    feel: 'Serious but powerful. Feels like a hero fighting.',
    gameUse: 'Battle themes, EDM drops, rock rhythm tracks',
  },
  {
    id: 'sad',
    name: 'Sad Memory',
    scale: 'major',
    degrees: [5, 3, 0, 4],
    feel: 'Bittersweet. Starts sad, ends with a little hope.',
    gameUse: 'Story cutscenes, ending credits, emotional ballads',
  },
  {
    id: 'town',
    name: 'Peaceful Town',
    scale: 'major',
    degrees: [0, 3, 0, 4],
    feel: 'Calm, simple, safe. Like home.',
    gameUse: 'Villages, shops, menus, farming games',
  },
  {
    id: 'dungeon',
    name: 'Dark Dungeon',
    scale: 'harmonicMinor',
    degrees: [0, 3, 4, 0],
    feel: 'Tense and dramatic. The 3rd chord pulls hard back home.',
    gameUse: 'Dungeons, boss fights, villain themes',
  },
  {
    id: 'adventure',
    name: 'Mystery Adventure',
    scale: 'dorian',
    degrees: [0, 3, 0, 3],
    feel: 'Curious and floating. Minor but not sad.',
    gameUse: 'Exploring forests, ruins, open fields',
  },
  {
    id: 'hero',
    name: 'Hero Rock',
    scale: 'mixolydian',
    degrees: [0, 6, 3, 0],
    feel: 'Bold and confident. Classic rock feeling.',
    gameUse: 'Hero themes, racing, final stage',
  },
];

export const findProgression = (id: string) => PROGRESSIONS.find((p) => p.id === id) ?? PROGRESSIONS[0];
