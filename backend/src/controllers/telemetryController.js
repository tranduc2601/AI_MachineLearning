import db from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Ghi log hành vi người dùng (Play, Pause, Skip, Like, Dislike, Complete).
 * API này kiêm luôn việc ghi nhận phản hồi (Feedback) nếu truyền kèm 
 * source="recommendation" và recommendation_id.
 */
export const logTelemetry = (req, res) => {
  const { 
    song_id, 
    session_id, 
    event_type, 
    playback_position, 
    source, 
    recommendation_id 
  } = req.body;
  
  // Fake user_id since we haven't implemented auth middleware completely yet.
  // In reality, this comes from req.user.id injected by verifyToken middleware.
  const user_id = req.user ? req.user.id : req.body.user_id;

  if (!user_id || !song_id || !event_type) {
    return res.status(400).json({ error: 'Missing required fields: user_id, song_id, event_type' });
  }

  // Set default source to 'search' if not provided
  const interactionSource = source || 'search';

  const query = `
    INSERT INTO Interaction_Streams 
    (user_id, song_id, session_id, event_type, playback_position, source, recommendation_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      user_id, 
      song_id, 
      session_id || null, 
      event_type, 
      playback_position || 0, 
      interactionSource, 
      recommendation_id || null
    ],
    function(err) {
      if (err) {
        logger.error(`Failed to log telemetry: ${err.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      logger.info(`Telemetry Logged [${event_type}]: user=${user_id}, song=${song_id}, source=${interactionSource}, rec_id=${recommendation_id || 'N/A'}`);
      
      res.status(201).json({ 
        success: true, 
        message: 'Telemetry logged successfully',
        interaction_id: this.lastID 
      });
    }
  );
};
