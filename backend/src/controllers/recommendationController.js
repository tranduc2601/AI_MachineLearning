import axios from 'axios';
import db from '../config/db.js';
import logger from '../utils/logger.js';

export const getRecommendations = async (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing' });
  }

  try {
    const pythonUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';
    const response = await axios.post(`${pythonUrl}/engine/recommend`, {
      user_id: userId
    });

    const songIds = response.data.song_ids || [];
    const algorithm = response.data.algorithm || 'hybrid_explore_exploit';

    db.run(
      'INSERT INTO Recommendations (user_id, song_ids, algorithm) VALUES (?, ?, ?)',
      [userId, JSON.stringify(songIds), algorithm],
      function (err) {
        if (err) {
          logger.error('Failed to log recommendation to SQLite:', err);
          return res.status(500).json({ error: 'Failed to record recommendation history' });
        }
        
        logger.info(`Generated recommendations for User ${userId}, Rec_ID: ${this.lastID}`);
        res.json({
          recommendation_id: this.lastID,
          song_ids: songIds,
          algorithm
        });
      }
    );
  } catch (error) {
    logger.error(`Failed to proxy request to Python Engine: ${error.message}`);
    logger.info('Returning fallback recommendations due to Python engine failure.');
    
    // Fallback response with 5 random/default songs to prevent frontend crash
    const fallbackSongIds = [1, 2, 3, 4, 5];
    
    db.run(
      'INSERT INTO Recommendations (user_id, song_ids, algorithm) VALUES (?, ?, ?)',
      [userId, JSON.stringify(fallbackSongIds), 'fallback_offline'],
      function (dbErr) {
        if (dbErr) {
          return res.status(500).json({ error: 'Fallback failed to save to database' });
        }
        res.status(200).json({
          recommendation_id: this.lastID,
          song_ids: fallbackSongIds,
          algorithm: 'fallback_offline',
          warning: 'Recommendation Engine is offline. Using fallback suggestions.'
        });
      }
    );
  }
};
