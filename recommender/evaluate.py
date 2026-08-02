import os
import sqlite3
import pandas as pd
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'database', 'sqlite.db')

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def calculate_metrics():
    """
    Evaluates the Recommendation System using data from Interaction_Streams.
    Calculates Confusion Matrix (TP, FP, TN, FN) and Accuracy.
    Saves the results into Run_Metrics.
    """
    conn = get_db_connection()
    
    # We define:
    # Predicted Positive (1): source = 'recommendation' (System recommended it)
    # Predicted Negative (0): source = 'organic' (System did not recommend it)
    # Actual Positive (1): event_type in ('like', 'complete') (User enjoyed it)
    # Actual Negative (0): event_type in ('dislike', 'skip', 'pause', 'start') (User rejected it or didn't explicitly enjoy it fully)
    
    query = """
        SELECT 
            CASE WHEN source = 'recommendation' THEN 1 ELSE 0 END as predicted,
            CASE WHEN event_type IN ('like', 'complete') THEN 1 ELSE 0 END as actual
        FROM Interaction_Streams
    """
    
    try:
        df = pd.read_sql_query(query, conn)
    except Exception as e:
        logger.error(f"Failed to query Interaction_Streams for evaluation: {e}")
        conn.close()
        return None
        
    if df.empty:
        logger.info("No interaction data available for evaluation.")
        conn.close()
        return None
        
    tp = len(df[(df['predicted'] == 1) & (df['actual'] == 1)])
    fp = len(df[(df['predicted'] == 1) & (df['actual'] == 0)])
    tn = len(df[(df['predicted'] == 0) & (df['actual'] == 0)])
    fn = len(df[(df['predicted'] == 0) & (df['actual'] == 1)])
    
    total = tp + fp + tn + fn
    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    
    confusion_matrix_dict = {
        "TP": tp,
        "FP": fp,
        "TN": tn,
        "FN": fn
    }
    
    metrics = {
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "confusion_matrix": json.dumps(confusion_matrix_dict),
        "timestamp": datetime.now().isoformat()
    }
    
    # Save to Run_Metrics
    try:
        # Ensure table exists just in case (though backend should create it)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Run_Metrics (
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
                timestamp DATETIME
            )
        """)
        
        cursor.execute("""
            INSERT INTO Run_Metrics (tp, fp, tn, fn, accuracy, precision, recall, confusion_matrix, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tp, fp, tn, fn, accuracy, precision, recall, metrics['confusion_matrix'], metrics['timestamp']))
        
        conn.commit()
        logger.info(f"Calculated Metrics - Accuracy: {accuracy:.2f}, TP:{tp}, FP:{fp}, TN:{tn}, FN:{fn}")
    except Exception as e:
        logger.error(f"Failed to insert into Run_Metrics: {e}")
    finally:
        conn.close()
        
    return metrics
