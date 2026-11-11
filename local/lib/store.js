// Shared word store. Redis (Upstash) in production; in-memory for local dev only.
// On Vercel with no Redis configured we throw, because per-instance memory would
// silently give every visitor a different word list.
const COUNTS = 'wc:counts';
const HIDDEN = 'wc:hidden';
const QUESTION = 'wc:question';
const DEFAULT_QUESTION = 'In one word, how do you feel about AI?';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

function redisStore() {
  const { Redis } = require('@upstash/redis');
  const redis = new Redis({ url, token });
  return {
    async add(word) {
      if (await redis.sismember(HIDDEN, word)) return;
      await redis.hincrby(COUNTS, word, 1);
    },
    async snapshot() {
      const [counts, hidden, question] = await redis.pipeline().hgetall(COUNTS).smembers(HIDDEN).get(QUESTION).exec();
      const hide = new Set(hidden || []);
      const words = Object.entries(counts || {})
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
}

function memoryStore() {
  const counts = new Map();
  const hidden = new Set();
  let question = DEFAULT_QUESTION;
  return {
    async add(word) { if (!hidden.has(word)) counts.set(word, (counts.get(word) || 0) + 1); },
    async snapshot() {
      return { words: [...counts].filter(([w]) => !hidden.has(w)).map(([w, n]) => ({ w, n })), question };
    },
    async getQuestion() { return question; },
    async setQuestion(q) { question = q; },
    async hide(word) { hidden.add(word); },
    async unhide(word) { hidden.delete(word); },
    async reset() { counts.clear(); hidden.clear(); },
  };
}

let store;
function getStore() {
  if (store) return store;
  if (url && token) store = redisStore();
  else if (process.env.VERCEL) throw new Error('Redis is not configured. Add an Upstash Redis store to this Vercel project.');
  else store = memoryStore();
  return store;
}

module.exports = { getStore };
