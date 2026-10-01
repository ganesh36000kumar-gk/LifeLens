import { Router, Request, Response } from 'express';
import { runFullSimulation } from '../../src/features/calculations/decisionEngine';
import { generateAiExplanationOnServer } from '../services/geminiAiService';
import { generateDeterministicExplanation } from '../../src/features/ai/deterministicFallback';
import crypto from 'crypto';

export const apiRouter = Router();

// In-memory store for shared simulations and persistent backups (PostgreSQL-ready)
const sharedSimulationsStore = new Map<string, any>();
const savedSimulationsStore = new Map<string, any>();

// 1. Run Deterministic Simulation
apiRouter.post('/simulate', (req: Request, res: Response) => {
  try {
    const { decisionCategory, title, currency, inputData, scenarioIds, isDemo } = req.body;

    if (!decisionCategory || !inputData) {
      return res.status(400).json({ error: 'decisionCategory and inputData are required.' });
    }

    const result = runFullSimulation({
      decisionCategory,
      title: title || `${decisionCategory.toUpperCase()} Simulation`,
      currency: currency || 'INR',
      inputData,
      scenarioIds,
      isDemo: Boolean(isDemo),
    });

    res.json(result);
  } catch (error: any) {
    console.error('Simulation error:', error.message);
    res.status(400).json({ error: error.message || 'Simulation calculation failed.' });
  }
});

// 2. Generate AI Explanation (Consumes structured data only)
apiRouter.post('/ai/explain', async (req: Request, res: Response) => {
  try {
    const structuredData = req.body;
    if (!structuredData || !structuredData.scenarios) {
      return res.status(400).json({ error: 'Structured calculation results are required.' });
    }

    const aiResult = await generateAiExplanationOnServer(structuredData);

    if (aiResult) {
      return res.json(aiResult);
    }

    // Graceful fallback if AI key missing or model unavailable
    const fallback = generateDeterministicExplanation(structuredData as any);
    return res.json(fallback);
  } catch (error: any) {
    console.error('AI explanation endpoint error:', error);
    try {
      const fallback = generateDeterministicExplanation(req.body as any);
      return res.json(fallback);
    } catch {
      return res.status(500).json({ error: 'AI explanation is temporarily unavailable.' });
    }
  }
});

// 3. Save simulation snapshot
apiRouter.post('/simulations/save', (req: Request, res: Response) => {
  try {
    const simulation = req.body;
    if (!simulation || !simulation.decisionId) {
      return res.status(400).json({ error: 'Invalid simulation payload.' });
    }
    savedSimulationsStore.set(simulation.decisionId, simulation);
    res.json({ success: true, decisionId: simulation.decisionId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save simulation.' });
  }
});

// 4. Retrieve saved simulation
apiRouter.get('/simulations/:id', (req: Request, res: Response) => {
  const sim = savedSimulationsStore.get(req.params.id);
  if (!sim) {
    return res.status(404).json({ error: 'Simulation not found.' });
  }
  res.json(sim);
});

// 5. Generate secure shareable link token
apiRouter.post('/simulations/share', (req: Request, res: Response) => {
  try {
    const simulation = req.body;
    if (!simulation) {
      return res.status(400).json({ error: 'Simulation payload required.' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    sharedSimulationsStore.set(token, {
      simulation,
      createdAt: new Date().toISOString(),
      views: 0,
    });

    res.json({ token, shareUrl: `/share/${token}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate share link.' });
  }
});

// 6. Retrieve shared simulation snapshot
apiRouter.get('/simulations/share/:token', (req: Request, res: Response) => {
  const entry = sharedSimulationsStore.get(req.params.token);
  if (!entry) {
    return res.status(404).json({ error: 'Shared simulation link has expired or is invalid.' });
  }
  entry.views++;
  res.json(entry.simulation);
});
