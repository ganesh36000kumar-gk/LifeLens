import React from 'react';
import { AssumptionItem } from '../../types/decision';
import { FileText } from 'lucide-react';

interface AssumptionsPanelProps {
  assumptions: AssumptionItem[];
  onEditAssumption?: (id: string) => void;
}

export const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({
  assumptions,
}) => {
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'user':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'default':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'estimated':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-5 space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 w-full">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Transparent Assumptions Audit Panel
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Every calculation strictly separates user inputs, editable application defaults, and estimates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold self-start sm:self-auto">
          <span className="px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/30">User</span>
          <span className="px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/30">Default</span>
          <span className="px-1.5 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">Estimated</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 w-full">
        {assumptions.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-slate-800 bg-slate-950 p-3 sm:p-3.5 space-y-1.5 w-full min-w-0"
          >
            <div className="flex items-start justify-between gap-1.5">
              <span className="text-xs font-bold text-slate-200 break-words leading-snug flex-1 min-w-0">{a.name}</span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${getSourceBadge(
                  a.source
                )}`}
              >
                {a.source}
              </span>
            </div>

            <div className="text-base sm:text-lg font-black text-white break-words">
              {typeof a.value === 'number' ? a.value.toLocaleString() : a.value}
            </div>

            <p className="text-[11px] text-slate-400 leading-snug break-words">
              {a.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
