/**
 * OrgChartSettings — headless loader component.
 * Reads org chart display settings from localStorage (set by Model Settings page)
 * and calls onLoad(settings) once on mount and whenever settings change.
 *
 * No UI is rendered here — this is a pure state bridge.
 */
import { useEffect, useRef } from 'react';
import { DEFAULT_ORG_SETTINGS } from './OrgChartData';

const STORAGE_KEY = 'machias_org_chart_settings';

export function readOrgChartSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_ORG_SETTINGS, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_ORG_SETTINGS };
}

export function saveOrgChartSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Notify other tabs / same-page listeners
    window.dispatchEvent(new CustomEvent('orgChartSettingsChanged', { detail: settings }));
  } catch (e) { /* ignore */ }
}

export default function OrgChartSettings({ onLoad }) {
  const cbRef = useRef(onLoad);
  cbRef.current = onLoad;

  useEffect(() => {
    cbRef.current(readOrgChartSettings());

    const handler = (e) => cbRef.current(e.detail);
    window.addEventListener('orgChartSettingsChanged', handler);
    return () => window.removeEventListener('orgChartSettingsChanged', handler);
  }, []);

  return null;
}