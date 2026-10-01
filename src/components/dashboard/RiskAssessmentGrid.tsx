import React from 'react';
import { RiskProfile, RiskLevel } from '../../types/decision';
import { Shield, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface RiskAssessmentGridProps {
  riskProfile: RiskProfile;
}

export const RiskAssessmentGrid: React.FC<RiskAssessmentGridProps> = ({ riskProfile }) => {
  const dimensions = Object.values(riskProfile);

  const getBadgeStyle = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          border: 'border-rose-500/20 bg-rose-950/10',
          icon: AlertCircle,
          iconColor: 'text-rose-400',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          border: 'border-amber-500/20 bg-amber-950/10',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
        };
      case 'LOW':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          border: 'border-emerald-500/20 bg-emerald-950/10',
          icon: CheckCircle,
          iconColor: 'text-emerald-400',
        };
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-5 space-y-3 sm:space-y-4 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-b border-slate-800 pb-3 w-full">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Deterministic Risk Exposure Matrix
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Transparent, rule-based qualitative classification (No fabricated or arbitrary statistical probabilities).
          </p>
        </div>
        <span className="text-[10px] sm:text-[11px] text-slate-500 self-start sm:self-auto">
          8 Evaluated Vectors
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {dimensions.map((item) => {
          const style = getBadgeStyle(item.level);
          const Icon = style.icon;

          return (
            <div
              key={item.dimension}
              className={`rounded-xl border p-3 sm:p-3.5 flex flex-col justify-between transition w-full min-w-0 ${style.border}`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <span className="text-xs font-bold text-slate-200 break-words leading-snug flex-1 min-w-0">
                    {item.dimension}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold border shrink-0 mt-0.5 ${style.badge}`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    {item.level}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed break-words">
                  {item.reason}
                </p>
              </div>

              {item.criticalThreshold && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono break-all">
                  Trigger: {item.criticalThreshold}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
