const { getStore } = require('../lib/store');

// Lightweight endpoint for phones: just the current question.
module.exports = async function handler(req, res) {
  try {
    const question = await getStore().getQuestion();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ question });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
