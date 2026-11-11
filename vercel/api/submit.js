const { getStore } = require('../lib/store');
const { clean } = require('../lib/clean');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const result = clean(req.body && req.body.word);
  if (result.error) return res.status(422).json({ error: result.error });
  try {
    await getStore().add(result.word);
    res.status(200).json({ ok: true, word: result.word });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
