import { z } from 'zod';

// Helper for positive numbers
export const positiveNumber = (fieldName: string, max = 100_000_000_000) =>
  z.number()
  .refine((val) => !isNaN(val) && isFinite(val), {
    message: `${fieldName} cannot be NaN or Infinity.`,
  })
  .refine((val) => val >= 0, {
    message: `${fieldName} cannot be negative.`,
  })
  .refine((val) => val <= max, {
    message: `${fieldName} exceeds maximum allowable limit (${max.toLocaleString()}).`,
  });

export const strictlyPositiveNumber = (fieldName: string, max = 100_000_000_000) =>
  z.number()
  .refine((val) => !isNaN(val) && isFinite(val), {
    message: `${fieldName} cannot be NaN or Infinity.`,
  })
  .refine((val) => val > 0, {
    message: `${fieldName} must be greater than zero.`,
  })
  .refine((val) => val <= max, {
    message: `${fieldName} exceeds maximum allowable limit (${max.toLocaleString()}).`,
  });

export const percentageNumber = (fieldName: string) =>
  z.number()
  .refine((val) => !isNaN(val) && isFinite(val), {
    message: `${fieldName} cannot be NaN or Infinity.`,
  })
  .refine((val) => val >= 0 && val <= 100, {
    message: `${fieldName} must be between 0% and 100%.`,
  });

// 1. CAR / VEHICLE SCHEMA
export const CarDecisionInputSchema = z.object({
  vehicleName: z.string().min(1, 'Vehicle name or model is required.'),
  purchasePrice: strictlyPositiveNumber('Purchase price'),
  downPayment: positiveNumber('Down payment'),
  loanInterestRatePercent: percentageNumber('Loan interest rate'),
  loanTenureYears: z.number().int().min(0).max(10, 'Loan tenure must be between 0 and 10 years.'),
  fuelCostMonthly: positiveNumber('Monthly fuel / electricity cost'),
  insuranceAnnual: positiveNumber('Annual insurance'),
  maintenanceAnnual: positiveNumber('Annual maintenance'),
  parkingTollMonthly: positiveNumber('Monthly parking and tolls'),
  registrationOneTime: positiveNumber('One-time registration and tax'),
  annualUsageKm: strictlyPositiveNumber('Expected annual usage in km', 200_000),
  ownershipDurationYears: z.number().int().min(1).max(25, 'Ownership duration must be between 1 and 25 years.'),
  depreciationRateAnnualPercent: percentageNumber('Estimated annual depreciation rate'),
  alternativeInvestmentReturnPercent: percentageNumber('Alternative investment return assumption'),
  inflationRatePercent: percentageNumber('Annual inflation rate'),
}).refine((data) => data.downPayment <= data.purchasePrice, {
  message: 'Down payment cannot be greater than the total purchase price.',
  path: ['downPayment'],
});

export type CarDecisionInput = z.infer<typeof CarDecisionInputSchema>;

// 2. HOME PURCHASE VS RENT SCHEMA
export const HomeRentDecisionInputSchema = z.object({
  homePrice: strictlyPositiveNumber('Property purchase price'),
  downPayment: positiveNumber('Down payment'),
  loanInterestRatePercent: percentageNumber('Mortgage interest rate'),
  loanTenureYears: z.number().int().min(1).max(35, 'Mortgage tenure must be between 1 and 35 years.'),
  stampDutyRegOneTime: positiveNumber('Stamp duty and registration fees'),
  propertyTaxAnnual: positiveNumber('Annual property tax'),
  maintenanceMonthly: positiveNumber('Monthly maintenance'),
  homeInsuranceAnnual: positiveNumber('Annual homeowner insurance'),
  propertyAppreciationAnnualPercent: percentageNumber('Expected annual property appreciation'),
  // Rent alternative inputs:
  monthlyRent: strictlyPositiveNumber('Monthly rent for comparable property'),
  rentDeposit: positiveNumber('Security deposit for rental'),
  annualRentIncreasePercent: percentageNumber('Expected annual rent increase'),
  rentersInsuranceAnnual: positiveNumber('Annual renters insurance'),
  // General assumptions:
  holdingPeriodYears: z.number().int().min(1).max(40, 'Holding period must be between 1 and 40 years.'),
  investmentReturnAssumptionPercent: percentageNumber('Alternative investment return assumption'),
  inflationRatePercent: percentageNumber('Annual inflation rate'),
}).refine((data) => data.downPayment <= data.homePrice, {
  message: 'Down payment cannot exceed property price.',
  path: ['downPayment'],
});

