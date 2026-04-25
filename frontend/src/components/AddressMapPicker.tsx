import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin, Search, X, Loader, Navigation, Home, Building2,
  CheckCircle2, ChevronRight, Layers, Maximize2, Minimize2, Globe, AlertCircle,
} from 'lucide-react';

export interface AddressResult {
  lat: number;
  lng: number;
  formatted: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface Props {
  onConfirm: (address: AddressResult & { housingType: 'casa' | 'piso'; floor: string; door: string }) => void;
  initialAddress?: string;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string; house_number?: string; city?: string; town?: string;
    village?: string; postcode?: string; country?: string; state?: string;
    suburb?: string; neighbourhood?: string; municipality?: string;
  };
}

type MapMode = '2d' | 'satellite';

let stylesInjected = false;
function injectMapStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'velora-map-styles';
  style.textContent = `
    /* ── Classic teardrop pin ── */
    .vpin2 {
      position: relative;
      width: 30px;
      height: 38px;
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 4px 8px rgba(37,99,235,.45));
    }
    .vpin2 svg {
      animation: vpin2Drop .42s cubic-bezier(.34,1.56,.64,1) both;
    }
    .vpin2-shadow {
      width: 10px;
      height: 4px;
      background: rgba(0,0,0,.18);
      border-radius: 50%;
      margin-top: -1px;
      filter: blur(2.5px);
      animation: vpin2Shadow .42s ease both;
    }
    .vpin2-pulse {
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(37,99,235,.3);
      animation: vpin2Pulse 2s ease-out 1.2s infinite;
    }
    @keyframes vpin2Drop {
      0%   { transform: translateY(-22px) scale(.55); opacity: 0; }
      60%  { transform: translateY(4px) scale(1.07); opacity: 1; }
      80%  { transform: translateY(-2px) scale(.97); }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes vpin2Shadow {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    @keyframes vpin2Pulse {
      0%   { transform: translateX(-50%) scale(1); opacity: .6; }
      100% { transform: translateX(-50%) scale(4); opacity: 0; }
    }
    /* ── Leaflet controls ── */
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 12px rgba(0,0,0,.12) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
    .leaflet-control-zoom a {
      background: rgba(255,255,255,.95) !important;
      border: none !important;
      color: #374151 !important;
      font-weight: 700;
      width: 32px !important;
      height: 32px !important;
      line-height: 32px !important;
      transition: background .15s;
    }
    .leaflet-control-zoom a:hover { background: #eff6ff !important; color: #2563eb !important; }
    .leaflet-control-attribution { font-size: 9px !important; background: rgba(255,255,255,.7) !important; padding: 1px 4px !important; }
  `;
  document.head.appendChild(style);
}

// Classic teardrop pin HTML (Material Design map pin path, 24x24 viewBox)
const PIN_HTML = `
<div class="vpin2">
  <svg width="30" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="#2563eb" stroke="white" stroke-width="0.8"/>
    <circle cx="12" cy="9" r="3" fill="white"/>
    <circle cx="12" cy="9" r="1.5" fill="#2563eb"/>
  </svg>
  <div class="vpin2-shadow"></div>
  <div class="vpin2-pulse"></div>
</div>`;

const PIN_SIZE: [number, number] = [30, 36];
const PIN_ANCHOR: [number, number] = [15, 33];

// ── Barcelona geographic constants ──────────────────────────────────────────
const BCN_CENTER = { lat: 41.3851, lng: 2.1734 };
const BCN_BOUNDS = { minLat: 41.25, maxLat: 41.55, minLng: 1.90, maxLng: 2.35 };
const BCN_VIEWBOX_D = 0.22;
function isInsideBarcelona(lat: number, lng: number): boolean {
  return lat >= BCN_BOUNDS.minLat && lat <= BCN_BOUNDS.maxLat &&
    lng >= BCN_BOUNDS.minLng && lng <= BCN_BOUNDS.maxLng;
}
function isBarcelonaPostalCode(cp: string): boolean {
  const n = parseInt(cp, 10);
  return !isNaN(n) && n >= 8001 && n <= 8980;
}

// ── Search engine internals ──────────────────────────────────────────────────

