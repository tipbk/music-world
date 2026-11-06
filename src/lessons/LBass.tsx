import { useState } from 'react';
import { playNote } from '../audio/engine';
import { chordOnDegree, findProgression, noteName, PROGRESSIONS, tonicFor } from '../music/theory';
import { BASS_PATTERNS, bassNote, drumPreset, drumsFrom, emptyMelody, playOnce, Song } from '../music/song';
import { ChordStrip, useSong } from '../components/SongPlayer';
import { Box, KeySelect, pick, PlayButton, Quiz, Section, Select, shuffle, Slider } from '../components/ui';

const ROWS: { c: string; label: string; plain: string }[] = [
  { c: 'O', label: 'Root ↑', plain: 'root, one octave higher' },
  { c: '5', label: '5th', plain: 'fifth (3rd note of the chord)' },
  { c: '3', label: '3rd', plain: 'third (middle note of the chord)' },
  { c: 'R', label: 'Root', plain: 'root (the chord name note)' },
];

/** Turn editor cells into a bass line. With "long notes", each note holds until the next one. */
function cellsToLine(cells: string[], legato: boolean) {
  if (!legato) return cells.join('');
  let held = false;
  return cells
    .map((c) => {
      if (c !== '.') {
        held = true;
        return c;
      }
      return held ? '-' : '.';
    })
    .join('');
}

function PatternBoxes({ line, step }: { line: string; step: number }) {
  const inBar = step >= 0 ? step % 16 : -1;
  return (
    <div className="bass-boxes">
      {line.split('').map((c, i) => (
        <span key={i} className={`${c === '.' ? '' : c === '-' ? 'hold' : 'hit'} ${i % 4 === 0 ? 'beat' : ''} ${inBar === i ? 'now' : ''}`}>
          {c === '.' || c === '-' ? '' : c === 'O' ? '↑' : c}
        </span>
      ))}
    </div>
  );
}

function BassNotes({ song }: { song: Song }) {
  const tonic = tonicFor(song.key);
  return (
    <div className="chord-strip bass-roots">
      {song.progression.map((d, i) => {
        const c = chordOnDegree(tonic, song.scale, d);
        return (
          <button key={i} className="btn" onClick={() => playNote(c.root - 24, { instrument: 'bass', duration: 0.8 })}>
            {c.name} → bass plays <b>{noteName(c.root)}</b>
          </button>
        );
      })}
    </div>
  );
}

