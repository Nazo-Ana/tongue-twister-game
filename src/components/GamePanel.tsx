import { useEffect, useState } from 'react';
import type { Twister } from '../types/twister';
import { useRecorder } from '../hooks/useRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { saveAttempt, getRecord, formatMs } from '../services/recordsService';
import { computeScore, wordFeedback, scoreLabels, type Score } from '../utils/score';

interface GamePanelProps {
  twister: Twister;
  onAttemptSaved: () => void;
}

export function GamePanel({ twister, onAttemptSaved }: GamePanelProps) {
  const { status, elapsedMs, audioUrl, transcript, errorMessage, start, stop, reset } =
    useRecorder();
  const tts = useTextToSpeech();
  const [rating, setRating] = useState<Score | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    tts.stop();
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twister.id]);

  useEffect(() => {
    if (status === 'idle' || status === 'recording') setRating(null);
  }, [status]);

  const record = getRecord(twister.id);

  // Compute auto-score whenever a transcript arrives
  const autoScore: Score | null =
    status === 'stopped' && transcript !== null
      ? computeScore(transcript, twister.text)
      : null;

  const words =
    autoScore !== null && transcript !== null
      ? wordFeedback(transcript, twister.text)
      : null;

  const effectiveScore = autoScore ?? rating;
  const canSave = effectiveScore !== null;

  const handleStartRecording = async () => {
    tts.stop();
    await start();
  };

  const handleSaveResult = () => {
    const isNewBest = saveAttempt(twister.id, elapsedMs, effectiveScore ?? undefined);
    onAttemptSaved();
    return isNewBest;
  };

  const loopPressed: 'true' | 'false' = tts.status === 'looping' ? 'true' : 'false';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 space-y-5">
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'recording'
          ? 'Recording started'
          : status === 'stopped'
            ? `Recording stopped${autoScore ? `. Score: ${autoScore} out of 5` : ''}`
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

      {/* ── Reference audio ── */}
      <div className="rounded-lg border border-sky-900/60 bg-sky-950/30 p-4">
        <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide mb-3">
          Reference — teacher's pronunciation
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => tts.playOnce(twister.id)}
            disabled={tts.status === 'speaking'}
            aria-label={tts.status === 'speaking' ? 'Playing…' : 'Play reference once'}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {tts.status === 'speaking' ? 'Playing…' : 'Play Once'}
          </button>
          <button
            type="button"
            onClick={() => tts.toggleLoop(twister.id)}
            aria-pressed={loopPressed}
            aria-label={tts.status === 'looping' ? 'Stop looping' : 'Loop reference'}
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

        {/* Timer + best */}
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

        {errorMessage && (
          <div
            role="alert"
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-start gap-3">
          {(status === 'idle' || status === 'error') && (
            <button
              type="button"
              onClick={handleStartRecording}
              aria-label="Start recording"
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

              {/* Compare */}
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
                      aria-label={tts.status === 'speaking' ? 'Playing…' : 'Play reference for comparison'}
                      className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      {tts.status === 'speaking' ? 'Playing…' : '▶ Play'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-semibold text-emerald-400">Your attempt</span>
                    <audio src={audioUrl} controls aria-label="Your recorded pronunciation" className="h-9 max-w-full" />
                  </div>
                </div>
              </div>

              {/* ── Auto-score (Chrome/Edge) ── */}
              {autoScore !== null && words !== null ? (
                <div className={`border-t pt-4 ${autoScore === 5 ? 'border-emerald-500/40' : 'border-emerald-900/40'}`}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Your score
                  </p>

                  {/* Stars */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl tracking-tight" aria-label={`${autoScore} out of 5 stars`}>
                      {'★'.repeat(autoScore)}
                      <span className="text-slate-600">{'★'.repeat(5 - autoScore)}</span>
                    </span>
                    <span className={`text-sm font-semibold ${autoScore === 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {scoreLabels[autoScore]}
                    </span>
                  </div>

                  {/* Word-level feedback */}
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-1">What the app heard — word by word:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {words.map(({ word, heard }, i) => (
                        <span
                          key={i}
                          className={`text-sm px-2 py-0.5 rounded font-mono ${
                            heard
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {heard ? '✓' : '✗'} {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  {autoScore < 5 && (
                    <p className="text-xs text-slate-400 mt-3">
                      Keep trying — aim for all green before saving.
                    </p>
                  )}
                </div>
              ) : (
                /* ── Fallback: self-rating (Safari / Firefox) ── */
                <div className="border-t border-emerald-900/40 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    How did you do?
                  </p>
                  <div className="flex gap-1" role="group" aria-label="Rate your pronunciation 1 to 5 stars">
                    {([1, 2, 3, 4, 5] as const).map((star) => {
                      const filled = star <= (hoverRating ?? rating ?? 0);
                      const starPressed: 'true' | 'false' = rating === star ? 'true' : 'false';
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          aria-label={`${star} star${star > 1 ? 's' : ''}`}
                          aria-pressed={starPressed}
                          className={`text-3xl leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded ${
                            filled ? 'text-amber-400' : 'text-slate-600 hover:text-amber-300'
                          }`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  {rating && (
                    <p className="text-xs text-slate-400 mt-1">{scoreLabels[rating]}</p>
                  )}
                </div>
              )}

              {/* Save / Try again */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => { handleSaveResult(); reset(); }}
                  disabled={!canSave}
                  aria-label={canSave ? 'Save this attempt' : 'Complete scoring before saving'}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    autoScore === 5
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-900'
                      : 'bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900'
                  }`}
                >
                  {autoScore === 5 ? '🎉 Save Perfect Score' : canSave ? 'Save Result' : 'Pick a rating to save'}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Discard and try again"
                  className={`px-4 py-2.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                    autoScore !== null && autoScore < 5
                      ? 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10'
                      : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
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
