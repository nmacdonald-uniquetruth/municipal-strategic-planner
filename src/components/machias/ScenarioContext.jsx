import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';

const ScenarioContext = createContext(null);

export function ScenarioProvider({ children }) {
  const [activeScenario, setActiveScenario] = useState(null);
  const [allScenarios, setAllScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = useCallback(async () => {
    try {
      const scenarios = await base44.entities.Scenario.list();
      setAllScenarios(scenarios || []);
      const active = scenarios?.find(s => s.is_active);
      setActiveScenario(active || null);
    } finally {
      setLoading(false);
    }
  }, []);

  const activateScenario = useCallback(async (scenarioId) => {
    try {
      // Deactivate all others
      await Promise.all(
        allScenarios
          .filter(s => s.is_active)
          .map(s => base44.entities.Scenario.update(s.id, { is_active: false }))
      );

      // Activate selected
      await base44.entities.Scenario.update(scenarioId, { is_active: true });

      // Update local state
      const updated = allScenarios.map(s => ({
        ...s,
        is_active: s.id === scenarioId,
      }));
      setAllScenarios(updated);
      setActiveScenario(updated.find(s => s.id === scenarioId));
    } catch (error) {
      console.error('Error activating scenario:', error);
    }
  }, [allScenarios]);

  const createScenario = useCallback(async (scenarioData) => {
    try {
      const created = await base44.entities.Scenario.create(scenarioData);
      setAllScenarios([...allScenarios, created]);
      return created;
    } catch (error) {
      console.error('Error creating scenario:', error);
      throw error;
    }
  }, [allScenarios]);

  const updateScenario = useCallback(async (scenarioId, updates) => {
    try {
      await base44.entities.Scenario.update(scenarioId, updates);
      const updated = allScenarios.map(s => s.id === scenarioId ? { ...s, ...updates } : s);
      setAllScenarios(updated);
      if (activeScenario?.id === scenarioId) {
        setActiveScenario({ ...activeScenario, ...updates });
      }
    } catch (error) {
      console.error('Error updating scenario:', error);
      throw error;
    }
  }, [allScenarios, activeScenario]);

  const deleteScenario = useCallback(async (scenarioId) => {
    try {
      await base44.entities.Scenario.delete(scenarioId);
      setAllScenarios(allScenarios.filter(s => s.id !== scenarioId));
      if (activeScenario?.id === scenarioId) {
        setActiveScenario(null);
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
      throw error;
    }
  }, [allScenarios, activeScenario]);

  /**
   * Flattened settings overrides from the active scenario's assumption blocks.
   * Merge this on top of ModelContext settings to drive scenario-specific calculations.
   *
   * Usage in components:
   *   const { settings } = useModel();
   *   const { scenarioSettingsOverrides } = useScenario();
   *   const effectiveSettings = { ...settings, ...scenarioSettingsOverrides };
   */
  const scenarioSettingsOverrides = useMemo(() => {
    if (!activeScenario) return {};
    const fin = activeScenario.financial_assumptions ?? {};
    const stf = activeScenario.staffing_assumptions  ?? {};
    const ops = activeScenario.operational_assumptions ?? {};
    return {
      ...(fin.wage_growth_rate    != null && { wage_growth_rate:      fin.wage_growth_rate }),
      ...(fin.health_tier         != null && { health_tier:           fin.health_tier }),
      ...(fin.transport_growth_rate != null && { transport_growth_rate: fin.transport_growth_rate }),
      ...(fin.inhouse_collection_rate != null && { inhouse_steady_rate:  fin.inhouse_collection_rate }),
      ...(stf.y1_staffing_model   != null && { y1_staffing_model:     stf.y1_staffing_model }),
      ...(stf.y5_senior_hire      != null && { y5_senior_hire:        stf.y5_senior_hire }),
      ...(ops.erp_implementation  != null && { erp_implementation:    ops.erp_implementation }),
      ...(ops.transfer_station_expansion != null && { transfer_station_expansion: ops.transfer_station_expansion }),
      ...(ops.ems_external_billing != null && { ems_external_billing:  ops.ems_external_billing }),
    };
  }, [activeScenario]);

  return (
    <ScenarioContext.Provider
      value={{
        activeScenario,
        allScenarios,
        loading,
        activateScenario,
        createScenario,
        updateScenario,
        deleteScenario,
        loadScenarios,
        scenarioSettingsOverrides,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within ScenarioProvider');
  }
  return context;
}