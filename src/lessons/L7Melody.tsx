import { useState } from 'react';
import { Instrument } from '../audio/engine';
import { findProgression, PROGRESSIONS, tonicFor } from '../music/theory';
import { drumPreset, emptyMelody, MELODY_ROWS, Song } from '../music/song';
import { ChordStrip, useSong } from '../components/SongPlayer';
import { Box, InstrumentSelect, KeySelect, MelodyGrid, PlayButton, Section, Select, Slider } from '../components/ui';

const _ = null;
const STARTER = [4, 4, 5, 4, 2, _, 0, _, 1, 1, 2, 1, 4, _, _, _, 5, 5, 4, 5, 7, _, 5, _, 3, _, 2, _, 1, _, _, _];

/** A simple "safe" melody: chord notes on the beat, small steps between. */
export function randomMelody(progression: number[], scaleLen: number) {
  const out: (number | null)[] = [];
  let prev = 4;
  progression.forEach((deg) => {
    const tones = [0, 2, 4, 7].map((x) => deg + x).filter((x) => x >= 0 && x < MELODY_ROWS);
    for (let i = 0; i < 8; i++) {
      if (Math.random() < (i % 2 === 0 ? 0.15 : 0.4)) {
        out.push(null);
        continue;
      }
      let n: number;
      if (i % 2 === 0) {
        const t = tones.length ? tones : [deg % scaleLen];
        n = t.reduce((a, b) => (Math.abs(b - prev) < Math.abs(a - prev) ? b : a));
        if (Math.random() < 0.4) n = t[Math.floor(Math.random() * t.length)];
      } else {
        n = prev + (Math.random() < 0.5 ? 1 : -1);
      }
      n = Math.max(0, Math.min(MELODY_ROWS - 1, n));
      out.push(n);
      prev = n;
    }
  });
  return out;
}

export default function L7Melody() {
  const [progId, setProgId] = useState('pop');
  const [key, setKey] = useState(0);
  const [bpm, setBpm] = useState(110);
  const [inst, setInst] = useState<Instrument>('chip');
  const [melody, setMelody] = useState<(number | null)[]>(STARTER);
  const [hints, setHints] = useState(true);
  const prog = findProgression(progId);
  const song: Song = {
    bpm,
    key,
    scale: prog.scale,
    progression: prog.degrees,
    drums: drumPreset('calm'),
    melody,
    chordInstrument: 'pad',
    melodyInstrument: inst,
    chordStyle: 'block',
    bass: true,
  };
  const player = useSong(song);
  const tonic = tonicFor(key) + 12;

  return (
    <>
      <Section title="Melody = the part you can sing">
        <p>
          The <b>melody</b> is the main tune. It is the part players hum after they turn off the game. It is just{' '}
          <b>one note at a time</b>, moving up and down, over the chords.
        </p>
        <p>
          Below, each row is a note from the scale (only "safe" notes, so nothing sounds wrong). Each column is half a beat.
          Click boxes to place notes, and press play. The chords play behind you.
        </p>
        <div className="row wrap">
          <PlayButton playing={player.playing} onClick={player.toggle} label="Play" />
          <Select label="Chords" value={progId} onChange={setProgId} options={PROGRESSIONS.map((p) => ({ value: p.id, label: p.name }))} />
          <KeySelect value={key} onChange={setKey} />
          <InstrumentSelect label="Melody sound" value={inst} onChange={setInst} />
          <Slider label="Speed" value={bpm} min={60} max={180} unit="BPM" onChange={setBpm} />
        </div>
        <ChordStrip song={song} step={player.step} />
        <MelodyGrid
          melody={melody}
          onChange={setMelody}
          tonic={tonic}
          scale={prog.scale}
          step={player.step}
          instrument={inst}
          chordTones={hints ? (c) => [0, 2, 4].map((x) => prog.degrees[Math.floor(c / 8)] + x) : undefined}
        />
        <div className="row wrap">
          <label className="check">
            <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Show chord notes (glowing rows)
          </label>
          <button className="btn small" onClick={() => setMelody(STARTER)}>
            Example melody
          </button>
          <button className="btn small" onClick={() => setMelody(randomMelody(prog.degrees, 7))}>
            🎲 Random safe melody
          </button>
          <button className="btn small" onClick={() => setMelody([...melody.slice(0, 8), ...melody.slice(8, 16), ...melody.slice(0, 8), ...melody.slice(24, 32)])}>
            Copy bar 1 → bar 3
          </button>
          <button className="btn small" onClick={() => setMelody(emptyMelody(4))}>
            Clear
          </button>
        </div>
      </Section>

      <Section title="5 simple rules for a good melody">
        <ol className="list">
          <li>
            <b>Use chord notes on the beat.</b> The glowing boxes are notes inside the chord playing right now. Put those on the
            big columns (the beats) and the melody fits perfectly.
          </li>
          <li>
            <b>Move in small steps.</b> Going to the next row up or down sounds smooth and singable. Big jumps are exciting, but
            use them only sometimes.
          </li>
          <li>
            <b>Repeat yourself.</b> Repetition makes melodies catchy. Try "Copy bar 1 → bar 3". Same idea twice, then something
            new = a hook.
          </li>
          <li>
            <b>Leave silence.</b> Empty boxes let the melody "breathe". A melody with no gaps is tiring.
          </li>
          <li>
            <b>Finish on the home note</b> (the row marked with the key name, like C) to feel "done". Finish on another note to
            make it want to loop.
          </li>
        </ol>
        <Box kind="game">
          <b>Game melodies are short and catchy</b> because players hear them many times. A good BGM melody is often just 2 or
          4 bars that repeat with small changes. For a rhythm game, the melody is often what players tap, so make its rhythm
          interesting but clear.
        </Box>
        <Box kind="try">
          Clear the grid. Make a 1-bar idea using only glowing boxes. Copy it to bar 3. Then fill bar 2 and 4 with something a
          little different. You just wrote a game theme!
        </Box>
      </Section>
    </>
  );
}
