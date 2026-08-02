import db from '../config/db.js';

export const getMetrics = (req, res) => {
  db.all('SELECT * FROM Run_Metrics ORDER BY timestamp ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch analytics metrics' });
    }
    res.json(rows);
  });
};
