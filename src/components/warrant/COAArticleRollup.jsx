/**
 * COA Article Rollup — warrant articles driven by approved COA mapping
 * Aggregates COA accounts by budget_article_mapping field
 */
import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Link2 } from 'lucide-react';
import TraceabilityPanel from '../budget/TraceabilityPanel';

const fmt = n => !n ? '—' : `$${Math.round(Math.abs(n)).toLocaleString()}`;

export default function COAArticleRollup({ coaAccounts, budgetData = {} }) {
  const [expanded, setExpanded] = useState(null);

  // Group COA accounts by article
  const byArticle = useMemo(() => {
    const grouped = {};
    (coaAccounts || [])
      .filter(a => a.validation_status === 'approved' && a.status === 'active' && a.budget_article_mapping)
      .forEach(acct => {
        const article = acct.budget_article_mapping;
        if (!grouped[article]) {
          grouped[article] = {
            article,
            accounts: [],
            total_budget: 0,
            total_actual: 0,
          };
        }
        const budgetVal = budgetData[acct.new_account_number]?.adopted_budget || acct.trio_historical_budget || 0;
        const actualVal = budgetData[acct.new_account_number]?.ytd_actual || acct.trio_historical_actual || 0;
        grouped[article].accounts.push({ ...acct, budgetVal, actualVal });
        grouped[article].total_budget += budgetVal;
        grouped[article].total_actual += actualVal;
      });
    return grouped;
  }, [coaAccounts, budgetData]);

  const articles = useMemo(
    () => Object.values(byArticle).sort((a, b) => (a.article || '').localeCompare(b.article || '')),
    [byArticle]
  );

  const grandTotal = useMemo(
    () => articles.reduce((s, a) => s + a.total_budget, 0),
    [articles]
  );

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-slate-600 px-3 py-2 bg-slate-50 rounded">
        {articles.length} Warrant Article{articles.length !== 1 ? 's' : ''} with Approved COA Accounts
      </div>

      {articles.length === 0 ? (
        <div className="p-4 text-center text-sm text-slate-400 bg-slate-50 rounded">No articles linked to approved COA accounts</div>
      ) : (
        <>
          {articles.map(article => (
            <div key={article.article} className="border border-slate-200 rounded-lg bg-white">
              {/* Article header */}
              <button
                onClick={() => setExpanded(expanded === article.article ? null : article.article)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {expanded === article.article ? (
                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{article.article}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{article.accounts.length} account{article.accounts.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{fmt(article.total_budget)}</p>
                  <p className="text-[9px] text-slate-500">Budget</p>
                </div>
              </button>

              {/* Expanded accounts list */}
              {expanded === article.article && (
                <div className="border-t border-slate-200 bg-slate-50 p-3 space-y-2">
                  {article.accounts.map(acct => (
                    <div key={acct.id} className="bg-white border border-slate-200 rounded p-2">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono font-bold text-slate-900 truncate">{acct.new_account_number}</p>
                          <p className="text-[9px] text-slate-600 leading-snug">{acct.new_account_title}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-slate-900">{fmt(acct.budgetVal)}</p>
                          <p className="text-[9px] text-slate-500">{acct.account_type}</p>
                        </div>
                      </div>
                      <div className="pl-0">
                        <TraceabilityPanel
                          newAccountNumber={acct.new_account_number}
                          coaAccounts={coaAccounts}
                          budgetValue={acct.budgetVal}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Article subtotal */}
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Subtotal</p>
                      <p className="text-sm font-bold text-amber-900">{fmt(article.total_budget)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Grand total */}
          <div className="bg-slate-900 text-white rounded-lg p-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold uppercase tracking-wider">Total All Articles</p>
              <p className="text-lg font-bold">{fmt(grandTotal)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}