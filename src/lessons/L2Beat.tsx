import { useEffect, useRef, useState } from 'react';
import { audio, click, playDrum } from '../audio/engine';
import { useClock } from '../components/useClock';
import { Box, PlayButton, Quiz, Section, Slider, pick } from '../components/ui';

function BeatDots({ step, count = 4 }: { step: number; count?: number }) {
  return (
    <div className="beat-dots">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`${step === i ? 'lit' : ''} ${i === 0 ? 'one' : ''}`}>
          {i + 1}
        </span>
      ))}
    </div>
  );
}

function Metronome() {
  const [bpm, setBpm] = useState(100);
  const m = useClock({ bpm, totalSteps: 4, stepsPerBeat: 1, onStep: (s, t) => click(t, s === 0) });
  return (
    <div className="panel">
      <BeatDots step={m.step} />
      <Slider label="Speed" value={bpm} min={50} max={200} unit="BPM" onChange={setBpm} />
      <div className="row">
        <PlayButton playing={m.playing} onClick={m.toggle} label="Start metronome" />
        {[70, 100, 128, 150, 180].map((b) => (
          <button key={b} className="btn small" onClick={() => setBpm(b)}>
            {b}
          </button>
        ))}
      </div>
      <p className="muted">
        {bpm < 80 ? 'Slow: calm, sad, peaceful.' : bpm < 115 ? 'Medium: walking, normal life.' : bpm < 150 ? 'Fast: action, dance, EDM.' : 'Very fast: intense battle, hard rhythm game songs.'}
      </p>
    </div>
  );
}

function TapTempo() {
  const taps = useRef<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const tap = () => {
    const t = performance.now();
    taps.current = [...taps.current.filter((x) => t - x < 3000), t].slice(-8);
    playDrum('hat');
    if (taps.current.length >= 2) {
      const gaps = taps.current.slice(1).map((x, i) => x - taps.current[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.round(60000 / avg));
    }
  };
  return (
    <div className="panel">
      <button className="btn btn-big" onClick={tap}>
        TAP
      </button>
      <p className="readout">{bpm ? `Your tempo: ${bpm} BPM` : 'Tap at least 2 times to the beat of a song in your head.'}</p>
    </div>
  );
}

type Judge = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

function TimingGame() {
  const [bpm, setBpm] = useState(110);
  const beats = useRef<number[]>([]);
  const m = useClock({
    bpm,
    totalSteps: 4,
    stepsPerBeat: 1,
    onStep: (s, t) => {
      playDrum(s % 2 === 0 ? 'kick' : 'snare', t);
      beats.current = [...beats.current.slice(-8), t];
    },
  });
  const [judge, setJudge] = useState<{ j: Judge; ms: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [stats, setStats] = useState<Record<Judge, number>>({ PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 });

  const hit = () => {
    if (!m.playing) return;
    const { ctx } = audio();
    const t = ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
    let best = Infinity;
    beats.current.forEach((b) => {
      if (Math.abs(t - b) < Math.abs(best)) best = t - b;
    });
    const ms = Math.round(best * 1000);
    const a = Math.abs(ms);
    const j: Judge = a < 45 ? 'PERFECT' : a < 90 ? 'GREAT' : a < 140 ? 'GOOD' : 'MISS';
    setJudge({ j, ms });
    setCombo((c) => (j === 'MISS' ? 0 : c + 1));
    setStats((s) => ({ ...s, [j]: s[j] + 1 }));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyF') {
        e.preventDefault();
        hit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="panel timing">
      <BeatDots step={m.step} />
      <div className="row">
        <PlayButton playing={m.playing} onClick={m.toggle} label="Start the beat" />
        <Slider label="Speed" value={bpm} min={70} max={180} unit="BPM" onChange={setBpm} />
      </div>
      <button className={`hit-pad ${m.step >= 0 ? 'pulse' : ''}`} onPointerDown={hit}>
        HIT
        <small>(or press Space / F / J)</small>
      </button>
      <div className={`judge judge-${judge?.j ?? 'none'}`}>
        {judge ? (
          <>
            {judge.j} <small>{judge.ms > 0 ? `${judge.ms}ms late` : judge.ms < 0 ? `${-judge.ms}ms early` : 'exact!'}</small>
          </>
        ) : (
          'Hit on every beat'
        )}
      </div>
      <p className="muted">
        Combo: <b>{combo}</b> · Perfect {stats.PERFECT} · Great {stats.GREAT} · Good {stats.GOOD} · Miss {stats.MISS}
      </p>
    </div>
  );
}

export default function L2Beat() {
  return (
    <>
      <Section title="The beat is the heartbeat of music">
        <p>
          When you nod your head or tap your foot to a song, you are following the <b>beat</b>. The beat is a steady pulse,
          like a clock: tick, tick, tick, tick.
        </p>
        <p>
          <b>BPM</b> means <b>Beats Per Minute</b>. It is the speed of the beat. 60 BPM = one beat every second. 120 BPM = two
          beats every second.
        </p>
        <Metronome />
        <Box kind="idea">
          Beats are grouped in fours. One group of 4 beats is called a <b>bar</b> (also called a <b>measure</b>). Count it: "
          <b>1</b>, 2, 3, 4, <b>1</b>, 2, 3, 4". Beat 1 is the strongest, so the metronome plays it higher.
        </Box>
      </Section>

      <Section title="Find the BPM yourself">
        <p>Think of any song and tap along to it. The site will tell you its speed.</p>
        <TapTempo />
        <Box kind="game">
          <b>Rhythm games are built on BPM.</b> The game puts notes on the screen exactly on the beat, so the song must keep
          a <b>steady BPM</b>. Common speeds: casual songs 100–130 BPM, normal 140–170 BPM, very hard songs 180–220+ BPM.
          For game BGM: towns 80–110, fields 110–130, battles 140–180.
        </Box>
      </Section>

      <Section title="Mini rhythm game: hit the beat">
        <p>
          This is how a rhythm game judges you. Press the button exactly when the drum hits. Closer to the beat = better score.
          Try a slow speed first.
        </p>
        <TimingGame />
        <Box kind="tip">
          A "PERFECT" in most rhythm games is within about 30–50 milliseconds of the beat. As a composer, you make the game fun
          by putting <b>clear sounds</b> (like a kick or snare) where you want the player to hit.
        </Box>
      </Section>

      <Quiz
        title="Speed quiz: guess the tempo"
        makeRound={() => {
          const choices = [
            { label: 'Slow (about 70)', bpm: 70 },
            { label: 'Medium (about 110)', bpm: 110 },
            { label: 'Fast (about 160)', bpm: 160 },
          ];
          const c = pick(choices);
          return {
            prompt: 'Listen to 8 clicks. Is this slow, medium, or fast?',
            play: () => {
              const { ctx } = audio();
              const gap = 60 / c.bpm;
              for (let i = 0; i < 8; i++) click(ctx.currentTime + 0.05 + i * gap, i % 4 === 0);
            },
            options: choices.map((x) => x.label),
            answer: c.label,
            explain: `That was ${c.bpm} BPM.`,
          };
        }}
      />
    </>
  );
}
