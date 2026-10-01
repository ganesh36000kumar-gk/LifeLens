import { MajorPurchaseDecisionInput } from '../../../schemas/decisionSchemas';
import {
  calculateEmi,
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

export function calculateMajorPurchaseDecision(
  input: MajorPurchaseDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const emiResult = calculateEmi(
    input.financingLoanAmount,
    input.loanInterestRatePercent,
    input.loanTenureMonths
  );

  const annualOperatingTotal = input.annualOperatingAndMaintenanceCost + input.annualInsuranceOrWarrantyCost;
  const monthlyOperating = annualOperatingTotal / 12;

  const totalFinancingInterest = emiResult.totalInterest;
  const totalPurchaseAndFinancingCost = input.financingDownPayment + emiResult.totalRepayment;
  const totalOperatingOverLifespan = annualOperatingTotal * input.expectedLifespanYears;
  const totalCostOfOwnership = totalPurchaseAndFinancingCost + totalOperatingOverLifespan - input.estimatedResaleValueAtEnd;

  const costPerYear = totalCostOfOwnership / input.expectedLifespanYears;
  const costPerMonth = costPerYear / 12;

  const opportunityCost = calculateOpportunityCost(
    input.financingDownPayment,
    emiResult.monthlyEmi + monthlyOperating,
    input.alternativeInvestmentReturnPercent,
    input.expectedLifespanYears
  );

  // Projections
  const projections: YearProjectionPoint[] = [];
  let cumulativeOutflow = input.financingDownPayment;

  for (let year = 1; year <= input.expectedLifespanYears; year++) {
    const isLoanActive = (year * 12) <= input.loanTenureMonths;
    const loanAnnualOutflow = isLoanActive ? emiResult.monthlyEmi * 12 : 0;
    const operatingAnnualOutflow = annualOperatingTotal * Math.pow(1 + input.inflationRatePercent / 100, year - 1);
    const annualOutflow = loanAnnualOutflow + operatingAnnualOutflow;
    cumulativeOutflow += annualOutflow;

    const remainingValue = Math.max(
      input.estimatedResaleValueAtEnd,
      input.purchaseCost * (1 - (year / input.expectedLifespanYears) * 0.85)
    );

    const { realValue: realOutflow } = adjustForInflation(cumulativeOutflow, input.inflationRatePercent, year);

    projections.push({
      year,
      nominalCost: cumulativeOutflow - remainingValue,
      realCost: realOutflow,
      cashOutflowAnnual: annualOutflow,
      cashInflowAnnual: year === input.expectedLifespanYears ? input.estimatedResaleValueAtEnd : 0,
      netCashFlow: -annualOutflow,
      assetEquityValue: remainingValue,
      opportunityCostCompounded: calculateOpportunityCost(
        input.financingDownPayment,
        monthlyOperating,
        input.alternativeInvestmentReturnPercent,
        year
      ).futureValueOpportunityCost,
      remainingDebtBalance: isLoanActive ? Math.max(0, input.financingLoanAmount - (emiResult.monthlyEmi * 12 * year * 0.7)) : 0,
    });
  }

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: input.purchaseCost > 1000000 ? 'HIGH' : input.purchaseCost > 300000 ? 'MEDIUM' : 'LOW',
      reason: `Outlay of ${Math.round(input.purchaseCost).toLocaleString()} represents significant capital expenditure.`,
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: (emiResult.monthlyEmi + monthlyOperating) > 30000 ? 'HIGH' : 'LOW',
      reason: `Ongoing monthly cash commitment is ${Math.round(emiResult.monthlyEmi + monthlyOperating).toLocaleString()}.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: input.financingDownPayment > 200000 ? 'MEDIUM' : 'LOW',
      reason: `Locks ${Math.round(input.financingDownPayment).toLocaleString()} in illiquid physical consumer asset.`,
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: 'LOW',
      reason: 'Cost calculations are derived from purchase invoice and financing terms.',
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: input.expectedLifespanYears > 10 ? 'MEDIUM' : 'LOW',
      reason: `Equipment durability assumed over ${input.expectedLifespanYears} years.`,
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: opportunityCost.netOpportunityCost > input.purchaseCost * 0.6 ? 'HIGH' : 'MEDIUM',
      reason: `Alternative compounding value of capital is ${Math.round(opportunityCost.futureValueOpportunityCost).toLocaleString()}.`,
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: 'MEDIUM',
      reason: 'Consumer durable equipment suffers high immediate retail markup depreciation upon delivery.',
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: 'LOW',
      reason: 'Asset serves a specific utility need.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: totalCostOfOwnership,
    monthlyCashFlowImpact: -(emiResult.monthlyEmi + monthlyOperating),
    longTermNetValue: -totalCostOfOwnership,
    liquidityImpactTotal: input.financingDownPayment,
    riskExposureLevel: input.purchaseCost > 1000000 ? 'HIGH' : 'LOW',
    flexibilityRating: 'MEDIUM',
    timeCommitmentHoursPerWeek: 1,
    incomePotentialAnnual: 0,
    opportunityCostTotal: opportunityCost.futureValueOpportunityCost,
    reversibility: 'MODERATE',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: false,
    breakEvenPeriodMonths: null,
    breakEvenPeriodYears: null,
    breakEvenMetricName: 'Not Applicable',
    explanation: 'Discretionary durable purchase for utility or lifestyle; does not generate direct revenue to recover acquisition cost.',
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'lifespan',
      name: 'Expected Usable Lifespan',
      value: `${input.expectedLifespanYears} years`,
      unit: 'Years',
      source: 'user',
      description: 'Useful life of the asset before replacement or scrap.',
      isEditable: true,
    },
    {
      id: 'resale_salvage',
      name: 'Salvage / Resale Value',
      value: input.estimatedResaleValueAtEnd,
      unit: 'Amount',
      source: 'estimated',
      description: 'Projected liquidation or trade-in value at end of lifespan.',
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
      totalCostOfOwnership: Math.round(totalCostOfOwnership),
      costPerMonthAverage: Math.round(costPerMonth),
      costPerYearAverage: Math.round(costPerYear),
      totalFinancingInterest: Math.round(totalFinancingInterest),
      monthlyFinancingEmi: Math.round(emiResult.monthlyEmi),
      opportunityCostCompounded: Math.round(opportunityCost.futureValueOpportunityCost),
    },
  };
}