export type HomeRentDecisionInput = z.infer<typeof HomeRentDecisionInputSchema>;

// 3. JOB / CAREER SCHEMA
export const JobCareerDecisionInputSchema = z.object({
  currentRoleTitle: z.string().min(1, 'Current role title is required.'),
  newRoleTitle: z.string().min(1, 'New role or offer title is required.'),
  currentSalaryAnnual: strictlyPositiveNumber('Current annual salary'),
  newSalaryAnnual: strictlyPositiveNumber('New annual salary offer'),
  newBonusAnnual: positiveNumber('Annual variable bonus offer'),
  relocationCostOneTime: positiveNumber('One-time relocation or setup cost'),
  currentMonthlyCommuteCost: positiveNumber('Current monthly commute cost'),
  newMonthlyCommuteCost: positiveNumber('New monthly commute cost'),
  workFromHomeSavingsMonthly: positiveNumber('Monthly remote work savings'),
  expectedAnnualSalaryGrowthCurrentPercent: percentageNumber('Current track salary growth'),
  expectedAnnualSalaryGrowthNewPercent: percentageNumber('New offer salary growth'),
  careerUpskillingInvestmentAnnual: positiveNumber('Annual career upskilling cost'),
  timeCommitmentHoursCurrentWeekly: z.number().min(1).max(120, 'Current hours per week must be between 1 and 120.'),
  timeCommitmentHoursNewWeekly: z.number().min(1).max(120, 'New hours per week must be between 1 and 120.'),
  projectionDurationYears: z.number().int().min(1).max(15, 'Projection duration must be between 1 and 15 years.'),
  inflationRatePercent: percentageNumber('Annual inflation rate'),
});

export type JobCareerDecisionInput = z.infer<typeof JobCareerDecisionInputSchema>;

// 4. EDUCATION SCHEMA
export const EducationDecisionInputSchema = z.object({
  programName: z.string().min(1, 'Program or degree name is required.'),
  programDurationYears: z.number().min(0.25).max(8, 'Program duration must be between 3 months and 8 years.'),
  tuitionTotal: strictlyPositiveNumber('Total tuition fee'),
  livingCostsAnnual: positiveNumber('Annual living expenses while studying'),
  booksAndSuppliesTotal: positiveNumber('Books, equipment, and exam fees'),
  travelRelocationOneTime: positiveNumber('Travel and setup costs'),
  financingLoanAmount: positiveNumber('Education loan amount'),
  loanInterestRatePercent: percentageNumber('Loan interest rate'),
  loanRepaymentTenureYears: z.number().int().min(0).max(20, 'Loan repayment tenure must be between 0 and 20 years.'),
  currentIncomeAnnualForfeited: positiveNumber('Current annual salary forfeited while studying'),
  expectedPostEducationIncomeAnnual: strictlyPositiveNumber('Expected annual salary after graduation'),
  expectedPostGradSalaryGrowthPercent: percentageNumber('Expected post-graduation salary growth'),
  preGradSalaryGrowthPercent: percentageNumber('Baseline salary growth if not studying'),
  evaluationHorizonYears: z.number().int().min(1).max(30, 'Horizon must be between 1 and 30 years.'),
  inflationRatePercent: percentageNumber('Annual inflation rate'),
});

export type EducationDecisionInput = z.infer<typeof EducationDecisionInputSchema>;

