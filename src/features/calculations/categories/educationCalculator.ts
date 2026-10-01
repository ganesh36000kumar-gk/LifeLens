import { EducationDecisionInput } from '../../../schemas/decisionSchemas';
import { calculateEmi, adjustForInflation } from '../core/financialMath';
import {
  DecisionDimensions,
  RiskProfile,
  BreakEvenResult,
  YearProjectionPoint,
  AssumptionItem,
  ScenarioCalculationResult,
} from '../../../types/decision';

export function calculateEducationDecision(
  input: EducationDecisionInput,
  scenarioId = 'base',
  scenarioName = 'Base Scenario',
  scenarioType: 'base' | 'conservative' | 'expected' | 'optimistic' | 'stress' | 'custom' = 'base'
): ScenarioCalculationResult {
  const directStudyCost = input.tuitionTotal + (input.livingCostsAnnual * input.programDurationYears) + input.booksAndSuppliesTotal + input.travelRelocationOneTime;
  const lostIncomeTotal = input.currentIncomeAnnualForfeited * input.programDurationYears;
  const totalInvestment = directStudyCost + lostIncomeTotal;

  // Education loan financing
  const loanTenureMonths = input.loanRepaymentTenureYears * 12;
  const emiResult = calculateEmi(input.financingLoanAmount, input.loanInterestRatePercent, loanTenureMonths);
  const totalLoanInterest = emiResult.totalInterest;

  const totalEffectiveCost = totalInvestment + totalLoanInterest;

  // Projection year by year
  const projections: YearProjectionPoint[] = [];
  let cumulativeNoStudyEarnings = 0;
  let cumulativeWithStudyEarnings = -directStudyCost;
  let remainingLoanBalance = input.financingLoanAmount;

  let noStudySalaryTrack = input.currentIncomeAnnualForfeited;
  let postGradSalaryTrack = input.expectedPostEducationIncomeAnnual;

  let breakEvenYear: number | null = null;
  const studyYears = Math.ceil(input.programDurationYears);

  for (let year = 1; year <= input.evaluationHorizonYears; year++) {
    // Baseline if not studying
    cumulativeNoStudyEarnings += noStudySalaryTrack;

    // With degree track
    let annualEarningsWithStudy = 0;
    let annualLoanPayment = 0;

    if (year <= studyYears) {
      annualEarningsWithStudy = 0; // Studying
    } else {
      annualEarningsWithStudy = postGradSalaryTrack;
      postGradSalaryTrack *= (1 + input.expectedPostGradSalaryGrowthPercent / 100);

      const repaymentYear = year - studyYears;
      if (repaymentYear <= input.loanRepaymentTenureYears && input.financingLoanAmount > 0) {
        annualLoanPayment = emiResult.monthlyEmi * 12;
        const amort = emiResult.amortizationSummary.find((s) => s.year === repaymentYear);
        remainingLoanBalance = amort ? amort.endingBalance : 0;
      } else {
        remainingLoanBalance = 0;
      }
    }

    cumulativeWithStudyEarnings += (annualEarningsWithStudy - annualLoanPayment);

    if (breakEvenYear === null && year > studyYears && cumulativeWithStudyEarnings >= cumulativeNoStudyEarnings) {
      breakEvenYear = year;
    }

    const netAdvantage = cumulativeWithStudyEarnings - cumulativeNoStudyEarnings;
    const { realValue: realAdvantage } = adjustForInflation(netAdvantage, input.inflationRatePercent, year);

    projections.push({
      year,
      nominalCost: cumulativeNoStudyEarnings,
      realCost: realAdvantage,
      cashOutflowAnnual: annualLoanPayment + (year <= studyYears ? (directStudyCost / studyYears) : 0),
      cashInflowAnnual: annualEarningsWithStudy,
      netCashFlow: annualEarningsWithStudy - annualLoanPayment,
      assetEquityValue: Math.max(0, netAdvantage),
      opportunityCostCompounded: cumulativeNoStudyEarnings,
      remainingDebtBalance: remainingLoanBalance,
    });

    noStudySalaryTrack *= (1 + input.preGradSalaryGrowthPercent / 100);
  }

  const postGradIncomeDelta = input.expectedPostEducationIncomeAnnual - input.currentIncomeAnnualForfeited;
  const breakEvenPostGradYears = breakEvenYear ? breakEvenYear - studyYears : null;

  const riskProfile: RiskProfile = {
    financialRisk: {
      dimension: 'Financial Risk',
      level: totalInvestment > (input.currentIncomeAnnualForfeited * 4) ? 'HIGH' : 'MEDIUM',
      reason: `Total financial commitment (direct costs + forfeited salary) equals ${(totalInvestment / Math.max(1, input.currentIncomeAnnualForfeited)).toFixed(1)}x current annual salary.`,
    },
    cashFlowRisk: {
      dimension: 'Cash Flow Risk',
      level: emiResult.monthlyEmi > (input.expectedPostEducationIncomeAnnual / 12) * 0.35 ? 'HIGH' : 'LOW',
      reason: `Post-grad loan EMI of ${Math.round(emiResult.monthlyEmi).toLocaleString()}/month constitutes ${((emiResult.monthlyEmi / Math.max(1, input.expectedPostEducationIncomeAnnual / 12)) * 100).toFixed(1)}% of expected gross monthly salary.`,
    },
    liquidityRisk: {
      dimension: 'Liquidity Risk',
      level: (directStudyCost - input.financingLoanAmount) > 500000 ? 'HIGH' : 'MEDIUM',
      reason: `Out-of-pocket self-funded capital required is ${Math.round(directStudyCost - input.financingLoanAmount).toLocaleString()}.`,
    },
    assumptionRisk: {
      dimension: 'Assumption Risk',
      level: (input.expectedPostEducationIncomeAnnual / Math.max(1, input.currentIncomeAnnualForfeited)) > 2.2 ? 'HIGH' : 'MEDIUM',
      reason: `Assumes a ${(input.expectedPostEducationIncomeAnnual / Math.max(1, input.currentIncomeAnnualForfeited)).toFixed(1)}x salary multiplier immediately following graduation.`,
    },
    durationRisk: {
      dimension: 'Duration Risk',
      level: input.programDurationYears >= 2 ? 'MEDIUM' : 'LOW',
      reason: `${input.programDurationYears} years out of the workforce creates industry re-entry timing risk.`,
    },
    opportunityCostRisk: {
      dimension: 'Opportunity Cost Risk',
      level: lostIncomeTotal > directStudyCost ? 'HIGH' : 'MEDIUM',
      reason: `Forgone income (${Math.round(lostIncomeTotal).toLocaleString()}) exceeds the actual tuition and program fees.`,
    },
    flexibilityRisk: {
      dimension: 'Flexibility Risk',
      level: 'LOW',
      reason: 'Education credentials and skills are portable, non-depreciating human capital assets.',
    },
    concentrationRisk: {
      dimension: 'Concentration Risk',
      level: 'LOW',
      reason: 'Human capital investment diversifies future earning potential.',
    },
  };

  const dimensions: DecisionDimensions = {
    financialCostTotal: totalEffectiveCost,
    monthlyCashFlowImpact: emiResult.monthlyEmi,
    longTermNetValue: cumulativeWithStudyEarnings - cumulativeNoStudyEarnings,
    liquidityImpactTotal: directStudyCost - input.financingLoanAmount,
    riskExposureLevel: totalInvestment > 2500000 ? 'HIGH' : 'MEDIUM',
    flexibilityRating: 'HIGH',
    timeCommitmentHoursPerWeek: 50, // Full-time study
    incomePotentialAnnual: input.expectedPostEducationIncomeAnnual,
    opportunityCostTotal: lostIncomeTotal,
    reversibility: 'IRREVERSIBLE',
  };

  const breakEven: BreakEvenResult = {
    isApplicable: postGradIncomeDelta > 0,
    breakEvenPeriodMonths: breakEvenYear ? breakEvenYear * 12 : null,
    breakEvenPeriodYears: breakEvenYear,
    breakEvenMetricName: 'Education ROI Total Cost Recovery',
    explanation: breakEvenYear
      ? `Under your assumptions, the total direct and opportunity costs of the degree are recovered in Year ${breakEvenYear} (${breakEvenPostGradYears} years after graduating).`
      : `Based on the provided salary differential, the total investment is not recovered within the ${input.evaluationHorizonYears}-year evaluation period.`,
  };

  const assumptions: AssumptionItem[] = [
    {
      id: 'post_grad_salary',
      name: 'Expected Post-Grad Salary',
      value: input.expectedPostEducationIncomeAnnual,
      unit: 'Annual',
      source: 'user',
      description: 'Expected starting compensation upon completion. Not guaranteed by educational institutions.',
      isEditable: true,
    },
    {
      id: 'forfeited_salary',
      name: 'Opportunity Cost of Time',
      value: lostIncomeTotal,
      unit: 'Total',
      source: 'user',
      description: 'Income forgone during study period.',
      isEditable: false,
    },
    {
      id: 'inflation_rate',
      name: 'Inflation Rate',
      value: `${input.inflationRatePercent}%`,
      unit: '%',
      source: 'default',
      description: 'Used to discount long-term future earnings.',
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
      directStudyCost: Math.round(directStudyCost),
      lostIncomeTotal: Math.round(lostIncomeTotal),
      totalInvestment: Math.round(totalInvestment),
      monthlyLoanEmi: Math.round(emiResult.monthlyEmi),
      totalLoanInterest: Math.round(totalLoanInterest),
      breakEvenYearFromStart: breakEvenYear ?? 'Not within horizon',
      breakEvenYearsPostGrad: breakEvenPostGradYears ?? 'Not within horizon',
      tenYearCumulativeAdvantage: Math.round(projections[Math.min(9, projections.length - 1)]?.assetEquityValue ?? 0),
    },
  };
}
