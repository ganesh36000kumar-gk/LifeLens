import { DecisionCategory, SensitivityAnalysisResult, VariableSensitivity } from '../../types/decision';
import { runSingleScenarioCalculation } from '../scenarios/scenarioEngine';

export interface SensitiveVariableDefinition {
  key: string;
  label: string;
  unit: string;
}

const CATEGORY_SENSITIVITY_DRIVERS: Record<DecisionCategory, SensitiveVariableDefinition[]> = {
  car: [
    { key: 'purchasePrice', label: 'Purchase Price', unit: 'Currency' },
    { key: 'depreciationRateAnnualPercent', label: 'Annual Depreciation', unit: '%' },
    { key: 'fuelCostMonthly', label: 'Monthly Fuel Cost', unit: 'Monthly' },
    { key: 'alternativeInvestmentReturnPercent', label: 'Alternative Investment Return', unit: '%' },
  ],
  home_rent: [
    { key: 'propertyAppreciationAnnualPercent', label: 'Property Appreciation Rate', unit: '%' },
    { key: 'loanInterestRatePercent', label: 'Mortgage Interest Rate', unit: '%' },
    { key: 'monthlyRent', label: 'Monthly Rent Alternative', unit: 'Monthly' },
    { key: 'investmentReturnAssumptionPercent', label: 'Alternative Market Return', unit: '%' },
  ],
  job_career: [
    { key: 'expectedAnnualSalaryGrowthNewPercent', label: 'New Offer Salary Growth', unit: '%' },
    { key: 'newSalaryAnnual', label: 'Base Salary Offer', unit: 'Annual' },
    { key: 'newBonusAnnual', label: 'Variable Bonus', unit: 'Annual' },
    { key: 'relocationCostOneTime', label: 'Relocation Cost', unit: 'One-Time' },
  ],
  education: [
    { key: 'expectedPostEducationIncomeAnnual', label: 'Post-Grad Starting Salary', unit: 'Annual' },
    { key: 'tuitionTotal', label: 'Total Tuition', unit: 'Total' },
    { key: 'expectedPostGradSalaryGrowthPercent', label: 'Post-Grad Salary Growth', unit: '%' },
    { key: 'currentIncomeAnnualForfeited', label: 'Current Salary Forfeited', unit: 'Annual' },
  ],
  business: [
    { key: 'revenueGrowthMonthlyPercent', label: 'Monthly Revenue Growth', unit: '%' },
    { key: 'grossMarginPercent', label: 'Gross Margin', unit: '%' },
    { key: 'fixedCostsMonthly', label: 'Monthly Fixed Costs', unit: 'Monthly' },
    { key: 'initialCapitalInvestment', label: 'Initial Capital', unit: 'Capital' },
  ],
  loan_debt: [
    { key: 'currentInterestRatePercent', label: 'Loan Interest Rate', unit: '%' },
    { key: 'extraMonthlyPayment', label: 'Extra Monthly Payment', unit: 'Monthly' },
    { key: 'outstandingPrincipal', label: 'Outstanding Balance', unit: 'Balance' },
    { key: 'alternativeInvestmentReturnPercent', label: 'Alternative Investment Return', unit: '%' },
  ],
  investment: [
    { key: 'expectedAnnualReturnPercent', label: 'Expected Annual Return', unit: '%' },
    { key: 'recurringMonthlyContribution', label: 'Monthly Contribution', unit: 'Monthly' },
    { key: 'expectedInflationPercent', label: 'Inflation Rate', unit: '%' },
    { key: 'annualExpenseRatioPercent', label: 'Expense Ratio Drag', unit: '%' },
  ],
  relocation: [
    { key: 'targetMonthlyRent', label: 'Target Housing Cost', unit: 'Monthly' },
    { key: 'expectedTargetMonthlyIncome', label: 'Target Income', unit: 'Monthly' },
    { key: 'oneTimeMovingExpenses', label: 'One-Time Moving Cost', unit: 'One-Time' },
    { key: 'annualSalaryGrowthPercent', label: 'Salary Growth in Target City', unit: '%' },
  ],
  major_purchase: [
    { key: 'purchaseCost', label: 'Purchase Cost', unit: 'Price' },
    { key: 'annualOperatingAndMaintenanceCost', label: 'Annual Operating Cost', unit: 'Annual' },
    { key: 'expectedLifespanYears', label: 'Usable Lifespan', unit: 'Years' },
    { key: 'estimatedResaleValueAtEnd', label: 'Salvage / Resale Value', unit: 'Resale' },
  ],
  custom: [
    { key: 'planningDurationYears', label: 'Planning Duration', unit: 'Years' },
    { key: 'alternativeInvestmentReturnPercent', label: 'Alternative Return Rate', unit: '%' },
  ],
};

const VARIATION_PERCENTAGES = [-20, -10, 0, 10, 20];

export function runSensitivityAnalysis(
  category: DecisionCategory,
  inputData: any
): SensitivityAnalysisResult {
  const drivers = CATEGORY_SENSITIVITY_DRIVERS[category] || [];
  const variablesSensitivity: VariableSensitivity[] = [];

  for (const driver of drivers) {
    const originalValue = inputData[driver.key];
    if (typeof originalValue !== 'number' || isNaN(originalValue) || originalValue === 0) {
      continue;
    }

    const points = VARIATION_PERCENTAGES.map((pct) => {
      const variedData = JSON.parse(JSON.stringify(inputData));
      const variationFactor = 1 + pct / 100;
      let variedValue = originalValue * variationFactor;

      // Handle percentage boundary rules
      if (driver.unit === '%' && (driver.key.includes('Percent') || driver.key.includes('Rate'))) {
        variedValue = Math.min(100, Math.max(0, variedValue));
      }

      variedData[driver.key] = variedValue;

      // Calculate outcome for this variation
      const result = runSingleScenarioCalculation(category, variedData, {
        id: `sens_${driver.key}_${pct}`,
        name: `Sensitivity ${pct}%`,
        type: 'custom',
        description: '',
      });

      return {
        percentVariation: pct,
        variableValue: Number(variedValue.toFixed(2)),
        impactedOutcome: Math.round(result.dimensions.financialCostTotal || result.dimensions.longTermNetValue),
      };
    });

    const outcomes = points.map((p) => p.impactedOutcome);
    const minOutcome = Math.min(...outcomes);
    const maxOutcome = Math.max(...outcomes);
    const elasticityImpact = Math.abs(maxOutcome - minOutcome);

    variablesSensitivity.push({
      variableKey: driver.key,
      variableLabel: driver.label,
      baseValue: originalValue,
      unit: driver.unit,
      points,
      elasticityImpact,
      impactRank: 0,
    });
  }

  // Sort by highest elasticity impact (Rank 1 = most critical variable)
  variablesSensitivity.sort((a, b) => b.elasticityImpact - a.elasticityImpact);
  variablesSensitivity.forEach((v, index) => {
    v.impactRank = index + 1;
  });

  return {
    variables: variablesSensitivity,
    mostCriticalVariable: variablesSensitivity[0]?.variableLabel ?? 'None',
    leastCriticalVariable: variablesSensitivity[variablesSensitivity.length - 1]?.variableLabel ?? 'None',
  };
}
