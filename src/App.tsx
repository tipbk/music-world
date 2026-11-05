import { useEffect, useState } from 'react';
import { LESSONS } from './lessons';
import Glossary from './Glossary';

const DONE_KEY = 'music-world:done';

function useHashRoute() {
  const get = () => window.location.hash.replace(/^#\/?/, '');
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => {
      setRoute(get());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

function useDone() {
  const [done, setDone] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done]);
  return [done, setDone] as const;
}

function Home({ done }: { done: string[] }) {
  const units = [...new Set(LESSONS.map((l) => l.unit))];
  const next = LESSONS.find((l) => !done.includes(l.id)) ?? LESSONS[0];
  return (
    <div className="lesson home">
      <div className="hero">
        <h1>🎵 Music World</h1>
        <p className="lead">
          Learn music theory in <b>plain, simple words</b>, so you can make <b>rhythm game songs</b> and <b>game BGM</b>.
          Every lesson has sounds to play, things to click, and a small quiz.
        </p>
        <a className="btn btn-primary btn-big" href={`#/${next.id}`}>
          {done.length ? 'Continue' : 'Start'}: {next.emoji} {next.title} →
        </a>
        <p className="muted">
          🎧 Use headphones or speakers. Progress: {done.length} / {LESSONS.length} lessons done.
        </p>
      </div>
      {units.map((u) => (
        <div key={u}>
          <h2 className="unit-title">{u}</h2>
          <div className="lesson-cards">
            {LESSONS.filter((l) => l.unit === u).map((l) => {
              const n = LESSONS.indexOf(l) + 1;
              return (
                <a key={l.id} href={`#/${l.id}`} className={`lesson-card ${done.includes(l.id) ? 'done' : ''}`}>
                  <span className="emoji">{l.emoji}</span>
                  <span>
                    <small>Lesson {n}</small>
                    <b>{l.title}</b>
                    <span className="muted">{l.short}</span>
                  </span>
                  {done.includes(l.id) && <span className="tick">✓</span>}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const route = useHashRoute();
  const [done, setDone] = useDone();
  const [menu, setMenu] = useState(false);
  const idx = LESSONS.findIndex((l) => l.id === route);
  const lesson = idx >= 0 ? LESSONS[idx] : null;

  useEffect(() => {
    document.title = lesson ? `${lesson.title} · Music World` : 'Music World';
    setMenu(false);
  }, [lesson]);

  return (
    <div className="app">
      <header className="topbar">
        <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">
          ☰
        </button>
        <a href="#/" className="brand">
          🎵 Music World
        </a>
        <a href="#/words" className="top-link">
          📖 Words
        </a>
      </header>
      <div className="layout">
        <nav className={`sidebar ${menu ? 'open' : ''}`}>
          <a href="#/" className={route === '' ? 'active' : ''}>
            🏠 Home
          </a>
          {LESSONS.map((l, i) => (
            <a key={l.id} href={`#/${l.id}`} className={route === l.id ? 'active' : ''}>
              <span className="num">{done.includes(l.id) ? '✓' : i + 1}</span> {l.title}
            </a>
          ))}
          <a href="#/words" className={route === 'words' ? 'active' : ''}>
            📖 Word List
          </a>
        </nav>
        <main className="content">
          {route === 'words' ? (
            <Glossary />
          ) : lesson ? (
            <div className="lesson" key={lesson.id}>
              <div className="lesson-head">
                <small>
                  Lesson {idx + 1} of {LESSONS.length} · {lesson.unit}
                </small>
                <h1>
                  {lesson.emoji} {lesson.title}
                </h1>
              </div>
              <lesson.Component />
              <div className="lesson-foot">
                {idx > 0 ? (
                  <a className="btn" href={`#/${LESSONS[idx - 1].id}`}>
                    ← {LESSONS[idx - 1].title}
                  </a>
                ) : (
                  <span />
                )}
                <button
                  className={`btn ${done.includes(lesson.id) ? '' : 'btn-primary'}`}
                  onClick={() => setDone(done.includes(lesson.id) ? done.filter((d) => d !== lesson.id) : [...done, lesson.id])}
                >
                  {done.includes(lesson.id) ? '✓ Done (click to undo)' : 'Mark lesson as done'}
                </button>
                {idx < LESSONS.length - 1 ? (
                  <a
                    className="btn btn-primary"
                    href={`#/${LESSONS[idx + 1].id}`}
                    onClick={() => !done.includes(lesson.id) && setDone([...done, lesson.id])}
                  >
                    Next: {LESSONS[idx + 1].title} →
                  </a>
                ) : (
                  <a className="btn btn-primary" href="#/">
                    🏁 Back home
                  </a>
                )}
              </div>
            </div>
          ) : (
            <Home done={done} />
          )}
        </main>
      </div>
    </div>
  );
}
