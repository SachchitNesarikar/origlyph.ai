import React, { useEffect, useState } from 'react';
import { X, Compass, ChevronLeft, ChevronRight, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { ArtifactChallengeView } from '../types';
import { formatLocationBasis, getArtworkFallbackSvg } from '../utils/formatters';
import { useEscape } from '../hooks/useEscape';

interface ArtifactPreviewProps {
  artifact: ArtifactChallengeView;
  plateLabel: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onPlay: (id: string) => void;
}

/** Slide-in drawer that lets you study a record before committing to a round. */
export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({
  artifact,
  plateLabel,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  onPlay,
}) => {
  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [artifact.id]);
  useEscape(onClose);

  const src =
    !imgError && artifact.media_url ? artifact.media_url : getArtworkFallbackSvg(artifact.id, artifact.title);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of ${artifact.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-top">
          <span className="drawer-plate">{plateLabel}</span>
          <div className="drawer-nav">
            <button className="icon-btn" onClick={onPrev} disabled={!hasPrev} aria-label="Previous record">
              <ChevronLeft size={18} />
            </button>
            <button className="icon-btn" onClick={onNext} disabled={!hasNext} aria-label="Next record">
              <ChevronRight size={18} />
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Close preview">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="drawer-scroll">
          <div className="plate-frame small">
            <div className="plate-mat">
              <img src={src} alt={artifact.title} className="plate-image" onError={() => setImgError(true)} />
            </div>
            <span className="corner tl" aria-hidden="true" />
            <span className="corner tr" aria-hidden="true" />
            <span className="corner bl" aria-hidden="true" />
            <span className="corner br" aria-hidden="true" />
          </div>

          <div className="drawer-meta">
            {artifact.is_playable ? (
              <span className="status ok">
                <ShieldCheck size={13} /> Verified · playable
              </span>
            ) : (
              <span className="status warn">
                <AlertCircle size={13} /> Fixture · excluded from scoring
              </span>
            )}
            <h2 className="drawer-title">{artifact.title}</h2>
            {artifact.creator && (
              <div className="drawer-creator">
                {artifact.creator}
                {artifact.date_created ? ` · ${artifact.date_created}` : ''}
              </div>
            )}
            <p className="drawer-desc">{artifact.description}</p>

            <dl className="drawer-facts">
              <div>
                <dt>You will locate</dt>
                <dd>{formatLocationBasis(artifact.location_basis)}</dd>
              </div>
              <div>
                <dt>Verified facts</dt>
                <dd>{artifact.verified_fact_count}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{artifact.location_confidence}</dd>
              </div>
              <div>
                <dt>Rights</dt>
                <dd>{artifact.rights_statement || 'See source record'}</dd>
              </div>
            </dl>

            <a className="drawer-source" href={artifact.source_url} target="_blank" rel="noopener noreferrer">
              {artifact.source_name} <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="drawer-foot">
          <button className="seal-btn wide" disabled={!artifact.is_playable} onClick={() => onPlay(artifact.id)}>
            <Compass size={17} />
            {artifact.is_playable ? 'Begin this challenge' : 'Not available for play'}
          </button>
        </div>
      </aside>
    </div>
  );
};
