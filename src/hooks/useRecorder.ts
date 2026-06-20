import { useRef, useState, useCallback, useEffect } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'error';

interface UseRecorderResult {
  status: RecordingStatus;
  elapsedMs: number;
  audioUrl: string | null;
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useRecorder(): UseRecorderResult {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setErrorMessage(null);
    // Revoke any previous recording's URL before starting a new one
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stopStream();
      };

      recorder.start();
      startTimeRef.current = performance.now();
      setElapsedMs(0);
      setStatus('recording');

      intervalRef.current = window.setInterval(() => {
        setElapsedMs(performance.now() - startTimeRef.current);
      }, 50);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? `Microphone access failed: ${err.message}`
          : 'Microphone access failed. Check browser permissions.'
      );
    }
  }, [audioUrl, stopStream]);

  const stop = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setStatus('stopped');
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    stopStream();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsedMs(0);
    setStatus('idle');
    setErrorMessage(null);
  }, [audioUrl, clearTimer, stopStream]);

  // Cleanup on unmount: stop any active stream/timer, revoke blob URL
  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, elapsedMs, audioUrl, errorMessage, start, stop, reset };
}
