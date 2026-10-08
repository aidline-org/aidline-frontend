'use client';

import { CURRENCIES, type Currency, useFiat } from '@/lib/fiat';

export function CurrencyPicker() {
  const { currency, setCurrency } = useFiat();

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
      <label htmlFor="currency-select" className="sr-only">
        Select local currency
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="rounded-[2px] border border-rule bg-paper px-2 py-0.5 font-mono text-xs text-ink transition-colors hover:bg-paper-raised focus:outline-none focus:ring-1 focus:ring-ink"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
