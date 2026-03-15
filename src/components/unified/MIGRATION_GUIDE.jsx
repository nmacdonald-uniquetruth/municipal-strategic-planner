# Migration Guide: Integrating with Unified Proposal System

This guide shows how to migrate existing components to use the unified proposal system instead of their local calculation logic.

## Quick Start

### Before (Local Calculations)
```javascript
// Old way: Each component had its own calculations
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function TaxImpactPage() {
  const { data: proposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.RestructuringProposal.list()
  });

  // Component calculates tax impact locally
  const calculateTax = (proposal) => {
    const millRateChange = (proposal.financialImpact / 198000000) * 1000;
    return millRateChange;
  };

  return (
    <div>
      {proposals.map(p => (
        <div key={p.id}>
          <p>Tax Impact: {calculateTax(p).toFixed(3)}¢</p>
        </div>
      ))}
    </div>
  );
}
```

### After (Unified Calculations)
```javascript
// New way: Use unified system
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function TaxImpactPage() {
  const { scenarios, getScenarioSummary } = useUnifiedProposalSystem();

  // Just get the pre-calculated impacts
  const scenarioData = getScenarioSummary(scenarios[0]?.id);

  return (
    <div>
      {scenarioData?.proposals.map(p => (
        <div key={p.id}>
          <p>Tax Impact: {scenarioData?.impacts.total_tax_impact.toFixed(3)}¢</p>
        </div>
      ))}
    </div>
  );
}
```

## Component-by-Component Migration

### TaxImpact Module
**Location**: `pages/TaxImpact`

**Old Approach**:
- Components imported `taxImpactCalculator.js`
- Each calculated mill rate change independently
- Assumptions hardcoded or passed as props

**New Approach**:
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';
import { calculateTaxImpact } from '@/components/unified/calculationEngine';

function TaxImpact() {
  const { scenarios, getScenarioSummary, sharedAssumptions } = 
    useUnifiedProposalSystem();
  
  const scenarioData = getScenarioSummary(scenarios[0]?.id);
  
  return (
    <div>
      <p>Scenario: {scenarioData?.scenario.name}</p>
      <p>Mill Rate Impact: {scenarioData?.impacts.total_mill_rate_impact}¢</p>
      <p>Tax Levy Change: ${scenarioData?.impacts.total_levy_impact}</p>
    </div>
  );
}
```

**Migration Steps**:
1. Replace `import { calculateTaxImpact }` with unified import
2. Change from `calculateTaxImpact(proposal, assumptions)` to `getScenarioSummary(scenario_id)`
3. Access results from `scenarioData.impacts.total_tax_impact`
4. Remove local assumption passing - use shared assumptions

### RegionalServices Module
**Location**: `pages/RegionalServices`

**Old Approach**:
- Components had local regional service calculations
- Revenue projections done per-component
- Adoption rates hardcoded

**New Approach**:
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function RegionalServices() {
  const { getScenarioSummary } = useUnifiedProposalSystem();
  const scenarioData = getScenarioSummary(scenarioId);
  
  return (
    <div>
      {scenarioData?.proposals.map(p => {
        if (p.regionalServices) {
          return (
            <div key={p.id}>
              <p>Revenue: ${p.regionalServices.projectedRevenue}</p>
              <p>Target Towns: {p.regionalServices.targetTowns.length}</p>
              <p>Adoption Rate: {(p.regionalServices.adoptionRate * 100).toFixed(0)}%</p>
            </div>
          );
        }
      })}
    </div>
  );
}
```

**Migration Steps**:
1. Load proposals through unified system
2. Regional service revenue already included in financial impact
3. Remove local adoption rate calculations
4. Access regional data from `proposal.regionalServices`

### ProposalComparison Module
**Location**: `components/proposals/ProposalComparison`

**Old Approach**:
- Compared proposals with local calculation
- Each had its own financial, tax, staffing calculations
- Inconsistent comparison logic

