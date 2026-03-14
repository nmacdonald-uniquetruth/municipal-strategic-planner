import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Layers, Map, ChevronDown, ChevronRight, Info, BarChart3 } from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import SectionHeader from '../components/machias/SectionHeader';
import TownInfoPanel from '../components/map/TownInfoPanel';
import ComparisonView from '../components/map/ComparisonView';
import { TOWN_PROFILES, TOWN_FILL_COLORS, ARCGIS_URL } from '../components/map/TownProfiles';

// ─── Basemap options ───────────────────────────────────────────────────────────
const BASEMAPS = {
  light: {
    label: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
  },
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
  },
};

// ─── Component to add town labels on map ─────────────────────────────────────
function TownLabels({ geojson }) {
  const map = useMap();
  const labelsRef = useRef(null);

  useEffect(() => {
    if (!geojson || !geojson.features || !map) return;

    // Clear existing labels
    if (labelsRef.current) {
      labelsRef.current.clearLayers();
    } else {
      labelsRef.current = window.L.featureGroup().addTo(map);
    }

    // Create label for each feature
    geojson.features.forEach(feature => {
      const town = feature?.properties?.TOWN;
      if (!town || !feature.geometry) return;

      // Calculate centroid
      let centroid = null;
      if (feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        let sumLat = 0, sumLng = 0;
        coords.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
        centroid = [sumLat / coords.length, sumLng / coords.length];
      }

      if (centroid) {
        // Create a permanent label using HTML with branding
        const label = window.L.divIcon({
          html: `<div style="
            font-family: 'Raleway', Arial, Helvetica, sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: #344A60;
            text-shadow: 
              0 0 4px rgba(255,255,255,0.9),
              0 0 6px rgba(255,255,255,0.8),
              -1.5px -1.5px 3px rgba(255,255,255,0.85),
              1.5px -1.5px 3px rgba(255,255,255,0.85),
              -1.5px 1.5px 3px rgba(255,255,255,0.85),
              1.5px 1.5px 3px rgba(255,255,255,0.85);
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
            letter-spacing: 0.3px;
          ">${town}</div>`,
          iconSize: null,
          iconAnchor: null,
          popupAnchor: null,
        });
        window.L.marker(centroid, { icon: label, interactive: false }).addTo(labelsRef.current);
      }
    });
  }, [geojson, map]);

  return null;
}

// ─── Component to fit bounds after GeoJSON loads ──────────────────────────────
function FitBounds({ geojson }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson || !geojson.features || !geojson.features.length) return;
    try {
      const L = window.L;
      if (!L) return;
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch (e) {
      // fallback: center on Machias Bay area
      map.setView([44.65, -67.45], 10);
    }
  }, [geojson, map]);
  return null;
}