// Module-level: single controller ensures only one Nominatim request at a time.
// When user types a new character, the previous request is aborted immediately.
let _searchCtrl: AbortController | null = null;
// Minimum ms between Nominatim calls — respect their 1 req/s policy
let _lastReqTs = 0;
const MIN_REQ_GAP = 380;

const LANG_HEADER = 'ca,es;q=0.9,en;q=0.8';

// Multilingual street-type synonym table
const STREET_SYNONYMS: Array<[RegExp, string]> = [
  [/^carrer\b/i,     'Calle'],
  [/^avinguda\b/i,   'Avenida'],
  [/^passeig\b/i,    'Paseo'],
  [/^plaça\b/i,      'Plaza'],
  [/^travessera\b/i, 'Travesía'],
  [/^camí\b/i,       'Camino'],
  [/^calle\b/i,      'Carrer'],
  [/^avenida\b/i,    'Avinguda'],
  [/^paseo\b/i,      'Passeig'],
  [/^plaza\b/i,      'Plaça'],
  [/^camino\b/i,     'Camí'],
  [/^gran vía\b/i,   'Gran Via'],
  [/^gran via\b/i,   'Gran Vía'],
  [/^c\.\s*/i,       'Carrer '],
  [/^c\/\s*/i,       'Carrer '],
  [/^av\.\s*/i,      'Avinguda '],
  [/^pg\.\s*/i,      'Passeig '],
];

/** Removes consecutive duplicate chars to correct typos: "balmss" → "balms" */
function dedupChars(s: string): string {
  return s.replace(/([a-záéíóúàèìòùüïç])\1+/gi, '$1');
}

/** Appends ", Barcelona" if not already present */
function withBcn(q: string): string {
  return /barcelona/i.test(q) ? q : `${q}, Barcelona`;
}

/** Returns the synonym expansion for the street-type prefix, or null */
function synonymExpansion(q: string): string | null {
  for (const [re, replacement] of STREET_SYNONYMS) {
    if (re.test(q)) {
      const rest = q.replace(re, '').trim();
      return withBcn(`${replacement} ${rest}`.trim());
    }
  }
  return null;
}

/** Nominatim free-text search URL — bounded=0 so viewbox is a hint, not a wall */
function urlQ(q: string): string {
  const vb = `${BCN_CENTER.lng - BCN_VIEWBOX_D},${BCN_CENTER.lat + BCN_VIEWBOX_D},${BCN_CENTER.lng + BCN_VIEWBOX_D},${BCN_CENTER.lat - BCN_VIEWBOX_D}`;
  return (
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(q)}&format=json&addressdetails=1` +
    `&limit=8&countrycodes=es&viewbox=${vb}&bounded=0`
  );
}

/** Nominatim structured search — better for short / bare street names */
function urlStructured(street: string): string {
  return (
    `https://nominatim.openstreetmap.org/search` +
    `?street=${encodeURIComponent(street)}&city=Barcelona` +
    `&country=Spain&format=json&addressdetails=1&limit=8`
  );
}

/**
 * Sends a single Nominatim request.
 * – Respects the rate-limit gap (waits if called too soon after the previous one).
 * – Returns [] cleanly on abort or network error (never throws).
 */
async function nominatimFetch(url: string, signal: AbortSignal): Promise<NominatimResult[]> {
  const gap = MIN_REQ_GAP - (Date.now() - _lastReqTs);
  if (gap > 0) {
    await new Promise<void>(r => setTimeout(r, gap));
  }
  if (signal.aborted) return [];
  _lastReqTs = Date.now();
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': LANG_HEADER }, signal });
    if (!res.ok || signal.aborted) return [];
    return res.json();
  } catch (e: any) {
    // AbortError is expected (user typed next char) — not a real error
    return [];
  }
}

