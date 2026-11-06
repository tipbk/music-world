import { useState } from 'react';
import { Instrument } from '../audio/engine';
import { Cells, findGroove, growMotif, Jam, MOTIF_MOVES, moveMotif, notesFrom8ths, playJamOnce } from '../music/advanced';
import { mel } from '../music/song';
import { findProgression, ScaleId, SCALES } from '../music/theory';
import { ABSwitch, JamChords, useJam } from '../components/JamPlayer';
import { Box, MelodyGrid, pick, PlayButton, Quiz, Section, Select, shuffle } from '../components/ui';

const noop = () => {};
const SOFT_BEAT = { kick: 'X.......x.......', snare: '....x.......x...', hat: 'g.g.g.g.g.g.g.g.' };
const chordHints = (prog: number[]) => (c: number) => [0, 2, 4].map((x) => prog[Math.floor(c / 8) % prog.length] + x);

const MOTIFS: { name: string; cells: Cells }[] = [
  { name: 'Hop up', cells: mel('2.44542.') },
  { name: 'Call', cells: mel('4.4.5.2.') },
  { name: 'Skip', cells: mel('0.2.4.7.') },
  { name: 'Wave', cells: mel('45434.2.') },
];

// Question and answer (I - V - IV - I)
const QA_PROG = [0, 4, 3, 0];
const QUESTION = mel('4.45 4.2. 1.2. 4...');
const ANSWERS: { id: string; name: string; cells: Cells; plain: string }[] = [
  { id: 'home', name: 'Ends at home', cells: mel('5.54 3.3. 2.1. 0...'), plain: 'Lands on the home note. Feels finished, like the end of a sentence. Full stop.' },
  { id: 'away', name: 'Ends away', cells: mel('5.54 3.3. 2.3. 1...'), plain: 'Stops on a note that is not home. Feels like a question mark, so it wants to go on. Great for looping BGM.' },
  { id: 'copy', name: 'Same as question', cells: [...QUESTION], plain: 'Just repeats. Catchy, but it never really ends.' },
];

// Chord notes vs passing notes (I - IV - V - I)
const PASS_PROG = [0, 3, 4, 0];
const PASS_GOOD = mel('01234321 34567654 45678765 7643210.');
const PASS_BAD: Cells = [null, ...PASS_GOOD.slice(0, -1)];

// Pushing notes early (I - V - vi - IV)
const PUSH_STRAIGHT = mel('2.2.4... 1.1.4... 2.2.5... 5.3.0...');
const PUSH_EARLY = mel('2.24...1 ..14...2 ..25...5 ..30....');

// Same melody, different mood
const THEME = mel('0.2.4.5. 4...2... 3.5.4.2. 1.......');
const MOODS: { id: string; name: string; scale: ScaleId; bpm: number; inst: Instrument; groove: string | null; bass: string; plain: string }[] = [
  { id: 'hero', name: '🦸 Hero', scale: 'major', bpm: 132, inst: 'lead', groove: 'rockGhost', bass: 'R.R.R.R.R.R.5.A.', plain: 'Major scale, fast, rock drums. Brave and bright.' },
  { id: 'sad', name: '😢 Sad memory', scale: 'minor', bpm: 72, inst: 'piano', groove: null, bass: 'R---------------', plain: 'Minor scale, slow, soft piano, no drums. The same tune now feels like a goodbye.' },
  { id: 'boss', name: '👹 Boss fight', scale: 'harmonicMinor', bpm: 168, inst: 'chip', groove: 'dnb', bass: 'R.O.R.O.R.O.5.O.', plain: 'Harmonic minor has one "evil" note. Fast drums make it a boss battle.' },
  { id: 'mystery', name: '🌲 Mystery forest', scale: 'dorian', bpm: 92, inst: 'pluck', groove: 'shuffle', bass: 'R---3---5---A---', plain: 'Dorian: minor, but with a hopeful bright note. Curious and magical.' },
  { id: 'rock', name: '🏁 Racing', scale: 'mixolydian', bpm: 150, inst: 'lead', groove: 'breakbeat', bass: 'R..R..O...R.5.R.', plain: 'Mixolydian: major with a tough, rocky note. Cool and confident.' },
];

