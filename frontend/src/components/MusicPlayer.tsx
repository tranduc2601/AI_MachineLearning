import React, { useState, useRef, useEffect } from 'react';
import type { Song, User, InteractionEventType, InteractionSource } from '../types';
import { telemetryService, getSessionId } from '../services/api';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

interface MusicPlayerProps {
  currentSong: Song | null;
  currentUser: User | null;
  source?: InteractionSource;
  recommendationId?: number | null;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentSong,
  currentUser,
  source = 'search',
  recommendationId = null,
  onNextTrack,
  onPrevTrack
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  // Reset states on song change
  useEffect(() => {
    setLiked(false);
    setDisliked(false);
    setCurrentTime(0);

    if (currentSong && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        emitTelemetry('start', 0);
      }).catch(err => {
        console.warn('Autoplay prevented or audio load failed:', err);
        setIsPlaying(false);
      });
    }
  }, [currentSong]);

  const emitTelemetry = (eventType: InteractionEventType, positionSeconds?: number) => {
    if (!currentSong || !currentUser) return;
    const pos = positionSeconds ?? Math.floor(audioRef.current?.currentTime || 0);

    telemetryService.logEvent({
      user_id: currentUser.id,
      song_id: currentSong.id,
      session_id: getSessionId(),
      event_type: eventType,
      playback_position_seconds: pos,
      source: source,
      recommendation_id: recommendationId
    });
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      emitTelemetry('pause');
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        emitTelemetry('start');
      });
    }
  };

  const handleSkipNext = () => {
    emitTelemetry('skip');
    onNextTrack();
  };

  const handleSkipPrev = () => {
    emitTelemetry('skip');
    onPrevTrack();
  };

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    if (newLiked) {
      setDisliked(false);
      emitTelemetry('like');
    }
  };

  const handleDislike = () => {
    const newDisliked = !disliked;
    setDisliked(newDisliked);
    if (newDisliked) {
      setLiked(false);
      emitTelemetry('dislike');
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || currentSong?.duration_seconds || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    emitTelemetry('complete');
    onNextTrack();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      <audio
        ref={audioRef}
        src={currentSong?.audio_url || ''}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Track Art & Metadata */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', width: '96px', height: '96px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {currentSong?.album_art_url ? (
            <img src={currentSong.album_art_url} alt={currentSong.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366F1, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={36} color="#ffffff" />
            </div>
          )}
          {isPlaying && (
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 6px', borderRadius: '6px' }}>
              <div className="sound-wave">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong ? currentSong.title : 'No Track Selected'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {currentSong ? currentSong.artist : 'Select a track to play'}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {currentSong && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.12)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                {currentSong.genre}
              </span>
            )}
            {source === 'recommendation' && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                Source: Recommendation #{recommendationId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          disabled={!currentSong}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Audio Playback Controls & Feedback */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Like / Dislike Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleLike}
            disabled={!currentSong}
            className={`btn-icon ${liked ? 'active-like' : ''}`}
            title="Like track (Positive Feedback)"
          >
            <ThumbsUp size={18} />
          </button>
          <button
            onClick={handleDislike}
            disabled={!currentSong}
            className={`btn-icon ${disliked ? 'active-dislike' : ''}`}
            title="Dislike track (Negative Feedback)"
          >
            <ThumbsDown size={18} />
          </button>
        </div>

        {/* Play / Skip Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleSkipPrev} disabled={!currentSong} className="btn-icon" title="Previous Track">
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentSong}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
              transition: 'all 0.2s ease'
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '2px' }} />}
          </button>

          <button onClick={handleSkipNext} disabled={!currentSong} className="btn-icon" title="Skip Next Track">
            <SkipForward size={20} />
          </button>
        </div>

        {/* Volume Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
          <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};
