import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin, Search, X, Loader, Navigation,
  CheckCircle2, ChevronRight, AlertCircle, Home, Building2,
  Layers, Globe, Maximize2, Minimize2,
} from 'lucide-react';

// ── Public interface ──────────────────────────────────────────────────────────
export interface AddressResult {
  lat: number; lng: number;
  formatted: string; street: string;
  city: string; postalCode: string; country: string;
}

interface Props {
  onConfirm: (r: AddressResult & { housingType: 'casa' | 'piso'; floor: string; door: string }) => void;
  initialAddress?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BCN = { lat: 41.3851, lng: 2.1734 };
const BCN_BOUNDS = { minLat: 41.25, maxLat: 41.55, minLng: 1.90, maxLng: 2.35 };
const VIEWBOX_D = 0.22;
const MIN_GAP = 400;
const LANG = 'ca,es;q=0.9,en;q=0.8';

function inBcn(lat: number, lng: number) {
  return lat >= BCN_BOUNDS.minLat && lat <= BCN_BOUNDS.maxLat &&
    lng >= BCN_BOUNDS.minLng && lng <= BCN_BOUNDS.maxLng;
}

// ── Pin styles (inject once) ──────────────────────────────────────────────────
let _stylesOk = false;
function injectStyles() {
  if (_stylesOk) return;
  _stylesOk = true;
  const s = document.createElement('style');
  s.textContent = `
    .vpin{position:relative;width:28px;height:36px;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 10px rgba(15,40,80,.4));}
    .vpin svg{animation:vpinDrop .45s cubic-bezier(.34,1.56,.64,1) both;}
    .vpin-shadow{width:9px;height:3px;background:rgba(0,0,0,.15);border-radius:50%;margin-top:-1px;filter:blur(2px);animation:vpinShadow .45s ease both;}
    .vpin-pulse{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:rgba(15,40,80,.25);animation:vpinPulse 2.2s ease-out 1.4s infinite;}
    @keyframes vpinDrop{0%{transform:translateY(-20px) scale(.5);opacity:0}60%{transform:translateY(3px) scale(1.06);opacity:1}80%{transform:translateY(-2px) scale(.98)}100%{transform:translateY(0) scale(1);opacity:1}}
    @keyframes vpinShadow{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes vpinPulse{0%{transform:translateX(-50%) scale(1);opacity:.55}100%{transform:translateX(-50%) scale(4.5);opacity:0}}
    .leaflet-control-zoom{border:none!important;box-shadow:0 2px 16px rgba(0,0,0,.1)!important;border-radius:14px!important;overflow:hidden;}
    .leaflet-control-zoom a{background:rgba(255,255,255,.96)!important;border:none!important;color:#374151!important;font-weight:700;width:34px!important;height:34px!important;line-height:34px!important;transition:background .15s;}
    .leaflet-control-zoom a:hover{background:#eff6ff!important;color:#1e40af!important;}
    .leaflet-control-attribution{font-size:9px!important;background:rgba(255,255,255,.6)!important;padding:1px 5px!important;border-radius:4px 0 0 0!important;}
  `;
  document.head.appendChild(s);
}

const PIN_HTML = `
<div class="vpin">
  <svg width="28" height="35" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0f2850" stroke="white" stroke-width="1"/>
    <circle cx="12" cy="9" r="3.2" fill="white"/>
    <circle cx="12" cy="9" r="1.6" fill="#0f2850"/>
  </svg>
  <div class="vpin-shadow"></div>
  <div class="vpin-pulse"></div>
</div>`;

// ── Nominatim helpers ─────────────────────────────────────────────────────────
interface NomResult {
  place_id: number; lat: string; lon: string; display_name: string;
  address: {
    road?: string; house_number?: string; city?: string; town?: string;
    village?: string; municipality?: string; postcode?: string;
    country?: string; suburb?: string; neighbourhood?: string;
  };
}

let _ctrl: AbortController | null = null;
let _lastTs = 0;

const SYNONYMS: Array<[RegExp, string]> = [
  [/^carrer\b/i, 'Calle'], [/^avinguda\b/i, 'Avenida'], [/^passeig\b/i, 'Paseo'],
  [/^plaça\b/i, 'Plaza'], [/^travessera\b/i, 'Travesía'], [/^camí\b/i, 'Camino'],
  [/^calle\b/i, 'Carrer'], [/^avenida\b/i, 'Avinguda'], [/^paseo\b/i, 'Passeig'],
  [/^plaza\b/i, 'Plaça'], [/^c\.\s*/i, 'Carrer '], [/^c\/\s*/i, 'Carrer '],
  [/^av\.\s*/i, 'Avinguda '], [/^pg\.\s*/i, 'Passeig '],
];

function withBcn(q: string) { return /barcelona/i.test(q) ? q : `${q}, Barcelona`; }
function dedup(s: string) { return s.replace(/([a-záéíóúàèìòùüïç])\1+/gi, '$1'); }
function synonym(q: string): string | null {
  for (const [re, r] of SYNONYMS) if (re.test(q)) return withBcn(`${r} ${q.replace(re,'').trim()}`);
  return null;
}

function urlFree(q: string) {
  const vb = `${BCN.lng-VIEWBOX_D},${BCN.lat+VIEWBOX_D},${BCN.lng+VIEWBOX_D},${BCN.lat-VIEWBOX_D}`;
  return `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8&countrycodes=es&viewbox=${vb}&bounded=0`;
}
function urlStruct(street: string) {
  return `https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(street)}&city=Barcelona&country=Spain&format=json&addressdetails=1&limit=8`;
}

async function nomFetch(url: string, signal: AbortSignal): Promise<NomResult[]> {
  const gap = MIN_GAP - (Date.now() - _lastTs);
  if (gap > 0) await new Promise<void>(r => setTimeout(r, gap));
  if (signal.aborted) return [];
  _lastTs = Date.now();
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': LANG }, signal });
    if (!res.ok || signal.aborted) return [];
    return res.json();
  } catch { return []; }
}

