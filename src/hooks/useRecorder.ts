import { useRef, useState, useCallback, useEffect } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'error';

interface UseRecorderResult {
  status: RecordingStatus;
  elapsedMs: number;
  audioUrl: string | null;
  transcript: string | null; // null = not supported or not yet available
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

function getSpeechRecognitionClass(): (new () => AnyRecognition) | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useRecorder(): UseRecorderResult {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<AnyRecognition>(null);
  const liveTranscriptRef = useRef<string>('');

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

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setTranscript(null);
    liveTranscriptRef.current = '';
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopRecognition();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setTranscript(liveTranscriptRef.current.trim() || null);
        stopStream();
      };

      recorder.start();
      startTimeRef.current = performance.now();
      setElapsedMs(0);
      setStatus('recording');

      intervalRef.current = window.setInterval(() => {
        setElapsedMs(performance.now() - startTimeRef.current);
      }, 50);

      // Start speech recognition if available (Chrome / Edge)
      const SpeechRec = getSpeechRecognitionClass();
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: AnyRecognition) => {
          let full = '';
          for (let i = 0; i < event.results.length; i++) {
            full += event.results[i][0].transcript + ' ';
          }
          liveTranscriptRef.current = full.trim();
        };
        // Restart on unexpected end (silence timeout in some browsers)
        recognition.onend = () => {
          if (mediaRecorderRef.current?.state === 'recording') {
            try { recognition.start(); } catch { /* ignore */ }
          }
        };
        recognitionRef.current = recognition;
        try { recognition.start(); } catch { recognitionRef.current = null; }
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? `Microphone access failed: ${err.message}`
          : 'Microphone access failed. Check browser permissions.'
      );
    }
  }, [audioUrl, stopStream, stopRecognition]);

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
    stopRecognition();
    liveTranscriptRef.current = '';
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript(null);
    setElapsedMs(0);
    setStatus('idle');
    setErrorMessage(null);
  }, [audioUrl, clearTimer, stopStream, stopRecognition]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      stopRecognition();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, elapsedMs, audioUrl, transcript, errorMessage, start, stop, reset };
}
