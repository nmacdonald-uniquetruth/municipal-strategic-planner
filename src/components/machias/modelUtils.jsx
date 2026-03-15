/**
 * modelUtils.js — Canonical Financial Helpers
 *
 * Single source for:
 *   - calculateFullyLoadedCost()  (replaces copies in FinancialModel, FinancialModelV2, ModelContext, sharedAssumptions)
 *   - calculateMillRateImpact()   (replaces copies in taxImpactCalculator, calculationEngine, FinancialModelV2)
 *   - formatCurrency()            (replaces copies in taxImpactCalculator, regionalRevenueCalculator)
 *   - formatMillRate()
 *
 * All other modules MUST import from here. Do not define these functions anywhere else.
 */

// ─── Fully-Loaded Cost ────────────────────────────────────────────────────────

/**
 * Health insurance annual cost by tier.
 * Reads live values from settings; falls back to well-known Machias actuals.
 */
export function healthCostForTier(tier, settings) {
  const ind = settings?.health_individual_annual ?? 17721;
  const fam = settings?.health_family_annual ?? 30938;
  const tiers = {
    individual:       ind,
    employee_spouse:  fam,           // same as family in Machias MMEHT plan
    employee_children: Math.round(ind * 1.38),  // ~$24,437
    family:           fam,
    none:             0,
  };
  return tiers[tier] ?? fam;
}

/**
 * Fully-loaded annual cost for a salaried position.
 *
 * @param {number}  baseSalary
 * @param {object}  settings    - ModelContext settings (live values from DB)
 * @param {object}  [opts]
 * @param {string}  [opts.healthTier]   - overrides settings.health_tier
 * @param {boolean} [opts.isStipend]    - stipend roles: no benefits, just raw amount
 * @param {boolean} [opts.icmaInstead]  - use ICMA 403(b) match instead of Maine PERS
 */
export function calculateFullyLoadedCost(baseSalary, settings, opts = {}) {
  const { isStipend = false, healthTier, icmaInstead = true } = opts;
  if (isStipend) return baseSalary;

  const tier   = healthTier ?? settings?.health_tier ?? 'family';
  const fica   = baseSalary * (settings?.fica_rate   ?? 0.0765);
  const wc     = baseSalary * (settings?.wc_rate     ?? 0.025);
  const health = healthCostForTier(tier, settings);

  // Admin positions use ICMA 403(b) match; frontline uses Maine PERS
  const retirement = icmaInstead
    ? baseSalary * (settings?.icma_403b_match_rate ?? 0.05)
    : baseSalary * (settings?.pers_rate ?? 0.085);

  return Math.round(baseSalary + fica + wc + health + retirement);
}

// ─── Tax / Mill Rate ─────────────────────────────────────────────────────────

/**
 * Core tax impact calculation — single authoritative formula.
 *
 * @param {number} annualNetChange  positive = cost increase / negative = savings
 * @param {object} settings         ModelContext settings
 * @returns {{
 *   net_municipal_cost: number,
 *   tax_levy_change: number,
 *   new_tax_levy: number,
 *   mill_rate_change: number,     // positive = increase, negative = decrease
 *   new_mill_rate: number,
 *   per_100k_change: number,
 *   annual_per_household: number, // assumes $250k avg home value
 *   percentage_levy_change: number,
 * }}
 */
export function calculateMillRateImpact(annualNetChange, settings) {
  const levy   = settings?.annual_tax_levy        ?? 2871000;
  const av     = settings?.total_assessed_value   ?? 198000000;
  const curMR  = settings?.current_mill_rate      ?? 14.5;

  const newLevy      = levy + annualNetChange;
  const newMillRate  = (newLevy / av) * 1000;
  const millChange   = newMillRate - curMR;
  const per100k      = (millChange / 1000) * 100000;
  const perHousehold = (millChange / 1000) * 250000;

  return {
    net_municipal_cost:       annualNetChange,
    tax_levy_change:          annualNetChange,
    new_tax_levy:             newLevy,
    mill_rate_change:         millChange,
    new_mill_rate:            newMillRate,
    per_100k_change:          per100k,
    annual_per_household:     perHousehold,
    percentage_levy_change:   levy > 0 ? (annualNetChange / levy) * 100 : 0,
  };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/** Canonical currency formatter — import this everywhere instead of defining locally */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMillRate(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(3)}M`;
}

export function formatPercentage(value) {
  if (value == null || isNaN(value)) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}