import React, { useState } from 'react';
import type { Song } from '../types';
import { Search, Music, Play } from 'lucide-react';

interface SongCatalogProps {
  songs: Song[];
  currentSongId?: number;
  onSelectSong: (song: Song) => void;
}

export const SongCatalog: React.FC<SongCatalogProps> = ({
  songs,
  currentSongId,
  onSelectSong
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Music size={20} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Music Catalog</h2>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{songs.length} Tracks</span>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, artist, or genre..."
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-glass)',
            color: '#ffffff',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {/* Songs Grid List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
        {filteredSongs.map((song) => {
          const isSelected = song.id === currentSongId;
          return (
            <div
              key={song.id}
              onClick={() => onSelectSong(song)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={song.album_art_url}
                  alt={song.title}
                  style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? 'var(--accent-indigo)' : 'var(--text-primary)' }}>
                    {song.title}
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {song.artist} • <span style={{ color: 'var(--accent-cyan)' }}>{song.genre}</span>
                  </p>
                </div>
              </div>

              <button
                style={{
                  background: isSelected ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Play size={14} fill="#ffffff" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