export default function LAdvMelody() {
  // Motif builder
  const pop = findProgression('pop');
  const [motif, setMotif] = useState<Cells>(MOTIFS[0].cells);
  const [plan, setPlan] = useState(['follow', 'same', 'answer']);
  const grown = growMotif(motif, pop.degrees, plan);
  const motifJam: Jam = {
    bpm: 112,
    key: 0,
    scale: 'major',
    progression: pop.degrees,
    groove: SOFT_BEAT,
    bass: 'R-------R---5---',
    chordStyle: 'block',
    chordInstrument: 'pad',
    melody: notesFrom8ths(grown),
    melodyInstrument: 'chip',
  };
  const motifP = useJam(motifJam);

  // Question and answer
  const [ansId, setAnsId] = useState('home');
  const ans = ANSWERS.find((a) => a.id === ansId)!;
  const qaCells = [...QUESTION, ...ans.cells];
  const qaJam: Jam = { ...motifJam, progression: QA_PROG, melody: notesFrom8ths(qaCells), melodyInstrument: 'pluck', bass: 'R-------R-------' };
  const qaP = useJam(qaJam);
  const qaBar = qaP.step >= 0 ? Math.floor(qaP.step / 16) : -1;

  // Passing notes
  const [bad, setBad] = useState(false);
  const passCells = bad ? PASS_BAD : PASS_GOOD;
  const passJam: Jam = { ...motifJam, bpm: 96, progression: PASS_PROG, melody: notesFrom8ths(passCells), melodyInstrument: 'piano', groove: {}, bass: 'R---------------' };
  const passP = useJam(passJam);

  // Pushing notes
  const [pushed, setPushed] = useState(false);
  const pushCells = pushed ? PUSH_EARLY : PUSH_STRAIGHT;
  const pushJam: Jam = {
    ...motifJam,
    bpm: 128,
    groove: findGroove('house').g,
    bass: '..R-..R-..R-..R-',
    chordStyle: 'pulse',
    chordInstrument: 'pluck',
    melody: notesFrom8ths(pushCells),
    melodyInstrument: 'lead',
  };
  const pushP = useJam(pushJam);

  // Moods
  const [moodId, setMoodId] = useState('hero');
  const mood = MOODS.find((m) => m.id === moodId)!;
  const moodJam: Jam = {
    bpm: mood.bpm,
    key: 0,
    scale: mood.scale,
    progression: [0, 3, 4, 0],
    groove: mood.groove ? findGroove(mood.groove).g : {},
    swing: mood.groove ? findGroove(mood.groove).swing : 0,
    bass: mood.bass,
    chordStyle: mood.groove ? 'pulse' : 'block',
    chordInstrument: mood.groove ? 'pluck' : 'pad',
    melody: notesFrom8ths(THEME),
    melodyInstrument: mood.inst,
  };
  const moodP = useJam(moodJam);

  return (
    <>
      <Box kind="idea" title="Where we are">
        You know the safe rules: chord notes on the beat, small steps, repeat, leave silence. Now we learn the tricks that make
        a melody <b>catchy</b> and <b>cool</b>: a small idea that grows, questions and answers, notes that pass by, notes that
        come early, and one tune that can change its mood.
      </Box>

      <Section title="1. The motif: one small idea, used again and again">
        <p>
          Famous game themes are not long, random tunes. They take <b>one tiny idea</b> (3 to 8 notes, 1 bar) and reuse it with
          small changes. This tiny idea is called a <b>motif</b>.
        </p>
        <p>
          <b>Step 1:</b> make your 1-bar motif here (or pick one).
        </p>
        <div className="row wrap">
          {MOTIFS.map((m) => (
            <button key={m.name} className="btn small" onClick={() => setMotif(m.cells)}>
              {m.name}
            </button>
          ))}
        </div>
        <MelodyGrid melody={motif} onChange={setMotif} tonic={60 + 12} scale="major" step={motifP.step} instrument="chip" chordTones={chordHints(pop.degrees.slice(0, 1))} />
        <p>
          <b>Step 2:</b> choose what happens to it in bars 2, 3 and 4.
        </p>
        <div className="row wrap">
          {plan.map((m, i) => (
            <Select
              key={i}
              label={`Bar ${i + 2}`}
              value={m}
              onChange={(v) => setPlan(plan.map((x, j) => (j === i ? v : x)))}
              options={MOTIF_MOVES.map((o) => ({ value: o.id, label: o.name }))}
            />
          ))}
        </div>
        <ul className="list muted">
          {[...new Set(plan)].map((id) => {
            const mv = MOTIF_MOVES.find((x) => x.id === id)!;
            return (
              <li key={id}>
                <b>{mv.name}:</b> {mv.plain}
              </li>
            );
          })}
        </ul>
        <div className="row wrap">
          <PlayButton playing={motifP.playing} onClick={motifP.toggle} label="Play 4 bars" />
        </div>
        <JamChords jam={motifJam} step={motifP.step} />
        <MelodyGrid melody={grown} onChange={noop} tonic={72} scale="major" step={motifP.step} instrument="chip" chordTones={chordHints(pop.degrees)} />
        <Box kind="game">
          This is how a <b>leitmotif</b> works: a hero gets one short motif, and you hear it in the title screen, the battle and
          the ending, changed a little each time. Players remember it forever.
        </Box>
      </Section>

      <Section title="2. Question and answer">
        <p>
          A melody can talk. The first 2 bars ask a <b>question</b> (they stop on a note that is <b>not</b> home). The next 2
          bars give an <b>answer</b>. Try the different answers.
        </p>
        <div className="row wrap">
          <PlayButton playing={qaP.playing} onClick={qaP.toggle} label="Play" />
          {ANSWERS.map((a) => (
            <button key={a.id} className={`btn small ${a.id === ansId ? 'btn-primary' : ''}`} onClick={() => setAnsId(a.id)}>
              {a.name}
            </button>
          ))}
        </div>
        <p className="muted">
          {qaBar >= 0 ? (qaBar < 2 ? '❓ Question...' : '💬 Answer...') : ''} {ans.plain}
        </p>
        <JamChords jam={qaJam} step={qaP.step} />
        <MelodyGrid melody={qaCells} onChange={noop} tonic={72} scale="major" step={qaP.step} instrument="pluck" chordTones={chordHints(QA_PROG)} />
        <Box kind="game">
          <b>Looping BGM trick:</b> use "ends at home" in the middle of your loop, and "ends away" at the very end. Then the music
          never feels finished, so the loop restarts smoothly and nobody notices.
        </Box>
      </Section>

      <Section title="3. Chord notes and passing notes">
        <p>
          Not every note needs to be in the chord. Notes <b>between</b> chord notes are called <b>passing notes</b>. They sound
          great when they are <b>between the beats</b>, and strange when they land <b>on</b> the beat. Listen.
        </p>
        <div className="row wrap">
          <PlayButton playing={passP.playing} onClick={passP.toggle} label="Play" />
          <ABSwitch value={bad} onChange={setBad} a="Chord notes on the beat ✓" b="Passing notes on the beat ✗" />
        </div>
        <JamChords jam={passJam} step={passP.step} />
        <MelodyGrid melody={passCells} onChange={noop} tonic={72} scale="major" step={passP.step} instrument="piano" chordTones={chordHints(PASS_PROG)} />
        <Box kind="tip">
          It is the <b>same notes</b>, only moved by half a beat! Glowing rows are chord notes. Rule: <b>on the beat</b> = a
          glowing row. <b>Between beats</b> = anything that walks smoothly to the next glowing row.
        </Box>
        <Box kind="idea" title="But sometimes...">
          A passing note <b>on</b> the beat that then steps to a chord note is called a <b>tension note</b>. Used once, on
          purpose, it sounds emotional. Used everywhere, it sounds wrong.
        </Box>
      </Section>

      <Section title="4. Push notes early (syncopation)">
        <p>
          Move some notes <b>half a beat earlier</b>, so they come just before the beat. The melody feels like it is leaning
          forward and can't wait. Pop songs, anime songs and rhythm games do this all the time.
        </p>
        <div className="row wrap">
          <PlayButton playing={pushP.playing} onClick={pushP.toggle} label="Play" />
          <ABSwitch value={pushed} onChange={setPushed} a="Straight (on the beat)" b="Pushed (early)" />
        </div>
        <JamChords jam={pushJam} step={pushP.step} />
        <MelodyGrid melody={pushCells} onChange={noop} tonic={72} scale="major" step={pushP.step} instrument="lead" chordTones={chordHints(pop.degrees)} />
        <Box kind="game">
          In a rhythm game the melody becomes the notes the player taps. Pushed notes make <b>fun patterns</b> like "tap-tap...
          TAP" instead of plain "tap, tap, tap, tap". The last note of a bar pushed into the next chord is the most common
          trick.
        </Box>
      </Section>

      <Section title="5. One tune, many moods">
        <p>
          Keep the <b>same melody</b> (the same rows), but change the <b>scale</b>, speed, sound and drums. The tune is still
          recognizable, but the feeling changes completely. This is how one hero theme becomes a battle, a sad scene, and a
          boss fight.
        </p>
        <div className="row wrap">
          <PlayButton playing={moodP.playing} onClick={moodP.toggle} label="Play" />
          {MOODS.map((m) => (
            <button key={m.id} className={`btn small ${m.id === moodId ? 'btn-primary' : ''}`} onClick={() => setMoodId(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
        <p className="muted">
          <b>{SCALES[mood.scale].name}</b>, {mood.bpm} BPM. {mood.plain}
        </p>
        <JamChords jam={moodJam} step={moodP.step} />
        <MelodyGrid melody={THEME} onChange={noop} tonic={72} scale={mood.scale} step={moodP.step} instrument={mood.inst} chordTones={chordHints([0, 3, 4, 0])} />
        <Box kind="tip" title="One more secret: the high point">
          Give your melody <b>one highest note</b> and use it only once, near the end of the chorus. That is the moment players
          feel the most. If every bar goes to the top, nothing feels special.
        </Box>
      </Section>

      <Quiz
        title="Ear quiz: what happened to the motif?"
        makeRound={() => {
          const m = pick(MOTIFS).cells;
          const moves = shuffle(['same', 'up', 'down', 'back']).slice(0, 3);
          const mv = pick(moves);
          const name = (id: string) => MOTIF_MOVES.find((x) => x.id === id)!.name;
          const cells = [...m, ...moveMotif(m, mv, 0, 0)];
          return {
            prompt: 'You hear the motif, then a changed version. What changed?',
            play: () =>
              playJamOnce(
                { bpm: 100, key: Math.floor(Math.random() * 7), scale: 'major', progression: [0, 0], groove: {}, chordStyle: 'none', chordInstrument: 'pad', melody: notesFrom8ths(cells), melodyInstrument: 'chip' },
                2,
              ),
            options: moves.map(name),
            answer: name(mv),
            explain: MOTIF_MOVES.find((x) => x.id === mv)!.plain,
          };
        }}
      />
    </>
  );
}