// 5. BUSINESS / STARTUP SCHEMA
export const BusinessDecisionInputSchema = z.object({
  businessName: z.string().min(1, 'Business name or venture description is required.'),
  initialCapitalInvestment: strictlyPositiveNumber('Initial capital / investment'),
  fixedCostsMonthly: positiveNumber('Monthly fixed overhead (rent, software, legal)'),
  employeePayrollMonthly: positiveNumber('Monthly employee payroll'),
  marketingBudgetMonthly: positiveNumber('Monthly marketing budget'),
  initialMonthlyRevenue: positiveNumber('Starting monthly revenue'),
  revenueGrowthMonthlyPercent: percentageNumber('Expected monthly revenue growth'),
  grossMarginPercent: percentageNumber('Gross profit margin percent'),
  emergencyReserveBuffer: positiveNumber('Reserve cash buffer'),
  simulationDurationMonths: z.number().int().min(6).max(120, 'Simulation duration must be between 6 and 120 months.'),
  alternativeInvestmentReturnPercent: percentageNumber('Opportunity cost return rate'),
  taxRatePercent: percentageNumber('Expected corporate/income tax rate'),
});

export type BusinessDecisionInput = z.infer<typeof BusinessDecisionInputSchema>;

// 6. LOAN / DEBT SCHEMA
export const LoanDebtDecisionInputSchema = z.object({
  debtName: z.string().min(1, 'Debt or loan name is required.'),
  outstandingPrincipal: strictlyPositiveNumber('Outstanding principal balance'),
  currentInterestRatePercent: percentageNumber('Current interest rate'),
  remainingTenureMonths: z.number().int().min(1).max(360, 'Remaining tenure must be between 1 and 360 months.'),
  extraMonthlyPayment: positiveNumber('Planned additional monthly payment'),
  lumpSumPrepaymentAmount: positiveNumber('Planned one-time lump sum prepayment'),
  prepaymentMonthNumber: z.number().int().min(0).max(360, 'Prepayment timing month'),
  refinancingProposedRatePercent: percentageNumber('Refinancing proposed rate (if evaluating)'),
  refinancingCostOneTime: positiveNumber('Refinancing processing fee / charges'),
  alternativeInvestmentReturnPercent: percentageNumber('Alternative investment return for spare funds'),
});

export type LoanDebtDecisionInput = z.infer<typeof LoanDebtDecisionInputSchema>;

// 7. INVESTMENT SCHEMA
export const InvestmentDecisionInputSchema = z.object({
  investmentTitle: z.string().min(1, 'Investment title or portfolio name is required.'),
  initialLumpSum: positiveNumber('Initial lump sum investment'),
  recurringMonthlyContribution: positiveNumber('Recurring monthly SIP / contribution'),
  annualContributionIncreasePercent: percentageNumber('Annual contribution escalation (step-up)'),
  expectedAnnualReturnPercent: percentageNumber('Expected annual compound return'),
  investmentDurationYears: z.number().int().min(1).max(50, 'Duration must be between 1 and 50 years.'),
  annualExpenseRatioPercent: percentageNumber('Annual management fee / expense ratio'),
  expectedInflationPercent: percentageNumber('Expected annual inflation rate'),
  postRetirementWithdrawalRatePercent: percentageNumber('Assumed future withdrawal rate'),
}).refine((data) => data.initialLumpSum > 0 || data.recurringMonthlyContribution > 0, {
  message: 'Either initial lump sum or recurring monthly contribution must be greater than zero.',
  path: ['recurringMonthlyContribution'],
});

export type InvestmentDecisionInput = z.infer<typeof InvestmentDecisionInputSchema>;

// 8. RELOCATION SCHEMA
export const RelocationDecisionInputSchema = z.object({
  currentCityName: z.string().min(1, 'Current location is required.'),
  targetCityName: z.string().min(1, 'Target location is required.'),
  currentMonthlyIncome: strictlyPositiveNumber('Current monthly income'),
  expectedTargetMonthlyIncome: strictlyPositiveNumber('Expected target monthly income'),
  currentMonthlyRent: positiveNumber('Current monthly rent / housing'),
  targetMonthlyRent: positiveNumber('Target location monthly rent / housing'),
  currentMonthlyUtilities: positiveNumber('Current monthly utilities and bills'),
  targetMonthlyUtilities: positiveNumber('Target monthly utilities and bills'),
  currentMonthlyFoodGrocery: positiveNumber('Current monthly food and groceries'),
  targetMonthlyFoodGrocery: positiveNumber('Target monthly food and groceries'),
  currentMonthlyTransit: positiveNumber('Current monthly transportation'),
  targetMonthlyTransit: positiveNumber('Target monthly transportation'),
  oneTimeMovingExpenses: positiveNumber('One-time moving / relocation cost'),
  oneTimeRentalDepositDifference: positiveNumber('Net additional rental deposit required'),
  planningHorizonYears: z.number().int().min(1).max(10, 'Horizon must be between 1 and 10 years.'),
  annualSalaryGrowthPercent: percentageNumber('Expected annual salary growth'),
});

