import React from 'react';
import { DecisionCategory } from '../types/decision';
import { Scale, ArrowRight, ShieldCheck, Cpu, LineChart, BookOpen } from 'lucide-react';
import { CATEGORIES } from './DecisionSelector';

interface LandingHeroProps {
  onSelectCategory: (cat: DecisionCategory) => void;
  onOpenDemos: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSelectCategory,
  onOpenDemos,
}) => {
  return (
    <div className="space-y-8 sm:space-y-12 py-4 sm:py-8 w-full max-w-full">
      {/* Hero Section */}
      <div className="relative text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 px-1">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-400 max-w-full">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Deterministic Life Simulation Engine</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight break-words">
          See the possible future <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            before you decide.
          </span>
        </h1>

        <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Evaluate vehicles, real estate, job transitions, degrees, startups, and debt. Pure deterministic financial mathematics with multi-scenario sensitivity and objective trade-off analysis.
        </p>

        {/* CTA Buttons - Stack on mobile, inline on sm+ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-2 w-full max-w-sm sm:max-w-none mx-auto">
          <button
            onClick={() => onSelectCategory('car')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 min-h-[44px]"
          >
            Start New Simulation <ArrowRight className="h-4 w-4 shrink-0" />
          </button>

          <button
            onClick={onOpenDemos}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white active:bg-slate-700 transition min-h-[44px]"
          >
            <BookOpen className="h-4 w-4 text-emerald-400 shrink-0" />
            Explore Pre-Built Demos
          </button>
        </div>
      </div>

      {/* 3 Core Architectural Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 space-y-1.5 sm:space-y-2">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white">100% Deterministic Engine</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            All mathematics use closed-form equations. AI never performs or overrides numerical calculations.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 space-y-1.5 sm:space-y-2">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <LineChart className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white">No Universal Single Score</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            Never reduced to a fake score. We show independent dimensions: cash flow, liquidity, opportunity cost, and reversibility.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 space-y-1.5 sm:space-y-2">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white">Absolute User Autonomy</h3>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            The simulator will never tell you what decision to make. Your priorities, personal values, and risk preferences remain your own.
          </p>
        </div>
      </div>

      {/* Popular Decisions Catalog Preview */}
      <div className="space-y-3 sm:space-y-4 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white truncate">Supported Decision Simulators</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Select any category to launch a custom simulation model</p>
          </div>
          <span className="text-[11px] sm:text-xs text-emerald-400 font-semibold shrink-0">10 Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="flex flex-col items-center text-center p-2.5 sm:p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900 active:bg-slate-800 transition group min-h-[44px] w-full"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-slate-950 text-slate-400 border border-slate-800 group-hover:text-emerald-400 group-hover:border-slate-700 transition mb-1.5 sm:mb-2 shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition line-clamp-2 break-words leading-snug">
                  {cat.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
