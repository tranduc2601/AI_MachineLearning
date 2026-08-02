import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || 'database/sqlite.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error(`Failed to connect to SQLite: ${err.message}`);
  } else {
    logger.info(`Connected to SQLite DB at ${dbPath}`);
  }
});

export const initDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Users
      db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 2. Songs
      db.run(`CREATE TABLE IF NOT EXISTS Songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        genre TEXT,
        duration_seconds INTEGER,
        file_path TEXT
      )`);

      // 3. Recommendations (Lịch sử các lần gợi ý)
      // Tạo trước để Interaction_Streams có thể tham chiếu FK
      db.run(`CREATE TABLE IF NOT EXISTS Recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        song_ids TEXT NOT NULL,
        algorithm TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES Users(id)
      )`);

      // 4. Interaction_Streams (Đã gộp Feedback, thêm source & recommendation_id)
      db.run(`CREATE TABLE IF NOT EXISTS Interaction_Streams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        song_id INTEGER NOT NULL,
        session_id TEXT,
        event_type TEXT NOT NULL,
        playback_position INTEGER,
        source TEXT DEFAULT 'search',
        recommendation_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES Users(id),
        FOREIGN KEY(song_id) REFERENCES Songs(id),
        FOREIGN KEY(recommendation_id) REFERENCES Recommendations(id)
      )`);

      // 5. Run_Metrics
      db.run(`CREATE TABLE IF NOT EXISTS Run_Metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recommendation_id INTEGER,
        tp INTEGER,
        fp INTEGER,
        tn INTEGER,
        fn INTEGER,
        accuracy REAL,
        precision REAL,
        recall REAL,
        confusion_matrix TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(recommendation_id) REFERENCES Recommendations(id)
      )`, (err) => {
        if (err) {
          logger.error(`Error initializing tables: ${err.message}`);
          return reject(err);
        }
        logger.info('Database schema initialized successfully (Latest: Removed Feedback, updated Interaction_Streams)');
        resolve(db);
      });
    });
  });
};

export default db;
