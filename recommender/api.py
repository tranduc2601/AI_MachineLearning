from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
import json
from datetime import datetime
import logging
from core import get_recommendations, get_db_connection
from evaluate import calculate_metrics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Music Recommender AI Engine")

class RecommendRequest(BaseModel):
    user_id: int
    num_recommendations: int = 10

class RecommendResponse(BaseModel):
    recommendation_id: int
    song_ids: list[int]

@app.post("/engine/recommend", response_model=RecommendResponse)
def recommend_endpoint(req: RecommendRequest):
    try:
        song_ids = get_recommendations(req.user_id, req.num_recommendations)
        
        # Save to Recommendations table
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Ensure Recommendations table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                song_ids TEXT,
                algorithm TEXT,
                created_at DATETIME
            )
        """)
        
        algorithm_used = "knn_explore_exploit"
        created_at = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO Recommendations (user_id, song_ids, algorithm, created_at)
            VALUES (?, ?, ?, ?)
        """, (req.user_id, json.dumps(song_ids), algorithm_used, created_at))
        
        recommendation_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return RecommendResponse(
            recommendation_id=recommendation_id,
            song_ids=song_ids
        )
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/engine/evaluate")
def evaluate_endpoint():
    try:
        metrics = calculate_metrics()
        if not metrics:
            return {"status": "skipped", "message": "No data available for evaluation"}
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        logger.error(f"Error evaluating system: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
