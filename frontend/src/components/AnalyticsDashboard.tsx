import React from 'react';
import type { AnalyticsMetricsResponse } from '../types';
import { Activity, Award, TrendingUp, RefreshCw } from 'lucide-react';

interface AnalyticsDashboardProps {
  metrics: AnalyticsMetricsResponse | null;
  onRefresh: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics,
  onRefresh
}) => {
  if (!metrics) return null;

  const { latest_confusion_matrix: cm, history } = metrics;

  // Calculate Accuracy, Precision, Recall from Confusion Matrix
  const total = cm.tp + cm.fp + cm.tn + cm.fn || 1;
  const accuracy = ((cm.tp + cm.tn) / total * 100).toFixed(1);
  const precision = (cm.tp / (cm.tp + cm.fp || 1) * 100).toFixed(1);
  const recall = (cm.tp / (cm.tp + cm.fn || 1) * 100).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Metrics Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity color="var(--accent-indigo)" /> Recommender System Intelligence & Feedback Loop
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Evaluation metrics computed from closed user feedback loops (Task 3).
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <RefreshCw size={14} /> Recalculate Metrics
        </button>
      </div>

      {/* Metric Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel glow-indigo" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
            <span>MODEL ACCURACY</span>
            <Award size={18} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--accent-indigo)' }}>
            {accuracy}%
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Overall correct predictions (TP + TN) / Total
          </p>
        </div>

        <div className="glass-panel glow-cyan" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
            <span>PRECISION</span>
            <TrendingUp size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--accent-cyan)' }}>
            {precision}%
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Liked tracks out of all recommended (TP / TP + FP)
          </p>
        </div>

        <div className="glass-panel glow-emerald" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
            <span>RECALL RATE</span>
            <Activity size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--accent-emerald)' }}>
            {recall}%
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Relevant tracks captured by kNN (TP / TP + FN)
          </p>
        </div>
      </div>

      {/* Grid Split: Confusion Matrix & Accuracy Evolution Graph */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Confusion Matrix Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-indigo)" /> Confusion Matrix (Ma trận nhầm lẫn)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* TP */}
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                True Positive (TP)
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>{cm.tp}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Predicted Like & User Liked</div>
            </div>

            {/* FP */}
            <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-rose)', textTransform: 'uppercase' }}>
                False Positive (FP)
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>{cm.fp}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Predicted Like & User Skipped</div>
            </div>

            {/* FN */}
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
                False Negative (FN)
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>{cm.fn}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Missed Guesses</div>
            </div>

            {/* TN */}
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
                True Negative (TN)
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>{cm.tn}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Explore Noise Rejected</div>
            </div>
          </div>
        </div>

        {/* Accuracy Trajectory Curve */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--accent-cyan)" /> Accuracy Trajectory Over Time
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Visualizes system evolution as feedback loop updates kNN weights.
          </p>

          {/* SVG Line Chart */}
          <div style={{ flex: 1, minHeight: '180px', width: '100%', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradAcc" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

              {/* Area & Line */}
              {history.length > 1 && (() => {
                const points = history.map((pt, i) => {
                  const x = (i / (history.length - 1)) * 380 + 10;
                  const y = 140 - pt.accuracy * 120;
                  return `${x},${y}`;
                });
                const pathStr = `M ${points.join(' L ')}`;
                const areaStr = `${pathStr} L 390,150 L 10,150 Z`;

                return (
                  <>
                    <path d={areaStr} fill="url(#gradAcc)" />
                    <path d={pathStr} fill="none" stroke="#6366F1" strokeWidth="3" />
                    {history.map((pt, i) => {
                      const x = (i / (history.length - 1)) * 380 + 10;
                      const y = 140 - pt.accuracy * 120;
                      return (
                        <circle key={i} cx={x} cy={y} r="5" fill="#06B6D4" stroke="#ffffff" strokeWidth="2" />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Time Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {history.map((h, idx) => (
              <span key={idx}>{h.timestamp}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
