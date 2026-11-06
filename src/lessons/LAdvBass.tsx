import { useState } from 'react';
import { playNote } from '../audio/engine';
import { BASS_STYLES, bassFillGaps, bassFollowKick, findBass, findGroove, Jam, playJamOnce } from '../music/advanced';
import { chordOnDegree, degreeToMidi, findProgression, noteName, PROGRESSIONS, tonicFor } from '../music/theory';
import { ABSwitch, BassLane, JamChords, useJam } from '../components/JamPlayer';
import { Box, pick, PlayButton, Quiz, Section, Select, shuffle, Slider } from '../components/ui';

/** Which drums go best with each bass style in the gallery. */
const STYLE_GROOVE: Record<string, string> = {
  long: 'rock',
  disco: 'house',
  offbeat: 'house',
  walk: 'shuffle',
  funk: 'breakbeat',
  chip: 'jcore',
  drive: 'rockGhost',
  push: 'house',
  wobble: 'halftime',
};

const LOCK_GROOVES = ['house', 'rock', 'breakbeat', 'dembow'];
const LOCK_MODES = [
  { id: 'follow', name: 'Follow the kick', plain: 'Bass plays exactly with the kick. Kick and bass hit together like one giant punch.' },
  { id: 'gaps', name: 'Fill the gaps', plain: 'Bass plays where the kick is NOT. They take turns, so the groove bounces.' },
  { id: 'ignore', name: 'Ignore the kick', plain: 'Bass plays its own random rhythm. Some notes hit together, some don\'t. It sounds messy and weak.' },
];

const LEADS = [
  { id: 'none', name: 'No lead-in', line: 'R-------R-------', plain: 'Just roots. Each chord change is a jump.' },
  { id: 'step', name: 'Step into it', line: 'R-------R-----A-', plain: 'The last note is the scale note just below the next root. It "walks" into the new chord.' },
  { id: 'half', name: 'Sneaky half step', line: 'R-------R-----C-', plain: 'The last note is ONE piano key below the next root. A bit spicy and jazzy, pulls very hard.' },
  { id: 'walk', name: 'Walk every beat', line: 'R---3---5---A---', plain: 'Root, 3rd, 5th, lead-in: one note per beat, always moving. This is a walking bass.' },
];

const ROWS: { c: string; label: string; plain: string }[] = [
  { c: 'N', label: 'Next ⇥', plain: "the NEXT chord's root, played early" },
  { c: 'A', label: 'Lead-in', plain: "the note just below the next chord's root" },
  { c: 'O', label: 'Root ↑', plain: 'root, one octave higher' },
  { c: '5', label: '5th', plain: 'fifth of the chord' },
  { c: '3', label: '3rd', plain: 'third of the chord' },
  { c: 'R', label: 'Root', plain: 'root of the chord' },
];

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

