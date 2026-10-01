import React from 'react';
import { SensitivityAnalysisResult, CurrencyCode } from '../../types/decision';
import { formatCurrency } from '../../lib/formatters';
import { Activity, Sliders, AlertTriangle } from 'lucide-react';

interface SensitivityViewerProps {
  sensitivity: SensitivityAnalysisResult;
  currency: CurrencyCode;
}

export const SensitivityViewer: React.FC<SensitivityViewerProps> = ({
  sensitivity,
  currency,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-5 space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 w-full">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Sensitivity & Assumption Elasticity Engine
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Identifies which assumptions create the widest variance on total financial outcomes under ±20% variation.
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium text-amber-300 w-fit shrink-0">
          Sensitivity is NOT probability
        </div>
      </div>

      {/* Critical Drivers Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
        <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-3 w-full min-w-0">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
            Highest Leverage Variable (Most Critical)
          </span>
          <div className="text-sm sm:text-base font-extrabold text-white mt-1 break-words">
            {sensitivity.mostCriticalVariable}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Has the largest financial impact if reality departs from your baseline forecast.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 w-full min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Lowest Leverage Variable
          </span>
          <div className="text-sm sm:text-base font-extrabold text-white mt-1 break-words">
            {sensitivity.leastCriticalVariable}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Has relatively minor leverage on terminal net cost or wealth.
          </p>
        </div>
      </div>

      {/* Variable Impact Ranking */}
      <div className="space-y-2.5 sm:space-y-3 pt-1 w-full">
        <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
          Ranked Variables by Outcome Swing (Tornado Range)
        </h4>

        <div className="space-y-2 sm:space-y-2.5 w-full">
          {sensitivity.variables.map((variable) => (
            <div
              key={variable.variableKey}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 w-full min-w-0 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                    #{variable.impactRank}
                  </span>
                  <span className="text-xs font-bold text-white break-words">
                    {variable.variableLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    (Base: {variable.baseValue} {variable.unit})
                  </span>
                </div>
                <div className="text-xs font-semibold text-emerald-400 pl-6 sm:pl-0 shrink-0">
                  Swing: {formatCurrency(variable.elasticityImpact, currency)}
                </div>
              </div>

              {/* 5-point variation matrix with horizontal scroll safety on mobile */}
              <div className="w-full overflow-x-auto touch-scroll no-scrollbar">
                <div className="grid grid-cols-5 gap-1 text-center text-[10px] bg-slate-900 p-2 rounded border border-slate-800/80 min-w-[260px]">
                  {variable.points.map((p) => (
                    <div key={p.percentVariation} className="flex flex-col px-0.5">
                      <span className={`font-semibold ${p.percentVariation === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {p.percentVariation > 0 ? `+${p.percentVariation}%` : `${p.percentVariation}%`}
                      </span>
                      <span className="text-slate-300 text-[10px] sm:text-[11px] mt-0.5 font-medium truncate" title={formatCurrency(p.impactedOutcome, currency)}>
                        {formatCurrency(p.impactedOutcome, currency, true)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
