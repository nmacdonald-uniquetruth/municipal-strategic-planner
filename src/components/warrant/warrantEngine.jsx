/**
 * Warrant & Article Engine
 * Pure functions — no React.
 *
 * Responsibilities:
 *  - Generate draft warrant language from budget data
 *  - Build article rollup totals
 *  - Validate article set (missing numbers, broken maps, duplicates, amount drift)
 *  - Generate board-ready and public-ready text variants
 */

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const mr  = n => (n || 0).toFixed(3);

// ─── Category metadata ─────────────────────────────────────────────────────────
export const ARTICLE_CATEGORIES = {
  municipal_appropriation:  { label: 'Municipal Appropriations', color: '#344A60', beteMap: 'municipalAppropriations' },
  school_appropriation:     { label: 'School Appropriations',    color: '#2A7F7F', beteMap: 'schoolAppropriations' },
  county_assessment:        { label: 'County Assessment',        color: '#9C5334', beteMap: 'countyAssessment' },
  revenue:                  { label: 'Revenue',                  color: '#2D7D46', beteMap: 'localRevenues' },
  tif:                      { label: 'TIF Financing',            color: '#6B5EA8', beteMap: 'tifFinancingPlan' },
  fund_balance_transfer:    { label: 'Fund Balance Transfer',    color: '#B5691E', beteMap: 'fundBalanceUse' },
  enterprise_appropriation: { label: 'Enterprise Appropriation', color: '#1a6b7a', beteMap: 'enterpriseOffsets' },
  policy_authorization:     { label: 'Policy / Authorization',   color: '#555',    beteMap: null },
  capital:                  { label: 'Capital Outlay',           color: '#7a3c6e', beteMap: null },
  debt_authorization:       { label: 'Debt Authorization',       color: '#a13030', beteMap: null },
  other:                    { label: 'Other',                    color: '#888',    beteMap: null },
};

export const VOTING_LABELS = {
  majority_voice:        'Majority (voice vote)',
  majority_written:      'Majority (written ballot)',
  secret_ballot:         'Secret ballot',
  two_thirds:            '2/3 majority',
  three_fifths:          '3/5 majority',
  majority_raise_hands:  'Majority (show of hands)',
  n_a:                   'N/A',
};

// ─── Draft language generator ──────────────────────────────────────────────────

/**
 * Generate standard Maine town meeting article language from a budget object.
 * Follows 30-A M.R.S.A. conventions.
 */
export function generateDraftText(article, calc) {
  const amt = fmt(article.financial_amount || 0);
  const fy  = article.fiscal_year || 'FY2027';

  const generators = {
    municipal_appropriation: () =>
      `To see if the Town will vote to raise and appropriate the sum of ${amt} for ${article.title || 'municipal operations'} for the fiscal year ${fy}, said sum to be raised by taxation.`,

    school_appropriation: () =>
      `To see if the Town will vote to raise and appropriate the sum of ${amt} for the town's share of the costs of elementary and secondary education for ${fy}, pursuant to 20-A M.R.S.A. § 15690.`,

    county_assessment: () =>
      `To see if the Town will vote to raise and appropriate the sum of ${amt} for Washington County taxes for ${fy}, as assessed by the Washington County Commissioners.`,

    revenue: () =>
      `To see if the Town will vote to accept the following revenues totaling ${amt} for ${fy} for the purpose of reducing the amount to be raised through taxation:\n${article.explanatory_notes || '[Revenue sources to be listed]'}`,

    tif: () =>
      `To see if the Town will vote to apply the sum of ${amt} retained in the Tax Increment Financing district toward the ${fy} financing plan, thereby reducing the amount to be raised through taxation, pursuant to 30-A M.R.S.A. § 5227.`,

    fund_balance_transfer: () =>
      `To see if the Town will vote to transfer the sum of ${amt} from undesignated fund balance to reduce the ${fy} tax commitment, thereby reducing the amount required to be raised through taxation.`,

    enterprise_appropriation: () =>
      `To see if the Town will vote to raise and appropriate the sum of ${amt} for the ${article.title || 'enterprise fund'} for ${fy}, said appropriation to be funded in whole or in part from enterprise fund revenues, with any shortfall raised by taxation.`,

    policy_authorization: () =>
      `To see if the Town will vote to authorize the ${article.title || 'Select Board'}, on behalf of the Town, to: ${article.explanatory_notes || '[authorization language to be completed by counsel]'}`,

    capital: () =>
      `To see if the Town will vote to raise and appropriate the sum of ${amt} for ${article.title || 'capital outlay'}, said sum to be expended under the direction of the Select Board.`,

    debt_authorization: () =>
      `To see if the Town will vote to authorize the municipal officers to issue bonds or notes in an amount not to exceed ${amt} for the purpose of ${article.title || 'capital improvements'}, pursuant to 30-A M.R.S.A. § 5772.`,

    other: () =>
      `To see if the Town will vote on the following matter: ${article.title}.\n${article.explanatory_notes || ''}`,
  };

  const gen = generators[article.category] || generators.other;
  return gen();
}

