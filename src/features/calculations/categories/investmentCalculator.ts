import { InvestmentDecisionInput } from '../../../schemas/decisionSchemas';
import {
  calculateInvestmentGrowth,
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

export function calculateInvestmentDecision(
  input: InvestmentDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const growthResult = calculateInvestmentGrowth(
    input.initialLumpSum,
    input.recurringMonthlyContribution,
    input.expectedAnnualReturnPercent,
    input.investmentDurationYears,
    input.expectedInflationPercent,
    input.annualExpenseRatioPercent,
    input.annualContributionIncreasePercent
  );

  // Year by year projections
  const projections: YearProjectionPoint[] = [];
  const netReturnRate = Math.max(0, input.expectedAnnualReturnPercent - input.annualExpenseRatioPercent);

  for (let year = 1; year <= input.investmentDurationYears; year++) {
    const intermediate = calculateInvestmentGrowth(
      input.initialLumpSum,
      input.recurringMonthlyContribution,
      input.expectedAnnualReturnPercent,
      year,
      input.expectedInflationPercent,
      input.annualExpenseRatioPercent,
      input.annualContributionIncreasePercent
    );

    const annualContributionInYear = intermediate.totalContributions / year; // Approximate average
    const { realValue: realValueInYear } = adjustForInflation(intermediate.futureValueNominal, input.expectedInflationPercent, year);

    projections.push({
      year,
      nominalCost: intermediate.totalContributions,
      realCost: realValueInYear,
      cashOutflowAnnual: annualContributionInYear,
      cashInflowAnnual: 0,
      netCashFlow: -annualContributionInYear,
      assetEquityValue: intermediate.futureValueNominal,
      opportunityCostCompounded: intermediate.totalGrowthNominal,
      remainingDebtBalance: 0,
    });
  }

  // Safe sustainable withdrawal amount post-horizon
  const safeWithdrawalAnnualNominal = growthResult.futureValueNominal * (input.postRetirementWithdrawalRatePercent / 100);
  const safeWithdrawalMonthlyNominal = safeWithdrawalAnnualNominal / 12;
  const safeWithdrawalAnnualReal = growthResult.futureValueReal * (input.postRetirementWithdrawalRatePercent / 100);
  const safeWithdrawalMonthlyReal = safeWithdrawalAnnualReal / 12;

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: input.expectedAnnualReturnPercent > 13 ? 'HIGH' : input.expectedAnnualReturnPercent > 9 ? 'MEDIUM' : 'LOW',
      reason: input.expectedAnnualReturnPercent > 12
        ? 'High expected return assumption requires substantial exposure to volatile equity or alternative markets.'
        : 'Moderate return expectation reflects diversified asset allocation.',
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: input.recurringMonthlyContribution > 50000 ? 'MEDIUM' : 'LOW',
      reason: `Recurring monthly commitment of ${Math.round(input.recurringMonthlyContribution).toLocaleString()} requires steady monthly cash surplus.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: input.initialLumpSum > 500000 ? 'MEDIUM' : 'LOW',
      reason: 'Capital invested should not be needed for short-term emergency or liquidity requirements.',
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: input.expectedAnnualReturnPercent > 11 ? 'HIGH' : 'MEDIUM',
      reason: 'Past market returns do not guarantee future returns; sequence of returns risk is not captured in straight-line compounding.',
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: input.investmentDurationYears < 5 ? 'HIGH' : 'LOW',
      reason: input.investmentDurationYears < 5
        ? 'Short horizon (<5 years) exposes equity capital to cyclical market downturns without recovery time.'
        : 'Longer duration allows compounding and smooths market volatility.',
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: 'LOW',
      reason: 'Systematic investing in productive capital historically hedges against currency debasement.',
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: 'LOW',
      reason: 'Liquid financial securities can generally be liquidated or rebalanced without real estate friction.',
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: input.annualExpenseRatioPercent > 1.5 ? 'HIGH' : 'LOW',
      reason: `Expense ratio drag of ${input.annualExpenseRatioPercent}% significantly erodes terminal compounding wealth.`,
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: growthResult.totalContributions,
    monthlyCashFlowImpact: -input.recurringMonthlyContribution,
    longTermNetValue: growthResult.totalGrowthNominal,
    liquidityImpactTotal: input.initialLumpSum,
    riskExposureLevel: input.expectedAnnualReturnPercent > 11 ? 'HIGH' : 'LOW',
    flexibilityRating: 'HIGH',
    timeCommitmentHoursPerWeek: 0.5, // Passive investing
    incomePotentialAnnual: safeWithdrawalAnnualNominal,
    opportunityCostTotal: 0,
    reversibility: 'EASY',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: false,
    breakEvenPeriodMonths: null,
    breakEvenPeriodYears: null,
    breakEvenMetricName: 'Not Applicable',
    explanation: 'Pure wealth accumulation simulation; capital contributions continuously build compounding asset equity rather than recovering sunk costs.',
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'expected_return',
      name: 'Expected Annual Return',
      value: `${input.expectedAnnualReturnPercent}%`,
      unit: '%',
      source: 'default',
      description: 'Editable benchmark assumption. Past performance does not guarantee future results.',
      isEditable: true,
    },
    {
      id: 'expense_ratio',
      name: 'Annual Expense Drag',
      value: `${input.annualExpenseRatioPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Fund management fees deducted from gross returns.',
      isEditable: true,
    },
    {
      id: 'inflation_rate',
      name: 'Annual Inflation',
      value: `${input.expectedInflationPercent}%`,
      unit: '%',
      source: 'default',
      description: 'Baseline inflation used to compute real purchasing power.',
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
      futureValueNominal: Math.round(growthResult.futureValueNominal),
      futureValueRealPurchasingPower: Math.round(growthResult.futureValueReal),
      totalContributions: Math.round(growthResult.totalContributions),
      totalGrowthNominal: Math.round(growthResult.totalGrowthNominal),
      totalGrowthReal: Math.round(growthResult.totalGrowthReal),
      purchasingPowerLossPercent: Math.round((1 - 1 / growthResult.purchasingPowerLossFactor) * 100),
      sustainableMonthlyWithdrawalNominal: Math.round(safeWithdrawalMonthlyNominal),
      sustainableMonthlyWithdrawalReal: Math.round(safeWithdrawalMonthlyReal),
    },
  };
}
