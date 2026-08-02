import type { Song, AnalyticsMetricsResponse } from '../types';

export const MOCK_SONGS: Song[] = [
  {
    id: 1,
    title: 'Midnight City Lights',
    artist: 'SynthWave Collective',
    genre: 'Synthwave',
    duration_seconds: 212,
    file_path: 'songs/midnight_city_lights.mp3',
    album_art_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 2,
    title: 'Acoustic Morning Coffee',
    artist: 'Luna Acoustic',
    genre: 'Acoustic / Indie',
    duration_seconds: 185,
    file_path: 'songs/acoustic_morning.mp3',
    album_art_url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&auto=format&fit=crop&q=80',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 3,
    title: 'Neon Cyberpunk Beats',
    artist: 'Overdrive Cyber',
    genre: 'Electronic',
    duration_seconds: 240,
    file_path: 'songs/neon_cyberpunk.mp3',
    album_art_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 4,
    title: 'Lo-Fi Chill Rain',
    artist: 'Study Beats Society',
    genre: 'Lo-Fi',
    duration_seconds: 198,
    file_path: 'songs/lofi_chill_rain.mp3',
    album_art_url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&auto=format&fit=crop&q=80',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 5,
    title: 'Classical Piano Serenade',
    artist: 'Frederic V.',
    genre: 'Classical',
    duration_seconds: 275,
    file_path: 'songs/classical_piano.mp3',
    album_art_url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&auto=format&fit=crop&q=80',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 6,
    title: 'Sunset Groove House',
    artist: 'DJ Horizon',
    genre: 'Deep House',
    duration_seconds: 205,
    file_path: 'songs/sunset_groove.mp3',
    album_art_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  }
];

export const MOCK_METRICS: AnalyticsMetricsResponse = {
  history: [
    { timestamp: '10:00 AM', accuracy: 0.60, precision: 0.55, recall: 0.50 },
    { timestamp: '11:00 AM', accuracy: 0.68, precision: 0.65, recall: 0.60 },
    { timestamp: '12:00 PM', accuracy: 0.74, precision: 0.70, recall: 0.68 },
    { timestamp: '01:00 PM', accuracy: 0.81, precision: 0.78, recall: 0.75 },
    { timestamp: '02:00 PM', accuracy: 0.86, precision: 0.84, recall: 0.82 }
  ],
  latest_confusion_matrix: {
    tp: 18,
    fp: 3,
    fn: 2,
    tn: 11
  }
};
