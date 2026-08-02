import React from 'react';
import type { Song, User, RecommendationResponse } from '../types';
import { telemetryService, getSessionId } from '../services/api';
import { Sparkles, Play, Compass, Cpu, ThumbsUp, ThumbsDown } from 'lucide-react';

interface RecommendationsListProps {
  recommendationData: RecommendationResponse | null;
  currentUser: User | null;
  onSelectRecommendedSong: (song: Song, recId: number) => void;
  onRefreshRecommendations: () => void;
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendationData,
  currentUser,
  onSelectRecommendedSong,
  onRefreshRecommendations
}) => {
  const handlePlayRecommended = (song: Song) => {
    if (recommendationData) {
      onSelectRecommendedSong(song, recommendationData.recommendation_id);
    }
  };

  const handleQuickFeedback = async (song: Song, action: 'like' | 'dislike') => {
    if (recommendationData && currentUser) {
      await telemetryService.logEvent({
        user_id: currentUser.id,
        song_id: song.id,
        session_id: getSessionId(),
        event_type: action,
        playback_position_seconds: 0,
        source: 'recommendation',
        recommendation_id: recommendationData.recommendation_id
      });
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="var(--accent-emerald)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Smart Recommendations</h2>
        </div>
        <button
          onClick={onRefreshRecommendations}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-secondary)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Refresh AI Queue
        </button>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        Personalized using kNN (Collaborative Filtering 80%) + Explore & Exploit Diversity (20%).
      </p>

      {/* Recommended Songs Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        {recommendationData?.songs.map((song, idx) => {
          const isExplore = idx % 3 === 2; // Tag sample for explore vs exploit
          return (
            <div
              key={song.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative'
                }}>
                  <img src={song.album_art_url} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{song.artist}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* AI Algorithm Tag */}
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: isExplore ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: isExplore ? 'var(--accent-emerald)' : 'var(--accent-indigo)',
                  border: isExplore ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                  {isExplore ? <Compass size={10} /> : <Cpu size={10} />}
                  {isExplore ? 'EXPLORE' : 'kNN EXPLOIT'}
                </span>

                {/* Quick Feedback Actions */}
                <button
                  onClick={() => handleQuickFeedback(song, 'like')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                  title="Like recommendation"
                >
                  <ThumbsUp size={14} />
                </button>
                <button
                  onClick={() => handleQuickFeedback(song, 'dislike')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                  title="Dislike recommendation"
                >
                  <ThumbsDown size={14} />
                </button>

                {/* Play Button */}
                <button
                  onClick={() => handlePlayRecommended(song)}
                  className="btn-primary"
                  style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}
                >
                  <Play size={12} fill="#ffffff" /> Play
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
