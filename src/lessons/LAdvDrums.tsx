import { useState } from 'react';
import { KitSound } from '../audio/engine';
import { bassFollowKick, findFill, findGroove, FILLS, Groove, GROOVES, Jam, playJamOnce } from '../music/advanced';
import { findProgression } from '../music/theory';
import { ABSwitch, GrooveGrid, HitLegend, JamChords, useJam } from '../components/JamPlayer';
import { Box, pick, PlayButton, Quiz, Section, shuffle, Slider } from '../components/ui';

const pop = findProgression('pop');
const base = (g: Groove, bpm: number): Jam => ({
  bpm,
  key: 0,
  scale: pop.scale,
  progression: pop.degrees,
  groove: g,
  chordStyle: 'none',
  chordInstrument: 'pad',
});

const LANES_ALL: KitSound[] = ['kick', 'snare', 'clap', 'rim', 'hat', 'openhat', 'tomHi', 'tomLo', 'crash'];
const lanesOf = (...gs: (Groove | null | undefined)[]) => LANES_ALL.filter((d) => gs.some((g) => g && g[d]));

// --- Build-up and drop: 8 bars ---
const rep = (s: string, n: number) => s.repeat(n);
const BUILD: Groove = {
  kick: rep('X...X...X...X...', 3) + 'X...X...X.......' + rep('X...X...X...X...', 4),
  snare: 'x...x...x...x...' + 'x.x.x.x.x.x.x.x.' + 'xxxxxxxxxxxxxxxx' + 'XXXXXXXXXXXX....' + rep('....X.......X.x.', 4),
  hat: rep('................', 4) + rep('XgxgXgxgXgxgXgxg', 4),
  openhat: rep('................', 4) + rep('..x...x...x...x.', 4),
  crash: rep('................', 4) + 'x' + '.'.repeat(63),
};
const BUILD_BASS = rep('R---------------', 3) + 'R-------........' + rep('..R-..R-..R-..R-', 4);
const BUILD_LABELS = ['Build: 1 snare per beat', 'Build: 2 per beat', 'Build: 4 per beat', 'Build: LOUD, then silence!', 'DROP', 'DROP', 'DROP', 'DROP'];

