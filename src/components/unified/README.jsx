# Unified Proposal System Architecture

This module normalizes and integrates all proposal-related functionality into a coherent system where scenarios, proposals, evaluations, and impacts work together seamlessly.

## Core Modules

### 1. **unifiedProposalModel.js**
Defines the unified proposal data structure and generation functions.

**Key Functions:**
- `createUnifiedProposal()` - Creates a proposal with all related fields normalized
- `calculateFinancialImpact()` - Computes total financial benefit including regional services
- `calculateTaxImpact()` - Tax impact based on financial impact and shared assumptions
- `generateImplementationRoadmap()` - Auto-generates roadmap from proposal data
- `generateBoardSummary()` - Creates board-ready summary with key metrics
- `buildScenarioProposals()` - Aggregates proposals within a scenario
- `compareProposals()` - Side-by-side comparison of multiple proposals

**Data Structure:**
```javascript
{
  id,
  title,
  category,
  priority,
  status,
  scenario_id,        // Links to parent scenario
  
  // Impacts
  financialImpact,    // {annualSavings, annualRevenue, implementationCost, ...}
  taxImpact,          // {millRateChange, taxLevyChange, ...}
  staffingImpact,     // {fteChange, positionsAdded/Eliminated, ...}
  serviceImpact,      // {areasAffected, expectedImprovements, ...}
  
  // Tracking
  risks,              // [{risk, probability, impact, mitigation}]
  assumptions,        // Shared assumptions referenced
  
  // Regional
  regionalServices,   // {targetTowns, adoptionRate, projectedRevenue}
  
  // Derived
  implementationRoadmap,  // Generated from proposal
  evaluation_id,          // Link to ProposalEvaluation
  boardSummary           // Generated summary
}
```

### 2. **sharedAssumptions.js**
Centralizes all assumptions so calculations reference the same values.

**Key Functions:**
- `loadSharedAssumptions()` - Loads from ModelSettings entity
- `getDefaultAssumptions()` - Returns defaults if no settings exist
- `calculateHealthInsuranceCost()` - Shared health cost calculation
- `calculateFullyLoadedCost()` - Salary + all benefits + taxes
- `projectSalary()` - Multi-year salary projection
- `calculateEMSRevenue()` - EMS billing impact
- `calculateRegionalServicesRevenue()` - Regional service projections
- `calculateTaxImpactFromAssumptions()` - Standardized tax calculation

**Assumption Categories:**
- Fiscal (mill rate, tax levy, fund balances)
- Staffing (wage growth, FICA, pension, health, workers comp)
- EMS (transports, collection rates, growth)
- Regional Services (adoption rates, revenue growth)
- Enterprise Funds (ambulance, sewer, transfer station)
- ERP (implementation cost, ongoing cost, annual value)

### 3. **scenarioProposalIntegration.js**
Handles relationships between scenarios and proposals.

**Key Functions:**
- `loadScenarioProposals()` - Loads scenario with all related proposals
- `createProposalForScenario()` - Creates proposal linked to scenario
- `updateProposalAndScenario()` - Updates proposal and syncs scenario
- `compareScenarios()` - Aggregates multiple scenarios for comparison
- `generateScenarioSummary()` - Executive summary of scenario
- `syncProposalChanges()` - Propagates changes across related entities

**Data Flow:**
```
Scenario
├── Proposal 1
│   ├── ProposalEvaluation
│   ├── Financial Impact (calculated from shared assumptions)
│   ├── Tax Impact (derived from financial impact)
│   ├── Implementation Roadmap (generated)
│   └── Board Summary (generated)
├── Proposal 2
│   └── ...
└── Aggregated Impacts (sum of all proposals)
```

### 4. **calculationEngine.js**
Unified calculation engine that all modules reference.

