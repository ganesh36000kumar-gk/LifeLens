import React, { useState, useEffect } from 'react';
import { DecisionCategory, CurrencyCode, SimulationResult } from './types/decision';
import { Language } from './lib/i18n';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { DecisionSelector } from './components/DecisionSelector';
import { DecisionFormManager } from './components/forms/DecisionFormManager';
import { ResultsDashboard } from './components/dashboard/ResultsDashboard';
import { SavedSimulationsModal } from './components/modals/SavedSimulationsModal';
import { DemosModal } from './components/modals/DemosModal';
import { ShareModal } from './components/modals/ShareModal';
import { ExportModal } from './components/modals/ExportModal';
import { runFullSimulation } from './features/calculations/decisionEngine';
import { getSavedSimulations, saveSimulationLocally, deleteSavedSimulation } from './lib/storage';
import { DEMO_DECISIONS, DemoItem } from './lib/demos';
import { runAutomatedTests } from './tests/calculations.test';

export function App() {
  const [view, setView] = useState<'home' | 'form' | 'results'>('home');
  const [selectedCategory, setSelectedCategory] = useState<DecisionCategory | null>(null);
  const [activeSimulation, setActiveSimulation] = useState<SimulationResult | null>(null);

  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [language, setLanguage] = useState<Language>('en');

  const [savedSimulations, setSavedSimulations] = useState<SimulationResult[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isDemosModalOpen, setIsDemosModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Load saved simulations on mount & run tests
  useEffect(() => {
    setSavedSimulations(getSavedSimulations());

    // Run deterministic verification test suite
    const testResults = runAutomatedTests();
    console.log(`[Life Decision Simulator] Math Engine Self-Check: ${testResults.passed} passed, ${testResults.failed} failed.`);

    // Check URL parameters for shared simulations or demos
    const params = new URLSearchParams(window.location.search);
    const simData = params.get('simData');
    const shareToken = params.get('shareToken');
    const demoCat = params.get('demoCategory') as DecisionCategory | null;

    if (simData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(simData)));
        if (decoded && decoded.decisionCategory) {
          setActiveSimulation(decoded);
          setSelectedCategory(decoded.decisionCategory);
          setView('results');
        }
      } catch (err) {
        console.warn('Could not parse simData from URL:', err);
      }
    } else if (shareToken) {
      fetch(`/api/simulations/share/${shareToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.decisionCategory) {
            setActiveSimulation(data);
            setSelectedCategory(data.decisionCategory);
            setView('results');
          }
        })
        .catch((e) => console.warn('Could not load shared token:', e));
    } else if (demoCat) {
      const demo = DEMO_DECISIONS.find((d) => d.category === demoCat);
      if (demo) {
        handleLaunchDemo(demo);
      }
    }
  }, []);

  const handleSelectCategory = (cat: DecisionCategory) => {
    setSelectedCategory(cat);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunSimulation = (data: any, title: string, scenarioIds: string[]) => {
    if (!selectedCategory) return;

    try {
      const result = runFullSimulation({
        decisionCategory: selectedCategory,
        title,
        currency,
        inputData: data,
        scenarioIds,
      });

      setActiveSimulation(result);
      setView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      alert(`Simulation Error: ${e.message}`);
    }
  };

  const handleLaunchDemo = (demo: DemoItem) => {
    setSelectedCategory(demo.category);
    try {
      const result = runFullSimulation({
        decisionCategory: demo.category,
        title: demo.title,
        currency,
        inputData: demo.data,
        scenarioIds: ['base', 'conservative', 'expected', 'optimistic', 'stress'],
        isDemo: true,
      });
      setActiveSimulation(result);
      setView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      console.error('Failed to launch demo:', e);
    }
  };

  const handleSaveCurrent = () => {
    if (!activeSimulation) return;
    const ok = saveSimulationLocally(activeSimulation);
    if (ok) {
      setSavedSimulations(getSavedSimulations());
    }
  };

  const handleDeleteSaved = (id: string) => {
    deleteSavedSimulation(id);
    setSavedSimulations(getSavedSimulations());
  };

  const handleLoadSaved = (sim: SimulationResult) => {
    setActiveSimulation(sim);
    setSelectedCategory(sim.decisionCategory);
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCurrentSaved = Boolean(
    activeSimulation &&
      savedSimulations.some((s) => s.decisionId === activeSimulation.decisionId)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentLang={language}
        onLanguageChange={setLanguage}
        currency={currency}
        onCurrencyChange={setCurrency}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        savedCount={savedSimulations.length}
        onOpenDemos={() => setIsDemosModalOpen(true)}
        onHomeClick={() => {
          setView('home');
          setSelectedCategory(null);
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-full">
        <div className="app-container py-3 sm:py-6">
          {view === 'home' && (
            <>
              <LandingHero
                onSelectCategory={handleSelectCategory}
                onOpenDemos={() => setIsDemosModalOpen(true)}
              />
              <DecisionSelector
                onSelectCategory={handleSelectCategory}
                selectedCategory={selectedCategory}
              />
            </>
          )}

          {view === 'form' && selectedCategory && (
            <DecisionFormManager
              category={selectedCategory}
              currency={currency}
              onBack={() => setView('home')}
              onSubmit={handleRunSimulation}
            />
          )}

          {view === 'results' && activeSimulation && (
            <ResultsDashboard
              simulation={activeSimulation}
              currency={currency}
              onEditInputs={() => setView('form')}
              onSave={handleSaveCurrent}
              isSaved={isCurrentSaved}
              onOpenShare={() => setIsShareModalOpen(true)}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 sm:py-8 mt-8 sm:mt-12 text-center text-xs text-slate-500">
        <div className="app-container space-y-2">
          <p className="max-w-xl mx-auto leading-relaxed break-words">
            <strong>Life Decision Simulator:</strong> A deterministic financial decision-support system. Calculations are purely mathematical; AI is strictly restricted to qualitative trade-off explanation without numerical manipulation. The simulator never decides for you.
          </p>
          <p className="text-[11px] text-slate-400 break-words">
            Defaults such as 6% inflation and 8% market return are user-editable baseline assumptions. Past performance does not guarantee future results.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <SavedSimulationsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedList={savedSimulations}
        onLoad={handleLoadSaved}
        onDelete={handleDeleteSaved}
        currency={currency}
      />

      <DemosModal
        isOpen={isDemosModalOpen}
        onClose={() => setIsDemosModalOpen(false)}
        onSelectDemo={handleLaunchDemo}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        simulation={activeSimulation}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        simulation={activeSimulation}
      />
    </div>
  );
}
export default App;
