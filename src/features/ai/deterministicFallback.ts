import { SimulationResult, AiExplanationResponse } from '../../types/decision';

/**
 * High-quality deterministic explanation generator used when:
 * 1. Offline mode
 * 2. API key is unconfigured or rate limited
 * 3. Gemini response fails Zod schema validation
 * 
 * Strict compliance: Never calculates new numbers, uses only structured results,
 * provides neutral trade-offs, and highlights critical assumptions.
 */
export function generateDeterministicExplanation(simResult: SimulationResult): AiExplanationResponse {
  const baseScenario = simResult.scenarios.find((s) => s.scenarioId === 'base') || simResult.scenarios[0];
  const conservativeScenario = simResult.scenarios.find((s) => s.scenarioType === 'conservative');
  const optimisticScenario = simResult.scenarios.find((s) => s.scenarioType === 'optimistic');

  const curr = simResult.currency === 'INR' ? '₹' : simResult.currency === 'USD' ? '$' : '€';

  const whatNumbersShow: string[] = [
    `Under Base Scenario assumptions, the projected total financial cost is approximately ${curr}${Math.round(baseScenario.dimensions.financialCostTotal).toLocaleString()} over ${simResult.durationYears} years.`,
    `Ongoing monthly cash flow impact is approximately ${curr}${Math.round(Math.abs(baseScenario.dimensions.monthlyCashFlowImpact)).toLocaleString()} per month.`,
    `Committed liquidity required upfront totals ${curr}${Math.round(baseScenario.dimensions.liquidityImpactTotal).toLocaleString()}.`,
  ];

  if (conservativeScenario && optimisticScenario) {
    const rangeLow = Math.min(conservativeScenario.dimensions.financialCostTotal, optimisticScenario.dimensions.financialCostTotal);
    const rangeHigh = Math.max(conservativeScenario.dimensions.financialCostTotal, optimisticScenario.dimensions.financialCostTotal);
    whatNumbersShow.push(
      `Scenario comparison shows an outcome range between ${curr}${Math.round(rangeLow).toLocaleString()} and ${curr}${Math.round(rangeHigh).toLocaleString()} depending on macroeconomic variance.`
    );
  }

  if (baseScenario.breakEven.isApplicable) {
    whatNumbersShow.push(baseScenario.breakEven.explanation);
  }

  const keyAssumptions = baseScenario.assumptions.map(
    (a) => `${a.name}: ${a.value} (${a.source.toUpperCase()} assumption — ${a.description})`
  );

  const tradeoffs: string[] = [
    `Cash Flow vs. Flexibility: Committing ${curr}${Math.round(baseScenario.dimensions.liquidityImpactTotal).toLocaleString()} upfront reduces short-term emergency liquidity while locking in long-term commitments.`,
    `Opportunity Cost: Choosing this allocation diverts capital that could compound to ${curr}${Math.round(baseScenario.dimensions.opportunityCostTotal).toLocaleString()} if invested in alternative market vehicles.`,
    `Reversibility: This decision is classified as having ${baseScenario.dimensions.reversibility.toLowerCase()} reversibility friction.`,
  ];

  const risks: string[] = [];
  const riskEntries = Object.values(baseScenario.riskProfile);
  riskEntries.forEach((r) => {
    if (r.level === 'HIGH' || r.level === 'MEDIUM') {
      risks.push(`[${r.level}] ${r.dimension}: ${r.reason}`);
    }
  });

  const mostCrit = simResult.sensitivity?.mostCriticalVariable || 'Key input assumptions';
  const leastCrit = simResult.sensitivity?.leastCriticalVariable || 'Minor operational variances';

  const sensitivityFactors: string[] = [
    `The model is most sensitive to '${mostCrit}', creating the widest outcome swing under ±20% variation.`,
    `Changes in '${leastCrit}' have relatively smaller leverage on the final total outcome.`,
  ];

  const questionsToConsider: string[] = [
    'How resilient is your 6-month liquid emergency fund after committing the initial upfront capital?',
    `If '${mostCrit}' underperforms your expectations by 15-20%, does the decision remain comfortable?`,
    'Does this decision preserve adequate personal and career flexibility if your priorities change in 24 months?',
    'Have you weighed the opportunity cost of what you cannot do once this capital and time are committed?',
  ];

  return {
    summary: `Simulation complete for "${simResult.title}". Based on your entered assumptions, the base scenario models a total commitment of ${curr}${Math.round(baseScenario.dimensions.financialCostTotal).toLocaleString()} with an ongoing monthly impact of ${curr}${Math.round(Math.abs(baseScenario.dimensions.monthlyCashFlowImpact)).toLocaleString()}.`,
    whatNumbersShow,
    keyAssumptions,
    tradeoffs,
    risks,
    sensitivityFactors,
    questionsToConsider,
    generationSource: 'deterministic-fallback',
  };
}
