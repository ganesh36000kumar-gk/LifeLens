import { JobCareerDecisionInput } from '../../../schemas/decisionSchemas';
import { adjustForInflation } from '../core/financialMath';
import {
  DecisionDimensions,
  RiskProfile,
  BreakEvenResult,
  YearProjectionPoint,
  AssumptionItem,
  ScenarioCalculationResult,
} from '../../../types/decision';

export function calculateJobCareerDecision(
  input: JobCareerDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const projections: YearProjectionPoint[] = [];

  let cumulativeCurrentIncome = 0;
  let cumulativeNewIncome = -input.relocationCostOneTime;
  let currentSalaryTrack = input.currentSalaryAnnual;
  let newSalaryTrack = input.newSalaryAnnual;

  let breakEvenMonth: number | null = null;
  const monthlyRelocationCost = input.relocationCostOneTime;

  for (let year = 1; year <= input.projectionDurationYears; year++) {
    // Current job net annual
    const currentCommuteAnnual = input.currentMonthlyCommuteCost * 12;
    const currentNetAnnual = currentSalaryTrack - currentCommuteAnnual;
    cumulativeCurrentIncome += currentNetAnnual;

    // New job net annual
    const newBonus = input.newBonusAnnual;
    const newCommuteAnnual = input.newMonthlyCommuteCost * 12;
    const remoteSavingsAnnual = input.workFromHomeSavingsMonthly * 12;
    const trainingExpense = input.careerUpskillingInvestmentAnnual;

    const newNetAnnual = (newSalaryTrack + newBonus + remoteSavingsAnnual) - (newCommuteAnnual + trainingExpense);
    cumulativeNewIncome += newNetAnnual;

    if (breakEvenMonth === null && cumulativeNewIncome >= cumulativeCurrentIncome) {
      breakEvenMonth = Math.round(year * 12 * (input.relocationCostOneTime / Math.max(1, newNetAnnual - currentNetAnnual)));
      if (breakEvenMonth > year * 12) breakEvenMonth = year * 12;
      if (breakEvenMonth < 1) breakEvenMonth = 1;
    }

    const netAdvantage = cumulativeNewIncome - cumulativeCurrentIncome;
    const { realValue: realAdvantage } = adjustForInflation(netAdvantage, input.inflationRatePercent, year);

    projections.push({
      year,
      nominalCost: cumulativeCurrentIncome,
      realCost: realAdvantage,
      cashOutflowAnnual: newCommuteAnnual + trainingExpense,
      cashInflowAnnual: newSalaryTrack + newBonus + remoteSavingsAnnual,
      netCashFlow: newNetAnnual - currentNetAnnual,
      assetEquityValue: Math.max(0, netAdvantage),
      opportunityCostCompounded: cumulativeCurrentIncome,
      remainingDebtBalance: 0,
    });

    // Escalate for next year
    currentSalaryTrack *= (1 + input.expectedAnnualSalaryGrowthCurrentPercent / 100);
    newSalaryTrack *= (1 + input.expectedAnnualSalaryGrowthNewPercent / 100);
  }

  const netCumulativeDifference = cumulativeNewIncome - cumulativeCurrentIncome;
  const initialMonthlyDifference =
    (input.newSalaryAnnual / 12 + input.newBonusAnnual / 12 + input.workFromHomeSavingsMonthly - input.newMonthlyCommuteCost) -
    (input.currentSalaryAnnual / 12 - input.currentMonthlyCommuteCost);

  const hoursDelta = input.timeCommitmentHoursNewWeekly - input.timeCommitmentHoursCurrentWeekly;

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: input.newSalaryAnnual < input.currentSalaryAnnual ? 'HIGH' : 'LOW',
      reason: input.newSalaryAnnual < input.currentSalaryAnnual
        ? 'Base salary decrease increases financial exposure if variable bonus is not achieved.'
        : 'Guaranteed base pay exceeds current position.',
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: input.relocationCostOneTime > (input.currentSalaryAnnual * 0.15) ? 'MEDIUM' : 'LOW',
      reason: `Relocation and transition cost is ${Math.round(input.relocationCostOneTime).toLocaleString()}.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: input.relocationCostOneTime > 150000 ? 'MEDIUM' : 'LOW',
      reason: 'Upfront relocation outlay consumes liquid emergency reserves.',
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: input.newBonusAnnual > (input.newSalaryAnnual * 0.3) ? 'HIGH' : 'MEDIUM',
      reason: 'Variable performance bonus represents a significant portion of projected compensation.',
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: 'LOW',
      reason: 'Career decisions can typically be re-evaluated within 1-2 years.',
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: netCumulativeDifference < 0 ? 'HIGH' : 'LOW',
      reason: netCumulativeDifference < 0
        ? 'Remaining in current position yields higher total projected cash flow over the selected duration.'
        : 'New position yields higher projected net cash flow under supplied growth rates.',
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: hoursDelta > 15 ? 'HIGH' : 'LOW',
      reason: `${hoursDelta > 0 ? '+' : ''}${hoursDelta} hours/week commitment affects personal and career flexibility.`,
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: 'MEDIUM',
      reason: 'Single employer income stream risk remains constant.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: input.relocationCostOneTime + (input.careerUpskillingInvestmentAnnual * input.projectionDurationYears),
    monthlyCashFlowImpact: initialMonthlyDifference,
    longTermNetValue: netCumulativeDifference,
    liquidityImpactTotal: input.relocationCostOneTime,
    riskExposureLevel: input.newBonusAnnual > (input.newSalaryAnnual * 0.25) ? 'MEDIUM' : 'LOW',
    flexibilityRating: hoursDelta > 10 ? 'LOW' : 'HIGH',
    timeCommitmentHoursPerWeek: input.timeCommitmentHoursNewWeekly,
    incomePotentialAnnual: input.newSalaryAnnual + input.newBonusAnnual,
    opportunityCostTotal: cumulativeCurrentIncome,
    reversibility: 'MODERATE',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: input.relocationCostOneTime > 0,
    breakEvenPeriodMonths: breakEvenMonth,
    breakEvenPeriodYears: breakEvenMonth ? Number((breakEvenMonth / 12).toFixed(1)) : null,
    breakEvenMetricName: 'Relocation & Transition Cost Recovery',
    explanation: input.relocationCostOneTime > 0
      ? (breakEvenMonth
        ? `One-time relocation cost of ${Math.round(input.relocationCostOneTime).toLocaleString()} is recovered in approximately ${breakEvenMonth} months.`
        : 'Net monthly gain is insufficient to recover upfront relocation cost within the projection horizon.')
      : 'No upfront relocation cost; cash flow advantage begins immediately in Year 1.',
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'current_growth',
      name: 'Current Salary Growth',
      value: `${input.expectedAnnualSalaryGrowthCurrentPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Assumed baseline annual increment in current role.',
      isEditable: true,
    },
    {
      id: 'new_growth',
      name: 'New Salary Growth',
      value: `${input.expectedAnnualSalaryGrowthNewPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Assumed annual increment in new role.',
      isEditable: true,
    },
    {
      id: 'inflation_rate',
      name: 'Inflation Rate',
      value: `${input.inflationRatePercent}%`,
      unit: '%',
      source: 'default',
      description: 'Deflator for purchasing power comparison.',
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
      initialMonthlyDifference: Math.round(initialMonthlyDifference),
      threeYearNetDelta: Math.round((projections[Math.min(2, projections.length - 1)]?.assetEquityValue ?? 0)),
      fiveYearNetDelta: Math.round((projections[Math.min(4, projections.length - 1)]?.assetEquityValue ?? 0)),
      tenYearNetDelta: Math.round((projections[Math.min(9, projections.length - 1)]?.assetEquityValue ?? 0)),
      hoursDeltaWeekly: hoursDelta,
      netCumulativeAdvantage: Math.round(netCumulativeDifference),
    },
  };
}
