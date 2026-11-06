import { useState } from 'react';
import { Instrument } from '../audio/engine';
import {
  BASS_STYLES,
  bassFillGaps,
  bassFollowKick,
  Cells,
  findBass,
  findFill,
  findGroove,
  FILLS,
  GROOVES,
  growMotif,
  Jam,
  MOTIF_MOVES,
  notesFrom8ths,
} from '../music/advanced';
import { ChordStyle, mel } from '../music/song';
import { findProgression, PROGRESSIONS, tonicFor } from '../music/theory';
import { BassLane, GrooveGrid, JamChords, useJam } from '../components/JamPlayer';
import { Box, InstrumentSelect, KeySelect, MelodyGrid, PlayButton, Section, Select, Slider } from '../components/ui';

interface Mix {
  progId: string;
  key: number;
  bpm: number;
  grooveId: string;
  fillId: string;
  crash: boolean;
  bassId: string; // a BASS_STYLES id, or "follow" / "gaps"
  chordStyle: ChordStyle | 'none';
  chordInst: Instrument;
  melInst: Instrument;
  motif: Cells;
  plan: string[];
}

const PRESETS: { id: string; name: string; plain: string; mix: Mix }[] = [
  {
    id: 'rhythm',
    name: '🎶 Rhythm game chorus',
    plain: 'Royal Road chords, fast rush drums, off-beat bass, a motif that follows the chords, and a snare roll fill.',
    mix: {
      progId: 'royal',
      key: 2,
      bpm: 170,
      grooveId: 'jcore',
      fillId: 'snareRoll',
      crash: true,
      bassId: 'offbeat',
      chordStyle: 'pulse',
      chordInst: 'pluck',
      melInst: 'lead',
      motif: mel('4.45.4.2'),
      plan: ['follow', 'follow', 'answer'],
    },
  },
  {
    id: 'battle',
    name: '⚔️ Battle theme',
    plain: 'Epic Battle chords in minor, rock drums with ghost notes, driving bass that walks into each chord, tom fill.',
    mix: {
      progId: 'epic',
      key: 9,
      bpm: 150,
      grooveId: 'rockGhost',
      fillId: 'toms',
      crash: true,
      bassId: 'drive',
      chordStyle: 'pulse',
      chordInst: 'lead',
      melInst: 'chip',
      motif: mel('0.0.2.34'),
      plan: ['follow', 'up', 'follow'],
    },
  },
  {
    id: 'cafe',
    name: '☕ Cozy cafe BGM',
    plain: 'Lo-fi shuffle drums with swing, walking bass, soft arpeggios, and a gentle motif with question and answer.',
    mix: {
      progId: 'town',
      key: 5,
      bpm: 84,
      grooveId: 'shuffle',
      fillId: 'none',
      crash: false,
      bassId: 'walk',
      chordStyle: 'arp',
      chordInst: 'piano',
      melInst: 'pluck',
      motif: mel('2.4.5...'),
      plan: ['down', 'same', 'rest'],
    },
  },
  {
    id: 'boss',
    name: '👹 Boss drop',
    plain: 'Dark dungeon chords, heavy half-time drums, huge long bass, and a stop before the loop restarts.',
    mix: {
      progId: 'dungeon',
      key: 4,
      bpm: 140,
      grooveId: 'halftime',
      fillId: 'stop',
      crash: true,
      bassId: 'wobble',
      chordStyle: 'block',
      chordInst: 'pad',
      melInst: 'lead',
      motif: mel('0.1.0.6.'),
      plan: ['same', 'up', 'half'],
    },
  },
];

