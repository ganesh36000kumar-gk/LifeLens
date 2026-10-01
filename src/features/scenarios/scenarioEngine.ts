import { DecisionCategory, ScenarioCalculationResult, ScenarioType } from '../../types/decision';
import { calculateCarDecision } from '../calculations/categories/carCalculator';
import { calculateHomeVsRentDecision } from '../calculations/categories/homeVsRentCalculator';
import { calculateJobCareerDecision } from '../calculations/categories/jobCareerCalculator';
import { calculateEducationDecision } from '../calculations/categories/educationCalculator';
import { calculateBusinessDecision } from '../calculations/categories/businessCalculator';
import { calculateLoanDebtDecision } from '../calculations/categories/loanDebtCalculator';
import { calculateInvestmentDecision } from '../calculations/categories/investmentCalculator';
import { calculateRelocationDecision } from '../calculations/categories/relocationCalculator';
import { calculateMajorPurchaseDecision } from '../calculations/categories/majorPurchaseCalculator';
import { calculateCustomOptionDecision } from '../calculations/categories/customDecisionCalculator';
import { CustomDecisionInput } from '../../schemas/decisionSchemas';

export interface ScenarioModifier {
  id: string;
  name: string;
  type: ScenarioType;
  description: string;
  // Generic multiplier / delta overrides on rates
  inflationDeltaPercent?: number; // e.g. +2%
  returnDeltaPercent?: number; // e.g. -2%
  costMultiplier?: number; // e.g. 1.15 (+15% cost)
  growthDeltaPercent?: number; // e.g. -2%
}

export const PRESET_SCENARIOS: ScenarioModifier[] = [
  {
    id: 'base',
    name: 'Base (Current Assumptions)',
    type: 'base',
    description: 'Your directly entered assumptions without modification.',
    inflationDeltaPercent: 0,
    returnDeltaPercent: 0,
    costMultiplier: 1.0,
    growthDeltaPercent: 0,
  },
  {
    id: 'conservative',
    name: 'Conservative (Lower Growth, Higher Drag)',
    type: 'conservative',
    description: 'Assumes 2% lower asset/salary returns and 10% higher expenses.',
    inflationDeltaPercent: 1.5,
    returnDeltaPercent: -2.0,
    costMultiplier: 1.10,
    growthDeltaPercent: -2.0,
  },
  {
    id: 'expected',
    name: 'Expected Market Average',
    type: 'expected',
    description: 'Historical long-term market average assumptions.',
    inflationDeltaPercent: 0,
    returnDeltaPercent: 0,
    costMultiplier: 1.0,
    growthDeltaPercent: 0,
  },
  {
    id: 'optimistic',
    name: 'Optimistic (Strong Growth, Controlled Cost)',
    type: 'optimistic',
    description: 'Assumes 2% higher returns/salary growth and 5% lower ongoing costs.',
    inflationDeltaPercent: -0.5,
    returnDeltaPercent: 2.0,
    costMultiplier: 0.95,
    growthDeltaPercent: 2.0,
  },
  {
    id: 'stress',
    name: 'Stress Test (High Inflation / Slow Growth)',
    type: 'stress',
    description: 'Adverse macroeconomic conditions: +3% inflation, -3% returns, +20% costs.',
    inflationDeltaPercent: 3.0,
    returnDeltaPercent: -3.0,
    costMultiplier: 1.20,
    growthDeltaPercent: -3.5,
  },
];

/**
 * Execute calculation for a specific category and input data
 */
