import { useState } from 'react';
import { now, playNote } from '../audio/engine';
import { degreeToMidi, NOTE_NAMES, noteName, ScaleId, SCALES, tonicFor } from '../music/theory';
import { Box, KeySelect, pick, Piano, Quiz, ScaleSelect, Section } from '../components/ui';

function playScale(tonic: number, scale: ScaleId, speed = 0.25) {
  const len = SCALES[scale].steps.length;
  const t = now() + 0.05;
  for (let i = 0; i <= len; i++) playNote(degreeToMidi(tonic, scale, i), { time: t + i * speed, duration: speed * 0.9 });
}

export default function L4Scales() {
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState<ScaleId>('major');
  const tonic = tonicFor(key);
  const info = SCALES[scale];
  const pcs = new Set(info.steps.map((s) => (key + s) % 12));
  const names = info.steps.map((s) => NOTE_NAMES[(key + s) % 12]);

  return (
    <>
      <Section title="A scale is your color palette">
        <p>
          You have 12 notes, but most songs only use <b>7 of them</b>. That chosen group of notes is called a <b>scale</b>.
          Think of it like a painter choosing 7 colors before painting. If you only use notes from your scale, your music will
          sound "right".
        </p>
        <p>
          The <b>key</b> is the scale's <b>home note</b>. "C major" means: the major scale, starting at home note C. Songs
          usually feel finished when they land on the home note.
        </p>
        <div className="row wrap">
          <KeySelect value={key} onChange={setKey} />
          <ScaleSelect value={scale} onChange={setScale} />
          <button className="btn btn-primary" onClick={() => playScale(tonic, scale)}>
            ▶ Play scale
          </button>
        </div>
        <div className="scale-info">
          <div>
            <b>
              {NOTE_NAMES[key]} {info.name}:
            </b>{' '}
            {names.join(' · ')}
          </div>
          <div>
            <b>Feels:</b> {info.mood}
          </div>
          <div>
            <b>Game use:</b> {info.gameUse}
          </div>
        </div>
        <p className="muted">Glowing keys are in the scale. The home note has a dot. Play only glowing keys and make a tune!</p>
        <Piano from={48} to={83} labels="white" highlight={pcs} home={key} />
      </Section>

      <Section title="Major vs Minor: happy vs sad">
        <p>The two most important scales. Listen to both starting from the same note:</p>
        <div className="row">
          <button className="btn" onClick={() => playScale(tonic, 'major')}>
            😊 {NOTE_NAMES[key]} Major
          </button>
          <button className="btn" onClick={() => playScale(tonic, 'minor')}>
            😢 {NOTE_NAMES[key]} Minor
          </button>
        </div>
        <Box kind="idea">
          Only <b>3 notes</b> are different between major and minor (the 3rd, 6th and 7th notes are lower in minor). That small
          change flips the whole mood. The 3rd note matters most.
        </Box>
        <Box kind="tip" title="The shortcut to sounding good: pentatonic">
          The <b>pentatonic</b> scales have only 5 notes and no "clashing" notes. Pick "Minor Pentatonic" above. Now press any
          glowing keys in any order. It always sounds good! Great for your first melodies.
        </Box>
      </Section>

      <Section title="Which scale for which game scene?">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Scale</th>
                <th>Feels</th>
                <th>Use it for</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {Object.values(SCALES).map((s) => (
                <tr key={s.id}>
                  <td>
                    <b>{s.name}</b>
                  </td>
                  <td>{s.mood}</td>
                  <td>{s.gameUse}</td>
                  <td>
                    <button className="btn small" onClick={() => playScale(tonic, s.id)}>
                      ▶
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Box kind="game">
          Many rhythm game songs use <b>minor</b> for a cool, intense feeling, and <b>major</b> for cute and happy songs. For an
          RPG, use major in towns, minor in battles, and harmonic minor for the final boss.
        </Box>
      </Section>

      <Quiz
        title="Ear quiz: happy (major) or sad (minor)?"
        makeRound={() => {
          const s: ScaleId = pick(['major', 'minor']);
          const t = tonicFor(Math.floor(Math.random() * 12));
          return {
            prompt: 'Listen to the scale. Does it sound happy or sad?',
            play: () => playScale(t, s, 0.2),
            options: ['😊 Happy (Major)', '😢 Sad (Minor)'],
            answer: s === 'major' ? '😊 Happy (Major)' : '😢 Sad (Minor)',
            explain: `It was ${noteName(t)} ${SCALES[s].name}.`,
          };
        }}
      />
    </>
  );
}
