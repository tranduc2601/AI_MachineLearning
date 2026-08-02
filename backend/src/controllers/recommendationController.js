import axios from 'axios';
import db from '../config/db.js';
import logger from '../utils/logger.js';

export const getRecommendations = async (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing' });
  }

  try {
    // URL của Recommender Engine Python (Mặc định: http://localhost:8000)
    const pythonUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';
    
    // Yêu cầu Python tính toán gợi ý (kNN + Explore/Exploit)
    const response = await axios.post(`${pythonUrl}/engine/recommend`, {
      user_id: userId
    });

    const songIds = response.data.song_ids || [];
    const algorithm = response.data.algorithm || 'hybrid_explore_exploit';

    // Lưu lại lịch sử Recommendations để phục vụ feedback loop
    db.run(
      'INSERT INTO Recommendations (user_id, song_ids, algorithm) VALUES (?, ?, ?)',
      [userId, JSON.stringify(songIds), algorithm],
      function (err) {
        if (err) {
          logger.error('Failed to log recommendation to SQLite:', err);
          return res.status(500).json({ error: 'Failed to record recommendation history' });
        }
        
        logger.info(`Generated recommendations for User ${userId}, Rec_ID: ${this.lastID}`);
        // Trả về danh sách bài hát cùng với mã recommendation_id
        res.json({
          recommendation_id: this.lastID,
          song_ids: songIds,
          algorithm
        });
      }
    );
  } catch (error) {
    logger.error('Failed to proxy request to Python Engine:', error.message);
    res.status(503).json({ error: 'Recommendation Engine (Python) is currently unavailable' });
  }
};
