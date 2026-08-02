import React from 'react';
import type { User } from '../types';
import { Music, User as UserIcon, Activity, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  activeTab: 'player' | 'analytics';
  setActiveTab: (tab: 'player' | 'analytics') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="glass-panel" style={{ padding: '16px 28px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
        }}>
          <Music size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #F8FAFC, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AuraPlayer
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={10} color="#10B981" /> Smart Recommender System
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        <button
          onClick={() => setActiveTab('player')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'player' ? 'var(--accent-indigo)' : 'transparent',
            color: activeTab === 'player' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Music size={14} /> Player & Recommendations
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'analytics' ? 'var(--accent-indigo)' : 'transparent',
            color: activeTab === 'analytics' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Activity size={14} /> Recommender Analytics
        </button>
      </div>

      {/* User Login Identification */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenLogin}
          className="glass-panel"
          style={{
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          <UserIcon size={16} color="var(--accent-cyan)" />
          {currentUser ? (
            <span>{currentUser.username} <span style={{ opacity: 0.6, fontSize: '11px' }}>(ID: {currentUser.id})</span></span>
          ) : (
            <span>Login User</span>
          )}
        </button>
      </div>
    </header>
  );
};
