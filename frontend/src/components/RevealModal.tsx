import React, { useState } from 'react';
import { Share2, ArrowRight, X, MapPin, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { GuessResponse } from '../types';
import { formatDistance, formatScore } from '../utils/formatters';
import { useEscape } from '../hooks/useEscape';
import { useCountUp } from '../hooks/useCountUp';
import { api } from '../services/api';

interface RevealModalProps {
  reveal: GuessResponse;
  onNextChallenge: () => void;
  onOpenProvenance: () => void;
  onClose: () => void;
}

const ROMAN = ['I', 'II', 'III', 'IV'];

export const RevealModal: React.FC<RevealModalProps> = ({
  reveal,
  onNextChallenge,
  onOpenProvenance,
  onClose,
}) => {
  const { artifact } = reveal;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);
  const [narrationError, setNarrationError] = useState<string | null>(null);
  useEscape(onClose);
  const shown = useCountUp(reveal.final_score);
  const fill = Math.max(0, Math.min(1, reveal.final_score / reveal.max_score));
  const R = 62;
  const C = 2 * Math.PI * R;

  const handleNarrate = async () => {
    try {
      setIsNarrating(true);
      setNarrationError(null);
      const blob = await api.narrateArtifact(artifact.id);
      const nextUrl = URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      const audio = new Audio(nextUrl);
      audio.play();
    } catch (error: any) {
      setNarrationError(error.message || 'Narration is unavailable.');
    } finally {
      setIsNarrating(false);
    }
  };

  const locations = [
    { tag: 'Creation / workshop', value: artifact.creation_location || 'Not explicitly recorded in archives' },
    { tag: 'Depicted subject', value: artifact.depicted_location || 'Non-representational or allegorical' },
    { tag: 'Archaeological discovery', value: artifact.discovery_location || 'Continuous custody, no excavation record' },
    { tag: 'Holding collection', value: artifact.current_collection || artifact.source_name },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Round result">
      <div className="modal-card catalogue-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn paper" onClick={onClose} aria-label="Close result">
          <X size={18} />
        </button>

        <header className="cc-head">
          <div className="cc-kicker">Round decoded · {reveal.accuracy_rating}</div>
          <h2 className="cc-title">{artifact.title}</h2>
          {artifact.creator && <div className="cc-creator">{artifact.creator}</div>}
        </header>

        <div className="cc-body">
          {/* Score seal */}
          <div className="cc-score">
            <div className="seal-ring">
              <svg viewBox="0 0 140 140" aria-hidden="true">
                <circle cx="70" cy="70" r={R} className="ring-track" />
                <circle
                  cx="70"
                  cy="70"
                  r={R}
                  className="ring-fill"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - fill)}
                  transform="rotate(-90 70 70)"
                />
              </svg>
              <div className="seal-ring-text">
                <div className="seal-ring-num">{formatScore(shown)}</div>
                <div className="seal-ring-max">of {formatScore(reveal.max_score)}</div>
              </div>
            </div>

            <dl className="score-ledger">
              <div>
                <dt>Deviation</dt>
                <dd>{formatDistance(reveal.distance_km)}</dd>
              </div>
              <div>
                <dt>Base score</dt>
                <dd>{formatScore(reveal.base_score)}</dd>
              </div>
              <div>
                <dt>Hint cost</dt>
                <dd className={reveal.hint_penalty > 0 ? 'neg' : ''}>
                  {reveal.hint_penalty > 0 ? `−${formatScore(reveal.hint_penalty)}` : 'None'}
                </dd>
              </div>
            </dl>

            <div className="narration-row">
              <button className="ghost-btn paper" onClick={handleNarrate} disabled={isNarrating}>
                {isNarrating ? <VolumeX size={16} /> : <Volume2 size={16} />}
                {isNarrating ? 'Narrating…' : 'Listen'}
              </button>
              {audioUrl && (
                <audio controls src={audioUrl} className="narration-player" />
              )}
            </div>
            {narrationError && <div className="narration-error">{narrationError}</div>}
          </div>

          {/* Fourfold distinction */}
          <section>
            <h3 className="cc-h">
              <MapPin size={15} /> Four places, four answers
            </h3>
            <div className="fourfold">
              {locations.map((loc, i) => (
                <div key={loc.tag} className="fourfold-item">
                  <span className="fourfold-num">{ROMAN[i]}</span>
                  <div>
                    <div className="fourfold-tag">{loc.tag}</div>
                    <div className="fourfold-val">{loc.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Evidence */}
          <section>
            <h3 className="cc-h">
              <ShieldCheck size={15} /> Verified curatorial evidence
            </h3>
            <ol className="evidence">
              {artifact.verified_facts.map((fact) => (
                <li key={fact.id}>
                  <p>{fact.fact_text}</p>
                  <cite>{fact.source_citation}</cite>
                </li>
              ))}
            </ol>
          </section>

          {artifact.relations.length > 0 && (
            <section>
              <h3 className="cc-h">
                <Share2 size={15} /> Provenance connections · {artifact.relations.length}
              </h3>
              <div className="chips">
                {artifact.relations.map((rel, idx) => (
                  <span key={idx} className="chip" title={rel.notes || rel.relation_type}>
                    <em>{rel.relation_type}</em> {rel.target_name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="cc-actions">
          <button className="ghost-btn paper" onClick={onOpenProvenance}>
            <Share2 size={16} />
            Explore provenance
          </button>
          <button className="seal-btn" onClick={onNextChallenge}>
            Next artifact
            <ArrowRight size={17} />
          </button>
        </footer>
      </div>
    </div>
  );
};