function score(item: NomResult, raw: string) {
  const q = raw.toLowerCase().replace(/,.*$/, '').trim();
  const road = (item.address.road || '').toLowerCase();
  const disp = item.display_name.toLowerCase();
  let s = 0;
  if (road === q) s += 100;
  else if (road.startsWith(q)) s += 80;
  else if (road.includes(q)) s += 55;
  else if (disp.includes(q)) s += 30;
  const words = q.split(/\s+/).filter(w => w.length > 2);
  for (const w of words) {
    if (road.includes(w)) s += 15;
    else if (disp.includes(w)) s += 7;
    for (const rw of road.split(/\s+/)) if (rw.startsWith(w) && w.length >= 3) { s += 12; break; }
  }
  const num = q.match(/\d+/)?.[0];
  if (num && item.address.house_number === num) s += 20;
  if (disp.includes('barcelona')) s += 5;
  return s;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AddressMapPicker({ onConfirm, initialAddress }: Props) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const streetRef = useRef<any>(null);
  const satRef = useRef<any>(null);
  const satLabelsRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debRef = useRef<ReturnType<typeof setTimeout>>();
  const userPos = useRef<{ lat: number; lng: number } | null>(null);

  const [query, setQuery] = useState(initialAddress || '');
  const [suggestions, setSuggestions] = useState<NomResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<AddressResult | null>(null);
  const [housingType, setHousingType] = useState<'casa' | 'piso'>('casa');
  const [floor, setFloor] = useState('');
  const [door, setDoor] = useState('');
  const [mode, setMode] = useState<'street' | 'satellite'>('street');
  const [fullscreen, setFullscreen] = useState(false);
  const [outsideBcn, setOutsideBcn] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Reverse geocode via Nominatim
  async function reverseGeocode(lat: number, lng: number) {
    if (!inBcn(lat, lng)) { setOutsideBcn(true); setSelected(null); return; }
    setOutsideBcn(false);
    setReversing(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
        { headers: { 'Accept-Language': LANG } },
      );
      const d = await res.json();
      if (d?.address) {
        const r = toResult(lat, lng, d.display_name, d.address);
        setSelected(r); setQuery(shortAddr(r)); setSuggestions([]);
      } else throw new Error();
    } catch {
      const r: AddressResult = { lat, lng, formatted: `${lat.toFixed(5)}, ${lng.toFixed(5)}, Barcelona`, street: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: 'Barcelona', postalCode: '', country: 'España' };
      setSelected(r); setQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`); setSuggestions([]);
    } finally { setReversing(false); }
  }

  function toResult(lat: number, lng: number, display: string, a: NomResult['address']): AddressResult {
    return { lat, lng, formatted: display, street: [a.road, a.house_number].filter(Boolean).join(' ') || '', city: a.city || a.town || a.village || a.municipality || '', postalCode: a.postcode || '', country: a.country || '' };
  }
  function shortAddr(r: AddressResult) {
    if (r.street && r.city) return `${r.street}, ${r.city}`;
    return r.formatted.split(',').slice(0, 3).join(',').trim();
  }

  // Map init
  useEffect(() => {
    injectStyles();
    if (!mapDiv.current || mapRef.current) return;

    // Silent geolocation for bias
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => { userPos.current = { lat: coords.latitude, lng: coords.longitude }; },
      () => {}, { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );

    import('leaflet').then(L => {
      if (!mapDiv.current) return;

      const icon = L.divIcon({ className: '', html: PIN_HTML, iconSize: [28, 36], iconAnchor: [14, 33] });

      // CARTO Positron — clean, premium, minimal (closest to premium styled map)
      streetRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution: '© <a href="https://carto.com">CARTO</a>', subdomains: 'abcd', maxZoom: 20 },
      );

      satRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri', maxZoom: 19 },
      );
      satLabelsRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.9 },
      );

      const map = L.map(mapDiv.current, {
        center: [BCN.lat, BCN.lng], zoom: 14,
        zoomControl: false, attributionControl: true,
      });
      streetRef.current.addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const marker = L.marker([BCN.lat, BCN.lng], { draggable: true, icon }).addTo(map);
      mapRef.current = map;
      markerRef.current = marker;

      marker.on('dragend', () => {
        const p = marker.getLatLng();
        reverseGeocode(p.lat, p.lng);
      });
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    });

    return () => { _ctrl?.abort(); mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 80);
    return () => clearTimeout(t);
  }, [fullscreen]);

  function switchMode(m: 'street' | 'satellite') {
    const map = mapRef.current; if (!map) return;
    if (m === 'satellite') {
      streetRef.current && map.removeLayer(streetRef.current);
      satRef.current?.addTo(map); satLabelsRef.current?.addTo(map);
    } else {
      satRef.current && map.removeLayer(satRef.current);
      satLabelsRef.current && map.removeLayer(satLabelsRef.current);
      streetRef.current?.addTo(map);
    }
    setMode(m);
  }

  // Search (5 strategies)
  const doSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) { setSuggestions([]); setNoResults(false); return; }
    _ctrl?.abort(); _ctrl = new AbortController();
    const { signal } = _ctrl;
    setSearching(true); setNoResults(false);

    const seen = new Set<number>(); const pool: NomResult[] = [];
    const absorb = (items: NomResult[]) => items.forEach(i => { if (!seen.has(i.place_id)) { seen.add(i.place_id); pool.push(i); } });

    try {
      absorb(await nomFetch(urlFree(withBcn(q)), signal));
      if (signal.aborted) return;
      if (!pool.length) {
        const syn = synonym(q);
        if (syn) { absorb(await nomFetch(urlFree(syn), signal)); if (signal.aborted) return; }
      }
      if (!pool.length) {
        const bare = q.replace(/,\s*barcelona\s*$/i, '').replace(/^\w+\s+/, '').trim() || q;
        absorb(await nomFetch(urlStruct(bare), signal)); if (signal.aborted) return;
      }
      if (!pool.length) {
        const fixed = dedup(q.replace(/,\s*barcelona\s*$/i, '').trim());
        if (fixed !== q.replace(/,\s*barcelona\s*$/i,'').trim()) { absorb(await nomFetch(urlFree(withBcn(fixed)), signal)); if (signal.aborted) return; }
      }
      if (!pool.length) {
        const tokens = q.replace(/,\s*barcelona\s*$/i,'').trim().split(/\s+/);
        if (tokens.length > 1) { absorb(await nomFetch(urlFree(withBcn(tokens.slice(0,-1).join(' '))), signal)); if (signal.aborted) return; }
      }

      const inB = pool.filter(i => inBcn(parseFloat(i.lat), parseFloat(i.lon)));
      const cands = inB.length ? inB : pool.slice(0, 4);
      const up = userPos.current;
      const ranked = cands
        .map(i => ({ i, s: score(i, q), d: up ? Math.hypot(parseFloat(i.lat)-up.lat, parseFloat(i.lon)-up.lng) : 999 }))
        .sort((a,b) => Math.abs(b.s-a.s) > 8 ? b.s-a.s : a.d-b.d)
        .map(x => x.i).slice(0, 6);

      setSuggestions(ranked);
      setNoResults(ranked.length === 0 && q.length >= 3);
    } catch { setSuggestions([]); }
    finally { if (!signal.aborted) setSearching(false); }
  }, []);

  function onChange(val: string) {
    setQuery(val); setNoResults(false);
    if (!val.trim()) { setSuggestions([]); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => doSearch(val), 300);
  }

  function pick(s: NomResult) {
    const lat = parseFloat(s.lat), lng = parseFloat(s.lon);
    if (!inBcn(lat, lng)) { setOutsideBcn(true); setSuggestions([]); return; }
    setOutsideBcn(false); setNoResults(false);
    const r = toResult(lat, lng, s.display_name, s.address);
    setSelected(r); setQuery(shortAddr(r)); setSuggestions([]);
    userPos.current = { lat, lng };
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.flyTo([lat, lng], 17, { duration: 1, easeLinearity: 0.3 });
    }
  }

  function geolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        if (!inBcn(lat, lng)) { setOutsideBcn(true); setLocating(false); return; }
        setOutsideBcn(false);
        userPos.current = { lat, lng };
        markerRef.current?.setLatLng([lat, lng]);
        mapRef.current?.flyTo([lat, lng], 17, { duration: 1.2, easeLinearity: 0.25 });
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
  const mapH = fullscreen ? '100%' : '320px';

  return (
    <div className={fullscreen
      ? 'fixed inset-0 z-[2000] flex flex-col bg-white dark:bg-gray-950'
      : 'rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl'
    }>

      {/* ── MAP ── */}
      <div className="relative flex-1" style={{ height: fullscreen ? undefined : mapH }}>

        {/* Search bar */}
        <div className="absolute top-3 left-3 right-3 z-[1001]">
          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-2xl transition-all duration-200 ${
            suggestions.length > 0
              ? 'bg-white dark:bg-gray-900 border-2 border-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/30'
              : 'bg-white/96 dark:bg-gray-900/96 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700'
          }`}>
            <Search size={15} className="text-primary-500 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => onChange(e.target.value)}
              placeholder="Busca tu calle o barrio..."
              className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 min-w-0"
              autoComplete="off"
            />
            {(searching || reversing) && <Loader size={13} className="animate-spin text-primary-400 flex-shrink-0" />}
            {query && !searching && !reversing && (
              <button onClick={() => { setQuery(''); setSuggestions([]); setSelected(null); setNoResults(false); inputRef.current?.focus(); }}
                className="p-0.5 rounded-full text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X size={13} />
              </button>
            )}
            <button type="button" onClick={geolocate} disabled={locating}
              className="flex items-center gap-1 pl-2.5 border-l border-gray-200 dark:border-gray-700 text-primary-500 hover:text-primary-700 disabled:opacity-40 transition-colors flex-shrink-0">
              <Navigation size={13} className={locating ? 'animate-spin' : ''} />
              <span className="text-[11px] font-bold hidden sm:inline tracking-wide">GPS</span>
            </button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {suggestions.map((s, i) => {
                const a = s.address;
                const main = [a.road, a.house_number].filter(Boolean).join(' ') || a.neighbourhood || a.suburb || s.display_name.split(',')[0];
                const sub = [a.city || a.town || a.village || a.municipality, a.postcode].filter(Boolean).join(' · ') || s.display_name.split(',').slice(1, 3).join(',').trim();
                return (
                  <button key={s.place_id} onClick={() => pick(s)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:bg-primary-100 transition-colors ${
                      i < suggestions.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''
                    }`}>
                    <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                      <MapPin size={13} className="text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{main}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{sub}</p>
                    </div>
                    <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {noResults && !searching && query.length >= 3 && (
            <div className="mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
              <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Sin resultados</span>
                {' '}— prueba con el nombre de la calle sin número, o toca el mapa.
              </p>
            </div>
          )}

          {/* Outside Barcelona */}
          {outsideBcn && (
            <div className="mt-2 bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg border border-red-100 dark:border-red-800 px-4 py-3 flex items-center gap-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">VELORA solo opera en Barcelona y área metropolitana.</p>
            </div>
          )}
        </div>

        {/* Map canvas */}
        <div ref={mapDiv} className="absolute inset-0 z-[1]" />

        {/* Bottom controls */}
        <div className="absolute bottom-10 left-3 z-[1000] flex gap-1.5">
          {(['street', 'satellite'] as const).map(m => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg border transition-all ${
                mode === m
                  ? 'bg-primary-600 text-white border-primary-700 shadow-primary-200/50 dark:shadow-primary-900/50'
                  : 'bg-white/95 dark:bg-gray-900/95 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-700 hover:border-primary-300 backdrop-blur-md'
              }`}>
              {m === 'street' ? <><Layers size={11} />Mapa</> : <><Globe size={11} />Satélite</>}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setFullscreen(f => !f)}
          className="absolute bottom-10 right-14 z-[1000] w-8 h-8 flex items-center justify-center rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/60 dark:border-gray-700 shadow-lg text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>

        {/* Hint */}
        {!selected && (
          <div className="absolute bottom-2 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium tracking-wide">
              Toca el mapa · arrastra el pin · o busca arriba
            </div>
          </div>
        )}
      </div>

      {/* ── DETAILS PANEL ── */}
      <div className={`bg-white dark:bg-gray-900 ${fullscreen ? 'border-t border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[44vh]' : ''}`}>
        {selected ? (
          <>
            {/* Selected address card */}
            <div className="px-4 pt-4">
              <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/50 rounded-2xl border border-primary-100 dark:border-primary-900/60">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-primary-500 dark:text-primary-400 uppercase tracking-widest mb-0.5">
                    Ubicación seleccionada
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                    {selected.street || selected.city || selected.formatted.split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {[selected.postalCode, selected.city].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button onClick={() => { setSelected(null); setQuery(''); inputRef.current?.focus(); }}
                  className="p-1 rounded-lg text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Housing type */}
            <div className="px-4 pt-4">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Tipo de vivienda</p>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {([['casa', 'Casa / Chalet', Home], ['piso', 'Piso / Apartamento', Building2]] as const).map(([type, label, Icon]) => (
                  <button key={type} type="button" onClick={() => setHousingType(type)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      housingType === type
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    <Icon size={15} />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>

              {housingType === 'piso' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[['Piso', floor, setFloor, '1º, 2º...', true], ['Puerta', door, setDoor, 'A, B, 1...', false]].map(([label, val, setter, ph, req]) => (
                    <div key={label as string}>
                      <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
                        {label as string} {req && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        value={val as string}
                        onChange={e => (setter as any)(e.target.value)}
                        placeholder={ph as string}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm button */}
            <div className="px-4 pb-4">
              <button type="button" onClick={confirm} disabled={!canConfirm}
                className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary-200 dark:shadow-primary-900/40 text-sm tracking-wide">
                Confirmar dirección
              </button>
            </div>
          </>
        ) : (
          <div className="px-4 py-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-700">
              <MapPin size={18} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 leading-snug">
              Busca una calle o toca el mapa para seleccionar la dirección del servicio
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
