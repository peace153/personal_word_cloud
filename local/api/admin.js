const { getStore } = require('../lib/store');

const MAX_QUESTION = 120;

// Moderation from the display screen: { action: 'hide' | 'unhide' | 'reset' | 'question', word?, question? }
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { action, word, question } = req.body || {};
  try {
    const store = getStore();
    if (action === 'reset') await store.reset();
    else if ((action === 'hide' || action === 'unhide') && typeof word === 'string' && word) await store[action](word);
    else if (action === 'question') {
      const q = typeof question === 'string' ? question.replace(/\s+/g, ' ').trim() : '';
      if (!q) return res.status(400).json({ error: 'Question can\'t be empty' });
      if ([...q].length > MAX_QUESTION) return res.status(400).json({ error: `Max ${MAX_QUESTION} characters` });
      await store.setQuestion(q);
      return res.status(200).json({ ok: true, question: q });
    } else return res.status(400).json({ error: 'Bad request' });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
