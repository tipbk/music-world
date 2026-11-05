import { useState } from 'react';
import { NOTE_NAMES, SCALES } from '../music/theory';
import { playOnce } from '../music/song';
import { RECIPES } from '../music/recipes';
import { ChordStrip, useSong } from '../components/SongPlayer';
import { Box, pick, PlayButton, Quiz, Section, shuffle } from '../components/ui';

export default function L9Moods() {
  const [id, setId] = useState('battle');
  const r = RECIPES.find((x) => x.id === id)!;
  const player = useSong(r.song);

  return (
    <>
      <Section title="Every game scene has a recipe">
        <p>
          Now you know the ingredients: <b>speed (BPM)</b>, <b>scale</b>, <b>chords</b>, <b>drums</b>, <b>sound</b> and{' '}
          <b>melody</b>. Mix them in different ways and you get different moods. Here are 8 recipes for common game scenes.
          Click one and press play.
        </p>
        <div className="recipe-grid">
          {RECIPES.map((x) => (
            <button key={x.id} className={`recipe ${x.id === id ? 'sel' : ''}`} onClick={() => setId(x.id)}>
              <span className="emoji">{x.emoji}</span>
              <b>{x.scene}</b>
            </button>
          ))}
        </div>
        <div className="panel">
          <h3>
            {r.emoji} {r.scene}
          </h3>
          <div className="row wrap">
            <PlayButton playing={player.playing} onClick={player.toggle} label={`Play ${r.scene}`} />
          </div>
          <ChordStrip song={r.song} step={player.step} />
          <div className="two-col">
            <div>
              <b>Why it sounds like this:</b>
              <ul className="list">
                {r.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="recipe-card">
              <div>
                <b>BPM:</b> {r.song.bpm}
              </div>
              <div>
                <b>Key:</b> {NOTE_NAMES[r.song.key]} {SCALES[r.song.scale].name}
              </div>
              <div>
                <b>Drums:</b> {guessDrumName(r.song.drums)}
              </div>
              <div>
                <b>Chord style:</b> {r.song.chordStyle}
              </div>
            </div>
          </div>
        </div>
        <Box kind="try">
          Open the <b>Studio</b> (last lesson) and load one of these recipes. Then change ONE thing, like the scale from minor to
          major, and hear how the scene changes. A battle in major sounds like a fun sports game!
        </Box>
      </Section>

      <Section title="Quick mood cheat sheet">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>I want it to feel...</th>
                <th>Try this</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Happy, safe</td><td>Major scale, 90–120 BPM, soft drums</td></tr>
              <tr><td>Sad, emotional</td><td>Start on a minor chord, slow, no drums, long pad notes</td></tr>
              <tr><td>Exciting, action</td><td>Minor scale, 140–180 BPM, many kicks, fast arpeggio</td></tr>
              <tr><td>Scary, tense</td><td>Harmonic minor, few notes, lots of silence, low sounds</td></tr>
              <tr><td>Mysterious</td><td>Dorian, slow arpeggio, melody with long notes</td></tr>
              <tr><td>Retro / cute</td><td>8-bit chip sound, major, fast hi-hats</td></tr>
              <tr><td>Rhythm game banger</td><td>150–180 BPM, four-on-the-floor kick, Royal Road or Epic chords, build-up before chorus</td></tr>
            </tbody>
          </table>
        </div>
        <Box kind="game">
          A great trick in games: use the <b>same melody</b> in different recipes. The town theme played in minor and fast
          becomes the battle theme. Players feel it is the "same world". This is called a <b>leitmotif</b>.
        </Box>
      </Section>

      <Quiz
        title="Scene quiz: where are you in the game?"
        makeRound={() => {
          const opts = shuffle(RECIPES).slice(0, 3);
          const ans = pick(opts);
          return {
            prompt: 'Listen to 2 bars of music. Which scene is it?',
            play: () => playOnce(ans.song, 2),
            options: opts.map((o) => `${o.emoji} ${o.scene}`),
            answer: `${ans.emoji} ${ans.scene}`,
            explain: ans.why.join(' · '),
          };
        }}
      />
    </>
  );
}

function guessDrumName(d: { kick: boolean[]; snare: boolean[]; clap: boolean[]; hat: boolean[] }) {
  const hits = Object.values(d).reduce((a, r) => a + r.filter(Boolean).length, 0);
  if (hits === 0) return 'None';
  if (hits <= 5) return 'Very light';
  if (hits <= 14) return 'Medium';
  return 'Busy';
}
