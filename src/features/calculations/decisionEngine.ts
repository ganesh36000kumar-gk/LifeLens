import { DecisionCategory, CurrencyCode, SimulationResult } from '../../types/decision';
import {
  CarDecisionInputSchema,
  HomeRentDecisionInputSchema,
  JobCareerDecisionInputSchema,
  EducationDecisionInputSchema,
  BusinessDecisionInputSchema,
  LoanDebtDecisionInputSchema,
  InvestmentDecisionInputSchema,
  RelocationDecisionInputSchema,
  MajorPurchaseDecisionInputSchema,
  CustomDecisionInputSchema,
} from '../../schemas/decisionSchemas';
import { runScenarioEngine } from '../scenarios/scenarioEngine';
import { runSensitivityAnalysis } from '../sensitivity/sensitivityEngine';

export interface RunSimulationOptions {
  decisionCategory: DecisionCategory;
  title: string;
  currency?: CurrencyCode;
  inputData: any;
  scenarioIds?: string[];
  isDemo?: boolean;
}

export function validateDecisionInput(category: DecisionCategory, inputData: any) {
  switch (category) {
    case 'car':
      return CarDecisionInputSchema.safeParse(inputData);
    case 'home_rent':
      return HomeRentDecisionInputSchema.safeParse(inputData);
    case 'job_career':
      return JobCareerDecisionInputSchema.safeParse(inputData);
    case 'education':
      return EducationDecisionInputSchema.safeParse(inputData);
    case 'business':
      return BusinessDecisionInputSchema.safeParse(inputData);
    case 'loan_debt':
      return LoanDebtDecisionInputSchema.safeParse(inputData);
    case 'investment':
      return InvestmentDecisionInputSchema.safeParse(inputData);
    case 'relocation':
      return RelocationDecisionInputSchema.safeParse(inputData);
    case 'major_purchase':
      return MajorPurchaseDecisionInputSchema.safeParse(inputData);
    case 'custom':
      return CustomDecisionInputSchema.safeParse(inputData);
    default:
      throw new Error(`Unsupported category: ${category}`);
  }
}

export function runFullSimulation(options: RunSimulationOptions): SimulationResult {
  const { decisionCategory, title, currency = 'INR', inputData, scenarioIds = ['base', 'conservative', 'optimistic', 'stress'], isDemo = false } = options;

  // 1. Strict Schema Validation
  const validation = validateDecisionInput(decisionCategory, inputData);
  if (!validation.success) {
    const errorDetails = validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Validation Error: ${errorDetails}`);
  }

  const validatedData = validation.data;

  // 2. Scenario Simulation Engine (Min 2, Max 10)
  const scenarios = runScenarioEngine(decisionCategory, validatedData, scenarioIds);

  // 3. Sensitivity Engine
  const sensitivity = runSensitivityAnalysis(decisionCategory, validatedData);

  // 4. Derive duration in years
  let durationYears = 5;
  if ('ownershipDurationYears' in validatedData) durationYears = validatedData.ownershipDurationYears;
  else if ('holdingPeriodYears' in validatedData) durationYears = validatedData.holdingPeriodYears;
  else if ('projectionDurationYears' in validatedData) durationYears = validatedData.projectionDurationYears;
  else if ('evaluationHorizonYears' in validatedData) durationYears = validatedData.evaluationHorizonYears;
  else if ('simulationDurationMonths' in validatedData) durationYears = Math.ceil(validatedData.simulationDurationMonths / 12);
  else if ('investmentDurationYears' in validatedData) durationYears = validatedData.investmentDurationYears;
  else if ('planningHorizonYears' in validatedData) durationYears = validatedData.planningHorizonYears;
  else if ('expectedLifespanYears' in validatedData) durationYears = validatedData.expectedLifespanYears;
  else if ('planningDurationYears' in validatedData) durationYears = validatedData.planningDurationYears;
  else if ('remainingTenureMonths' in validatedData) durationYears = Math.ceil(validatedData.remainingTenureMonths / 12);

  return {
    decisionId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    decisionCategory,
    title,
    currency,
    timestamp: new Date().toISOString(),
    durationYears,
    scenarios,
    sensitivity,
    isDemo,
  };
}
