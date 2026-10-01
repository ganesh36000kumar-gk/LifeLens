import { GoogleGenAI, Type } from '@google/genai';
import { AiExplanationResponseSchema } from '../../src/schemas/decisionSchemas';
import { AiExplanationResponse } from '../../src/types/decision';

// Server-side initialization following @google/genai skill requirements
function getGenAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `You are the explanation assistant for Life Decision Simulator.
You are NOT the calculation engine.
You receive structured calculation results produced by a deterministic calculation engine.

Rules:
1. Never recalculate numerical values.
2. Never change numerical values.
3. Never invent missing information.
4. Never create unsupported probabilities (e.g. do not say "73% probability of success").
5. Never make guarantees.
6. Never make decisions for the user. (Do not say "You should definitely choose Option A". Use neutral language like "Under these assumptions, Scenario A offers lower monthly cash flow drain while Scenario B preserves more liquid equity").
7. Explain assumptions and distinguish user inputs vs default assumptions.
8. Explain trade-offs (e.g., liquidity vs long-term return, flexibility vs commitment).
9. Explain uncertainty and what could change the results.
10. If information is missing or incomplete, explicitly say so.
11. Do not provide a universal recommendation or score.
12. Preserve user autonomy at all times.

You must return valid JSON matching the schema with summary, whatNumbersShow, keyAssumptions, tradeoffs, risks, sensitivityFactors, and questionsToConsider.`;

export async function generateAiExplanationOnServer(
  structuredData: any
): Promise<AiExplanationResponse | null> {
  const ai = getGenAiClient();
  if (!ai) {
    console.warn('[AI Service] No valid GEMINI_API_KEY present on server. Returning null for deterministic fallback.');
    return null;
  }

  try {
    const prompt = `Here are the deterministic simulation results for the life decision "${structuredData.title}" (${structuredData.decisionCategory}):
${JSON.stringify(structuredData, null, 2)}

Provide a structured, high-trust, objective financial explanation following your instructions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for high precision and zero hallucination
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Executive neutral summary of the simulation results without making a decision for the user.',
            },
            whatNumbersShow: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Clear bullet points explaining what the calculated financial numbers specifically show.',
            },
            keyAssumptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Critical assumptions that the calculation depends upon, noting user vs default assumptions.',
            },
            tradeoffs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Major trade-offs between cash flow, long-term wealth, liquidity, flexibility, and opportunity cost.',
            },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key risk dimensions identified by the deterministic risk framework.',
            },
            sensitivityFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Which input variables have the highest leverage and outcome swing.',
            },
            questionsToConsider: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Thoughtful, non-judgmental reflective questions for the user to contemplate.',
            },
          },
          required: [
            'summary',
            'whatNumbersShow',
            'keyAssumptions',
            'tradeoffs',
            'risks',
            'sensitivityFactors',
            'questionsToConsider',
          ],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      console.warn('[AI Service] Empty response text from Gemini');
      return null;
    }

    const parsedJson = JSON.parse(text);
    const validated = AiExplanationResponseSchema.safeParse(parsedJson);

    if (validated.success) {
      return {
        ...validated.data,
        generationSource: 'gemini',
      };
    } else {
      console.warn('[AI Service] Zod schema validation failed on Gemini output:', validated.error.format());
      return null;
    }
  } catch (error) {
    console.error('[AI Service] Error generating AI explanation:', error);
    return null;
  }
}
