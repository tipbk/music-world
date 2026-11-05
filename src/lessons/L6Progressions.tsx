import { useState } from 'react';
import { now, playChord } from '../audio/engine';
import { chordOnDegree, findProgression, HARMONY_SCALES, Progression, PROGRESSIONS, ScaleId, tonicFor } from '../music/theory';
import { ChordStyle, DRUM_PRESETS, drumPreset, emptyMelody, Song } from '../music/song';
import { ChordStrip, useSong } from '../components/SongPlayer';
import { Box, InstrumentSelect, KeySelect, pick, PlayButton, Quiz, ScaleSelect, Section, Select, shuffle, Slider } from '../components/ui';
import { Instrument } from '../audio/engine';

export default function L6Progressions() {
  const [progId, setProgId] = useState('pop');
  const [key, setKey] = useState(0);
  const [bpm, setBpm] = useState(110);
  const [drums, setDrums] = useState('rock');
  const [style, setStyle] = useState<ChordStyle>('pulse');
  const [inst, setInst] = useState<Instrument>('piano');
  const prog = findProgression(progId);
  const song: Song = {
    bpm,
    key,
    scale: prog.scale,
    progression: prog.degrees,
    drums: drumPreset(drums),
    melody: emptyMelody(4),
    chordInstrument: inst,
    melodyInstrument: 'lead',
    chordStyle: style,
    bass: true,
  };
  const player = useSong(song);

  // Custom builder
  const [cScale, setCScale] = useState<ScaleId>('major');
  const [custom, setCustom] = useState([0, 3, 4, 0]);
  const cTonic = tonicFor(key);
  const customSong: Song = { ...song, scale: cScale, progression: custom, drums: drumPreset('calm') };
  const customPlayer = useSong(customSong);

  return (
    <>
      <Section title="A chord progression tells a story">
        <p>
          A <b>chord progression</b> is a list of chords played one after another, usually <b>one chord per bar</b>, then it
          loops. Most game music is just <b>4 chords repeating</b>! The order of the chords creates the feeling.
        </p>
        <Box kind="idea">
          Think of it as a short trip: you start at home (I), go somewhere (IV, vi...), feel tension (V), and come back home.
          That "leave home, come back" feeling is what makes music satisfying.
        </Box>
        <div className="prog-list">
          {PROGRESSIONS.map((p) => (
            <button key={p.id} className={`prog-item ${p.id === progId ? 'sel' : ''}`} onClick={() => setProgId(p.id)}>
              <b>{p.name}</b>
              <span className="muted">{p.degrees.map((d) => chordOnDegree(60, p.scale, d).roman).join(' – ')}</span>
            </button>
          ))}
        </div>
        <div className="panel">
          <p>
            <b>{prog.name}</b>: {prog.feel}
            <br />
            🎮 <b>Game use:</b> {prog.gameUse}
          </p>
          <ChordStrip song={song} step={player.step} />
          <div className="row wrap">
            <PlayButton playing={player.playing} onClick={player.toggle} label="Play loop" />
            <KeySelect value={key} onChange={setKey} />
            <Select label="Drums" value={drums} onChange={setDrums} options={DRUM_PRESETS.map((d) => ({ value: d.id, label: d.name }))} />
            <Select
              label="Chord style"
              value={style}
              onChange={setStyle}
              options={[
                { value: 'block', label: 'Long (hold)' },
                { value: 'pulse', label: 'Pulse (every beat)' },
                { value: 'arp', label: 'Arpeggio (one note at a time)' },
              ]}
            />
            <InstrumentSelect label="Sound" value={inst} onChange={setInst} />
            <Slider label="Speed" value={bpm} min={60} max={190} unit="BPM" onChange={setBpm} />
          </div>
        </div>
        <Box kind="tip">
          Change the <b>key</b> while it plays. The song moves higher or lower but the feeling stays the same. Now change the{' '}
          <b>chord style</b> or <b>drums</b>: same chords, very different music! An <b>arpeggio</b> (notes one by one) is
          super common in game music.
        </Box>
      </Section>

      <Section title="Build your own progression">
        <p>Pick 4 chords from your key. Tip: start with I, and end with V or IV so it loops back nicely.</p>
        <div className="row wrap">
          <ScaleSelect value={cScale} onChange={setCScale} only={HARMONY_SCALES} />
        </div>
        <div className="custom-prog">
          {custom.map((d, bar) => (
            <div key={bar} className="custom-slot">
              <span className="muted">Bar {bar + 1}</span>
              <div className="mini-pads">
                {Array.from({ length: 7 }, (_, deg) => {
                  const c = chordOnDegree(cTonic, cScale, deg);
                  return (
                    <button
                      key={deg}
                      className={`mini-pad ${c.quality} ${d === deg ? 'sel' : ''}`}
                      onClick={() => {
                        setCustom(custom.map((x, i) => (i === bar ? deg : x)));
                        playChord(c.notes, { duration: 0.6 });
                      }}
                    >
                      {c.roman}
                      <small>{c.name}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <ChordStrip song={customSong} step={customPlayer.step} />
        <PlayButton playing={customPlayer.playing} onClick={customPlayer.toggle} label="Play my progression" />
        <Box kind="game">
          <b>For looping BGM:</b> the last chord should make you want to hear the first chord again. Ending on <b>V</b> (or
          VII in minor) does this best. That's why game music can loop for an hour without feeling like it "stops".
        </Box>
      </Section>

      <Quiz
        title="Mood quiz: what scene is this?"
        makeRound={() => {
          const opts = shuffle(PROGRESSIONS).slice(0, 3);
          const p: Progression = pick(opts);
          const t = tonicFor(Math.floor(Math.random() * 7));
          return {
            prompt: 'Listen to these 4 chords. Which progression is it?',
            play: () => {
              const s = now() + 0.05;
              p.degrees.forEach((d, i) => {
                const c = chordOnDegree(t, p.scale, d);
                playChord(c.notes.map((n) => (n > 67 ? n - 12 : n)), { time: s + i * 0.9, duration: 0.85 });
              });
            },
            options: opts.map((o) => o.name),
            answer: p.name,
            explain: `${p.name}: ${p.feel}`,
          };
        }}
      />
    </>
  );
}