**Key Functions:**
- `calculateAllImpacts()` - Comprehensive impact calculation for a proposal
- `calculateFinancialImpact()` - Financial metrics with 5-year projection
- `calculateTaxImpact()` - Tax effects normalized to mill rate
- `calculateStaffingImpact()` - FTE and position changes
- `calculateServiceImpact()` - Service quality effects
- `calculateRiskMetrics()` - Risk scoring (probability × impact)
- `calculateRegionalServiceImpact()` - Regional expansion metrics
- `compareProposalsForScenario()` - Consistent comparison using same engine
- `aggregateProposalImpacts()` - Scenario-level aggregation

**Calculation Example:**
```javascript
// All calculations reference same shared assumptions
const impacts = calculateAllImpacts(proposal, sharedAssumptions);
// Results in: {financial, tax, staffing, service, risk, regional}
```

### 5. **useUnifiedProposalSystem.js**
React hook providing unified interface to the entire system.

**Main Hook:**
```javascript
const {
  scenarios,
  proposals,
  evaluations,
  sharedAssumptions,
  
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

**Specialized Hooks:**
```javascript
// Single proposal with all impacts
const { proposal, evaluation, impacts } = useProposalWithImpacts(proposalId);

// Scenario with all proposals and aggregated impacts
const { scenario, proposals, impacts, summary } = useScenarioWithProposals(scenarioId);
```

## Data Relationships

```
Scenario (contains)
├── Financial Assumptions
│   └── (referenced by tax, staffing, regional calculations)
├── Proposals (multiple)
│   ├── Basic Info (title, category, priority)
│   ├── Financial Impact
│   │   └── (calculated from: savings + revenue + regional services - costs)
│   ├── Tax Impact
│   │   └── (calculated from: financial impact + shared assumptions)
│   ├── Staffing Impact
│   │   └── (calculated from: FTE change + fully-loaded costs)
│   ├── Service Impact
│   │   └── (defined with areas affected, improvements)
│   ├── Risks
│   │   └── (tracked with probability × impact scoring)
│   ├── Regional Services
│   │   └── (projects adoption and revenue)
│   ├── ProposalEvaluation (1:1)
│   │   └── (scores all impacts and provides recommendation)
│   ├── Implementation Roadmap (generated)
│   │   └── (phased timeline from proposal data)
│   └── Board Summary (generated)
│       └── (highlights + recommendation)
└── Aggregated Scenario Impacts
    └── (sum of all proposals: financials, tax, staffing, risks)
```

## Usage Examples

### Load and Compare Proposals in a Scenario

```javascript
import { useUnifiedProposalSystem } from '@/components/unified/useUnifiedProposalSystem';

function ScenarioDashboard({ scenarioId }) {
  const { scenario, proposals, impacts, summary } = 
    useScenarioWithProposals(scenarioId);

  return (
    <div>
      <h1>{scenario.name}</h1>
      <p>Total Annual Benefit: ${impacts.total_annual_benefit.toLocaleString()}</p>
      <p>5-Year Net Impact: ${impacts.total_five_year_net.toLocaleString()}</p>
      
      {proposals.map(p => (
        <ProposalCard key={p.id} proposal={p} />
      ))}
    </div>
  );
}
```

### Create Proposal with All Impacts Auto-Calculated

```javascript
const { createProposal } = useUnifiedProposalSystem();

createProposal({
  title: "Regional Finance Services",
  category: "regional_revenue",
  priority: "high",
  scenario_id: "scenario-123",
  
  // Basic data
  description: "Offer finance services to regional municipalities",
  departments: ["Finance"],
  
  // Financial impact (inputs)
  estimatedAnnualSavings: 0,
  estimatedAnnualRevenue: 45000,
  implementationCost: 10000,
  
  // Regional services detail
  regionalServices: {
    targetTowns: ["Beals", "Jonesport", "Columbia"],
    adoptionRate: 0.67,
    projectedRevenue: 30000
  },
  
  // Risks
  risks: [
    {
      risk: "Market adoption slower than expected",
      probability: "medium",
      impact: "high",
      mitigation: "Conservative adoption projections in Year 1"
    }
  ]
});

