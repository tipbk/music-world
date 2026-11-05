import { useState } from 'react';
import { now, playChord, playNote } from '../audio/engine';
import { buildChord, chordOnDegree, ChordQuality, HARMONY_SCALES, NOTE_NAMES, noteName, ScaleId, tonicFor } from '../music/theory';
import { Box, KeySelect, pick, Piano, Quiz, ScaleSelect, Section } from '../components/ui';

const QUALITY_TEXT: Record<ChordQuality, string> = {
  major: 'Major: happy, bright',
  minor: 'Minor: sad, soft',
  dim: 'Diminished: tense, scary, unstable',
  aug: 'Augmented: dreamy, strange',
};

export default function L5Chords() {
  const [root, setRoot] = useState(60);
  const [quality, setQuality] = useState<ChordQuality>('major');
  const notes = buildChord(root, quality);
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState<ScaleId>('major');
  const [active, setActive] = useState<number[]>([]);
  const tonic = tonicFor(key);
  const chords = Array.from({ length: 7 }, (_, d) => chordOnDegree(tonic, scale, d));

  const play = (n: number[]) => {
    playChord(n, { duration: 1.2 });
    setActive(n);
    window.setTimeout(() => setActive([]), 900);
  };

  return (
    <>
      <Section title="A chord = notes played together">
        <p>
          Play 3 notes at the same time and you get a <b>chord</b>. Chords are the "background" of a song. They set the mood
          while the melody sings on top.
        </p>
        <p>
          The basic chord has 3 notes. Here is the recipe: start at a note (the <b>root</b>), skip one, take one, skip one, take
          one. On a piano, it looks like every other white key: C _ E _ G.
        </p>
        <div className="row wrap">
          <label className="select">
            <span>Root note</span>
            <select value={root} onChange={(e) => setRoot(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => 60 + i).map((m) => (
                <option key={m} value={m}>
                  {noteName(m)}
                </option>
              ))}
            </select>
          </label>
          {(['major', 'minor', 'dim', 'aug'] as ChordQuality[]).map((q) => (
            <button
              key={q}
              className={`btn small ${quality === q ? 'btn-primary' : ''}`}
              onClick={() => {
                setQuality(q);
                play(buildChord(root, q));
              }}
            >
              {q}
            </button>
          ))}
          <button className="btn btn-primary" onClick={() => play(notes)}>
            ▶ Play chord
          </button>
          <button
            className="btn"
            onClick={() => {
              const t = now();
              notes.forEach((n, i) => playNote(n, { time: t + i * 0.25, duration: 0.5 }));
            }}
          >
            ▶ One by one
          </button>
        </div>
        <p className="readout">
          {noteName(root)}
          {quality === 'major' ? '' : quality === 'minor' ? 'm' : quality} = {notes.map((n) => noteName(n)).join(' + ')} ·{' '}
          {QUALITY_TEXT[quality]}
        </p>
        <Piano from={60} to={83} labels="white" highlight={new Set(notes)} highlightExact active={new Set(active)} />
        <Box kind="idea">
          The difference between major and minor is <b>only the middle note</b>. Major: count 4 keys up (including black keys),
          then 3. Minor: 3 keys up, then 4. Switch between major and minor above and watch the middle key move.
        </Box>
      </Section>

      <Section title="The 7 chords that live in your key">
        <p>
          Here is the magic: if you build a chord on each note of your scale (using only scale notes), you get <b>7 chords that
          all sound good together</b>. Click them!
        </p>
        <div className="row wrap">
          <KeySelect value={key} onChange={setKey} />
          <ScaleSelect value={scale} onChange={setScale} only={HARMONY_SCALES} />
        </div>
        <div className="chord-pads">
          {chords.map((c) => (
            <button key={c.degree} className={`chord-pad ${c.quality}`} onClick={() => play(c.notes)}>
              <span className="roman">{c.roman}</span>
              <b>{c.name}</b>
              <small>{c.notes.map((n) => noteName(n)).join(' ')}</small>
            </button>
          ))}
        </div>
        <Piano from={60} to={88} labels="white" active={new Set(active)} />
        <Box kind="idea" title="What are I, IV, V?">
          Musicians name chords by number with <b>Roman numerals</b>: I = chord on note 1, IV = chord on note 4, and so on.{' '}
          <b>BIG letters = major</b>, <b>small letters = minor</b>. The nice thing: "I–V–vi–IV" works in every key. Change the
          key above, and the numbers stay the same.
        </Box>
        <Box kind="tip">
          The 3 most important chords: <b>I</b> (home, rest), <b>IV</b> (moving away, warm), <b>V</b> (tension, wants to go
          home). In {NOTE_NAMES[key]} {scale === 'major' ? 'major' : scale}, those are {chords[0].name}, {chords[3].name} and{' '}
          {chords[4].name}.
        </Box>
      </Section>

      <Quiz
        title="Ear quiz: major or minor chord?"
        makeRound={() => {
          const q: ChordQuality = pick(['major', 'minor']);
          const r = 55 + Math.floor(Math.random() * 12);
          return {
            prompt: 'Listen to the chord. Happy (major) or sad (minor)?',
            play: () => {
              const n = buildChord(r, q);
              const t = now();
              playChord(n, { duration: 1.2 });
              n.forEach((x, i) => playNote(x, { time: t + 1.3 + i * 0.2, duration: 0.4 }));
            },
            options: ['😊 Major', '😢 Minor'],
            answer: q === 'major' ? '😊 Major' : '😢 Minor',
            explain: `It was ${noteName(r)}${q === 'minor' ? 'm' : ''}: ${buildChord(r, q).map((n) => noteName(n)).join(' + ')}.`,
          };
        }}
      />
    </>
  );
}
