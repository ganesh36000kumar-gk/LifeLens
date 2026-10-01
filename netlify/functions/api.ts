import { runFullSimulation } from '../../src/features/calculations/decisionEngine';
import { generateAiExplanationOnServer } from '../../server/services/geminiAiService';
import { generateDeterministicExplanation } from '../../src/features/ai/deterministicFallback';
import crypto from 'crypto';

// In-memory cache for Netlify serverless execution instances
const sharedSimulationsStore = new Map<string, any>();
const savedSimulationsStore = new Map<string, any>();

interface NetlifyEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string>;
  body: string | null;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Normalize subpath
  let subpath = event.path
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '');
  if (!subpath || subpath === '') subpath = '/';

  try {
    // 1. POST /simulate
    if (subpath === '/simulate' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { decisionCategory, title, currency, inputData, scenarioIds, isDemo } = body;

      if (!decisionCategory || !inputData) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'decisionCategory and inputData are required.' }),
        };
      }

      const result = runFullSimulation({
        decisionCategory,
        title: title || `${decisionCategory.toUpperCase()} Simulation`,
        currency: currency || 'INR',
        inputData,
        scenarioIds,
        isDemo: Boolean(isDemo),
      });

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(result),
      };
    }

    // 2. POST /ai/explain
    if (subpath === '/ai/explain' && event.httpMethod === 'POST') {
      const structuredData = event.body ? JSON.parse(event.body) : {};

      if (!structuredData || !structuredData.scenarios) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Structured calculation results are required.' }),
        };
      }

      // Try server-side Gemini AI
      const aiResult = await generateAiExplanationOnServer(structuredData);
      if (aiResult) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify(aiResult),
        };
      }

      // Graceful fallback to deterministic explanation
      const fallback = generateDeterministicExplanation(structuredData);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(fallback),
      };
    }

    // 3. POST /simulations/share
    if (subpath === '/simulations/share' && event.httpMethod === 'POST') {
      const simulation = event.body ? JSON.parse(event.body) : null;
      if (!simulation) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Simulation payload required.' }),
        };
      }

      const token = crypto.randomBytes(16).toString('hex');
      sharedSimulationsStore.set(token, {
        simulation,
        createdAt: new Date().toISOString(),
        views: 0,
      });

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ token, shareUrl: `/share/${token}` }),
      };
    }

    // 4. GET /simulations/share/:token
    if (subpath.startsWith('/simulations/share/') && event.httpMethod === 'GET') {
      const token = subpath.replace('/simulations/share/', '');
      const entry = sharedSimulationsStore.get(token);
      if (!entry) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Shared simulation link has expired or is invalid.' }),
        };
      }
      entry.views++;
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(entry.simulation),
      };
    }

    // 5. POST /simulations/save
    if (subpath === '/simulations/save' && event.httpMethod === 'POST') {
      const simulation = event.body ? JSON.parse(event.body) : null;
      if (!simulation || !simulation.decisionId) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Invalid simulation payload.' }),
        };
      }
      savedSimulationsStore.set(simulation.decisionId, simulation);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, decisionId: simulation.decisionId }),
      };
    }

    // 6. GET /simulations/:id
    if (subpath.startsWith('/simulations/') && event.httpMethod === 'GET') {
      const id = subpath.replace('/simulations/', '');
      const sim = savedSimulationsStore.get(id);
      if (!sim) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Simulation not found.' }),
        };
      }
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(sim),
      };
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Route ${subpath} not found.` }),
    };
  } catch (err: any) {
    console.error('Netlify function error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

// Web Request/Response standard export for Netlify Functions v2
export default async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const bodyText = req.body ? await req.text() : null;

  const result = await handler({
    path,
    httpMethod: method,
    headers: Object.fromEntries(req.headers.entries()),
    body: bodyText,
  });

  return new Response(result.body, {
    status: result.statusCode,
    headers: result.headers,
  });
};
