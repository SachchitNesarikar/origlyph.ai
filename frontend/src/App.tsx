import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import {
  ArtifactChallengeView,
  GuessResponse,
  HintResponse,
  ProvenanceGraphResponse,
} from './types';
import { Header, AppView } from './components/Header';
import { ArtifactViewer } from './components/ArtifactViewer';
import { HintPanel } from './components/HintPanel';
import { MapGuess } from './components/MapGuess';
import { RevealModal } from './components/RevealModal';
import { ProvenanceGraph } from './components/ProvenanceGraph';
import { ArtifactCatalog } from './components/ArtifactCatalog';
import { IntegrationGuideModal } from './components/IntegrationGuideModal';
import { OpenSourceAtlas } from './components/OpenSourceAtlas';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('game');
  const [artifacts, setArtifacts] = useState<ArtifactChallengeView[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactChallengeView | null>(null);

  // Round State
  const [userGuess, setUserGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [unlockedHints, setUnlockedHints] = useState<HintResponse[]>([]);
  const [revealData, setRevealData] = useState<GuessResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Modals & Panels
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [graphData, setGraphData] = useState<ProvenanceGraphResponse | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  // Session Tally
  const [totalScore, setTotalScore] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Each view starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Transient, non-blocking messages replace window.alert().
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Load initial catalog
  useEffect(() => {
    async function loadInitialData() {
      try {
        setGlobalError(null);
        const data = await api.listArtifacts(false);
        setArtifacts(data);

        // Select the first playable artifact
        const firstPlayable = data.find((a) => a.is_playable) || data[0];
        if (firstPlayable) {
          setActiveArtifact(firstPlayable);
        }
      } catch (err: any) {
        console.error('Failed to load artifacts:', err);
        setGlobalError(err.message || 'Unable to connect to the Origlyph backend.');
      }
    }
    loadInitialData();
  }, []);

  // Reset round state when active artifact changes
  const handleSelectArtifact = (id: string) => {
    const selected = artifacts.find((a) => a.id === id);
    if (selected) {
      setActiveArtifact(selected);
      setUserGuess(null);
      setUnlockedHints([]);
      setRevealData(null);
      setIsRevealModalOpen(false);
      setGraphData(null);
      setCurrentView('game');
    }
  };

  // Request progressive hint
  const handleUnlockHint = async (level: number) => {
    if (!activeArtifact) return;
    try {
      setIsLoadingHint(true);
      const hint = await api.getHint(activeArtifact.id, level);
      setUnlockedHints((prev) => [...prev, hint]);
    } catch (err: any) {
      console.error('Hint error:', err);
      setNotice(`Could not retrieve hint: ${err.message}`);
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Submit geographic guess
  const handleSubmitGuess = async () => {
    if (!activeArtifact || !userGuess) return;
    try {
      setIsSubmitting(true);
      const res = await api.submitGuess(
        activeArtifact.id,
        userGuess.lat,
        userGuess.lng,
        unlockedHints.length
      );
      setRevealData(res);
      setIsRevealModalOpen(true);

      // Update session tally
      if (!completedIds.has(activeArtifact.id)) {
        setTotalScore((prev) => prev + res.final_score);
        setCompletedIds((prev) => new Set([...prev, activeArtifact.id]));
      }

      // Pre-load provenance graph for smooth transition
      api.getRelations(activeArtifact.id).then(setGraphData).catch(console.error);
    } catch (err: any) {
      console.error('Guess error:', err);
      setNotice(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load and display provenance graph
  const handleOpenProvenance = async () => {
    if (!activeArtifact) return;
    try {
      setIsLoadingGraph(true);
      const relations = await api.getRelations(activeArtifact.id);
      setGraphData(relations);
      setIsRevealModalOpen(false);
      setCurrentView('global-graph');
    } catch (err: any) {
      console.error('Graph error:', err);
      setNotice(`Could not load provenance graph: ${err.message}`);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  // Advance to next playable challenge
  const handleNextChallenge = () => {
    const playable = artifacts.filter((a) => a.is_playable);
    const currentIndex = playable.findIndex((a) => a.id === activeArtifact?.id);
    const nextIndex = (currentIndex + 1) % playable.length;
    handleSelectArtifact(playable[nextIndex].id);
  };

  // The graph tab used to render blank until a round had been played; load it on demand.
  const handleNavigate = async (view: AppView) => {
    setCurrentView(view);
    if (view === 'global-graph' && !graphData && activeArtifact) {
      try {
        setIsLoadingGraph(true);
        setGraphData(await api.getRelations(activeArtifact.id));
      } catch (err: any) {
        console.error('Graph error:', err);
        setNotice(`Could not load provenance graph: ${err.message}`);
      } finally {
        setIsLoadingGraph(false);
      }
    }
  };

  const playableCount = artifacts.filter((a) => a.is_playable).length;

  return (
    <div className="app-container">
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenIntegrationGuide={() => setIsGuideModalOpen(true)}
        totalScore={totalScore}
        completedCount={completedIds.size}
        playableCount={playableCount}
      />

      {globalError && (
        <div className="banner" role="alert">
          <div className="banner-text">
            <AlertCircle size={16} />
            {globalError} (Is the backend running on port 8000?)
          </div>
          <button className="ghost-btn small" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {/* Main Challenge Game Layout */}
      {currentView === 'game' && !activeArtifact && !globalError && (
        <div className="loading" role="status">
          <span className="loading-ring" aria-hidden="true" />
          Unrolling the atlas…
        </div>
      )}

      {currentView === 'game' && activeArtifact && (
        <main className="game-layout">
          {/* Left Pane: Artifact & Hints */}
          <div className="artifact-pane">
            <ArtifactViewer artifact={activeArtifact} />

            <HintPanel
              unlockedHints={unlockedHints}
              onUnlockHint={handleUnlockHint}
              isLoading={isLoadingHint}
              disabled={!!revealData}
            />
          </div>

          {/* Right Pane: Interactive Cartographic Map */}
          <MapGuess
            userGuess={userGuess}
            onSelectCoordinates={setUserGuess}
            onSubmitGuess={handleSubmitGuess}
            revealData={revealData}
            isSubmitting={isSubmitting}
            disabled={!activeArtifact.is_playable}
          />
        </main>
      )}

      {/* Catalog View */}
      {currentView === 'catalog' && (
        <ArtifactCatalog
          artifacts={artifacts}
          activeArtifactId={activeArtifact?.id || ''}
          onSelectArtifact={handleSelectArtifact}
        />
      )}

      {/* Provenance Graph View */}
      {currentView === 'global-graph' && (
        <div className="page graph-page">
          {graphData ? (
            <ProvenanceGraph
              graphData={graphData}
              onSelectArtifact={handleSelectArtifact}
              onClose={() => setCurrentView('game')}
            />
          ) : (
            <div className="loading" role="status">
              <span className="loading-ring" aria-hidden="true" />
              {isLoadingGraph ? 'Tracing provenance…' : 'Choose an artifact to see its provenance.'}
            </div>
          )}
        </div>
      )}

      {/* Open-source credits */}
      {currentView === 'credits' && <OpenSourceAtlas />}

      {notice && (
        <div className="toast" role="status">
          <AlertCircle size={16} />
          <span>{notice}</span>
          <button className="icon-btn small" onClick={() => setNotice(null)} aria-label="Dismiss message">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Reveal Modal */}
      {isRevealModalOpen && revealData && (
        <RevealModal
          reveal={revealData}
          onNextChallenge={handleNextChallenge}
          onOpenProvenance={handleOpenProvenance}
          onClose={() => setIsRevealModalOpen(false)}
        />
      )}

      {/* Integration Guide Modal */}
      {isGuideModalOpen && (
        <IntegrationGuideModal onClose={() => setIsGuideModalOpen(false)} />
      )}
    </div>
  );
};