export default function LBass() {
  const [key, setKey] = useState(0);
  const [progId, setProgId] = useState('pop');
  const [bpm, setBpm] = useState(110);
  const [bassOn, setBassOn] = useState(true);
  const [solo, setSolo] = useState(false);
  const prog = findProgression(progId);
  const base: Song = {
    bpm,
    key,
    scale: prog.scale,
    progression: prog.degrees,
    drums: drumPreset('rock'),
    melody: emptyMelody(4),
    chordInstrument: 'piano',
    melodyInstrument: 'lead',
    chordStyle: 'block',
    bass: true,
  };
  const demo: Song = { ...base, mute: { bass: !bassOn, chords: solo, drums: solo } };
  const demoPlayer = useSong(demo);

  const [patId, setPatId] = useState('octave');
  const pat = BASS_PATTERNS.find((p) => p.id === patId)!;
  const patSong: Song = { ...base, bassLine: pat.line, drums: drumPreset(patId === 'offbeat' || patId === 'octave' ? 'edm' : 'rock') };
  const patPlayer = useSong(patSong);
  const shownLine = pat.line === 'kick' ? patSong.drums.kick.map((k) => (k ? 'R' : '.')).join('') : pat.line;

  const [cells, setCells] = useState<string[]>('R...R...R.5.O...'.split(''));
  const [legato, setLegato] = useState(false);
  const myLine = cellsToLine(cells, legato);
  const mySong: Song = { ...base, bassLine: myLine, drums: drumPreset('edm'), chordStyle: 'pulse' };
  const myPlayer = useSong(mySong);
  const myInBar = myPlayer.step >= 0 ? myPlayer.step % 16 : -1;
  const firstChord = chordOnDegree(tonicFor(key), prog.scale, prog.degrees[0]);

  return (
    <>
      <Section title="Bass = the low notes under everything">
        <p>
          The <b>bass</b> is the lowest part of the music. You often don't notice it, but you <b>feel</b> it. Without bass, music
          sounds thin and weak. With bass, it sounds full and powerful.
        </p>
        <p>Press play, then switch the bass on and off while it plays. Listen to how the music gets "empty" without it.</p>
        <div className="row wrap">
          <PlayButton playing={demoPlayer.playing} onClick={demoPlayer.toggle} label="Play" />
          <button className={`btn btn-big ${bassOn ? 'btn-primary' : ''}`} onClick={() => setBassOn(!bassOn)}>
            {bassOn ? '🔊 Bass ON' : '🔇 Bass OFF'}
          </button>
          <label className="check">
            <input type="checkbox" checked={solo} onChange={(e) => setSolo(e.target.checked)} /> Hear the bass alone
          </label>
        </div>
        <ChordStrip song={demo} step={demoPlayer.step} />
        <Box kind="idea">
          Bass and kick drum are best friends. The <b>kick</b> gives the "hit", and the <b>bass</b> gives the "note". Together they
          make the ground that everything else stands on.
        </Box>
      </Section>

      <Section title="Rule #1: the bass plays the root">
        <p>
          The easiest bass line in the world: play the <b>root</b> of each chord, which is the note the chord is named after.
          Chord C → bass plays C. Chord Am → bass plays A. Just lower.
        </p>
        <div className="row wrap">
          <Select label="Chords" value={progId} onChange={setProgId} options={PROGRESSIONS.map((p) => ({ value: p.id, label: p.name }))} />
          <KeySelect value={key} onChange={setKey} />
        </div>
        <BassNotes song={base} />
        <Box kind="tip">
          When the bass plays the root, the chord sounds strong and clear. Once that feels easy, you can also use the chord's{' '}
          <b>5th</b> (its top note) or the root <b>one octave higher</b>. Those always fit too.
        </Box>
      </Section>

      <Section title="Bass patterns: same notes, different rhythm">
        <p>
          Most bass lines only use the root, but the <b>rhythm</b> changes everything. Each box below is a 16th of a bar (like
          the drum grid). <b>R</b> = root, <b>5</b> = fifth, <b>↑</b> = root one octave up, a bar = keep holding.
        </p>
        <div className="row wrap">
          {BASS_PATTERNS.map((p) => (
            <button key={p.id} className={`btn small ${p.id === patId ? 'btn-primary' : ''}`} onClick={() => setPatId(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
        <p className="muted">{pat.plain}</p>
        <PatternBoxes line={shownLine} step={patPlayer.step} />
        <div className="row wrap">
          <PlayButton playing={patPlayer.playing} onClick={patPlayer.toggle} label="Play pattern" />
          <Slider label="Speed" value={bpm} min={60} max={190} unit="BPM" onChange={setBpm} />
        </div>
        <ChordStrip song={patSong} step={patPlayer.step} />
        <Box kind="game">
          <ul className="list">
            <li><b>Battle / action:</b> Battle Gallop or Rock Pulse. Many fast notes = urgency.</li>
            <li><b>Rhythm game / EDM:</b> Octave Bounce or Off-beat. These make players want to move.</li>
            <li><b>Town / cute:</b> Town Bounce (root and fifth).</li>
            <li><b>Sad / emotional:</b> Long Notes, or no bass at all for the quiet part.</li>
            <li><b>Retro 8-bit:</b> old consoles had a special low channel just for bass, and it usually played fast root and octave jumps.</li>
          </ul>
        </Box>
      </Section>

      <Section title="Make your own bass line">
        <p>
          Click boxes to place bass notes. The same pattern repeats on every chord and moves with it. Right now the first chord is{' '}
          <b>{firstChord.name}</b>, so "Root" = {noteName(firstChord.root)}, "3rd" = {noteName(firstChord.notes[1])} and "5th" ={' '}
          {noteName(firstChord.notes[2])}.
        </p>
        <div className="grid-scroll">
          <div className="drum-grid">
            {ROWS.map((r) => (
              <div className="grid-row" key={r.c}>
                <button
                  className="row-label"
                  title={r.plain}
                  onClick={() => playNote(bassNote(firstChord.notes, r.c), { instrument: 'bass', duration: 0.5 })}
                >
                  {r.label}
                </button>
                {cells.map((c, i) => (
                  <button
                    key={i}
                    className={`cell ${c === r.c ? 'on' : ''} ${c === '.' && myLine[i] === '-' && r.c === 'R' ? 'hint' : ''} ${i % 4 === 0 ? 'beat' : ''} ${myInBar === i ? 'now' : ''}`}
                    aria-label={`${r.label} at step ${i + 1}`}
                    onClick={() => {
                      const next = [...cells];
                      next[i] = c === r.c ? '.' : r.c;
                      if (c !== r.c) playNote(bassNote(firstChord.notes, r.c), { instrument: 'bass', duration: 0.25 });
                      setCells(next);
                    }}
                  />
                ))}
              </div>
            ))}
            <div className="grid-row counts">
              <span className="row-label" />
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i} className="count">
                  {i % 4 === 0 ? i / 4 + 1 : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="row wrap">
          <PlayButton playing={myPlayer.playing} onClick={myPlayer.toggle} label="Play my bass" />
          <label className="check">
            <input type="checkbox" checked={legato} onChange={(e) => setLegato(e.target.checked)} /> Long notes (hold each note until
            the next one)
          </label>
          <button className="btn small" onClick={() => setCells('................'.split(''))}>
            Clear
          </button>
        </div>
        <Box kind="try">
          Put a <b>Root</b> on every big number (1, 2, 3, 4). Play it. Now move one note to the box just <b>before</b> a big
          number. That little "early" note is called a <b>pickup</b>, and it makes the bass groove.
        </Box>
        <Box kind="tip" title="3 simple bass rules">
          <ol className="list">
            <li>Always start each chord on its <b>root</b>, on beat 1.</li>
            <li>Line up some bass notes with the <b>kick drum</b>.</li>
            <li>Keep it <b>simple</b>. The bass supports the song. The melody is the star.</li>
          </ol>
        </Box>
      </Section>

      <Quiz
        title="Ear quiz: which bass pattern?"
        makeRound={() => {
          const ids = ['whole', 'octave', 'gallop', 'offbeat', 'rootfifth'];
          const opts = shuffle(BASS_PATTERNS.filter((p) => ids.includes(p.id))).slice(0, 3);
          const ans = pick(opts);
          const t = Math.floor(Math.random() * 12);
          const s: Song = {
            ...base,
            key: t,
            bpm: 110,
            bassLine: ans.line,
            drums: drumsFrom({ kick: 'x...x...x...x...' }),
            mute: { chords: true },
          };
          return {
            prompt: 'Listen to the bass (with a simple kick). Which pattern is it?',
            play: () => playOnce(s, 2),
            options: opts.map((o) => o.name),
            answer: ans.name,
            explain: ans.plain,
          };
        }}
      />
    </>
  );
}
