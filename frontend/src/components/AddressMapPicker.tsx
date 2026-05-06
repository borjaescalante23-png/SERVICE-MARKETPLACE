import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation, AlertCircle, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AddressData {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  floor: string;
  door: string;
  buildingType: 'piso' | 'casa' | 'local';
  lat: number;
  lon: number;
  formatted: string;
}

interface Props {
  onConfirm: (address: AddressData) => void;
  initialAddress?: string;
  className?: string;
}

// ── Nominatim search (Provincia de Barcelona) ─────────────────────────────────
// Nominatim returns much more precise street-level results than Photon for Spain.
// viewbox = Barcelona province bounds, bounded=1 restricts results to this area.

interface NomResult {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}

let _searchCtrl: AbortController | null = null;

async function searchNominatim(query: string): Promise<NomResult[]> {
  _searchCtrl?.abort();
  _searchCtrl = new AbortController();
  try {
    // viewbox: lon_min,lat_max,lon_max,lat_min  (Barcelona province)
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '6',
      countrycodes: 'es',
      'accept-language': 'es',
      viewbox: '1.3,42.4,2.85,41.0',
      bounded: '1',
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { signal: _searchCtrl.signal, headers: { 'Accept-Language': 'es' } },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function reverseNominatim(lat: number, lon: number): Promise<NomResult['address'] | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat), lon: String(lon),
      format: 'json', addressdetails: '1',
      'accept-language': 'es',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.address ?? null;
  } catch {
    return null;
  }
}

// ── CSS injection ─────────────────────────────────────────────────────────────

let _stylesOk = false;
function injectStyles() {
  if (_stylesOk || typeof document === 'undefined') return;
  _stylesOk = true;

  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  const s = document.createElement('style');
  s.textContent = `
    /* ── Velora pin marker ── */
    .velora-pin {
      width: 32px; height: 44px;
      position: relative;
      filter: drop-shadow(0 4px 10px rgba(10,22,40,0.35));
      cursor: grab;
    }
    .velora-pin:active { cursor: grabbing; }
    .velora-pin-head {
      width: 32px; height: 32px; border-radius: 50%;
      background: #fff;
      border: 3px solid #0A1628;
      display: flex; align-items: center; justify-content: center;
      position: relative; z-index: 1;
    }
    .velora-pin-dot {
      width: 12px; height: 12px; border-radius: 50%;
      background: #2563EB;
    }
    .velora-pin-tail {
      position: absolute; bottom: 0; left: 50%;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 14px solid #0A1628;
      margin-top: -3px;
    }
    /* ── Map chrome ── */
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(255,255,255,.75) !important;
      backdrop-filter: blur(4px);
      border-radius: 6px 0 0 0 !important;
      padding: 2px 6px !important;
    }
    .leaflet-container { cursor: crosshair !important; font-family: inherit; }
    .leaflet-control-attribution a { color: #6B7280 !important; }
  `;
  document.head.appendChild(s);
}

const MARKER_HTML = `
  <div class="velora-pin">
    <div class="velora-pin-head"><div class="velora-pin-dot"></div></div>
    <div class="velora-pin-tail"></div>
  </div>`;

// ── Barcelona province bounds ─────────────────────────────────────────────────

