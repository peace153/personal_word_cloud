const { getStore } = require('../lib/store');

module.exports = async function handler(req, res) {
  try {
    const { words, question } = await getStore().snapshot();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ words, question });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
