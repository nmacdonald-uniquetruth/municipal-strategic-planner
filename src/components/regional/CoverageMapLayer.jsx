/**
 * CoverageMapLayer
 * Renders service coverage indicators as colored overlays / markers on the RegionalMap.
 * Passes coverage data up via onCoverageUpdate so the map can shade polygons.
 */

import React, { useEffect, useMemo } from 'react';
import { MACHIAS_SERVICES, estimateCoverageArea } from './serviceOptimizer';

const TOWNS = [
  { name: 'Machiasport', population: 952,  distance_from_machias_miles: 5.2  },
  { name: 'Roque Bluffs', population: 294,  distance_from_machias_miles: 8.4  },
  { name: 'Marshfield',  population: 1419, distance_from_machias_miles: 6.1  },
  { name: 'Whitneyville', population: 381,  distance_from_machias_miles: 3.9  },
  { name: 'Northfield',  population: 481,  distance_from_machias_miles: 11.2 },
  { name: 'East Machias', population: 1218, distance_from_machias_miles: 4.7  },
  { name: 'Jonesboro',   population: 585,  distance_from_machias_miles: 14.3 },
  { name: 'Wesley',      population: 481,  distance_from_machias_miles: 17.8 },
  { name: 'Cutler',      population: 457,  distance_from_machias_miles: 21.4 },
];

// Colors for service coverage overlays on map polygons
export const SERVICE_FILL_COLORS = {
  financial_administration: '#344A60',
  ems_billing: '#2A7F7F',
  transfer_station: '#9C5334',
  ambulance_coverage: '#6B5EA8',
  code_enforcement: '#2D7D46',
  assessing: '#B5691E',
};

/**
 * Compute which towns are in coverage for a set of services.
 * Returns a map of { townName → { services: [...], color, opacity } }
 */
export function buildCoverageMap(serviceIds) {
  const coverage = {};
  serviceIds.forEach(sid => {
    const towns = estimateCoverageArea(TOWNS, sid);
    towns.forEach(t => {
      if (!coverage[t.name]) {
        coverage[t.name] = { services: [], primaryColor: SERVICE_FILL_COLORS[sid], maxNet: t.netBenefit };
      }
      coverage[t.name].services.push(sid);
      if (t.netBenefit > coverage[t.name].maxNet) {
        coverage[t.name].maxNet = t.netBenefit;
        coverage[t.name].primaryColor = SERVICE_FILL_COLORS[sid];
      }
    });
  });
  return coverage;
}

/**
 * React component: fires onCoverageUpdate whenever selected services change.
 * No visual output of its own — works as a side-effect bridge.
 */
export default function CoverageMapLayer({ selectedServices = [], onCoverageUpdate }) {
  const coverageMap = useMemo(() => buildCoverageMap(selectedServices), [selectedServices]);

  useEffect(() => {
    if (onCoverageUpdate) onCoverageUpdate(coverageMap);
  }, [coverageMap, onCoverageUpdate]);

  return null;
}