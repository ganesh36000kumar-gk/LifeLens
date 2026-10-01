import { SimulationResult } from '../types/decision';
import { formatCurrency, formatPercent } from './formatters';

export function exportSimulationToJson(result: SimulationResult): void {
  const jsonStr = JSON.stringify(result, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.decisionCategory}_simulation_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSimulationToCsv(result: SimulationResult): void {
  const rows: string[][] = [];

  // Header section
  rows.push(['LIFE DECISION SIMULATOR — SIMULATION REPORT']);
  rows.push(['Decision Category', result.decisionCategory.toUpperCase()]);
  rows.push(['Title', result.title]);
  rows.push(['Currency', result.currency]);
  rows.push(['Timestamp', result.timestamp]);
  rows.push(['Evaluation Horizon (Years)', result.durationYears.toString()]);
  rows.push([]);

  // Scenarios Summary Table
  rows.push([
    'Scenario Name',
    'Type',
    'Total Financial Cost',
    'Monthly Cash Flow Impact',
    'Long-Term Net Value',
    'Liquidity Impact',
    'Risk Exposure',
    'Flexibility',
    'Opportunity Cost',
    'Reversibility',
  ]);

  result.scenarios.forEach((s) => {
    rows.push([
      `"${s.scenarioName}"`,
      s.scenarioType,
      s.dimensions.financialCostTotal.toString(),
      s.dimensions.monthlyCashFlowImpact.toString(),
      s.dimensions.longTermNetValue.toString(),
      s.dimensions.liquidityImpactTotal.toString(),
      s.dimensions.riskExposureLevel,
      s.dimensions.flexibilityRating,
      s.dimensions.opportunityCostTotal.toString(),
      s.dimensions.reversibility,
    ]);
  });

  rows.push([]);
  rows.push(['YEAR-BY-YEAR PROJECTIONS (BASE SCENARIO)']);
  rows.push([
    'Year',
    'Nominal Cumulative Cost',
    'Real Cost (Inflation-Adjusted)',
    'Annual Outflow',
    'Annual Inflow',
    'Net Cash Flow',
    'Asset Equity / Wealth',
    'Compounded Opportunity Cost',
    'Remaining Debt Balance',
  ]);

  const baseScenario = result.scenarios.find((s) => s.scenarioId === 'base') || result.scenarios[0];
  baseScenario.projections.forEach((p) => {
    rows.push([
      p.year.toString(),
      p.nominalCost.toString(),
      p.realCost.toString(),
      p.cashOutflowAnnual.toString(),
      p.cashInflowAnnual.toString(),
      p.netCashFlow.toString(),
      p.assetEquityValue.toString(),
      p.opportunityCostCompounded.toString(),
      p.remainingDebtBalance.toString(),
    ]);
  });

  rows.push([]);
  rows.push(['SENSITIVITY ANALYSIS (ELASTICITY IMPACT)']);
  rows.push(['Rank', 'Variable Name', 'Unit', 'Base Value', 'Elasticity Swing Impact']);
  result.sensitivity.variables.forEach((v) => {
    rows.push([
      v.impactRank.toString(),
      `"${v.variableLabel}"`,
      v.unit,
      v.baseValue.toString(),
      v.elasticityImpact.toString(),
    ]);
  });

  rows.push([]);
  rows.push(['DISCLAIMER']);
  rows.push(['"This simulator helps you explore scenarios using assumptions you provide. It does not predict the future or make decisions for you."']);

  const csvContent = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.decisionCategory}_simulation_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printSimulationReport(): void {
  window.print();
}
