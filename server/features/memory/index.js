import express from 'express';

export const createMemoryRouter = (keyValueService, episodicService, userId) => {
  const router = express.Router();
  const USER_ID = userId || 'default_user';

  router.post('/remember', async (req, res) => {
  const { key, value, text } = req.body;

  try {
    if (key && value != null) {
      keyValueService.writeKV(USER_ID, key, value);
      return res.json({ status: 'OK', type: 'kv' });
    } 
    if (text && typeof text === 'string' && text.trim() && text.length > 0) {
      episodicService.writeEpisode(USER_ID, text);
      return res.json({ status: 'OK', type: 'epi' });
    }
    res.status(400).json({ error: 'Invalid request, provide key/value or text' });
  } catch (error) {
    console.error('Memory write error:', error);
    res.status(500).json({ error: 'Failed to write memory', message: error.message });
  }
  });


  router.post('/forget', (req, res) => {
    const { key } = req.body || {};
    try {
      if (!key) {
        return res.status(400).json({ error: 'Key is required to forget' });
      }
      keyValueService.deleteKV(USER_ID, key);
      res.json({ status: 'OK' });
    } catch (error) {
      console.error('Memory delete error:', error);
      res.status(500).json({ error: 'Failed to delete memory', message: error.message });
    }
  });

  router.get('/list', (req, res) => {
    try {
      const items = keyValueService.listKV(USER_ID);
      res.json({ items });
    } catch (error) {
      console.error('Memory list error:', error);
      res.status(500).json({ error: 'Failed to list memory', message: error.message });
    }
  });
}