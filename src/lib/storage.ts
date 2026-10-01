import { SimulationResult } from '../types/decision';

const STORAGE_KEY = 'life_decision_simulator_saved_v1';

export function getSavedSimulations(): SimulationResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load simulations from storage:', e);
    return [];
  }
}

export function saveSimulationLocally(sim: SimulationResult): boolean {
  try {
    const existing = getSavedSimulations();
    const filtered = existing.filter((item) => item.decisionId !== sim.decisionId);
    const updated = [sim, ...filtered].slice(0, 50); // limit to 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('Failed to save simulation to local storage:', e);
    return false;
  }
}

export function deleteSavedSimulation(decisionId: string): boolean {
  try {
    const existing = getSavedSimulations();
    const updated = existing.filter((item) => item.decisionId !== decisionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('Failed to delete simulation:', e);
    return false;
  }
}
