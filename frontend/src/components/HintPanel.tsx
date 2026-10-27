import React from 'react';
import { AlertTriangle, Lock, Check } from 'lucide-react';
import { HintResponse } from '../types';

interface HintPanelProps {
  unlockedHints: HintResponse[];
  onUnlockHint: (level: number) => void;
  isLoading: boolean;
  disabled: boolean;
}

const TIERS = [
  { level: 1, numeral: 'I', name: 'Era & Context', penalty: 500 },
  { level: 2, numeral: 'II', name: 'Topography', penalty: 1200 },
  { level: 3, numeral: 'III', name: 'Archival Record', penalty: 2200 },
];

export const HintPanel: React.FC<HintPanelProps> = ({
  unlockedHints,
  onUnlockHint,
  isLoading,
  disabled,
}) => {
  const currentLevel = unlockedHints.length;

  return (
    <section className="hints" aria-label="Progressive Hints">
      <div className="section-head">
        <h2 className="section-title">Evidence-backed clues</h2>
        <span className="section-meta">{currentLevel} of 3 broken</span>
      </div>

      <div className="seals" role="group" aria-label="Hint tiers">
        {TIERS.map((tier) => {
          const unlocked = currentLevel >= tier.level;
          const next = currentLevel === tier.level - 1;
          const isDisabled = disabled || isLoading || unlocked || !next;
          return (
            <button
              key={tier.level}
              className={`seal ${unlocked ? 'unlocked' : ''} ${next && !disabled ? 'next' : ''}`}
              onClick={() => onUnlockHint(tier.level)}
              disabled={isDisabled}
              aria-label={`Tier ${tier.level}: ${tier.name}, minus ${tier.penalty} points${unlocked ? ', unlocked' : ''}`}
            >
              <span className="seal-disc" aria-hidden="true">
                {unlocked ? <Check size={16} /> : <span className="seal-numeral">{tier.numeral}</span>}
                {!unlocked && !next && <Lock size={10} className="seal-lock" />}
              </span>
              <span className="seal-name">{tier.name}</span>
              <span className="seal-cost">−{tier.penalty.toLocaleString()} pts</span>
            </button>
          );
        })}
      </div>

      {unlockedHints.length > 0 ? (
        <div className="notes">
          {unlockedHints.map((hint) => (
            <div key={hint.hint_level} className="note">
              <div className="note-meta">
                <span>Tier {hint.hint_level} · archival extraction</span>
                <span>−{hint.score_penalty.toLocaleString()} pts</span>
              </div>
              <p>{hint.hint_text}</p>
              {hint.caveat_or_uncertainty && (
                <div className="note-caveat">
                  <AlertTriangle size={12} />
                  {hint.caveat_or_uncertainty}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="hints-empty">
          Break a seal to read a clue drawn only from verified archival facts. Each one costs points, and they open in
          order.
        </p>
      )}
    </section>
  );
};
