import { chordOnDegree, tonicFor } from '../music/theory';
import { playStep, Song, totalSteps } from '../music/song';
import { useClock } from './useClock';
import { PlayButton } from './ui';

/** Hook that plays a Song in a loop. */
export function useSong(song: Song) {
  return useClock({
    bpm: song.bpm,
    totalSteps: totalSteps(song),
    onStep: (s, t, d) => playStep(song, s, t, d),
  });
}

/** Shows the chords of a song as cards, lighting up the one playing now. */
export function ChordStrip({ song, step }: { song: Song; step: number }) {
  const tonic = tonicFor(song.key);
  const bar = step >= 0 ? Math.floor(step / 16) : -1;
  return (
    <div className="chord-strip">
      {song.progression.map((d, i) => {
        const c = chordOnDegree(tonic, song.scale, d);
        return (
          <div key={i} className={`chord-card ${c.quality} ${bar === i ? 'now' : ''}`}>
            <div className="chord-name">{c.name}</div>
            <div className="chord-roman">{c.roman}</div>
            <div className="beats">
              {[0, 1, 2, 3].map((b) => (
                <span key={b} className={bar === i && Math.floor((step % 16) / 4) === b ? 'lit' : ''} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SongTransport({ song, label }: { song: Song; label?: string }) {
  const p = useSong(song);
  return (
    <div className="transport">
      <PlayButton playing={p.playing} onClick={p.toggle} label={label} />
      <ChordStrip song={song} step={p.step} />
    </div>
  );
}
