import {
  calculateEmi,
  calculateFutureValue,
  calculateInvestmentGrowth,
  calculateOpportunityCost,
  calculatePrepaymentImpact,
} from '../features/calculations/core/financialMath';
import { runFullSimulation } from '../features/calculations/decisionEngine';

/**
 * Automated test suite for deterministic calculation engine
 */
export function runAutomatedTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`FAILED: ${testName}`);
      console.error(`Assertion failed: ${testName}`);
    }
  }

  // 1. EMI Calculations
  const emi10L = calculateEmi(1000000, 10, 60);
  // ₹10,00,000 at 10% for 5 years: EMI is ~₹21,247
  assert(Math.round(emi10L.monthlyEmi) === 21247, `EMI calculation standard: got ${Math.round(emi10L.monthlyEmi)} expected 21247`);
  assert(emi10L.totalInterest > 0 && emi10L.totalRepayment > 1000000, 'Total repayment exceeds principal');

  // Zero interest loan edge case
  const zeroInterestEmi = calculateEmi(600000, 0, 60);
  assert(zeroInterestEmi.monthlyEmi === 10000, `Zero interest EMI should be exactly 10,000: got ${zeroInterestEmi.monthlyEmi}`);
  assert(zeroInterestEmi.totalInterest === 0, 'Zero interest loan has 0 total interest');

  // 2. Prepayment Impact
  const prepay = calculatePrepaymentImpact(1000000, 10, 60, 5000, 0, 1);
  assert(prepay.interestSaved > 0, `Prepayment saves interest: saved ${prepay.interestSaved}`);
  assert(prepay.monthsSaved > 0, `Prepayment shortens tenure: months saved ${prepay.monthsSaved}`);

  // 3. Future Value
  const fv = calculateFutureValue(100000, 10, 5);
  // 100000 * (1.1)^5 = 161051
  assert(Math.round(fv) === 161051, `Future value calculation: got ${Math.round(fv)} expected 161051`);

  // 4. Investment Growth (Lump sum + monthly SIP)
  const invest = calculateInvestmentGrowth(100000, 10000, 12, 10, 6);
  assert(invest.futureValueNominal > invest.totalContributions, 'Nominal future value exceeds contributions');
  assert(invest.futureValueReal > 0, 'Real purchasing power is positive');

  // 5. Opportunity Cost
  const opp = calculateOpportunityCost(200000, 5000, 10, 5);
  assert(opp.futureValueOpportunityCost > opp.totalCapitalCommitted, 'Compounded opportunity cost exceeds nominal outlays');

  // 6. Decision Engine Integration (Car)
  const carSim = runFullSimulation({
    decisionCategory: 'car',
    title: 'Test Car',
    inputData: {
      vehicleName: 'Sedan Test',
      purchasePrice: 1500000,
      downPayment: 300000,
      loanInterestRatePercent: 9,
      loanTenureYears: 5,
      fuelCostMonthly: 5000,
      insuranceAnnual: 30000,
      maintenanceAnnual: 15000,
      parkingTollMonthly: 1500,
      registrationOneTime: 75000,
      annualUsageKm: 12000,
      ownershipDurationYears: 5,
      depreciationRateAnnualPercent: 15,
      alternativeInvestmentReturnPercent: 8,
      inflationRatePercent: 6,
    },
    scenarioIds: ['base', 'conservative'],
  });

  assert(carSim.scenarios.length >= 2, 'Car simulation returns at least 2 scenarios');
  assert(carSim.scenarios[0].dimensions.financialCostTotal > 0, 'Car total cost is computed deterministically');
  assert(carSim.sensitivity.variables.length > 0, 'Sensitivity analysis produces ranked variables');

  // 7. Determinism Check: Identical inputs produce identical output
  const carSim2 = runFullSimulation({
    decisionCategory: 'car',
    title: 'Test Car',
    inputData: {
      vehicleName: 'Sedan Test',
      purchasePrice: 1500000,
      downPayment: 300000,
      loanInterestRatePercent: 9,
      loanTenureYears: 5,
      fuelCostMonthly: 5000,
      insuranceAnnual: 30000,
      maintenanceAnnual: 15000,
      parkingTollMonthly: 1500,
      registrationOneTime: 75000,
      annualUsageKm: 12000,
      ownershipDurationYears: 5,
      depreciationRateAnnualPercent: 15,
      alternativeInvestmentReturnPercent: 8,
      inflationRatePercent: 6,
    },
    scenarioIds: ['base', 'conservative'],
  });

  assert(
    carSim.scenarios[0].dimensions.financialCostTotal === carSim2.scenarios[0].dimensions.financialCostTotal,
    'Deterministic repeatability: identical inputs yield identical outputs'
  );

  return { passed, failed, errors };
}
