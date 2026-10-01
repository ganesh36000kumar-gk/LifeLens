import React from 'react';
import { SimulationResult, CurrencyCode } from '../../types/decision';
import { formatCurrency } from '../../lib/formatters';
import { X, Trash2, ArrowRight, Bookmark } from 'lucide-react';

interface SavedSimulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedList: SimulationResult[];
  onLoad: (sim: SimulationResult) => void;
  onDelete: (id: string) => void;
  currency: CurrencyCode;
}

export const SavedSimulationsModal: React.FC<SavedSimulationsModalProps> = ({
  isOpen,
  onClose,
  savedList,
  onLoad,
  onDelete,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-sky-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Saved Simulation Library
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {savedList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No simulations saved yet. Complete any life decision simulation and click "Save to Library".
            </div>
          ) : (
            savedList.map((sim) => {
              const base = sim.scenarios.find((s) => s.scenarioId === 'base') || sim.scenarios[0];

              return (
                <div
                  key={sim.decisionId}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-400">
                        {sim.decisionCategory}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(sim.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{sim.title}</div>
                    <div className="text-xs text-slate-400">
                      Total Cost: <span className="text-slate-200 font-semibold">{formatCurrency(base.dimensions.financialCostTotal, currency)}</span> • Monthly: <span className="text-slate-200 font-semibold">{formatCurrency(base.dimensions.monthlyCashFlowImpact, currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onLoad(sim);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/30 transition"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(sim.decisionId)}
                      className="rounded-lg p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition"
                      title="Delete from saved"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
