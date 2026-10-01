import React, { useState } from 'react';
import {
  ScenarioCalculationResult,
  CurrencyCode,
} from '../../types/decision';
import { formatCurrency } from '../../lib/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ChartsSectionProps {
  scenarios: ScenarioCalculationResult[];
  currency: CurrencyCode;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  scenarios,
  currency,
}) => {
  const [activeChart, setActiveChart] = useState<'projections' | 'scenarioBar'>('projections');
  const baseScenario = scenarios.find((s) => s.scenarioId === 'base') || scenarios[0];

  // Prepare projections data
  const projectionChartData = baseScenario.projections.map((p) => ({
    name: `Y${p.year}`,
    NominalCost: Math.round(p.nominalCost),
    AssetEquity: Math.round(p.assetEquityValue),
    OpportunityCost: Math.round(p.opportunityCostCompounded),
    DebtBalance: Math.round(p.remainingDebtBalance),
  }));

  // Prepare scenario comparison data with short names for mobile legibility
  const scenarioBarData = scenarios.map((s) => ({
    name: s.scenarioName.length > 12 ? s.scenarioName.substring(0, 10) + '…' : s.scenarioName,
    fullName: s.scenarioName,
    TotalCost: Math.round(s.dimensions.financialCostTotal),
    OpportunityCost: Math.round(s.dimensions.opportunityCostTotal),
    LiquidityImpact: Math.round(s.dimensions.liquidityImpactTotal),
  }));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-5 space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
      {/* Chart Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3 w-full">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Deterministic Financial Projections
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400">
            {activeChart === 'projections'
              ? 'Year-by-year cumulative outlays, equity, and opportunity costs'
              : 'Cross-scenario capital commitments comparison'}
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveChart('projections')}
            className={`rounded px-2.5 sm:px-3 py-1 font-semibold transition min-h-[30px] text-xs ${
              activeChart === 'projections'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly Trajectory
          </button>
          <button
            onClick={() => setActiveChart('scenarioBar')}
            className={`rounded px-2.5 sm:px-3 py-1 font-semibold transition min-h-[30px] text-xs ${
              activeChart === 'scenarioBar'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scenario Bars
          </button>
        </div>
      </div>

      {/* Responsive Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-1 min-w-0 min-h-[250px] overflow-hidden">
        {activeChart === 'projections' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={projectionChartData}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorOpp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                width={48}
                tickFormatter={(val) => formatCurrency(val, currency, true)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  color: '#f8fafc',
                  maxWidth: '90vw',
                }}
                formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
              <Area
                type="monotone"
                dataKey="NominalCost"
                name="Cumulative Outlay"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
              />
              <Area
                type="monotone"
                dataKey="AssetEquity"
                name="Asset Equity"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEquity)"
              />
              <Area
                type="monotone"
                dataKey="OpportunityCost"
                name="Opportunity Cost"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorOpp)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={scenarioBarData}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                width={48}
                tickFormatter={(val) => formatCurrency(val, currency, true)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  color: '#f8fafc',
                  maxWidth: '90vw',
                }}
                formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
              <Bar dataKey="TotalCost" name="Total Cost" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="OpportunityCost" name="Opp. Cost" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="LiquidityImpact" name="Liquidity" fill="#38bdf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
