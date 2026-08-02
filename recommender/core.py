import os
import sqlite3
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'database', 'sqlite.db')

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_recommendations(user_id: int, num_recommendations: int = 10) -> list[int]:
    """
    Generate recommendations using kNN (Collaborative Filtering) and Explore & Exploit.
    """
    conn = get_db_connection()
    
    # 1. Bias Handling & Implicit Rating calculation
    query_ratings = """
        SELECT 
            user_id, 
            song_id, 
            AVG(
                CASE 
                    WHEN event_type = 'like' THEN 5.0
                    WHEN event_type = 'complete' THEN 4.0
                    WHEN event_type = 'start' THEN 3.0
                    WHEN event_type = 'skip' AND playback_position >= 15 THEN 2.0
                    WHEN event_type = 'dislike' THEN 1.0
                    ELSE NULL 
                END
            ) as rating
        FROM Interaction_Streams
        WHERE NOT (event_type IN ('skip', 'pause') AND playback_position < 15)
        GROUP BY user_id, song_id
        HAVING rating IS NOT NULL
    """
    try:
        ratings_df = pd.read_sql_query(query_ratings, conn)
    except Exception as e:
        logger.warning(f"Failed to query Interaction_Streams, returning random. Error: {e}")
        ratings_df = pd.DataFrame(columns=['user_id', 'song_id', 'rating'])

    # Get all songs and their genres
    try:
        songs_df = pd.read_sql_query("SELECT id as song_id, genre FROM Songs", conn)
    except Exception as e:
        logger.warning(f"Failed to query Songs, returning empty. Error: {e}")
        return []
        
    conn.close()

    if songs_df.empty:
        return []

    all_songs = songs_df['song_id'].tolist()

    # Cold start or no ratings: Return random songs
    if ratings_df.empty or user_id not in ratings_df['user_id'].values:
        logger.info(f"Cold start for user {user_id}. Returning random songs.")
        random.shuffle(all_songs)
        return all_songs[:num_recommendations]

    # Filter out genres the user dislikes (Negative Implicit Rating Filter)
    user_history = ratings_df[ratings_df['user_id'] == user_id]
    user_history_with_genres = user_history.merge(songs_df, on='song_id')
    genre_avg = user_history_with_genres.groupby('genre')['rating'].mean()
    disliked_genres = genre_avg[genre_avg < 3.0].index.tolist()
    
    logger.info(f"User {user_id} disliked genres: {disliked_genres}")
    songs_to_exclude = songs_df[songs_df['genre'].isin(disliked_genres)]['song_id'].tolist()

    # 2. kNN (Collaborative Filtering)
    user_item_matrix = ratings_df.pivot(index='user_id', columns='song_id', values='rating')
    user_item_matrix_filled = user_item_matrix.fillna(0)
    
    user_sim = cosine_similarity(user_item_matrix_filled)
    user_sim_df = pd.DataFrame(user_sim, index=user_item_matrix.index, columns=user_item_matrix.index)
    
    similar_users = user_sim_df[user_id].sort_values(ascending=False).drop(user_id)
    
    user_ratings = user_item_matrix.loc[user_id]
    user_history_songs = user_ratings.dropna().index.tolist()
    
    # Global unrated pool: All songs in the DB NOT in user's history and NOT in disliked genres
    global_unrated_songs = [s for s in all_songs if s not in user_history_songs and s not in songs_to_exclude]
    
    # For kNN predictions, predict only for songs that exist in the matrix (someone has rated them)
    songs_in_matrix = user_item_matrix.columns.tolist()
    unrated_in_matrix = [s for s in global_unrated_songs if s in songs_in_matrix]
    
    predicted_ratings = []
    for song in unrated_in_matrix:
        song_raters = user_item_matrix[song].dropna().index
        raters_sim = similar_users[similar_users.index.isin(song_raters)]
        top_k_raters = raters_sim.head(5)
        
        if top_k_raters.empty or top_k_raters.sum() == 0:
            predicted_ratings.append((song, 0))
            continue
            
        ratings = user_item_matrix.loc[top_k_raters.index, song]
        pred_rating = np.dot(top_k_raters, ratings) / top_k_raters.sum()
        predicted_ratings.append((song, pred_rating))
        
    predicted_ratings.sort(key=lambda x: x[1], reverse=True)
    
    # 3. Explore & Exploit Strategy Setup
    num_explore_target = max(1, int(num_recommendations * 0.2)) # Guarantee at least 1 explore
    num_exploit_target = num_recommendations - num_explore_target
    
    # BƯỚC 1: Bốc bài cho Exploit từ kNN
    exploit_songs = [song for song, rating in predicted_ratings[:num_exploit_target]]
    
    # BƯỚC 2: Bốc bài cho Explore
    user_history_genres = songs_df[songs_df['song_id'].isin(user_history_songs)]['genre'].unique()
    all_genres = songs_df['genre'].unique()
    unexplored_genres = [g for g in all_genres if g not in user_history_genres and g not in disliked_genres]
    
    explore_candidates_df = songs_df[
        (songs_df['song_id'].isin(global_unrated_songs)) & 
        (~songs_df['song_id'].isin(exploit_songs))
    ]
    
    explore_songs = []
    if unexplored_genres and not explore_candidates_df.empty:
        prioritized_df = explore_candidates_df[explore_candidates_df['genre'].isin(unexplored_genres)]
        if not prioritized_df.empty:
            prioritized_list = prioritized_df['song_id'].tolist()
            random.shuffle(prioritized_list)
            explore_songs = prioritized_list[:num_explore_target]
            
    if len(explore_songs) < num_explore_target and not explore_candidates_df.empty:
        remaining_candidates = explore_candidates_df[~explore_candidates_df['song_id'].isin(explore_songs)]['song_id'].tolist()
        random.shuffle(remaining_candidates)
        needed = num_explore_target - len(explore_songs)
        explore_songs.extend(remaining_candidates[:needed])
        
    # BƯỚC 3: Gộp và Trám bài (Fallback)
    final_recommendations = exploit_songs + explore_songs
    
    if len(final_recommendations) < num_recommendations:
        needed_total = num_recommendations - len(final_recommendations)
        fallback_pool = [s for s in global_unrated_songs if s not in final_recommendations]
        random.shuffle(fallback_pool)
        fallback_songs = fallback_pool[:needed_total]
        final_recommendations.extend(fallback_songs)
        explore_songs.extend(fallback_songs)

    # ABSOLUTE FAILSAFE: Ignore all filters (dislikes, history) if we STILL don't have enough songs
    if len(final_recommendations) < num_recommendations:
        logger.warning("Triggered Absolute Failsafe: Ignoring user history and disliked genres to meet num_recommendations.")
        needed_total = num_recommendations - len(final_recommendations)
        
        # Pick from the entire catalog, excluding what's already in final_recommendations
        absolute_fallback_pool = [s for s in all_songs if s not in final_recommendations]
        random.shuffle(absolute_fallback_pool)
        
        absolute_fallback_songs = absolute_fallback_pool[:needed_total]
        final_recommendations.extend(absolute_fallback_songs)
        explore_songs.extend(absolute_fallback_songs) # Classify as explore for metric consistency

    random.shuffle(final_recommendations)
    
    logger.info(f"User {user_id} recommendations: {len(exploit_songs)} exploit, {len(explore_songs)} explore")
    return final_recommendations
