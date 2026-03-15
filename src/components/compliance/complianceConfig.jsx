/**
 * complianceConfig.js
 *
 * Machine-readable default configuration for Machias Strategic Planner
 * compliance and environment settings.
 *
 * Items marked legalReview: true must be validated by municipal counsel
 * before enforcement.
 */

const DEFAULT_COMPLIANCE_CONFIG = {
  _meta: {
    version: '1.0.0',
    generated: '2026-03-15',
    municipality: 'Town of Machias, ME',
    legalDisclaimer:
      'This config is a structural default only. Items marked legalReview require counsel sign-off.',
  },

  audit: {
    enabled: true,
    logFinancialChanges: true,
    logExports: true,
    logUserLogins: true,
    retentionYears: '7',          // Maine MRS Title 30-A default; legalReview required
    legalReview: true,
    notes: 'Minimum 7-year retention recommended per Maine municipal records policy.',
  },

  retention: {
    scenarioRetentionYears: '7',
    snapshotRetentionMonths: '36',
    exportFormats: ['CSV', 'JSON', 'PDF'],
    encryptionAtRest: true,
    legalReview: true,
    notes:
      'Encryption-at-rest requirement should be confirmed against Maine data security statutes (MRS Title 10, Ch. 210-B) and applicable federal requirements.',
  },

  roles: {
    approvalWorkflow: [
      {
        role: 'Finance Admin',
        description:
          'Must review and approve any change to base salaries, benefit rates, or levy assumptions before they are committed.',
        required: true,
        legalNote: null,
      },
      {
        role: 'Auditor (Internal/External)',
        description:
          'Annual review of audit logs and model snapshots. Must be granted read-only access to all audit records.',
        required: true,
        legalNote:
          'Requires legal review — confirm auditor access rights against Maine municipal audit statutes.',
      },
      {
        role: 'Legal Reviewer',
        description:
          'Sign-off required for any scenario that changes tax levy by more than 2% or introduces a new interlocal agreement.',
        required: false,
        legalNote:
          'Requires legal review — threshold and trigger conditions must be set by municipal counsel.',
      },
      {
        role: 'Select Board (Resolution)',
        description:
          'Formal resolution required before approved scenarios can be submitted as budget warrant articles.',
        required: true,
        legalNote:
          'Requires legal review — confirm against Town Charter and Maine budget submission requirements.',
      },
    ],
  },

  standards: {
    gasbTarget: 'gasb_34',
    procurementPolicy: 'Maine Model Procurement Ordinance (placeholder — legal review required)',
    recordRetentionPolicy: 'Maine MRS Title 30-A §2601 (placeholder — legal review required)',
    localOrdinanceRef: 'Town of Machias Ordinance §__ (placeholder — legal team must insert)',
    legalReview: true,
  },

  contacts: {
    financeAdmin: '',
    auditor: '',
    legalReviewer: '',
    localOrdinanceRef: '',
  },
};

export default DEFAULT_COMPLIANCE_CONFIG;