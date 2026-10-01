import { CustomDecisionInput, CustomOptionSchema } from '../../../schemas/decisionSchemas';
import { z } from 'zod';
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

type CustomOption = z.infer<typeof CustomOptionSchema>;

export function calculateCustomOptionDecision(
  option: CustomOption,
  planningDurationYears: number,
  alternativeReturnPercent: number,
  scenarioId = 'base',
  scenarioName = 'Option Evaluation',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const projections: YearProjectionPoint[] = [];

  let cumulativeCost = option.oneTimeCapitalCost;
  let cumulativeIncome = 0;
  let currentMonthlyCost = option.monthlyRecurringCost;
  let currentMonthlyIncome = option.monthlyRecurringIncome;

  let breakEvenMonth: number | null = null;

  for (let year = 1; year <= planningDurationYears; year++) {
    const annualCost = currentMonthlyCost * 12;
    const annualIncome = currentMonthlyIncome * 12;

    cumulativeCost += annualCost;
    cumulativeIncome += annualIncome;

    if (breakEvenMonth === null && cumulativeIncome >= cumulativeCost && cumulativeCost > 0) {
      breakEvenMonth = year * 12;
    }

    const netAdvantage = cumulativeIncome - cumulativeCost;
    const { realValue: realNet } = adjustForInflation(netAdvantage, 6, year);

    projections.push({
      year,
      nominalCost: cumulativeCost,
      realCost: realNet,
      cashOutflowAnnual: annualCost,
      cashInflowAnnual: annualIncome,
      netCashFlow: annualIncome - annualCost,
      assetEquityValue: Math.max(0, netAdvantage),
      opportunityCostCompounded: calculateOpportunityCost(
        option.oneTimeCapitalCost,
        option.monthlyRecurringCost,
        alternativeReturnPercent,
        year
      ).futureValueOpportunityCost,
      remainingDebtBalance: 0,
    });

    currentMonthlyCost *= (1 + option.annualCostInflationPercent / 100);
    currentMonthlyIncome *= (1 + option.annualIncomeGrowthPercent / 100);
  }

  const netCashFlowMonthly = option.monthlyRecurringIncome - option.monthlyRecurringCost;
  const netLongTermValue = cumulativeIncome - cumulativeCost;

  const opportunityCost = calculateOpportunityCost(
    option.oneTimeCapitalCost,
    option.monthlyRecurringCost,
    alternativeReturnPercent,
    planningDurationYears
  );

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: cumulativeCost > 1500000 ? 'HIGH' : cumulativeCost > 500000 ? 'MEDIUM' : 'LOW',
      reason: `Total financial commitments amount to ${Math.round(cumulativeCost).toLocaleString()} over ${planningDurationYears} years.`,
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: netCashFlowMonthly < 0 ? (Math.abs(netCashFlowMonthly) > 25000 ? 'HIGH' : 'MEDIUM') : 'LOW',
      reason: netCashFlowMonthly < 0
        ? `Net negative recurring cash flow of ${Math.round(Math.abs(netCashFlowMonthly)).toLocaleString()}/month.`
        : `Positive net cash generation of ${Math.round(netCashFlowMonthly).toLocaleString()}/month.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: option.liquidityCommitted > 500000 ? 'HIGH' : option.liquidityCommitted > 150000 ? 'MEDIUM' : 'LOW',
      reason: `Direct liquidity commitment of ${Math.round(option.liquidityCommitted).toLocaleString()}.`,
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: option.annualIncomeGrowthPercent > 12 ? 'HIGH' : 'MEDIUM',
      reason: `Income growth assumption of ${option.annualIncomeGrowthPercent}% per year is sensitive to execution risks.`,
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: planningDurationYears > 10 ? 'MEDIUM' : 'LOW',
      reason: `${planningDurationYears}-year evaluation timeframe.`,
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: opportunityCost.futureValueOpportunityCost > cumulativeCost * 0.7 ? 'HIGH' : 'LOW',
      reason: `Alternative capital compounding yields ${Math.round(opportunityCost.futureValueOpportunityCost).toLocaleString()}.`,
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: option.reversibilityRating === 'IRREVERSIBLE' ? 'HIGH' : option.reversibilityRating === 'DIFFICULT' ? 'MEDIUM' : 'LOW',
      reason: `Option is classified as ${option.reversibilityRating} to reverse or exit.`,
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: option.liquidityCommitted > 1000000 ? 'HIGH' : 'LOW',
      reason: 'Capital concentration in this customized pathway.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: cumulativeCost,
    monthlyCashFlowImpact: netCashFlowMonthly,
    longTermNetValue: netLongTermValue,
    liquidityImpactTotal: option.liquidityCommitted,
    riskExposureLevel: riskProfile.financialRisk.level === 'HIGH' || riskProfile.cashFlowRisk.level === 'HIGH' ? 'HIGH' : 'MEDIUM',
    flexibilityRating: option.reversibilityRating === 'EASY' ? 'HIGH' : option.reversibilityRating === 'MODERATE' ? 'MEDIUM' : 'LOW',
    timeCommitmentHoursPerWeek: option.timeCommitmentWeeklyHours,
    incomePotentialAnnual: option.monthlyRecurringIncome * 12,
    opportunityCostTotal: opportunityCost.futureValueOpportunityCost,
    reversibility: option.reversibilityRating,
  };

  const breakEven: BreakEvenResult = {
    isApplicable: option.monthlyRecurringIncome > 0 && cumulativeCost > 0,
    breakEvenPeriodMonths: breakEvenMonth,
    breakEvenPeriodYears: breakEvenMonth ? Number((breakEvenMonth / 12).toFixed(1)) : null,
    breakEvenMetricName: 'Capital & Operating Outflow Recovery',
    explanation: breakEvenMonth
      ? `Under your assumptions, cumulative income overtakes cumulative total outlays in Year ${Math.ceil(breakEvenMonth / 12)}.`
      : (option.monthlyRecurringIncome > 0
        ? 'Income generated does not fully amortize total costs within the selected planning duration.'
        : 'This option does not generate financial income; break-even is not mathematically applicable.'),
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'custom_growth',
      name: 'Annual Income Growth',
      value: `${option.annualIncomeGrowthPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Annual growth rate for recurring income.',
      isEditable: true,
    },
    {
      id: 'custom_inflation',
      name: 'Annual Cost Inflation',
      value: `${option.annualCostInflationPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Annual inflation escalation on recurring outlays.',
      isEditable: true,
    },
  ];

  return {
    scenarioId,
    scenarioName: option.optionName,
    scenarioType,
    dimensions,
    riskProfile,
    breakEven,
    projections,
    assumptions,
    categorySpecificResults: {
      totalCapitalOutflow: Math.round(cumulativeCost),
      totalIncomeInflow: Math.round(cumulativeIncome),
      netGainOrLoss: Math.round(netLongTermValue),
      monthlyNetDelta: Math.round(netCashFlowMonthly),
      breakEvenYear: breakEvenMonth ? Math.ceil(breakEvenMonth / 12) : 'Not within horizon',
    },
  };
}
