import { useState } from 'react';
import { twisters } from './data/twisters';
import type { Twister } from './types/twister';
import { TwisterList } from './components/TwisterList';
import { GamePanel } from './components/GamePanel';
import { StatsPanel } from './components/StatsPanel';
import { getAllRecords } from './services/recordsService';

function App() {
  const [selected, setSelected] = useState<Twister>(twisters[0]);
  const [records, setRecords] = useState(getAllRecords());
  const [showStats, setShowStats] = useState(false);

  const refreshRecords = () => setRecords(getAllRecords());

  const totalAttempted = Object.keys(records).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">CELC Tongue Twister Challenge</h1>
            <p className="text-slate-400 text-sm mt-1">
              Pronunciation practice for sounds that are hard for Dari/Persian speakers.
              Record yourself, beat your best time, master every sound.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowStats((v) => !v)}
            aria-expanded={showStats ? 'true' : 'false'}
            aria-controls="stats-panel"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-sm text-slate-300 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span className="font-mono text-emerald-400">
              {totalAttempted}/{twisters.length}
            </span>
            <span>{showStats ? 'Hide stats' : 'Show stats'}</span>
          </button>
        </div>
      </header>

      {showStats && (
        <div id="stats-panel">
          <StatsPanel records={records} />
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 sm:gap-8">
        <aside className="order-2 lg:order-1">
          <TwisterList
            selectedId={selected.id}
            records={records}
            onSelect={setSelected}
          />
        </aside>

        <section className="order-1 lg:order-2">
          <GamePanel twister={selected} onAttemptSaved={refreshRecords} />
        </section>
      </main>
    </div>
  );
}

export default App;
