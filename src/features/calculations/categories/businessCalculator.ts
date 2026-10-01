import { BusinessDecisionInput } from '../../../schemas/decisionSchemas';
import {
  calculateOpportunityCost,
  adjustForInflation,
} from '../core/financialMath';
import {
  DecisionDimensions,
  RiskProfile,
  BreakEvenResult,
  YearProjectionPoint,
  AssumptionItem,
  ScenarioCalculationResult,
} from '../../../types/decision';

export function calculateBusinessDecision(
  input: BusinessDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const initialMonthlyFixedCosts = input.fixedCostsMonthly + input.employeePayrollMonthly + input.marketingBudgetMonthly;
  const grossMarginRatio = input.grossMarginPercent / 100;

  // Monthly Revenue required to break even: Gross Profit = Fixed Costs
  // Revenue * grossMarginRatio = Fixed Costs => Revenue = Fixed Costs / grossMarginRatio
  const monthlyBreakEvenRevenueRequired = grossMarginRatio > 0
    ? initialMonthlyFixedCosts / grossMarginRatio
    : Infinity;

  // Monthly simulation step
  let cashBalance = input.initialCapitalInvestment;
  let currentMonthlyRevenue = input.initialMonthlyRevenue;
  let monthsRunway = 0;
  let isCashDepleted = false;
  let breakEvenMonthAchieved: number | null = null;
  let cumulativeProfitLoss = -input.initialCapitalInvestment;

  const monthlyData: {
    month: number;
    revenue: number;
    grossProfit: number;
    fixedCosts: number;
    netProfit: number;
    cashBalance: number;
  }[] = [];

  for (let m = 1; m <= input.simulationDurationMonths; m++) {
    const revenue = currentMonthlyRevenue;
    const grossProfit = revenue * grossMarginRatio;
    const fixedCosts = initialMonthlyFixedCosts;
    const preTaxProfit = grossProfit - fixedCosts;
    const tax = preTaxProfit > 0 ? preTaxProfit * (input.taxRatePercent / 100) : 0;
    const netProfit = preTaxProfit - tax;

    cashBalance += netProfit;
    cumulativeProfitLoss += netProfit;

    if (netProfit >= 0 && breakEvenMonthAchieved === null) {
      breakEvenMonthAchieved = m;
    }

    if (cashBalance <= input.emergencyReserveBuffer && !isCashDepleted && netProfit < 0) {
      monthsRunway = m;
      isCashDepleted = true;
    }

    monthlyData.push({
      month: m,
      revenue,
      grossProfit,
      fixedCosts,
      netProfit,
      cashBalance,
    });

    currentMonthlyRevenue *= (1 + input.revenueGrowthMonthlyPercent / 100);
  }

  if (!isCashDepleted) {
    monthsRunway = input.simulationDurationMonths;
  }

  // Aggregate into yearly projections for unified charting
  const projections: YearProjectionPoint[] = [];
  const years = Math.ceil(input.simulationDurationMonths / 12);

  for (let y = 1; y <= years; y++) {
    const monthsInThisYear = monthlyData.filter((d) => d.month > (y - 1) * 12 && d.month <= y * 12);
    const yearRevenue = monthsInThisYear.reduce((acc, curr) => acc + curr.revenue, 0);
    const yearExpenses = monthsInThisYear.reduce((acc, curr) => acc + (curr.revenue - curr.grossProfit + curr.fixedCosts), 0);
    const yearNet = monthsInThisYear.reduce((acc, curr) => acc + curr.netProfit, 0);
    const yearEndCash = monthsInThisYear[monthsInThisYear.length - 1]?.cashBalance ?? cashBalance;

    const { realValue: realNet } = adjustForInflation(yearNet, 6, y);

    projections.push({
      year: y,
      nominalCost: yearExpenses,
      realCost: realNet,
      cashOutflowAnnual: yearExpenses,
      cashInflowAnnual: yearRevenue,
      netCashFlow: yearNet,
      assetEquityValue: Math.max(0, yearEndCash),
      opportunityCostCompounded: calculateOpportunityCost(
        input.initialCapitalInvestment,
        0,
        input.alternativeInvestmentReturnPercent,
        y
      ).futureValueOpportunityCost,
      remainingDebtBalance: 0,
    });
  }

  const initialMonthlyBurn = Math.max(0, initialMonthlyFixedCosts - (input.initialMonthlyRevenue * grossMarginRatio));

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: monthsRunway < 9 ? 'HIGH' : monthsRunway < 18 ? 'MEDIUM' : 'LOW',
      reason: `Estimated cash runway is ${monthsRunway} months based on current monthly burn of ${Math.round(initialMonthlyBurn).toLocaleString()}.`,
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: initialMonthlyBurn > (input.initialCapitalInvestment * 0.12) ? 'HIGH' : 'MEDIUM',
      reason: `Monthly burn rate of ${Math.round(initialMonthlyBurn).toLocaleString()} consumes over 10% of starting capital each month.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: input.initialCapitalInvestment > 1000000 ? 'HIGH' : 'MEDIUM',
      reason: `Total invested capital of ${Math.round(input.initialCapitalInvestment).toLocaleString()} is at complete entrepreneurial risk.`,
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: input.revenueGrowthMonthlyPercent > 8 ? 'HIGH' : 'MEDIUM',
      reason: `Compounding monthly revenue growth of ${input.revenueGrowthMonthlyPercent}% requires exceptional customer adoption.`,
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: breakEvenMonthAchieved === null || breakEvenMonthAchieved > 18 ? 'HIGH' : 'MEDIUM',
      reason: breakEvenMonthAchieved
        ? `Cash flow break-even is projected at Month ${breakEvenMonthAchieved}.`
        : 'Venture does not achieve operating profitability within the simulation duration.',
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: 'HIGH',
      reason: `Alternative market investment of ${Math.round(input.initialCapitalInvestment).toLocaleString()} yields steady passive compounding without operational liability.`,
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: 'HIGH',
      reason: 'Business contracts, commercial leases, payroll commitments, and inventory create rigid legal liabilities.',
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: 'HIGH',
      reason: 'High capital concentration in an unproven single commercial entity.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: input.initialCapitalInvestment + (initialMonthlyFixedCosts * input.simulationDurationMonths),
    monthlyCashFlowImpact: -initialMonthlyBurn,
    longTermNetValue: cumulativeProfitLoss,
    liquidityImpactTotal: input.initialCapitalInvestment,
    riskExposureLevel: monthsRunway < 12 ? 'HIGH' : 'MEDIUM',
    flexibilityRating: 'LOW',
    timeCommitmentHoursPerWeek: 60, // Entrepreneurial venture
    incomePotentialAnnual: (monthlyData[monthlyData.length - 1]?.revenue ?? 0) * 12,
    opportunityCostTotal: calculateOpportunityCost(
      input.initialCapitalInvestment,
      0,
      input.alternativeInvestmentReturnPercent,
      input.simulationDurationMonths / 12
    ).futureValueOpportunityCost,
    reversibility: 'DIFFICULT',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: true,
    breakEvenPeriodMonths: breakEvenMonthAchieved,
    breakEvenPeriodYears: breakEvenMonthAchieved ? Number((breakEvenMonthAchieved / 12).toFixed(1)) : null,
    breakEvenMetricName: 'Monthly Operating Profitability (Gross Profit >= Fixed Overhead)',
    explanation: breakEvenMonthAchieved
      ? `Based on a ${input.revenueGrowthMonthlyPercent}% monthly compounding growth rate, the business achieves monthly operating break-even at Month ${breakEvenMonthAchieved} with ${Math.round(monthlyBreakEvenRevenueRequired).toLocaleString()} monthly revenue.`
      : `With current growth and margin assumptions, monthly gross profit does not overtake the fixed overhead of ${Math.round(initialMonthlyFixedCosts).toLocaleString()} within the ${input.simulationDurationMonths}-month window.`,
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'rev_growth_monthly',
      name: 'Monthly Revenue Growth',
      value: `${input.revenueGrowthMonthlyPercent}%`,
      unit: '%/mo',
      source: 'user',
      description: 'Monthly compounding revenue expansion assumption.',
      isEditable: true,
    },
    {
      id: 'gross_margin',
      name: 'Gross Margin',
      value: `${input.grossMarginPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Percentage of revenue remaining after direct cost of goods sold.',
      isEditable: true,
    },
    {
      id: 'fixed_overhead',
      name: 'Monthly Fixed Costs',
      value: initialMonthlyFixedCosts,
      unit: 'Monthly',
      source: 'user',
      description: 'Total of rent, salaries, software, and marketing.',
      isEditable: true,
    },
  ];

  return {
    scenarioId,
    scenarioName,
    scenarioType,
    dimensions,
    riskProfile,
    breakEven,
    projections,
    assumptions,
    categorySpecificResults: {
      initialMonthlyBurn: Math.round(initialMonthlyBurn),
      estimatedRunwayMonths: monthsRunway,
      monthlyBreakEvenRevenueRequired: Math.round(monthlyBreakEvenRevenueRequired),
      breakEvenMonthAchieved: breakEvenMonthAchieved ?? 'Not within simulation',
      finalMonthlyRevenue: Math.round(monthlyData[monthlyData.length - 1]?.revenue ?? 0),
      finalCashBalance: Math.round(cashBalance),
      totalProfitLossGenerated: Math.round(cumulativeProfitLoss),
    },
  };
}
