import { useState, useEffect } from 'react';
import type { User, Song, RecommendationResponse, AnalyticsMetricsResponse, InteractionSource } from './types';
import { songService, recommendationService, analyticsService } from './services/api';
import { MOCK_SONGS } from './data/mockData';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { MusicPlayer } from './components/MusicPlayer';
import { RecommendationsList } from './components/RecommendationsList';
import { SongCatalog } from './components/SongCatalog';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

export function App() {
  // Initialize user from localStorage if previously authenticated, otherwise start as null
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aura_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'player' | 'analytics'>('player');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(() => !localStorage.getItem('aura_current_user'));

  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [currentSong, setCurrentSong] = useState<Song | null>(MOCK_SONGS[0]);
  const [playbackSource, setPlaybackSource] = useState<InteractionSource>('search');
  const [recommendationId, setRecommendationId] = useState<number | null>(null);

  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetricsResponse | null>(null);

  // Load songs on startup
  useEffect(() => {
    const fetchSongs = async () => {
      const data = await songService.getSongs();
      setSongs(data);
      if (data.length > 0 && !currentSong) {
        setCurrentSong(data[0]);
      }
    };
    fetchSongs();
  }, []);

  // Load recommendations & analytics metrics whenever current user changes
  useEffect(() => {
    if (currentUser) {
      loadRecommendations(currentUser.id);
      loadMetrics();
    }
  }, [currentUser]);

  const loadRecommendations = async (userId?: number) => {
    const idToFetch = userId ?? currentUser?.id;
    if (!idToFetch) return;
    const recData = await recommendationService.getRecommendations(idToFetch);
    setRecommendations(recData);
  };

  const loadMetrics = async () => {
    const metricsData = await analyticsService.getMetrics();
    setMetrics(metricsData);
  };

  const handleLoginSuccess = (user: User) => {
    console.log('App received authenticated user:', user);
    setCurrentUser(user);
    localStorage.setItem('aura_current_user', JSON.stringify(user));
    loadRecommendations(user.id);
  };

  const handleSwitchUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('aura_current_user');
    setIsLoginOpen(true);
  };

  const handleNextTrack = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
  };

  const handleSelectCatalogSong = (song: Song) => {
    setPlaybackSource('search');
    setRecommendationId(null);
    setCurrentSong(song);
  };

  const handleSelectRecommendedSong = (song: Song, recId: number) => {
    setPlaybackSource('recommendation');
    setRecommendationId(recId);
    setCurrentSong(song);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          // If no user is authenticated, keep modal open or fallback
          if (currentUser) {
            setIsLoginOpen(false);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {activeTab === 'player' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', alignItems: 'start' }}>
          {/* Left Column: Song Catalog Browser */}
          <div style={{ gridColumn: 'span 4' }}>
            <SongCatalog
              songs={songs}
              currentSongId={currentSong?.id}
              onSelectSong={handleSelectCatalogSong}
            />
          </div>

          {/* Center Column: Active Music Player */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <MusicPlayer
              currentSong={currentSong}
              currentUser={currentUser}
              source={playbackSource}
              recommendationId={recommendationId}
              onNextTrack={handleNextTrack}
              onPrevTrack={handlePrevTrack}
            />

            {/* Smart Recommendations Feed */}
            <RecommendationsList
              recommendationData={recommendations}
              currentUser={currentUser}
              onSelectRecommendedSong={handleSelectRecommendedSong}
              onRefreshRecommendations={() => currentUser && loadRecommendations(currentUser.id)}
            />
          </div>
        </div>
      ) : (
        <AnalyticsDashboard
          metrics={metrics}
          onRefresh={loadMetrics}
        />
      )}
    </div>
  );
}

export default App;
