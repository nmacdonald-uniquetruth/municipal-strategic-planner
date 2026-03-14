// ─── Org Settings Overlay ────────────────────────────────────────────────────
// Patches DB org nodes dynamically based on live ModelSettings so the org
// chart always reflects the current configuration without DB writes.
//
// Rules applied:
//  1. Staff Accountant, Billing Specialist, Revenue Coordinator, Controller
//     → always parent = Finance Director node id
//  2. GA Coordinator → parent = Finance Director (default) or Town Manager
//     based on ga_reports_to setting
//  3. Controller node → label switches to "2nd Staff Accountant" when
//     y5_senior_hire === 'staff_accountant'
//  4. Staff Accountant → label becomes "Staff Accountant (hire Y2)" when
//     y1_staffing_model === 'parttime_stipend'

export function applySettingsOverlay(nodes, settings) {
  if (!nodes || nodes.length === 0) return nodes;

  // Find Finance Director id (by name)
  const financeDirNode = nodes.find(n => n.name && n.name.includes('Finance Director'));
  const townMgrNode    = nodes.find(n => n.name === 'Town Manager');

  const financeDirId = financeDirNode?.id;
  const townMgrId    = townMgrNode?.id;

  const gaReportsTo  = settings?.ga_reports_to || 'finance_director';
  const gaParentId   = gaReportsTo === 'town_manager' ? townMgrId : financeDirId;

  const y5IsController = settings?.y5_senior_hire === 'controller';
  const y1IsPartTime   = settings?.y1_staffing_model === 'parttime_stipend';

  return nodes.map(n => {
    const name = n.name || '';

    // Staff Accountant
    if (name.startsWith('Staff Accountant') && financeDirId && !name.includes('Director')) {
      const label = y1IsPartTime ? 'Staff Accountant (hire Y2)' : 'Staff Accountant';
      return { ...n, parent_id: financeDirId, name: label };
    }

    // Billing Specialist
    if (name === 'Billing Specialist' && financeDirId) {
      return { ...n, parent_id: financeDirId };
    }

    // Revenue Coordinator
    if (name === 'Revenue Coordinator' && financeDirId) {
      return { ...n, parent_id: financeDirId };
    }

    // GA Coordinator — dynamic parent
    if (name === 'GA Coordinator' && gaParentId) {
      const gaNote = gaReportsTo === 'town_manager'
        ? 'Phase 1 stipend position. Reports to Town Manager (per Model Settings). Toggle under Model Settings → Personnel.'
        : 'Phase 1 stipend position. Reports to Finance Director (per Model Settings). Toggle under Model Settings → Personnel.';
      return { ...n, parent_id: gaParentId, restructuring_notes: gaNote };
    }

    // Controller / 2nd Staff Accountant — Y5 senior hire toggle
    if (name === 'Controller' && financeDirId) {
      if (!y5IsController) {
        // Rename to 2nd Staff Accountant
        return {
          ...n,
          parent_id: financeDirId,
          name: '2nd Staff Accountant',
          description: 'Second Staff Accountant. Year 5 hire. Provides additional capacity for financial operations. Toggle in Model Settings.',
          restructuring_notes: 'Year 5 hire — displayed as 2nd Staff Accountant per Model Settings. Reports to Finance Director.',
        };
      }
      return { ...n, parent_id: financeDirId };
    }

    return n;
  });
}