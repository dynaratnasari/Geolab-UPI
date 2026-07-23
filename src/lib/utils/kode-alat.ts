const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/**
 * Derives a 2-letter code from an item name: first letter of the first two
 * words for multi-word names (e.g. "Total Station" -> TS), or first letter +
 * a middle consonant for single-word names (e.g. "Waterpass" -> WP).
 */
function firstLetter(word: string): string {
  const match = word.match(/[a-zA-Z]/);
  return match ? match[0].toUpperCase() : "X";
}

export function getInisialNama(nama: string): string {
  const words = nama.trim().split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (words.length >= 2) {
    return firstLetter(words[0]) + firstLetter(words[1]);
  }

  const word = words[0] ?? "XX";
  const first = firstLetter(word);
  const rest = word.slice(1).toLowerCase();
  const consonants = [...rest].filter((ch) => /[a-z]/.test(ch) && !VOWELS.has(ch));

  if (consonants.length === 0) {
    return (first + (word[1] ?? "X")).toUpperCase();
  }

  const mid = consonants[Math.floor(consonants.length / 2)];
  return (first + mid).toUpperCase();
}

/** Builds `{INISIAL}-GL-{seq}` codes for a list of item names, in the given order. */
export function assignKodeInventaris(namas: string[]): string[] {
  const counters = new Map<string, number>();
  return namas.map((nama) => {
    const inisial = getInisialNama(nama);
    const seq = (counters.get(inisial) ?? 0) + 1;
    counters.set(inisial, seq);
    return `${inisial}-GL-${String(seq).padStart(2, "0")}`;
  });
}
