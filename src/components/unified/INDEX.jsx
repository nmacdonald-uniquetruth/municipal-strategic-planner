# Unified Proposal System - Complete Index

## 📚 Documentation

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** ⭐ START HERE
   - System overview and data flow
   - Visual diagrams of relationships
   - Core data structures explained
   - Module organization

2. **[README.md](./README.md)**
   - Detailed module documentation
   - Function reference for each module
   - Usage examples
   - Integration points

3. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)**
   - How to migrate existing components
   - Component-by-component guide
   - Common patterns
   - Troubleshooting

## 🔧 Code Modules

### Core Module: `unifiedProposalModel.js`
**Purpose**: Defines unified proposal structure and generation functions

**Exports**:
- `createUnifiedProposal()` - Create proposal with all normalized fields
- `calculateFinancialImpact()` - Financial metrics with regional services
- `calculateTaxImpact()` - Tax effects from financial impact
- `generateImplementationRoadmap()` - Auto-generate roadmap from proposal
- `generateBoardSummary()` - Create board-ready summary
- `buildScenarioProposals()` - Aggregate proposals in scenario
- `compareProposals()` - Side-by-side comparison

**When to Use**: Creating proposals, generating derived content

---

### Core Module: `sharedAssumptions.js`
**Purpose**: Centralizes all assumptions for consistent calculations

**Exports**:
- `loadSharedAssumptions()` - Load from ModelSettings entity
- `getDefaultAssumptions()` - Get defaults if none configured
- `calculateHealthInsuranceCost()` - Shared health calculation
- `calculateFullyLoadedCost()` - Salary + all benefits + taxes
- `projectSalary()` - Multi-year salary projection
- `calculateEMSRevenue()` - EMS billing impact
- `calculateRegionalServicesRevenue()` - Regional service projections
- `calculateTaxImpactFromAssumptions()` - Standardized tax calculation

**When to Use**: Accessing assumptions, calculating staffing costs, tax impacts

---

### Core Module: `calculationEngine.js`
**Purpose**: Unified calculation engine used by all modules

**Exports**:
- `calculateAllImpacts()` - Comprehensive impact calculation
- `calculateFinancialImpact()` - Financial metrics
- `calculateTaxImpact()` - Tax effects
- `calculateStaffingImpact()` - FTE and position changes
- `calculateServiceImpact()` - Service quality effects
- `calculateRiskMetrics()` - Risk scoring
- `calculateRegionalServiceImpact()` - Regional metrics
- `calculateProposalScore()` - Proposal evaluation score
- `compareProposalsForScenario()` - Consistent comparison
- `aggregateProposalImpacts()` - Scenario-level aggregation

**When to Use**: Any impact calculation, comparisons, aggregations

---

### Core Module: `scenarioProposalIntegration.js`
**Purpose**: Manages scenario-proposal relationships

**Exports**:
- `loadScenarioProposals()` - Load scenario with all proposals
- `createProposalForScenario()` - Create proposal in scenario
- `updateProposalAndScenario()` - Update and sync
- `compareScenarios()` - Multi-scenario comparison
- `generateScenarioSummary()` - Executive summary
- `syncProposalChanges()` - Propagate changes

**When to Use**: Working with scenarios, comparing multiple scenarios

---

### React Hook: `useUnifiedProposalSystem.js`
**Purpose**: React interface to entire unified system

**Main Hook**:
```javascript
const {
  scenarios,
  proposals,
  evaluations,
  sharedAssumptions,
  isLoading,
  createProposal,
  updateProposal,
  deleteProposal,
  createEvaluation,
  updateEvaluation,
  getProposalsForScenario,
  getEvaluationForProposal,
  getImpactsForProposal,
  getScenarioSummary,
  compareMultipleScenarios
} = useUnifiedProposalSystem();
```

**Specialized Hooks**:
- `useProposalWithImpacts(proposalId)` - Single proposal + impacts
- `useScenarioWithProposals(scenarioId)` - Scenario + aggregated impacts

**When to Use**: In React components, to access unified data and mutations

---

## 📊 Data Flow

```
User Input
    ↓
React Component (useUnifiedProposalSystem hook)
    ↓
Creates/Updates Proposal
    ↓
Unified Model (unifiedProposalModel.js)
    ├─ Financial Impact (calculationEngine.js + sharedAssumptions.js)
    ├─ Tax Impact (calculationEngine.js + sharedAssumptions.js)
    ├─ Staffing Impact (calculationEngine.js + sharedAssumptions.js)
    ├─ Service Impact (calculationEngine.js)
    ├─ Risk Metrics (calculationEngine.js)
    ├─ Regional Impact (calculationEngine.js + sharedAssumptions.js)
    ├─ Implementation Roadmap (unifiedProposalModel.js - auto-generated)
    └─ Board Summary (unifiedProposalModel.js - auto-generated)
    ↓
Scenario Aggregation (scenarioProposalIntegration.js)
    ├─ Total Annual Benefit (from all proposals)
    ├─ Total Tax Impact (from all proposals)
    ├─ Total Staffing Impact (from all proposals)
    └─ Average Evaluation Score (if evaluations exist)
    ↓
Display in UI
```