export function runSingleScenarioCalculation(
  category: DecisionCategory,
  inputData: any,
  modifier: ScenarioModifier
): ScenarioCalculationResult {
  const cloned = JSON.parse(JSON.stringify(inputData));

  // Apply modifiers deterministically based on category
  if (category === 'car') {
    if (modifier.costMultiplier) {
      cloned.fuelCostMonthly *= modifier.costMultiplier;
      cloned.maintenanceAnnual *= modifier.costMultiplier;
    }
    if (modifier.returnDeltaPercent) {
      cloned.alternativeInvestmentReturnPercent = Math.max(1, cloned.alternativeInvestmentReturnPercent + modifier.returnDeltaPercent);
    }
    if (modifier.inflationDeltaPercent) {
      cloned.inflationRatePercent = Math.max(1, cloned.inflationRatePercent + modifier.inflationDeltaPercent);
    }
    return calculateCarDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'home_rent') {
    if (modifier.returnDeltaPercent) {
      cloned.investmentReturnAssumptionPercent = Math.max(1, cloned.investmentReturnAssumptionPercent + modifier.returnDeltaPercent);
      cloned.propertyAppreciationAnnualPercent = Math.max(0, cloned.propertyAppreciationAnnualPercent + (modifier.returnDeltaPercent * 0.7));
    }
    if (modifier.costMultiplier) {
      cloned.maintenanceMonthly *= modifier.costMultiplier;
      cloned.annualRentIncreasePercent = Math.max(1, cloned.annualRentIncreasePercent * modifier.costMultiplier);
    }
    if (modifier.inflationDeltaPercent) {
      cloned.inflationRatePercent = Math.max(1, cloned.inflationRatePercent + modifier.inflationDeltaPercent);
    }
    return calculateHomeVsRentDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'job_career') {
    if (modifier.growthDeltaPercent) {
      cloned.expectedAnnualSalaryGrowthNewPercent = Math.max(0, cloned.expectedAnnualSalaryGrowthNewPercent + modifier.growthDeltaPercent);
    }
    if (modifier.costMultiplier) {
      cloned.newMonthlyCommuteCost *= modifier.costMultiplier;
    }
    return calculateJobCareerDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'education') {
    if (modifier.growthDeltaPercent) {
      cloned.expectedPostGradSalaryGrowthPercent = Math.max(0, cloned.expectedPostGradSalaryGrowthPercent + modifier.growthDeltaPercent);
      cloned.expectedPostEducationIncomeAnnual *= (1 + (modifier.growthDeltaPercent / 100) * 2);
    }
    if (modifier.costMultiplier) {
      cloned.livingCostsAnnual *= modifier.costMultiplier;
    }
    return calculateEducationDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'business') {
    if (modifier.growthDeltaPercent) {
      cloned.revenueGrowthMonthlyPercent = Math.max(0, cloned.revenueGrowthMonthlyPercent + (modifier.growthDeltaPercent * 0.5));
    }
    if (modifier.costMultiplier) {
      cloned.fixedCostsMonthly *= modifier.costMultiplier;
      cloned.employeePayrollMonthly *= modifier.costMultiplier;
    }
    return calculateBusinessDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'loan_debt') {
    if (modifier.costMultiplier && modifier.costMultiplier > 1) {
      cloned.currentInterestRatePercent = Math.min(30, cloned.currentInterestRatePercent + 1.5);
    }
    return calculateLoanDebtDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'investment') {
    if (modifier.returnDeltaPercent) {
      cloned.expectedAnnualReturnPercent = Math.max(1, cloned.expectedAnnualReturnPercent + modifier.returnDeltaPercent);
    }
    if (modifier.inflationDeltaPercent) {
      cloned.expectedInflationPercent = Math.max(1, cloned.expectedInflationPercent + modifier.inflationDeltaPercent);
    }
    return calculateInvestmentDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'relocation') {
    if (modifier.costMultiplier) {
      cloned.targetMonthlyRent *= modifier.costMultiplier;
      cloned.targetMonthlyFoodGrocery *= modifier.costMultiplier;
    }
    return calculateRelocationDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'major_purchase') {
    if (modifier.costMultiplier) {
      cloned.annualOperatingAndMaintenanceCost *= modifier.costMultiplier;
    }
    return calculateMajorPurchaseDecision(cloned, modifier.id, modifier.name, modifier.type);
  }

  if (category === 'custom') {
    const customInput = cloned as CustomDecisionInput;
    const optionA = customInput.options[0];
    return calculateCustomOptionDecision(
      optionA,
      customInput.planningDurationYears,
      customInput.alternativeInvestmentReturnPercent,
      modifier.id,
      `${optionA.optionName} (${modifier.name})`,
      modifier.type
    );
  }

  throw new Error(`Unsupported decision category: ${category}`);
}

/**
 * Run multiple scenarios (min 2, max 10)
 */
export function runScenarioEngine(
  category: DecisionCategory,
  inputData: any,
  selectedScenarioIds: string[] = ['base', 'conservative', 'optimistic', 'stress']
): ScenarioCalculationResult[] {
  // Always include base
  const idsToRun = Array.from(new Set(['base', ...selectedScenarioIds])).slice(0, 10);
  if (idsToRun.length < 2) {
    idsToRun.push('conservative');
  }

  return idsToRun.map((id) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === id) || {
      id,
      name: `Custom Scenario ${id}`,
      type: 'custom' as ScenarioType,
      description: 'Customized scenario projection.',
      costMultiplier: 1.0,
      inflationDeltaPercent: 0,
      returnDeltaPercent: 0,
      growthDeltaPercent: 0,
    };
    return runSingleScenarioCalculation(category, inputData, preset);
  });
}
