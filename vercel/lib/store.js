// Shared word store backed by Upstash Redis, so every visitor and every serverless
// instance sees one list. There is deliberately no in-memory fallback here: on Vercel it
// would give each instance its own list. Use ../local for offline testing.
const { Redis } = require('@upstash/redis');

const COUNTS = 'wc:counts';
const HIDDEN = 'wc:hidden';
const QUESTION = 'wc:question';
const DEFAULT_QUESTION = 'In one word, how do you feel about AI?';

// The Vercel Marketplace integration injects KV_REST_API_*; a manual Upstash setup uses UPSTASH_REDIS_REST_*.
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let store;
function getStore() {
  if (store) return store;
  if (!url || !token) throw new Error('Redis is not configured. Add an Upstash Redis store to this Vercel project, then redeploy.');

  // Words are plain strings: without this the client JSON-parses reads, so a hidden word like "123"
  // would come back as the number 123 and never match its hidden entry.
  const redis = new Redis({ url, token, automaticDeserialization: false });

  store = {
    async add(word) {
      if (await redis.sismember(HIDDEN, word)) return;
      await redis.hincrby(COUNTS, word, 1);
    },
    async snapshot() {
      const [counts, hidden, question] = await redis.pipeline().hgetall(COUNTS).smembers(HIDDEN).get(QUESTION).exec();
      const hide = new Set((hidden || []).map(String));
      // With deserialization off, HGETALL comes back as a flat [field, value, field, value, ...] list.
      const pairs = Array.isArray(counts)
        ? Array.from({ length: counts.length >> 1 }, (_, i) => [String(counts[2 * i]), counts[2 * i + 1]])
        : Object.entries(counts || {});
      const words = pairs
        .filter(([w]) => !hide.has(w))
        .map(([w, n]) => ({ w, n: Number(n) }));
      return { words, question: question || DEFAULT_QUESTION };
    },
    async getQuestion() { return (await redis.get(QUESTION)) || DEFAULT_QUESTION; },
    async setQuestion(q) { await redis.set(QUESTION, q); },
    async hide(word) { await redis.sadd(HIDDEN, word); },
    async unhide(word) { await redis.srem(HIDDEN, word); },
    async reset() { await redis.del(COUNTS, HIDDEN); },
  };
  return store;
}

module.exports = { getStore };
