import React from 'react';
import { DecisionDimensions, CurrencyCode } from '../../types/decision';
import { formatCurrency } from '../../lib/formatters';
import {
  Wallet,
  Calendar,
  TrendingUp,
  Droplet,
  ShieldAlert,
  Compass,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface DimensionsGridProps {
  dimensions: DecisionDimensions;
  currency: CurrencyCode;
}

export const DimensionsGrid: React.FC<DimensionsGridProps> = ({
  dimensions,
  currency,
}) => {
  const cards = [
    {
      label: 'Financial Cost (Total)',
      value: formatCurrency(dimensions.financialCostTotal, currency),
      sub: 'Cumulative direct outlays over evaluation horizon',
      icon: Wallet,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Monthly Cash Flow Impact',
      value: formatCurrency(dimensions.monthlyCashFlowImpact, currency),
      sub: dimensions.monthlyCashFlowImpact >= 0 ? 'Net monthly surplus' : 'Net monthly cash drain',
      icon: Calendar,
      color: dimensions.monthlyCashFlowImpact >= 0 ? 'text-emerald-400' : 'text-amber-400',
      bg: dimensions.monthlyCashFlowImpact >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Long-Term Net Value',
      value: formatCurrency(dimensions.longTermNetValue, currency),
      sub: 'End-state net asset equity minus total costs',
      icon: TrendingUp,
      color: dimensions.longTermNetValue >= 0 ? 'text-emerald-400' : 'text-slate-300',
      bg: dimensions.longTermNetValue >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800/40 border-slate-700/40',
    },
    {
      label: 'Liquidity Impact (Committed)',
      value: formatCurrency(dimensions.liquidityImpactTotal, currency),
      sub: 'Upfront capital tied up or forfeited',
      icon: Droplet,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Risk Exposure Level',
      value: dimensions.riskExposureLevel,
      sub: 'Deterministic synthesis of financial & cash flow volatility',
      icon: ShieldAlert,
      color: dimensions.riskExposureLevel === 'HIGH' ? 'text-rose-400' : dimensions.riskExposureLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400',
      bg: dimensions.riskExposureLevel === 'HIGH' ? 'bg-rose-500/10 border-rose-500/20' : dimensions.riskExposureLevel === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Flexibility Rating',
      value: dimensions.flexibilityRating,
      sub: 'Freedom to change course or relocate',
      icon: Compass,
      color: dimensions.flexibilityRating === 'HIGH' ? 'text-emerald-400' : dimensions.flexibilityRating === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400',
      bg: 'bg-slate-900 border-slate-800',
    },
    {
      label: 'Opportunity Cost',
      value: formatCurrency(dimensions.opportunityCostTotal, currency),
      sub: 'Estimated alternative market wealth forgone',
      icon: Zap,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Reversibility',
      value: dimensions.reversibility,
      sub: 'Friction and penalty to unwind this decision',
      icon: RotateCcw,
      color: dimensions.reversibility === 'EASY' ? 'text-emerald-400' : dimensions.reversibility === 'MODERATE' ? 'text-amber-400' : 'text-rose-400',
      bg: 'bg-slate-900 border-slate-800',
    },
  ];

  return (
    <div className="space-y-2.5 sm:space-y-3 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Independent Decision Dimensions (No Arbitrary Universal Score)
        </h3>
        <span className="text-[11px] text-slate-500">
          Base Scenario Metrics
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-200 w-full min-w-0 flex flex-col justify-between ${c.bg}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                  <span className="text-xs font-semibold text-slate-300 break-words leading-snug flex-1 min-w-0">{c.label}</span>
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${c.color}`} />
                </div>
                <div
                  className={`text-base sm:text-xl font-black tracking-tight break-words ${c.color}`}
                  title={c.value}
                >
                  {c.value}
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 leading-snug break-words">
                {c.sub}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