export type RelocationDecisionInput = z.infer<typeof RelocationDecisionInputSchema>;

// 9. MAJOR PURCHASE SCHEMA
export const MajorPurchaseDecisionInputSchema = z.object({
  itemDescription: z.string().min(1, 'Item or asset description is required.'),
  purchaseCost: strictlyPositiveNumber('Purchase price'),
  financingDownPayment: positiveNumber('Down payment (if financed)'),
  financingLoanAmount: positiveNumber('Financed amount'),
  loanInterestRatePercent: percentageNumber('Loan interest rate (0 if paying cash)'),
  loanTenureMonths: z.number().int().min(0).max(120, 'Loan tenure in months'),
  annualOperatingAndMaintenanceCost: positiveNumber('Annual running / maintenance cost'),
  annualInsuranceOrWarrantyCost: positiveNumber('Annual insurance or extended warranty'),
  expectedLifespanYears: z.number().int().min(1).max(30, 'Expected lifespan must be between 1 and 30 years.'),
  estimatedResaleValueAtEnd: positiveNumber('Estimated resale value at end of lifespan'),
  alternativeInvestmentReturnPercent: percentageNumber('Alternative investment return for capital'),
  inflationRatePercent: percentageNumber('Annual inflation rate'),
});

export type MajorPurchaseDecisionInput = z.infer<typeof MajorPurchaseDecisionInputSchema>;

// 10. CUSTOM DECISION SCHEMA
export const CustomOptionSchema = z.object({
  optionId: z.string().min(1),
  optionName: z.string().min(1, 'Option name is required.'),
  oneTimeCapitalCost: positiveNumber('One-time capital cost'),
  monthlyRecurringCost: positiveNumber('Monthly recurring cost'),
  monthlyRecurringIncome: positiveNumber('Monthly recurring income / benefit'),
  annualIncomeGrowthPercent: percentageNumber('Annual income growth rate'),
  annualCostInflationPercent: percentageNumber('Annual cost inflation rate'),
  timeCommitmentWeeklyHours: z.number().min(0).max(168, 'Hours must be between 0 and 168.'),
  liquidityCommitted: positiveNumber('Liquidity committed'),
  reversibilityRating: z.enum(['EASY', 'MODERATE', 'DIFFICULT', 'IRREVERSIBLE']),
});

export const CustomDecisionInputSchema = z.object({
  decisionTitle: z.string().min(1, 'Decision title is required.'),
  decisionDescription: z.string().optional(),
  planningDurationYears: z.number().int().min(1).max(30, 'Duration must be between 1 and 30 years.'),
  alternativeInvestmentReturnPercent: percentageNumber('Alternative capital return rate'),
  options: z.array(CustomOptionSchema).min(2, 'At least 2 options are required.').max(5, 'Maximum 5 options allowed.'),
});

export type CustomDecisionInput = z.infer<typeof CustomDecisionInputSchema>;

// AI Explanation Response Schema (Strictly Section 29)
export const AiExplanationResponseSchema = z.object({
  summary: z.string().min(1, 'Summary must not be empty.'),
  whatNumbersShow: z.array(z.string()).min(1, 'Must contain what numbers show.'),
  keyAssumptions: z.array(z.string()).min(1, 'Must contain key assumptions.'),
  tradeoffs: z.array(z.string()).min(1, 'Must contain trade-offs.'),
  risks: z.array(z.string()).min(1, 'Must contain risks.'),
  sensitivityFactors: z.array(z.string()).min(1, 'Must contain sensitivity factors.'),
  questionsToConsider: z.array(z.string()).min(1, 'Must contain questions to consider.'),
  generationSource: z.enum(['gemini', 'deterministic-fallback']).optional(),
});
