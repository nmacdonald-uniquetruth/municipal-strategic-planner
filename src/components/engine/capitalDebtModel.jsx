/**
 * Capital Investment & Debt Service Model
 * Handles capital project scheduling, bonding, and multi-year debt amortization
 */

/**
 * Generate annual debt service schedule for a bond / loan
 * @param {number} principal - Loan / bond amount
 * @param {number} interestRate - Annual interest rate (e.g. 0.045 for 4.5%)
 * @param {number} termYears - Loan term in years
 * @param {'equal_principal'|'level_debt_service'} method
 */
export function generateDebtSchedule(principal, interestRate, termYears, method = 'level_debt_service') {
  const schedule = [];
  let balance = principal;

  if (method === 'level_debt_service') {
    // Standard mortgage-style: equal total payment
    const payment = principal > 0 && interestRate > 0
      ? (principal * interestRate) / (1 - Math.pow(1 + interestRate, -termYears))
      : principal / termYears;

    for (let yr = 1; yr <= termYears; yr++) {
      const interest = Math.round(balance * interestRate);
      const principalPayment = Math.round(payment - interest);
      balance = Math.max(0, balance - principalPayment);
      schedule.push({
        year: yr,
        payment: Math.round(payment),
        principal: principalPayment,
        interest,
        balance,
      });
    }
  } else {
    // Equal principal
    const principalPayment = Math.round(principal / termYears);
    for (let yr = 1; yr <= termYears; yr++) {
      const interest = Math.round(balance * interestRate);
      balance = Math.max(0, balance - principalPayment);
      schedule.push({
        year: yr,
        payment: principalPayment + interest,
        principal: principalPayment,
        interest,
        balance,
      });
    }
  }

  return schedule;
}

/**
 * Aggregate multiple debt obligations into a single annual service total
 * @param {Array} obligations - [{ principal, interestRate, termYears, startYear, method? }]
 * @param {number} projectionYears
 */
export function aggregateDebtService(obligations = [], projectionYears = 5) {
  const totals = Array(projectionYears).fill(0);

  obligations.forEach(ob => {
    const schedule = generateDebtSchedule(
      ob.principal,
      ob.interestRate,
      ob.termYears,
      ob.method || 'level_debt_service'
    );
    schedule.forEach((row, i) => {
      const planYear = (ob.startYear || 1) + i - 1;
      if (planYear >= 1 && planYear <= projectionYears) {
        totals[planYear - 1] += row.payment;
      }
    });
  });

  return totals.map((total, i) => ({
    year: i + 1,
    label: `FY${2026 + i + 1}`,
    debtService: Math.round(total),
  }));
}

/**
 * Capital project queue — schedule capital outlays across years
 * @param {Array} projects - [{ name, totalCost, startYear, durationYears, fundSource, bondFinanced?, bondRate?, bondTerm? }]
 * @param {number} projectionYears
 */
export function scheduleCapitalProjects(projects = [], projectionYears = 5) {
  const yearlyCapital = Array.from({ length: projectionYears }, (_, i) => ({
    year: i + 1,
    label: `FY${2026 + i + 1}`,
    projects: [],
    totalOutlay: 0,
    totalBonded: 0,
    totalCashFunded: 0,
    debtServiceAdded: 0,
  }));

  projects.forEach(proj => {
    const annualOutlay = Math.round((proj.totalCost || 0) / (proj.durationYears || 1));
    for (let d = 0; d < (proj.durationYears || 1); d++) {
      const yr = (proj.startYear || 1) + d;
      if (yr >= 1 && yr <= projectionYears) {
        const isBonded = proj.bondFinanced && d === 0;
        yearlyCapital[yr - 1].projects.push({
          name: proj.name,
          outlay: annualOutlay,
          fundSource: proj.fundSource || 'capital_reserve',
          bonded: isBonded,
        });
        yearlyCapital[yr - 1].totalOutlay += annualOutlay;
        if (isBonded) yearlyCapital[yr - 1].totalBonded += proj.totalCost;
        else yearlyCapital[yr - 1].totalCashFunded += annualOutlay;
      }
    }
  });

  return yearlyCapital;
}

/**
 * Machias-specific known debt / capital obligations
 */
export const MACHIAS_KNOWN_OBLIGATIONS = [
  {
    name: 'Ambulance Vehicle Loan',
    principal: 130000,
    interestRate: 0.045,
    termYears: 5,
    startYear: 1,
    method: 'level_debt_service',
    fund: 'ambulance_fund',
  },
];

export const MACHIAS_CAPITAL_PLAN = [
  { name: 'ERP System Implementation', totalCost: 47000, startYear: 1, durationYears: 1, fundSource: 'general_fund', bondFinanced: false },
  { name: 'Police Cruiser Replacement', totalCost: 58000, startYear: 2, durationYears: 1, fundSource: 'capital_reserve', bondFinanced: false },
  { name: 'Public Works Equipment', totalCost: 95000, startYear: 3, durationYears: 1, fundSource: 'capital_reserve', bondFinanced: false },
  { name: 'Transfer Station Upgrades', totalCost: 120000, startYear: 2, durationYears: 2, fundSource: 'transfer_station_fund', bondFinanced: false },
];