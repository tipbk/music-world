import { findProgression } from './theory';
import { drumPreset, mel, Song } from './song';
import { Instrument } from '../audio/engine';

export interface Recipe {
  id: string;
  scene: string;
  emoji: string;
  why: string[];
  song: Song;
}

function make(opts: {
  bpm: number;
  key: number;
  prog: string;
  drums: string;
  style: Song['chordStyle'];
  chord: Instrument;
  lead: Instrument;
  melody: string;
  bass?: boolean;
}): Song {
  const p = findProgression(opts.prog);
  return {
    bpm: opts.bpm,
    key: opts.key,
    scale: p.scale,
    progression: p.degrees,
    drums: drumPreset(opts.drums),
    melody: mel(opts.melody),
    chordInstrument: opts.chord,
    melodyInstrument: opts.lead,
    chordStyle: opts.style,
    bass: opts.bass ?? true,
  };
}

export const RECIPES: Recipe[] = [
  {
    id: 'town',
    scene: 'Peaceful Town',
    emoji: '🏡',
    why: ['Medium-slow speed (95 BPM)', 'Major scale = happy, safe', 'Soft drums, gentle arpeggio', 'Simple melody that steps up and down'],
    song: make({ bpm: 95, key: 5, prog: 'town', drums: 'calm', style: 'arp', chord: 'pluck', lead: 'chip', melody: '4.2.0.2. 5.7.5.3. 4.2.4.7. 6.5.4...' }),
  },
  {
    id: 'field',
    scene: 'Adventure Field',
    emoji: '🌄',
    why: ['Walking speed (120 BPM)', 'Dorian = curious, a little mysterious', 'Steady pulse chords make you want to move', 'Melody with long notes = wide open space'],
    song: make({ bpm: 120, key: 2, prog: 'adventure', drums: 'lofi', style: 'pulse', chord: 'piano', lead: 'lead', melody: '0.2.4..5 3...5.7. 7.5.4..2 3...2.1.' }),
  },
  {
    id: 'battle',
    scene: 'Battle!',
    emoji: '⚔️',
    why: ['Fast (160 BPM)', 'Minor scale = serious', 'Many kicks push forward', 'Fast arpeggio adds excitement'],
    song: make({ bpm: 160, key: 9, prog: 'epic', drums: 'battle', style: 'arp', chord: 'pluck', lead: 'lead', melody: '0.0.2.4. 5.4.5.7. 6.4.2.4. 6...8...' }),
  },
  {
    id: 'boss',
    scene: 'Final Boss',
    emoji: '👹',
    why: ['Very fast (172 BPM)', 'Harmonic minor = dark and dramatic', 'The V chord has a strong pull = tension', 'Chip sound arpeggio for that classic boss feeling'],
    song: make({ bpm: 172, key: 4, prog: 'dungeon', drums: 'chip', style: 'arp', chord: 'chip', lead: 'lead', melody: '0.1.2.0. 3.2.3.5. 4.6.7.6. 4...0...' }),
  },
  {
    id: 'sad',
    scene: 'Sad Story Scene',
    emoji: '😢',
    why: ['Slow (70 BPM)', 'Starts on the minor chord (vi)', 'No drums = space for emotion', 'Long, soft pad chords and piano'],
    song: make({ bpm: 70, key: 0, prog: 'sad', drums: 'none', style: 'block', chord: 'pad', lead: 'piano', melody: '7...5... 5...3... 4...2... 1.......', bass: false }),
  },
  {
    id: 'victory',
    scene: 'Victory / Hero',
    emoji: '🏆',
    why: ['Upbeat (130 BPM)', 'Mixolydian = happy but strong', 'Rock beat', 'Melody jumps up = triumph'],
    song: make({ bpm: 130, key: 7, prog: 'hero', drums: 'rock', style: 'pulse', chord: 'chip', lead: 'chip', melody: '0.2.4.7. 6...8... 7.5.3.5. 7.......' }),
  },
  {
    id: 'rhythm',
    scene: 'Rhythm Game Chorus',
    emoji: '🎧',
    why: ['Rhythm game speed (150 BPM)', 'Royal Road chords = emotional J-pop feeling', 'Four-on-the-floor kick = easy to follow', 'Catchy, repeating hook'],
    song: make({ bpm: 150, key: 2, prog: 'royal', drums: 'edm', style: 'arp', chord: 'pluck', lead: 'lead', melody: '7.7.5.7. 8.7.6.4. 6.4.2.4. 5.4.5.7.' }),
  },
  {
    id: 'dungeon',
    scene: 'Spooky Dungeon',
    emoji: '🕯️',
    why: ['Slow-ish (90 BPM)', 'Harmonic minor = exotic and dark', 'Very few drums = empty, scary', 'Sparse melody with long gaps'],
    song: make({ bpm: 90, key: 11, prog: 'dungeon', drums: 'calm', style: 'block', chord: 'pad', lead: 'piano', melody: '0....... 3...2... 4...6... 7.......' }),
  },
];
