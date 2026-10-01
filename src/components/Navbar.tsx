import React, { useState } from 'react';
import { CurrencyCode } from '../types/decision';
import { Language, TRANSLATIONS } from '../lib/i18n';
import { Bookmark, BookOpen, Scale, Menu, X, Globe, DollarSign } from 'lucide-react';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  currency: CurrencyCode;
  onCurrencyChange: (curr: CurrencyCode) => void;
  onOpenSaved: () => void;
  savedCount: number;
  onOpenDemos: () => void;
  onHomeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  currency,
  onCurrencyChange,
  onOpenSaved,
  savedCount,
  onOpenDemos,
  onHomeClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[currentLang];

  const handleMobileNavAction = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3">
        {/* Brand */}
        <button
          onClick={() => {
            onHomeClick();
            setMobileMenuOpen(false);
          }}
          className="flex min-w-0 items-center gap-2 text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-1"
          aria-label="Home - Life Decision Simulator"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 truncate">
            <span className="block truncate text-sm font-extrabold tracking-tight text-white sm:text-base md:text-lg">
              {t.appTitle}
            </span>
            <span className="hidden text-[11px] text-slate-400 sm:block">
              Deterministic Life Simulation Engine
            </span>
          </div>
        </button>

        {/* Desktop Controls (hidden on mobile, visible on md+) */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Demo Button */}
          <button
            onClick={onOpenDemos}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white min-h-[36px]"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t.exploreDemos}</span>
          </button>

          {/* Saved Button */}
          <button
            onClick={onOpenSaved}
            className="relative flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white min-h-[36px]"
          >
            <Bookmark className="h-3.5 w-3.5 text-sky-400" />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-slate-950">
                {savedCount}
              </span>
            )}
          </button>

          {/* Currency Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 text-xs">
            {(['INR', 'USD', 'EUR'] as CurrencyCode[]).map((c) => (
              <button
                key={c}
                onClick={() => onCurrencyChange(c)}
                className={`rounded px-2 py-1 font-medium transition min-h-[32px] ${
                  currency === c
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c === 'INR' ? '₹ INR' : c === 'USD' ? '$ USD' : '€ EUR'}
              </button>
            ))}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 text-xs">
            <button
              onClick={() => onLanguageChange('en')}
              className={`rounded px-2.5 py-1 font-medium transition min-h-[32px] ${
                currentLang === 'en'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`rounded px-2.5 py-1 font-medium transition min-h-[32px] ${
                currentLang === 'hi'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>

        {/* Mobile Header Right (Quick Currency toggle + Hamburger) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {/* Quick cycle currency on mobile */}
          <button
            onClick={() => {
              const next: Record<CurrencyCode, CurrencyCode> = { INR: 'USD', USD: 'EUR', EUR: 'INR' };
              onCurrencyChange(next[currency]);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-emerald-400 min-h-[40px] active:bg-slate-800"
            title="Cycle currency"
            aria-label={`Currency: ${currency}. Tap to change.`}
          >
            <span>{currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€'}</span>
            <span className="text-[11px] text-slate-300">{currency}</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white active:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          {/* Quick Nav Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleMobileNavAction(onOpenDemos)}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-3 text-xs font-semibold text-slate-200 active:bg-slate-800 min-h-[44px]"
            >
              <BookOpen className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate">{t.exploreDemos}</span>
            </button>

            <button
              onClick={() => handleMobileNavAction(onOpenSaved)}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-3 text-xs font-semibold text-slate-200 active:bg-slate-800 min-h-[44px]"
            >
              <Bookmark className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Saved ({savedCount})</span>
            </button>
          </div>

          {/* Currency Selection Grid */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Display Currency
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['INR', 'USD', 'EUR'] as CurrencyCode[]).map((c) => (
                <button
                  key={c}
                  onClick={() => onCurrencyChange(c)}
                  className={`flex items-center justify-center py-2.5 rounded-lg text-xs font-bold transition min-h-[44px] ${
                    currency === c
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 active:bg-slate-800'
                  }`}
                >
                  {c === 'INR' ? '₹ INR' : c === 'USD' ? '$ USD' : '€ EUR'}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection Grid */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Language / भाषा
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onLanguageChange('en')}
                className={`py-2.5 rounded-lg text-xs font-bold transition min-h-[44px] ${
                  currentLang === 'en'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 active:bg-slate-800'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`py-2.5 rounded-lg text-xs font-bold transition min-h-[44px] ${
                  currentLang === 'hi'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 active:bg-slate-800'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
