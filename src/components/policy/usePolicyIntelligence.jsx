/**
 * usePolicyIntelligence — React hook
 * Connects the policy intelligence engine to UI components.
 * Provides: scored items, impact records, AI generation, alert evaluation,
 * watchlist filtering, and output object building.
 */
import { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  batchScoreItems,
  generateRuleBasedInsights,
  evaluateAlertTriggers,
  filterByWatchlists,
  buildExecutiveBrief,
  buildBoardPacket,
  buildBudgetRiskSummary,
  buildGrantOpportunitySummary,
  buildDepartmentSummary,
  buildMonthlyMemo,
  runIngestionPipeline,
  SCORING_VERSION,
} from './policyIntelligenceEngine';

export function usePolicyIntelligence(items = [], profile = null, events = []) {
  const queryClient = useQueryClient();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Load persisted impact records
  const { data: persistedImpacts = [] } = useQuery({
    queryKey: ['municipal_impact_records'],
    queryFn: () => base44.entities.MunicipalImpactRecord.filter({}),
    initialData: [],
    staleTime: 5 * 60 * 1000,
  });

  // Load watchlists
  const { data: watchlists = [] } = useQuery({
    queryKey: ['policy_watchlists'],
    queryFn: () => base44.entities.PolicyWatchlist.filter({ is_active: true }),
    initialData: [],
  });

  // Load alerts
  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['policy_alerts'],
    queryFn: () => base44.entities.PolicyAlert.filter({ is_dismissed: false }),
    initialData: [],
  });

  // Persist impact record mutation
  const saveImpactRecord = useMutation({
    mutationFn: async (record) => {
      // Upsert: check if one exists for this item
      const existing = persistedImpacts.find(r => r.policy_item_id === record.policy_item_id);
      if (existing?.id) {
        return base44.entities.MunicipalImpactRecord.update(existing.id, record);
      }
      return base44.entities.MunicipalImpactRecord.create(record);
    },
    onSuccess: () => queryClient.invalidateQueries(['municipal_impact_records']),
  });

  // Save alert mutation
  const saveAlert = useMutation({
    mutationFn: d => base44.entities.PolicyAlert.create(d),
    onSuccess: () => queryClient.invalidateQueries(['policy_alerts']),
  });

  // ── Build impact map (persisted overrides rule-based) ──────────────────────
  const ruleBasedImpacts = useMemo(() => {
    if (!profile || !items.length) return [];
    return batchScoreItems(items, profile);
  }, [items, profile]);

  const impactMap = useMemo(() => {
    const map = {};
    // Start with rule-based
    ruleBasedImpacts.forEach(r => { if (r.policy_item_id) map[r.policy_item_id] = r; });
    // Override with persisted (which may include AI-generated)
    persistedImpacts.forEach(r => {
      if (r.policy_item_id) map[r.policy_item_id] = { ...map[r.policy_item_id], ...r };
    });
    return map;
  }, [ruleBasedImpacts, persistedImpacts]);

  // ── Enrich items with scoring ─────────────────────────────────────────────
  // Items suppressed by governance-type rules are still included but receive
  // score 0 and priority 'watch', unless the user has manually watched/flagged them.
  const scoredItems = useMemo(() =>
    items.map(item => {
      const impact = impactMap[item.id] || null;
      const suppressed = impact?._suppressed && !item.is_watched && !item.is_flagged_urgent;
      return {
        ...item,
        _impact: impact,
        _suppressed: suppressed,
        relevance_score:   suppressed ? 0 : (impact?.overall_relevance_score ?? item.relevance_score ?? 0),
        priority:          suppressed ? 'watch' : (impact?.priority_level ?? item.priority ?? 'watch'),
        departments_affected: impact?.department_matches?.length
          ? impact.department_matches
          : item.departments_affected || [],
      };
    }),
  [items, impactMap]);

  // ── Output objects ────────────────────────────────────────────────────────
  const impactRecordsList = Object.values(impactMap);

  const executiveBrief = useMemo(() =>
    buildExecutiveBrief(scoredItems, impactRecordsList, profile),
  [scoredItems, impactRecordsList, profile]);

  const boardPacket = useMemo(() =>
    buildBoardPacket(scoredItems, impactRecordsList, profile),
  [scoredItems, impactRecordsList, profile]);

  const budgetRiskSummary = useMemo(() =>
    buildBudgetRiskSummary(scoredItems, impactRecordsList, profile),
  [scoredItems, impactRecordsList, profile]);

  const grantSummary = useMemo(() =>
    buildGrantOpportunitySummary(scoredItems, impactRecordsList, profile),
  [scoredItems, impactRecordsList, profile]);

  const monthlyMemo = useMemo(() =>
    buildMonthlyMemo(scoredItems, impactRecordsList, profile),
  [scoredItems, impactRecordsList, profile]);

  // ── Watchlist-filtered items ──────────────────────────────────────────────
  const watchlistItems = useMemo(() =>
    filterByWatchlists(scoredItems, watchlists),
  [scoredItems, watchlists]);

  // ── Alert evaluation ──────────────────────────────────────────────────────
  const pendingAlerts = useMemo(() => {
    if (!scoredItems.length) return [];
    const allAlerts = [];
    scoredItems.forEach(item => {
      const impact = impactMap[item.id];
      const alerts = evaluateAlertTriggers(item, impact, watchlists);
      allAlerts.push(...alerts);
    });
    return allAlerts;
  }, [scoredItems, impactMap, watchlists]);

  // ── AI insight generation ─────────────────────────────────────────────────
  const generateAIInsights = useCallback(async (item, mode = 'full') => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await base44.functions.invoke('policyIntelligence', {
        item,
        profile,
        generate_mode: mode,
      });
      const aiData = response.data;

      // Merge AI output with existing rule-based impact record
      const existing = impactMap[item.id] || {};
      const merged = {
        ...existing,
        policy_item_id:        item.id,
        municipality_name:     profile?.name || '',
        municipality_profile_id: profile?.id || '',
        why_it_matters_summary:       aiData.why_it_matters_summary       || existing.why_it_matters_summary,
        plain_language_summary:       aiData.plain_language_summary        || existing.plain_language_summary,
        what_changed:                 aiData.what_changed                  || existing.what_changed,
        who_it_affects:               aiData.who_it_affects                || existing.who_it_affects,
        possible_budget_impact:       aiData.possible_budget_impact        || existing.possible_budget_impact,
        possible_operational_impact:  aiData.possible_operational_impact   || existing.possible_operational_impact,
        possible_hr_impact:           aiData.possible_hr_impact            || existing.possible_hr_impact,
        possible_compliance_impact:   aiData.possible_compliance_impact    || existing.possible_compliance_impact,
        possible_capital_impact:      aiData.possible_capital_impact       || existing.possible_capital_impact,
        possible_funding_opportunity: aiData.possible_funding_opportunity  || existing.possible_funding_opportunity,
        risks_if_enacted:             aiData.risks_if_enacted              || existing.risks_if_enacted,
        risks_if_not_addressed:       aiData.risks_if_not_addressed        || existing.risks_if_not_addressed,
        recommended_actions:          aiData.suggested_next_actions        || existing.recommended_actions,
        recommended_owner_role:       aiData.recommended_owner_role        || existing.recommended_owner_role,
        department_matches:           aiData.related_departments?.length   ? aiData.related_departments : existing.department_matches,
        strategic_goal_matches:       aiData.related_strategic_goals?.length ? aiData.related_strategic_goals : existing.strategic_goal_matches,
        overall_relevance_score:      aiData.overall_relevance_score       ?? existing.overall_relevance_score,
        priority_level:               aiData.priority_level                || existing.priority_level,
        generation_method:            'ai_generated',
        generated_at:                 aiData.generated_at,
        scoring_version:              aiData.scoring_version || SCORING_VERSION,
      };

      await saveImpactRecord.mutateAsync(merged);
      return merged;
    } catch (err) {
      setAiError(err.message);
      throw err;
    } finally {
      setAiLoading(false);
    }
  }, [profile, impactMap, saveImpactRecord]);

  // ── Batch AI generation ───────────────────────────────────────────────────
  const generateBatchInsights = useCallback(async (itemsToScore) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await base44.functions.invoke('policyIntelligence', {
        profile,
        generate_mode: 'batch',
        items: itemsToScore,
      });
      const { results } = response.data;
      // Persist each result
      await Promise.all(results.map(aiData => {
        const existing = impactMap[aiData.item_id] || {};
        return saveImpactRecord.mutateAsync({
          ...existing,
          policy_item_id:       aiData.item_id,
          municipality_name:    profile?.name || '',
          why_it_matters_summary: aiData.why_it_matters_summary,
          recommended_actions:  aiData.recommended_actions,
          priority_level:       aiData.priority_level,
          generation_method:    'ai_generated',
          generated_at:         aiData.generated_at,
          scoring_version:      SCORING_VERSION,
        });
      }));
      return results;
    } catch (err) {
      setAiError(err.message);
      throw err;
    } finally {
      setAiLoading(false);
    }
  }, [profile, impactMap, saveImpactRecord]);

  // ── Manual impact record override ─────────────────────────────────────────
  const saveManualImpact = useCallback(async (itemId, overrides) => {
    const existing = impactMap[itemId] || {};
    return saveImpactRecord.mutateAsync({
      ...existing,
      ...overrides,
      policy_item_id:   itemId,
      municipality_name: profile?.name || '',
      manual_override:  true,
      generation_method: 'manual_override',
      generated_at:     new Date().toISOString(),
      scoring_version:  SCORING_VERSION,
    });
  }, [impactMap, profile, saveImpactRecord]);

  // ── Trigger alert persistence ─────────────────────────────────────────────
  const persistPendingAlerts = useCallback(async () => {
    // Avoid duplicating already-existing active alerts
    const existingKeys = new Set(activeAlerts.map(a => `${a.legislation_id}__${a.alert_type}`));
    const newAlerts = pendingAlerts.filter(a => !existingKeys.has(`${a.legislation_id}__${a.alert_type}`));
    await Promise.all(newAlerts.map(a => saveAlert.mutateAsync(a)));
    return newAlerts.length;
  }, [pendingAlerts, activeAlerts, saveAlert]);

  // ── Department summary builder ────────────────────────────────────────────
  const getDepartmentSummary = useCallback((department) =>
    buildDepartmentSummary(department, scoredItems, impactRecordsList, profile),
  [scoredItems, impactRecordsList, profile]);

  return {
    // Enriched data
    scoredItems,
    impactMap,
    impactRecordsList,
    watchlists,
    watchlistItems,
    activeAlerts,
    pendingAlerts,

    // Output objects
    executiveBrief,
    boardPacket,
    budgetRiskSummary,
    grantSummary,
    monthlyMemo,
    getDepartmentSummary,

    // AI generation
    generateAIInsights,
    generateBatchInsights,
    aiLoading,
    aiError,

    // Manual overrides
    saveManualImpact,
    persistPendingAlerts,

    // Loading states
    isSaving: saveImpactRecord.isPending,
  };
}