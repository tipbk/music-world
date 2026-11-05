import { useEffect, useState } from 'react';
import { playChord } from '../audio/engine';
import { chordOnDegree, HARMONY_SCALES, tonicFor } from '../music/theory';
import { DRUM_PRESETS, drumPreset, Song } from '../music/song';
import { RECIPES } from '../music/recipes';
import { downloadMidi } from '../music/midi';
import { ChordStrip, useSong } from '../components/SongPlayer';
import { Box, DrumGrid, InstrumentSelect, KeySelect, MelodyGrid, PlayButton, ScaleSelect, Section, Select, Slider } from '../components/ui';
import { randomMelody } from './L7Melody';

const STORE = 'music-world:studio';

function load(): Song {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const s = JSON.parse(raw) as Song;
      if (s.progression?.length === 4 && s.melody?.length === 32) return s;
    }
  } catch {
    /* ignore */
  }
  return structuredClone(RECIPES.find((r) => r.id === 'rhythm')!.song);
}

export default function L10Studio() {
  const [song, setSong] = useState<Song>(load);
  const set = (patch: Partial<Song>) => setSong((s) => ({ ...s, ...patch }));
  const player = useSong(song);
  const tonic = tonicFor(song.key);
  const mute = song.mute ?? {};

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(song));
    } catch {
      /* ignore */
    }
  }, [song]);

  const toggleMute = (k: 'drums' | 'chords' | 'bass' | 'melody') => set({ mute: { ...mute, [k]: !mute[k] } });

  return (
    <>
      <Section title="Your game music studio">
        <p>
          Put everything together and make your own 4-bar loop. Your work is <b>saved automatically</b> in this browser. When
          you like it, <b>download it as MIDI</b> and open it in a real music app (FL Studio, LMMS, GarageBand, Reaper,
          Cubase...) to keep working with better sounds.
        </p>
        <div className="studio-bar">
          <PlayButton playing={player.playing} onClick={player.toggle} label="Play loop" />
          <Select
            label="Start from a recipe"
            value=""
            onChange={(id) => {
              const r = RECIPES.find((x) => x.id === id);
              if (r) setSong(structuredClone(r.song));
            }}
            options={[{ value: '', label: 'Choose...' }, ...RECIPES.map((r) => ({ value: r.id, label: `${r.emoji} ${r.scene}` }))]}
          />
          <button className="btn btn-primary" onClick={() => downloadMidi(song)}>
            ⬇ Download MIDI
          </button>
        </div>
      </Section>

      <Section title="1. Speed, key and scale">
        <div className="row wrap">
          <Slider label="Speed" value={song.bpm} min={60} max={200} unit="BPM" onChange={(bpm) => set({ bpm })} />
          <KeySelect value={song.key} onChange={(key) => set({ key })} />
          <ScaleSelect value={song.scale} onChange={(scale) => set({ scale })} only={HARMONY_SCALES} />
        </div>
      </Section>

      <Section title="2. Chords (one per bar)">
        <div className="custom-prog">
          {song.progression.map((d, bar) => (
            <div key={bar} className="custom-slot">
              <span className="muted">Bar {bar + 1}</span>
              <div className="mini-pads">
                {Array.from({ length: 7 }, (_, deg) => {
                  const c = chordOnDegree(tonic, song.scale, deg);
                  return (
                    <button
                      key={deg}
                      className={`mini-pad ${c.quality} ${d === deg ? 'sel' : ''}`}
                      onClick={() => {
                        set({ progression: song.progression.map((x, i) => (i === bar ? deg : x)) });
                        playChord(c.notes, { duration: 0.6, instrument: song.chordInstrument });
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
        <ChordStrip song={song} step={player.step} />
        <div className="row wrap">
          <InstrumentSelect label="Chord sound" value={song.chordInstrument} onChange={(chordInstrument) => set({ chordInstrument })} />
          <Select
            label="Chord style"
            value={song.chordStyle}
            onChange={(chordStyle) => set({ chordStyle })}
            options={[
              { value: 'block', label: 'Long (hold)' },
              { value: 'pulse', label: 'Pulse (every beat)' },
              { value: 'arp', label: 'Arpeggio' },
            ]}
          />
          <label className="check">
            <input type="checkbox" checked={song.bass} onChange={(e) => set({ bass: e.target.checked })} /> Bass line
          </label>
        </div>
      </Section>

      <Section title="3. Drums">
        <div className="row wrap">
          {DRUM_PRESETS.map((p) => (
            <button key={p.id} className="btn small" onClick={() => set({ drums: drumPreset(p.id) })}>
              {p.name}
            </button>
          ))}
        </div>
        <DrumGrid drums={song.drums} onChange={(drums) => set({ drums })} step={player.step} />
      </Section>

      <Section title="4. Melody">
        <div className="row wrap">
          <InstrumentSelect label="Melody sound" value={song.melodyInstrument} onChange={(melodyInstrument) => set({ melodyInstrument })} />
          <button className="btn small" onClick={() => set({ melody: randomMelody(song.progression, 7) })}>
            🎲 Random safe melody
          </button>
          <button className="btn small" onClick={() => set({ melody: Array(32).fill(null) })}>
            Clear melody
          </button>
        </div>
        <MelodyGrid
          melody={song.melody}
          onChange={(melody) => set({ melody })}
          tonic={tonic + 12}
          scale={song.scale}
          step={player.step}
          instrument={song.melodyInstrument}
          chordTones={(c) => [0, 2, 4].map((x) => song.progression[Math.floor(c / 8)] + x)}
        />
      </Section>

      <Section title="5. Mixer">
        <p className="muted">Turn parts on and off to hear each layer alone. This is how producers check their music.</p>
        <div className="row wrap">
          {(['drums', 'chords', 'bass', 'melody'] as const).map((k) => (
            <button key={k} className={`btn ${mute[k] ? '' : 'btn-primary'}`} onClick={() => toggleMute(k)}>
              {mute[k] ? '🔇' : '🔊'} {k}
            </button>
          ))}
        </div>
        <Box kind="tip" title="Next steps after this site">
          <ol className="list">
            <li>Download your loop as MIDI.</li>
            <li>Open it in a free music app like <b>LMMS</b>, <b>Cakewalk</b>, or <b>GarageBand</b> (Mac/iPhone).</li>
            <li>Replace the sounds with better instruments, add a second section (B part), and you have a real game track.</li>
            <li>For rhythm games: keep the BPM steady and remember your BPM. The chart maker needs it!</li>
          </ol>
        </Box>
      </Section>
    </>
  );
}
