import { ComponentType } from 'react';
import L1Notes from './L1Notes';
import L2Beat from './L2Beat';
import L3Drums from './L3Drums';
import L4Scales from './L4Scales';
import L5Chords from './L5Chords';
import L6Progressions from './L6Progressions';
import LBass from './LBass';
import L7Melody from './L7Melody';
import L8Structure from './L8Structure';
import L9Moods from './L9Moods';
import L10Studio from './L10Studio';
import LAdvDrums from './LAdvDrums';
import LAdvMelody from './LAdvMelody';
import LAdvBass from './LAdvBass';
import LAdvLab from './LAdvLab';

export interface Lesson {
  id: string;
  title: string;
  short: string;
  emoji: string;
  unit: string;
  Component: ComponentType;
}

export const LESSONS: Lesson[] = [
  { id: 'notes', title: 'Notes & the Piano', short: 'High and low sounds, note names', emoji: '🎹', unit: 'Sound basics', Component: L1Notes },
  { id: 'beat', title: 'Beat & BPM', short: 'The heartbeat of music, and rhythm game timing', emoji: '⏱️', unit: 'Sound basics', Component: L2Beat },
  { id: 'drums', title: 'Rhythm & Drums', short: 'Make beats with a step sequencer', emoji: '🥁', unit: 'Sound basics', Component: L3Drums },
  { id: 'scales', title: 'Scales & Keys', short: 'Your color palette: happy, sad, dark', emoji: '🎨', unit: 'Harmony', Component: L4Scales },
  { id: 'chords', title: 'Chords', short: 'Notes played together', emoji: '🎼', unit: 'Harmony', Component: L5Chords },
  { id: 'progressions', title: 'Chord Progressions', short: '4 chords that tell a story', emoji: '🔁', unit: 'Harmony', Component: L6Progressions },
  { id: 'bass', title: 'Bass Lines', short: 'The low notes that give music power', emoji: '🎸', unit: 'Harmony', Component: LBass },
  { id: 'melody', title: 'Melody', short: 'Write the tune players remember', emoji: '🎤', unit: 'Composing', Component: L7Melody },
  { id: 'structure', title: 'Song Structure & Loops', short: 'Intro, verse, build-up, drop, looping BGM', emoji: '🧱', unit: 'Composing', Component: L8Structure },
  { id: 'moods', title: 'Game Music Recipes', short: 'Battle, town, boss, sad scene...', emoji: '🎮', unit: 'Game music', Component: L9Moods },
  { id: 'studio', title: 'Studio: Make Your Loop', short: 'Combine everything and export MIDI', emoji: '🎛️', unit: 'Game music', Component: L10Studio },
  { id: 'cool-drums', title: 'Cool Drums', short: 'Loud and soft hits, grooves, fills, build-up and drop', emoji: '🔥', unit: 'Level up', Component: LAdvDrums },
  { id: 'cool-melody', title: 'Cool Melodies', short: 'Motifs, question and answer, pushed notes, moods', emoji: '✨', unit: 'Level up', Component: LAdvMelody },
  { id: 'cool-bass', title: 'Cool Bass Lines', short: 'Octaves, team up with the kick, walk into chords', emoji: '⚡', unit: 'Level up', Component: LAdvBass },
  { id: 'remix-lab', title: 'Remix Lab', short: 'Mix grooves, bass styles and motifs into one chorus', emoji: '🧪', unit: 'Level up', Component: LAdvLab },
];
