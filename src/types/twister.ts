export interface Twister {
  id: string;          // e.g. "b1-01"
  book: 1 | 2 | 3;
  dayNumber: number;   // 1-20
  topic: string;       // e.g. "Greetings"
  sound: string;       // e.g. '"TH" — voiceless /θ/'
  text: string;        // the tongue twister itself
}

export interface AttemptRecord {
  twisterId: string;
  bestTimeMs: number;
  lastAttemptAt: string; // ISO date
  attemptCount: number;
  lastRating?: 1 | 2 | 3 | 4 | 5;
}
