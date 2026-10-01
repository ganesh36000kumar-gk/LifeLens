import { CarDecisionInput } from '../../../schemas/decisionSchemas';
import {
  calculateEmi,
  calculateFutureValue,
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

export function calculateCarDecision(
  input: CarDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const loanPrincipal = Math.max(0, input.purchasePrice - input.downPayment);
  const loanTenureMonths = input.loanTenureYears * 12;
  const emiResult = calculateEmi(loanPrincipal, input.loanInterestRatePercent, loanTenureMonths);

  const monthlyFuel = input.fuelCostMonthly;
  const monthlyMaintenance = input.maintenanceAnnual / 12;
  const monthlyInsurance = input.insuranceAnnual / 12;
  const monthlyParking = input.parkingTollMonthly;
  const monthlyRecurringOperatingCost = monthlyFuel + monthlyMaintenance + monthlyInsurance + monthlyParking;

  // Monthly cash flow impact during loan period vs post-loan
  const monthlyCashFlowImpactDuringLoan = emiResult.monthlyEmi + monthlyRecurringOperatingCost;

  // Depreciated resale value after ownership duration
  // Depreciated value = PurchasePrice * (1 - depreciationRate)^years
  const depreciationFactor = Math.pow(1 - input.depreciationRateAnnualPercent / 100, input.ownershipDurationYears);
  const estimatedResaleValue = input.purchasePrice * Math.max(0.05, depreciationFactor);
  const totalDepreciationLoss = input.purchasePrice - estimatedResaleValue;

  // Total operating costs over ownership duration
  const totalOperatingCost = monthlyRecurringOperatingCost * 12 * input.ownershipDurationYears;
  const totalFinancingInterest = emiResult.totalInterest;
  const totalOwnershipCost =
    input.downPayment +
    emiResult.totalRepayment +
    input.registrationOneTime +
    totalOperatingCost -
    estimatedResaleValue;

  // Cost per kilometer
  const totalKmDriven = input.annualUsageKm * input.ownershipDurationYears;
  const costPerKm = totalKmDriven > 0 ? totalOwnershipCost / totalKmDriven : 0;

  // Opportunity cost of capital: down payment + monthly outlays invested instead
  const opportunityCost = calculateOpportunityCost(
    input.downPayment + input.registrationOneTime,
    monthlyCashFlowImpactDuringLoan,
    input.alternativeInvestmentReturnPercent,
    input.ownershipDurationYears
  );

  // Year-by-year projections
  const projections: YearProjectionPoint[] = [];
  let cumulativeCashOutflow = input.downPayment + input.registrationOneTime;
  let remainingLoanBalance = loanPrincipal;

  for (let year = 1; year <= input.ownershipDurationYears; year++) {
    const isLoanActive = year <= input.loanTenureYears;
    const annualLoanOutflow = isLoanActive ? emiResult.monthlyEmi * 12 : 0;
    const annualOperatingOutflow = monthlyRecurringOperatingCost * 12 * Math.pow(1 + input.inflationRatePercent / 100, year - 1);
    const annualOutflow = annualLoanOutflow + annualOperatingOutflow;
    cumulativeCashOutflow += annualOutflow;

    const currentResale = input.purchasePrice * Math.pow(1 - input.depreciationRateAnnualPercent / 100, year);
    if (isLoanActive) {
      const emiSummaryYear = emiResult.amortizationSummary.find((s) => s.year === year);
      remainingLoanBalance = emiSummaryYear ? emiSummaryYear.endingBalance : 0;
    } else {
      remainingLoanBalance = 0;
    }

    const { realValue: realOutflow } = adjustForInflation(cumulativeCashOutflow, input.inflationRatePercent, year);

    projections.push({
      year,
      nominalCost: cumulativeCashOutflow - currentResale,
      realCost: realOutflow,
      cashOutflowAnnual: annualOutflow,
      cashInflowAnnual: year === input.ownershipDurationYears ? estimatedResaleValue : 0,
      netCashFlow: -annualOutflow + (year === input.ownershipDurationYears ? estimatedResaleValue : 0),
      assetEquityValue: Math.max(0, currentResale - remainingLoanBalance),
      opportunityCostCompounded: calculateOpportunityCost(
        input.downPayment,
        monthlyCashFlowImpactDuringLoan,
        input.alternativeInvestmentReturnPercent,
        year
      ).futureValueOpportunityCost,
      remainingDebtBalance: remainingLoanBalance,
    });
  }

  // Risk profile determinations based on deterministic rules
  const downPaymentRatio = input.downPayment / input.purchasePrice;
  const isHighDepreciation = input.depreciationRateAnnualPercent >= 18;
  const isHighInterest = input.loanInterestRatePercent >= 11;

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: totalFinancingInterest > input.purchasePrice * 0.35 ? 'HIGH' : totalFinancingInterest > input.purchasePrice * 0.18 ? 'MEDIUM' : 'LOW',
      reason: `Financing interest adds ${((totalFinancingInterest / input.purchasePrice) * 100).toFixed(1)}% to total vehicle price.`,
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: monthlyCashFlowImpactDuringLoan > 40000 ? 'HIGH' : monthlyCashFlowImpactDuringLoan > 20000 ? 'MEDIUM' : 'LOW',
      reason: `Monthly ongoing cash drain is ${Math.round(monthlyCashFlowImpactDuringLoan).toLocaleString()} during loan tenure.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: input.downPayment > 500000 ? 'HIGH' : input.downPayment > 200000 ? 'MEDIUM' : 'LOW',
      reason: `Committed capital of ${Math.round(input.downPayment).toLocaleString()} is tied up in a depreciating asset.`,
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: isHighDepreciation ? 'HIGH' : 'MEDIUM',
      reason: `Resale value depends heavily on the assumed ${input.depreciationRateAnnualPercent}% annual depreciation rate.`,
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: input.loanTenureYears >= 6 ? 'HIGH' : input.loanTenureYears >= 4 ? 'MEDIUM' : 'LOW',
      reason: `${input.loanTenureYears}-year loan horizon creates extended financial obligation.`,
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: opportunityCost.netOpportunityCost > input.purchasePrice * 0.5 ? 'HIGH' : 'MEDIUM',
      reason: `Alternative market investment could have generated ${Math.round(opportunityCost.netOpportunityCost).toLocaleString()} in potential compounding.`,
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: isHighInterest && downPaymentRatio < 0.2 ? 'HIGH' : 'MEDIUM',
      reason: 'Selling financed vehicle early carries negative equity risk in initial years.',
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: input.purchasePrice > 2500000 ? 'HIGH' : 'LOW',
      reason: 'Asset exposure concentrated in a single mechanical personal vehicle.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: totalOwnershipCost,
    monthlyCashFlowImpact: monthlyCashFlowImpactDuringLoan,
    longTermNetValue: -totalOwnershipCost,
    liquidityImpactTotal: input.downPayment + input.registrationOneTime,
    riskExposureLevel: riskProfile.financialRisk.level === 'HIGH' || riskProfile.cashFlowRisk.level === 'HIGH' ? 'HIGH' : 'MEDIUM',
    flexibilityRating: downPaymentRatio < 0.2 ? 'LOW' : 'MEDIUM',
    timeCommitmentHoursPerWeek: 3, // Driving, maintenance, cleaning
    incomePotentialAnnual: 0,
    opportunityCostTotal: opportunityCost.futureValueOpportunityCost,
    reversibility: 'MODERATE',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: false,
    breakEvenPeriodMonths: null,
    breakEvenPeriodYears: null,
    breakEvenMetricName: 'Not Applicable',
    explanation: 'Personal vehicle ownership is a consumption and depreciating utility expenditure; it does not yield direct monetary revenue to generate a break-even point.',
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'depreciation_rate',
      name: 'Annual Depreciation',
      value: `${input.depreciationRateAnnualPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Expected yearly reduction in market value.',
      isEditable: true,
    },
    {
      id: 'opportunity_return',
      name: 'Alternative Investment Return',
      value: `${input.alternativeInvestmentReturnPercent}%`,
      unit: '%',
      source: 'default',
      description: 'Assumed benchmark market return for forgone capital. Not guaranteed.',
      isEditable: true,
    },
    {
      id: 'inflation_rate',
      name: 'Inflation Rate',
      value: `${input.inflationRatePercent}%`,
      unit: '%',
      source: 'default',
      description: 'Default baseline inflation applied to fuel, insurance, and maintenance.',
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
      monthlyEmi: Math.round(emiResult.monthlyEmi),
      monthlyOperatingCost: Math.round(monthlyRecurringOperatingCost),
      totalFinancingInterest: Math.round(totalFinancingInterest),
      totalDepreciationLoss: Math.round(totalDepreciationLoss),
      estimatedResaleValue: Math.round(estimatedResaleValue),
      costPerKm: Number(costPerKm.toFixed(2)),
      totalKmDriven,
      opportunityCostCompounded: Math.round(opportunityCost.futureValueOpportunityCost),
    },
  };
}
