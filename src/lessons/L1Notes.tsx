import { useState } from 'react';
import { now, playNote } from '../audio/engine';
import { NOTE_NAMES, noteName } from '../music/theory';
import { Box, pick, Piano, Quiz, Section } from '../components/ui';

export default function L1Notes() {
  const [last, setLast] = useState<number | null>(null);
  const [target, setTarget] = useState(() => pick([0, 2, 4, 5, 7, 9, 11]));
  const [found, setFound] = useState<string | null>(null);

  return (
    <>
      <Section title="A note is just one sound">
        <p>
          Music is made of <b>notes</b>. A note is one sound with a <b>pitch</b>. Pitch means how <b>high</b> or <b>low</b> it
          sounds. A bird is high. A big drum is low.
        </p>
        <p>The piano is the easiest way to see notes. Keys on the left are low. Keys on the right are high. Click some keys.</p>
        <Piano from={48} to={83} labels="white" onPress={setLast} />
        <p className="readout">{last !== null ? `You played: ${noteName(last, true)}` : 'Click a key to hear it.'}</p>
        <Box kind="idea">
          There are only <b>12 different notes</b>. After 12 they repeat, just higher. Their names are:{' '}
          <b>{NOTE_NAMES.join(' · ')}</b>
        </Box>
      </Section>

      <Section title="White keys and black keys">
        <p>
          White keys have letter names: <b>C D E F G A B</b>. Then it starts again at C.
        </p>
        <p>
          Black keys sit between white keys. Their names use <b>#</b> (say "sharp"), which means "a little higher". So C# is the
          black key just above C.
        </p>
        <Piano from={60} to={71} labels="all" />
        <Box kind="tip">
          The easiest way to find <b>C</b>: it is the white key just to the <b>left of the two black keys</b>.
        </Box>
      </Section>

      <Section title="Octave: same note, higher">
        <p>
          Play a C, then the next C to the right. They sound like the "same" note, but higher. That distance is called an{' '}
          <b>octave</b>. The number after a note name tells you which octave: C4 is "middle C", C5 is one octave higher.
        </p>
        <div className="row">
          {[36, 48, 60, 72, 84].map((m) => (
            <button key={m} className="btn" onClick={() => playNote(m, { duration: 0.8 })}>
              {noteName(m, true)}
            </button>
          ))}
          <button
            className="btn btn-primary"
            onClick={() => [48, 60, 72].forEach((m) => playNote(m, { duration: 0.8 }))}
          >
            All Cs together
          </button>
        </div>
        <Box kind="game">
          In game music, <b>low notes</b> (bass) give power and weight. <b>High notes</b> (melody) are what players remember and
          hum. Most tracks have something low and something high at the same time.
        </Box>
      </Section>

      <Section title="Mini game: find the key">
        <p>
          Find <b className="big">{NOTE_NAMES[target]}</b> on the piano. Labels are hidden. Use the black keys as your map.
        </p>
        <Piano
          from={60}
          to={71}
          labels="none"
          onPress={(m) => {
            if (m % 12 === target) {
              setFound(`✅ Yes! That is ${NOTE_NAMES[target]}.`);
              window.setTimeout(() => {
                setTarget(pick([0, 2, 4, 5, 7, 9, 11].filter((x) => x !== target)));
                setFound(null);
              }, 1000);
            } else setFound(`That was ${noteName(m)}. Try again!`);
          }}
        />
        <p className="readout">{found ?? ' '}</p>
      </Section>

      <Quiz
        title="Ear quiz: which note is higher?"
        makeRound={() => {
          const a = 55 + Math.floor(Math.random() * 18);
          let b = a;
          while (b === a) b = 55 + Math.floor(Math.random() * 18);
          return {
            prompt: 'You will hear two notes. Was the SECOND note higher or lower than the first?',
            play: () => {
              playNote(a, { duration: 0.5 });
              playNote(b, { duration: 0.5, time: now() + 0.6 });
            },
            options: ['Higher', 'Lower'],
            answer: b > a ? 'Higher' : 'Lower',
            explain: `First was ${noteName(a, true)}, second was ${noteName(b, true)}.`,
          };
        }}
      />
    </>
  );
}
