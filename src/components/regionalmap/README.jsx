# Regional Relationship Planning System

A comprehensive municipal relationship planning component integrated into the Machias Bay Regional Map module, designed to support the restructuring plan by allowing strategic analysis of existing and potential interlocal service agreements.

## Components

### RelationshipPlanningPanel.jsx
Main planning interface with three tabs:
- **Select Types**: Choose relationship categories to analyze
- **Matrix View**: Tabular display of relationships by town
- **Legend**: Reference guide for statuses and roles

Features:
- Multi-tab interface for different planning views
- Town detail panel showing all relationships for selected municipality
- Real-time filtering by relationship type
- Town coverage analytics

### RelationshipTypeSelector.jsx
Hierarchical selector for 21 relationship types organized by service area:
- **Emergency Services** (5 types): Ambulance, Fire, Police, Dispatch, Emergency Management
- **Infrastructure & Utilities** (5 types): Transfer Station, Public Works, Roads, Broadband
- **Municipal Services** (4 types): Animal Control, Welfare, Code Enforcement, Planning
- **Administrative** (3 types): Finance, Staffing, Procurement
- **Community Services** (3 types): Schools, Recreation, Facilities
- **Regional Development** (2 types): Harbor/Marine, Other Strategic

Features:
- Select/deselect all relationships
- Group expansion/collapse
- Scroll overflow for large lists
- Visual coverage feedback

### RelationshipMatrix.jsx
Tabular view of selected relationships with columns:
- Town name
- Relationship type
- Current status (color-coded)
- Priority level (icon-based)
- Notes excerpt

Features:
- Group by municipality
- Click row to expand town detail
- Accessible color + icon + text status indicators
- Responsive table design

### RelationshipLegend.jsx
Three reference sections:
1. **Relationship Status** (6 types with explanations)
2. **Machias Role** (5 role types with descriptions)
3. **Relationship Types** (21 categories)

Features:
- Expandable/collapsible sections
- Plain-language status descriptions
- Color codes with explanatory text
- Mobile-friendly

## Data Model

### RegionalRelationship Entity
Stored in database with:

```
municipality: string
relationship_type: enum (21 options)
status: enum
  - existing: Active service relationship
  - existing_limited: Currently operational but limited
  - candidate_expansion: Existing ready to expand
  - prospective: Potential future relationship
  - long_term_strategic: Long-term planning option
  - not_recommended: Not advised currently

machias_role: enum
  - direct_provider: Machias delivers service
  - regional_hub: Machias as coordination center
  - shared_partner: Joint service delivery
  - contracted_admin: Machias provides administration
  - reciprocal_agreement: Mutual exchange
  - tbd: To be determined

priority_level: enum (critical, high, medium, low, exploratory)
operational_rationale: string
financial_rationale: string
service_rationale: string
governance_considerations: string
risks_constraints: string
next_steps: string
notes: string
```

## Integration with Regional Map

The planning panel integrates seamlessly with the existing map:

1. **Panel Toggle**: Available from the default map view
2. **Responsive Design**: Fits in right sidebar (w-72) on desktop, stackable on mobile
3. **Town Highlighting**: (Future) Can highlight towns with selected relationship types
4. **No Conflicts**: Doesn't interfere with Profile, Comparison, or Legend List modes
5. **Data-Driven**: Reads directly from RegionalRelationship entity

## Usage

### For Planning Staff
1. Open Regional Relationship Types panel from map
2. Select relationship types to analyze (e.g., "Ambulance/EMS")
3. View which towns could be potential partners
4. Click town in matrix to see relationship details
5. Review status, role, priority, and rationale for each

### For Strategic Analysis
1. Compare multiple relationship types across region
2. Identify candidate expansion relationships
3. Review next-step recommendations
4. Evaluate risks and governance considerations
5. Export or document relationship assessment

### For Data Management
1. RegionalRelationship entity stores all planning data
2. Each record is independent and updatable
3. No required relationships—full flexibility
4. Can be modified without rebuilding code

## Future Enhancements

- Map highlighting for selected relationship types
- Relationship status filtering in matrix
- Export to CSV/PDF
- Cost-sharing details
- Service territory visualization
- Governance model integration
- Consolidation scenario modeling
- Fiscal impact analysis by relationship
- Timeline/phasing view
- Comparison of different relationship configurations

## Accessibility

All components designed for low color acuity:
- Color-coded status + text labels
- Icon indicators (not color alone)
- Expandable legend with full explanations
- High contrast text
- Keyboard navigable
- No reliance on color differentiation

## Configuration

To add relationships in the database:
1. Create RegionalRelationship records in dashboard
2. Set municipality, relationship_type, status
3. Optionally add machias_role, priority, notes, rationale fields
4. Component auto-reflects new data

No code changes needed to add or modify relationship data.