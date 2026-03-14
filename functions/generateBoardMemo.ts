import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { proposalId, scenarioId, tone } = await req.json();

    if (!proposalId && !scenarioId) {
      return Response.json({ error: 'proposalId or scenarioId required' }, { status: 400 });
    }

    let source = null;
    let sourceType = 'proposal';

    if (proposalId) {
      source = await base44.asServiceRole.entities.Proposal.get(proposalId);
    } else if (scenarioId) {
      source = await base44.asServiceRole.entities.Scenario.get(scenarioId);
      sourceType = 'scenario';
    }

    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    // Build the prompt
    const toneGuide = {
      'select_board': 'Written for elected officials. Focus on decision points, fiscal impact, and community implications. Assume limited technical background.',
      'budget_committee': 'Written for budget experts and municipal finance professionals. Include detailed financial calculations and assumptions.',
      'staff': 'Written for internal staff. Can be more technical and operational in nature.',
    };

    const prompt = `Generate a professional municipal memo based on the following ${sourceType} data:

SOURCE DATA:
${JSON.stringify(source, null, 2)}

MEMO REQUIREMENTS:
- Format as a professional municipal memo
- Target Audience: ${tone}
- Tone Guidance: ${toneGuide[tone] || toneGuide['select_board']}
- Length: 500-750 words
- Decision-focused

MEMO STRUCTURE (use these exact section headers):

ISSUE
A 1-2 sentence statement of what decision is needed.

BACKGROUND
Brief context and history (2-3 sentences). Only include essential background.

ANALYSIS
Key facts, benefits, and implications. Be specific and quantifiable where possible.

FINANCIAL IMPACT
- Annual cost/savings
- One-time costs
- Multi-year outlook (if applicable)
- Any funding sources or offsets

TAX IMPACT
- Effect on mill rate
- Effect on average household taxes
- Compare to current levy

RISKS
- 2-3 key risks with mitigation approaches
- Keep brief but specific

RECOMMENDATION
Clear recommendation with rationale. What action is requested?

STYLE GUIDELINES:
- Use clear, professional language
- Avoid jargon; define acronyms
- Use bullet points for lists
- Include specific numbers and dates
- Be objective and fact-based
- End with clear call to action`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5_mini',
    });

    return Response.json({
      memo: response,
      sourceType,
      sourceTitle: source.title || source.name,
      tone,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});