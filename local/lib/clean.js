const { RegExpMatcher, englishDataset, englishRecommendedTransformers } = require('obscenity');

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });

const MAX_LEN = 50;

// Count "characters" the way people see them: a Thai consonant plus its vowel/tone marks is one.
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const thaiWords = new Intl.Segmenter('th', { granularity: 'word' });

// Basic Thai blocklist, matched against whole segmented words (Thai has no spaces) so innocent
// words that merely contain these letters (e.g. สัสดี, หีบ) are not blocked. Not exhaustive:
// use "Hide words" on the display for anything that slips through.
const THAI_BLOCKED = new Set([
  'ควย', 'หี', 'เหี้ย', 'เย็ด', 'เยด', 'สัส', 'สัด', 'ชิบหาย', 'ส้นตีน', 'เงี่ยน', 'ห่า', 'แม่ง', 'พ่อมึงตาย', 'อีดอก', 'ไอ้สัตว์', 'อีสัตว์',
]);

function hasThaiProfanity(text) {
  // Collapse stretched letters ("เหี้ยยยย") before checking.
  const squeezed = text.replace(/(.)\1{2,}/gu, '$1');
  if (THAI_BLOCKED.has(squeezed)) return true;
  for (const { segment, isWordLike } of thaiWords.segment(squeezed)) {
    if (isWordLike && THAI_BLOCKED.has(segment)) return true;
  }
  return false;
}

// Returns { word } or { error }. Order: trim -> lowercase -> limit 50 -> profanity.
function clean(input) {
  if (typeof input !== 'string') return { error: 'Type a word first' };
  const raw = input.normalize('NFC').trim().toLowerCase();
  if (!raw) return { error: 'Type a word first' };
  if (/\s/.test(raw)) return { error: 'One word only, please' };

  // Keep letters (any language, incl. Thai marks), digits, apostrophes and hyphens.
  const stripped = raw.replace(/[^\p{L}\p{M}\p{N}'-]/gu, '').replace(/^['-]+|['-]+$/g, '');
  const word = [...graphemes.segment(stripped)].slice(0, MAX_LEN).map((s) => s.segment).join('');
  if (!word) return { error: 'Use letters or numbers' };

  // Check both the raw input (catches "f*ck") and the cleaned word.
  if (matcher.hasMatch(raw) || matcher.hasMatch(word) || hasThaiProfanity(word)) return { error: "Let's keep it friendly" };

  return { word };
}

module.exports = { clean, MAX_LEN };
