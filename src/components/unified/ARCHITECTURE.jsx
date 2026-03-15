# Machias Strategic Planner - Unified Architecture

## System Overview

The Machias Strategic Planner now operates as a unified, integrated system where all planning modules reference the same data structures and calculations.

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED PROPOSAL SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        SHARED ASSUMPTIONS (Single Source of Truth)       │  │
│  │                                                          │  │
│  │  • Fiscal parameters (mill rate, tax levy, fund balance)│  │
│  │  • Staffing assumptions (wage growth, benefits, taxes)  │  │
│  │  • EMS assumptions (collection rates, growth)           │  │
│  │  • Regional assumptions (adoption rates, growth rates)  │  │
│  │  • Enterprise fund assumptions                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ▲                                  │
│                              │ Referenced by                    │
│                              │ all calculations                 │
│  ┌──────────────────────────┴──────────────────────────────┐   │
│  │         UNIFIED CALCULATION ENGINE                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  Financial Impact:  savings + revenue + regional -  costs    │
│  │  Tax Impact:        financial impact → mill rate change  │   │
│  │  Staffing Impact:   FTE change + fully-loaded costs     │   │
│  │  Service Impact:    areas affected + improvements       │   │
│  │  Risk Metrics:      probability × impact scoring        │   │
│  │  Regional Services: adoption rate + revenue projections │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ▲                                  │
│                              │ Consumes                         │
│                              │ proposals                        │
│  ┌────────────────────────────┴─────────────────────────────┐   │
│  │              SCENARIO CONTAINS PROPOSALS                 │   │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  SCENARIO                                                 │  │
│  │  ├─ Assumptions (overrides shared for this scenario)     │  │
│  │  └─ Proposals (N proposals per scenario)                 │  │
│  │     ├─ Proposal 1                                        │  │
│  │     │  ├─ Basic Data (title, category, priority)        │  │
│  │     │  ├─ Financial Impact (calculated)                 │  │
│  │     │  ├─ Tax Impact (calculated)                       │  │
│  │     │  ├─ Staffing Impact (calculated)                  │  │
│  │     │  ├─ Service Impact (calculated)                   │  │
│  │     │  ├─ Risk Tracking (defined + scored)              │  │
│  │     │  ├─ Regional Services (optional)                  │  │
│  │     │  ├─ ProposalEvaluation (1:1 link)                 │  │
│  │     │  ├─ Implementation Roadmap (generated)            │  │
│  │     │  └─ Board Summary (generated)                     │  │
│  │     ├─ Proposal 2                                        │  │
│  │     │  └─ ...                                            │  │
│  │     └─ Aggregated Impacts (sum of all proposals)        │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Data Structure

### Unified Proposal Object

