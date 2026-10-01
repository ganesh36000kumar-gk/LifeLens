import React from 'react';
import { BreakEvenResult } from '../../types/decision';
import { Clock, HelpCircle } from 'lucide-react';

interface BreakEvenCardProps {
  breakEven: BreakEvenResult;
}

export const BreakEvenCard: React.FC<BreakEvenCardProps> = ({ breakEven }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 break-words">
          Mathematical Break-Even Assessment
        </h3>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto ${
            breakEven.isApplicable
              ? breakEven.breakEvenPeriodYears
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {breakEven.isApplicable
            ? breakEven.breakEvenPeriodYears
              ? 'Break-Even Attainable'
              : 'Beyond Evaluation Horizon'
            : 'Not Applicable'}
        </span>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 sm:p-4">
        {breakEven.isApplicable ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <div className="text-[11px] sm:text-xs font-semibold text-slate-400 break-words">
                Metric: {breakEven.breakEvenMetricName}
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-white break-words">
                {breakEven.breakEvenPeriodYears
                  ? `~${breakEven.breakEvenPeriodYears} Years (${breakEven.breakEvenPeriodMonths} Months)`
                  : 'Break-even not reached within duration'}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 w-fit shrink-0">
              <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">
                {breakEven.breakEvenPeriodYears
                  ? 'Cash flow or equity crossover'
                  : 'Negative or insufficient spread'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start sm:items-center gap-2 text-xs text-slate-400">
            <HelpCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-snug">Break-even analysis is not applicable with the current inputs or consumption-based decision type.</span>
          </div>
        )}

        <p className="mt-2.5 sm:mt-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2.5 break-words">
          {breakEven.explanation}
        </p>
      </div>
    </div>
  );
};