**New Approach**:
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function ProposalComparison({ proposalIds }) {
  const { proposals, getImpactsForProposal } = useUnifiedProposalSystem();
  
  const comparisonData = proposalIds.map(id => {
    const proposal = proposals.find(p => p.id === id);
    const impacts = getImpactsForProposal(id);
    return { proposal, impacts };
  });
  
  return (
    <table>
      <tbody>
        {comparisonData.map(item => (
          <tr key={item.proposal.id}>
            <td>{item.proposal.title}</td>
            <td>${item.impacts.financial.total_annual_benefit}</td>
            <td>${item.impacts.financial.five_year_net}</td>
            <td>{item.impacts.tax.mill_rate_change.toFixed(3)}¢</td>
            <td>{item.impacts.staffing.fteChange}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Migration Steps**:
1. Use `getImpactsForProposal()` instead of local calculations
2. All calculations automatically consistent
3. All use same shared assumptions
4. Remove duplicate calculation code

### Scenarios Module
**Location**: `pages/Scenarios`

**Old Approach**:
- Loaded proposals separately
- Manually aggregated impacts
- Inconsistent scenario comparison

**New Approach**:
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function Scenarios() {
  const { scenarios, compareMultipleScenarios } = useUnifiedProposalSystem();
  const [comparison, setComparison] = useState([]);
  
  const handleCompare = async (scenarioIds) => {
    const result = await compareMultipleScenarios(scenarioIds);
    setComparison(result);
  };
  
  return (
    <div>
      {comparison.map(s => (
        <div key={s.scenario_id}>
          <h3>{s.scenario_name}</h3>
          <p>Proposals: {s.proposal_count}</p>
          <p>Total Annual Benefit: ${s.total_annual_benefit}</p>
          <p>Mill Rate Impact: {s.total_tax_impact}¢</p>
        </div>
      ))}
    </div>
  );
}
```

**Migration Steps**:
1. Remove manual scenario aggregation code
2. Use `compareMultipleScenarios()` for comparisons
3. All scenarios use same calculation engine
4. Remove duplicate aggregation logic

### ImplementationRoadmap Module
**Location**: `pages/ImplementationRoadmap`

**Old Approach**:
- Generated roadmaps from proposal data locally
- Different logic per component

**New Approach**:
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function ImplementationRoadmap({ proposalId }) {
  const { proposals } = useUnifiedProposalSystem();
  const proposal = proposals.find(p => p.id === proposalId);
  
  // Roadmap already generated in proposal
  return (
    <div>
      {proposal?.implementationRoadmap?.phases.map((phase, idx) => (
        <div key={idx}>
          <h4>Phase {phase.phase}: {phase.description}</h4>
          <p>Timeline: {phase.timeline}</p>
          <p>Responsible: {phase.responsible_party}</p>
        </div>
      ))}
    </div>
  );
}
```

**Migration Steps**:
1. Remove roadmap generation code
2. Access pre-generated roadmap from `proposal.implementationRoadmap`
3. All proposals auto-generate consistent roadmaps
4. Can customize if needed

### BoardMemoGenerator
**Location**: `pages/BoardMemoGenerator`

**Old Approach**:
- Generated board summaries locally
- Inconsistent format and content

**New Approach**:
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function BoardMemo({ proposalId }) {
  const { proposals } = useUnifiedProposalSystem();
  const proposal = proposals.find(p => p.id === proposalId);
  
  // Summary already generated in proposal
  const summary = proposal?.boardSummary;
  
  return (
    <div>
      <h1>{summary?.title}</h1>
      <p>{summary?.executive_summary}</p>
      
      <h3>Financial Impact</h3>
      {summary?.financial_highlights.map((h, i) => (
        <p key={i}>{h}</p>
      ))}
      
      <h3>Tax Impact</h3>
      {summary?.tax_impact.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
      
      <h3>Recommendation</h3>
      <p>{summary?.recommendation}</p>
    </div>
  );
}
```

**Migration Steps**:
1. Remove board summary generation code
2. Access pre-generated summary from `proposal.boardSummary`
3. All proposals auto-generate consistent summaries
4. Includes evaluation score and recommendation if available

## Common Patterns

### Pattern 1: Get Impacts for a Proposal
```javascript
// Old
const impacts = {
  financial: calculateFinancial(proposal),
  tax: calculateTax(proposal),
  staffing: calculateStaffing(proposal)
};

// New
const impacts = getImpactsForProposal(proposalId);
// Result: {financial, tax, staffing, service, risk, regional}
```

### Pattern 2: Compare Proposals
```javascript
// Old
const comparison = proposals.map(p => ({
  financial: calculateFinancial(p),
  tax: calculateTax(p)
}));

// New
const comparison = compareProposalsForScenario(
  proposals,
  sharedAssumptions
);
```

### Pattern 3: Aggregate Scenario Impacts
```javascript
// Old
let totalBenefit = 0;
let totalTax = 0;
proposals.forEach(p => {
  totalBenefit += calculateFinancial(p);
  totalTax += calculateTax(p);
});

// New
const aggregate = getScenarioSummary(scenarioId);
// Result includes: total_annual_benefit, total_mill_rate_impact, etc.
```

### Pattern 4: Override Assumptions
```javascript
// Old - No consistent way to override

// New
const scenarioAssumptions = {
  ...sharedAssumptions,
  wage_growth_rate: 0.06  // Override for this scenario
};

const impacts = calculateAllImpacts(proposal, scenarioAssumptions);
```

## Checking for Completeness

After migrating a component, verify:

- [ ] All calculations use `useUnifiedProposalSystem()` hook
- [ ] No duplicate calculation logic in component
- [ ] Assumptions come from shared source
- [ ] Tax impact calculated from financial impact
- [ ] Regional services included in financial impact
- [ ] Roadmaps and summaries auto-generated
- [ ] Evaluations linked to proposals
- [ ] Scenario aggregates calculated consistently
- [ ] All data flows from unified data structures

## Testing After Migration

```javascript
// Test that calculations are consistent
function TestUnifiedSystem() {
  const { getImpactsForProposal, compareMultipleScenarios } = 
    useUnifiedProposalSystem();
  
  const impact1 = getImpactsForProposal('proposal-1');
  const impact2 = getImpactsForProposal('proposal-1'); // Same again
  
  // Should be identical
  assert(impact1.financial.total_annual_benefit === 
         impact2.financial.total_annual_benefit);
  
  // Financial + tax should be linked
  assert(impact1.tax.mill_rate_change correlates with
         impact1.financial.total_annual_benefit);
}
```

## Troubleshooting

### Issue: Calculations Different After Migration
**Solution**: Ensure you're using shared assumptions, not local ones
```javascript
// Check sharedAssumptions is loaded
console.log('Shared assumptions:', sharedAssumptions);

// Verify calculations reference shared assumptions
const impacts = calculateAllImpacts(proposal, sharedAssumptions);
```

### Issue: Regional Services Revenue Not Included
**Solution**: Ensure regionalServices data is in proposal
```javascript
// Check proposal has regional services config
console.log('Regional services:', proposal.regionalServices);

// Calculate includes it automatically
const impacts = getImpactsForProposal(proposal.id);
console.log('Regional revenue included:', impacts.financial.regional_revenue);
```

### Issue: Evaluation Score Not Available
**Solution**: Create evaluation or ensure evaluation_id is linked
```javascript
const evaluation = getEvaluationForProposal(proposal.id);
if (!evaluation) {
  console.log('No evaluation for proposal');
  // Create one
}
```

---

**Migration Version**: 1.0
**Last Updated**: March 14, 2026