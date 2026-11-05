import { useState } from 'react';
import { Drum, DRUMS, playDrum } from '../audio/engine';
import { DRUM_PRESETS, drumPreset, DrumPattern } from '../music/song';
import { useClock } from '../components/useClock';
import { Box, DrumGrid, pick, PlayButton, Quiz, Section, Slider } from '../components/ui';

export function useDrumLoop(drums: DrumPattern, bpm: number) {
  return useClock({
    bpm,
    totalSteps: 16,
    onStep: (s, t) => (Object.keys(drums) as Drum[]).forEach((d) => drums[d][s] && playDrum(d, t)),
  });
}

export default function L3Drums() {
  const [drums, setDrums] = useState<DrumPattern>(() => drumPreset('rock'));
  const [bpm, setBpm] = useState(110);
  const [preset, setPreset] = useState('rock');
  const loop = useDrumLoop(drums, bpm);
  const info = DRUM_PRESETS.find((p) => p.id === preset);

  return (
    <>
      <Section title="Meet the drum kit">
        <p>Most game music uses just 4 drum sounds. Click each one to hear it.</p>
        <div className="drum-cards">
          {DRUMS.map((d) => (
            <button key={d.id} className="drum-card" onClick={() => playDrum(d.id)}>
              <b>{d.name}</b>
              <span>{d.plain}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Rhythm = where you put the sounds">
        <p>
          We split each beat into <b>4 small boxes</b>. One bar has 4 beats, so it has <b>16 boxes</b>. Turn a box on and that
          drum plays there. The big numbers 1 2 3 4 show where the beats are.
        </p>
        <Box kind="idea">
          This is called a <b>step sequencer</b>. Real music apps (FL Studio, LMMS, GarageBand) have the exact same thing.
          What you learn here works there too.
        </Box>
        <div className="row wrap">
          {DRUM_PRESETS.map((p) => (
            <button
              key={p.id}
              className={`btn small ${preset === p.id ? 'btn-primary' : ''}`}
              onClick={() => {
                setPreset(p.id);
                setDrums(drumPreset(p.id));
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        {info && <p className="muted">{info.plain}</p>}
        <DrumGrid drums={drums} onChange={(d) => { setDrums(d); setPreset(''); }} step={loop.step} />
        <div className="row">
          <PlayButton playing={loop.playing} onClick={loop.toggle} label="Play beat" />
          <Slider label="Speed" value={bpm} min={60} max={200} unit="BPM" onChange={setBpm} />
        </div>
        <Box kind="try">
          Start from "No drums". Put a <b>Kick</b> on 1 and 3, a <b>Snare</b> on 2 and 4, and a <b>Hi-hat</b> on every second
          box. You just made the most famous beat in pop music!
        </Box>
      </Section>

      <Section title="How drums change the feeling">
        <ul className="list">
          <li><b>More kicks</b> = more energy, more push forward (battle music).</li>
          <li><b>Fewer hits</b> = calm, space to breathe (town, sad scene).</li>
          <li><b>Fast hi-hats</b> = feels faster even at the same BPM.</li>
          <li><b>No drums</b> at all = dreamy, emotional, or an intro before the action starts.</li>
        </ul>
        <Box kind="game">
          In rhythm games, players often tap along to the drums. A <b>kick on every beat</b> (Four on the Floor) is the easiest
          to follow, so it is great for easy difficulty. Off-beat hits (boxes between the big numbers) feel cool but are harder
          to play.
        </Box>
      </Section>

      <Quiz
        title="Ear quiz: which drum is it?"
        makeRound={() => {
          const d = pick(DRUMS);
          return {
            prompt: 'Listen. Which drum sound is this?',
            play: () => playDrum(d.id),
            options: DRUMS.map((x) => x.name),
            answer: d.name,
            explain: d.plain,
          };
        }}
      />
    </>
  );
}
