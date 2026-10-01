import React, { useState } from 'react';
import { ScenarioCalculationResult, CurrencyCode } from '../../types/decision';
import { formatCurrency } from '../../lib/formatters';
import { Table, LayoutGrid, ArrowRightLeft } from 'lucide-react';

interface ScenarioComparisonTableProps {
  scenarios: ScenarioCalculationResult[];
  currency: CurrencyCode;
}

export const ScenarioComparisonTable: React.FC<ScenarioComparisonTableProps> = ({
  scenarios,
  currency,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden w-full max-w-full">
      {/* Header with mobile view toggle */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Scenario Comparison Matrix
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Side-by-side mathematical outcomes across varying economic assumptions
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition min-h-[30px] ${
                viewMode === 'table'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <Table className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition min-h-[30px] ${
                viewMode === 'cards'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <span className="hidden sm:inline-block rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300">
            {scenarios.length} Scenarios
          </span>
        </div>
      </div>

      {/* Swipe prompt on mobile for table mode */}
      {viewMode === 'table' && (
        <div className="sm:hidden px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ArrowRightLeft className="h-3 w-3" /> Swipe horizontally to view all scenarios
          </span>
          <span className="text-slate-500">{scenarios.length} columns</span>
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' ? (
        <div className="w-full max-w-full overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 sm:px-4 min-w-[140px] sticky left-0 bg-slate-950/95 z-10 border-r border-slate-800">
                  Decision Metric
                </th>
                {scenarios.map((s) => (
                  <th key={s.scenarioId} className="py-2.5 px-3 sm:px-4 min-w-[130px]">
                    <div className="text-white font-bold text-xs truncate">{s.scenarioName}</div>
                    <div className="text-[10px] text-slate-500 font-normal uppercase">{s.scenarioType}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {/* Total Financial Cost */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                  Total Financial Cost
                </td>
                {scenarios.map((s) => (
                  <td key={s.scenarioId} className="py-2.5 px-3 sm:px-4 font-bold text-white">
                    {formatCurrency(s.dimensions.financialCostTotal, currency)}
                  </td>
                ))}
              </tr>

              {/* Monthly Cash Flow Impact */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                  Monthly Cash Flow
                </td>
                {scenarios.map((s) => (
                  <td
                    key={s.scenarioId}
                    className={`py-2.5 px-3 sm:px-4 font-medium ${
                      s.dimensions.monthlyCashFlowImpact >= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {formatCurrency(s.dimensions.monthlyCashFlowImpact, currency)}
                  </td>
                ))}
              </tr>

              {/* Long-Term Net Value */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                  Long-Term Net Value
                </td>
                {scenarios.map((s) => (
                  <td
                    key={s.scenarioId}
                    className={`py-2.5 px-3 sm:px-4 font-medium ${
                      s.dimensions.longTermNetValue >= 0 ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {formatCurrency(s.dimensions.longTermNetValue, currency)}
                  </td>
                ))}
              </tr>

              {/* Committed Liquidity */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                  Upfront Liquidity
                </td>
                {scenarios.map((s) => (
                  <td key={s.scenarioId} className="py-2.5 px-3 sm:px-4 text-sky-400 font-medium">
                    {formatCurrency(s.dimensions.liquidityImpactTotal, currency)}
                  </td>
                ))}
              </tr>

              {/* Opportunity Cost */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                  Opportunity Cost
                </td>
                {scenarios.map((s) => (
                  <td key={s.scenarioId} className="py-2.5 px-3 sm:px-4 text-indigo-400 font-medium">
                    {formatCurrency(s.dimensions.opportunityCostTotal, currency)}
                  </td>
                ))}
              </tr>

              {/* Risk Exposure */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                  Risk Level
                </td>
                {scenarios.map((s) => (
                  <td key={s.scenarioId} className="py-2.5 px-3 sm:px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.dimensions.riskExposureLevel === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : s.dimensions.riskExposureLevel === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {s.dimensions.riskExposureLevel}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Flexibility */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                  Flexibility
                </td>
                {scenarios.map((s) => (
                  <td key={s.scenarioId} className="py-2.5 px-3 sm:px-4 font-medium text-slate-300">
                    {s.dimensions.flexibilityRating}
                  </td>
                ))}
              </tr>

              {/* Break-Even Timeline */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                  Break-Even
                </td>
                {scenarios.map((s) => (
                  <td key={s.scenarioId} className="py-2.5 px-3 sm:px-4 text-slate-400 text-[11px]">
                    {s.breakEven.isApplicable
                      ? s.breakEven.breakEvenPeriodYears
                        ? `~${s.breakEven.breakEvenPeriodYears} Yrs`
                        : 'Not in horizon'
                      : 'N/A'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        /* Mobile Card Mode: Stacks each scenario as an easy-to-read vertical card */
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((s) => (
            <div
              key={s.scenarioId}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-white break-words">{s.scenarioName}</h4>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">{s.scenarioType}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.dimensions.riskExposureLevel === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : s.dimensions.riskExposureLevel === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {s.dimensions.riskExposureLevel}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Cost:</span>
                  <span className="font-bold text-white">{formatCurrency(s.dimensions.financialCostTotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Cash Flow:</span>
                  <span className={`font-semibold ${s.dimensions.monthlyCashFlowImpact >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatCurrency(s.dimensions.monthlyCashFlowImpact, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Net Long-Term:</span>
                  <span className={`font-semibold ${s.dimensions.longTermNetValue >= 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {formatCurrency(s.dimensions.longTermNetValue, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Upfront Liquidity:</span>
                  <span className="text-sky-400 font-medium">{formatCurrency(s.dimensions.liquidityImpactTotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Opportunity Cost:</span>
                  <span className="text-indigo-400 font-medium">{formatCurrency(s.dimensions.opportunityCostTotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Flexibility:</span>
                  <span className="text-slate-200">{s.dimensions.flexibilityRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Break-Even:</span>
                  <span className="text-slate-400 text-[11px]">
                    {s.breakEven.isApplicable
                      ? s.breakEven.breakEvenPeriodYears
                        ? `~${s.breakEven.breakEvenPeriodYears} Years`
                        : 'Not in horizon'
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