/**
 * Generate public-summary (plain language) version.
 */
export function generatePublicText(article) {
  const amt = fmt(article.financial_amount || 0);
  const change = article.prior_year_amount
    ? (() => {
        const diff = (article.financial_amount || 0) - article.prior_year_amount;
        const pct  = Math.abs(article.prior_year_amount) > 0 ? Math.abs((diff / article.prior_year_amount) * 100).toFixed(1) : null;
        return diff === 0 ? 'Same as last year.'
          : diff > 0
            ? `This is an increase of ${fmt(diff)}${pct ? ` (${pct}%)` : ''} from last year.`
            : `This is a decrease of ${fmt(Math.abs(diff))}${pct ? ` (${pct}%)` : ''} from last year.`;
      })()
    : '';

  return `${article.title}:\nThis article asks voters to approve ${amt} for ${ARTICLE_CATEGORIES[article.category]?.label || article.category}. ${change}${article.tax_impact_note ? ` Tax impact: ${article.tax_impact_note}` : ''}${article.explanatory_notes ? `\n\nAdditional detail: ${article.explanatory_notes}` : ''}`.trim();
}

/**
 * Generate board-presentation version (concise, with financial context).
 */
export function generateBoardText(article, calc) {
  const amt = fmt(article.financial_amount || 0);
  const pyAmt = article.prior_year_amount ? fmt(article.prior_year_amount) : null;
  return [
    `Article ${article.article_number} — ${article.title}`,
    `Requested: ${amt}${pyAmt ? ` (Prior year: ${pyAmt})` : ''}`,
    article.tax_impact_note ? `Tax impact: ${article.tax_impact_note}` : null,
    article.explanatory_notes ? `Notes: ${article.explanatory_notes}` : null,
    `Vote: ${VOTING_LABELS[article.voting_method] || article.voting_method}`,
  ].filter(Boolean).join('\n');
}

// ─── Rollup totals ─────────────────────────────────────────────────────────────

/**
 * Aggregate articles into BETE-form rollup buckets.
 */
export function buildArticleRollup(articles) {
  const rollup = {
    municipalAppropriations: 0,
    schoolAppropriations: 0,
    countyAssessment: 0,
    localRevenues: 0,
    tifFinancingPlan: 0,
    fundBalanceUse: 0,
    enterpriseOffsets: 0,
    other: 0,
    totalAppropriations: 0,
    totalDeductions: 0,
    netToBeRaised: 0,
  };

  const deductionCategories = new Set(['revenue','tif','fund_balance_transfer','enterprise_appropriation']);

  articles.forEach(a => {
    const amt = a.financial_amount || 0;
    const cat = ARTICLE_CATEGORIES[a.category];
    const beteKey = cat?.beteMap;
    if (beteKey && beteKey in rollup) {
      rollup[beteKey] += amt;
    } else {
      rollup.other += amt;
    }
    if (deductionCategories.has(a.category)) {
      rollup.totalDeductions += amt;
    } else if (['municipal_appropriation','school_appropriation','county_assessment','capital','enterprise_appropriation'].includes(a.category)) {
      rollup.totalAppropriations += amt;
    }
  });

  rollup.netToBeRaised = Math.max(0, rollup.totalAppropriations - rollup.totalDeductions);
  return rollup;
}

// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate a set of articles.
 * Returns { errors: [], warnings: [], info: [] }
 */
