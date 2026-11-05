import { useState } from 'react';
import { findProgression, PROGRESSIONS } from '../music/theory';
import { ChordStyle, drumPreset, drumsFrom, DrumPattern, emptyMelody, playStep, Song } from '../music/song';
import { useClock } from '../components/useClock';
import { Box, PlayButton, Section, Select } from '../components/ui';

type SectionId = 'intro' | 'verse' | 'build' | 'chorus' | 'break' | 'outro';

const _ = null;
const HOOK = [4, 4, 5, 4, 2, _, 0, _, 1, 1, 2, 1, 4, _, _, _, 5, 5, 4, 5, 7, _, 5, _, 3, _, 2, _, 1, _, _, _];
const VERSE = [0, _, 2, _, 4, _, 2, _, 1, _, _, _, _, _, _, _, 2, _, 4, _, 5, _, 4, _, 3, _, _, _, 1, _, _, _];

const SECTIONS: Record<SectionId, { name: string; energy: number; color: string; plain: string }> = {
  intro: { name: 'Intro', energy: 1, color: '#6c7bd9', plain: 'Quiet start. Sets the mood. Often just chords.' },
  verse: { name: 'Verse (A)', energy: 2, color: '#3aa58d', plain: 'Calm part with a simple melody. Tells the "story".' },
  build: { name: 'Build-up', energy: 3, color: '#d6a33a', plain: 'Energy rises: drums get faster and faster. Makes you wait for the big moment.' },
  chorus: { name: 'Chorus / Drop (B)', energy: 5, color: '#e0567a', plain: 'The big, loud, catchy part. The main hook.' },
  break: { name: 'Break', energy: 2, color: '#8a6cd9', plain: 'Sudden calm. A rest so the next chorus hits harder.' },
  outro: { name: 'Outro', energy: 1, color: '#5f6b7a', plain: 'The ending. Slows down or fades out.' },
};

function buildDrums(bar: number): DrumPattern {
  const snare = ['....x.......x...', 'x...x...x...x...', 'x.x.x.x.x.x.x.x.', 'xxxxxxxxxxxxxxxx'][bar];
  return drumsFrom({ kick: 'x...x...x...x...', snare });
}

function sectionSong(id: SectionId, bar: number, base: Song): Song {
  const s = (drums: DrumPattern, chordStyle: ChordStyle, bass: boolean, melody: (number | null)[], chordInstrument = base.chordInstrument): Song => ({
    ...base,
    drums,
    chordStyle,
    bass,
    melody,
    chordInstrument,
  });
  switch (id) {
    case 'intro':
      return s(drumPreset('none'), 'block', false, emptyMelody(4), 'pad');
    case 'verse':
      return s(drumPreset('calm'), 'pulse', true, VERSE);
    case 'build':
      return s(buildDrums(bar), 'arp', true, emptyMelody(4));
    case 'chorus':
      return s(drumPreset('edm'), 'arp', true, HOOK);
    case 'break':
      return s(drumsFrom({ hat: '..x...x...x...x.' }), 'block', false, emptyMelody(4), 'pad');
    case 'outro':
      return s(drumsFrom({ kick: 'x...............' }), 'block', true, bar === 0 ? HOOK.slice(0, 8).concat(Array(24).fill(null)) : emptyMelody(4), 'pad');
  }
}

const PRESETS: { name: string; list: SectionId[]; loop: boolean; plain: string }[] = [
  { name: 'Game BGM (loops forever)', list: ['intro', 'verse', 'chorus'], loop: true, plain: 'Intro plays once. Then Verse → Chorus loops forever while the player explores.' },
  { name: 'Rhythm game song (~2 min)', list: ['intro', 'verse', 'build', 'chorus', 'break', 'build', 'chorus', 'outro'], loop: false, plain: 'A full song with a start and an end, made for a 2-minute rhythm game chart.' },
  { name: 'Boss battle', list: ['intro', 'build', 'chorus', 'verse', 'chorus'], loop: true, plain: 'Short scary intro, then straight into high energy.' },
];

const SEC_STEPS = 64; // 4 bars of 16 steps

