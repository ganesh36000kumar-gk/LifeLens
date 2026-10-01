/**
 * Deterministic Financial Calculation Engine
 * 
 * Strict Rules:
 * 1. Pure deterministic math.
 * 2. No AI estimation or stochastic random values.
 * 3. Handles division by zero, zero interest rates, and extreme values safely.
 * 4. Outputs rounded to 2 decimal places where currency or percentage is rendered,
 *    while retaining precision in intermediate steps.
 */

export interface EmiCalculationResult {
  monthlyEmi: number;
  totalRepayment: number;
  totalInterest: number;
  effectiveTotalCost: number;
  principal: number;
  tenureMonths: number;
  annualInterestRatePercent: number;
  amortizationSummary: {
    year: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
  }[];
}

export interface PrepaymentImpactResult {
  originalTotalInterest: number;
  revisedTotalInterest: number;
  interestSaved: number;
  originalTenureMonths: number;
  revisedTenureMonths: number;
  monthsSaved: number;
}

export interface CompoundGrowthResult {
  futureValueNominal: number;
  futureValueReal: number;
  totalContributions: number;
  totalGrowthNominal: number;
  totalGrowthReal: number;
  purchasingPowerLossFactor: number;
}

/**
 * Standard Equated Monthly Installment (EMI) Formula
 * EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
 */
export function calculateEmi(
  principal: number,
  annualInterestRatePercent: number,
  tenureMonths: number
): EmiCalculationResult {
  if (principal <= 0 || tenureMonths <= 0) {
    return {
      monthlyEmi: 0,
      totalRepayment: 0,
      totalInterest: 0,
      effectiveTotalCost: 0,
      principal: Math.max(0, principal),
      tenureMonths: Math.max(0, tenureMonths),
      annualInterestRatePercent,
      amortizationSummary: [],
    };
  }

  // Zero interest loan edge case
  if (annualInterestRatePercent <= 0) {
    const monthlyEmi = principal / tenureMonths;
    return {
      monthlyEmi,
      totalRepayment: principal,
      totalInterest: 0,
      effectiveTotalCost: principal,
      principal,
      tenureMonths,
      annualInterestRatePercent: 0,
      amortizationSummary: generateAmortization(principal, 0, tenureMonths, monthlyEmi),
    };
  }

  const monthlyRate = annualInterestRatePercent / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyEmi = (principal * monthlyRate * factor) / (factor - 1);
  const totalRepayment = monthlyEmi * tenureMonths;
  const totalInterest = totalRepayment - principal;

  return {
    monthlyEmi,
    totalRepayment,
    totalInterest,
    effectiveTotalCost: totalRepayment,
    principal,
    tenureMonths,
    annualInterestRatePercent,
    amortizationSummary: generateAmortization(principal, monthlyRate, tenureMonths, monthlyEmi),
  };
}

function generateAmortization(
  principal: number,
  monthlyRate: number,
  tenureMonths: number,
  monthlyEmi: number
) {
  const summary: {
    year: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
  }[] = [];

  let balance = principal;
  let currentYearPrincipal = 0;
  let currentYearInterest = 0;

  for (let m = 1; m <= tenureMonths; m++) {
    const interestForMonth = balance * monthlyRate;
    const principalForMonth = Math.min(balance, monthlyEmi - interestForMonth);
    balance = Math.max(0, balance - principalForMonth);

    currentYearPrincipal += principalForMonth;
    currentYearInterest += interestForMonth;

    if (m % 12 === 0 || m === tenureMonths) {
      const year = Math.ceil(m / 12);
      summary.push({
        year,
        principalPaid: currentYearPrincipal,
        interestPaid: currentYearInterest,
        endingBalance: balance,
      });
      currentYearPrincipal = 0;
      currentYearInterest = 0;
    }
  }

  return summary;
}

/**
 * Prepayment and Extra EMI Impact Calculation
 */
