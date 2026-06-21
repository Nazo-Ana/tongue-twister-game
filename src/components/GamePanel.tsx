import { useEffect } from 'react';
import type { Twister } from '../types/twister';
import { useRecorder } from '../hooks/useRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { saveAttempt, getRecord, formatMs } from '../services/recordsService';

interface GamePanelProps {
  twister: Twister;
  onAttemptSaved: () => void;
}

export function GamePanel({ twister, onAttemptSaved }: GamePanelProps) {
  const { status, elapsedMs, audioUrl, errorMessage, start, stop, reset } = useRecorder();
  const tts = useTextToSpeech();

  // When the selected twister changes: stop TTS and reset recorder
  useEffect(() => {
    tts.stop();
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twister.id]);

  const record = getRecord(twister.id);

  const handleStartRecording = async () => {
    // Stop any TTS before the mic opens so they never play at the same time
    tts.stop();
    await start();
  };

  const handleSaveResult = () => {
    const isNewBest = saveAttempt(twister.id, elapsedMs);
    onAttemptSaved();
    return isNewBest;
  };

  const loopPressed: 'true' | 'false' = tts.status === 'looping' ? 'true' : 'false';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-5">
      {/* Visually-hidden live region announces status changes to screen readers */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'recording'
          ? 'Recording started'
          : status === 'stopped'
            ? 'Recording stopped'
            : status === 'error'
              ? (errorMessage ?? 'Recording error')
              : ''}
      </span>

      {/* Twister text */}
      <div>
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
          {twister.sound}
        </span>
        <p className="text-xl sm:text-2xl font-medium text-slate-100 mt-2 leading-snug">
          "{twister.text}"
        </p>
      </div>

      {/* ── Reference audio (teacher's pronunciation) ── */}
      <div className="rounded-lg border border-sky-900/60 bg-sky-950/30 p-4">
        <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide mb-3">
          Reference — teacher's pronunciation
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => tts.playOnce(twister.id)}
            disabled={tts.status === 'speaking'}
            aria-label={
              tts.status === 'speaking'
                ? 'Playing reference pronunciation…'
                : 'Play reference pronunciation once'
            }
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {tts.status === 'speaking' ? 'Playing…' : 'Play Once'}
          </button>
          <button
            type="button"
            onClick={() => tts.toggleLoop(twister.id)}
            aria-pressed={loopPressed}
            aria-label={
              tts.status === 'looping'
                ? 'Stop looping reference audio'
                : 'Loop reference audio repeatedly'
            }
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              tts.status === 'looping'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {tts.status === 'looping' ? 'Stop Loop' : 'Loop'}
          </button>
        </div>
      </div>

      {/* ── Your recording ── */}
      <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-4">
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-3">
          Your recording
        </p>

        {/* Timer + best time */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div
            className="font-mono text-3xl text-slate-200 tabular-nums"
            aria-label={`Elapsed time: ${(elapsedMs / 1000).toFixed(2)} seconds`}
          >
            {(elapsedMs / 1000).toFixed(2)}s
          </div>
          {record && (
            <div className="text-sm text-slate-400">
              Best:{' '}
              <span className="font-mono text-emerald-400">{formatMs(record.bestTimeMs)}</span>
              <span className="ml-2 text-slate-500">({record.attemptCount} attempts)</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4"
          >
            {errorMessage}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-start gap-3">
          {(status === 'idle' || status === 'error') && (
            <button
              type="button"
              onClick={handleStartRecording}
              aria-label="Start recording your pronunciation"
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Start Recording
            </button>
          )}

          {status === 'recording' && (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop recording"
              className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors animate-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              ⏺ Stop
            </button>
          )}

          {status === 'stopped' && audioUrl && (
            <div className="w-full space-y-4">
              {/* Side-by-side compare section */}
              <div className="border-t border-emerald-900/40 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Compare
                </p>
                <div className="flex flex-wrap gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-sky-400">Reference</span>
                    <button
                      type="button"
                      onClick={() => tts.playOnce(twister.id)}
                      disabled={tts.status === 'speaking'}
                      aria-label={
                        tts.status === 'speaking'
                          ? 'Playing reference…'
                          : 'Play reference pronunciation for comparison'
                      }
                      className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      {tts.status === 'speaking' ? 'Playing…' : '▶ Play'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-semibold text-emerald-400">Your attempt</span>
                    <audio
                      src={audioUrl}
                      controls
                      aria-label="Your recorded pronunciation"
                      className="h-9 max-w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Save / Try again */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const beat = handleSaveResult();
                    if (beat) reset();
                  }}
                  aria-label="Save this attempt as your result"
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Save Result
                </button>
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Discard this recording and try again"
                  className="px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
