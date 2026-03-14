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

  const precision = 0.0001; // ~10 meters precision at regional scale
  const minX = Math.min(...ring.map(c => c[0]));
  const minY = Math.min(...ring.map(c => c[1]));
  const maxX = Math.max(...ring.map(c => c[0]));
  const maxY = Math.max(...ring.map(c => c[1]));

  const cellSize = Math.min(maxX - minX, maxY - minY) / 4;
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

  // Refinement pass: check neighborhood for improvement
  let refined = [...bestCell];
  for (let i = 0; i < 4; i++) {
    const searchRadius = (cellSize / 2) / Math.pow(2, i + 1);
    let improved = false;

    for (let dy = -searchRadius; dy <= searchRadius; dy += searchRadius) {
      for (let dx = -searchRadius; dx <= searchRadius; dx += searchRadius) {
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
 * Estimate label font size based on polygon area
 * Larger polygons get larger labels
 */
export function estimateFontSize(ring) {
  if (!ring || ring.length < 3) return 11;

  // Calculate approximate polygon area
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  area = Math.abs(area) / 2;

  // Map area to font size (11-14px range)
  if (area < 0.0005) return 10; // Tiny municipalities
  if (area < 0.001) return 11;
  if (area < 0.002) return 12;
  return 13; // Larger towns
}

/**
 * Check if point is near polygon boundary (too close for clean label placement)
 */
export function isTooCloseToBoundary(point, ring, minDistance = 0.0008) {
  return pointToPolygonDistance(point, ring) < minDistance;
}

/**
 * Get label position anchoring configuration for Leaflet
 * Ensures label stays centered on the point while being readable
 */
export function getLabelAnchor(zoomLevel = 10) {
  // At high zoom, use center anchor; at low zoom, use middle for better spacing
  return zoomLevel > 11 ? [0.5, 0.5] : [0.5, 0.5];
}