// System automatically:
// 1. Calculates financial impact (revenue + regional services)
// 2. Calculates tax impact based on financial impact
// 3. Generates implementation roadmap
// 4. Generates board-ready summary
// 5. Links to scenario for aggregation
```

### Get Comprehensive Proposal Analysis

```javascript
const { getImpactsForProposal, getEvaluationForProposal } = 
  useUnifiedProposalSystem();

function ProposalDetail({ proposalId }) {
  const impacts = getImpactsForProposal(proposalId);
  const evaluation = getEvaluationForProposal(proposalId);

  return (
    <div>
      <h2>Financial Impact</h2>
      <p>Annual: ${impacts.financial.total_annual_benefit.toLocaleString()}</p>
      <p>5-Year: ${impacts.financial.five_year_net.toLocaleString()}</p>
      
      <h2>Tax Impact</h2>
      <p>Mill Rate Change: {impacts.tax.mill_rate_change.toFixed(3)}¢</p>
      
      <h2>Risk Assessment</h2>
      <p>Total Risks: {impacts.risk.total_risks}</p>
      <p>Average Risk Score: {impacts.risk.average_risk_score.toFixed(1)}/9</p>
      
      <h2>Evaluation</h2>
      <p>Overall Score: {evaluation?.overall_score}/10</p>
      <p>Recommendation: {evaluation?.recommendation}</p>
    </div>
  );
}
```

### Compare Multiple Scenarios

```javascript
const { compareMultipleScenarios } = useUnifiedProposalSystem();

function ScenarioComparison() {
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    compareMultipleScenarios(['scenario-1', 'scenario-2', 'scenario-3'])
      .then(setScenarios);
  }, []);

  return (
    <table>
      <tbody>
        {scenarios.map(s => (
          <tr key={s.scenario_id}>
            <td>{s.scenario_name}</td>
            <td>${s.total_annual_benefit.toLocaleString()}</td>
            <td>${s.five_year_net.toLocaleString()}</td>
            <td>{s.total_fte_change}</td>
            <td>{s.avg_evaluation_score.toFixed(1)}/10</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Key Design Principles

1. **Single Source of Truth for Assumptions**
   - All calculations reference shared assumptions
   - Tax, staffing, and regional calculations use the same base values

2. **Automatic Derivation**
   - Financial impact automatically includes regional services
   - Tax impact automatically derived from financial impact
   - Roadmaps and summaries auto-generated from proposal data

3. **Scenario-Proposal Hierarchy**
   - Scenarios contain proposals
   - Scenarios aggregate proposal impacts
   - Proposals reference scenario assumptions

4. **Consistent Calculations**
   - Single calculation engine used everywhere
   - Comparisons use same calculations
   - No duplicated calculation logic

5. **Traceable Relationships**
   - Proposals link to evaluations
   - Evaluations link to assumptions
   - All data fully traceable for auditing

## Integration Points

### With Tax Impact Module
- Uses `calculateTaxImpact()` from unified model
- References shared assumptions for mill rate calculations
- Feeds proposal financial impacts into tax module

### With Regional Services Module
- Proposals include regional service configuration
- Regional revenue automatically included in financial impact
- Regional assumptions come from shared model settings

### With Implementation Roadmap Module
- Roadmaps auto-generated from proposal category
- Phases normalized across all proposal types
- Can be customized per proposal

### With Proposal Evaluations
- Evaluations reference proposal impacts
- Board summaries auto-generated from proposal + evaluation
- Recommendations integrated into proposal workflow

## Migration Notes

- Existing `RestructuringProposal` entity updated with new fields
- Backward compatible - existing proposals still work
- New fields optional - can be populated gradually
- Calculation functions work with partial data

---

**Architecture Version:** 1.0
**Last Updated:** 2026-03-14