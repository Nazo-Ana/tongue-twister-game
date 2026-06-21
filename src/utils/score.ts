export type Score = 1 | 2 | 3 | 4 | 5;

export const scoreLabels: Record<Score, string> = {
  1: 'Keep trying — most words were missed',
  2: 'Getting closer — a few words recognised',
  3: 'Pretty good — more than half correct',
  4: 'Almost perfect — just one or two words off',
  5: 'Perfect — every word recognised!',
};

function normalise(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function computeScore(transcript: string, expected: string): Score {
  const expectedWords = normalise(expected);
  const heardSet = new Set(normalise(transcript));
  const matched = expectedWords.filter((w) => heardSet.has(w)).length;
  const ratio = expectedWords.length > 0 ? matched / expectedWords.length : 0;
  if (ratio >= 0.9) return 5;
  if (ratio >= 0.7) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.3) return 2;
  return 1;
}

export function wordFeedback(
  transcript: string,
  expected: string,
): { word: string; heard: boolean }[] {
  const heardSet = new Set(normalise(transcript));
  return normalise(expected).map((word) => ({ word, heard: heardSet.has(word) }));
}