export default function L8Structure() {
  const [list, setList] = useState<SectionId[]>(PRESETS[1].list);
  const [loopMode, setLoopMode] = useState(false);
  const [progId, setProgId] = useState('epic');
  const prog = findProgression(progId);
  const base: Song = {
    bpm: 150,
    key: 9,
    scale: prog.scale,
    progression: prog.degrees,
    drums: drumPreset('none'),
    melody: emptyMelody(4),
    chordInstrument: 'pluck',
    melodyInstrument: 'lead',
    chordStyle: 'block',
    bass: true,
  };

  const sectionAt = (s: number) => {
    const idx = Math.floor(s / SEC_STEPS);
    if (list.length === 0) return 0;
    if (loopMode && list.length > 1 && idx >= list.length) return 1 + ((idx - 1) % (list.length - 1));
    return idx % list.length;
  };

  const clock = useClock({
    bpm: base.bpm,
    totalSteps: SEC_STEPS * 400,
    onStep: (s, t, d) => {
      if (!list.length) return;
      const inner = s % SEC_STEPS;
      const id = list[sectionAt(s)];
      playStep(sectionSong(id, Math.floor(inner / 16), base), inner, t, d);
    },
  });
  const current = clock.step >= 0 ? sectionAt(clock.step) : -1;
  const progress = clock.step >= 0 ? (clock.step % SEC_STEPS) / SEC_STEPS : 0;

  return (
    <>
      <Section title="A song is made of parts">
        <p>
          A song is not the same 4 bars forever. It is built from <b>sections</b> (parts), like chapters in a book. Each part
          has a different <b>energy level</b>. Going up and down in energy keeps the player interested.
        </p>
        <div className="section-legend">
          {(Object.keys(SECTIONS) as SectionId[]).map((id) => (
            <button key={id} className="legend-item" style={{ borderColor: SECTIONS[id].color }} onClick={() => setList([...list, id].slice(0, 10))}>
              <b style={{ color: SECTIONS[id].color }}>+ {SECTIONS[id].name}</b>
              <span>{SECTIONS[id].plain}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Arrange your song">
        <p>Click a part above to add it. Click a block below to remove it. Or start from a template:</p>
        <div className="row wrap">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              className="btn small"
              onClick={() => {
                setList(p.list);
                setLoopMode(p.loop);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="timeline">
          {list.map((id, i) => (
            <button
              key={i}
              className={`tl-block ${current === i ? 'now' : ''}`}
              style={{ background: SECTIONS[id].color, height: `${30 + SECTIONS[id].energy * 18}px` }}
              onClick={() => setList(list.filter((_, j) => j !== i))}
              title="Click to remove"
            >
              <span>{SECTIONS[id].name}</span>
              {current === i && <i style={{ width: `${progress * 100}%` }} />}
            </button>
          ))}
          {list.length === 0 && <p className="muted">Empty. Add some parts!</p>}
        </div>
        <p className="muted">Block height = energy. Each block is 4 bars.</p>
        <div className="row wrap">
          <PlayButton playing={clock.playing} onClick={clock.toggle} label="Play song" />
          <Select label="Chords" value={progId} onChange={setProgId} options={PROGRESSIONS.map((p) => ({ value: p.id, label: p.name }))} />
          <label className="check">
            <input type="checkbox" checked={loopMode} onChange={(e) => setLoopMode(e.target.checked)} /> BGM loop mode (skip intro
            after the first time)
          </label>
        </div>
      </Section>

      <Section title="Game BGM vs rhythm game song">
        <div className="two-col">
          <Box kind="game" title="Game BGM (background music)">
            <ul className="list">
              <li>Plays <b>behind the gameplay</b>, so it must not be too busy. Leave space for sound effects.</li>
              <li>
                It <b>loops forever</b>. Make an intro that plays once, then a loop (A → B → back to A). The end of the loop must
                connect smoothly to the start.
              </li>
              <li>Usually 1–2 minutes before it loops.</li>
              <li>Keep the same BPM and key for the whole loop so the jump is invisible.</li>
            </ul>
          </Box>
          <Box kind="game" title="Rhythm game song">
            <ul className="list">
              <li>The music <b>is</b> the gameplay. Energy changes = difficulty changes.</li>
              <li>Usually <b>about 2 minutes</b> with a clear start and end.</li>
              <li>Use a <b>build-up</b> before the chorus/drop. Players love the tension before a big moment.</li>
              <li>A <b>break</b> gives players a short rest (and a chance for a slow, tricky pattern).</li>
              <li>Keep the BPM steady and add clear sounds where you want players to tap.</li>
            </ul>
          </Box>
        </div>
        <Box kind="tip">
          How long is a section in seconds? 4 bars × 4 beats = 16 beats. At 150 BPM that's 16 ÷ 150 × 60 ≈ <b>6.4 seconds</b>.
          A 2-minute song at 150 BPM is about 75 bars.
        </Box>
      </Section>
    </>
  );
}
