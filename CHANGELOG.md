## 2.1.0 — The Cartographer's Gallery

- Redesigned interface: framed artifact plates with museum labels, wax-seal hint tiers, sepia atlas map with cartouche and compass rose, parchment catalogue-card reveal with animated score seal.
- New archive preview drawer (browse records with prev/next before playing).
- New Colophon page crediting 102 open-source projects (`frontend/src/data/credits.json`, `CREDITS.md`), grouped by how they relate to Origlyph; `scripts/check_credits.py` verifies links.
- Fixed: map clicks still moved the pin after the answer was revealed (stale closure).
- Fixed: Provenance tab was blank until a round was played; it now loads on demand.
- Fixed: fallback artwork showed URL-encoded titles; added per-culture motifs.
- Replaced `alert()` with a toast; added Esc-to-close, focus rings, reduced-motion support.

# Changelog

## v2.0.0

### Fixes
- **Answer leak closed**: `GET /api/artifacts/{id}?reveal=true` returned the full record, including coordinates, before any guess. It now always returns the player view; answers come only from `POST /guess`.
- **Scoring rebalanced**: decay scale 200 km -> 1500 km. Under v1 a guess in the right continent scored ~2 pts despite being rated "Continental Navigator". Rating bands widened to match (50 / 250 / 750 / 2000 km).
- **Unknown `/api/*` paths** returned `null` with HTTP 200 via the SPA catch-all; now a real 404. Static serving also blocks path traversal outside `dist/`.
- CORS: removed `allow_credentials=True` (invalid with a wildcard origin; no cookies are used).
- Version is read from one place (`settings.VERSION`) instead of three hard-coded strings.

### Performance
- Challenge views and the source manifest are built once at load; the global provenance graph is cached.
- GZip middleware; hashed `/assets/*` served with `Cache-Control: immutable`, `index.html` with `no-cache`.
- Vite: production sourcemaps off (~1.1 MB less), React and Leaflet split into their own chunks.

### Tests
- Added HTTP-level tests (leak, 404, round trip) and a scoring regression test.

### Known limitations (unchanged)
- `hints_used` is client-supplied; `/hint` and `/relations` are not session-gated (relations list place names). A server-side round token is the next step.
