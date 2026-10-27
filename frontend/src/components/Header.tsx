import React from 'react';
import { Compass, BookOpen, Share2, HelpCircle, Heart } from 'lucide-react';

export type AppView = 'game' | 'catalog' | 'global-graph' | 'credits';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenIntegrationGuide: () => void;
  totalScore: number;
  completedCount: number;
  playableCount: number;
}

/** The Origlyph mark: a meridian circle with a glyph notch, drawn in brass. */
export const BrandMark: React.FC<{ size?: number }> = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="brand-mark">
    <defs>
      <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f0d99a" />
        <stop offset="1" stopColor="#9b7f3f" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="17.5" fill="none" stroke="url(#brass)" strokeWidth="1.4" />
    <ellipse cx="20" cy="20" rx="7.5" ry="17.5" fill="none" stroke="url(#brass)" strokeWidth="0.9" opacity="0.7" />
    <path d="M2.5 20h35M5 11.5h30M5 28.5h30" stroke="url(#brass)" strokeWidth="0.7" opacity="0.5" />
    <circle cx="20" cy="20" r="4.2" fill="url(#brass)" />
    <path d="M20 2.5 L22.2 9 H17.8 Z" fill="url(#brass)" />
  </svg>
);

const NAV: Array<{ view: AppView; label: string; numeral: string; icon: React.ReactNode }> = [
  { view: 'game', label: 'Challenge', numeral: 'I', icon: <Compass size={15} /> },
  { view: 'catalog', label: 'Archive', numeral: 'II', icon: <BookOpen size={15} /> },
  { view: 'global-graph', label: 'Provenance', numeral: 'III', icon: <Share2 size={15} /> },
  { view: 'credits', label: 'Colophon', numeral: 'IV', icon: <Heart size={15} /> },
];

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenIntegrationGuide,
  totalScore,
  completedCount,
  playableCount,
}) => {
  return (
    <header className="site-header">
      <a
        href="#"
        className="brand"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('game');
        }}
        aria-label="Origlyph home"
      >
        <BrandMark />
        <span className="brand-text">
          <span className="brand-title">Origlyph</span>
          <span className="brand-tagline">Decode the places behind culture</span>
        </span>
      </a>

      <nav className="header-nav" aria-label="Main Navigation">
        {NAV.map((item) => (
          <button
            key={item.view}
            className={`nav-tab ${currentView === item.view ? 'active' : ''}`}
            onClick={() => onNavigate(item.view)}
            aria-current={currentView === item.view ? 'page' : undefined}
          >
            <span className="nav-numeral">{item.numeral}</span>
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="header-end">
        <button
          className="icon-btn"
          onClick={onOpenIntegrationGuide}
          title="Architecture & Partner Integration Guide"
          aria-label="Open architecture and integration guide"
        >
          <HelpCircle size={17} />
        </button>

        <div className="ledger" title="Total session score">
          <div className="ledger-score">
            {totalScore.toLocaleString()}
            <span className="ledger-unit">pts</span>
          </div>
          <div className="ledger-pips" aria-label={`${completedCount} of ${playableCount} artifacts decoded`}>
            {Array.from({ length: Math.max(playableCount, 1) }).map((_, i) => (
              <span key={i} className={`pip ${i < completedCount ? 'on' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
