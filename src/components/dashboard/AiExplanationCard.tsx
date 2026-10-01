import React from 'react';
import { AiExplanationResponse } from '../../types/decision';
import { Sparkles, HelpCircle, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface AiExplanationCardProps {
  explanation: AiExplanationResponse | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const AiExplanationCard: React.FC<AiExplanationCardProps> = ({
  explanation,
  loading,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400 animate-spin" />
          <div className="h-4 w-48 bg-slate-800 rounded"></div>
        </div>
        <div className="h-3 w-full bg-slate-800/80 rounded"></div>
        <div className="h-3 w-3/4 bg-slate-800/80 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="h-24 bg-slate-800/50 rounded-lg"></div>
          <div className="h-24 bg-slate-800/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  const isGemini = explanation.generationSource === 'gemini';

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3.5 sm:pb-4 w-full">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white break-words">
                Decision Analysis & Trade-Off Synthesis
              </h3>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] uppercase font-bold text-emerald-400 border border-emerald-500/30 shrink-0">
                {isGemini ? 'Gemini 3.8 Flash' : 'Deterministic Rule Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed break-words">
              Strictly non-prescriptive. Explains calculated consequences while preserving full user autonomy.
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition w-full sm:w-auto min-h-[38px] shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate Insights
          </button>
        )}
      </div>

      {/* Executive Summary */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
          Executive Summary
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {explanation.summary}
        </p>
      </div>

      {/* Grid of Structured Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. What the Numbers Show */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            What the Numbers Show
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {explanation.whatNumbersShow.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Key Assumptions Behind the Model */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            Key Assumptions
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {explanation.keyAssumptions.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Major Trade-Offs */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ArrowRight className="h-4 w-4 text-sky-400" />
            Critical Trade-Offs
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {explanation.tradeoffs.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-sky-500 font-bold shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Sensitivity & Uncertainty */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-indigo-400" />
            Sensitivity & Leverage Factors
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {explanation.sensitivityFactors.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reflective Questions to Consider (User Autonomy) */}
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Questions for You to Consider Before Deciding
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {explanation.questionsToConsider.map((q, idx) => (
            <div
              key={idx}
              className="rounded-md border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs text-slate-300"
            >
              <span className="font-bold text-emerald-400 mr-1.5">Q{idx + 1}:</span>
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
