import { useRef, useState, useCallback, useEffect } from 'react';

export type TtsStatus = 'idle' | 'speaking' | 'looping';

interface UseTextToSpeechResult {
  status: TtsStatus;
  playOnce: (text: string) => void;
  toggleLoop: (text: string) => void;
  stop: () => void;
}

const LOOP_PAUSE_MS = 1500;

export function useTextToSpeech(): UseTextToSpeechResult {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const loopingRef = useRef(false);
  const loopTextRef = useRef('');
  const timeoutRef = useRef<number | null>(null);
  // Indirection ref breaks the self-reference that react-hooks/immutability forbids
  const doLoopStepRef = useRef<() => void>(() => {});

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    loopingRef.current = false;
    clearPending();
    window.speechSynthesis.cancel();
    setStatus('idle');
  }, [clearPending]);

  const doLoopStep = useCallback(() => {
    if (!loopingRef.current) return;
    const utterance = new SpeechSynthesisUtterance(loopTextRef.current);
    utterance.onend = () => {
      if (!loopingRef.current) return;
      timeoutRef.current = window.setTimeout(() => doLoopStepRef.current(), LOOP_PAUSE_MS);
    };
    utterance.onerror = () => {
      loopingRef.current = false;
      setStatus('idle');
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // Keep the ref in sync (doLoopStep is stable, so this runs once after mount)
  useEffect(() => {
    doLoopStepRef.current = doLoopStep;
  }, [doLoopStep]);

  const playOnce = useCallback(
    (text: string) => {
      loopingRef.current = false;
      clearPending();
      window.speechSynthesis.cancel();
      setStatus('speaking');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setStatus('idle');
      utterance.onerror = () => setStatus('idle');
      window.speechSynthesis.speak(utterance);
    },
    [clearPending],
  );

  const toggleLoop = useCallback(
    (text: string) => {
      if (loopingRef.current) {
        stop();
        return;
      }
      clearPending();
      window.speechSynthesis.cancel();
      loopingRef.current = true;
      loopTextRef.current = text;
      setStatus('looping');
      doLoopStep();
    },
    [stop, clearPending, doLoopStep],
  );

  useEffect(() => {
    return () => {
      loopingRef.current = false;
      clearPending();
      window.speechSynthesis.cancel();
    };
  }, [clearPending]);

  return { status, playOnce, toggleLoop, stop };
}
