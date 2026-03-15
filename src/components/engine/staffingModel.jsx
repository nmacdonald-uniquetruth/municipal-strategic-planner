/**
 * Staffing Cost Model
 * TotalPersonnelCost = Salary + Benefits + Overtime
 */

// Benefit rates
const BENEFIT_RATES = {
  fica: 0.0765,
  pers: 0.085,          // Maine PERS (legacy positions)
  icma_403b: 0.05,      // ICMA 403(b) match for new admin hires
  workers_comp: 0.025,
};

const HEALTH_PREMIUMS = {
  individual: 17721,
  employee_spouse: 24500,
  employee_children: 22800,
  family: 30938,
};

/**
 * Compute fully loaded cost for a single position
 * @param {object} position
 * @param {object} overrides - override global benefit rates
 */
export function fullyLoadedCost(position, overrides = {}) {
  const {
    baseSalary = 0,
    isStipend = false,
    healthTier = 'family',
    includefica = true,
    includePers = false,
    includeIcma = true,
    includeWc = true,
    overtimeHours = 0,
    hourlyRate = 0,
    partialYearFraction = 1.0,
  } = position;

  if (isStipend) {
    return { baseSalary, total: Math.round(baseSalary * partialYearFraction), breakdown: { stipend: baseSalary } };
  }

  const salary = baseSalary * partialYearFraction;
  const health = (HEALTH_PREMIUMS[healthTier] || HEALTH_PREMIUMS.family) * partialYearFraction;
  const fica = includefica ? salary * (overrides.fica || BENEFIT_RATES.fica) : 0;
  const pers = includePers ? salary * (overrides.pers || BENEFIT_RATES.pers) : 0;
  const icma = includeIcma && !includePers ? salary * (overrides.icma_403b || BENEFIT_RATES.icma_403b) : 0;
  const wc = includeWc ? salary * (overrides.workers_comp || BENEFIT_RATES.workers_comp) : 0;
  const overtime = overtimeHours * hourlyRate * 1.5;

  const total = salary + health + fica + pers + icma + wc + overtime;
  return {
    baseSalary: Math.round(salary),
    total: Math.round(total),
    breakdown: {
      salary: Math.round(salary),
      health: Math.round(health),
      fica: Math.round(fica),
      pers: Math.round(pers),
      icma: Math.round(icma),
      workersComp: Math.round(wc),
      overtime: Math.round(overtime),
    },
  };
}

/**
 * Project staffing costs across N years with wage growth
 * @param {Array} positions - array of position objects
 * @param {number} wageGrowthRate
 * @param {number} years
 */
export function projectStaffingCosts(positions, wageGrowthRate = 0.04, years = 5) {
  return Array.from({ length: years }, (_, i) => {
    const yr = i + 1;
    const escalator = Math.pow(1 + wageGrowthRate, yr - 1);

    const positionCosts = positions
      .filter(p => !p.startYear || p.startYear <= yr)
      .map(p => {
        const escalated = { ...p, baseSalary: Math.round((p.baseSalary || 0) * escalator) };
        // Handle partial first year for positions that start mid-plan
        if (p.startYear === yr && p.partialYearFraction) {
          escalated.partialYearFraction = p.partialYearFraction;
        } else if (p.startYear === yr) {
          escalated.partialYearFraction = 0.5; // default half-year for new hires
        }
        return { ...fullyLoadedCost(escalated), title: p.title };
      });

    return {
      year: yr,
      label: `FY${2026 + yr}`,
      positions: positionCosts,
      totalSalaries: positionCosts.reduce((s, p) => s + p.baseSalary, 0),
      totalBenefits: positionCosts.reduce((s, p) => s + (p.total - p.baseSalary), 0),
      totalPersonnelCost: positionCosts.reduce((s, p) => s + p.total, 0),
    };
  });
}

/**
 * Calculate savings from eliminating a position (stipend reallocation, etc.)
 */
export function eliminationSavings(positions, wageGrowthRate = 0.04, years = 5) {
  return projectStaffingCosts(positions, wageGrowthRate, years).map(yr => ({
    ...yr,
    totalSavings: yr.totalPersonnelCost,
  }));
}