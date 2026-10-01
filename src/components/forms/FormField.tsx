import React from 'react';
import { AssumptionSource, CurrencyCode } from '../../types/decision';
import { formatCurrency } from '../../lib/formatters';

interface FormFieldProps {
  label: string;
  id: string;
  value: number | string;
  onChange: (val: any) => void;
  type?: 'number' | 'text' | 'select';
  currency?: CurrencyCode;
  isCurrency?: boolean;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  error?: string;
  hint?: string;
  sourceBadge?: AssumptionSource;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  value,
  onChange,
  type = 'number',
  currency = 'INR',
  isCurrency = false,
  unit,
  step = 1,
  min = 0,
  max,
  error,
  hint,
  sourceBadge,
  placeholder,
  options,
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';

  const badgeColor =
    sourceBadge === 'user'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      : sourceBadge === 'default'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-purple-500/10 text-purple-400 border-purple-500/30';

  const numericVal = typeof value === 'number' ? value : parseFloat(String(value));
  const hasValidNumericAmount = !isNaN(numericVal) && isFinite(numericVal) && numericVal > 0;

  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      {/* Label and Badge with proper wrap support */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <label htmlFor={id} className="text-xs font-semibold text-slate-300 break-words flex-1 min-w-0">
          {label}
        </label>
        {sourceBadge && (
          <span
            className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}
            title={`Source: ${sourceBadge} assumption`}
          >
            {sourceBadge}
          </span>
        )}
      </div>

      <div className="relative rounded-lg shadow-sm w-full min-w-0">
        {isCurrency && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-sm font-bold text-slate-400 select-none">{currencySymbol}</span>
          </div>
        )}

        {type === 'select' ? (
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`block w-full min-w-0 rounded-lg border bg-slate-900 px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 min-h-[42px] transition ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
            }`}
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            step={step}
            min={min}
            max={max}
            placeholder={placeholder}
            onChange={(e) => {
              if (type === 'number') {
                const parsed = parseFloat(e.target.value);
                onChange(isNaN(parsed) ? '' : parsed);
              } else {
                onChange(e.target.value);
              }
            }}
            className={`block w-full min-w-0 rounded-lg border bg-slate-900 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 min-h-[42px] transition ${
              isCurrency && unit ? 'pl-8 pr-14' : isCurrency ? 'pl-8 pr-3' : unit ? 'pl-3 pr-14' : 'px-3'
            } ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-950/10'
                : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
            }`}
          />
        )}

        {unit && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-xs font-semibold text-slate-400 select-none">{unit}</span>
          </div>
        )}
      </div>

      {/* Formatted amount preview for readability on large values */}
      {isCurrency && hasValidNumericAmount && (
        <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-400/90 break-words flex items-center gap-1">
          <span>≈</span>
          <span>{formatCurrency(numericVal, currency)}</span>
          {currency === 'INR' && numericVal >= 100000 && (
            <span className="text-slate-400 text-[10px]">({formatCurrency(numericVal, currency, true)})</span>
          )}
        </div>
      )}

      {hint && !error && <p className="text-[11px] text-slate-400 break-words leading-tight">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-rose-400 break-words leading-tight">{error}</p>}
    </div>
  );
};
