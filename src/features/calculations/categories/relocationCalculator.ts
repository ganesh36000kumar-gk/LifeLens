import { RelocationDecisionInput } from '../../../schemas/decisionSchemas';
import { adjustForInflation } from '../core/financialMath';
import {
  DecisionDimensions,
  RiskProfile,
  BreakEvenResult,
  YearProjectionPoint,
  AssumptionItem,
  ScenarioCalculationResult,
} from '../../../types/decision';

export function calculateRelocationDecision(
  input: RelocationDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const currentTotalMonthlyCost =
    input.currentMonthlyRent +
    input.currentMonthlyUtilities +
    input.currentMonthlyFoodGrocery +
    input.currentMonthlyTransit;

  const targetTotalMonthlyCost =
    input.targetMonthlyRent +
    input.targetMonthlyUtilities +
    input.targetMonthlyFoodGrocery +
    input.targetMonthlyTransit;

  const monthlyCostDifference = targetTotalMonthlyCost - currentTotalMonthlyCost; // positive = more expensive
  const monthlyIncomeDifference = input.expectedTargetMonthlyIncome - input.currentMonthlyIncome;
  const netMonthlySurplusChange = monthlyIncomeDifference - monthlyCostDifference;

  const upfrontOneTimeCost = input.oneTimeMovingExpenses + input.oneTimeRentalDepositDifference;

  // Break even months to recover upfront moving costs
  let breakEvenMonth: number | null = null;
  if (netMonthlySurplusChange > 0 && upfrontOneTimeCost > 0) {
    breakEvenMonth = Math.ceil(upfrontOneTimeCost / netMonthlySurplusChange);
  } else if (upfrontOneTimeCost === 0 && netMonthlySurplusChange >= 0) {
    breakEvenMonth = 0;
  }

  // Yearly projections
  const projections: YearProjectionPoint[] = [];
  let cumulativeCurrentSurplus = 0;
  let cumulativeTargetSurplus = -upfrontOneTimeCost;
  let currentIncomeTrack = input.currentMonthlyIncome * 12;
  let targetIncomeTrack = input.expectedTargetMonthlyIncome * 12;

  for (let year = 1; year <= input.planningHorizonYears; year++) {
    const currentCostAnnual = currentTotalMonthlyCost * 12 * Math.pow(1.06, year - 1);
    const targetCostAnnual = targetTotalMonthlyCost * 12 * Math.pow(1.06, year - 1);

    cumulativeCurrentSurplus += (currentIncomeTrack - currentCostAnnual);
    cumulativeTargetSurplus += (targetIncomeTrack - targetCostAnnual);

    const netAdvantage = cumulativeTargetSurplus - cumulativeCurrentSurplus;
    const { realValue: realAdvantage } = adjustForInflation(netAdvantage, 6, year);

    projections.push({
      year,
      nominalCost: targetCostAnnual,
      realCost: realAdvantage,
      cashOutflowAnnual: targetCostAnnual,
      cashInflowAnnual: targetIncomeTrack,
      netCashFlow: (targetIncomeTrack - targetCostAnnual) - (currentIncomeTrack - currentCostAnnual),
      assetEquityValue: Math.max(0, netAdvantage),
      opportunityCostCompounded: cumulativeCurrentSurplus,
      remainingDebtBalance: 0,
    });

    currentIncomeTrack *= (1 + input.annualSalaryGrowthPercent / 100);
    targetIncomeTrack *= (1 + input.annualSalaryGrowthPercent / 100);
  }

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: targetTotalMonthlyCost > currentTotalMonthlyCost * 1.4 ? 'HIGH' : 'LOW',
      reason: `Monthly living costs increase by ${Math.round(monthlyCostDifference).toLocaleString()} (${((targetTotalMonthlyCost / Math.max(1, currentTotalMonthlyCost) - 1) * 100).toFixed(1)}%).`,
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: netMonthlySurplusChange < 0 ? 'HIGH' : 'LOW',
      reason: netMonthlySurplusChange < 0
        ? 'Relocation reduces your monthly net savings after higher local living expenses.'
        : `Relocation improves monthly net savings by ${Math.round(netMonthlySurplusChange).toLocaleString()}.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: upfrontOneTimeCost > 200000 ? 'HIGH' : 'LOW',
      reason: `One-time moving and rental deposits require ${Math.round(upfrontOneTimeCost).toLocaleString()} upfront liquid cash.`,
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: 'MEDIUM',
      reason: 'Rent and utility costs in the target location are estimates and subject to landlord pricing or seasonal fluctuations.',
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: input.planningHorizonYears < 2 ? 'HIGH' : 'LOW',
      reason: input.planningHorizonYears < 2
        ? 'Relocating for under 2 years rarely amortizes moving friction and lease deposits.'
        : 'Sufficient duration to absorb setup costs.',
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: 'LOW',
      reason: 'Relocation expands geographic career and lifestyle horizons.',
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: 'MEDIUM',
      reason: '11-12 month residential lease locks down geographic mobility.',
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: 'LOW',
      reason: 'Living expenditure is distributed across regular consumables.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: upfrontOneTimeCost + (targetTotalMonthlyCost * 12 * input.planningHorizonYears),
    monthlyCashFlowImpact: netMonthlySurplusChange,
    longTermNetValue: cumulativeTargetSurplus - cumulativeCurrentSurplus,
    liquidityImpactTotal: upfrontOneTimeCost,
    riskExposureLevel: netMonthlySurplusChange < 0 ? 'HIGH' : 'LOW',
    flexibilityRating: 'MEDIUM',
    timeCommitmentHoursPerWeek: 5, // Relocation logistics
    incomePotentialAnnual: input.expectedTargetMonthlyIncome * 12,
    opportunityCostTotal: cumulativeCurrentSurplus,
    reversibility: 'MODERATE',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: upfrontOneTimeCost > 0,
    breakEvenPeriodMonths: breakEvenMonth,
    breakEvenPeriodYears: breakEvenMonth ? Number((breakEvenMonth / 12).toFixed(1)) : null,
    breakEvenMetricName: 'One-Time Moving Cost Recovery',
    explanation: upfrontOneTimeCost > 0
      ? (breakEvenMonth
        ? `Upfront relocation expenses of ${Math.round(upfrontOneTimeCost).toLocaleString()} are recovered in ${breakEvenMonth} months via higher net disposable income.`
        : 'Target location monthly expenses consume the salary increase; moving costs are not recovered.')
      : 'No upfront move cost; net financial impact takes effect in month 1.',
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'target_rent',
      name: 'Target Location Rent',
      value: input.targetMonthlyRent,
      unit: 'Monthly',
      source: 'user',
      description: 'Housing cost in target city provided by user.',
      isEditable: true,
    },
    {
      id: 'salary_growth',
      name: 'Salary Growth',
      value: `${input.annualSalaryGrowthPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Annual salary growth rate assumed in new location.',
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
      currentMonthlyLivingCost: Math.round(currentTotalMonthlyCost),
      targetMonthlyLivingCost: Math.round(targetTotalMonthlyCost),
      monthlyCostDifferential: Math.round(monthlyCostDifference),
      monthlyIncomeDifferential: Math.round(monthlyIncomeDifference),
      netMonthlySurplusChange: Math.round(netMonthlySurplusChange),
      upfrontRelocationOutflow: Math.round(upfrontOneTimeCost),
      breakEvenMonths: breakEvenMonth ?? 'Never',
    },
  };
}
