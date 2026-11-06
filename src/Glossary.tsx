import { useState } from 'react';

const WORDS: [string, string][] = [
  ['Accent', 'A hit or note played louder than the others. Makes a beat sound human.'],
  ['Anticipation (push)', 'Playing a note a little before the beat or chord change, so the music leans forward.'],
  ['Arpeggio', 'Playing the notes of a chord one at a time instead of together. Very common in game music.'],
  ['Bar (Measure)', 'A group of beats, usually 4. Music is counted "1 2 3 4, 1 2 3 4".'],
  ['Bass', 'The lowest part of the music. Gives power and weight. Usually plays the root of each chord. See the Bass Lines lesson.'],
  ['Bass line', 'The notes and rhythm the bass plays. Often just the root of each chord with a groovy rhythm.'],
  ['Beat', 'The steady pulse you tap your foot to.'],
  ['BGM', 'Background music. Music that plays behind the gameplay, often looping.'],
  ['BPM', 'Beats Per Minute. How fast the music is. 120 BPM = 2 beats per second.'],
  ['Build-up', 'A part where energy keeps rising, right before the chorus or drop.'],
  ['Call and response', 'A melody that "asks" (stops away from home) and then "answers" (lands at home). Also called question and answer.'],
  ['Chart', 'In rhythm games: the notes the player must hit, placed on the music.'],
  ['Chord', '3 or more notes played together.'],
  ['Chord progression', 'A list of chords played one after another, usually looping.'],
  ['Chorus / Drop', 'The biggest, catchiest, loudest part of a song.'],
  ['Crash', 'A big cymbal "KSHHH" that marks the start of a new part.'],
  ['DAW', 'Digital Audio Workstation. A music-making app like FL Studio, LMMS, GarageBand, Reaper.'],
  ['Diminished chord', 'A tense, unstable chord. Shown with ° like vii°.'],
  ['Drop', 'In EDM and rhythm games: the moment after a build-up where everything comes in at full power.'],
  ['Fill', 'A short change in the drums at the end of a section (often bar 4) that says "a new part is coming".'],
  ['Ghost note', 'A very soft hit, mostly felt, not heard. Adds groove between the main hits.'],
  ['Groove', 'The feel of a rhythm: which drums hit where, and how loud. Each music style has its own groove.'],
  ['Half-time', 'A groove where the snare comes only once per bar (beat 3), so the music feels half as fast and heavy.'],
  ['Harmony', 'Notes that sound together, like chords.'],
  ['Hook', 'The short, catchy bit of melody that gets stuck in your head.'],
  ['Key', 'The home note and scale of a song, like "C major" or "A minor".'],
  ['Lead-in (approach note)', "A bass or melody note one step away from the next chord's root, played just before the chord changes."],
  ['Leitmotif', 'A melody tied to a character or place, reused in different moods.'],
  ['Loop', 'Music that repeats. Game BGM loops so it can play forever.'],
  ['Major', 'A scale or chord that sounds happy and bright.'],
  ['Melody', 'The main tune. One note at a time, the part you can sing.'],
  ['MIDI', 'A file of notes (not sound). Open it in any music app and choose your own instruments.'],
  ['Minor', 'A scale or chord that sounds sad or serious.'],
  ['Motif', 'A tiny musical idea (a few notes) that gets repeated and changed to build a whole melody.'],
  ['Note', 'One single sound with a pitch.'],
  ['Octave', 'The distance from one note to the next note with the same name. Sounds "the same, but higher".'],
  ['Passing note', 'A note between two chord notes. Sounds smooth between the beats, strange when it sits on the beat.'],
  ['Pentatonic', 'A 5-note scale with no clashing notes. Easy to make melodies that sound good.'],
  ['Pickup', 'A short note played just before a beat, leading into it. Makes bass lines and melodies groove.'],
  ['Pitch', 'How high or low a note is.'],
  ['Roman numerals', 'Names for chords by their position in the key: I, ii, iii, IV, V, vi, vii°. Big = major, small = minor.'],
  ['Root', 'The note a chord is built on and named after. The root of C major is C.'],
  ['Scale', 'The group of notes (usually 7) a song uses.'],
  ['Section', 'A part of a song: intro, verse, chorus, bridge, outro...'],
  ['Semitone', 'The smallest step: from one piano key to the very next key (white or black).'],
  ['Sharp (#)', 'A little higher. C# is the key just above C.'],
  ['Step sequencer', 'A grid of boxes: turn boxes on to place sounds in time.'],
  ['Swing', 'Every second short note comes a bit late, so "ti-ti-ti-ti" becomes "ta-da ta-da". Lazy and groovy.'],
  ['Syncopation', 'Putting hits or notes between the beats instead of on them. A small surprise that feels cool.'],
  ['Tempo', 'The speed of the music. Measured in BPM.'],
  ['Verse', 'The calmer part of a song, between choruses.'],
  ['Walking bass', 'A bass that plays one note every beat and keeps moving, stepping into each new chord.'],
];

export default function Glossary() {
  const [q, setQ] = useState('');
  const list = WORDS.filter(([w, d]) => (w + d).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="lesson">
      <h1>📖 Word List</h1>
      <p>All the music words on this site, explained simply.</p>
      <input className="search" placeholder="Search a word..." value={q} onChange={(e) => setQ(e.target.value)} />
      <dl className="glossary">
        {list.map(([w, d]) => (
          <div key={w}>
            <dt>{w}</dt>
            <dd>{d}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
