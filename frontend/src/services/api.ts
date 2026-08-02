import axios from 'axios';
import type {
  User,
  Song,
  TelemetryPayload,
  RecommendationResponse,
  AnalyticsMetricsResponse
} from '../types';
import { MOCK_SONGS, MOCK_METRICS } from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 4000
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for session ID tracking
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('music_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('music_session_id', sessionId);
  }
  return sessionId;
};

// API Services
export const authService = {
  login: async (username: string): Promise<User> => {
    try {
      console.log('Calling POST /api/auth/login with:', { username });
      const response = await apiClient.post('/auth/login', { username });
      if (response.data?.token) localStorage.setItem('token', response.data.token);
      console.log('Response from POST /api/auth/login:', response.data);

      // Handle backend response format: { success: true, user: { id, username } }
      if (response.data?.user && typeof response.data.user.id === 'number') {
        return {
          id: response.data.user.id,
          username: response.data.user.username || username
        };
      }
      // Handle direct response format: { id, username }
      if (response.data?.id && typeof response.data.id === 'number') {
        return {
          id: response.data.id,
          username: response.data.username || username
        };
      }
      // Handle raw numeric ID response
      if (typeof response.data === 'number') {
        return { id: response.data, username };
      }
      return response.data;
    } catch (err) {
      console.warn('Backend login endpoint unavailable, deriving deterministic user ID from username:', err);
      // Fallback for offline mode: derive a deterministic numeric ID from username
      const uniqueId = Math.abs(hashString(username)) % 10000 + 1;
      return {
        id: uniqueId,
        username
      };
    }
  }
};

export const songService = {
  getSongs: async (): Promise<Song[]> => {
    try {
      const response = await apiClient.get('/songs');
      return response.data;
    } catch (err) {
      console.warn('Backend /api/songs endpoint unavailable, using mock catalog:', err);
      return MOCK_SONGS;
    }
  }
};

export const telemetryService = {
  logEvent: async (payload: TelemetryPayload): Promise<boolean> => {
    try {
      console.log('Sending Telemetry Log to API (POST /api/telemetry/log):', payload);
      await apiClient.post('/telemetry/log', payload);
      return true;
    } catch (err) {
      console.warn('Backend /api/telemetry/log failed/offline (logged locally):', payload);
      return true;
    }
  }
};

export const recommendationService = {
  getRecommendations: async (userId: number): Promise<RecommendationResponse> => {
    try {
      console.log(`Fetching recommendations for user_id=${userId} from GET /api/recommendations...`);
      const response = await apiClient.get('/recommendations', {
        params: { user_id: userId }
      });
      return response.data;
    } catch (err) {
      console.warn('Backend /api/recommendations unavailable, returning mock smart recommendations:', err);
      const shuffled = [...MOCK_SONGS].sort(() => 0.5 - Math.random());
      return {
        recommendation_id: Math.floor(Math.random() * 9000) + 1000,
        songs: shuffled.slice(0, 4),
        algorithm: Math.random() > 0.3 ? 'knn_user' : 'explore'
      };
    }
  }
};

export const analyticsService = {
  getMetrics: async (): Promise<AnalyticsMetricsResponse> => {
    try {
      const response = await apiClient.get('/analytics/metrics');
      return response.data;
    } catch (err) {
      console.warn('Backend /api/analytics/metrics unavailable, returning mock metrics:', err);
      return MOCK_METRICS;
    }
  }
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
