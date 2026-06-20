import { twisters, bookLabels } from '../data/twisters';
import type { Twister, AttemptRecord } from '../types/twister';
import { formatMs } from '../services/recordsService';

interface TwisterListProps {
  selectedId: string | null;
  records: Record<string, AttemptRecord>;
  onSelect: (twister: Twister) => void;
}

export function TwisterList({ selectedId, records, onSelect }: TwisterListProps) {
  const books = [1, 2, 3] as const;

  return (
    <nav aria-label="Tongue twister list">
      <div className="space-y-6">
        {books.map((bookNum) => (
          <div key={bookNum}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
              {bookLabels[bookNum]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {twisters
                .filter((t) => t.book === bookNum)
                .map((t) => {
                  const record = records[t.id];
                  const isSelected = t.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => onSelect(t)}
                      aria-current={isSelected ? 'true' : undefined}
                      aria-label={`${t.sound}${record ? `, best time ${formatMs(record.bestTimeMs)}` : ', not yet attempted'}`}
                      className={`text-left px-3 py-2 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-200">
                          #{String(t.dayNumber).padStart(2, '0')} · {t.sound}
                        </span>
                        {record && (
                          <span className="text-xs font-mono text-emerald-400">
                            {formatMs(record.bestTimeMs)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
