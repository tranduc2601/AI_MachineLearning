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

const seedData = (database) => {
  return new Promise((resolve, reject) => {
    database.get('SELECT COUNT(*) as count FROM Songs', (err, row) => {
      if (err) return reject(err);
      
      if (row.count === 0) {
        logger.info('Songs table is empty. Seeding 10 real playable tracks...');
        const stmt = database.prepare('INSERT INTO Songs (title, artist, genre, duration_seconds, file_path) VALUES (?, ?, ?, ?, ?)');
        
        // Using highly reliable SoundHelix direct CDN mp3 files
        const sampleSongs = [
          { title: "SoundHelix Song 1", artist: "SoundHelix", genre: "Electronic", duration: 372, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
          { title: "SoundHelix Song 2", artist: "SoundHelix", genre: "Electronic", duration: 425, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
          { title: "SoundHelix Song 3", artist: "SoundHelix", genre: "Electronic", duration: 344, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
          { title: "SoundHelix Song 4", artist: "SoundHelix", genre: "Electronic", duration: 302, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
          { title: "SoundHelix Song 5", artist: "SoundHelix", genre: "Electronic", duration: 353, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
          { title: "SoundHelix Song 6", artist: "SoundHelix", genre: "Electronic", duration: 285, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
          { title: "SoundHelix Song 7", artist: "SoundHelix", genre: "Electronic", duration: 405, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
          { title: "SoundHelix Song 8", artist: "SoundHelix", genre: "Electronic", duration: 350, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
          { title: "SoundHelix Song 9", artist: "SoundHelix", genre: "Electronic", duration: 360, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
          { title: "SoundHelix Song 10", artist: "SoundHelix", genre: "Electronic", duration: 375, file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" }
        ];

        sampleSongs.forEach(song => {
          stmt.run([song.title, song.artist, song.genre, song.duration, song.file]);
        });
        
        stmt.finalize((finalizeErr) => {
          if (finalizeErr) return reject(finalizeErr);
          logger.info('Seed data inserted successfully with SoundHelix MP3s.');
          resolve();
        });
      } else {
        logger.info(`Songs table already has ${row.count} tracks. Skipping seed.`);
        resolve();
      }
    });
  });
};

export const initDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        genre TEXT,
        duration_seconds INTEGER,
        file_path TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        song_ids TEXT NOT NULL,
        algorithm TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES Users(id)
      )`);

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
      )`, async (err) => {
        if (err) {
          logger.error(`Error initializing tables: ${err.message}`);
          return reject(err);
        }
        logger.info('Database schema initialized successfully (Latest: Removed Feedback, updated Interaction_Streams)');
        
        try {
          await seedData(db);
          resolve(db);
        } catch (seedErr) {
          logger.error(`Error seeding data: ${seedErr.message}`);
          reject(seedErr);
        }
      });
    });
  });
};

export default db;
