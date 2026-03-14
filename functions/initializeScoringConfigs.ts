import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check if default config already exists
    const existing = await base44.asServiceRole.entities.ProposalScoringConfig.filter({
      is_default: true,
    });

    if (existing && existing.length > 0) {
      return Response.json({
        status: 'success',
        message: 'Default scoring configuration already exists',
        config: existing[0],
      });
    }

    // Create default configuration
    const defaultConfig = {
      name: 'Default',
      description: 'Default scoring configuration for all proposal types',
      proposal_types: ['departmental', 'capital_project', 'shared_service', 'restructuring', 'regional_service', 'initiative'],
      scale_min: 0,
      scale_max: 10,
      weights: {
        financial_impact: 12,
        tax_impact: 10,
        service_impact: 12,
        operational_feasibility: 10,
        staffing_impact: 10,
        implementation_complexity: 8,
        political_community_feasibility: 12,
        regional_collaboration_potential: 8,
        long_term_sustainability: 12,
        risk_level: 6,
      },
      rating_scale: [
        { min_score: 8.5, max_score: 10, rating: 'excellent', color: '#059669' },
        { min_score: 7, max_score: 8.4, rating: 'good', color: '#0284c7' },
        { min_score: 5, max_score: 6.9, rating: 'acceptable', color: '#b45309' },
        { min_score: 2.5, max_score: 4.9, rating: 'marginal', color: '#ea580c' },
        { min_score: 0, max_score: 2.4, rating: 'poor', color: '#dc2626' },
      ],
      is_default: true,
      notes: 'This is the default scoring configuration. Modify weights as needed for different proposal types.',
    };

    const created = await base44.asServiceRole.entities.ProposalScoringConfig.create(defaultConfig);

    // Create regional services focused config
    const regionalConfig = {
      name: 'Regional Services',
      description: 'Specialized scoring for regional service proposals',
      proposal_types: ['regional_service', 'shared_service'],
      scale_min: 0,
      scale_max: 10,
      weights: {
        financial_impact: 15,
        tax_impact: 12,
        service_impact: 10,
        operational_feasibility: 8,
        staffing_impact: 8,
        implementation_complexity: 10,
        political_community_feasibility: 15,
        regional_collaboration_potential: 15,
        long_term_sustainability: 12,
        risk_level: 5,
      },
      rating_scale: [
        { min_score: 8.5, max_score: 10, rating: 'excellent', color: '#059669' },
        { min_score: 7, max_score: 8.4, rating: 'good', color: '#0284c7' },
        { min_score: 5, max_score: 6.9, rating: 'acceptable', color: '#b45309' },
        { min_score: 2.5, max_score: 4.9, rating: 'marginal', color: '#ea580c' },
        { min_score: 0, max_score: 2.4, rating: 'poor', color: '#dc2626' },
      ],
      is_default: false,
      notes: 'Emphasizes political feasibility and regional collaboration for shared service proposals.',
    };

    await base44.asServiceRole.entities.ProposalScoringConfig.create(regionalConfig);

    // Create capital projects config
    const capitalConfig = {
      name: 'Capital Projects',
      description: 'Specialized scoring for capital project proposals',
      proposal_types: ['capital_project'],
      scale_min: 0,
      scale_max: 10,
      weights: {
        financial_impact: 15,
        tax_impact: 15,
        service_impact: 10,
        operational_feasibility: 12,
        staffing_impact: 5,
        implementation_complexity: 12,
        political_community_feasibility: 12,
        regional_collaboration_potential: 5,
        long_term_sustainability: 15,
        risk_level: 8,
      },
      rating_scale: [
        { min_score: 8.5, max_score: 10, rating: 'excellent', color: '#059669' },
        { min_score: 7, max_score: 8.4, rating: 'good', color: '#0284c7' },
        { min_score: 5, max_score: 6.9, rating: 'acceptable', color: '#b45309' },
        { min_score: 2.5, max_score: 4.9, rating: 'marginal', color: '#ea580c' },
        { min_score: 0, max_score: 2.4, rating: 'poor', color: '#dc2626' },
      ],
      is_default: false,
      notes: 'Emphasizes financial impact, tax impact, and long-term sustainability for capital projects.',
    };

    await base44.asServiceRole.entities.ProposalScoringConfig.create(capitalConfig);

    return Response.json({
      status: 'success',
      message: 'Scoring configurations initialized',
      default: created,
    });
  } catch (error) {
    console.error('Error initializing scoring configs:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});