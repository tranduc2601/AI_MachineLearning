import db from '../config/db.js';

export const getSongs = (req, res) => {
  db.all('SELECT * FROM Songs', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch songs' });
    }
    res.json(rows);
  });
};
