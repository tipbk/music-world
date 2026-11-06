import { KIT, KitSound, playKit } from '../audio/engine';
import { drumsFrom, Song } from '../music/song';
import { ChordStrip } from './SongPlayer';
import { Groove, HIT_VOLUME, Jam, jamSteps, playJamStep } from '../music/advanced';
import { useClock } from './useClock';

/** Plays a Jam in a loop. */
export function useJam(jam: Jam) {
  return useClock({ bpm: jam.bpm, totalSteps: jamSteps(jam), onStep: (s, t, d) => playJamStep(jam, s, t, d) });
}

const NEXT_HIT: Record<string, string> = { '.': 'x', x: 'X', X: 'g', g: '.' };
const kitName = (d: KitSound) => KIT.find((k) => k.id === d)?.name ?? d;

/**
 * A drum grid with loud / normal / soft hits. Click a box to cycle: normal → LOUD → soft (ghost) → off.
 * Shows one bar (16 boxes). `bar` picks which bar of a longer line to show.
 */
export function GrooveGrid(props: { groove: Groove; onChange?: (g: Groove) => void; step: number; lanes?: KitSound[]; bar?: number; nowBar?: boolean }) {
  const lanes = props.lanes ?? (Object.keys(props.groove) as KitSound[]);
  const inBar = props.step >= 0 && props.nowBar !== false ? props.step % 16 : -1;
  const off = (props.bar ?? 0) * 16;
  return (
    <div className="grid-scroll">
      <div className="drum-grid">
        {lanes.map((d) => {
          const line = (props.groove[d] ?? '').padEnd(off + 16, '.');
          return (
            <div className="grid-row" key={d}>
              <button className="row-label" onClick={() => playKit(d)} title="Hear it">
                {kitName(d)}
              </button>
              {Array.from({ length: 16 }, (_, i) => {
                const c = line[off + i];
                const cls = c === 'X' ? 'on accent' : c === 'x' ? 'on' : c === 'g' ? 'ghost' : '';
                return (
                  <button
                    key={i}
                    className={`cell ${cls} ${i % 4 === 0 ? 'beat' : ''} ${inBar === i ? 'now' : ''}`}
                    aria-label={`${kitName(d)} step ${i + 1}`}
                    disabled={!props.onChange}
                    onClick={() => {
                      if (!props.onChange) return;
                      const n = NEXT_HIT[c] ?? 'x';
                      if (HIT_VOLUME[n]) playKit(d, undefined, HIT_VOLUME[n]);
                      const chars = line.split('');
                      chars[off + i] = n;
                      props.onChange({ ...props.groove, [d]: chars.join('') });
                    }}
                  >
                    {c === 'X' ? '!' : ''}
                  </button>
                );
              })}
            </div>
          );
        })}
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

export function HitLegend() {
  return (
    <p className="legend muted">
      <span className="swatch accent" /> LOUD (accent) <span className="swatch on" /> normal <span className="swatch ghost" /> soft
      (ghost note). Click a box to switch: normal → LOUD → soft → off.
    </p>
  );
}

const BASS_LABEL: Record<string, string> = { R: 'R', '3': '3', '5': '5', O: '↑', N: 'N', A: 'A', C: 'A' };

/** One bar of a bass line as boxes, with an optional kick line above it for comparing. */
export function BassLane({ line, step, kick }: { line: string; step: number; kick?: string }) {
  const inBar = step >= 0 ? step % 16 : -1;
  return (
    <div className="lanes">
      {kick && (
        <div className="lane">
          <span className="lane-label">Kick</span>
          <div className="bass-boxes kick-boxes">
            {kick
              .slice(0, 16)
              .split('')
              .map((c, i) => (
                <span key={i} className={`${c === '.' ? '' : 'hit'} ${i % 4 === 0 ? 'beat' : ''} ${inBar === i ? 'now' : ''}`} />
              ))}
          </div>
        </div>
      )}
      <div className="lane">
        <span className="lane-label">Bass</span>
        <div className="bass-boxes">
          {line
            .slice(0, 16)
            .split('')
            .map((c, i) => (
              <span
                key={i}
                className={`${c === '.' ? '' : c === '-' ? 'hold' : 'hit'} ${'NAC'.includes(c) ? 'leadin' : ''} ${i % 4 === 0 ? 'beat' : ''} ${inBar === i ? 'now' : ''}`}
              >
                {BASS_LABEL[c] ?? ''}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

/** Two-way switch used for "listen to the difference" demos. Works while music plays. */
export function ABSwitch({ value, onChange, a, b }: { value: boolean; onChange: (v: boolean) => void; a: string; b: string }) {
  return (
    <div className="ab-switch" role="group">
      <button className={`btn ${!value ? 'btn-primary' : ''}`} onClick={() => onChange(false)}>
        {a}
      </button>
      <button className={`btn ${value ? 'btn-primary' : ''}`} onClick={() => onChange(true)}>
        {b}
      </button>
    </div>
  );
}

/** The chord cards for a jam, lighting up the one playing now. */
export function JamChords({ jam, step }: { jam: Jam; step: number }) {
  const song: Song = {
    bpm: jam.bpm,
    key: jam.key,
    scale: jam.scale,
    progression: jam.progression,
    drums: drumsFrom({}),
    melody: [],
    chordInstrument: jam.chordInstrument,
    melodyInstrument: 'lead',
    chordStyle: 'block',
    bass: false,
  };
  return <ChordStrip song={song} step={step} />;
}