// ─── Layer controls ───────────────────────────────────────────────────────────
function LayerControls({ layers, onToggle }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="absolute top-3 left-3 z-[1000] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden w-52">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-900 text-white text-xs font-bold">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" />
          <span>Layers</span>
        </div>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <div className="p-2 space-y-1">
          {layers.map(layer => (
            <label key={layer.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${layer.available ? '' : 'opacity-40'}`}>
              <input
                type="checkbox"
                checked={layer.visible}
                disabled={!layer.available}
                onChange={() => layer.available && onToggle(layer.id)}
                className="rounded"
              />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: layer.color }} />
                <span className="text-xs text-slate-700 truncate">{layer.label}</span>
              </div>
              {!layer.available && (
                <span className="text-[9px] text-slate-400 ml-auto flex-shrink-0">Future</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Basemap selector ─────────────────────────────────────────────────────────
function BasemapSelector({ current, onChange }) {
  return (
    <div className="absolute bottom-8 left-3 z-[1000] flex gap-1">
      {Object.entries(BASEMAPS).map(([key, bm]) => (
        <button key={key} onClick={() => onChange(key)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow transition-all ${
            current === key
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}>
          {bm.label}
        </button>
      ))}
    </div>
  );
}

// ─── Map legend ───────────────────────────────────────────────────────────────
function MapLegend({ basemap }) {
  return (
    <div className="absolute bottom-8 right-3 z-[1000] bg-white/90 backdrop-blur rounded-xl border border-slate-200 shadow px-3 py-2 max-w-xs">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Legend</p>
      <div className="space-y-1.5 text-[9px] text-slate-700">
        <p><strong>Town Names:</strong> Permanently displayed on map for accessibility</p>
        <div className="space-y-1 pt-1 border-t border-slate-200">
          <p className="font-bold text-slate-500 text-[8px] uppercase">Polygon opacity:</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm flex-shrink-0 border border-white/40" style={{ background: '#344A6073' }} />
            <span>Default view</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm flex-shrink-0 border border-white/40" style={{ background: '#344A60a6' }} />
            <span>Hover</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm flex-shrink-0 border border-white/40" style={{ background: '#344A60c0' }} />
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function RegionStats() {
  const totalPop = Object.values(TOWN_PROFILES).reduce((s, t) => s + (t.population || 0), 0);
  const avgIncome = Math.round(
    Object.values(TOWN_PROFILES).reduce((s, t) => s + (t.median_household_income || 0), 0) /
    Object.values(TOWN_PROFILES).length
  );
  const waterfrontTowns = Object.values(TOWN_PROFILES).filter(t => t.working_waterfront).length;
  const fishingTowns = Object.values(TOWN_PROFILES).filter(t => t.commercial_fishing_presence).length;

  return (
    <div className="flex gap-2 flex-wrap">
      {[
        { label: 'Region Population', value: totalPop.toLocaleString(), color: 'text-slate-900' },
        { label: 'Avg. Median HHI', value: '$' + avgIncome.toLocaleString(), color: 'text-emerald-700' },
        { label: 'Municipalities', value: 13, color: 'text-blue-700' },
        { label: 'Working Waterfronts', value: waterfrontTowns, color: 'text-teal-700' },
        { label: 'Fishing Communities', value: fishingTowns, color: 'text-amber-700' },
      ].map(s => (
        <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
          <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-slate-500 whitespace-nowrap">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RegionalMap() {
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTown, setSelectedTown] = useState(null);
  const [hoveredTown, setHoveredTown] = useState(null);
  const [basemap, setBasemap] = useState('light');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [layers, setLayers] = useState([
    { id: 'boundaries', label: 'Municipal Boundaries', color: '#1a3a5c', visible: true, available: true },
    { id: 'roads', label: 'Roads', color: '#7a5c1a', visible: false, available: false },
    { id: 'infrastructure', label: 'Infrastructure', color: '#2a5c7a', visible: false, available: false },
    { id: 'housing', label: 'Housing', color: '#8a4020', visible: false, available: false },
    { id: 'economic_sites', label: 'Economic Dev. Sites', color: '#2a7a4a', visible: false, available: false },
    { id: 'demographics', label: 'Demographic Layers', color: '#5c3d8a', visible: false, available: false },
    { id: 'conservation', label: 'Conservation Lands', color: '#3a5c3a', visible: false, available: false },
    { id: 'waterfronts', label: 'Working Waterfronts', color: '#1a6b5c', visible: false, available: false },
  ]);

  // Load GeoJSON from ArcGIS REST
  useEffect(() => {
    const CACHE_KEY = 'machias_region_geojson_v2';
    let cached = null;
    try { cached = sessionStorage.getItem(CACHE_KEY); } catch(e) {}
    if (cached) {
      setGeojson(JSON.parse(cached));
      setLoading(false);
      return;
    }
    fetch(ARCGIS_URL)
      .then(r => r.json())
      .then(data => {
        setGeojson(data);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch(e) {}
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load map data from Maine GeoLibrary. Check network access.');
        setLoading(false);
      });
  }, []);

  const toggleLayer = useCallback((id) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);

  const boundariesVisible = layers.find(l => l.id === 'boundaries')?.visible;

  // GeoJSON style function
  const styleFeature = useCallback((feature) => {
    const town = feature?.properties?.TOWN;
    const isHovered = town === hoveredTown;
    const isSelected = town === selectedTown?.town_name;
    const fillColor = TOWN_FILL_COLORS[town] || '#344A60';
    return {
      fillColor: fillColor,
      fillOpacity: isSelected ? 0.75 : isHovered ? 0.65 : 0.45,
      color: isSelected ? '#ffffff' : isHovered ? fillColor : '#ffffff',
      weight: isSelected ? 3 : isHovered ? 2.5 : 1.5,
    };
  }, [hoveredTown, selectedTown]);

  const onEachFeature = useCallback((feature, layer) => {
    const town = feature?.properties?.TOWN;
    layer.on({
      mouseover: () => setHoveredTown(town),
      mouseout: () => setHoveredTown(null),
      click: () => {
        const profile = TOWN_PROFILES[town];
        if (profile) setSelectedTown(profile);
      },
    });
    layer.bindTooltip(town || '', {
      permanent: false,
      direction: 'center',
      className: 'bg-white text-slate-900 text-xs font-bold border-slate-200 shadow rounded px-2 py-1',
    });
  }, []);

  return (
    <div className="flex flex-col space-y-4" style={{ height: 'calc(100vh - 96px)', minHeight: '650px' }}>
      {/* Header */}
      <div className="flex-shrink-0 space-y-3">
        <SectionHeader
          title="Machias Bay Region"
          subtitle="Interactive municipal map — Maine GeoLibrary boundary data · Sunrise County community profiles"
          icon={MapPin}
        />
        <RegionStats />
      </div>

      {/* Map + panel */}
      <div className="flex gap-3 min-h-0" style={{ flex: 1 }}>
        {/* Map */}
        <div className="flex-1 min-w-0 rounded-xl border border-slate-200 overflow-hidden relative" style={{ minHeight: '500px' }}>
          {loading && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/80 rounded-xl">
              <div className="text-center space-y-2">
                <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading Maine GeoLibrary boundary data…</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white rounded-xl">
              <div className="text-center p-6 max-w-sm">
                <p className="text-sm font-bold text-slate-700 mb-2">Map data unavailable</p>
                <p className="text-xs text-slate-500">{error}</p>
                <p className="text-xs text-slate-400 mt-2">Town profiles are still accessible from the list below.</p>
              </div>
            </div>
          )}

          {!error && (
            <MapContainer
              center={[44.65, -67.45]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                key={basemap}
                url={BASEMAPS[basemap].url}
                attribution={BASEMAPS[basemap].attribution}
              />
              {geojson && boundariesVisible && (
                <GeoJSON
                  key={`${hoveredTown}-${selectedTown?.town_name}-${basemap}`}
                  data={geojson}
                  style={styleFeature}
                  onEachFeature={onEachFeature}
                />
              )}
              {geojson && <TownLabels geojson={geojson} />}
              {geojson && <FitBounds geojson={geojson} />}
            </MapContainer>
          )}

          {/* Overlay controls */}
          <LayerControls layers={layers} onToggle={toggleLayer} />
          <BasemapSelector current={basemap} onChange={setBasemap} />
          {!loading && !error && geojson && <MapLegend basemap={basemap} />}
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
          {selectedTown ? (
            <TownInfoPanel
              profile={selectedTown}
              color={TOWN_FILL_COLORS[selectedTown.town_name]}
              onClose={() => setSelectedTown(null)}
            />
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-xs font-medium text-slate-500">Click any municipality</p>
                <p className="text-[10px] text-slate-400 mt-1">to view community profile, demographics, employers, and planning data</p>
              </div>
              {/* Town list */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-900 px-4 py-2.5">
                  <p className="text-xs font-bold text-white">Municipalities</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {Object.values(TOWN_PROFILES).sort((a, b) => b.population - a.population).map(profile => (
                    <button key={profile.town_name}
                      onClick={() => setSelectedTown(profile)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-sm flex-shrink-0 border border-white/20"
                          style={{ background: TOWN_FILL_COLORS[profile.town_name] }} />
                        <div>
                          <p className="text-xs font-medium text-slate-800">{profile.town_name}</p>
                          <p className="text-[10px] text-slate-400">Pop. {profile.population?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {profile.working_waterfront && (
                          <span className="text-[8px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-bold">WW</span>
                        )}
                        {profile.commercial_fishing_presence && (
                          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Fish</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p><strong className="text-slate-700">Data Sources:</strong> Maine GeoLibrary ArcGIS REST service (boundaries), 2020 US Census / ACS 5-Year Estimates (demographics), Sunrise County Economic Council (community profiles)</p>
                    <p className="text-[9px]">WW = Working Waterfront · Fish = Commercial Fishing</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}