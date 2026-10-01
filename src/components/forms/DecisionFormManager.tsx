import React, { useState, useEffect } from 'react';
import { DecisionCategory, CurrencyCode } from '../../types/decision';
import { FormField } from './FormField';
import { PRESET_SCENARIOS } from '../../features/scenarios/scenarioEngine';
import { validateDecisionInput } from '../../features/calculations/decisionEngine';
import { AlertCircle, Sliders, ChevronDown, ChevronUp, Play, ArrowLeft, Info, Check } from 'lucide-react';
import { DEMO_DECISIONS } from '../../lib/demos';

interface DecisionFormManagerProps {
  category: DecisionCategory;
  currency: CurrencyCode;
  onBack: () => void;
  onSubmit: (data: any, title: string, scenarioIds: string[]) => void;
  initialData?: any;
}

export const DecisionFormManager: React.FC<DecisionFormManagerProps> = ({
  category,
  currency,
  onBack,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<any>(() => {
    if (initialData) return initialData;
    const demo = DEMO_DECISIONS.find((d) => d.category === category);
    if (demo) return JSON.parse(JSON.stringify(demo.data));
    return getDefaultDataForCategory(category);
  });

  const [title, setTitle] = useState<string>(() => {
    const demo = DEMO_DECISIONS.find((d) => d.category === category);
    return demo ? demo.title : `Evaluation of ${category.replace('_', ' ').toUpperCase()}`;
  });

  const [activeTab, setActiveTab] = useState<'core' | 'operating' | 'assumptions' | 'scenarios'>('core');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'base',
    'conservative',
    'expected',
    'optimistic',
    'stress',
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const updateField = (key: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleRun = () => {
    // Validate with Zod
    const validation = validateDecisionInput(category, formData);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach((e) => {
        const field = e.path[0] ? String(e.path[0]) : 'general';
        newErrors[field] = e.message;
      });
      setErrors(newErrors);
      // Auto-switch to tab containing error if possible
      setActiveTab('core');
      return;
    }

    setErrors({});
    onSubmit(validation.data, title, selectedScenarios);
  };

  const toggleScenario = (id: string) => {
    if (id === 'base') return; // Base is mandatory
    if (selectedScenarios.includes(id)) {
      if (selectedScenarios.length <= 2) {
        alert('At least 2 scenarios are required for meaningful comparison.');
        return;
      }
      setSelectedScenarios(selectedScenarios.filter((s) => s !== id));
    } else {
      setSelectedScenarios([...selectedScenarios, id]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 w-full">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition w-fit min-h-[36px] py-1"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Choose Decision Type</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <label htmlFor="sim-title" className="text-[11px] text-slate-400 font-medium">Title:</label>
          <input
            id="sim-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none min-h-[36px]"
          />
        </div>
      </div>

      {/* Tabs with Horizontal Scroll for Mobile */}
      <div className="flex border-b border-slate-800 mb-4 sm:mb-6 overflow-x-auto no-scrollbar touch-scroll gap-1 pb-0.5">
        <button
          onClick={() => setActiveTab('core')}
          className={`px-3 sm:px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap min-h-[44px] flex items-center justify-center shrink-0 ${
            activeTab === 'core'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Core Inputs
        </button>
        <button
          onClick={() => setActiveTab('operating')}
          className={`px-3 sm:px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap min-h-[44px] flex items-center justify-center shrink-0 ${
            activeTab === 'operating'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Operating & Cash Flow
        </button>
        <button
          onClick={() => setActiveTab('assumptions')}
          className={`px-3 sm:px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap min-h-[44px] flex items-center justify-center shrink-0 ${
            activeTab === 'assumptions'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Macro Assumptions
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-3 sm:px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap min-h-[44px] flex items-center justify-center shrink-0 ${
            activeTab === 'scenarios'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Scenarios ({selectedScenarios.length})
        </button>
      </div>

      {/* Validation Banner if Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-4 sm:mb-6 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 sm:p-4 text-xs text-rose-300 w-full">
          <div className="flex items-center gap-2 font-bold mb-1.5 text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Please review highlighted input issues:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {Object.entries(errors).map(([field, msg]) => (
              <li key={field} className="break-words">
                <span className="font-semibold capitalize">{field}</span>: {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab 1: Core Inputs */}
      {activeTab === 'core' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4 sm:space-y-6 w-full">
          <h2 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
            Primary Financial Commitments
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 w-full">
            {renderCoreInputs(category, formData, updateField, errors, currency)}
          </div>
        </div>
      )}

      {/* Tab 2: Operating & Cash Flow */}
      {activeTab === 'operating' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4 sm:space-y-6 w-full">
          <h2 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
            Ongoing Recurring Outlays & Time Horizon
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 w-full">
            {renderOperatingInputs(category, formData, updateField, errors, currency)}
          </div>
        </div>
      )}

      {/* Tab 3: Macro & Assumptions */}
      {activeTab === 'assumptions' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4 sm:space-y-6 w-full">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 sm:p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Transparent Assumption Disclosure:</span> Defaults like 6% inflation and 8-10% market return are user-editable baseline assumptions, not forecasts or guaranteed economic facts.
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 w-full">
            {renderAssumptionInputs(category, formData, updateField, errors)}
          </div>
        </div>
      )}

      {/* Tab 4: Scenarios to Run */}
      {activeTab === 'scenarios' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4 w-full">
          <h2 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
            Select Scenarios for Multi-Path Modeling (Min 2, Max 10)
          </h2>
          <div className="space-y-2.5 sm:space-y-3">
            {PRESET_SCENARIOS.map((scenario) => {
              const isChecked = selectedScenarios.includes(scenario.id);
              const isBase = scenario.id === 'base';

              return (
                <div
                  key={scenario.id}
                  onClick={() => toggleScenario(scenario.id)}
                  className={`flex items-start gap-3 rounded-lg border p-3 sm:p-4 transition cursor-pointer min-h-[44px] ${
                    isChecked
                      ? 'border-emerald-500/50 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 active:bg-slate-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isBase}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white break-words">{scenario.name}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">
                        {scenario.type}
                      </span>
                      {isBase && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-300">
                          Mandatory Base
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs text-slate-400 leading-relaxed break-words">{scenario.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit / Simulation Run Bar */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-4 w-full">
        <div className="text-[11px] sm:text-xs text-slate-400">
          <span className="font-semibold text-emerald-400">Deterministic Engine:</span> {selectedScenarios.length} scenarios will calculate in parallel without artificial scores.
        </div>

        <button
          onClick={handleRun}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 min-h-[46px] cursor-pointer shrink-0"
        >
          <Play className="h-4 w-4 fill-current shrink-0" />
          <span>Run Simulation ({selectedScenarios.length} Scenarios)</span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// FORM RENDER HELPERS BY CATEGORY
// ==========================================

function renderCoreInputs(cat: DecisionCategory, data: any, update: any, err: any, curr: CurrencyCode) {
  switch (cat) {
    case 'car':
      return (
        <>
          <FormField
            label="Vehicle Name / Model"
            id="vehicleName"
            type="text"
            value={data.vehicleName || ''}
            onChange={(v) => update('vehicleName', v)}
            error={err.vehicleName}
            placeholder="e.g. Electric Sedan Model 3"
          />
          <FormField
            label="Total Purchase Price"
            id="purchasePrice"
            value={data.purchasePrice || 0}
            onChange={(v) => update('purchasePrice', v)}
            isCurrency
            currency={curr}
            error={err.purchasePrice}
            sourceBadge="user"
          />
          <FormField
            label="Down Payment (Upfront Cash)"
            id="downPayment"
            value={data.downPayment ?? 0}
            onChange={(v) => update('downPayment', v)}
            isCurrency
            currency={curr}
            error={err.downPayment}
            sourceBadge="user"
          />
          <FormField
            label="One-Time Registration & Road Tax"
            id="registrationOneTime"
            value={data.registrationOneTime ?? 0}
            onChange={(v) => update('registrationOneTime', v)}
            isCurrency
            currency={curr}
            error={err.registrationOneTime}
            sourceBadge="user"
          />
          <FormField
            label="Loan Interest Rate"
            id="loanInterestRatePercent"
            value={data.loanInterestRatePercent ?? 8.5}
            onChange={(v) => update('loanInterestRatePercent', v)}
            unit="%"
            step={0.1}
            error={err.loanInterestRatePercent}
            sourceBadge="user"
          />
          <FormField
            label="Loan Tenure"
            id="loanTenureYears"
            value={data.loanTenureYears ?? 5}
            onChange={(v) => update('loanTenureYears', v)}
            unit="Years"
            min={1}
            max={10}
            error={err.loanTenureYears}
            sourceBadge="user"
          />
        </>
      );

    case 'home_rent':
      return (
        <>
          <FormField
            label="Property Purchase Price"
            id="homePrice"
            value={data.homePrice || 0}
            onChange={(v) => update('homePrice', v)}
            isCurrency
            currency={curr}
            error={err.homePrice}
            sourceBadge="user"
          />
          <FormField
            label="Down Payment"
            id="downPayment"
            value={data.downPayment ?? 0}
            onChange={(v) => update('downPayment', v)}
            isCurrency
            currency={curr}
            error={err.downPayment}
            sourceBadge="user"
          />
          <FormField
            label="Stamp Duty & Registration (One-time)"
            id="stampDutyRegOneTime"
            value={data.stampDutyRegOneTime ?? 0}
            onChange={(v) => update('stampDutyRegOneTime', v)}
            isCurrency
            currency={curr}
            error={err.stampDutyRegOneTime}
            sourceBadge="user"
          />
          <FormField
            label="Mortgage Interest Rate"
            id="loanInterestRatePercent"
            value={data.loanInterestRatePercent ?? 8.5}
            onChange={(v) => update('loanInterestRatePercent', v)}
            unit="%"
            step={0.1}
            error={err.loanInterestRatePercent}
            sourceBadge="user"
          />
          <FormField
            label="Mortgage Loan Tenure"
            id="loanTenureYears"
            value={data.loanTenureYears ?? 20}
            onChange={(v) => update('loanTenureYears', v)}
            unit="Years"
            min={1}
            max={35}
            error={err.loanTenureYears}
            sourceBadge="user"
          />
          <FormField
            label="Equivalent Monthly Rent (Alternative)"
            id="monthlyRent"
            value={data.monthlyRent ?? 0}
            onChange={(v) => update('monthlyRent', v)}
            isCurrency
            currency={curr}
            error={err.monthlyRent}
            sourceBadge="user"
          />
        </>
      );

    case 'job_career':
      return (
        <>
          <FormField
            label="Current Role Title"
            id="currentRoleTitle"
            type="text"
            value={data.currentRoleTitle || ''}
            onChange={(v) => update('currentRoleTitle', v)}
            error={err.currentRoleTitle}
          />
          <FormField
            label="New Role / Offer Title"
            id="newRoleTitle"
            type="text"
            value={data.newRoleTitle || ''}
            onChange={(v) => update('newRoleTitle', v)}
            error={err.newRoleTitle}
          />
          <FormField
            label="Current Annual Base Salary"
            id="currentSalaryAnnual"
            value={data.currentSalaryAnnual ?? 0}
            onChange={(v) => update('currentSalaryAnnual', v)}
            isCurrency
            currency={curr}
            error={err.currentSalaryAnnual}
            sourceBadge="user"
          />
          <FormField
            label="New Annual Base Salary Offer"
            id="newSalaryAnnual"
            value={data.newSalaryAnnual ?? 0}
            onChange={(v) => update('newSalaryAnnual', v)}
            isCurrency
            currency={curr}
            error={err.newSalaryAnnual}
            sourceBadge="user"
          />
          <FormField
            label="New Annual Variable Bonus Offer"
            id="newBonusAnnual"
            value={data.newBonusAnnual ?? 0}
            onChange={(v) => update('newBonusAnnual', v)}
            isCurrency
            currency={curr}
            error={err.newBonusAnnual}
            sourceBadge="user"
          />
          <FormField
            label="One-Time Relocation / Setup Cost"
            id="relocationCostOneTime"
            value={data.relocationCostOneTime ?? 0}
            onChange={(v) => update('relocationCostOneTime', v)}
            isCurrency
            currency={curr}
            error={err.relocationCostOneTime}
            sourceBadge="user"
          />
        </>
      );

    case 'education':
      return (
        <>
          <FormField
            label="Program / Degree Name"
            id="programName"
            type="text"
            value={data.programName || ''}
            onChange={(v) => update('programName', v)}
            error={err.programName}
          />
          <FormField
            label="Program Duration"
            id="programDurationYears"
            value={data.programDurationYears ?? 2}
            onChange={(v) => update('programDurationYears', v)}
            unit="Years"
            step={0.5}
            error={err.programDurationYears}
            sourceBadge="user"
          />
          <FormField
            label="Total Tuition Fees"
            id="tuitionTotal"
            value={data.tuitionTotal ?? 0}
            onChange={(v) => update('tuitionTotal', v)}
            isCurrency
            currency={curr}
            error={err.tuitionTotal}
            sourceBadge="user"
          />
          <FormField
            label="Annual Forfeited Salary While Studying"
            id="currentIncomeAnnualForfeited"
            value={data.currentIncomeAnnualForfeited ?? 0}
            onChange={(v) => update('currentIncomeAnnualForfeited', v)}
            isCurrency
            currency={curr}
            error={err.currentIncomeAnnualForfeited}
            sourceBadge="user"
            hint="Income forgone during study"
          />
          <FormField
            label="Expected Post-Grad Starting Salary"
            id="expectedPostEducationIncomeAnnual"
            value={data.expectedPostEducationIncomeAnnual ?? 0}
            onChange={(v) => update('expectedPostEducationIncomeAnnual', v)}
            isCurrency
            currency={curr}
            error={err.expectedPostEducationIncomeAnnual}
            sourceBadge="user"
          />
          <FormField
            label="Education Loan Amount"
            id="financingLoanAmount"
            value={data.financingLoanAmount ?? 0}
            onChange={(v) => update('financingLoanAmount', v)}
            isCurrency
            currency={curr}
            error={err.financingLoanAmount}
            sourceBadge="user"
          />
        </>
      );

    case 'business':
      return (
        <>
          <FormField
            label="Business Name / Venture"
            id="businessName"
            type="text"
            value={data.businessName || ''}
            onChange={(v) => update('businessName', v)}
            error={err.businessName}
          />
          <FormField
            label="Initial Capital Investment"
            id="initialCapitalInvestment"
            value={data.initialCapitalInvestment ?? 0}
            onChange={(v) => update('initialCapitalInvestment', v)}
            isCurrency
            currency={curr}
            error={err.initialCapitalInvestment}
            sourceBadge="user"
          />
          <FormField
            label="Monthly Fixed Costs (Rent, Tools)"
            id="fixedCostsMonthly"
            value={data.fixedCostsMonthly ?? 0}
            onChange={(v) => update('fixedCostsMonthly', v)}
            isCurrency
            currency={curr}
            error={err.fixedCostsMonthly}
            sourceBadge="user"
          />
          <FormField
            label="Monthly Employee Payroll"
            id="employeePayrollMonthly"
            value={data.employeePayrollMonthly ?? 0}
            onChange={(v) => update('employeePayrollMonthly', v)}
            isCurrency
            currency={curr}
            error={err.employeePayrollMonthly}
            sourceBadge="user"
          />
          <FormField
            label="Starting Monthly Revenue"
            id="initialMonthlyRevenue"
            value={data.initialMonthlyRevenue ?? 0}
            onChange={(v) => update('initialMonthlyRevenue', v)}
            isCurrency
            currency={curr}
            error={err.initialMonthlyRevenue}
            sourceBadge="user"
          />
          <FormField
            label="Gross Profit Margin"
            id="grossMarginPercent"
            value={data.grossMarginPercent ?? 75}
            onChange={(v) => update('grossMarginPercent', v)}
            unit="%"
            error={err.grossMarginPercent}
            sourceBadge="user"
          />
        </>
      );

    case 'loan_debt':
      return (
        <>
          <FormField
            label="Loan / Debt Name"
            id="debtName"
            type="text"
            value={data.debtName || ''}
            onChange={(v) => update('debtName', v)}
            error={err.debtName}
          />
          <FormField
            label="Outstanding Principal Balance"
            id="outstandingPrincipal"
            value={data.outstandingPrincipal ?? 0}
            onChange={(v) => update('outstandingPrincipal', v)}
            isCurrency
            currency={curr}
            error={err.outstandingPrincipal}
            sourceBadge="user"
          />
          <FormField
            label="Current Annual Interest Rate"
            id="currentInterestRatePercent"
            value={data.currentInterestRatePercent ?? 10}
            onChange={(v) => update('currentInterestRatePercent', v)}
            unit="%"
            step={0.1}
            error={err.currentInterestRatePercent}
            sourceBadge="user"
          />
          <FormField
            label="Remaining Tenure"
            id="remainingTenureMonths"
            value={data.remainingTenureMonths ?? 60}
            onChange={(v) => update('remainingTenureMonths', v)}
            unit="Months"
            error={err.remainingTenureMonths}
            sourceBadge="user"
          />
          <FormField
            label="Planned Extra Monthly Payment"
            id="extraMonthlyPayment"
            value={data.extraMonthlyPayment ?? 0}
            onChange={(v) => update('extraMonthlyPayment', v)}
            isCurrency
            currency={curr}
            error={err.extraMonthlyPayment}
            sourceBadge="user"
          />
          <FormField
            label="Planned Lump Sum Prepayment"
            id="lumpSumPrepaymentAmount"
            value={data.lumpSumPrepaymentAmount ?? 0}
            onChange={(v) => update('lumpSumPrepaymentAmount', v)}
            isCurrency
            currency={curr}
            error={err.lumpSumPrepaymentAmount}
            sourceBadge="user"
          />
        </>
      );

    case 'investment':
      return (
        <>
          <FormField
            label="Investment Portfolio Title"
            id="investmentTitle"
            type="text"
            value={data.investmentTitle || ''}
            onChange={(v) => update('investmentTitle', v)}
            error={err.investmentTitle}
          />
          <FormField
            label="Initial Lump Sum"
            id="initialLumpSum"
            value={data.initialLumpSum ?? 0}
            onChange={(v) => update('initialLumpSum', v)}
            isCurrency
            currency={curr}
            error={err.initialLumpSum}
            sourceBadge="user"
          />
          <FormField
            label="Recurring Monthly Contribution (SIP)"
            id="recurringMonthlyContribution"
            value={data.recurringMonthlyContribution ?? 0}
            onChange={(v) => update('recurringMonthlyContribution', v)}
            isCurrency
            currency={curr}
            error={err.recurringMonthlyContribution}
            sourceBadge="user"
          />
          <FormField
            label="Investment Duration"
            id="investmentDurationYears"
            value={data.investmentDurationYears ?? 10}
            onChange={(v) => update('investmentDurationYears', v)}
            unit="Years"
            error={err.investmentDurationYears}
            sourceBadge="user"
          />
          <FormField
            label="Expected Annual Return"
            id="expectedAnnualReturnPercent"
            value={data.expectedAnnualReturnPercent ?? 10}
            onChange={(v) => update('expectedAnnualReturnPercent', v)}
            unit="%"
            step={0.5}
            error={err.expectedAnnualReturnPercent}
            sourceBadge="default"
          />
          <FormField
            label="Annual Step-Up Contribution"
            id="annualContributionIncreasePercent"
            value={data.annualContributionIncreasePercent ?? 5}
            onChange={(v) => update('annualContributionIncreasePercent', v)}
            unit="%"
            error={err.annualContributionIncreasePercent}
            sourceBadge="user"
          />
        </>
      );

    case 'relocation':
      return (
        <>
          <FormField
            label="Current Location"
            id="currentCityName"
            type="text"
            value={data.currentCityName || ''}
            onChange={(v) => update('currentCityName', v)}
            error={err.currentCityName}
          />
          <FormField
            label="Target Location"
            id="targetCityName"
            type="text"
            value={data.targetCityName || ''}
            onChange={(v) => update('targetCityName', v)}
            error={err.targetCityName}
          />
          <FormField
            label="Current Monthly Income"
            id="currentMonthlyIncome"
            value={data.currentMonthlyIncome ?? 0}
            onChange={(v) => update('currentMonthlyIncome', v)}
            isCurrency
            currency={curr}
            error={err.currentMonthlyIncome}
            sourceBadge="user"
          />
          <FormField
            label="Target Monthly Income"
            id="expectedTargetMonthlyIncome"
            value={data.expectedTargetMonthlyIncome ?? 0}
            onChange={(v) => update('expectedTargetMonthlyIncome', v)}
            isCurrency
            currency={curr}
            error={err.expectedTargetMonthlyIncome}
            sourceBadge="user"
          />
          <FormField
            label="One-Time Moving / Relocation Expenses"
            id="oneTimeMovingExpenses"
            value={data.oneTimeMovingExpenses ?? 0}
            onChange={(v) => update('oneTimeMovingExpenses', v)}
            isCurrency
            currency={curr}
            error={err.oneTimeMovingExpenses}
            sourceBadge="user"
          />
          <FormField
            label="Planning Horizon"
            id="planningHorizonYears"
            value={data.planningHorizonYears ?? 3}
            onChange={(v) => update('planningHorizonYears', v)}
            unit="Years"
            error={err.planningHorizonYears}
            sourceBadge="user"
          />
        </>
      );

    case 'major_purchase':
      return (
        <>
          <FormField
            label="Item / Asset Description"
            id="itemDescription"
            type="text"
            value={data.itemDescription || ''}
            onChange={(v) => update('itemDescription', v)}
            error={err.itemDescription}
          />
          <FormField
            label="Purchase Price"
            id="purchaseCost"
            value={data.purchaseCost ?? 0}
            onChange={(v) => update('purchaseCost', v)}
            isCurrency
            currency={curr}
            error={err.purchaseCost}
            sourceBadge="user"
          />
          <FormField
            label="Financing Down Payment"
            id="financingDownPayment"
            value={data.financingDownPayment ?? 0}
            onChange={(v) => update('financingDownPayment', v)}
            isCurrency
            currency={curr}
            error={err.financingDownPayment}
            sourceBadge="user"
          />
          <FormField
            label="Financed Loan Amount"
            id="financingLoanAmount"
            value={data.financingLoanAmount ?? 0}
            onChange={(v) => update('financingLoanAmount', v)}
            isCurrency
            currency={curr}
            error={err.financingLoanAmount}
            sourceBadge="user"
          />
          <FormField
            label="Expected Usable Lifespan"
            id="expectedLifespanYears"
            value={data.expectedLifespanYears ?? 5}
            onChange={(v) => update('expectedLifespanYears', v)}
            unit="Years"
            error={err.expectedLifespanYears}
            sourceBadge="user"
          />
          <FormField
            label="Estimated End Resale / Salvage Value"
            id="estimatedResaleValueAtEnd"
            value={data.estimatedResaleValueAtEnd ?? 0}
            onChange={(v) => update('estimatedResaleValueAtEnd', v)}
            isCurrency
            currency={curr}
            error={err.estimatedResaleValueAtEnd}
            sourceBadge="estimated"
          />
        </>
      );

    case 'custom':
      return (
        <>
          <FormField
            label="Decision Title"
            id="decisionTitle"
            type="text"
            value={data.decisionTitle || ''}
            onChange={(v) => update('decisionTitle', v)}
            error={err.decisionTitle}
          />
          <FormField
            label="Planning Duration"
            id="planningDurationYears"
            value={data.planningDurationYears ?? 5}
            onChange={(v) => update('planningDurationYears', v)}
            unit="Years"
            error={err.planningDurationYears}
            sourceBadge="user"
          />
          {data.options?.map((opt: any, idx: number) => (
            <div key={idx} className="col-span-1 sm:col-span-2 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:p-4 space-y-3 w-full min-w-0">
              <h4 className="font-bold text-emerald-400 text-xs">Option {idx + 1}: {opt.optionName}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <FormField
                  label="Option Name"
                  id={`opt_name_${idx}`}
                  type="text"
                  value={opt.optionName}
                  onChange={(v) => {
                    const opts = [...data.options];
                    opts[idx].optionName = v;
                    update('options', opts);
                  }}
                />
                <FormField
                  label="One-Time Capital Cost"
                  id={`opt_cap_${idx}`}
                  value={opt.oneTimeCapitalCost}
                  onChange={(v) => {
                    const opts = [...data.options];
                    opts[idx].oneTimeCapitalCost = v;
                    update('options', opts);
                  }}
                  isCurrency
                  currency={curr}
                />
                <FormField
                  label="Monthly Recurring Cost"
                  id={`opt_cost_${idx}`}
                  value={opt.monthlyRecurringCost}
                  onChange={(v) => {
                    const opts = [...data.options];
                    opts[idx].monthlyRecurringCost = v;
                    update('options', opts);
                  }}
                  isCurrency
                  currency={curr}
                />
                <FormField
                  label="Monthly Recurring Income"
                  id={`opt_inc_${idx}`}
                  value={opt.monthlyRecurringIncome}
                  onChange={(v) => {
                    const opts = [...data.options];
                    opts[idx].monthlyRecurringIncome = v;
                    update('options', opts);
                  }}
                  isCurrency
                  currency={curr}
                />
              </div>
            </div>
          ))}
        </>
      );
  }
}

function renderOperatingInputs(cat: DecisionCategory, data: any, update: any, err: any, curr: CurrencyCode) {
  switch (cat) {
    case 'car':
      return (
        <>
          <FormField
            label="Monthly Fuel / Electricity Cost"
            id="fuelCostMonthly"
            value={data.fuelCostMonthly ?? 0}
            onChange={(v) => update('fuelCostMonthly', v)}
            isCurrency
            currency={curr}
            error={err.fuelCostMonthly}
            sourceBadge="user"
          />
          <FormField
            label="Annual Insurance Premium"
            id="insuranceAnnual"
            value={data.insuranceAnnual ?? 0}
            onChange={(v) => update('insuranceAnnual', v)}
            isCurrency
            currency={curr}
            error={err.insuranceAnnual}
            sourceBadge="user"
          />
          <FormField
            label="Annual Maintenance & Service"
            id="maintenanceAnnual"
            value={data.maintenanceAnnual ?? 0}
            onChange={(v) => update('maintenanceAnnual', v)}
            isCurrency
            currency={curr}
            error={err.maintenanceAnnual}
            sourceBadge="user"
          />
          <FormField
            label="Monthly Parking & Tolls"
            id="parkingTollMonthly"
            value={data.parkingTollMonthly ?? 0}
            onChange={(v) => update('parkingTollMonthly', v)}
            isCurrency
            currency={curr}
            error={err.parkingTollMonthly}
            sourceBadge="user"
          />
          <FormField
            label="Expected Annual Usage"
            id="annualUsageKm"
            value={data.annualUsageKm ?? 12000}
            onChange={(v) => update('annualUsageKm', v)}
            unit="km / yr"
            error={err.annualUsageKm}
            sourceBadge="user"
          />
          <FormField
            label="Planned Ownership Duration"
            id="ownershipDurationYears"
            value={data.ownershipDurationYears ?? 5}
            onChange={(v) => update('ownershipDurationYears', v)}
            unit="Years"
            min={1}
            max={25}
            error={err.ownershipDurationYears}
            sourceBadge="user"
          />
        </>
      );

    case 'home_rent':
      return (
        <>
          <FormField
            label="Monthly HOA / Maintenance Fee"
            id="maintenanceMonthly"
            value={data.maintenanceMonthly ?? 0}
            onChange={(v) => update('maintenanceMonthly', v)}
            isCurrency
            currency={curr}
            error={err.maintenanceMonthly}
            sourceBadge="user"
          />
          <FormField
            label="Annual Property Tax"
            id="propertyTaxAnnual"
            value={data.propertyTaxAnnual ?? 0}
            onChange={(v) => update('propertyTaxAnnual', v)}
            isCurrency
            currency={curr}
            error={err.propertyTaxAnnual}
            sourceBadge="user"
          />
          <FormField
            label="Annual Homeowners Insurance"
            id="homeInsuranceAnnual"
            value={data.homeInsuranceAnnual ?? 0}
            onChange={(v) => update('homeInsuranceAnnual', v)}
            isCurrency
            currency={curr}
            error={err.homeInsuranceAnnual}
            sourceBadge="user"
          />
          <FormField
            label="Planned Holding Period"
            id="holdingPeriodYears"
            value={data.holdingPeriodYears ?? 15}
            onChange={(v) => update('holdingPeriodYears', v)}
            unit="Years"
            min={1}
            max={40}
            error={err.holdingPeriodYears}
            sourceBadge="user"
          />
          <FormField
            label="Security Deposit for Renting"
            id="rentDeposit"
            value={data.rentDeposit ?? 0}
            onChange={(v) => update('rentDeposit', v)}
            isCurrency
            currency={curr}
            error={err.rentDeposit}
            sourceBadge="user"
          />
          <FormField
            label="Annual Rent Escalation"
            id="annualRentIncreasePercent"
            value={data.annualRentIncreasePercent ?? 6}
            onChange={(v) => update('annualRentIncreasePercent', v)}
            unit="%"
            error={err.annualRentIncreasePercent}
            sourceBadge="user"
          />
        </>
      );

    case 'job_career':
      return (
        <>
          <FormField
            label="Current Monthly Commute Cost"
            id="currentMonthlyCommuteCost"
            value={data.currentMonthlyCommuteCost ?? 0}
            onChange={(v) => update('currentMonthlyCommuteCost', v)}
            isCurrency
            currency={curr}
            error={err.currentMonthlyCommuteCost}
            sourceBadge="user"
          />
          <FormField
            label="New Monthly Commute Cost"
            id="newMonthlyCommuteCost"
            value={data.newMonthlyCommuteCost ?? 0}
            onChange={(v) => update('newMonthlyCommuteCost', v)}
            isCurrency
            currency={curr}
            error={err.newMonthlyCommuteCost}
            sourceBadge="user"
          />
          <FormField
            label="Work-From-Home Monthly Savings"
            id="workFromHomeSavingsMonthly"
            value={data.workFromHomeSavingsMonthly ?? 0}
            onChange={(v) => update('workFromHomeSavingsMonthly', v)}
            isCurrency
            currency={curr}
            error={err.workFromHomeSavingsMonthly}
            sourceBadge="user"
          />
          <FormField
            label="Weekly Hours (Current Role)"
            id="timeCommitmentHoursCurrentWeekly"
            value={data.timeCommitmentHoursCurrentWeekly ?? 40}
            onChange={(v) => update('timeCommitmentHoursCurrentWeekly', v)}
            unit="Hours/wk"
            error={err.timeCommitmentHoursCurrentWeekly}
            sourceBadge="user"
          />
          <FormField
            label="Weekly Hours (New Role)"
            id="timeCommitmentHoursNewWeekly"
            value={data.timeCommitmentHoursNewWeekly ?? 45}
            onChange={(v) => update('timeCommitmentHoursNewWeekly', v)}
            unit="Hours/wk"
            error={err.timeCommitmentHoursNewWeekly}
            sourceBadge="user"
          />
          <FormField
            label="Projection Horizon"
            id="projectionDurationYears"
            value={data.projectionDurationYears ?? 5}
            onChange={(v) => update('projectionDurationYears', v)}
            unit="Years"
            error={err.projectionDurationYears}
            sourceBadge="user"
          />
        </>
      );

    case 'education':
      return (
        <>
          <FormField
            label="Annual Living Expenses During Study"
            id="livingCostsAnnual"
            value={data.livingCostsAnnual ?? 0}
            onChange={(v) => update('livingCostsAnnual', v)}
            isCurrency
            currency={curr}
            error={err.livingCostsAnnual}
            sourceBadge="user"
          />
          <FormField
            label="Books, Tools, Exams & Supplies"
            id="booksAndSuppliesTotal"
            value={data.booksAndSuppliesTotal ?? 0}
            onChange={(v) => update('booksAndSuppliesTotal', v)}
            isCurrency
            currency={curr}
            error={err.booksAndSuppliesTotal}
            sourceBadge="user"
          />
          <FormField
            label="Student Loan Interest Rate"
            id="loanInterestRatePercent"
            value={data.loanInterestRatePercent ?? 9}
            onChange={(v) => update('loanInterestRatePercent', v)}
            unit="%"
            step={0.1}
            error={err.loanInterestRatePercent}
            sourceBadge="user"
          />
          <FormField
            label="Loan Repayment Tenure"
            id="loanRepaymentTenureYears"
            value={data.loanRepaymentTenureYears ?? 7}
            onChange={(v) => update('loanRepaymentTenureYears', v)}
            unit="Years"
            error={err.loanRepaymentTenureYears}
            sourceBadge="user"
          />
          <FormField
            label="Total Evaluation Horizon"
            id="evaluationHorizonYears"
            value={data.evaluationHorizonYears ?? 10}
            onChange={(v) => update('evaluationHorizonYears', v)}
            unit="Years"
            error={err.evaluationHorizonYears}
            sourceBadge="user"
          />
        </>
      );

    case 'business':
      return (
        <>
          <FormField
            label="Monthly Marketing Budget"
            id="marketingBudgetMonthly"
            value={data.marketingBudgetMonthly ?? 0}
            onChange={(v) => update('marketingBudgetMonthly', v)}
            isCurrency
            currency={curr}
            error={err.marketingBudgetMonthly}
            sourceBadge="user"
          />
          <FormField
            label="Monthly Revenue Growth Rate"
            id="revenueGrowthMonthlyPercent"
            value={data.revenueGrowthMonthlyPercent ?? 10}
            onChange={(v) => update('revenueGrowthMonthlyPercent', v)}
            unit="%"
            step={0.5}
            error={err.revenueGrowthMonthlyPercent}
            sourceBadge="user"
          />
          <FormField
            label="Emergency Cash Reserve Buffer"
            id="emergencyReserveBuffer"
            value={data.emergencyReserveBuffer ?? 0}
            onChange={(v) => update('emergencyReserveBuffer', v)}
            isCurrency
            currency={curr}
            error={err.emergencyReserveBuffer}
            sourceBadge="user"
          />
          <FormField
            label="Simulation Duration"
            id="simulationDurationMonths"
            value={data.simulationDurationMonths ?? 36}
            onChange={(v) => update('simulationDurationMonths', v)}
            unit="Months"
            error={err.simulationDurationMonths}
            sourceBadge="user"
          />
        </>
      );

    case 'relocation':
      return (
        <>
          <FormField
            label="Current Monthly Rent"
            id="currentMonthlyRent"
            value={data.currentMonthlyRent ?? 0}
            onChange={(v) => update('currentMonthlyRent', v)}
            isCurrency
            currency={curr}
            error={err.currentMonthlyRent}
            sourceBadge="user"
          />
          <FormField
            label="Target Monthly Rent"
            id="targetMonthlyRent"
            value={data.targetMonthlyRent ?? 0}
            onChange={(v) => update('targetMonthlyRent', v)}
            isCurrency
            currency={curr}
            error={err.targetMonthlyRent}
            sourceBadge="user"
          />
          <FormField
            label="Current Monthly Utilities & Food"
            id="currentMonthlyFoodGrocery"
            value={data.currentMonthlyFoodGrocery ?? 0}
            onChange={(v) => update('currentMonthlyFoodGrocery', v)}
            isCurrency
            currency={curr}
            error={err.currentMonthlyFoodGrocery}
            sourceBadge="user"
          />
          <FormField
            label="Target Monthly Utilities & Food"
            id="targetMonthlyFoodGrocery"
            value={data.targetMonthlyFoodGrocery ?? 0}
            onChange={(v) => update('targetMonthlyFoodGrocery', v)}
            isCurrency
            currency={curr}
            error={err.targetMonthlyFoodGrocery}
            sourceBadge="user"
          />
        </>
      );

    default:
      return (
        <div className="col-span-1 sm:col-span-2 text-xs text-slate-400">
          Standard recurring parameters configured in Core tab.
        </div>
      );
  }
}

function renderAssumptionInputs(cat: DecisionCategory, data: any, update: any, err: any) {
  return (
    <>
      <FormField
        label="Annual Inflation Rate (Default)"
        id="inflationRatePercent"
        value={data.inflationRatePercent ?? 6}
        onChange={(v) => update('inflationRatePercent', v)}
        unit="%"
        step={0.5}
        sourceBadge="default"
        hint="Baseline inflation applied across ongoing operational expenses."
      />
      <FormField
        label="Alternative Investment Return (Opportunity Cost)"
        id="alternativeInvestmentReturnPercent"
        value={data.alternativeInvestmentReturnPercent ?? 8}
        onChange={(v) => update('alternativeInvestmentReturnPercent', v)}
        unit="%"
        step={0.5}
        sourceBadge="default"
        hint="Benchmark market return if upfront capital were invested instead."
      />
      {cat === 'car' && (
        <FormField
          label="Estimated Annual Depreciation Rate"
          id="depreciationRateAnnualPercent"
          value={data.depreciationRateAnnualPercent ?? 15}
          onChange={(v) => update('depreciationRateAnnualPercent', v)}
          unit="%"
          sourceBadge="user"
          hint="Annual market value decline of vehicle."
        />
      )}
      {cat === 'home_rent' && (
        <FormField
          label="Property Capital Appreciation Rate"
          id="propertyAppreciationAnnualPercent"
          value={data.propertyAppreciationAnnualPercent ?? 5}
          onChange={(v) => update('propertyAppreciationAnnualPercent', v)}
          unit="%"
          sourceBadge="user"
          hint="Expected compounding annual increase in real estate property price."
        />
      )}
      {cat === 'job_career' && (
        <>
          <FormField
            label="Current Track Expected Salary Growth"
            id="expectedAnnualSalaryGrowthCurrentPercent"
            value={data.expectedAnnualSalaryGrowthCurrentPercent ?? 7}
            onChange={(v) => update('expectedAnnualSalaryGrowthCurrentPercent', v)}
            unit="%"
            sourceBadge="user"
          />
          <FormField
            label="New Offer Expected Salary Growth"
            id="expectedAnnualSalaryGrowthNewPercent"
            value={data.expectedAnnualSalaryGrowthNewPercent ?? 8}
            onChange={(v) => update('expectedAnnualSalaryGrowthNewPercent', v)}
            unit="%"
            sourceBadge="user"
          />
        </>
      )}
    </>
  );
}

function getDefaultDataForCategory(cat: DecisionCategory): any {
  return {
    vehicleName: 'Sedan Model X',
    purchasePrice: 1500000,
    downPayment: 300000,
    loanInterestRatePercent: 8.5,
    loanTenureYears: 5,
    fuelCostMonthly: 4000,
    insuranceAnnual: 25000,
    maintenanceAnnual: 12000,
    parkingTollMonthly: 1500,
    registrationOneTime: 75000,
    annualUsageKm: 12000,
    ownershipDurationYears: 5,
    depreciationRateAnnualPercent: 15,
    alternativeInvestmentReturnPercent: 8,
    inflationRatePercent: 6,
  };
}