/** Client-side relevance score — higher = better match to original user query */
function relevanceScore(item: NominatimResult, rawQ: string): number {
  const q = rawQ.toLowerCase().replace(/,.*$/, '').trim();
  const road = (item.address.road || '').toLowerCase();
  const display = item.display_name.toLowerCase();
  let score = 0;

  // Exact / prefix match
  if (road === q)                score += 100;
  else if (road.startsWith(q))  score += 80;
  else if (road.includes(q))    score += 55;
  else if (display.includes(q)) score += 30;

  // Word-level match (handles "balmes 12" → road contains "balmes")
  const qWords = q.split(/\s+/).filter(w => w.length > 2);
  for (const w of qWords) {
    if (road.includes(w)) score += 15;
    else if (display.includes(w)) score += 7;
    // Prefix of any road word: "balm" matches "balmes"
    for (const rw of road.split(/\s+/)) {
      if (rw.startsWith(w) && w.length >= 3) { score += 12; break; }
    }
  }

  // Exact house number
  const num = q.match(/\d+/)?.[0];
  if (num && item.address.house_number === num) score += 20;

  // Prefer results tagged as being in Barcelona
  if (display.includes('barcelona')) score += 5;

  return score;
}

export default function AddressMapPicker({ onConfirm, initialAddress }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);
  const satLayerRef = useRef<any>(null);
  const satLabelsRef = useRef<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const [query, setQuery] = useState(initialAddress || '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [selected, setSelected] = useState<AddressResult | null>(null);
  const [housingType, setHousingType] = useState<'casa' | 'piso'>('casa');
  const [floor, setFloor] = useState('');
  const [door, setDoor] = useState('');
  const [mapMode, setMapMode] = useState<MapMode>('2d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [outsideBcn, setOutsideBcn] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Silently get user location on mount for search geo-bias
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          userLocationRef.current = { lat: coords.latitude, lng: coords.longitude };
        },
        () => { /* silent fail */ },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
      );
    }
  }, []);

  // Map init
  useEffect(() => {
    injectMapStyles();
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then(L => {
      const icon = L.divIcon({
        className: '',
        html: PIN_HTML,
        iconSize: PIN_SIZE,
        iconAnchor: PIN_ANCHOR,
      });

      streetLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { attribution: '© <a href="https://carto.com">CARTO</a>', subdomains: 'abcd', maxZoom: 20 },
      );

      satLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© <a href="https://www.esri.com">Esri</a>', maxZoom: 19 },
      );

      satLabelsRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.85 },
      );

      // Start centered on Barcelona; fly to user if within Barcelona area
      const userLoc = userLocationRef.current;
      const useUserLoc = userLoc && isInsideBarcelona(userLoc.lat, userLoc.lng);
      const startLat = useUserLoc ? userLoc!.lat : BCN_CENTER.lat;
      const startLng = useUserLoc ? userLoc!.lng : BCN_CENTER.lng;
      const startZoom = useUserLoc ? 15 : 13;

      const map = L.map(mapRef.current!, {
        center: [startLat, startLng],
        zoom: startZoom,
        zoomControl: false,
        attributionControl: true,
      });

      streetLayerRef.current.addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;
      mapInstanceRef.current = map;

      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        await reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', async (e: any) => {
        marker.setLatLng(e.latlng);
        await reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    });

    return () => {
      _searchCtrl?.abort();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Force map resize on fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 80);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Mode switching
  function switchMode(mode: MapMode) {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (mode === 'satellite') {
      if (streetLayerRef.current) map.removeLayer(streetLayerRef.current);
      if (satLayerRef.current) satLayerRef.current.addTo(map);
      if (satLabelsRef.current) satLabelsRef.current.addTo(map);
    } else {
      if (satLayerRef.current) map.removeLayer(satLayerRef.current);
      if (satLabelsRef.current) map.removeLayer(satLabelsRef.current);
      if (streetLayerRef.current) streetLayerRef.current.addTo(map);
    }
    setMapMode(mode);
  }

  // Reverse geocode with coordinate fallback
  async function reverseGeocode(lat: number, lng: number) {
    if (!isInsideBarcelona(lat, lng)) {
      setOutsideBcn(true);
      setSelected(null);
      return;
    }
    setOutsideBcn(false);
    setReversing(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
        { headers: { 'Accept-Language': LANG_HEADER } },
      );
      const data = await res.json();
      if (data?.address) {
        const result = toResult(lat, lng, data.display_name, data.address);
        setSelected(result);
        setQuery(shortAddr(result));
        setSuggestions([]);
        userLocationRef.current = { lat, lng };
      } else {
        throw new Error('no address');
      }
    } catch {
      const fallback: AddressResult = {
        lat, lng,
        formatted: `Lat ${lat.toFixed(5)}, Lon ${lng.toFixed(5)}, Barcelona`,
        street: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        city: 'Barcelona',
        postalCode: '',
        country: 'España',
      };
      setSelected(fallback);
      setQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setSuggestions([]);
    } finally {
      setReversing(false);
    }
  }

  function toResult(lat: number, lng: number, displayName: string, addr: NominatimResult['address']): AddressResult {
    return {
      lat, lng,
      formatted: displayName,
      street: [addr.road, addr.house_number].filter(Boolean).join(' ') || '',
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      postalCode: addr.postcode || '',
      country: addr.country || '',
    };
  }

  function shortAddr(r: AddressResult): string {
    if (r.street && r.city) return `${r.street}, ${r.city}`;
    if (r.city) return r.city;
    return r.formatted.split(',').slice(0, 3).join(',').trim();
  }

  const doSearch = useCallback(async (rawQuery: string) => {
    const q = rawQuery.trim();
    if (q.length < 2) { setSuggestions([]); setNoResults(false); return; }

    // ── Abort any in-flight request immediately ──────────────────────────────
    _searchCtrl?.abort();
    _searchCtrl = new AbortController();
    const { signal } = _searchCtrl;

    setSearching(true);
    setNoResults(false);

    const seen = new Set<number>();
    const pool: NominatimResult[] = [];

    function absorb(items: NominatimResult[]) {
      for (const item of items) {
        if (!seen.has(item.place_id)) { seen.add(item.place_id); pool.push(item); }
      }
    }

    try {
      // ── Strategy 1: free-text with Barcelona bias (bounded=0 = hint only) ──
      absorb(await nominatimFetch(urlQ(withBcn(q)), signal));
      if (signal.aborted) return;

      // ── Strategy 2: multilingual synonym (Carrer↔Calle, etc.) ────────────
      if (pool.length === 0) {
        const syn = synonymExpansion(q);
        if (syn) {
          absorb(await nominatimFetch(urlQ(syn), signal));
          if (signal.aborted) return;
        }
      }

      // ── Strategy 3: structured search (best for bare street names) ────────
      if (pool.length === 0) {
        const bare = q.replace(/,\s*barcelona\s*$/i, '').replace(/^\w+\s+/, '').trim() || q;
        absorb(await nominatimFetch(urlStructured(bare), signal));
        if (signal.aborted) return;
      }

      // ── Strategy 4: typo correction — deduplicate consecutive chars ────────
      if (pool.length === 0) {
        const fixed = dedupChars(q.replace(/,\s*barcelona\s*$/i, '').trim());
        if (fixed !== q.replace(/,\s*barcelona\s*$/i, '').trim()) {
          absorb(await nominatimFetch(urlQ(withBcn(fixed)), signal));
          if (signal.aborted) return;
        }
      }

      // ── Strategy 5: progressive truncation (strip last token, retry) ──────
      if (pool.length === 0) {
        const tokens = q.replace(/,\s*barcelona\s*$/i, '').trim().split(/\s+/);
        if (tokens.length > 1) {
          const shorter = withBcn(tokens.slice(0, -1).join(' '));
          absorb(await nominatimFetch(urlQ(shorter), signal));
          if (signal.aborted) return;
        }
      }

      // ── Filter: prefer results inside Barcelona, keep outside as last resort
      const inBcn = pool.filter(i => isInsideBarcelona(parseFloat(i.lat), parseFloat(i.lon)));
      const candidates = inBcn.length > 0 ? inBcn : pool.slice(0, 4);

      // ── Score and sort ─────────────────────────────────────────────────────
      const uLoc = userLocationRef.current;
      const ranked = candidates
        .map(item => ({
          item,
          rel: relevanceScore(item, q),
          dist: uLoc
            ? Math.hypot(parseFloat(item.lat) - uLoc.lat, parseFloat(item.lon) - uLoc.lng)
            : 999,
        }))
        .sort((a, b) => Math.abs(b.rel - a.rel) > 8 ? b.rel - a.rel : a.dist - b.dist)
        .map(x => x.item)
        .slice(0, 6);

      setSuggestions(ranked);
      setNoResults(ranked.length === 0 && q.length >= 3);
    } catch {
      // Any unhandled error: clear gracefully, never leave searching=true
      setSuggestions([]);
    } finally {
      if (!signal.aborted) setSearching(false);
    }
  }, []);

  // Never clear what the user has typed — only update query on explicit selection
  function onQueryChange(val: string) {
    setQuery(val);
    setNoResults(false);
    if (!val.trim()) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 320);
  }

  async function pickSuggestion(s: NominatimResult) {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    if (!isInsideBarcelona(lat, lng)) {
      setOutsideBcn(true);
      setSuggestions([]);
      return;
    }
    setOutsideBcn(false);
    setNoResults(false);
    const result = toResult(lat, lng, s.display_name, s.address);
    setSelected(result);
    setQuery(shortAddr(result));
    setSuggestions([]);
    userLocationRef.current = { lat, lng };
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.1, easeLinearity: 0.25 });
    }
  }

  function geolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        if (!isInsideBarcelona(lat, lng)) {
          setOutsideBcn(true);
          setLocating(false);
          return;
        }
        setOutsideBcn(false);
        userLocationRef.current = { lat, lng };
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current?.flyTo([lat, lng], 17, { duration: 1.2, easeLinearity: 0.25 });
        await reverseGeocode(lat, lng);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function confirm() {
    if (!selected) return;
    if (housingType === 'piso' && !floor.trim()) return;
    onConfirm({ ...selected, housingType, floor, door });
  }

  const canConfirm = selected && (housingType === 'casa' || floor.trim().length > 0);
  const mapHeight = isFullscreen ? '100%' : '340px';

  const wrapperClass = isFullscreen
    ? 'fixed inset-0 z-[2000] flex flex-col bg-white dark:bg-gray-950 overflow-hidden'
    : 'rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg';

  return (
    <div className={wrapperClass}>

      {/* ── MAP ── */}
      <div
        className="relative flex-1"
        style={{ height: isFullscreen ? undefined : mapHeight, minHeight: isFullscreen ? 0 : undefined }}
      >
        {/* Floating search bar */}
        <div className="absolute top-3 left-3 right-3 z-[1001]">
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/97 dark:bg-gray-900/97 backdrop-blur-lg shadow-xl transition-all duration-200 ${
            suggestions.length > 0
              ? 'border-2 border-blue-500 dark:border-blue-400'
              : 'border border-white/70 dark:border-gray-700'
          }`}>
            <Search size={15} className="text-blue-500 flex-shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder="Busca tu calle, número, barrio..."
              className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500"
            />
            {(searching || reversing) && <Loader size={13} className="animate-spin text-blue-400 flex-shrink-0" />}
            {query && !searching && !reversing && (
              <button
                onClick={() => { setQuery(''); setSuggestions([]); setSelected(null); setNoResults(false); searchRef.current?.focus(); }}
                className="p-0.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="button" onClick={geolocate} disabled={locating}
              title="Usar mi ubicación GPS"
              className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-700 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-40 transition-colors ml-1 flex-shrink-0"
            >
              <Navigation size={13} className={locating ? 'animate-spin' : ''} />
              <span className="text-xs font-semibold hidden sm:inline">GPS</span>
            </button>
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {suggestions.map((s, i) => {
                const a = s.address;
                const road = [a.road, a.house_number].filter(Boolean).join(' ');
                const main = road || a.neighbourhood || a.suburb || s.display_name.split(',')[0];
                const parts = [
                  a.city || a.town || a.village || a.municipality,
                  a.postcode,
                ].filter(Boolean);
                const sub = parts.join(' · ') || s.display_name.split(',').slice(1, 3).join(',').trim();
                return (
                  <button
                    key={s.place_id}
                    onClick={() => pickSuggestion(s)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                      i < suggestions.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/80' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin size={13} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{main}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{sub}</p>
                    </div>
                    <ChevronRight size={13} className="text-gray-300 flex-shrink-0 mt-2" />
                  </button>
                );
              })}
            </div>
          )}

          {/* No results hint — never leave the user without feedback */}
          {noResults && !searching && query.length >= 3 && (
            <div className="mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
              <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">Sin resultados</span>
                {' '}— prueba con el nombre de la calle sin número, o toca directamente en el mapa.
              </div>
            </div>
          )}
        </div>

        {/* Map canvas */}
        <div ref={mapRef} className="absolute inset-0 z-[1]" />

        {/* Layer switcher */}
        <div className="absolute bottom-10 left-3 z-[1000] flex gap-1.5">
          {(['2d', 'satellite'] as MapMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border transition-all duration-200 ${
                mapMode === mode
                  ? 'bg-blue-600 text-white border-blue-700 shadow-blue-300/40'
                  : 'bg-white/95 dark:bg-gray-900/95 text-gray-700 dark:text-gray-300 border-white/60 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 backdrop-blur-md'
              }`}
            >
              {mode === '2d' ? <><Layers size={12} /> Mapa</> : <><Globe size={12} /> Satélite</>}
            </button>
          ))}
        </div>

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(f => !f)}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          className="absolute bottom-10 right-14 z-[1000] w-8 h-8 flex items-center justify-center rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-white/60 dark:border-gray-700 shadow-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>

        {/* Tip */}
        <div className="absolute bottom-2 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-white text-[10px] font-medium tracking-wide">
            Toca el mapa · arrastra el pin · o busca arriba
          </div>
        </div>
      </div>

      {/* ── DETAILS PANEL ── */}
      <div className={`bg-white dark:bg-gray-900 ${isFullscreen ? 'border-t border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[45vh]' : ''}`}>
        {selected ? (
          <div>
            {/* Address card */}
            <div className="px-4 pt-4 pb-0">
              <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">
                    Ubicación seleccionada
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {selected.street || selected.formatted.split(',')[0]}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selected.city && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                        <MapPin size={9} /> {selected.city}
                      </span>
                    )}
                    {selected.postalCode && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isBarcelonaPostalCode(selected.postalCode)
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50'
                          : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40'
                      }`}>
                        CP {selected.postalCode}
                        {!isBarcelonaPostalCode(selected.postalCode) && ' ⚠'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelected(null); setQuery(''); setNoResults(false); searchRef.current?.focus(); }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Housing type */}
            <div className="px-4 pt-3 pb-0">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                Tipo de vivienda
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { t: 'casa' as const, Icon: Home, label: 'Casa / Chalet', sub: 'Unifamiliar' },
                  { t: 'piso' as const, Icon: Building2, label: 'Piso / Apto', sub: 'En edificio' },
                ]).map(({ t: ht, Icon, label, sub }) => (
                  <button
                    key={ht} type="button" onClick={() => setHousingType(ht)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-150 text-left ${
                      housingType === ht
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      housingType === ht ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${housingType === ht ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {label}
                      </p>
                      <p className="text-[10px] text-gray-400">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Floor / Door for pisos */}
            {housingType === 'piso' && (
              <div className="px-4 pt-3 pb-0">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Detalles del piso
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Piso <span className="text-red-400">*</span>
                    </label>
                    <input
                      autoFocus value={floor} onChange={e => setFloor(e.target.value)}
                      placeholder="3º, Bajo, 2°…"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-300 dark:placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">Puerta</label>
                    <input
                      value={door} onChange={e => setDoor(e.target.value)}
                      placeholder="A, Izq, 2ª…"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-300 dark:placeholder-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Confirm CTA */}
            <div className="px-4 pt-3 pb-4">
              <button
                type="button" onClick={confirm} disabled={!canConfirm}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-950"
              >
                <CheckCircle2 size={15} />
                Confirmar esta dirección
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-50 dark:border-gray-800">
            {outsideBcn ? (
              <div className="flex items-start gap-3 px-4 py-3.5 bg-red-50 dark:bg-red-950/30">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Fuera del área de servicio</p>
                  <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">
                    VELORA opera exclusivamente en <strong>Barcelona</strong>. Selecciona una dirección dentro de la ciudad.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin size={14} className="text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Busca tu dirección</span> arriba o{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">toca el mapa</span> — solo Barcelona
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
