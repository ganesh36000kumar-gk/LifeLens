import React, { useState, useEffect } from 'react';
import { SimulationResult, CurrencyCode, AiExplanationResponse } from '../../types/decision';
import { DimensionsGrid } from './DimensionsGrid';
import { ScenarioComparisonTable } from './ScenarioComparisonTable';
import { ChartsSection } from './ChartsSection';
import { SensitivityViewer } from './SensitivityViewer';
import { BreakEvenCard } from './BreakEvenCard';
import { RiskAssessmentGrid } from './RiskAssessmentGrid';
import { AssumptionsPanel } from './AssumptionsPanel';
import { AiExplanationCard } from './AiExplanationCard';
import { fetchAiExplanation } from '../../features/ai/aiService';
import {
  ArrowLeft,
  Share2,
  Download,
  Bookmark,
  Sparkles,
  ShieldCheck,
  Calendar,
  Check,
} from 'lucide-react';

interface ResultsDashboardProps {
  simulation: SimulationResult;
  currency: CurrencyCode;
  onEditInputs: () => void;
  onSave: () => void;
  isSaved: boolean;
  onOpenShare: () => void;
  onOpenExport: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  simulation,
  currency,
  onEditInputs,
  onSave,
  isSaved,
  onOpenShare,
  onOpenExport,
}) => {
  const [aiExplanation, setAiExplanation] = useState<AiExplanationResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(true);

  const baseScenario = simulation.scenarios.find((s) => s.scenarioId === 'base') || simulation.scenarios[0];

  useEffect(() => {
    let isMounted = true;
    setAiLoading(true);

    fetchAiExplanation(simulation).then((res) => {
      if (isMounted) {
        setAiExplanation(res);
        setAiLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [simulation]);

  const handleRefreshAi = () => {
    setAiLoading(true);
    fetchAiExplanation(simulation).then((res) => {
      setAiExplanation(res);
      setAiLoading(false);
    });
  };

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-5 w-full min-w-0">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onEditInputs}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition mr-2 min-h-[36px]"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> Adjust Assumptions
            </button>

            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-300">
              {simulation.decisionCategory.replace('_', ' ')}
            </span>

            {simulation.isDemo && (
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                DEMO DATA
              </span>
            )}

            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {simulation.durationYears} Year Horizon
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight break-words">
            {simulation.title}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed break-words">
            Simulated on {new Date(simulation.timestamp).toLocaleDateString()} with {simulation.scenarios.length} deterministic scenario branches.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0">
          <button
            onClick={onSave}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 sm:px-3 py-2 text-xs font-semibold transition min-h-[42px] ${
              isSaved
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isSaved ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Bookmark className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={onOpenShare}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition min-h-[42px]"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Share</span>
          </button>

          <button
            onClick={onOpenExport}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-slate-950 px-2.5 sm:px-3.5 py-2 text-xs font-bold hover:bg-emerald-400 transition min-h-[42px]"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Trust & Transparency Banner (Section 56) */}
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/80 px-3.5 py-2.5 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="break-words leading-relaxed">
          <strong>Product Promise:</strong> This simulator helps you explore scenarios using the assumptions you provide. It does not predict the future or make decisions for you. Final authority remains entirely with you.
        </span>
      </div>

      {/* 1. Independent Decision Dimensions (Section 6) */}
      <DimensionsGrid dimensions={baseScenario.dimensions} currency={currency} />

      {/* 2. Interactive Charts (Section 32) */}
      <ChartsSection scenarios={simulation.scenarios} currency={currency} />

      {/* 3. Scenario Comparison Matrix (Section 33) */}
      <ScenarioComparisonTable scenarios={simulation.scenarios} currency={currency} />

      {/* 4. Sensitivity & Elasticity Engine (Section 24) */}
      <SensitivityViewer sensitivity={simulation.sensitivity} currency={currency} />

      {/* 5. Mathematical Break-Even Analysis (Section 25) */}
      <BreakEvenCard breakEven={baseScenario.breakEven} />

      {/* 6. Deterministic Risk Exposure Framework (Section 26) */}
      <RiskAssessmentGrid riskProfile={baseScenario.riskProfile} />

      {/* 7. Assumptions Audit Panel (Section 34) */}
      <AssumptionsPanel assumptions={baseScenario.assumptions} />

      {/* 8. AI Scenario Explanation Layer (Section 27 & 29) */}
      <AiExplanationCard
        explanation={aiExplanation}
        loading={aiLoading}
        onRefresh={handleRefreshAi}
      />
    </div>
  );
};
