import React, { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import credits from '../data/credits.json';

type Tier = 'stack' | 'data' | 'bridge' | 'craft';

interface Credit {
  id: number;
  repo: string;
  owner: string;
  name: string;
  url: string;
  tier: Tier;
  role: string;
}

const TIERS: Array<{ key: Tier; label: string; blurb: string }> = [
  {
    key: 'stack',
    label: 'In the stack',
    blurb: 'Running in Origlyph today: the dependencies, typefaces and map data this app actually uses.',
  },
  {
    key: 'data',
    label: 'Open collections & geodata',
    blurb:
      'Open museum datasets, geocoders and map data. The seed records and the ingestion plan draw on this world; nothing here is bundled.',
  },
  {
    key: 'bridge',
    label: 'Standards & next steps',
    blurb:
      'Projects Origlyph’s boundaries are shaped to meet: IIIF, linked data, geo tooling, local models, heritage platforms. Not wired in yet.',
  },
  {
    key: 'craft',
    label: 'Craft & inspiration',
    blurb: 'Libraries and typefaces that shaped the interface and its roadmap.',
  },
];

const ALL = credits as Credit[];

export const OpenSourceAtlas: React.FC = () => {
  const [tier, setTier] = useState<Tier | 'all'>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ALL.length };
    for (const t of TIERS) c[t.key] = ALL.filter((x) => x.tier === t.key).length;
    return c;
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter(
      (c) =>
        (tier === 'all' || c.tier === tier) &&
        (!q || c.repo.toLowerCase().includes(q) || c.role.toLowerCase().includes(q))
    );
  }, [tier, query]);

  const activeTier = TIERS.find((t) => t.key === tier);

  return (
    <div className="page credits-page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Colophon</div>
          <h2 className="page-title">The open-source atlas</h2>
          <p className="page-lede">
            Origlyph stands on <strong>{ALL.length} open-source projects</strong>. Each one is credited with how it
            relates to this codebase, so you can tell what runs the app from what simply inspired it. Every project
            keeps its own licence; follow the link for terms.
          </p>
        </div>
        <label className="search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search projects or roles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search credited projects"
          />
        </label>
      </div>

      <div className="segmented wrap" role="tablist" aria-label="Filter by relationship">
        <button role="tab" aria-selected={tier === 'all'} className={tier === 'all' ? 'active' : ''} onClick={() => setTier('all')}>
          Everything <span>{counts.all}</span>
        </button>
        {TIERS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tier === t.key}
            className={tier === t.key ? 'active' : ''}
            onClick={() => setTier(t.key)}
          >
            {t.label} <span>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {activeTier && <p className="tier-blurb">{activeTier.blurb}</p>}

      {visible.length === 0 ? (
        <p className="empty">No credited project matches “{query}”.</p>
      ) : (
        <div className="credit-grid">
          {visible.map((c) => (
            <a
              key={c.id}
              className={`credit credit-${c.tier}`}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="credit-top">
                <span className="credit-no">№ {String(c.id).padStart(3, '0')}</span>
                <span className={`tier-tag tier-${c.tier}`}>{TIERS.find((t) => t.key === c.tier)?.label}</span>
              </div>
              <div className="credit-name">{c.name}</div>
              <div className="credit-owner">{c.owner}</div>
              <p className="credit-role">{c.role}</p>
              <ExternalLink size={13} className="credit-go" aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
