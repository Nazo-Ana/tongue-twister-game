import { twisters, bookLabels } from '../data/twisters';
import type { AttemptRecord } from '../types/twister';
import { formatMs } from '../services/recordsService';

interface StatsPanelProps {
  records: Record<string, AttemptRecord>;
}

export function StatsPanel({ records }: StatsPanelProps) {
  const books = [1, 2, 3] as const;
  const totalTwisters = twisters.length;
  const totalAttempted = Object.keys(records).length;
  const totalAttempts = Object.values(records).reduce((sum, r) => sum + r.attemptCount, 0);

  const allRecords = Object.values(records);
  const fastestRecord =
    allRecords.length > 0
      ? allRecords.reduce((min, r) => (r.bestTimeMs < min.bestTimeMs ? r : min))
      : null;
  const fastestTwister = fastestRecord
    ? twisters.find((t) => t.id === fastestRecord.twisterId)
    : null;

  return (
    <div className="border-b border-slate-800 bg-slate-900/60 px-4 sm:px-6 py-5">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Progress bars — overall + per book */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Overall progress
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {totalAttempted}/{totalTwisters}
            </span>
          </div>
          <div
            className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4"
            role="progressbar"
            aria-valuenow={totalAttempted}
            aria-valuemin={0}
            aria-valuemax={totalTwisters}
            aria-label={`${totalAttempted} of ${totalTwisters} twisters attempted`}
          >
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${(totalAttempted / totalTwisters) * 100}%` }}
            />
          </div>
          <div className="space-y-2">
            {books.map((bookNum) => {
              const bookTwisters = twisters.filter((t) => t.book === bookNum);
              const bookAttempted = bookTwisters.filter((t) => records[t.id]).length;
              return (
                <div key={bookNum}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-500">{bookLabels[bookNum]}</span>
                    <span className="text-xs font-mono text-slate-500">
                      {bookAttempted}/{bookTwisters.length}
                    </span>
                  </div>
                  <div
                    className="h-1.5 bg-slate-700 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={bookAttempted}
                    aria-valuemin={0}
                    aria-valuemax={bookTwisters.length}
                    aria-label={`${bookLabels[bookNum]}: ${bookAttempted} of ${bookTwisters.length}`}
                  >
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{ width: `${(bookAttempted / bookTwisters.length) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Total attempts</p>
            <p className="text-2xl font-mono font-semibold text-slate-200">{totalAttempts}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Remaining</p>
            <p className="text-2xl font-mono font-semibold text-slate-200">
              {totalTwisters - totalAttempted}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 col-span-2">
            <p className="text-xs text-slate-500 mb-1">Completion</p>
            <p className="text-2xl font-mono font-semibold text-slate-200">
              {Math.round((totalAttempted / totalTwisters) * 100)}%
            </p>
          </div>
        </div>

        {/* Personal best */}
        {fastestRecord && fastestTwister ? (
          <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-lg p-4">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
              Personal best
            </p>
            <p className="text-3xl font-mono font-bold text-emerald-400">
              {formatMs(fastestRecord.bestTimeMs)}
            </p>
            <p className="text-xs text-slate-400 mt-2">{fastestTwister.sound}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">"{fastestTwister.text}"</p>
          </div>
        ) : (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 flex items-center justify-center">
            <p className="text-sm text-slate-500 text-center">
              No recordings yet — start practicing to see your stats!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