export default function LAdvDrums() {
  // Loud and soft
  const [ghost, setGhost] = useState(false);
  const accentJam = base(findGroove(ghost ? 'rockGhost' : 'rock').g, 100);
  const accent = useJam(accentJam);

  // Syncopation
  const [sync, setSync] = useState(false);
  const syncKick = sync ? 'X..x..x...x.....' : 'X...x...X...x...';
  const syncJam: Jam = {
    ...base({ kick: syncKick, snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' }, 105),
    bass: bassFollowKick(syncKick),
    chordStyle: 'block',
  };
  const syncP = useJam(syncJam);

  // Swing
  const [swing, setSwing] = useState(0);
  const swingJam: Jam = { ...base(findGroove('shuffle').g, 85), swing: swing / 100, chordStyle: 'arp', chordInstrument: 'piano', bass: 'R-------..R-..5.' };
  const swingP = useJam(swingJam);

  // Genre gallery
  const [gid, setGid] = useState('house');
  const [groove, setGroove] = useState<Groove>(findGroove('house').g);
  const [gbpm, setGbpm] = useState(findGroove('house').bpm);
  const [band, setBand] = useState(false);
  const gp = findGroove(gid);
  const galleryJam: Jam = {
    ...base(groove, gbpm),
    swing: gp.swing,
    bass: band ? bassFollowKick(groove.kick ?? 'x') : null,
    chordStyle: band ? 'pulse' : 'none',
    chordInstrument: 'pluck',
  };
  const galleryP = useJam(galleryJam);

  // Fills
  const [fillId, setFillId] = useState('snareRoll');
  const [crash, setCrash] = useState(true);
  const fill = findFill(fillId);
  const fillGroove = findGroove('rockGhost').g;
  const fillJam: Jam = { ...base(fillGroove, 115), fill: fill.g, crash: crash, bass: 'R-----..R-----R-', chordStyle: 'block', chordInstrument: 'pad' };
  const fillP = useJam(fillJam);
  const fillBar = fillP.step >= 0 ? Math.floor(fillP.step / 16) : -1;

  // Build-up and drop
  const royal = findProgression('royal');
  const buildJam: Jam = {
    bpm: 160,
    key: 0,
    scale: royal.scale,
    progression: [...royal.degrees, ...royal.degrees],
    groove: BUILD,
    bass: BUILD_BASS,
    chordStyle: 'pulse',
    chordInstrument: 'lead',
  };
  const buildP = useJam(buildJam);
  const buildBar = buildP.step >= 0 ? Math.floor(buildP.step / 16) : -1;

  return (
    <>
      <Box kind="idea" title="Where we are">
        You already know where to put kick, snare and hi-hat. Now we make drums sound <b>alive</b>: some hits loud, some soft,
        some between the beats, and little "fills" that tell the player a new part is coming.
      </Box>

      <Section title="1. Loud and soft hits (accents and ghost notes)">
        <p>
          A real drummer never hits everything the same. Some hits are <b>LOUD</b> (we call them <b>accents</b>) and some are
          so soft you almost don't hear them (we call them <b>ghost notes</b>). This tiny change makes a beat sound human.
        </p>
        <div className="row wrap">
          <PlayButton playing={accent.playing} onClick={accent.toggle} label="Play" />
          <ABSwitch value={ghost} onChange={setGhost} a="Robot (all the same)" b="Human (loud + soft)" />
        </div>
        <GrooveGrid groove={accentJam.groove} step={accent.step} lanes={['kick', 'snare', 'hat']} />
        <HitLegend />
        <Box kind="tip">
          Easy rule: hi-hat <b>loud on the beat</b>, <b>soft between</b>. Then add 1 or 2 soft snares right before or after the
          big snare.
        </Box>
      </Section>

      <Section title="2. Hits between the beats (syncopation)">
        <p>
          Your ear expects hits on 1, 2, 3, 4. When a hit lands <b>between</b> the beats, it is a small surprise, and surprises
          feel cool. This is called <b>syncopation</b>. Here the bass copies the kick, so you hear it clearly.
        </p>
        <div className="row wrap">
          <PlayButton playing={syncP.playing} onClick={syncP.toggle} label="Play" />
          <ABSwitch value={sync} onChange={setSync} a="On the beat" b="Between the beats" />
        </div>
        <GrooveGrid groove={syncJam.groove} step={syncP.step} lanes={['kick', 'snare', 'hat']} />
        <Box kind="game">
          In a rhythm game, syncopated hits make <b>harder, more fun notes</b> to tap. Keep easy charts on the beat, and save the
          between-the-beat hits for hard mode or the chorus.
        </Box>
      </Section>

      <Section title="3. Swing: make it lazy and groovy">
        <p>
          <b>Swing</b> means every second little box comes a bit <b>late</b>. Instead of "ti-ti-ti-ti" it becomes "ta-da ta-da".
          Move the slider while the music plays.
        </p>
        <div className="row wrap">
          <PlayButton playing={swingP.playing} onClick={swingP.toggle} label="Play" />
          <Slider label="Swing" value={swing} min={0} max={50} step={5} unit="%" onChange={setSwing} />
        </div>
        <GrooveGrid groove={swingJam.groove} step={swingP.step} />
        <Box kind="tip">
          0% = straight and robotic (EDM, rock). 20 to 35% = lo-fi, hip-hop, cozy. 50% = very bouncy, like jazz or old game
          shop music. In music apps this is the <b>swing</b> or <b>shuffle</b> knob.
        </Box>
      </Section>

      <Section title="4. Grooves from different styles">
        <p>Each music style has its own drum "fingerprint". Pick one, listen, then click boxes to change it.</p>
        <div className="row wrap">
          {GROOVES.map((g) => (
            <button
              key={g.id}
              className={`btn small ${g.id === gid ? 'btn-primary' : ''}`}
              onClick={() => {
                setGid(g.id);
                setGroove(g.g);
                setGbpm(g.bpm);
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
        <p>
          {gp.plain} <span className="muted">🎮 {gp.game}</span>
        </p>
        <div className="row wrap">
          <PlayButton playing={galleryP.playing} onClick={galleryP.toggle} label="Play groove" />
          <Slider label="Speed" value={gbpm} min={60} max={200} unit="BPM" onChange={setGbpm} />
          <label className="check">
            <input type="checkbox" checked={band} onChange={(e) => setBand(e.target.checked)} /> Add chords and bass
          </label>
          <button className="btn small" onClick={() => setGroove(gp.g)}>
            Reset
          </button>
        </div>
        <GrooveGrid groove={groove} onChange={setGroove} step={galleryP.step} lanes={lanesOf(groove, gp.g)} />
        <HitLegend />
      </Section>

      <Section title="5. Fills: tell the player a new part is coming">
        <p>
          Music is built in groups of <b>4 bars</b>. In bar 4, drummers often change the beat for a moment. This is a{' '}
          <b>fill</b>. Then a big <b>crash</b> cymbal on the next beat 1 says "new part starts now!"
        </p>
        <div className="row wrap">
          {FILLS.map((f) => (
            <button key={f.id} className={`btn small ${f.id === fillId ? 'btn-primary' : ''}`} onClick={() => setFillId(f.id)}>
              {f.name}
            </button>
          ))}
        </div>
        <p className="muted">{fill.plain}</p>
        <div className="row wrap">
          <PlayButton playing={fillP.playing} onClick={fillP.toggle} label="Play 4 bars" />
          <label className="check">
            <input type="checkbox" checked={crash} onChange={(e) => setCrash(e.target.checked)} /> Crash on bar 1
          </label>
        </div>
        <JamChords jam={fillJam} step={fillP.step} />
        <div>
          <div>
            <h3>Bars 1, 2, 3</h3>
            <GrooveGrid groove={fillGroove} step={fillP.step} nowBar={fillBar >= 0 && fillBar < 3} lanes={['kick', 'snare', 'hat']} />
          </div>
          <div>
            <h3>Bar 4 (the fill)</h3>
            {fill.g ? (
              <GrooveGrid groove={fill.g} step={fillP.step} nowBar={fillBar === 3} lanes={lanesOf(fill.g)} />
            ) : (
              <p className="muted">Same beat as bars 1 to 3.</p>
            )}
          </div>
        </div>
        <Box kind="game">
          A fill at the end of a section is a <b>warning</b> for the player: "get ready, the chart is about to change". Good
          rhythm game songs put a fill before every chorus.
        </Box>
      </Section>

      <Section title="6. The build-up and the drop">
        <p>
          The most exciting moment in a rhythm game song. The snare plays <b>faster and faster</b> (1, then 2, then 4 hits per
          beat), then a tiny <b>silence</b>, then everything comes in at once: the <b>drop</b>.
        </p>
        <PlayButton playing={buildP.playing} onClick={buildP.toggle} label="Play build-up → drop" />
        <div className="build-meter">
          {BUILD_LABELS.map((l, i) => (
            <span
              key={i}
              className={`${i >= 4 ? 'drop' : ''} ${buildBar === i ? 'now' : ''}`}
              style={i < 4 ? { background: `rgba(124, 92, 255, ${0.2 + i * 0.2})` } : undefined}
            >
              {l}
            </span>
          ))}
        </div>
        <Box kind="try">
          Listen for 3 tricks: the snare gets <b>faster</b>, the hits get <b>louder</b>, and the last beat before the drop is{' '}
          <b>empty</b>. Silence right before a big hit makes the hit feel twice as big.
        </Box>
      </Section>

      <Quiz
        title="Ear quiz: which groove is it?"
        makeRound={() => {
          const ids = ['house', 'dnb', 'halftime', 'dembow', 'shuffle'];
          const opts = shuffle(GROOVES.filter((g) => ids.includes(g.id))).slice(0, 3);
          const ans = pick(opts);
          return {
            prompt: 'Listen to the drums. Which style is it?',
            play: () => playJamOnce({ ...base(ans.g, ans.bpm), swing: ans.swing }, 2),
            options: opts.map((o) => o.name),
            answer: ans.name,
            explain: ans.plain,
          };
        }}
      />
    </>
  );
}
