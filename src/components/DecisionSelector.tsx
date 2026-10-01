import React from 'react';
import { DecisionCategory } from '../types/decision';
import {
  Car,
  Home,
  Briefcase,
  GraduationCap,
  TrendingUp,
  CreditCard,
  PiggyBank,
  MapPin,
  ShoppingBag,
  Sliders,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface CategoryCardInfo {
  id: DecisionCategory;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  keyQuestion: string;
}

export const CATEGORIES: CategoryCardInfo[] = [
  {
    id: 'car',
    title: 'Car / Vehicle',
    subtitle: 'Ownership, Loan EMI, Running Costs & Resale',
    icon: Car,
    tags: ['EMI', 'Depreciation', 'Cost/Km', 'Opportunity Cost'],
    keyQuestion: 'What is the full lifecycle cost per km versus alternative investing?',
  },
  {
    id: 'home_rent',
    title: 'Home Purchase vs. Rent',
    subtitle: 'Mortgage Equity, Property Appreciation & Market Opportunity',
    icon: Home,
    tags: ['Buy vs Rent', 'Mortgage', 'Equity', 'Break-Even'],
    keyQuestion: 'At what year does buying build more net wealth than renting & investing?',
  },
  {
    id: 'job_career',
    title: 'Job / Career Switch',
    subtitle: 'Compensation, Relocation, Commute & Work-Life Tradeoffs',
    icon: Briefcase,
    tags: ['Salary Growth', 'Relocation', 'WFH Savings', 'Hourly Value'],
    keyQuestion: 'Does the higher salary offset longer hours, commute, and transition costs?',
  },
  {
    id: 'education',
    title: 'Education / Degree',
    subtitle: 'Tuition, Student Debt, Lost Wages & Post-Grad ROI',
    icon: GraduationCap,
    tags: ['Lost Salary', 'Loan Payoff', 'ROI Years', 'Human Capital'],
    keyQuestion: 'How many post-graduation years are required to break even on total investment?',
  },
  {
    id: 'business',
    title: 'Business / Startup',
    subtitle: 'Bootstrapping Runway, Fixed Overhead & Unit Economics',
    icon: TrendingUp,
    tags: ['Burn Rate', 'Runway', 'Monthly Break-Even', 'Risk Buffer'],
    keyQuestion: 'How many months of cash runway exist before monthly operating break-even?',
  },
  {
    id: 'loan_debt',
    title: 'Loan & Debt Payoff',
    subtitle: 'Prepayment Strategies, Refinancing & Interest Avoidance',
    icon: CreditCard,
    tags: ['Prepayment', 'Interest Saved', 'Tenure Reduction', 'Refinance'],
    keyQuestion: 'How much total interest and tenure are saved by accelerating payments?',
  },
  {
    id: 'investment',
    title: 'Investment Portfolio',
    subtitle: 'Compound Wealth, SIP Escalation & Inflation Erosion',
    icon: PiggyBank,
    tags: ['Compounding', 'Inflation Drag', 'Expense Ratio', 'Safe Withdrawal'],
    keyQuestion: 'What is the real purchasing power of your portfolio after inflation and fees?',
  },
  {
    id: 'relocation',
    title: 'Relocation & Moving',
    subtitle: 'Cost of Living Delta, Moving Costs & Disposable Income',
    icon: MapPin,
    tags: ['Rent Delta', 'Transit Costs', 'One-time Move', 'Net Surplus'],
    keyQuestion: 'Does the target city salary increase exceed the local cost-of-living jump?',
  },
  {
    id: 'major_purchase',
    title: 'Major Purchase / Asset',
    subtitle: 'Total Cost of Ownership, Financing & Maintenance',
    icon: ShoppingBag,
    tags: ['Durability', 'Running Cost', 'Salvage Value', 'Capital Lockup'],
    keyQuestion: 'What is the true monthly cost of this asset across its full usable lifespan?',
  },
  {
    id: 'custom',
    title: 'Custom Multi-Option',
    subtitle: 'Arbitrary Decision Modeling (Option A vs Option B vs Option C)',
    icon: Sliders,
    tags: ['Multi-Choice', 'Custom Cash Flow', 'Reversibility', 'Flexible'],
    keyQuestion: 'Compare custom life options across independent financial and risk dimensions.',
  },
];

interface DecisionSelectorProps {
  onSelectCategory: (category: DecisionCategory) => void;
  selectedCategory: DecisionCategory | null;
}

export const DecisionSelector: React.FC<DecisionSelectorProps> = ({
  onSelectCategory,
  selectedCategory,
}) => {
  return (
    <div className="py-4 sm:py-6 w-full max-w-full">
      <div className="text-center mb-6 sm:mb-8 px-1">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] sm:text-xs font-medium text-emerald-400 mb-2.5 max-w-full">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Deterministic Calculation • Zero Fake Probabilities • User Autonomy</span>
        </div>
        <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white break-words">
          What major life decision are you evaluating?
        </h2>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Explore consequences, risk exposure, cash flow impact, and opportunity cost before committing. The simulator never decides for you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative flex flex-col justify-between rounded-xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer min-h-[44px] w-full ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 active:bg-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <div
                    className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border transition shrink-0 ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-300 group-hover:text-emerald-400 group-hover:border-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex items-center text-xs font-semibold text-slate-400 group-hover:text-emerald-400 transition">
                    Configure <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition break-words">
                  {cat.title}
                </h3>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  {cat.subtitle}
                </p>
                <p className="mt-2 text-[11px] sm:text-xs text-slate-400 italic bg-slate-950/70 p-2 sm:p-2.5 rounded-lg border border-slate-800/80 break-words leading-relaxed">
                  "{cat.keyQuestion}"
                </p>
              </div>

              <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 pt-2.5 sm:pt-3 border-t border-slate-800/60">
                {cat.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded bg-slate-800/80 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
