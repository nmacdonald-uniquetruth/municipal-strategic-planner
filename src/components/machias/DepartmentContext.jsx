import React, { createContext, useContext, useState, useCallback } from 'react';

const DepartmentContext = createContext();

export const DEPARTMENTS = [
  { id: 'all', label: 'All Departments', value: 'all' },
  { id: 'admin', label: 'Administration', value: 'admin' },
  { id: 'finance', label: 'Financial Services', value: 'finance' },
  { id: 'transfer_station', label: 'Transfer Station', value: 'transfer_station' },
  { id: 'assessor', label: 'Tax Assessor', value: 'assessor' },
  { id: 'animal_control', label: 'Animal Control Officer', value: 'animal_control' },
  { id: 'ambulance', label: 'Ambulance / EMS', value: 'ambulance' },
  { id: 'police', label: 'Police Department', value: 'police' },
  { id: 'fire', label: 'Fire Department', value: 'fire' },
  { id: 'inspection', label: 'Regional Inspection Services', value: 'inspection' },
];

export function DepartmentProvider({ children }) {
  const [selectedDepartments, setSelectedDepartments] = useState(['all']);

  const toggleDepartment = useCallback((deptId) => {
    setSelectedDepartments(prev => {
      if (deptId === 'all') {
        return prev.includes('all') ? [] : ['all'];
      }
      const filtered = prev.filter(d => d !== 'all');
      const updated = filtered.includes(deptId)
        ? filtered.filter(d => d !== deptId)
        : [...filtered, deptId];
      return updated.length === 0 ? [] : updated;
    });
  }, []);

  const getDepartmentLabel = useCallback((deptId) => {
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    return dept ? dept.label : 'All Departments';
  }, []);

  return (
    <DepartmentContext.Provider
      value={{
        selectedDepartments,
        toggleDepartment,
        getDepartmentLabel,
        DEPARTMENTS,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartment must be used within DepartmentProvider');
  }
  return context;
}

export function isDepartmentSelected(selectedDepartments, deptId) {
  if (selectedDepartments.includes('all')) return true;
  return selectedDepartments.includes(deptId);
}