import { LoanDebtDecisionInput } from '../../../schemas/decisionSchemas';
import {
  calculateEmi,
  calculatePrepaymentImpact,
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

export function calculateLoanDebtDecision(
  input: LoanDebtDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const baseEmiResult = calculateEmi(
    input.outstandingPrincipal,
    input.currentInterestRatePercent,
    input.remainingTenureMonths
  );

  const prepaymentResult = calculatePrepaymentImpact(
    input.outstandingPrincipal,
    input.currentInterestRatePercent,
    input.remainingTenureMonths,
    input.extraMonthlyPayment,
    input.lumpSumPrepaymentAmount,
    input.prepaymentMonthNumber
  );

  // Refinancing evaluation
  let refinancingInterestSaved = 0;
  let refinancingNetSavings = 0;
  let refinancingBreakEvenMonths: number | null = null;

  if (input.refinancingProposedRatePercent > 0 && input.refinancingProposedRatePercent < input.currentInterestRatePercent) {
    const refinancedEmiResult = calculateEmi(
      input.outstandingPrincipal,
      input.refinancingProposedRatePercent,
      input.remainingTenureMonths
    );
    refinancingInterestSaved = Math.max(0, baseEmiResult.totalInterest - refinancedEmiResult.totalInterest);
    refinancingNetSavings = refinancingInterestSaved - input.refinancingCostOneTime;
    const monthlyPaymentSavings = baseEmiResult.monthlyEmi - refinancedEmiResult.monthlyEmi;
    if (monthlyPaymentSavings > 0 && input.refinancingCostOneTime > 0) {
      refinancingBreakEvenMonths = Math.ceil(input.refinancingCostOneTime / monthlyPaymentSavings);
    }
  }

  // Yearly projections
  const projections: YearProjectionPoint[] = [];
  const years = Math.ceil(input.remainingTenureMonths / 12);
  let balance = input.outstandingPrincipal;
  const monthlyRate = input.currentInterestRatePercent / 12 / 100;
  const paymentPerMonth = baseEmiResult.monthlyEmi + input.extraMonthlyPayment;

  for (let y = 1; y <= years; y++) {
    let yearInterest = 0;
    let yearPrincipalPaid = 0;

    for (let m = 1; m <= 12; m++) {
      const currentGlobalMonth = (y - 1) * 12 + m;
      if (currentGlobalMonth === input.prepaymentMonthNumber && input.lumpSumPrepaymentAmount > 0) {
        balance = Math.max(0, balance - input.lumpSumPrepaymentAmount);
      }

      if (balance > 0.01) {
        const interest = balance * monthlyRate;
        const principalPaid = Math.min(balance, paymentPerMonth - interest);
        balance = Math.max(0, balance - principalPaid);
        yearInterest += interest;
        yearPrincipalPaid += principalPaid;
      }
    }

    const { realValue: realDebt } = adjustForInflation(balance, 6, y);

    projections.push({
      year: y,
      nominalCost: yearInterest,
      realCost: realDebt,
      cashOutflowAnnual: yearPrincipalPaid + yearInterest,
      cashInflowAnnual: 0,
      netCashFlow: -(yearPrincipalPaid + yearInterest),
      assetEquityValue: Math.max(0, input.outstandingPrincipal - balance),
      opportunityCostCompounded: prepaymentResult.interestSaved,
      remainingDebtBalance: Math.max(0, balance),
    });
  }

  const effectiveInterestSaved = prepaymentResult.interestSaved + refinancingInterestSaved;

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: input.currentInterestRatePercent >= 14 ? 'HIGH' : input.currentInterestRatePercent >= 9 ? 'MEDIUM' : 'LOW',
      reason: `Interest rate of ${input.currentInterestRatePercent}% accrues high compounding interest penalty if unpaid.`,
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: (baseEmiResult.monthlyEmi + input.extraMonthlyPayment) > 50000 ? 'HIGH' : 'MEDIUM',
      reason: `Monthly debt service burden of ${Math.round(baseEmiResult.monthlyEmi + input.extraMonthlyPayment).toLocaleString()}.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: input.lumpSumPrepaymentAmount > 200000 ? 'MEDIUM' : 'LOW',
      reason: 'Lump-sum prepayments permanently lock liquidity into debt retirement.',
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: 'LOW',
      reason: 'Debt repayment schedule is mathematically contractual with zero variance in fixed-rate contracts.',
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: input.remainingTenureMonths > 120 ? 'HIGH' : input.remainingTenureMonths > 60 ? 'MEDIUM' : 'LOW',
      reason: `Remaining horizon of ${input.remainingTenureMonths} months (${(input.remainingTenureMonths / 12).toFixed(1)} years).`,
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: input.alternativeInvestmentReturnPercent > input.currentInterestRatePercent ? 'HIGH' : 'LOW',
      reason: input.alternativeInvestmentReturnPercent > input.currentInterestRatePercent
        ? `Market return assumption (${input.alternativeInvestmentReturnPercent}%) exceeds debt interest (${input.currentInterestRatePercent}%); investing capital may yield higher nominal wealth.`
        : 'Guaranteed debt payoff return exceeds expected alternative market yield.',
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: 'LOW',
      reason: 'Debt prepayment cannot be reversed once paid to lender.',
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: 'LOW',
      reason: 'Debt payoff directly removes contractual liabilities from your balance sheet.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: prepaymentResult.revisedTotalInterest,
    monthlyCashFlowImpact: -(baseEmiResult.monthlyEmi + input.extraMonthlyPayment),
    longTermNetValue: effectiveInterestSaved,
    liquidityImpactTotal: input.lumpSumPrepaymentAmount,
    riskExposureLevel: input.currentInterestRatePercent > 12 ? 'HIGH' : 'MEDIUM',
    flexibilityRating: 'MEDIUM',
    timeCommitmentHoursPerWeek: 0,
    incomePotentialAnnual: 0,
    opportunityCostTotal: prepaymentResult.interestSaved,
    reversibility: 'IRREVERSIBLE',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: input.refinancingCostOneTime > 0,
    breakEvenPeriodMonths: refinancingBreakEvenMonths,
    breakEvenPeriodYears: refinancingBreakEvenMonths ? Number((refinancingBreakEvenMonths / 12).toFixed(1)) : null,
    breakEvenMetricName: 'Refinancing Fee Recovery',
    explanation: input.refinancingCostOneTime > 0
      ? (refinancingBreakEvenMonths
        ? `Refinancing processing fee of ${Math.round(input.refinancingCostOneTime).toLocaleString()} is recouped in ${refinancingBreakEvenMonths} months through reduced monthly interest.`
        : 'Proposed refinancing interest rate does not reduce monthly payment enough to recover refinancing fee.')
      : 'No refinancing fee; prepayment accelerates debt payoff immediately.',
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'current_rate',
      name: 'Current Loan Interest Rate',
      value: `${input.currentInterestRatePercent}%`,
      unit: '%',
      source: 'user',
      description: 'Contractual annual percentage rate on current loan.',
      isEditable: true,
    },
    {
      id: 'extra_payment',
      name: 'Accelerated Monthly Payment',
      value: input.extraMonthlyPayment,
      unit: 'Monthly',
      source: 'user',
      description: 'Voluntary extra payment applied directly to reduce principal.',
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
      monthlyEmiOriginal: Math.round(baseEmiResult.monthlyEmi),
      originalTotalInterest: Math.round(baseEmiResult.totalInterest),
      revisedTotalInterest: Math.round(prepaymentResult.revisedTotalInterest),
      interestSavedViaPrepayment: Math.round(prepaymentResult.interestSaved),
      monthsSavedViaPrepayment: prepaymentResult.monthsSaved,
      yearsSaved: Number((prepaymentResult.monthsSaved / 12).toFixed(1)),
      refinancingNetSavings: Math.round(refinancingNetSavings),
      newPayoffTenureMonths: prepaymentResult.revisedTenureMonths,
    },
  };
}