export function validateArticles(articles, budgetCalc) {
  const errors   = [];
  const warnings = [];
  const info     = [];

  // 1. Check for missing article numbers
  articles.forEach(a => {
    if (!a.article_number || a.article_number.trim() === '') {
      errors.push({ id: a.id || a.title, msg: `Article "${a.title}" has no article number.`, field: 'article_number' });
    }
    if (!a.title || a.title.trim() === '') {
      errors.push({ id: a.id, msg: `An article with number "${a.article_number}" has no title.`, field: 'title' });
    }
    if (!a.draft_text || a.draft_text.trim() === '') {
      warnings.push({ id: a.id, msg: `Article ${a.article_number} has no draft text. Use "Generate" to create it.`, field: 'draft_text' });
    }
    if ((a.financial_amount || 0) === 0 && ['municipal_appropriation','school_appropriation','county_assessment','enterprise_appropriation','capital'].includes(a.category)) {
      warnings.push({ id: a.id, msg: `Article ${a.article_number} (${a.title}) has a $0 amount — verify.`, field: 'financial_amount' });
    }
  });

  // 2. Check for duplicate article numbers
  const nums = articles.map(a => a.article_number).filter(Boolean);
  const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
  [...new Set(dupes)].forEach(n => {
    errors.push({ id: n, msg: `Duplicate article number: "${n}" appears more than once.`, field: 'article_number' });
  });

  // 3. Cross-check rollup against BETE calc (if provided)
  if (budgetCalc) {
    const rollup = buildArticleRollup(articles);
    const muniDiff = Math.abs(rollup.municipalAppropriations - (budgetCalc.municipalAppropriations || 0));
    const schoolDiff = Math.abs(rollup.schoolAppropriations - (budgetCalc.schoolAppropriations || 0));
    const countyDiff = Math.abs(rollup.countyAssessment - (budgetCalc.countyAssessment || 0));

    if (muniDiff > 100) {
      warnings.push({ id: 'rollup_municipal', msg: `Municipal appropriation articles total ${fmt(rollup.municipalAppropriations)} but BETE form shows ${fmt(budgetCalc.municipalAppropriations)}. Difference: ${fmt(muniDiff)}.`, field: 'financial_amount' });
    }
    if (schoolDiff > 100) {
      warnings.push({ id: 'rollup_school', msg: `School appropriation articles total ${fmt(rollup.schoolAppropriations)} but BETE form shows ${fmt(budgetCalc.schoolAppropriations)}. Difference: ${fmt(schoolDiff)}.`, field: 'financial_amount' });
    }
    if (countyDiff > 100) {
      warnings.push({ id: 'rollup_county', msg: `County assessment article total ${fmt(rollup.countyAssessment)} but BETE form shows ${fmt(budgetCalc.countyAssessment)}. Difference: ${fmt(countyDiff)}.`, field: 'financial_amount' });
    }
    if (rollup.netToBeRaised > 0 && Math.abs(rollup.netToBeRaised - (budgetCalc.netToBeRaised || 0)) > 500) {
      warnings.push({ id: 'rollup_net', msg: `Article rollup net raised (${fmt(rollup.netToBeRaised)}) does not match BETE form (${fmt(budgetCalc.netToBeRaised)}).`, field: 'financial_amount' });
    }
  }

  // 4. Frozen text warnings
  articles.filter(a => a.text_frozen && a.legal_review_status === 'not_reviewed').forEach(a => {
    warnings.push({ id: a.id, msg: `Article ${a.article_number} text is frozen but has not completed legal review.`, field: 'legal_review_status' });
  });

  // 5. Info
  const frozenCount = articles.filter(a => a.text_frozen).length;
  if (frozenCount > 0) {
    info.push({ id: 'frozen', msg: `${frozenCount} article${frozenCount > 1 ? 's' : ''} have frozen text. Financial calculations will continue to update.` });
  }

  return { errors, warnings, info };
}

// ─── Number gap detection ──────────────────────────────────────────────────────

/**
 * Detect gaps in sequential article numbering (e.g. 1,2,4 → missing 3).
 */
export function findNumberingGaps(articles) {
  const nums = articles
    .map(a => parseInt(a.article_number?.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  const gaps = [];
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i + 1] - nums[i] > 1) {
      for (let g = nums[i] + 1; g < nums[i + 1]; g++) gaps.push(g);
    }
  }
  return gaps;
}