const BCN_CENTER: [number, number] = [41.3874, 2.1686];
const BCN_BOUNDS: [[number, number], [number, number]] = [[41.0, 1.3], [42.4, 2.85]];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddressMapPicker({ onConfirm, initialAddress, className }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const debRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialAddress || '');
  const [suggestions, setSuggestions] = useState<NomResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [floor, setFloor] = useState('');
  const [door, setDoor] = useState('');
  const [buildingType, setBuildingType] = useState<'piso' | 'casa' | 'local'>('casa');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const canConfirm = !!(street.trim() && number.trim() && city.trim() && coords);

  // ── Map init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    injectStyles();
    if (!mapDivRef.current || mapRef.current) return;

    let cancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapDivRef.current || mapRef.current) return;

      const map = L.map(mapDivRef.current, {
        center: BCN_CENTER,
        zoom: 12,
        zoomControl: false,
        attributionControl: true,
        maxBounds: BCN_BOUNDS,
        maxBoundsViscosity: 0.85,
        minZoom: 9,
      });

      // CartoDB Positron — clean, premium, light tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        },
      ).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: MARKER_HTML,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
      });

      const marker = L.marker(BCN_CENTER, { icon, draggable: true }).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);

      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLatLng();
        map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.4 });
        const addr = await reverseNominatim(lat, lng);
        if (addr) applyAddress(addr, lat, lng);
      });

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.4 });
        const addr = await reverseNominatim(lat, lng);
        if (addr) applyAddress(addr, lat, lng);
      });
    });

    return () => {
      cancelled = true;
      _searchCtrl?.abort();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function applyAddress(a: NomResult['address'], lat: number, lon: number) {
    setStreet(a?.road || '');
    setNumber(a?.house_number || '');
    setPostalCode(a?.postcode || '');
    setCity(a?.city || a?.town || a?.village || a?.municipality || '');
    setCoords({ lat, lon });
    setQuery([a?.road, a?.house_number].filter(Boolean).join(', ') || '');
    setSuggestions([]);
  }

  function panTo(lat: number, lon: number, zoom = 16) {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lon]);
    mapRef.current.flyTo([lat, lon], zoom, { duration: 0.7 });
  }

  // ── Search ────────────────────────────────────────────────────────────────────

  function onQueryChange(val: string) {
    setQuery(val);
    setNoResults(false);
    if (!val.trim()) { setSuggestions([]); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      if (val.trim().length < 3) return;
      setSearching(true);
      const results = await searchNominatim(val);
      setSuggestions(results);
      setNoResults(results.length === 0);
      setSearching(false);
    }, 400);
  }

  function pickSuggestion(r: NomResult) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    const a = r.address;
    setStreet(a.road || '');
    setNumber(a.house_number || '');
    setPostalCode(a.postcode || '');
    setCity(a.city || a.town || a.village || a.municipality || '');
    setCoords({ lat, lon });
    setSuggestions([]);
    setNoResults(false);
    setQuery([a.road, a.house_number].filter(Boolean).join(', ') || r.display_name.split(',')[0]);
    panTo(lat, lon, 17);
  }

  function formatSuggestion(r: NomResult): { main: string; sub: string } {
    const a = r.address;
    const main = [a.road, a.house_number].filter(Boolean).join(', ')
      || a.suburb || a.neighbourhood
      || r.display_name.split(',')[0];
    const sub = [a.postcode, a.city || a.town || a.village || a.municipality]
      .filter(Boolean).join(' · ');
    return { main, sub };
  }

  // ── GPS ───────────────────────────────────────────────────────────────────────

  async function handleGPS() {
    if (!navigator.geolocation) { toast.error('Tu navegador no soporta geolocalización'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        panTo(lat, lon, 17);
        const addr = await reverseNominatim(lat, lon);
        if (addr) applyAddress(addr, lat, lon);
        setLocating(false);
      },
      () => { toast.error('Activa los permisos de ubicación en tu navegador'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────────

  function handleConfirm() {
    if (!canConfirm || !coords) return;
    const extra =
      buildingType === 'piso' && floor
        ? `Piso ${floor}${door ? ` · ${door}` : ''}`
        : buildingType === 'local' ? 'Local' : '';
    const formatted = [`${street} ${number}`.trim(), postalCode, city, extra]
      .filter(Boolean).join(', ');
    onConfirm({ street, number, postalCode, city, floor, door, buildingType, lat: coords.lat, lon: coords.lon, formatted });
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-3 ${className || ''}`}>

      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 transition-all">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Busca tu calle en Barcelona..."
            autoComplete="off"
            className="flex-1 bg-transparent text-sm text-[#0A1628] dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 min-w-0"
          />
          {searching && <Loader2 size={14} className="animate-spin text-[#2563EB] flex-shrink-0" />}
          {query && !searching && (
            <button type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setNoResults(false); inputRef.current?.focus(); }}
              className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors flex-shrink-0 p-0.5"
            >
              <X size={13} />
            </button>
          )}
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
          <button type="button" onClick={handleGPS} disabled={locating}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0A1628] dark:text-[#F8FAFF] hover:text-[#2563EB] dark:hover:text-[#3B82F6] disabled:opacity-40 transition-colors flex-shrink-0 pl-1 min-h-[44px]"
          >
            <Navigation size={13} className={locating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Mi ubicación</span>
          </button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-[#0F1A2E] rounded-xl shadow-2xl border border-gray-100 dark:border-[#1E2D45] overflow-hidden z-[1000]">
            {suggestions.map((r, i) => {
              const { main, sub } = formatSuggestion(r);
              return (
                <button key={`${r.lat}-${r.lon}-${i}`} type="button" onClick={() => pickSuggestion(r)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#F8FAFF] dark:hover:bg-[#1E2D45] transition-colors min-h-[44px] ${
                    i < suggestions.length - 1 ? 'border-b border-gray-50 dark:border-[#1E2D45]' : ''
                  }`}
                >
                  <MapPin size={14} className="text-[#2563EB] dark:text-[#3B82F6] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF] truncate">{main}</p>
                    {sub && <p className="text-xs text-gray-400 dark:text-[#94A3B8] mt-0.5 truncate">{sub}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {noResults && !searching && query.trim().length >= 3 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-[#0F1A2E] rounded-xl shadow-lg border border-gray-100 dark:border-[#1E2D45] px-4 py-3 flex items-center gap-2 z-[1000]">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
              No encontramos esa dirección. Intenta con el nombre de la calle sin número.
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative h-[240px] sm:h-[280px] rounded-2xl overflow-hidden border border-gray-200 dark:border-[#1E2D45]">
        <div ref={mapDivRef} className="absolute inset-0 z-[1]" />

        {!mapReady && (
          <div className="absolute inset-0 z-[2] bg-[#F0F4FF] dark:bg-[#080F1E] flex flex-col items-center justify-center gap-2">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-[#1E2D45] animate-pulse" />
              <MapPin size={24} className="absolute inset-0 m-auto text-gray-400 dark:text-[#94A3B8]" />
            </div>
            <p className="text-sm text-gray-400 dark:text-[#94A3B8]">Cargando mapa...</p>
          </div>
        )}

        {/* Zoom controls */}
        {mapReady && (
          <div className="absolute bottom-8 right-3 z-[1000] flex flex-col gap-1">
            <button type="button" onClick={() => mapRef.current?.zoomIn()}
              className="w-9 h-9 bg-white dark:bg-[#0F1A2E] rounded-xl shadow-md border border-gray-200 dark:border-[#1E2D45] flex items-center justify-center text-[#0A1628] dark:text-[#F8FAFF] hover:bg-[#F8FAFF] dark:hover:bg-[#1E2D45] transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => mapRef.current?.zoomOut()}
              className="w-9 h-9 bg-white dark:bg-[#0F1A2E] rounded-xl shadow-md border border-gray-200 dark:border-[#1E2D45] flex items-center justify-center text-[#0A1628] dark:text-[#F8FAFF] hover:bg-[#F8FAFF] dark:hover:bg-[#1E2D45] transition-colors"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Hint */}
        {mapReady && !coords && (
          <div className="absolute bottom-2 left-3 right-16 z-[1000] pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A1628]/60 backdrop-blur-sm">
              <MapPin size={10} className="text-white/80 flex-shrink-0" />
              <span className="text-white text-[10px] font-medium leading-none">
                Busca o toca el mapa para fijar la ubicación
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Address fields */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">Calle</label>
          <input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="Nombre de la calle"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2D45] bg-white dark:bg-[#080F1E] text-sm text-[#0A1628] dark:text-[#F8FAFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 focus:border-[#2563EB] transition-all placeholder-gray-300 dark:placeholder-[#94A3B8]/40"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">Número</label>
          <input type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="Nº"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2D45] bg-white dark:bg-[#080F1E] text-sm text-[#0A1628] dark:text-[#F8FAFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 focus:border-[#2563EB] transition-all placeholder-gray-300 dark:placeholder-[#94A3B8]/40"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">Código postal</label>
          <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="08001"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2D45] bg-white dark:bg-[#080F1E] text-sm text-[#0A1628] dark:text-[#F8FAFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 focus:border-[#2563EB] transition-all placeholder-gray-300 dark:placeholder-[#94A3B8]/40"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">Ciudad</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Barcelona"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2D45] bg-white dark:bg-[#080F1E] text-sm text-[#0A1628] dark:text-[#F8FAFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 focus:border-[#2563EB] transition-all placeholder-gray-300 dark:placeholder-[#94A3B8]/40"
          />
        </div>
      </div>

      {/* Building type */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wide mb-2">Tipo de inmueble</p>
        <div className="flex gap-2">
          {(['piso', 'casa', 'local'] as const).map(type => (
            <button key={type} type="button" onClick={() => setBuildingType(type)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all min-h-[44px] ${
                buildingType === type
                  ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-900/20 text-[#2563EB] dark:text-[#3B82F6]'
                  : 'border-gray-200 dark:border-[#1E2D45] text-gray-500 dark:text-[#94A3B8] hover:border-gray-300 dark:hover:border-[#2D3F5A] bg-white dark:bg-[#080F1E]'
              }`}
            >
              {type === 'piso' ? 'Piso' : type === 'casa' ? 'Casa' : 'Local'}
            </button>
          ))}
        </div>
      </div>

      {/* Floor + door */}
      {buildingType === 'piso' && (
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">Piso / Planta</label>
            <input type="text" value={floor} onChange={e => setFloor(e.target.value)} placeholder="1º, 2º..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2D45] bg-white dark:bg-[#080F1E] text-sm text-[#0A1628] dark:text-[#F8FAFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 focus:border-[#2563EB] transition-all placeholder-gray-300 dark:placeholder-[#94A3B8]/40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">Puerta</label>
            <input type="text" value={door} onChange={e => setDoor(e.target.value)} placeholder="A, B, 1..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2D45] bg-white dark:bg-[#080F1E] text-sm text-[#0A1628] dark:text-[#F8FAFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 focus:border-[#2563EB] transition-all placeholder-gray-300 dark:placeholder-[#94A3B8]/40"
            />
          </div>
        </div>
      )}

      {/* Confirm */}
      <button type="button" onClick={handleConfirm} disabled={!canConfirm}
        className="w-full py-3 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
        style={{ background: '#0A1628' }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#2563EB'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#0A1628'; }}
      >
        Confirmar dirección
      </button>
    </div>
  );
}