```javascript
{
  // Identity & Status
  id: string,
  title: string,
  description: string,
  category: enum,              // staffing, shared_services, regional_revenue, capital, governance, administration
  priority: enum,              // low, medium, high, critical
  status: enum,                // concept, in_development, ready_for_review, approved, implemented, archived
  scenario_id: string,         // Links to parent Scenario
  
  // Scope
  departments: string[],       // Departments affected
  towns: string[],             // Towns involved (if regional)
  serviceTypes: string[],      // Service types affected
  fiscalYear: string,          // FY2027, FY2027-2028, etc.
  
  // Financial Impact (Auto-calculated from shared assumptions)
  financialImpact: {
    annualSavings: number,           // Direct annual savings
    annualRevenue: number,           // Direct annual revenue
    implementationCost: number,      // One-time cost
    totalAnnualBenefit: number,      // savings + revenue + regional - costs
    paybackPeriodYears: number,      // implementationCost / totalAnnualBenefit
    fiveYearNet: number,             // (totalAnnualBenefit × 5) - implementationCost
    yearlyProjection: [...],         // Year-by-year breakdown
    assumptions: string[]            // Underlying assumptions
  },
  
  // Tax Impact (Auto-calculated from financial impact + shared assumptions)
  taxImpact: {
    millRateChange: number,          // Cents per $1,000
    taxLevyChange: number,           // $ change in annual levy
    assumptions: string[]
  },
  
  // Staffing Impact (Calculated from FTE change + shared assumptions)
  staffingImpact: {
    fteChange: number,               // +/- full-time equivalents
    positionsAdded: string[],        // Position titles
    positionsEliminated: string[],   // Position titles
    skillGaps: string[],             // Training needed
    assumptions: string[]
  },
  
  // Service Impact
  serviceImpact: {
    areasAffected: string[],         // Service areas impacted
    expectedImprovements: string[],  // Improvements expected
    assumptions: string[]
  },
  
  // Risk Tracking (Scored: probability × impact)
  risks: [
    {
      risk: string,                  // Risk description
      probability: enum,             // low, medium, high
      impact: enum,                  // low, medium, high
      mitigation: string             // Mitigation strategy
    }
  ],
  
  // Shared Assumptions (referenced for all calculations)
  assumptions: string[],             // Key assumptions for this proposal
  
  // Regional Services (If applicable)
  regionalServices: {
    targetTowns: string[],           // Target municipalities
    adoptionRate: number,            // 0-1 adoption rate
    projectedRevenue: number,        // Annual revenue projection
    assumptions: string[]
  },
  
  // Evaluation Link
  evaluation_id: string,             // Link to ProposalEvaluation
  
  // Generated Content
  implementationRoadmap: {
    phases: [
      {
        phase: number,
        description: string,
        timeline: string,
        responsible_party: string
      }
    ]
  },
  
  boardSummary: {
    title: string,
    executive_summary: string,
    financial_highlights: string[],
    tax_impact: string[],
    staffing_impact: string[],
    key_risks: string[],
    recommendation: string,
    evaluation_score: number
  },
  
  // Relationships
  relatedProposals: string[],        // IDs of related proposals
  notes: string
}
```

## Module Organization

```
components/unified/
├── unifiedProposalModel.js          # Core data structures & generation
├── sharedAssumptions.js             # Centralized assumptions management
├── calculationEngine.js             # Unified calculations (all modules use)
├── scenarioProposalIntegration.js   # Scenario-proposal relationships
├── useUnifiedProposalSystem.js      # React hook for entire system
├── README.md                        # Detailed documentation
└── ARCHITECTURE.md                  # This file
```

## Calculation Flow

### 1. Financial Impact Calculation

```
Input:
  • Proposal data (savings, revenue, costs)
  • Regional services data (target towns, adoption, revenue)
  • Shared assumptions (wage growth, etc.)

Process:
  annual_savings + annual_revenue → direct_benefit
  direct_benefit + regional_revenue → total_annual_benefit
  implementation_cost ÷ total_annual_benefit → payback_period
  (total_annual_benefit × 5) - implementation_cost → five_year_net

Output: Financial impact metrics
```

### 2. Tax Impact Calculation

```
Input:
  • Financial impact (total_annual_benefit)
  • Shared assumptions (total_assessed_value, mill_rate)

Process:
  (annual_impact ÷ total_assessed_value) × 1000 → mill_rate_change
  -mill_rate_change → actual mill rate reduction

Output: Tax impact (mill rate change, tax levy impact)
```

### 3. Proposal Scoring

```
Input:
  • All calculated impacts
  • Risk metrics
  • Evaluation criteria

Process:
  Financial score (0-10) + Staffing score + Risk score + Service score
  Apply weights (30%, 20%, 25%, 25%)

Output: Overall proposal score (0-10)
```

### 4. Scenario Aggregation

```
Input:
  • All proposals in scenario
  • Calculated impacts for each proposal

Process:
  Σ financial impacts across proposals
  Σ tax impacts across proposals
  Σ staffing impacts across proposals
  Average evaluation scores

Output: Scenario-level aggregated impacts
```

## Data Flow Between Modules

### Tax Impact Module
```
Proposal
  ↓ (financial impact calculated)
  ↓ (+ shared assumptions)
Tax Impact Calculation
  ↓
Mill rate change
Tax levy impact
```

