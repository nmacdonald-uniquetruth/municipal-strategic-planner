/**
 * policyIntelligence — Backend AI insight generation function
 * Accepts a policy item + municipality profile and returns AI-generated
 * municipal impact insights via InvokeLLM.
 *
 * POST payload:
 * {
 *   item: LegislationItem,
 *   profile: MunicipalityProfile,
 *   generate_mode: 'full' | 'summary_only' | 'batch',
 *   items?: LegislationItem[]  // for batch mode
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { item, profile, generate_mode = 'full', items: batchItems } = body;

    // ── Batch mode ───────────────────────────────────────────────────────────
    if (generate_mode === 'batch' && Array.isArray(batchItems)) {
      const results = await Promise.all(
        batchItems.slice(0, 10).map(bItem => generateItemInsights(bItem, profile, 'summary_only', base44))
      );
      return Response.json({ mode: 'batch', results });
    }

    // ── Single item mode ─────────────────────────────────────────────────────
    if (!item) return Response.json({ error: 'item is required' }, { status: 400 });
    const result = await generateItemInsights(item, profile, generate_mode, base44);
    return Response.json(result);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── Core insight generator ────────────────────────────────────────────────────

async function generateItemInsights(item, profile, mode, base44) {
  const muniName = profile?.name || 'the municipality';
  const state    = profile?.state || '';
  const pop      = profile?.population ? `population ${profile.population.toLocaleString()}` : '';
  const budget   = profile?.annual_budget ? `annual budget ~$${(profile.annual_budget / 1000000).toFixed(1)}M` : '';
  const depts    = (profile?.departments || []).join(', ') || 'standard municipal departments';
  const goals    = (profile?.strategic_goals || []).join(', ') || '';
  const funds    = (profile?.enterprise_funds || []).join(', ') || '';
  const focuses  = (profile?.policy_focus_areas || []).join(', ') || '';

  const itemContext = `
Bill/Policy ID: ${item.identifier || 'N/A'}
Title: ${item.title}
Jurisdiction: ${item.jurisdiction}
Status: ${item.status}
Category: ${item.category || 'Unknown'}
Summary: ${item.summary || 'No summary available.'}
Sponsor: ${item.sponsor || 'Unknown'}
Last Action: ${item.last_action || 'None'} (${item.last_action_date || 'Unknown date'})
Departments Affected (pre-tagged): ${(item.departments_affected || []).join(', ') || 'None identified'}
Strategic Goals (pre-tagged): ${(item.strategic_goals || []).join(', ') || 'None identified'}
Fiscal Impact Note: ${item.fiscal_impact_note || 'None'}
Fiscal Impact Amount: ${item.fiscal_impact_amount ? '$' + item.fiscal_impact_amount.toLocaleString() : 'Not specified'}
Compliance Impact: ${item.compliance_impact || 'None noted'}
Operational Impact: ${item.operational_impact || 'None noted'}
HR Impact: ${item.hr_impact || 'None noted'}
Capital Impact: ${item.capital_impact || 'None noted'}
Hearing Date: ${item.hearing_date || 'N/A'}
Vote Date: ${item.vote_date || 'N/A'}
Comment Deadline: ${item.comment_deadline || 'N/A'}
Effective Date: ${item.effective_date || 'N/A'}
Probability of Passage: ${item.probability_of_passage || 'Unknown'}%
`.trim();

  const profileContext = `
Municipality: ${muniName}, ${state} (${pop}${budget ? ', ' + budget : ''})
Governance Type: ${profile?.governance_type || 'town_meeting'}
Departments: ${depts}
Enterprise Funds: ${funds || 'None'}
Strategic Goals: ${goals}
Policy Focus Areas: ${focuses}
County: ${profile?.county || 'Unknown'}
`.trim();

  const isSummaryOnly = mode === 'summary_only';

  const prompt = isSummaryOnly
    ? `You are a municipal policy analyst for ${muniName}, ${state}. Analyze the following policy item and write a concise plain-language summary of why it matters to this municipality and what action should be considered. Be specific. Avoid filler language.

MUNICIPALITY PROFILE:
${profileContext}

POLICY ITEM:
${itemContext}

Return JSON with fields: why_it_matters_summary (2–3 sentences, specific to this municipality), recommended_actions (array of strings, 1–3 actions), priority_level (critical/high/medium/watch), confidence_note (one sentence).`

    : `You are a senior municipal policy analyst and advisor for ${muniName}, ${state}. Your job is to translate legislative and regulatory developments into clear, actionable intelligence for municipal leadership.

Analyze the following policy item and generate a full municipal impact assessment. Be direct, specific, and accurate. Do not use generic filler. Mention specific dollar figures, department names, and operational details where relevant.

MUNICIPALITY PROFILE:
${profileContext}

POLICY ITEM:
${itemContext}

Return a JSON object with ALL of the following fields:

why_it_matters_summary: (2–4 sentences) Why this specifically matters to ${muniName}. Mention departments, funds, or goals by name.
plain_language_summary: (2–3 sentences) A clear plain-English explanation of what this item does, suitable for non-technical readers.
what_changed: (1–2 sentences) What has most recently changed in the status or content of this item.
who_it_affects: (1–2 sentences) Which departments, staff types, or residents are most affected.
possible_budget_impact: (1–3 sentences) Estimate budget implications if possible. Reference the annual budget scale.
possible_operational_impact: (1–2 sentences) How might day-to-day operations change?
possible_hr_impact: (1–2 sentences or empty string if minimal) Any workforce, hiring, benefits, or labor implications.
possible_compliance_impact: (1–2 sentences or empty string if minimal) Any new reporting, audit, or regulatory compliance requirements.
possible_capital_impact: (1–2 sentences or empty string if minimal) Any equipment, facility, or infrastructure implications.
possible_funding_opportunity: (1–2 sentences or empty string if not applicable) Any grant or funding opportunity to pursue.
risks_if_enacted: (1–2 sentences or empty string) Key risks if this passes.
risks_if_not_addressed: (1–2 sentences or empty string) Key risks if the municipality ignores this item.
suggested_next_actions: (array of 2–4 plain-English action strings, e.g. "Have Finance Director assess revenue impact by April 2026")
recommended_owner_role: (single string, e.g. "Finance Director" or "Town Manager")
related_departments: (array of department name strings)
related_strategic_goals: (array of goal strings from the profile if applicable)
priority_level: (critical / high / medium / watch — your assessment)
overall_relevance_score: (0–100 integer — your scoring)
confidence_note: (one sentence about data quality or uncertainty, if any)`;

  const responseSchema = isSummaryOnly
    ? {
        type: 'object',
        properties: {
          why_it_matters_summary: { type: 'string' },
          recommended_actions:    { type: 'array', items: { type: 'string' } },
          priority_level:         { type: 'string' },
          confidence_note:        { type: 'string' },
        },
      }
    : {
        type: 'object',
        properties: {
          why_it_matters_summary:       { type: 'string' },
          plain_language_summary:       { type: 'string' },
          what_changed:                 { type: 'string' },
          who_it_affects:               { type: 'string' },
          possible_budget_impact:       { type: 'string' },
          possible_operational_impact:  { type: 'string' },
          possible_hr_impact:           { type: 'string' },
          possible_compliance_impact:   { type: 'string' },
          possible_capital_impact:      { type: 'string' },
          possible_funding_opportunity: { type: 'string' },
          risks_if_enacted:             { type: 'string' },
          risks_if_not_addressed:       { type: 'string' },
          suggested_next_actions:       { type: 'array', items: { type: 'string' } },
          recommended_owner_role:       { type: 'string' },
          related_departments:          { type: 'array', items: { type: 'string' } },
          related_strategic_goals:      { type: 'array', items: { type: 'string' } },
          priority_level:               { type: 'string' },
          overall_relevance_score:      { type: 'number' },
          confidence_note:              { type: 'string' },
        },
      };

  const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: responseSchema,
    model: 'claude_sonnet_4_6',
  });

  return {
    item_id:         item.id,
    item_identifier: item.identifier,
    item_title:      item.title,
    mode,
    municipality:    muniName,
    generated_at:    new Date().toISOString(),
    generation_method: 'ai_generated',
    scoring_version: '2.0',
    ...aiResult,
  };
}