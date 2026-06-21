import { useRef, useState, useCallback, useEffect } from 'react';

export type TtsStatus = 'idle' | 'speaking' | 'looping';

interface UseTextToSpeechResult {
  status: TtsStatus;
  playOnce: (id: string) => void;
  toggleLoop: (id: string) => void;
  stop: () => void;
}

const LOOP_PAUSE_MS = 1200;

function audioUrl(id: string): string {
  return `${import.meta.env.BASE_URL}audio/${id}.mp3`;
}

export function useTextToSpeech(): UseTextToSpeechResult {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopingRef = useRef(false);
  const loopIdRef = useRef('');
  const timeoutRef = useRef<number | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    loopingRef.current = false;
    clearPending();
    stopAudio();
    setStatus('idle');
  }, [clearPending, stopAudio]);

  const playOnce = useCallback(
    (id: string) => {
      loopingRef.current = false;
      clearPending();
      stopAudio();
      setStatus('speaking');
      const audio = new Audio(audioUrl(id));
      audioRef.current = audio;
      audio.onended = () => setStatus('idle');
      audio.onerror = () => setStatus('idle');
      audio.play().catch(() => setStatus('idle'));
    },
    [clearPending, stopAudio],
  );

  const scheduleNextLoop = useCallback(
    (id: string) => {
      timeoutRef.current = window.setTimeout(() => {
        if (!loopingRef.current) return;
        const audio = new Audio(audioUrl(id));
        audioRef.current = audio;
        audio.onended = () => {
          if (!loopingRef.current) return;
          scheduleNextLoop(id);
        };
        audio.onerror = () => {
          loopingRef.current = false;
          setStatus('idle');
        };
        audio.play().catch(() => {
          loopingRef.current = false;
          setStatus('idle');
        });
      }, LOOP_PAUSE_MS);
    },
    [],
  );

  const toggleLoop = useCallback(
    (id: string) => {
      if (loopingRef.current) {
        stop();
        return;
      }
      clearPending();
      stopAudio();
      loopingRef.current = true;
      loopIdRef.current = id;
      setStatus('looping');
      const audio = new Audio(audioUrl(id));
      audioRef.current = audio;
      audio.onended = () => {
        if (!loopingRef.current) return;
        scheduleNextLoop(id);
      };
      audio.onerror = () => {
        loopingRef.current = false;
        setStatus('idle');
      };
      audio.play().catch(() => {
        loopingRef.current = false;
        setStatus('idle');
      });
    },
    [stop, clearPending, stopAudio, scheduleNextLoop],
  );

  useEffect(() => {
    return () => {
      loopingRef.current = false;
      clearPending();
      stopAudio();
    };
  }, [clearPending, stopAudio]);

  return { status, playOnce, toggleLoop, stop };
}
