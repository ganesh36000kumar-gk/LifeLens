import { SimulationResult, AiExplanationResponse } from '../../types/decision';
import { AiExplanationResponseSchema } from '../../schemas/decisionSchemas';
import { generateDeterministicExplanation } from './deterministicFallback';

export async function fetchAiExplanation(
  simulationResult: SimulationResult
): Promise<AiExplanationResponse> {
  // Extract strictly structured payload (Section 27)
  const structuredPayload = {
    decisionCategory: simulationResult.decisionCategory,
    title: simulationResult.title,
    currency: simulationResult.currency,
    durationYears: simulationResult.durationYears,
    scenarios: simulationResult.scenarios.map((s) => ({
      scenarioId: s.scenarioId,
      scenarioName: s.scenarioName,
      scenarioType: s.scenarioType,
      dimensions: s.dimensions,
      breakEven: s.breakEven,
      riskLevels: Object.entries(s.riskProfile).map(([key, val]) => ({
        dimension: val.dimension,
        level: val.level,
        reason: val.reason,
      })),
      assumptions: s.assumptions.map((a) => ({
        name: a.name,
        value: a.value,
        source: a.source,
      })),
      keyMetrics: s.categorySpecificResults,
    })),
    sensitivity: {
      mostCriticalVariable: simulationResult.sensitivity.mostCriticalVariable,
      leastCriticalVariable: simulationResult.sensitivity.leastCriticalVariable,
      topVariablesRanked: simulationResult.sensitivity.variables.slice(0, 3).map((v) => ({
        name: v.variableLabel,
        elasticity: v.elasticityImpact,
      })),
    },
  };

  try {
    const res = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(structuredPayload),
    });

    if (!res.ok) {
      console.warn(`AI endpoint returned status ${res.status}, falling back to deterministic synthesis.`);
      return generateDeterministicExplanation(simulationResult);
    }

    const data = await res.json();
    const validated = AiExplanationResponseSchema.safeParse(data);

    if (validated.success) {
      return {
        ...validated.data,
        generationSource: 'gemini',
      };
    } else {
      console.warn('AI response failed schema validation:', validated.error.format());
      return generateDeterministicExplanation(simulationResult);
    }
  } catch (error) {
    console.warn('Network error reaching AI explanation endpoint, using deterministic synthesis:', error);
    return generateDeterministicExplanation(simulationResult);
  }
}
