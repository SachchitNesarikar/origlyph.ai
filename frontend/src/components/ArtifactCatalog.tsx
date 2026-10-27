import React, { useMemo, useState } from 'react';
import { ShieldCheck, AlertCircle, Eye } from 'lucide-react';
import { ArtifactChallengeView } from '../types';
import { formatLocationBasis, getArtworkFallbackSvg, plateNumeral } from '../utils/formatters';
import { ArtifactPreview } from './ArtifactPreview';

interface ArtifactCatalogProps {
  artifacts: ArtifactChallengeView[];
  activeArtifactId: string;
  onSelectArtifact: (id: string) => void;
}

type Filter = 'all' | 'playable' | 'fixtures';

export const ArtifactCatalog: React.FC<ArtifactCatalogProps> = ({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
}) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      artifacts.filter((a) => {
        if (filter === 'playable') return a.is_playable;
        if (filter === 'fixtures') return !a.is_playable;
        return true;
      }),
    [artifacts, filter]
  );

  const previewIndex = filtered.findIndex((a) => a.id === previewId);
  const previewed = previewIndex >= 0 ? filtered[previewIndex] : null;

  const filters: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'all', label: 'All plates', count: artifacts.length },
    { key: 'playable', label: 'Playable', count: artifacts.filter((a) => a.is_playable).length },
    { key: 'fixtures', label: 'Fixtures', count: artifacts.filter((a) => !a.is_playable).length },
  ];

  return (
    <div className="page catalog-page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Plates I – {plateNumeral(Math.max(artifacts.length - 1, 0))}</div>
          <h2 className="page-title">The archive</h2>
          <p className="page-lede">
            Curated records spanning woodblock prints, monumental epigraphy, ancient sculpture and sanctuaries.
            Select a plate to preview it before you play.
          </p>
        </div>
        <div className="segmented" role="tablist" aria-label="Filter records">
          {filters.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              className={filter === f.key ? 'active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label} <span>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="catalog-grid">
        {filtered.map((artifact, idx) => {
          const isActive = artifact.id === activeArtifactId;
          const fallbackImg = getArtworkFallbackSvg(artifact.id, artifact.title);
          return (
            <div
              key={artifact.id}
              role="button"
              tabIndex={0}
              className={`tile ${isActive ? 'current' : ''} ${artifact.is_playable ? '' : 'fixture'}`}
              style={{ animationDelay: `${Math.min(idx, 10) * 45}ms` }}
              onClick={() => setPreviewId(artifact.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPreviewId(artifact.id);
                }
              }}
              aria-label={`Preview ${artifact.title}`}
            >
              <div className="tile-frame">
                <img
                  src={artifact.media_url || fallbackImg}
                  alt=""
                  className="tile-img"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImg;
                  }}
                />
                <span className="tile-plate">Plate {plateNumeral(artifacts.indexOf(artifact))}</span>
                <span className="tile-peek">
                  <Eye size={14} /> Preview
                </span>
              </div>
              <div className="tile-body">
                <div className="tile-status">
                  {artifact.is_playable ? (
                    <span className="status ok">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  ) : (
                    <span className="status warn">
                      <AlertCircle size={12} /> Fixture
                    </span>
                  )}
                  <span className="tile-source">{artifact.source_name}</span>
                </div>
                <h3 className="tile-title">{artifact.title}</h3>
                {artifact.creator && (
                  <div className="tile-creator">
                    {artifact.creator}
                    {artifact.date_created ? ` · ${artifact.date_created}` : ''}
                  </div>
                )}
                <div className="tile-foot">
                  <span>{formatLocationBasis(artifact.location_basis)}</span>
                  <span>{artifact.verified_fact_count} facts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewed && (
        <ArtifactPreview
          artifact={previewed}
          plateLabel={`Plate ${plateNumeral(artifacts.findIndex((a) => a.id === previewed.id))} of ${plateNumeral(artifacts.length - 1)}`}
          hasPrev={previewIndex > 0}
          hasNext={previewIndex < filtered.length - 1}
          onPrev={() => setPreviewId(filtered[previewIndex - 1].id)}
          onNext={() => setPreviewId(filtered[previewIndex + 1].id)}
          onClose={() => setPreviewId(null)}
          onPlay={(id) => {
            setPreviewId(null);
            onSelectArtifact(id);
          }}
        />
      )}
    </div>
  );
};
