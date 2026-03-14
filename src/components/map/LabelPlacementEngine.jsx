/**
 * Label Placement Engine
 * Implements pole of inaccessibility (visual center) algorithm for optimal municipal label placement
 * Ensures labels are positioned in the most readable interior space of polygons
 */

/**
 * Find the pole of inaccessibility — the most distant point from any polygon edge
 * Uses a grid-based approach with iterative refinement for speed
 * @param {Array} ring - Polygon ring coordinates [[lng, lat], ...]
 * @returns {[number, number]} [lng, lat] of best interior point
 */
export function findLabelCenter(ring) {
  if (!ring || ring.length < 3) return null;

  const minX = Math.min(...ring.map(c => c[0]));
  const minY = Math.min(...ring.map(c => c[1]));
  const maxX = Math.max(...ring.map(c => c[0]));
  const maxY = Math.max(...ring.map(c => c[1]));

  const width = maxX - minX;
  const height = maxY - minY;
  const cellSize = Math.min(width, height) / 4;
  let bestCell = null;
  let bestDistance = 0;

  // Grid pass: check cells for interior candidate
  for (let y = minY; y < maxY; y += cellSize) {
    for (let x = minX; x < maxX; x += cellSize) {
      const cell = [x + cellSize / 2, y + cellSize / 2];
      if (pointInPolygon(cell, ring)) {
        const dist = pointToPolygonDistance(cell, ring);
        if (dist > bestDistance) {
          bestDistance = dist;
          bestCell = cell;
        }
      }
    }
  }

  if (!bestCell) {
    // Fallback: use simple centroid if grid fails
    return simpleCentroid(ring);
  }

  // Multi-pass refinement: progressively narrow search
  let refined = [...bestCell];
  for (let pass = 0; pass < 5; pass++) {
    const searchRadius = (cellSize / 2) / Math.pow(2, pass);
    let improved = false;

    for (let dy = -searchRadius; dy <= searchRadius; dy += searchRadius / 2) {
      for (let dx = -searchRadius; dx <= searchRadius; dx += searchRadius / 2) {
        const candidate = [refined[0] + dx, refined[1] + dy];
        if (pointInPolygon(candidate, ring)) {
          const dist = pointToPolygonDistance(candidate, ring);
          if (dist > bestDistance) {
            bestDistance = dist;
            refined = candidate;
            improved = true;
          }
        }
      }
    }

    if (!improved) break;
  }

  return refined;
}

/**
 * Simple centroid calculation
 */
function simpleCentroid(ring) {
  let sumLng = 0, sumLat = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }
  return [sumLng / (ring.length - 1), sumLat / (ring.length - 1)];
}

/**
 * Point-in-polygon test using ray casting
 */
function pointInPolygon(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    const intersect = yi > point[1] !== yj > point[1] &&
      point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Distance from point to nearest polygon edge
 */
function pointToPolygonDistance(point, ring) {
  let minDist = Infinity;
  for (let i = 0; i < ring.length - 1; i++) {
    const dist = distanceToSegment(point, ring[i], ring[i + 1]);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

/**
 * Distance from point to line segment
 */
function distanceToSegment(point, a, b) {
  const [px, py] = point;
  const [ax, ay] = a;
  const [bx, by] = b;

  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)));
  const closestX = ax + t * abx;
  const closestY = ay + t * aby;

  const dx = px - closestX, dy = py - closestY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate polygon area using shoelace formula
 */
export function calculatePolygonArea(ring) {
  if (!ring || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * Estimate label font size based on polygon area and zoom level
 * Larger polygons and higher zoom levels get larger labels
 */
export function estimateFontSize(ring, zoom = 10) {
  if (!ring || ring.length < 3) return 11;

  const area = calculatePolygonArea(ring);

  // Base size calculation from area (10-14px range)
  let fontSize;
  if (area < 0.0003) fontSize = 9.5;
  else if (area < 0.0006) fontSize = 10.5;
  else if (area < 0.001) fontSize = 11.5;
  else if (area < 0.002) fontSize = 12;
  else fontSize = 13;

  // Subtle zoom adjustment (avoid extreme changes)
  const zoomFactor = Math.max(0.9, Math.min(1.1, zoom / 11));
  fontSize = fontSize * zoomFactor;

  return Math.round(fontSize * 2) / 2; // Round to nearest 0.5
}

/**
 * Check if point is near polygon boundary (too close for clean label placement)
 */
export function isTooCloseToBoundary(point, ring, minDistance = 0.001) {
  return pointToPolygonDistance(point, ring) < minDistance;
}

/**
 * Determine if town name should be wrapped across multiple lines
 * Considers name length and polygon area for aesthetic balance
 */
export function shouldWrapTownName(townName, ring) {
  if (!townName || townName.length <= 8) return false;
  if (townName.length > 14) return true;

  const area = calculatePolygonArea(ring);
  
  // Very small areas benefit from multi-line
  if (area < 0.0004) return true;
  
  // Two-word names (e.g., "East Machias") should split naturally on small/medium areas
  if (townName.includes(' ') && area < 0.0015) return true;
  
  return false;
}

/**
 * Get wrapped town name formatted for clean display
 * Returns array of lines to display
 */
export function getWrappedTownName(townName, ring) {
  if (!townName || !shouldWrapTownName(townName, ring)) {
    return [townName]; // Single line
  }

  // For two-word names, split naturally on space
  const parts = townName.split(' ');
  if (parts.length === 2) {
    return parts;
  }

  // For longer single words, attempt natural break
  if (townName.length > 12) {
    const mid = Math.ceil(townName.length / 2);
    // Try to break at a logical point (find vowel near middle)
    let breakPoint = mid;
    for (let i = mid - 2; i <= mid + 2; i++) {
      if (i > 0 && i < townName.length && 'aeiou'.includes(townName[i].toLowerCase())) {
        breakPoint = i + 1;
        break;
      }
    }
    return [townName.substring(0, breakPoint), townName.substring(breakPoint)];
  }

  return [townName];
}

/**
 * Get label position anchoring configuration for Leaflet
 * Ensures label stays centered on the point while being readable
 */
export function getLabelAnchor() {
  return 'center'; // Always use center anchor for consistent positioning
}