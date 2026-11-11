const { getStore } = require('../lib/store');

// Vercel sets this to the project's public production domain (or custom domain), without protocol.
const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const joinOrigin = prod ? `https://${prod}` : null;

module.exports = async function handler(req, res) {
  try {
    const { words, question } = await getStore().snapshot();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ words, question, joinOrigin });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
