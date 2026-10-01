import { HomeRentDecisionInput } from '../../../schemas/decisionSchemas';
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

export function calculateHomeVsRentDecision(
  input: HomeRentDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const mortgagePrincipal = Math.max(0, input.homePrice - input.downPayment);
  const tenureMonths = input.loanTenureYears * 12;
  const emiResult = calculateEmi(mortgagePrincipal, input.loanInterestRatePercent, tenureMonths);

  const monthlyMaintenance = input.maintenanceMonthly;
  const monthlyPropertyTax = input.propertyTaxAnnual / 12;
  const monthlyHomeInsurance = input.homeInsuranceAnnual / 12;
  const initialMonthlyBuyOutlay = emiResult.monthlyEmi + monthlyMaintenance + monthlyPropertyTax + monthlyHomeInsurance;

  const initialMonthlyRentOutlay = input.monthlyRent + input.rentersInsuranceAnnual / 12;

  // Track year-by-year projections for BUY vs RENT
  const projections: YearProjectionPoint[] = [];
  let breakEvenYear: number | null = null;

  // Rent scenario investment portfolio (down payment + stamp duty invested in market, plus monthly difference if renting is cheaper)
  let rentInvestmentPortfolio = input.downPayment + input.stampDutyRegOneTime - input.rentDeposit;
  const marketMonthlyRate = input.investmentReturnAssumptionPercent / 12 / 100;

  let cumulativeBuyOutflow = input.downPayment + input.stampDutyRegOneTime;
  let cumulativeRentOutflow = input.rentDeposit;
  let remainingMortgage = mortgagePrincipal;

  for (let year = 1; year <= input.holdingPeriodYears; year++) {
    // Current property appreciation
    const appreciatedHomeValue = calculateFutureValue(
      input.homePrice,
      input.propertyAppreciationAnnualPercent,
      year
    );

    // Amortization tracking
    if (year <= input.loanTenureYears) {
      const summary = emiResult.amortizationSummary.find((s) => s.year === year);
      remainingMortgage = summary ? summary.endingBalance : 0;
    } else {
      remainingMortgage = 0;
    }

    const homeEquity = Math.max(0, appreciatedHomeValue - remainingMortgage);

    // Annual buy outlays
    const isLoanActive = year <= input.loanTenureYears;
    const annualEmi = isLoanActive ? emiResult.monthlyEmi * 12 : 0;
    const maintenanceInflationFactor = Math.pow(1 + input.inflationRatePercent / 100, year - 1);
    const annualBuyMaintenance = (monthlyMaintenance + monthlyPropertyTax + monthlyHomeInsurance) * 12 * maintenanceInflationFactor;
    const annualBuyTotal = annualEmi + annualBuyMaintenance;
    cumulativeBuyOutflow += annualBuyTotal;

    // Annual rent outlays
    const rentInflationFactor = Math.pow(1 + input.annualRentIncreasePercent / 100, year - 1);
    const annualRentOutlay = initialMonthlyRentOutlay * 12 * rentInflationFactor;
    cumulativeRentOutflow += annualRentOutlay;

    // Simulate renting investment portfolio compounding
    const monthlyRentThisYear = (annualRentOutlay) / 12;
    const monthlyBuyThisYear = (annualBuyTotal) / 12;

    for (let m = 0; m < 12; m++) {
      const growth = rentInvestmentPortfolio * marketMonthlyRate;
      const monthlySavingsFromRenting = monthlyBuyThisYear - monthlyRentThisYear;
      rentInvestmentPortfolio += growth + monthlySavingsFromRenting;
    }

    // Net wealth comparison: Home Equity vs Rent Investment Portfolio
    const netWealthBuy = homeEquity;
    const netWealthRent = Math.max(0, rentInvestmentPortfolio + input.rentDeposit);

    if (breakEvenYear === null && netWealthBuy >= netWealthRent && year > 1) {
      breakEvenYear = year;
    }

    const { realValue: realEquity } = adjustForInflation(homeEquity, input.inflationRatePercent, year);

    projections.push({
      year,
      nominalCost: cumulativeBuyOutflow,
      realCost: realEquity,
      cashOutflowAnnual: annualBuyTotal,
      cashInflowAnnual: 0,
      netCashFlow: -annualBuyTotal,
      assetEquityValue: homeEquity,
      opportunityCostCompounded: netWealthRent,
      remainingDebtBalance: remainingMortgage,
    });
  }

  const finalAppreciatedHomeValue = calculateFutureValue(
    input.homePrice,
    input.propertyAppreciationAnnualPercent,
    input.holdingPeriodYears
  );
  const finalEquity = Math.max(0, finalAppreciatedHomeValue - remainingMortgage);

  const totalBuyingCost = cumulativeBuyOutflow;
  const totalRentingCost = cumulativeRentOutflow;

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: emiResult.totalInterest > input.homePrice * 0.5 ? 'HIGH' : 'MEDIUM',
      reason: `Mortgage financing interest totals ${Math.round(emiResult.totalInterest).toLocaleString()} over ${input.loanTenureYears} years.`,
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: initialMonthlyBuyOutlay > initialMonthlyRentOutlay * 1.5 ? 'HIGH' : 'MEDIUM',
      reason: `Initial homeownership monthly cash outflow is ${(initialMonthlyBuyOutlay / initialMonthlyRentOutlay).toFixed(1)}x the monthly rent.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: (input.downPayment + input.stampDutyRegOneTime) > 1500000 ? 'HIGH' : 'MEDIUM',
      reason: `Upfront down payment and registration tie up ${Math.round(input.downPayment + input.stampDutyRegOneTime).toLocaleString()} in illiquid property equity.`,
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: Math.abs(input.propertyAppreciationAnnualPercent - input.investmentReturnAssumptionPercent) > 4 ? 'HIGH' : 'MEDIUM',
      reason: `Outcome strongly hinges on the gap between property appreciation (${input.propertyAppreciationAnnualPercent}%) and market return (${input.investmentReturnAssumptionPercent}%).`,
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: input.holdingPeriodYears < 7 ? 'HIGH' : 'LOW',
      reason: input.holdingPeriodYears < 7
        ? 'Short holding period (<7 years) frequently fails to amortize high transaction costs (stamp duty, brokerage, interest).'
        : 'Holding period allows transaction and interest costs to amortize.',
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: rentInvestmentPortfolio > finalEquity ? 'HIGH' : 'MEDIUM',
      reason: `Renting and investing the capital difference yields an estimated ${Math.round(rentInvestmentPortfolio).toLocaleString()} portfolio under baseline assumptions.`,
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: 'HIGH',
      reason: 'Selling real estate involves high transaction friction (4-8% fees, capital gains tax, illiquidity, time to sell).',
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: 'HIGH',
      reason: 'A large proportion of net worth is concentrated into a single localized physical property.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: totalBuyingCost,
    monthlyCashFlowImpact: initialMonthlyBuyOutlay,
    longTermNetValue: finalEquity - totalBuyingCost,
    liquidityImpactTotal: input.downPayment + input.stampDutyRegOneTime,
    riskExposureLevel: 'HIGH',
    flexibilityRating: 'LOW',
    timeCommitmentHoursPerWeek: 2, // Maintenance, property management
    incomePotentialAnnual: 0,
    opportunityCostTotal: rentInvestmentPortfolio,
    reversibility: 'DIFFICULT',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: true,
    breakEvenPeriodMonths: breakEvenYear ? breakEvenYear * 12 : null,
    breakEvenPeriodYears: breakEvenYear,
    breakEvenMetricName: 'Net Wealth Parity (Equity vs Rent+Invest)',
    explanation: breakEvenYear
      ? `Under your assumptions, buying becomes financially superior to renting and investing after approximately Year ${breakEvenYear}.`
      : `Under your assumptions, buying does not exceed the wealth of renting + investing within the ${input.holdingPeriodYears}-year horizon.`,
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'prop_appreciation',
      name: 'Property Appreciation Rate',
      value: `${input.propertyAppreciationAnnualPercent}%`,
      unit: '%',
      source: 'user',
      description: 'Annual property capital appreciation assumption.',
      isEditable: true,
    },
    {
      id: 'rent_increase',
      name: 'Annual Rent Escalation',
      value: `${input.annualRentIncreasePercent}%`,
      unit: '%',
      source: 'user',
      description: 'Annual compounding rent inflation.',
      isEditable: true,
    },
    {
      id: 'investment_return',
      name: 'Market Investment Return',
      value: `${input.investmentReturnAssumptionPercent}%`,
      unit: '%',
      source: 'default',
      description: 'Benchmark return if down payment is invested in equity/mutual funds instead.',
      isEditable: true,
    },
    {
      id: 'inflation_rate',
      name: 'Inflation Rate',
      value: `${input.inflationRatePercent}%`,
      unit: '%',
      source: 'default',
      description: 'Baseline inflation rate for maintenance, taxes, and repairs.',
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
      mortgageMonthlyEmi: Math.round(emiResult.monthlyEmi),
      totalMortgageInterest: Math.round(emiResult.totalInterest),
      initialMonthlyBuyTotal: Math.round(initialMonthlyBuyOutlay),
      initialMonthlyRentTotal: Math.round(initialMonthlyRentOutlay),
      finalHomeValue: Math.round(finalAppreciatedHomeValue),
      finalHomeEquity: Math.round(finalEquity),
      finalRentInvestmentPortfolio: Math.round(rentInvestmentPortfolio),
      totalBuyingOutflow: Math.round(totalBuyingCost),
      totalRentingOutflow: Math.round(totalRentingCost),
      breakEvenYear: breakEvenYear ?? 'Not within horizon',
    },
  };
}
