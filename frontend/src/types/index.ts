export interface User {
  id: number;
  username: string;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  duration_seconds: number;
  file_path: string;
  album_art_url?: string;
  audio_url?: string;
}

export type InteractionEventType = 'start' | 'pause' | 'skip' | 'complete' | 'like' | 'dislike';

export type InteractionSource = 'search' | 'recommendation' | 'playlist';

export interface TelemetryPayload {
  user_id: number;
  song_id: number;
  session_id: string;
  event_type: InteractionEventType;
  playback_position_seconds: number;
  source?: InteractionSource;
  recommendation_id?: number | null;
}

export interface RecommendationResponse {
  recommendation_id: number;
  songs: Song[];
  algorithm?: 'knn_user' | 'knn_item' | 'explore';
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface MetricHistoryPoint {
  timestamp: string;
  accuracy: number;
  precision: number;
  recall: number;
}

export interface AnalyticsMetricsResponse {
  history: MetricHistoryPoint[];
  latest_confusion_matrix: ConfusionMatrix;
}