### Regional Service Revenue Module
```
Proposal (regional_services config)
  ↓ (adoption rate + target towns)
  ↓ (+ shared assumptions)
Regional Service Impact Calculation
  ↓
Adoption projections
Revenue projections
  ↓
Added to Financial Impact
```

### Implementation Roadmap Module
```
Proposal (category)
  ↓ (staffing, shared_services, regional_revenue, capital, etc.)
Roadmap Generation
  ↓
Phased timeline (category-specific)
  ↓
Stored in proposal.implementationRoadmap
```

### Board Summary Module
```
Proposal (all impacts)
  ↓ (+ evaluation if exists)
Summary Generation
  ↓
Executive summary
Key metrics highlights
Recommendation
  ↓
Stored in proposal.boardSummary
```

### Scenario Comparison Module
```
Scenario 1 → Load proposals → Calculate impacts → Aggregate
Scenario 2 → Load proposals → Calculate impacts → Aggregate
Scenario 3 → Load proposals → Calculate impacts → Aggregate
  ↓
Side-by-side comparison with same calculation engine
```

## Usage Patterns

### Pattern 1: Create Proposal in Scenario

```javascript
1. User creates proposal in Scenario
2. System calculates all impacts using shared assumptions
3. Roadmap auto-generated from category
4. Summary auto-generated from impacts
5. Proposal linked to scenario for aggregation
6. Scenario impacts updated
```

### Pattern 2: Create Evaluation for Proposal

```javascript
1. User creates evaluation
2. System scores impacts (financial, staffing, risk, service)
3. Evaluation score calculated (weighted average)
4. Board summary regenerated with evaluation
5. Proposal recommendations updated
```

### Pattern 3: Compare Scenarios

```javascript
1. User selects multiple scenarios
2. System loads all proposals for each scenario
3. All impacts calculated using SAME calculation engine
4. Aggregates by scenario
5. Side-by-side comparison available
```

### Pattern 4: Modify Assumptions

```javascript
1. User updates shared assumptions
2. All dependent calculations invalidated (React Query)
3. All impacts recalculated on next load
4. Tax impacts auto-update across all proposals
5. Scenario aggregates update automatically
```

## Key Features

### ✅ Single Source of Truth
- All assumptions in one place (ModelSettings)
- All calculations reference same assumptions
- Changes propagate automatically

### ✅ Automatic Calculations
- Financial impact auto-includes regional services
- Tax impact auto-calculated from financial impact
- Roadmaps auto-generated from proposal data
- Summaries auto-generated from impacts

### ✅ Consistency Across Modules
- Tax impact always uses same calculation logic
- Regional service revenue always calculated same way
- Proposal comparisons use identical calculation engine
- No calculation duplicates

### ✅ Scenario-Proposal Integration
- Scenarios contain proposals
- Proposals reference scenario assumptions
- Scenario aggregates auto-calculated from proposals
- Changes to proposals update scenario aggregates

### ✅ Evaluation Integration
- Evaluations linked to proposals (1:1)
- Board summaries use evaluation scores
- Recommendations integrated into workflow
- Assumption tracking in evaluations

### ✅ Audit Trail
- All calculations traceable to assumptions
- Assumptions stored with proposal
- Changes to assumptions tracked
- Versions can be compared

## Migration Path

### Phase 1: Data Normalization (Current)
- RestructuringProposal entity updated with new fields
- Existing data remains compatible
- New calculations available for new proposals

### Phase 2: Gradual Migration
- Existing proposals can add new fields over time
- Backward compatible - both old and new proposals work
- No data loss or breaking changes

### Phase 3: Full Integration
- All modules use unified calculations
- All proposals linked to scenarios
- All evaluations integrated into workflow

## Benefits

1. **Maintainability**: Single calculation logic, no duplication
2. **Consistency**: All modules use same data and calculations
3. **Scalability**: Easy to add new impacts or metrics
4. **Transparency**: All calculations traceable to assumptions
5. **Auditability**: Full history of assumptions and changes
6. **Flexibility**: Assumptions can be overridden per scenario

---

**Status**: Production Ready
**Version**: 1.0
**Last Updated**: March 14, 2026