import { useEffect, useRef, useState } from 'react';
import { StepClock } from '../audio/engine';

// Only one loop plays at a time across the whole site.
let stopActive: (() => void) | null = null;

/** Run a looping step clock. onStep is always the latest version, so patterns can change while playing. */
export function useClock(opts: {
  bpm: number;
  totalSteps: number;
  stepsPerBeat?: number;
  onStep: (step: number, time: number, stepDur: number) => void;
}) {
  const onStepRef = useRef(opts.onStep);
  onStepRef.current = opts.onStep;
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const ctl = useRef<{ clock: StepClock; start: () => void; stop: () => void } | null>(null);
  if (!ctl.current) {
    const clock = new StepClock();
    const stop = () => {
      if (stopActive === stop) stopActive = null;
      clock.stop();
      setPlaying(false);
    };
    const start = () => {
      if (stopActive && stopActive !== stop) stopActive();
      stopActive = stop;
      clock.start();
      setPlaying(true);
    };
    ctl.current = { clock, start, stop };
  }
  const { clock, start, stop } = ctl.current;
  clock.bpm = opts.bpm;
  clock.totalSteps = opts.totalSteps;
  clock.stepsPerBeat = opts.stepsPerBeat ?? 4;
  clock.onStep = (s, t) => onStepRef.current(s, t, clock.stepDur);
  clock.onVisual = setStep;

  useEffect(() => () => stop(), [stop]);

  return { step, playing, start, stop, toggle: () => (clock.running ? stop() : start()), clock };
}
