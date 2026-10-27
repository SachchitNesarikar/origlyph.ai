import React, { useState } from 'react';
import {
  HelpCircle,
  Database,
  Cpu,
  Archive,
  Cloud,
  Headphones,
  CheckCircle2,
  Code,
  AlertTriangle,
} from 'lucide-react';

interface IntegrationGuideModalProps {
  onClose: () => void;
}

export const IntegrationGuideModal: React.FC<IntegrationGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'gemma' | 'internet-archive' | 'mongodb' | 'render'>('architecture');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="stat-pill" style={{ display: 'inline-block', marginBottom: '0.4rem' }}>
              System Documentation
            </div>
            <h2 className="font-serif" style={{ fontSize: '1.4rem' }}>
              Origlyph Integration Boundary & Architecture Guide
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--bg-surface-border)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
            <button
              className={`nav-link-btn ${activeTab === 'architecture' ? 'active' : ''}`}
              onClick={() => setActiveTab('architecture')}
            >
              <Cpu size={14} /> Overview
            </button>
            <button
              className={`nav-link-btn ${activeTab === 'gemma' ? 'active' : ''}`}
              onClick={() => setActiveTab('gemma')}
            >
              <Cpu size={14} /> Gemma AI
            </button>
            <button
              className={`nav-link-btn ${activeTab === 'internet-archive' ? 'active' : ''}`}
              onClick={() => setActiveTab('internet-archive')}
            >
              <Archive size={14} /> Internet Archive
            </button>
            <button
              className={`nav-link-btn ${activeTab === 'mongodb' ? 'active' : ''}`}
              onClick={() => setActiveTab('mongodb')}
            >
              <Database size={14} /> MongoDB Atlas
            </button>
            <button
              className={`nav-link-btn ${activeTab === 'render' ? 'active' : ''}`}
              onClick={() => setActiveTab('render')}
            >
              <Cloud size={14} /> Render Hosting
            </button>
          </div>

          {/* Tab 1: System Overview */}
          {activeTab === 'architecture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <p>
                Origlyph is built with a strictly decoupled full-stack architecture. The baseline runs deterministically out of the box with zero required external API keys or cloud runtime dependencies.
              </p>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-surface-border)' }}>
                <div style={{ color: 'var(--accent-sage-bright)', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Core Invariants:
                </div>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <li><strong>Evidence Grounding:</strong> No AI model or hallucinated claim may invent locations, dates, or provenance connections.</li>
                  <li><strong>Answer Isolation:</strong> Hidden answer coordinates are withheld during challenge mode and only returned upon guess submission.</li>
                  <li><strong>Missing Data Integrity:</strong> Missing or uncertain coordinates never silently fall back to (0, 0); unverified records are excluded from scoring.</li>
                  <li><strong>Deterministic Fallback:</strong> If any external AI service or database is unavailable, local deterministic records ensure 100% playable uptime.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 2: Gemma Integration */}
          {activeTab === 'gemma' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem' }}>Gemma Grounded Hint Adapter Boundary</h4>
                <p>
                  Located at <code style={{ color: 'var(--accent-sage)' }}>backend/app/services/hint_engine.py</code>. The adapter interface defines:
                </p>
              </div>

              <pre style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '4px', border: '1px solid var(--bg-surface-border)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#abb8b0', overflowX: 'auto' }}>
{`generate_hint(
    artifact: Artifact,
    verified_facts: List[VerifiedFact],
    hint_level: int
) -> HintResponse`}
              </pre>

              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '4px' }}>
                <strong style={{ color: 'var(--text-main)' }}>Configuration Steps for Gemma:</strong>
                <ol style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li>Set <code style={{ color: 'var(--accent-sage)' }}>GEMMA_PROVIDER=gemma_vertex</code> or <code style={{ color: 'var(--accent-sage)' }}>gemma_ollama</code> in <code style={{ color: 'var(--accent-sage)' }}>.env</code>.</li>
                  <li>Specify the model name (e.g. <code style={{ color: 'var(--accent-sage)' }}>gemma-2-9b-it</code>).</li>
                  <li>Prompt context must pass only the curatorial record's <code style={{ color: 'var(--accent-sage)' }}>verified_facts</code>. Coordinates are filtered out before prompting.</li>
                  <li>In case of network error or rate limit, the adapter seamlessly executes the built-in deterministic fallback without interrupting gameplay.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 3: Internet Archive */}
          {activeTab === 'internet-archive' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <h4 style={{ color: 'var(--text-main)' }}>Internet Archive Ingestion Pipeline</h4>
              <p>
                Ingestion is decoupled from gameplay requests to guarantee low player latency and offline reliability.
              </p>
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '4px' }}>
                <strong style={{ color: 'var(--text-main)' }}>Planned Batch Ingestion Flow:</strong>
                <ol style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li><strong>Search:</strong> Query <code style={{ color: 'var(--accent-sage)' }}>https://archive.org/advancedsearch.php</code> for items with verified geographic subject tags.</li>
                  <li><strong>Metadata Fetch:</strong> Retrieve item metadata JSON via <code style={{ color: 'var(--accent-sage)' }}>https://archive.org/metadata/{'{identifier}'}</code>.</li>
                  <li><strong>Normalization:</strong> Map Dublin Core spatial tags into ISO decimal coordinates and assign explicit location confidence (<code style={{ color: 'var(--accent-sage)' }}>verified</code> vs <code style={{ color: 'var(--accent-sage)' }}>approximate</code>).</li>
                  <li><strong>Rights Preservation:</strong> Retain canonical archive URL, rights statement, and collection donor credit lines.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 4: MongoDB Atlas */}
          {activeTab === 'mongodb' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <h4 style={{ color: 'var(--text-main)' }}>MongoDB Atlas Persistence Boundary</h4>
              <p>
                Local session state powers the baseline. For persistent multi-player history and full catalog storage:
              </p>
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '4px' }}>
                <strong style={{ color: 'var(--text-main)' }}>Planned Collections:</strong>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li><code style={{ color: 'var(--accent-sage)' }}>artifacts</code>: Document storage with 2dsphere geospatial index on coordinates.</li>
                  <li><code style={{ color: 'var(--accent-sage)' }}>provenance_edges</code>: Graph relationship storage for multi-hop graph queries (<code style={{ color: 'var(--accent-sage)' }}>$graphLookup</code>).</li>
                  <li><code style={{ color: 'var(--accent-sage)' }}>player_guesses</code>: Historical distance, hint penalties, and accuracy benchmarks.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 5: Render Hosting */}
          {activeTab === 'render' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <h4 style={{ color: 'var(--text-main)' }}>Render Deployment Setup</h4>
              <p>
                Origlyph supports unified single-service deployment on Render or split frontend/backend services:
              </p>
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '4px' }}>
                <strong style={{ color: 'var(--text-main)' }}>Unified Web Service (Recommended):</strong>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li><strong>Build Command:</strong> <code style={{ color: 'var(--accent-sage)' }}>cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt</code></li>
                  <li><strong>Start Command:</strong> <code style={{ color: 'var(--accent-sage)' }}>cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT</code></li>
                  <li>FastAPI automatically serves the built Vite assets from <code style={{ color: 'var(--accent-sage)' }}>frontend/dist</code>.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
