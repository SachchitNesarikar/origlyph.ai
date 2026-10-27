import React, { useEffect, useState } from 'react';
import { ExternalLink, Maximize2, ShieldCheck, Compass, X } from 'lucide-react';
import { ArtifactChallengeView } from '../types';
import { formatLocationBasis, getArtworkFallbackSvg } from '../utils/formatters';
import { useEscape } from '../hooks/useEscape';

interface ArtifactViewerProps {
  artifact: ArtifactChallengeView;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact }) => {
  const [imgError, setImgError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // A new artifact gets a fresh chance to load its museum image.
  useEffect(() => {
    setImgError(false);
  }, [artifact.id]);

  useEscape(() => setIsZoomed(false), isZoomed);

  const imageSrc =
    !imgError && artifact.media_url
      ? artifact.media_url
      : getArtworkFallbackSvg(artifact.id, artifact.title);

  const objective =
    artifact.location_basis === 'depicted'
      ? 'depicted'
      : artifact.location_basis === 'discovery'
      ? 'archaeologically discovered'
      : 'created';

  return (
    <div className="plate-stack">
      {/* The framed plate */}
      <figure className="plate">
        <div className="plate-spot" aria-hidden="true" />
        <div className="plate-frame">
          <div className="plate-mat">
            <img
              src={imageSrc}
              alt={artifact.title}
              className="plate-image"
              onError={() => setImgError(true)}
              loading="eager"
            />
          </div>
          <span className="corner tl" aria-hidden="true" />
          <span className="corner tr" aria-hidden="true" />
          <span className="corner bl" aria-hidden="true" />
          <span className="corner br" aria-hidden="true" />
        </div>

        <button className="plate-inspect" onClick={() => setIsZoomed(true)} title="Inspect high-resolution image">
          <Maximize2 size={13} />
          Inspect
        </button>
      </figure>

      {/* Brass museum label */}
      <article className="museum-label">
        <div className="label-kicker">
          <span className="kicker-id">Archival record · {artifact.id}</span>
          <span className="kicker-source">
            <ShieldCheck size={13} />
            {artifact.source_name}
          </span>
        </div>

        <h1 className="label-title">{artifact.title}</h1>

        {artifact.creator && (
          <div className="label-creator">
            {artifact.creator}
            {artifact.date_created ? <span className="label-date"> · {artifact.date_created}</span> : null}
          </div>
        )}

        <div className="label-rule" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <p className="label-desc">{artifact.description}</p>

        <div className="objective">
          <Compass size={20} className="objective-icon" />
          <div>
            <div className="objective-title">Objective · {formatLocationBasis(artifact.location_basis)}</div>
            <div className="objective-desc">
              Place your pin where this record was <em>{objective}</em>. Careful: the museum that holds it is
              not the answer.
            </div>
          </div>
        </div>

        <div className="label-source">
          Canonical record
          <a href={artifact.source_url} target="_blank" rel="noopener noreferrer">
            {artifact.source_name} <ExternalLink size={12} />
          </a>
        </div>
      </article>

      {isZoomed && (
        <div className="modal-backdrop" onClick={() => setIsZoomed(false)} role="dialog" aria-modal="true" aria-label="Image inspection">
          <div className="modal-card inspect-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="inspect-title">{artifact.title}</span>
              <button className="modal-close-btn" onClick={() => setIsZoomed(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="inspect-body">
              <img src={imageSrc} alt={artifact.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
