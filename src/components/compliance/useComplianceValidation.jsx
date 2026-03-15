/**
 * useComplianceValidation.js
 *
 * React hook that runs the compliance rule engine against the current
 * model settings and returns typed violations + a summary.
 *
 * Usage:
 *   const { violations, summary, loading } = useComplianceValidation();
 *
 * Then pass `violations` to <ComplianceViolationBanner /> wherever needed.
 */

import { useMemo } from 'react';
import { useModel } from '@/components/machias/ModelContext';
import { validateScenario, getViolationSummary } from './complianceConfig';

export function useComplianceValidation() {
  const { settings, loading } = useModel();

  const violations = useMemo(() => {
    if (loading || !settings) return [];
    return validateScenario(settings);
  }, [settings, loading]);

  const summary = useMemo(() => getViolationSummary(violations), [violations]);

  return { violations, summary, loading };
}