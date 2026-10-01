import { z } from 'zod';

// ==========================================
// 1. DECISION CATEGORIES & SCENARIO TYPES
// ==========================================

export type DecisionCategory =
  | 'car'
  | 'home_rent'
  | 'job_career'
  | 'education'
  | 'business'
  | 'loan_debt'
  | 'investment'
  | 'relocation'
  | 'major_purchase'
  | 'custom';

export type ScenarioType =
  | 'base'
  | 'conservative'
  | 'expected'
  | 'optimistic'
  | 'stress'
  | 'custom';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CurrencyCode = 'INR' | 'USD' | 'EUR';

export type AssumptionSource = 'user' | 'default' | 'estimated' | 'external';

export interface AssumptionItem {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  source: AssumptionSource;
  description: string;
  isEditable: boolean;
}

// ==========================================
// 2. INDEPENDENT DECISION DIMENSIONS
// (NO SINGLE ARBITRARY DECISION SCORE!)
// ==========================================

export interface DecisionDimensions {
  financialCostTotal: number;
  monthlyCashFlowImpact: number;
  longTermNetValue: number;
  liquidityImpactTotal: number;
  riskExposureLevel: RiskLevel;
  flexibilityRating: 'LOW' | 'MEDIUM' | 'HIGH';
  timeCommitmentHoursPerWeek: number;
  incomePotentialAnnual: number;
  opportunityCostTotal: number;
  reversibility: 'EASY' | 'MODERATE' | 'DIFFICULT' | 'IRREVERSIBLE';
}

// ==========================================
// 3. DETERMINISTIC RISK METRICS
// ==========================================

export interface RiskDimensionAssessment {
  dimension: string;
  level: RiskLevel;
  reason: string;
  criticalThreshold?: string;
}

export interface RiskProfile {
  financialRisk: RiskDimensionAssessment;
  cashFlowRisk: RiskDimensionAssessment;
  liquidityRisk: RiskDimensionAssessment;
  assumptionRisk: RiskDimensionAssessment;
  durationRisk: RiskDimensionAssessment;
  opportunityCostRisk: RiskDimensionAssessment;
  flexibilityRisk: RiskDimensionAssessment;
  concentrationRisk: RiskDimensionAssessment;
}

// ==========================================
// 4. BREAK-EVEN ASSESSMENT
// ==========================================

export interface BreakEvenResult {
  isApplicable: boolean;
  breakEvenPeriodMonths: number | null;
  breakEvenPeriodYears: number | null;
  breakEvenMetricName: string;
  explanation: string;
  milestones?: Array<{ label: string; month: number; cumulativeCostA: number; cumulativeCostB: number }>;
}

// ==========================================
// 5. SENSITIVITY ASSESSMENT
// ==========================================

export interface SensitivityPoint {
  percentVariation: number; // e.g. -20, -10, 0, 10, 20
  variableValue: number;
  impactedOutcome: number; // e.g. total cost or net benefit
}

export interface VariableSensitivity {
  variableKey: string;
  variableLabel: string;
  baseValue: number;
  unit: string;
  points: SensitivityPoint[];
  elasticityImpact: number; // absolute swing range
  impactRank: number; // 1 = highest impact
}

export interface SensitivityAnalysisResult {
  variables: VariableSensitivity[];
  mostCriticalVariable: string;
  leastCriticalVariable: string;
}

// ==========================================
// 6. SCENARIO CALCULATION RESULT
// ==========================================

export interface YearProjectionPoint {
  year: number;
  nominalCost: number;
  realCost: number;
  cashOutflowAnnual: number;
  cashInflowAnnual: number;
  netCashFlow: number;
  assetEquityValue: number;
  opportunityCostCompounded: number;
  remainingDebtBalance: number;
}

export interface ScenarioCalculationResult {
  scenarioId: string;
  scenarioName: string;
  scenarioType: ScenarioType;
  dimensions: DecisionDimensions;
  riskProfile: RiskProfile;
  breakEven: BreakEvenResult;
  projections: YearProjectionPoint[];
  assumptions: AssumptionItem[];
  categorySpecificResults: Record<string, number | string | boolean>;
}

export interface SimulationResult {
  decisionId: string;
  decisionCategory: DecisionCategory;
  title: string;
  currency: CurrencyCode;
  timestamp: string;
  durationYears: number;
  scenarios: ScenarioCalculationResult[];
  sensitivity: SensitivityAnalysisResult;
  isDemo?: boolean;
}

// ==========================================
// 7. STRUCTURED AI EXPLANATION SCHEMA
// (Strictly adheres to Section 29)
// ==========================================

export interface AiExplanationResponse {
  summary: string;
  whatNumbersShow: string[];
  keyAssumptions: string[];
  tradeoffs: string[];
  risks: string[];
  sensitivityFactors: string[];
  questionsToConsider: string[];
  generationSource?: 'gemini' | 'deterministic-fallback';
}
