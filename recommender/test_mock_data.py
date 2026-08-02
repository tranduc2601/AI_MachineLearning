import sqlite3
import os
import random
from datetime import datetime
from core import get_recommendations

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'database', 'sqlite.db')

def setup_mock_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # DDL: Create tables if backend hasn't yet (for standalone testing capability)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            created_at DATETIME
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Songs (
            id INTEGER PRIMARY KEY,
            title TEXT,
            artist TEXT,
            genre TEXT,
            duration_seconds INTEGER,
            file_path TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Interaction_Streams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            song_id INTEGER,
            session_id TEXT,
            event_type TEXT,
            playback_position INTEGER,
            timestamp DATETIME,
            source TEXT,
            recommendation_id INTEGER
        )
    """)
    
    # Clear existing mock data to start fresh during tests
    cursor.execute("DELETE FROM Users")
    cursor.execute("DELETE FROM Songs")
    cursor.execute("DELETE FROM Interaction_Streams")
    
    # Insert Mock Users
    users = [
        (1, "User_A_PopLover", datetime.now().isoformat()),
        (2, "User_B_PopLover", datetime.now().isoformat()),
        (3, "User_C_ClassicalLover", datetime.now().isoformat())
    ]
    cursor.executemany("INSERT INTO Users (id, username, created_at) VALUES (?, ?, ?)", users)
    
    # Insert Mock Songs (Genres: Pop, Rock, Classical, EDM)
    songs = [
        # Pop
        (1, "Pop Song 1", "Artist 1", "Pop", 200, "/pop1.mp3"),
        (2, "Pop Song 2", "Artist 2", "Pop", 210, "/pop2.mp3"),
        (3, "Pop Song 3", "Artist 3", "Pop", 190, "/pop3.mp3"),
        # Rock
        (4, "Rock Song 1", "Artist 4", "Rock", 220, "/rock1.mp3"),
        (5, "Rock Song 2", "Artist 5", "Rock", 230, "/rock2.mp3"),
        # Classical
        (6, "Classical Song 1", "Artist 6", "Classical", 300, "/class1.mp3"),
        (7, "Classical Song 2", "Artist 7", "Classical", 310, "/class2.mp3"),
        # EDM
        (8, "EDM Song 1", "Artist 8", "EDM", 180, "/edm1.mp3"),
        (9, "EDM Song 2", "Artist 9", "EDM", 185, "/edm2.mp3")
    ]
    cursor.executemany("INSERT INTO Songs (id, title, artist, genre, duration_seconds, file_path) VALUES (?, ?, ?, ?, ?, ?)", songs)
    
    # Insert Mock Interactions
    # User 1 & User 2 both like Pop and Rock (Similar Users)
    # User 1 hasn't rated Pop Song 3 and Rock Song 2, but User 2 likes them. 
    # Therefore, kNN should recommend Pop Song 3 and Rock Song 2 to User 1 (Exploit).
    # User 1 has never heard Classical or EDM (Explore targets).
    
    interactions = [
        # User 1 loves Pop 1, Pop 2, Rock 1
        (1, 1, 'session_1', 'like', 200, datetime.now().isoformat(), 'organic', None),
        (1, 2, 'session_1', 'complete', 210, datetime.now().isoformat(), 'organic', None),
        (1, 4, 'session_1', 'like', 220, datetime.now().isoformat(), 'organic', None),
        # User 1 hates Classical 1 (Bias handling test: skip < 15s will be ignored by model, but we add a dislike to be sure)
        (1, 6, 'session_1', 'dislike', 10, datetime.now().isoformat(), 'organic', None),
        
        # User 2 loves Pop 1, Pop 2, Pop 3, Rock 1, Rock 2
        (2, 1, 'session_2', 'like', 200, datetime.now().isoformat(), 'organic', None),
        (2, 2, 'session_2', 'like', 210, datetime.now().isoformat(), 'organic', None),
        (2, 3, 'session_2', 'complete', 190, datetime.now().isoformat(), 'organic', None), # Exploit target for User 1
        (2, 4, 'session_2', 'like', 220, datetime.now().isoformat(), 'organic', None),
        (2, 5, 'session_2', 'like', 230, datetime.now().isoformat(), 'organic', None), # Exploit target for User 1
        
        # User 3 loves only Classical
        (3, 6, 'session_3', 'like', 300, datetime.now().isoformat(), 'organic', None),
        (3, 7, 'session_3', 'complete', 310, datetime.now().isoformat(), 'organic', None),
    ]
    
    cursor.executemany("""
        INSERT INTO Interaction_Streams 
        (user_id, song_id, session_id, event_type, playback_position, timestamp, source, recommendation_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, interactions)
    
    conn.commit()
    conn.close()
    print("Mock Data Injected Successfully!")

def run_test():
    setup_mock_db()
    
    print("\n--- TEST: GET RECOMMENDATIONS FOR USER 1 ---")
    print("User 1 loves Pop & Rock, hates Classical, hasn't heard EDM.")
    print("Expected Exploit: Pop Song 3 (ID 3), Rock Song 2 (ID 5)")
    print("Expected Explore: EDM (ID 8 or 9) or Classical")
    
    # Request 5 recommendations (80% Exploit = 4, 20% Explore = 1)
    recommendations = get_recommendations(user_id=1, num_recommendations=5)
    
    print(f"\nResulting Song IDs: {recommendations}")
    
    # Fetch details to display
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    placeholders = ','.join('?' for _ in recommendations)
    cursor.execute(f"SELECT id, title, genre FROM Songs WHERE id IN ({placeholders})", recommendations)
    song_details = cursor.fetchall()
    conn.close()
    
    print("\nDetails:")
    for song_id in recommendations: # Preserve order of recommendation
        detail = next((s for s in song_details if s[0] == song_id), None)
        if detail:
            print(f"- [ID {detail[0]}] {detail[1]} (Genre: {detail[2]})")

if __name__ == "__main__":
    run_test()
