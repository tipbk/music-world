import { ReactNode, useState } from 'react';
import { DRUMS, Drum, Instrument, INSTRUMENTS, playDrum, playNote } from '../audio/engine';
import { degreeToMidi, isBlackKey, NOTE_NAMES, noteName, ScaleId, SCALES } from '../music/theory';
import { DrumPattern, MELODY_ROWS } from '../music/song';

export function Box({ kind, title, children }: { kind: 'idea' | 'game' | 'tip' | 'try'; title?: string; children: ReactNode }) {
  const icon = { idea: '💡', game: '🎮', tip: '✨', try: '👉' }[kind];
  const label = title ?? { idea: 'In plain words', game: 'For game music', tip: 'Tip', try: 'Try this' }[kind];
  return (
    <div className={`box box-${kind}`}>
      <div className="box-title">
        <span aria-hidden>{icon}</span> {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function PlayButton({ playing, onClick, label }: { playing: boolean; onClick: () => void; label?: string }) {
  return (
    <button className={`btn btn-play ${playing ? 'is-on' : ''}`} onClick={onClick}>
      {playing ? '■ Stop' : `▶ ${label ?? 'Play'}`}
    </button>
  );
}

export function Slider(props: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <label className="slider">
      <span>
        {props.label}: <b>{props.value}{props.unit ? ` ${props.unit}` : ''}</b>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Select<T extends string | number>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="select">
      <span>{props.label}</span>
      <select
        value={String(props.value)}
        onChange={(e) => {
          const found = props.options.find((o) => String(o.value) === e.target.value);
          if (found) props.onChange(found.value);
        }}
      >
        {props.options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export const KeySelect = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <Select label="Key (home note)" value={value} onChange={onChange} options={NOTE_NAMES.map((n, i) => ({ value: i, label: n }))} />
);

export const ScaleSelect = ({ value, onChange, only }: { value: ScaleId; onChange: (v: ScaleId) => void; only?: ScaleId[] }) => (
  <Select
    label="Scale"
    value={value}
    onChange={onChange}
    options={(only ?? (Object.keys(SCALES) as ScaleId[])).map((s) => ({ value: s, label: SCALES[s].name }))}
  />
);

export const InstrumentSelect = ({ label, value, onChange }: { label: string; value: Instrument; onChange: (v: Instrument) => void }) => (
  <Select label={label} value={value} onChange={onChange} options={INSTRUMENTS.filter((i) => i.id !== 'bass').map((i) => ({ value: i.id, label: i.name }))} />
);

/** A clickable piano keyboard. */
export function Piano(props: {
  from?: number;
  to?: number;
  labels?: 'all' | 'white' | 'none';
  highlight?: Set<number>; // pitch classes or exact midi numbers (see highlightExact)
  highlightExact?: boolean;
  home?: number; // pitch class to mark as home
  active?: Set<number>;
  onPress?: (midi: number) => void;
  instrument?: Instrument;
  silent?: boolean;
}) {
  const from = props.from ?? 60;
  const to = props.to ?? 83;
  const [pressed, setPressed] = useState<number | null>(null);
  const whites: number[] = [];
  for (let m = from; m <= to; m++) if (!isBlackKey(m)) whites.push(m);
  const w = 100 / whites.length;

  const press = (m: number) => {
    if (!props.silent) playNote(m, { instrument: props.instrument ?? 'piano', duration: 0.5 });
    setPressed(m);
    window.setTimeout(() => setPressed((p) => (p === m ? null : p)), 200);
    props.onPress?.(m);
  };
  const isHi = (m: number) => props.highlight && (props.highlightExact ? props.highlight.has(m) : props.highlight.has(m % 12));
  const cls = (m: number) =>
    [
      'key',
      isBlackKey(m) ? 'black' : 'white',
      isHi(m) ? 'hi' : '',
      props.home !== undefined && m % 12 === props.home ? 'home' : '',
      props.active?.has(m) || pressed === m ? 'down' : '',
    ].join(' ');
  const showLabel = (m: number) => props.labels === 'all' || (props.labels !== 'none' && !isBlackKey(m));

  return (
    <div className="piano" role="group" aria-label="Piano keyboard">
      {whites.map((m, i) => (
        <button key={m} className={cls(m)} style={{ left: `${i * w}%`, width: `${w}%` }} onPointerDown={() => press(m)} aria-label={noteName(m, true)}>
          {showLabel(m) && <span>{noteName(m)}</span>}
        </button>
      ))}
      {Array.from({ length: to - from + 1 }, (_, i) => from + i)
        .filter(isBlackKey)
        .map((m) => {
          const leftWhite = whites.indexOf(m - 1);
          return (
            <button
              key={m}
              className={cls(m)}
              style={{ left: `${(leftWhite + 1) * w - w * 0.3}%`, width: `${w * 0.6}%` }}
              onPointerDown={() => press(m)}
              aria-label={noteName(m, true)}
            >
              {showLabel(m) && <span>{noteName(m)}</span>}
            </button>
          );
        })}
    </div>
  );
}

/** 16-step drum grid. */
export function DrumGrid({ drums, onChange, step }: { drums: DrumPattern; onChange: (d: DrumPattern) => void; step: number }) {
  const inBar = step >= 0 ? step % 16 : -1;
  return (
    <div className="grid-scroll">
      <div className="drum-grid">
        {DRUMS.map((d) => (
          <div className="grid-row" key={d.id}>
            <button className="row-label" onClick={() => playDrum(d.id as Drum)} title="Hear it">
              {d.name}
            </button>
            {drums[d.id].map((on, i) => (
              <button
                key={i}
                className={`cell ${on ? 'on' : ''} ${i % 4 === 0 ? 'beat' : ''} ${inBar === i ? 'now' : ''}`}
                aria-label={`${d.name} step ${i + 1}`}
                onClick={() => {
                  const next = { ...drums, [d.id]: drums[d.id].map((v, j) => (j === i ? !v : v)) };
                  if (!on) playDrum(d.id as Drum);
                  onChange(next);
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
  );
}

/** Melody grid: rows are scale notes, columns are 8th notes. One note per column. */
export function MelodyGrid(props: {
  melody: (number | null)[];
  onChange: (m: (number | null)[]) => void;
  tonic: number;
  scale: ScaleId;
  step: number; // 16th step
  chordTones?: (col: number) => number[]; // scale degrees in the current chord, for hints
  instrument: Instrument;
}) {
  const rows = Array.from({ length: MELODY_ROWS }, (_, i) => MELODY_ROWS - 1 - i);
  const col = props.step >= 0 ? Math.floor(props.step / 2) % props.melody.length : -1;
  const len = SCALES[props.scale].steps.length;
  return (
    <div className="grid-scroll">
      <div className="melody-grid" style={{ gridTemplateColumns: `56px repeat(${props.melody.length}, minmax(22px, 1fr))` }}>
        {rows.map((r) => {
          const midi = degreeToMidi(props.tonic, props.scale, r);
          return [
            <button key={`l${r}`} className={`row-label ${r % len === 0 ? 'home-row' : ''}`} onClick={() => playNote(midi, { instrument: props.instrument })}>
              {noteName(midi)}
            </button>,
            ...props.melody.map((v, c) => {
              const hint = props.chordTones?.(c).some((d) => d % len === r % len);
              return (
                <button
                  key={`${r}-${c}`}
                  className={`cell ${v === r ? 'on' : ''} ${c % 2 === 0 ? 'beat' : ''} ${c % 8 === 0 ? 'bar' : ''} ${hint ? 'hint' : ''} ${col === c ? 'now' : ''}`}
                  aria-label={`${noteName(midi)} at step ${c + 1}`}
                  onClick={() => {
                    const next = [...props.melody];
                    next[c] = v === r ? null : r;
                    if (v !== r) playNote(midi, { instrument: props.instrument, duration: 0.3 });
                    props.onChange(next);
                  }}
                />
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}

/** A small ear-training / knowledge quiz. Each round is generated by makeRound. */
export interface Round {
  prompt: string;
  play?: () => void;
  options: string[];
  answer: string;
  explain?: string;
}

export function Quiz({ title, makeRound, goal = 5 }: { title: string; makeRound: () => Round; goal?: number }) {
  const [round, setRound] = useState<Round>(makeRound);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);

  const next = () => {
    const r = makeRound();
    setRound(r);
    setPicked(null);
    r.play?.();
  };
  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    setTries((t) => t + 1);
    if (o === round.answer) setScore((s) => s + 1);
  };
  const done = score >= goal;

  return (
    <div className="quiz">
      <div className="quiz-head">
        <h3>🎯 {title}</h3>
        <span className="score">
          {score} / {goal} correct{tries > 0 ? ` (${tries} tries)` : ''}
        </span>
      </div>
      <div className="progress-bar">
        <div style={{ width: `${Math.min(100, (score / goal) * 100)}%` }} />
      </div>
      {done && <p className="win">🏆 Great job! You passed this quiz. Keep going for more practice.</p>}
      <p className="quiz-prompt">{round.prompt}</p>
      {round.play && (
        <button className="btn" onClick={round.play}>
          🔊 Play sound
        </button>
      )}
      <div className="quiz-options">
        {round.options.map((o) => (
          <button
            key={o}
            className={`btn option ${picked && o === round.answer ? 'right' : ''} ${picked === o && o !== round.answer ? 'wrong' : ''}`}
            onClick={() => choose(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {picked && (
        <div className="quiz-result">
          <p>{picked === round.answer ? '✅ Correct!' : `❌ Not quite. The answer is "${round.answer}".`}</p>
          {round.explain && <p className="muted">{round.explain}</p>}
          <button className="btn btn-primary" onClick={next}>
            Next question →
          </button>
        </div>
      )}
    </div>
  );
}

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
