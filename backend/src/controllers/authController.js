import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import logger from '../utils/logger.js';

export const login = (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  db.get('SELECT * FROM Users WHERE username = ?', [username], (err, user) => {
    if (err) {
      logger.error('Login DB Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!user) {
      db.run('INSERT INTO Users (username) VALUES (?)', [username], function(insertErr) {
        if (insertErr) {
          logger.error('Failed to create new user on login:', insertErr);
          return res.status(500).json({ error: 'Could not create new user' });
        }
        const newUserId = this.lastID;
        const token = jwt.sign(
          { id: newUserId, username }, 
          process.env.JWT_SECRET || 'super_secret_music_system_key_2026', 
          { expiresIn: '30d' }
        );
        logger.info(`Find-or-Create: New user registered & logged in: ${username} (ID: ${newUserId})`);
        return res.status(201).json({ token, user: { id: newUserId, username } });
      });
    } else {
      const token = jwt.sign(
        { id: user.id, username: user.username }, 
        process.env.JWT_SECRET || 'super_secret_music_system_key_2026', 
        { expiresIn: '30d' }
      );
      logger.info(`Find-or-Create: Existing user logged in: ${user.username} (ID: ${user.id})`);
      return res.json({ token, user: { id: user.id, username: user.username } });
    }
  });
};