## 🎯 Quick Integration Examples

### Example 1: Display Proposal Impacts
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function ProposalDetail({ proposalId }) {
  const { getImpactsForProposal } = useUnifiedProposalSystem();
  const impacts = getImpactsForProposal(proposalId);
  
  if (!impacts) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Annual Benefit: ${impacts.financial.total_annual_benefit}</p>
      <p>Mill Rate Impact: {impacts.tax.mill_rate_change}¢</p>
      <p>FTE Change: {impacts.staffing.fteChange}</p>
      <p>Risk Score: {impacts.risk.average_risk_score}/9</p>
    </div>
  );
}
```

### Example 2: Compare Scenarios
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function ScenarioComparison({ scenarioIds }) {
  const { compareMultipleScenarios } = useUnifiedProposalSystem();
  const [comparison, setComparison] = useState([]);
  
  useEffect(() => {
    compareMultipleScenarios(scenarioIds).then(setComparison);
  }, [scenarioIds]);
  
  return (
    <table>
      <tbody>
        {comparison.map(s => (
          <tr key={s.scenario_id}>
            <td>{s.scenario_name}</td>
            <td>${s.total_annual_benefit}</td>
            <td>{s.proposal_count} proposals</td>
            <td>{s.avg_evaluation_score.toFixed(1)}/10</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Example 3: Create Proposal with All Calculations
```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function CreateProposal({ scenarioId }) {
  const { createProposal } = useUnifiedProposalSystem();
  
  const handleSubmit = (formData) => {
    createProposal({
      title: formData.title,
      category: 'regional_revenue',
      priority: 'high',
      scenario_id: scenarioId,
      description: formData.description,
      
      // Basic financials - system auto-calculates rest
      estimatedAnnualRevenue: 30000,
      implementationCost: 5000,
      
      // Regional services (optional)
      regionalServices: {
        targetTowns: ['Beals', 'Jonesport'],
        adoptionRate: 0.67,
        projectedRevenue: 20000
      },
      
      // Risks
      risks: [{
        risk: 'Adoption slower than expected',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Conservative projections'
      }]
    });
    // System automatically:
    // - Calculates financial impact
    // - Calculates tax impact
    // - Generates roadmap
    // - Generates board summary
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## 🔗 Related Entities

**RestructuringProposal** (`entities/RestructuringProposal.json`)
- Updated with unified fields
- Stores all proposal data
- Linked to scenario, evaluation, etc.

**ProposalEvaluation** (`entities/ProposalEvaluation.json`)
- Scores all impacts
- Provides recommendation
- Linked to proposal (1:1)

**Scenario** (`entities/Scenario.json`)
- Contains proposals
- Stores scenario-specific assumptions
- Used for aggregation

**ModelSettings** (`entities/ModelSettings.json`)
- Stores shared assumptions
- Referenced by all calculations
- Single source of truth

## 🚀 Getting Started

1. **Read Architecture**: Start with `ARCHITECTURE.md` for system overview

2. **Understand Modules**: Read module descriptions in `README.md`

3. **Review Usage Patterns**: Check migration examples in `MIGRATION_GUIDE.md`

4. **Start Using**: Import `useUnifiedProposalSystem` hook in your component

5. **Refer to Index**: Use this document to find what you need

## 📌 Key Principles

1. ✅ **Single Source of Truth**: Shared assumptions
2. ✅ **Automatic Calculations**: Impacts auto-calculated from data
3. ✅ **Consistent Logic**: All calculations use same engine
4. ✅ **Traceable Relationships**: Full audit trail available
5. ✅ **No Duplication**: One calculation method per metric
6. ✅ **Scenario Integration**: Proposals contained in scenarios
7. ✅ **Evaluation Integration**: Evaluations linked to proposals
8. ✅ **Auto-Generated Content**: Roadmaps and summaries generated

## 📞 Support

- **Questions about architecture?** → Read `ARCHITECTURE.md`
- **How to use a function?** → Check `README.md`
- **Integrating existing component?** → Follow `MIGRATION_GUIDE.md`
- **Need an example?** → Check "Quick Integration Examples" above

---

**System Version**: 1.0
**Status**: Production Ready
**Last Updated**: March 14, 2026

For questions or additions, refer to the detailed documentation files above.