export function calculatePrepaymentImpact(
  outstandingPrincipal: number,
  annualInterestRatePercent: number,
  originalTenureMonths: number,
  extraMonthlyPayment = 0,
  oneTimeLumpSum = 0,
  prepaymentMonth = 1
): PrepaymentImpactResult {
  const baseResult = calculateEmi(outstandingPrincipal, annualInterestRatePercent, originalTenureMonths);
  const monthlyRate = annualInterestRatePercent / 12 / 100;
  const baseEmi = baseResult.monthlyEmi;

  if (baseEmi <= 0 || (extraMonthlyPayment <= 0 && oneTimeLumpSum <= 0)) {
    return {
      originalTotalInterest: baseResult.totalInterest,
      revisedTotalInterest: baseResult.totalInterest,
      interestSaved: 0,
      originalTenureMonths,
      revisedTenureMonths: originalTenureMonths,
      monthsSaved: 0,
    };
  }

  let balance = outstandingPrincipal;
  let revisedTotalInterest = 0;
  let revisedTenureMonths = 0;

  while (balance > 0.01 && revisedTenureMonths < originalTenureMonths * 2) {
    revisedTenureMonths++;
    if (revisedTenureMonths === prepaymentMonth && oneTimeLumpSum > 0) {
      balance = Math.max(0, balance - oneTimeLumpSum);
      if (balance <= 0.01) break;
    }

    const interest = balance * monthlyRate;
    revisedTotalInterest += interest;
    const payment = baseEmi + extraMonthlyPayment;
    const principalPaid = Math.min(balance, payment - interest);
    balance = Math.max(0, balance - principalPaid);
  }

  const interestSaved = Math.max(0, baseResult.totalInterest - revisedTotalInterest);
  const monthsSaved = Math.max(0, originalTenureMonths - revisedTenureMonths);

  return {
    originalTotalInterest: baseResult.totalInterest,
    revisedTotalInterest,
    interestSaved,
    originalTenureMonths,
    revisedTenureMonths,
    monthsSaved,
  };
}

/**
 * Future Value formula: FV = PV * (1 + r)^n
 */
export function calculateFutureValue(
  presentValue: number,
  annualGrowthRatePercent: number,
  years: number
): number {
  if (years <= 0) return presentValue;
  const r = annualGrowthRatePercent / 100;
  return presentValue * Math.pow(1 + r, years);
}

/**
 * Inflation Adjustments
 * Real Value = Nominal Value / (1 + inflation)^years
 */
export function adjustForInflation(
  nominalValue: number,
  annualInflationPercent: number,
  years: number
): { realValue: number; inflationDeflator: number } {
  if (years <= 0 || annualInflationPercent <= 0) {
    return { realValue: nominalValue, inflationDeflator: 1 };
  }
  const i = annualInflationPercent / 100;
  const deflator = Math.pow(1 + i, years);
  const realValue = nominalValue / deflator;
  return { realValue, inflationDeflator: deflator };
}

/**
 * Compound Growth & Investment SIP / Recurring Contributions Engine
 */
export function calculateInvestmentGrowth(
  initialLumpSum: number,
  recurringMonthlyContribution: number,
  annualReturnPercent: number,
  years: number,
  annualInflationPercent = 6,
  annualExpenseRatioPercent = 0,
  annualContributionStepUpPercent = 0
): CompoundGrowthResult {
  const months = Math.round(years * 12);
  const netAnnualReturnPercent = Math.max(0, annualReturnPercent - annualExpenseRatioPercent);
  const monthlyRate = netAnnualReturnPercent / 12 / 100;

  let balance = initialLumpSum;
  let totalContributions = initialLumpSum;
  let currentMonthlyContrib = recurringMonthlyContribution;

  for (let m = 1; m <= months; m++) {
    // Step up monthly contribution annually
    if (m > 1 && (m - 1) % 12 === 0 && annualContributionStepUpPercent > 0) {
      currentMonthlyContrib *= (1 + annualContributionStepUpPercent / 100);
    }

    const growth = balance * monthlyRate;
    balance += growth + currentMonthlyContrib;
    totalContributions += currentMonthlyContrib;
  }

  const futureValueNominal = balance;
  const { realValue: futureValueReal, inflationDeflator } = adjustForInflation(
    futureValueNominal,
    annualInflationPercent,
    years
  );

  const totalGrowthNominal = Math.max(0, futureValueNominal - totalContributions);
  const realContributions = adjustForInflation(totalContributions, annualInflationPercent, years / 2).realValue;
  const totalGrowthReal = Math.max(0, futureValueReal - realContributions);

  return {
    futureValueNominal,
    futureValueReal,
    totalContributions,
    totalGrowthNominal,
    totalGrowthReal,
    purchasingPowerLossFactor: inflationDeflator,
  };
}

/**
 * Opportunity Cost Calculator
 * Compares spending capital on Decision X vs investing the difference at an alternative return rate r.
 */
export function calculateOpportunityCost(
  upfrontCapitalDifference: number,
  monthlyCashFlowDifference: number,
  alternativeReturnRatePercent: number,
  years: number
): {
  futureValueOpportunityCost: number;
  totalCapitalCommitted: number;
  netOpportunityCost: number;
} {
  const months = Math.round(years * 12);
  const monthlyRate = alternativeReturnRatePercent / 12 / 100;

  let compBalance = upfrontCapitalDifference;
  let totalCommitted = upfrontCapitalDifference;

  for (let m = 1; m <= months; m++) {
    const interest = compBalance * monthlyRate;
    compBalance += interest + monthlyCashFlowDifference;
    totalCommitted += monthlyCashFlowDifference;
  }

  const netOpportunityCost = Math.max(0, compBalance - totalCommitted);

  return {
    futureValueOpportunityCost: compBalance,
    totalCapitalCommitted: totalCommitted,
    netOpportunityCost,
  };
}
