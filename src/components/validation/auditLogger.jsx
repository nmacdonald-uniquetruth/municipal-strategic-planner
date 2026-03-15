/**
 * Audit Logger
 * Records changes to assumptions, scenario revisions, and proposal history.
 * Persists to the AuditLog entity via the base44 SDK.
 */

import { base44 } from '@/api/base44Client';

export const AUDIT_EVENT_TYPES = {
  // Assumptions
  ASSUMPTION_CHANGED:      'assumption_changed',
  MODEL_SETTINGS_UPDATED:  'model_settings_updated',

  // Scenarios
  SCENARIO_CREATED:        'scenario_created',
  SCENARIO_REVISED:        'scenario_revised',
  SCENARIO_ACTIVATED:      'scenario_activated',
  SCENARIO_DELETED:        'scenario_deleted',

  // Proposals
  PROPOSAL_CREATED:        'proposal_created',
  PROPOSAL_UPDATED:        'proposal_updated',
  PROPOSAL_STATUS_CHANGED: 'proposal_status_changed',
  PROPOSAL_DELETED:        'proposal_deleted',

  // Validation
  VALIDATION_RUN:          'validation_run',
  COMPLIANCE_VIOLATION:    'compliance_violation',

  // Services
  SERVICE_CREATED:         'service_created',
  SERVICE_UPDATED:         'service_updated',
  SERVICE_STATUS_CHANGED:  'service_status_changed',
};

/**
 * Log an audit event to the AuditLog entity
 */
export async function logAuditEvent({ eventType, entityType, entityId, entityName, changes, userId, metadata = {} }) {
  const entry = {
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId || null,
    entity_name: entityName || null,
    changes: changes ? JSON.stringify(changes) : null,
    user_id: userId || null,
    metadata: JSON.stringify(metadata),
    timestamp: new Date().toISOString(),
  };
  return base44.entities.AuditLog.create(entry);
}

/**
 * Log assumption / model settings changes with before/after diff
 */
export async function logAssumptionChange({ settingsId, before, after, userId }) {
  const changed = {};
  Object.keys(after).forEach(key => {
    if (before[key] !== after[key]) {
      changed[key] = { from: before[key], to: after[key] };
    }
  });
  if (Object.keys(changed).length === 0) return null;

  return logAuditEvent({
    eventType: AUDIT_EVENT_TYPES.ASSUMPTION_CHANGED,
    entityType: 'ModelSettings',
    entityId: settingsId,
    entityName: 'Model Settings',
    changes: changed,
    userId,
    metadata: { changedFields: Object.keys(changed) },
  });
}

/**
 * Log a scenario revision with a summary of what changed
 */
export async function logScenarioRevision({ scenario, before, userId, isNew = false }) {
  const eventType = isNew ? AUDIT_EVENT_TYPES.SCENARIO_CREATED : AUDIT_EVENT_TYPES.SCENARIO_REVISED;
  const changes = isNew ? null : diffObjects(before, scenario);

  return logAuditEvent({
    eventType,
    entityType: 'Scenario',
    entityId: scenario.id,
    entityName: scenario.name,
    changes,
    userId,
    metadata: { scenarioType: scenario.type, isBaseline: scenario.is_baseline },
  });
}

/**
 * Log a proposal lifecycle event
 */
export async function logProposalEvent({ proposal, before, userId, isNew = false, isDelete = false }) {
  let eventType = AUDIT_EVENT_TYPES.PROPOSAL_UPDATED;
  if (isNew) eventType = AUDIT_EVENT_TYPES.PROPOSAL_CREATED;
  else if (isDelete) eventType = AUDIT_EVENT_TYPES.PROPOSAL_DELETED;
  else if (before?.status !== proposal?.status) eventType = AUDIT_EVENT_TYPES.PROPOSAL_STATUS_CHANGED;

  const changes = isNew || isDelete ? null : diffObjects(before, proposal);

  return logAuditEvent({
    eventType,
    entityType: 'RestructuringProposal',
    entityId: proposal.id,
    entityName: proposal.title,
    changes,
    userId,
    metadata: {
      status: proposal.status,
      category: proposal.category,
      previousStatus: before?.status,
    },
  });
}

/**
 * Log a validation run result
 */
export async function logValidationRun({ context, violations, userId }) {
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;

  return logAuditEvent({
    eventType: AUDIT_EVENT_TYPES.VALIDATION_RUN,
    entityType: context.entityType || 'System',
    entityId: context.entityId || null,
    entityName: context.entityName || 'Validation Check',
    changes: null,
    userId,
    metadata: { errorCount, warningCount, totalViolations: violations.length, context },
  });
}

/**
 * Query audit history for a specific entity
 */
export async function getAuditHistory(entityType, entityId, limit = 50) {
  return base44.entities.AuditLog.filter(
    { entity_type: entityType, entity_id: entityId },
    '-timestamp',
    limit
  );
}

/**
 * Query recent audit events across all entities
 */
export async function getRecentAuditEvents(limit = 100) {
  return base44.entities.AuditLog.list('-timestamp', limit);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function diffObjects(before, after) {
  if (!before || !after) return null;
  const diff = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  allKeys.forEach(key => {
    const bVal = JSON.stringify(before[key]);
    const aVal = JSON.stringify(after[key]);
    if (bVal !== aVal) {
      diff[key] = { from: before[key], to: after[key] };
    }
  });
  return Object.keys(diff).length > 0 ? diff : null;
}