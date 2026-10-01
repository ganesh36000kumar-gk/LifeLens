import React from 'react';
import { DEMO_DECISIONS, DemoItem } from '../../lib/demos';
import { X, BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';

interface DemosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDemo: (demo: DemoItem) => void;
}

export const DemosModal: React.FC<DemosModalProps> = ({
  isOpen,
  onClose,
  onSelectDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Pre-Built Simulation Demos
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Explore complete models before entering your own numbers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Demo Data Disclaimer */}
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Transparency Notice:</strong> All values below are sample illustrative data (DEMO DATA). They do not represent real-time quotes or personalized financial advice.
          </span>
        </div>

        {/* Demo Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {DEMO_DECISIONS.map((demo) => (
            <div
              key={demo.id}
              onClick={() => {
                onSelectDemo(demo);
                onClose();
              }}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500/50 hover:bg-slate-900 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                    {demo.badge}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                    {demo.category.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  {demo.title}
                </h4>
                <div className="text-xs font-semibold text-slate-300">
                  {demo.subtitle}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {demo.description}
                </p>
              </div>

              <div className="flex items-center text-xs font-bold text-emerald-400 shrink-0">
                Launch Model <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
