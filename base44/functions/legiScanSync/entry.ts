/**
 * legiScanSync.js
 * Syncs Maine state legislative data from LegiScan API into PolicySourceRecord
 * and LegislationItem entities. Uses change_hash tracking for efficient incremental updates.
 *
 * Designed to run as a scheduled daily automation.
 * Can also be triggered manually by an admin.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const LEGISCAN_BASE = 'https://api.legiscan.com/';
const TARGET_STATE = 'ME'; // Maine
const SOURCE_NAME = 'LegiScan / Maine Legislature';
const SOURCE_TYPE = 'state_legislation';

// LegiScan API helper — all requests go to the same endpoint with op + params
async function legiScan(op, params = {}) {
  const apiKey = Deno.env.get('LEGISCAN_API_KEY');
  if (!apiKey) throw new Error('LEGISCAN_API_KEY is not set.');

  const url = new URL(LEGISCAN_BASE);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('op', op);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`LegiScan HTTP error: ${res.status}`);
  const json = await res.json();
  if (json.status === 'ERROR') throw new Error(`LegiScan API error: ${json.alert?.message || 'Unknown error'}`);
  return json;
}

// Map LegiScan bill status codes to our internal status enum
function mapStatus(statusId) {
  const map = {
    1: 'introduced',
    2: 'in_committee',
    3: 'passed_chamber',
    4: 'passed_both',
    5: 'enacted',
    6: 'vetoed',
    7: 'failed',
    8: 'failed',
  };
  return map[statusId] || 'watch';
}

// Map LegiScan bill type to a category label
function mapType(billType) {
  const map = {
    'B': 'Bill',
    'R': 'Resolution',
    'CR': 'Concurrent Resolution',
    'JR': 'Joint Resolution',
    'JRCA': 'Joint Resolution (Constitutional Amendment)',
    'EO': 'Executive Order',
    'CA': 'Constitutional Amendment',
    'A': 'Administrative',
    'SR': 'Study Request',
    'SC': 'Study Commission',
    'SB': 'State Budget',
  };
  return map[billType] || 'Other';
}

// Normalize a LegiScan master-list bill entry into a PolicySourceRecord shape
function normalizeBillToSourceRecord(bill, sessionId) {
  return {
    source_type:          SOURCE_TYPE,
    source_name:          SOURCE_NAME,
    external_id:          String(bill.bill_id),
    raw_title:            bill.title || bill.bill_number,
    raw_summary:          bill.description || bill.title || '',
    source_url:           bill.url || '',
    source_jurisdiction:  'state',
    source_state:         TARGET_STATE,
    ingested_at:          new Date().toISOString(),
    ingested_by:          'legiScanSync',
    normalization_status: 'pending',
    notes:                JSON.stringify({
      bill_number:   bill.bill_number,
      change_hash:   bill.change_hash,
      status_id:     bill.status,
      bill_type:     bill.bill_type,
      session_id:    sessionId,
      last_action:   bill.last_action,
      last_action_date: bill.last_action_date,
    }),
  };
}

// Normalize a LegiScan master-list bill into a LegislationItem shape
function normalizeBillToLegislationItem(bill, sessionId) {
  return {
    identifier:       bill.bill_number,
    title:            bill.title || bill.bill_number,
    jurisdiction:     'state',
    category:         mapType(bill.bill_type),
    status:           mapStatus(bill.status),
    priority:         'watch',
    summary:          bill.description || '',
    sponsor:          bill.sponsors?.map(s => s.name).join(', ') || '',
    last_action:      bill.last_action || '',
    last_action_date: bill.last_action_date || null,
    source_url:       bill.url || '',
    is_watched:       false,
    is_archived:      false,
    notes:            `LegiScan bill_id: ${bill.bill_id} | Session: ${sessionId} | hash: ${bill.change_hash}`,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no-auth) calls and admin-triggered calls
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch {
      // No user session — assume scheduled/system call
      isScheduled = true;
    }

    const runType = isScheduled ? 'scheduled' : 'manual';
    const startedAt = new Date().toISOString();

    // Create ingestion log entry
    const log = await base44.asServiceRole.entities.PolicyIngestionLog.create({
      run_type:    runType,
      source_type: SOURCE_TYPE,
      source_name: SOURCE_NAME,
      started_at:  startedAt,
      status:      'running',
      triggered_by: isScheduled ? 'scheduler' : 'admin',
    });

    const stats = {
      sessions_scanned: 0,
      bills_fetched:    0,
      bills_new:        0,
      bills_updated:    0,
      bills_skipped:    0,
      errors:           0,
      error_messages:   [],
    };

    // 1. Get session list for Maine
    const sessionsRes = await legiScan('getSessionList', { state: TARGET_STATE });
    const sessions = sessionsRes.sessions || [];

    // Focus on the most recent 2 sessions (current + prior)
    const recentSessions = sessions
      .sort((a, b) => b.session_id - a.session_id)
      .slice(0, 2);

    stats.sessions_scanned = recentSessions.length;

    // Load existing source records for dedup (by external_id)
    const existingSourceRecords = await base44.asServiceRole.entities.PolicySourceRecord.filter({
      source_name: SOURCE_NAME,
    });
    const existingByExternalId = {};
    existingSourceRecords.forEach(r => {
      if (r.external_id) existingByExternalId[r.external_id] = r;
    });

    // Load existing LegislationItems for dedup (by identifier + jurisdiction)
    const existingLegItems = await base44.asServiceRole.entities.LegislationItem.filter({
      jurisdiction: 'state',
    });
    const existingLegByIdentifier = {};
    existingLegItems.forEach(item => {
      if (item.identifier) existingLegByIdentifier[item.identifier] = item;
    });

    for (const session of recentSessions) {
      const sessionId = session.session_id;

      // 2. Get master list (returns all bills with change_hash)
      let masterRes;
      try {
        masterRes = await legiScan('getMasterList', { id: sessionId });
      } catch (e) {
        stats.errors++;
        stats.error_messages.push(`Session ${sessionId} getMasterList failed: ${e.message}`);
        continue;
      }

      const masterList = masterRes.masterlist || {};
      // masterlist is an object keyed by bill_id (with a 'session' key mixed in)
      const bills = Object.values(masterList).filter(b => b && b.bill_id);

      for (const bill of bills) {
        stats.bills_fetched++;
        const externalId = String(bill.bill_id);
        const existingSource = existingByExternalId[externalId];

        try {
          // Parse stored change_hash from notes
          let storedHash = null;
          if (existingSource?.notes) {
            try {
              const parsed = JSON.parse(existingSource.notes);
              storedHash = parsed.change_hash;
            } catch {}
          }

          // Skip if change_hash matches — no update needed
          if (existingSource && storedHash === bill.change_hash) {
            stats.bills_skipped++;
            continue;
          }

          const sourceRecord = normalizeBillToSourceRecord(bill, sessionId);
          const legItem = normalizeBillToLegislationItem(bill, sessionId);

          if (existingSource?.id) {
            // Update existing source record
            await base44.asServiceRole.entities.PolicySourceRecord.update(existingSource.id, sourceRecord);
          } else {
            // Create new source record
            const created = await base44.asServiceRole.entities.PolicySourceRecord.create(sourceRecord);
            existingByExternalId[externalId] = created;
          }

          // Upsert LegislationItem by bill_number (identifier)
          const existingLeg = existingLegByIdentifier[bill.bill_number];
          if (existingLeg?.id) {
            await base44.asServiceRole.entities.LegislationItem.update(existingLeg.id, {
              status:           legItem.status,
              last_action:      legItem.last_action,
              last_action_date: legItem.last_action_date,
              notes:            legItem.notes,
              summary:          legItem.summary || existingLeg.summary,
            });
            stats.bills_updated++;
          } else {
            const newItem = await base44.asServiceRole.entities.LegislationItem.create(legItem);
            existingLegByIdentifier[bill.bill_number] = newItem;
            stats.bills_new++;
          }

        } catch (e) {
          stats.errors++;
          stats.error_messages.push(`bill_id ${externalId}: ${e.message}`);
        }
      }
    }

    // Update ingestion log
    const completedAt = new Date().toISOString();
    await base44.asServiceRole.entities.PolicyIngestionLog.update(log.id, {
      completed_at:        completedAt,
      status:              stats.errors > 0 && stats.bills_new + stats.bills_updated === 0 ? 'failed' : stats.errors > 0 ? 'partial' : 'completed',
      records_ingested:    stats.bills_fetched,
      records_normalized:  stats.bills_new + stats.bills_updated,
      records_deduplicated: stats.bills_skipped,
      records_errored:     stats.errors,
      error_log:           stats.error_messages.length ? stats.error_messages.join('\n') : null,
      notes:               `Sessions scanned: ${stats.sessions_scanned} | New: ${stats.bills_new} | Updated: ${stats.bills_updated} | Skipped (no change): ${stats.bills_skipped}`,
    });

    return Response.json({
      status:  'ok',
      run_type: runType,
      stats,
      completed_at: completedAt,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});