export default function LAdvLab() {
  const [mix, setMix] = useState<Mix>(PRESETS[0].mix);
  const [presetId, setPresetId] = useState('rhythm');
  const set = <K extends keyof Mix>(k: K, v: Mix[K]) => {
    setMix({ ...mix, [k]: v });
    setPresetId('');
  };
  const prog = findProgression(mix.progId);
  const groove = findGroove(mix.grooveId);
  const kick = groove.g.kick ?? '';
  const bassLine = mix.bassId === 'follow' ? bassFollowKick(kick) : mix.bassId === 'gaps' ? bassFillGaps(kick) : findBass(mix.bassId).line;
  const melody = growMotif(mix.motif, prog.degrees, mix.plan);
  const jam: Jam = {
    bpm: mix.bpm,
    key: mix.key,
    scale: prog.scale,
    progression: prog.degrees,
    groove: groove.g,
    swing: groove.swing,
    fill: findFill(mix.fillId).g,
    crash: mix.crash,
    bass: bassLine,
    chordStyle: mix.chordStyle,
    chordInstrument: mix.chordInst,
    melody: notesFrom8ths(melody),
    melodyInstrument: mix.melInst,
  };
  const p = useJam(jam);
  const preset = PRESETS.find((x) => x.id === presetId);

  return (
    <>
      <Section title="Mix everything you learned">
        <p>
          Pick a recipe to start, listen, then change <b>one thing at a time</b>. Every choice here is something from the last 3
          lessons. Changes are heard while it plays.
        </p>
        <div className="row wrap">
          {PRESETS.map((x) => (
            <button
              key={x.id}
              className={`btn ${x.id === presetId ? 'btn-primary' : ''}`}
              onClick={() => {
                setMix(x.mix);
                setPresetId(x.id);
              }}
            >
              {x.name}
            </button>
          ))}
        </div>
        {preset && <p className="muted">{preset.plain}</p>}
        <div className="row wrap">
          <PlayButton playing={p.playing} onClick={p.toggle} label="Play loop" />
          <Slider label="Speed" value={mix.bpm} min={60} max={200} unit="BPM" onChange={(v) => set('bpm', v)} />
        </div>
        <JamChords jam={jam} step={p.step} />
      </Section>

      <Section title="🎼 Chords">
        <div className="row wrap">
          <Select label="Chords" value={mix.progId} onChange={(v) => set('progId', v)} options={PROGRESSIONS.map((x) => ({ value: x.id, label: x.name }))} />
          <KeySelect value={mix.key} onChange={(v) => set('key', v)} />
          <Select
            label="Chord style"
            value={mix.chordStyle}
            onChange={(v) => set('chordStyle', v)}
            options={[
              { value: 'block', label: 'Long chords' },
              { value: 'pulse', label: 'Pulse on each beat' },
              { value: 'arp', label: 'Arpeggio' },
              { value: 'none', label: 'No chords' },
            ]}
          />
          <InstrumentSelect label="Chord sound" value={mix.chordInst} onChange={(v) => set('chordInst', v)} />
        </div>
      </Section>

      <Section title="🥁 Drums">
        <div className="row wrap">
          <Select label="Groove" value={mix.grooveId} onChange={(v) => set('grooveId', v)} options={GROOVES.map((g) => ({ value: g.id, label: g.name }))} />
          <Select label="Fill in bar 4" value={mix.fillId} onChange={(v) => set('fillId', v)} options={FILLS.map((f) => ({ value: f.id, label: f.name }))} />
          <label className="check">
            <input type="checkbox" checked={mix.crash} onChange={(e) => set('crash', e.target.checked)} /> Crash on bar 1
          </label>
        </div>
        <GrooveGrid groove={groove.g} step={p.step} />
      </Section>

      <Section title="🎸 Bass">
        <Select
          label="Bass style"
          value={mix.bassId}
          onChange={(v) => set('bassId', v)}
          options={[
            ...BASS_STYLES.map((b) => ({ value: b.id, label: b.name })),
            { value: 'follow', label: 'Follow the kick' },
            { value: 'gaps', label: 'Fill the kick gaps' },
          ]}
        />
        <BassLane line={bassLine} kick={kick} step={p.step} />
      </Section>

      <Section title="🎤 Melody">
        <p>Your 1-bar motif, and what happens to it in bars 2 to 4.</p>
        <MelodyGrid
          melody={mix.motif}
          onChange={(m) => set('motif', m)}
          tonic={tonicFor(mix.key) + 12}
          scale={prog.scale}
          step={p.step}
          instrument={mix.melInst}
          chordTones={() => [0, 2, 4].map((x) => prog.degrees[0] + x)}
        />
        <div className="row wrap">
          {mix.plan.map((m, i) => (
            <Select
              key={i}
              label={`Bar ${i + 2}`}
              value={m}
              onChange={(v) => set('plan', mix.plan.map((x, j) => (j === i ? v : x)))}
              options={MOTIF_MOVES.map((o) => ({ value: o.id, label: o.name }))}
            />
          ))}
          <InstrumentSelect label="Melody sound" value={mix.melInst} onChange={(v) => set('melInst', v)} />
        </div>
        <MelodyGrid
          melody={melody}
          onChange={() => {}}
          tonic={tonicFor(mix.key) + 12}
          scale={prog.scale}
          step={p.step}
          instrument={mix.melInst}
          chordTones={(c) => [0, 2, 4].map((x) => prog.degrees[Math.floor(c / 8) % prog.degrees.length] + x)}
        />
      </Section>

      <Box kind="try" title="Challenge">
        Start from "Rhythm game chorus". Change only the <b>groove</b> to Drum &amp; Bass and the <b>bass</b> to Disco Octaves.
        Then try making the motif yourself. When you like it, rebuild the same idea in the Studio (or your music app) and make it
        longer: intro, build-up, this chorus, and a calm break.
      </Box>
    </>
  );
}
