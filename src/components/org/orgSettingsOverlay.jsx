// ─── Org Settings Overlay ────────────────────────────────────────────────────
// Takes the raw DB org nodes and patches them based on live ModelSettings.
// This keeps the DB as the source of truth while making Finance roles dynamic.
//
// Rules:
//  - SA, BS, RC, Controller/SA2 always report to Finance Director node
//    (they are already children of finance_hr in the DB seed, but we ensure
//     their parent is the finance_dir node, not the department wrapper)
//  - GA Coordinator reports to finance_dir OR town_mgr based on ga_reports_to setting
//  - Y5 senior hire: if y5_senior_hire === 'controller', show 'Controller' label;
//    otherwise show '2nd Staff Accountant' label
//  - Y1 staffing model: if 'parttime_stipend', SA label is 'PT Accounting Role (Y1)' in Y1
//    (we don't track year here, so just show the correct proposed label)

export function applySettingsOverlay(nodes, settings) {
  if (!nodes || nodes.length === 0) return nodes;

  // Find key node IDs by name patterns
  const findId = (namePart) => nodes.find(n => n.name && n.name.includes(namePart))?.id;
  const financeDirId  = findId('Finance Director');
  const financeHRId   = findId('Finance & Human');
  const townMgrId     = findId('Town Manager');

  if (!financeDirId && !financeHRId) return nodes; // seed not yet applied

  // The parent for Finance-team roles: prefer finance_dir if it exists, else finance_hr dept
  const financeParent = financeDirId || financeHRId;

  const gaReportsTo = settings?.ga_reports_to || 'finance_director';
  const gaParent    = gaReportsTo === 'town_manager' ? townMgrId : financeParent;

  const y5Label = settings?.y5_senior_hire === 'controller' ? 'Controller' : '2nd Staff Accountant';
  const y1IsPartTime = settings?.y1_staffing_model === 'parttime_stipend';

  return nodes.map(n => {
    const name = n.name || '';

    // Staff Accountant → reports to Finance Director
    if (name === 'Staff Accountant' && financeParent) {
      const label = y1IsPartTime ? 'Staff Accountant (hire Y2)' : 'Staff Accountant';
      return { ...n, parent_id: financeParent, name: label };
    }

    // Billing Specialist → reports to Finance Director
    if (name === 'Billing Specialist' && financeParent) {
      return { ...n, parent_id: financeParent };
    }

    // Revenue Coordinator → reports to Finance Director
    if (name === 'Revenue Coordinator' && financeParent) {
      return { ...n, parent_id: financeParent };
    }

    // GA Coordinator → reports to finance_director or town_manager per setting
    if (name === 'GA Coordinator' && gaParent) {
      const gaNote = gaReportsTo === 'town_manager'
        ? 'GA Coordinator — reports to Town Manager per model settings.'
        : 'GA Coordinator — reports to Finance Director per model settings.';
      return { ...n, parent_id: gaParent, restructuring_notes: gaNote };
    }

    // RC role label (in case it was seeded as Revenue Coordinator)
    // Y5 senior hire label: update the controller/SA2 node name dynamically
    if ((name === 'Controller' || name === '2nd Staff Accountant' || name === 'Staff Accountant (Y5)') && financeParent) {
      // Only relabel the node that has controller restructuring context
      if (n.restructuring_notes && n.restructuring_notes.includes('Year 5')) {
        return { ...n, parent_id: financeParent, name: y5Label };
      }
    }

    return n;
  });
}