export default function LAdvBass() {
  const [progId, setProgId] = useState('pop');
  const [key, setKey] = useState(0);
  const prog = findProgression(progId);
  const base = (bpm: number, grooveId: string, bass: string): Jam => {
    const g = findGroove(grooveId);
    return {
      bpm,
      key,
      scale: prog.scale,
      progression: prog.degrees,
      groove: g.g,
      swing: g.swing,
      bass,
      chordStyle: 'pulse',
      chordInstrument: 'pluck',
    };
  };

  // Gallery
  const [styleId, setStyleId] = useState('disco');
  const style = findBass(styleId);
  const sg = findGroove(STYLE_GROOVE[styleId]);
  const [gbpm, setGbpm] = useState<number | null>(null);
  const galleryJam = base(gbpm ?? Math.min(sg.bpm, 150), sg.id, style.line);
  const galleryP = useJam(galleryJam);

  // Lock with kick
  const [lockG, setLockG] = useState('house');
  const [lockMode, setLockMode] = useState('follow');
  const lockKick = findGroove(lockG).g.kick ?? '';
  const lockLine = lockMode === 'follow' ? bassFollowKick(lockKick) : lockMode === 'gaps' ? bassFillGaps(lockKick) : '.R..R.R..R.R..R.';
  const lockJam = { ...base(115, lockG, lockLine), chordStyle: 'none' as const };
  const lockP = useJam(lockJam);

  // Lead-ins
  const [leadId, setLeadId] = useState('step');
  const lead = LEADS.find((l) => l.id === leadId)!;
  const leadJam: Jam = { ...base(100, 'rockGhost', lead.line), chordStyle: 'block', chordInstrument: 'pad' };
  const leadP = useJam(leadJam);

  // Push
  const [push, setPush] = useState(false);
  const pushJam: Jam = { ...base(120, 'house', push ? '------..R-----N-' : 'R-----..R-----..'), chordStyle: 'block', chordInstrument: 'pad' };
  const pushP = useJam(pushJam);

  // Editor
  const [cells, setCells] = useState<string[]>('R..R..O...R.5.A.'.split(''));
  const [legato, setLegato] = useState(false);
  const [edG, setEdG] = useState('house');
  const myLine = cellsToLine(cells, legato);
  const myJam = base(findGroove(edG).bpm > 150 ? 150 : findGroove(edG).bpm, edG, myLine);
  const myP = useJam(myJam);
  const myInBar = myP.step >= 0 ? myP.step % 16 : -1;
  const tonic = tonicFor(key);
  const c0 = chordOnDegree(tonic, prog.scale, prog.degrees[0]);
  const c1 = chordOnDegree(tonic, prog.scale, prog.degrees[1]);
  const preview = (c: string) => {
    const root = c0.notes[0] - 24;
    const lead = degreeToMidi(tonic, prog.scale, prog.degrees[1] - 1) - 24;
    const n = { R: root, '3': c0.notes[1] - 24, '5': c0.notes[2] - 24, O: root + 12, N: c1.notes[0] - 24, A: lead }[c] ?? root;
    playNote(n, { instrument: 'bass', duration: 0.3 });
  };

  return (
    <>
      <Box kind="idea" title="Where we are">
        You know the bass plays the <b>root</b> with a nice rhythm. Now we make it <b>groove</b>: jump octaves, team up with the
        kick drum, walk into the next chord, and arrive early.
      </Box>
      <div className="row wrap">
        <Select label="Chords for this lesson" value={progId} onChange={setProgId} options={PROGRESSIONS.map((p) => ({ value: p.id, label: p.name }))} />
        <Select label="Key" value={key} onChange={setKey} options={['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n, i) => ({ value: i, label: n }))} />
      </div>

      <Section title="1. Cool bass styles">
        <p>
          Each style below is just a <b>rhythm</b> plus a few note choices from the chord. Pink = a note starts, light pink = keep
          holding, <span className="gold">gold</span> = a note that leads to the next chord. The kick is shown on top.
        </p>
        <div className="row wrap">
          {BASS_STYLES.map((b) => (
            <button
              key={b.id}
              className={`btn small ${b.id === styleId ? 'btn-primary' : ''}`}
              onClick={() => {
                setStyleId(b.id);
                setGbpm(null);
              }}
            >
              {b.name}
            </button>
          ))}
        </div>
        <p>
          {style.plain} <span className="muted">🎮 {style.game}</span>
        </p>
        <BassLane line={style.line} kick={galleryJam.groove.kick} step={galleryP.step} />
        <div className="row wrap">
          <PlayButton playing={galleryP.playing} onClick={galleryP.toggle} label="Play" />
          <Slider label="Speed" value={galleryJam.bpm} min={60} max={180} unit="BPM" onChange={setGbpm} />
        </div>
        <JamChords jam={galleryJam} step={galleryP.step} />
      </Section>

      <Section title="2. Team up with the kick drum">
        <p>
          The kick and the bass are both low and heavy. If they fight, the music sounds muddy. If they <b>work as a team</b>,
          the music punches. There are 2 good ways to team up.
        </p>
        <div className="row wrap">
          <Select label="Drums" value={lockG} onChange={setLockG} options={LOCK_GROOVES.map((g) => ({ value: g, label: findGroove(g).name }))} />
          {LOCK_MODES.map((m) => (
            <button key={m.id} className={`btn small ${m.id === lockMode ? 'btn-primary' : ''}`} onClick={() => setLockMode(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
        <p className="muted">{LOCK_MODES.find((m) => m.id === lockMode)!.plain}</p>
        <BassLane line={lockLine} kick={lockKick} step={lockP.step} />
        <PlayButton playing={lockP.playing} onClick={lockP.toggle} label="Play" />
        <Box kind="game">
          <b>Follow the kick</b> = heavy and punchy (rock, battle, boss). <b>Fill the gaps</b> = bouncy and dancy (EDM, rhythm
          games). Pick one per section, and switch in the chorus for a fresh feeling.
        </Box>
      </Section>

      <Section title="3. Walk into the next chord (lead-in notes)">
        <p>
          Right before the chord changes, play a note that is <b>one step away</b> from the next root. The bass then "walks"
          into the new chord instead of jumping. It sounds smooth and smart.
        </p>
        <div className="row wrap">
          <PlayButton playing={leadP.playing} onClick={leadP.toggle} label="Play" />
          {LEADS.map((l) => (
            <button key={l.id} className={`btn small ${l.id === leadId ? 'btn-primary' : ''}`} onClick={() => setLeadId(l.id)}>
              {l.name}
            </button>
          ))}
        </div>
        <p className="muted">{lead.plain}</p>
        <BassLane line={lead.line} step={leadP.step} />
        <JamChords jam={leadJam} step={leadP.step} />
        <Box kind="tip">
          Listen to the <b>last note of each bar</b> (gold box). It leans toward the next chord, and when the chord changes, it
          feels like it "lands". You don't need to think about which note: the lead-in is always right next to the next root.
        </Box>
      </Section>

      <Section title="4. Arrive early (push)">
        <p>
          Play the next chord's root <b>a little before</b> the chord changes, and let it ring over the bar line. It feels like
          the music is running forward. This is very common in anime songs and emotional rhythm game choruses.
        </p>
        <div className="row wrap">
          <PlayButton playing={pushP.playing} onClick={pushP.toggle} label="Play" />
          <ABSwitch value={push} onChange={setPush} a="On time" b="Arrive early" />
        </div>
        <BassLane line={pushJam.bass!} step={pushP.step} />
        <JamChords jam={pushJam} step={pushP.step} />
        <Box kind="try">
          With "Arrive early", watch the chord cards: the bass note changes <b>before</b> the card lights up. That small lean
          forward is what makes a chorus feel exciting.
        </Box>
      </Section>

      <Section title="5. Build your own cool bass line">
        <p>
          Same as the basic bass editor, plus 2 new rows: <b>Next ⇥</b> (the next chord's root, early) and <b>Lead-in</b> (the
          note just below the next root). The kick is shown on top so you can team up with it.
        </p>
        <div className="row wrap">
          <Select label="Drums" value={edG} onChange={setEdG} options={['house', 'rockGhost', 'breakbeat', 'dembow', 'shuffle', 'jcore'].map((g) => ({ value: g, label: findGroove(g).name }))} />
          <PlayButton playing={myP.playing} onClick={myP.toggle} label="Play my bass" />
        </div>
        <div className="grid-scroll">
          <div className="drum-grid">
            <div className="grid-row">
              <span className="row-label">Kick</span>
              {(myJam.groove.kick ?? '').split('').map((k, i) => (
                <span key={i} className={`cell ${k !== '.' ? 'ghost' : ''} ${i % 4 === 0 ? 'beat' : ''} ${myInBar === i ? 'now' : ''}`} />
              ))}
            </div>
            {ROWS.map((r) => (
              <div className="grid-row" key={r.c}>
                <button className="row-label" title={r.plain} onClick={() => preview(r.c)}>
                  {r.label}
                </button>
                {cells.map((c, i) => (
                  <button
                    key={i}
                    className={`cell ${c === r.c ? 'on' : ''} ${c === r.c && 'NA'.includes(r.c) ? 'accent' : ''} ${c === '.' && myLine[i] === '-' && r.c === 'R' ? 'hint' : ''} ${i % 4 === 0 ? 'beat' : ''} ${myInBar === i ? 'now' : ''}`}
                    aria-label={`${r.label} at step ${i + 1}`}
                    onClick={() => {
                      const next = [...cells];
                      next[i] = c === r.c ? '.' : r.c;
                      if (c !== r.c) preview(r.c);
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
          <label className="check">
            <input type="checkbox" checked={legato} onChange={(e) => setLegato(e.target.checked)} /> Long notes (hold until the next one)
          </label>
          <button className="btn small" onClick={() => setCells(bassFollowKick(myJam.groove.kick ?? '').split(''))}>
            Copy the kick
          </button>
          <button className="btn small" onClick={() => setCells('................'.split(''))}>
            Clear
          </button>
        </div>
        <p className="muted">
          First chord {c0.name}: Root = {noteName(c0.root)}. Next chord {c1.name}: Next = {noteName(c1.root)}.
        </p>
        <JamChords jam={myJam} step={myP.step} />
        <Box kind="tip" title="4 rules for a cool bass line">
          <ol className="list">
            <li>Beat 1 of each chord: <b>root</b> (or a note you pushed early).</li>
            <li><b>Team up with the kick</b>: follow it or fill its gaps.</li>
            <li>Use <b>Root ↑</b> and <b>5th</b> to move around without leaving the chord.</li>
            <li>End the bar with a <b>lead-in</b> or <b>next</b> note to pull into the next chord.</li>
          </ol>
        </Box>
      </Section>

      <Quiz
        title="Ear quiz: which bass style?"
        makeRound={() => {
          const ids = ['long', 'disco', 'offbeat', 'walk', 'chip'];
          const opts = shuffle(BASS_STYLES.filter((b) => ids.includes(b.id))).slice(0, 3);
          const ans = pick(opts);
          return {
            prompt: 'Listen to the bass (with a simple kick). Which style is it?',
            play: () =>
              playJamOnce(
                {
                  bpm: 110,
                  key: Math.floor(Math.random() * 12),
                  scale: 'major',
                  progression: [0, 4, 5, 3],
                  groove: { kick: 'X...X...X...X...' },
                  bass: ans.line,
                  chordStyle: 'none',
                  chordInstrument: 'pad',
                },
                2,
              ),
            options: opts.map((o) => o.name),
            answer: ans.name,
            explain: ans.plain,
          };
        }}
      />
    </>
  );
}
