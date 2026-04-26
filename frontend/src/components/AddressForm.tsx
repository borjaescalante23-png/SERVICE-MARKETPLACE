import { useRef, useState, useCallback } from 'react';
import { MapPin, Search, X, Loader, Navigation, CheckCircle2, ChevronRight, AlertCircle, Home, Building2 } from 'lucide-react';

export interface StructuredAddress {
  street: string;
  number: string;
  postalCode: string;
  neighborhood: string;
  city: string;
  housingType: 'casa' | 'piso';
  floor: string;
  door: string;
  staircase: string;
  // backward-compat fields used by ProfessionalProfile
  formatted: string;
  lat: number;
  lng: number;
}

interface Props {
  onConfirm: (a: StructuredAddress) => void;
}

// ── Nominatim (street autocomplete only) ─────────────────────────────────────
const BCN = { lat: 41.3851, lng: 2.1734 };
const BCN_BOUNDS = { minLat: 41.25, maxLat: 41.55, minLng: 1.90, maxLng: 2.35 };
const MIN_GAP = 400;
const LANG = 'ca,es;q=0.9,en;q=0.8';

function inBcn(lat: number, lng: number) {
  return lat >= BCN_BOUNDS.minLat && lat <= BCN_BOUNDS.maxLat &&
    lng >= BCN_BOUNDS.minLng && lng <= BCN_BOUNDS.maxLng;
}

interface NomResult {
  place_id: number; lat: string; lon: string; display_name: string;
  address: { road?: string; house_number?: string; postcode?: string; suburb?: string; neighbourhood?: string; city?: string; town?: string; };
}

let _ctrl: AbortController | null = null;
let _lastTs = 0;

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

function streetSearchUrl(q: string) {
  const vb = `${BCN.lng - 0.22},${BCN.lat + 0.22},${BCN.lng + 0.22},${BCN.lat - 0.22}`;
  return `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Barcelona')}&format=json&addressdetails=1&limit=6&countrycodes=es&viewbox=${vb}&bounded=1`;
}

function buildFormatted(a: Omit<StructuredAddress, 'formatted' | 'lat' | 'lng'>): string {
  const base = [a.street, a.number].filter(Boolean).join(' ') + (a.postalCode ? `, ${a.postalCode}` : '') + `, ${a.city}`;
  if (a.housingType === 'piso') {
    const detail = [a.floor && `Piso ${a.floor}`, a.door && `Puerta ${a.door}`, a.staircase && `Esc. ${a.staircase}`].filter(Boolean).join(' ');
    return `${base} — ${detail}`;
  }
  return base;
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all';
const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';

export default function AddressForm({ onConfirm }: Props) {
  const streetRef = useRef<HTMLInputElement>(null);
  const debRef = useRef<ReturnType<typeof setTimeout>>();

  const [streetQuery, setStreetQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NomResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [outsideBcn, setOutsideBcn] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const [fields, setFields] = useState({
    street: '', number: '', postalCode: '', neighborhood: '', city: 'Barcelona',
    housingType: 'casa' as 'casa' | 'piso',
    floor: '', door: '', staircase: '',
  });
  const [coords, setCoords] = useState({ lat: BCN.lat, lng: BCN.lng });
  const [streetConfirmed, setStreetConfirmed] = useState(false);

  const set = (k: keyof typeof fields, v: string) => setFields(p => ({ ...p, [k]: v }));

  const doSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) { setSuggestions([]); setNoResults(false); return; }
    _ctrl?.abort(); _ctrl = new AbortController();
    const { signal } = _ctrl;
    setSearching(true); setNoResults(false);
    try {
      const results = await nomFetch(streetSearchUrl(q), signal);
      if (signal.aborted) return;
      const inB = results.filter(r => inBcn(parseFloat(r.lat), parseFloat(r.lon)));
      // Deduplicate by road name
      const seen = new Set<string>();
      const deduped = (inB.length ? inB : results).filter(r => {
        const road = r.address.road || r.display_name.split(',')[0];
        if (seen.has(road)) return false;
        seen.add(road); return true;
      }).slice(0, 6);
      setSuggestions(deduped);
      setNoResults(deduped.length === 0 && q.length >= 3);
    } catch { setSuggestions([]); }
    finally { if (!signal.aborted) setSearching(false); }
  }, []);

  function onStreetChange(val: string) {
    setStreetQuery(val);
    setStreetConfirmed(false);
    set('street', val);
    setNoResults(false);
    if (!val.trim()) { setSuggestions([]); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => doSearch(val), 300);
  }

  function pickSuggestion(s: NomResult) {
    const lat = parseFloat(s.lat), lng = parseFloat(s.lon);
    if (!inBcn(lat, lng)) { setOutsideBcn(true); setSuggestions([]); return; }
    setOutsideBcn(false);
    const road = s.address.road || s.display_name.split(',')[0];
    const cp = s.address.postcode || '';
    const barrio = s.address.neighbourhood || s.address.suburb || '';
    setStreetQuery(road);
    setFields(p => ({ ...p, street: road, postalCode: cp, neighborhood: barrio }));
    setCoords({ lat, lng });
    setStreetConfirmed(true);
    setSuggestions([]);
  }

  function geolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        if (!inBcn(lat, lng)) { setOutsideBcn(true); setLocating(false); return; }
        setOutsideBcn(false);
        setCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`, { headers: { 'Accept-Language': LANG } });
          const d = await res.json();
          if (d?.address) {
            const a = d.address;
            setStreetQuery(a.road || '');
            setFields(p => ({
              ...p,
              street: a.road || '',
              number: a.house_number || '',
              postalCode: a.postcode || '',
              neighborhood: a.neighbourhood || a.suburb || '',
            }));
            setStreetConfirmed(true);
          }
        } catch { /* silently ignore */ }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const isPiso = fields.housingType === 'piso';
  const canConfirm = fields.street.trim() && fields.number.trim() && fields.postalCode.trim() &&
    (!isPiso || (fields.floor.trim() && fields.door.trim()));

  function handleConfirm() {
    if (!canConfirm) return;
    const partial = { ...fields };
    onConfirm({
      ...partial,
      lat: coords.lat,
      lng: coords.lng,
      formatted: buildFormatted(partial),
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-visible">
      <div className="p-4 space-y-4">

        {/* Street autocomplete */}
        <div className="relative">
          <label className={labelCls}>Calle <span className="text-red-400">*</span></label>
          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all ${
            suggestions.length > 0
              ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 bg-white dark:bg-gray-800'
              : streetConfirmed
              ? 'border-green-400 bg-white dark:bg-gray-800'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          }`}>
            <Search size={14} className="text-primary-500 flex-shrink-0" />
            <input
              ref={streetRef}
              value={streetQuery}
              onChange={e => onStreetChange(e.target.value)}
              placeholder="Av. Diagonal, Carrer de Gràcia..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder-gray-400"
              autoComplete="off"
            />
            {searching && <Loader size={13} className="animate-spin text-primary-400 flex-shrink-0" />}
            {streetConfirmed && !searching && <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />}
            {streetQuery && !searching && (
              <button onClick={() => { setStreetQuery(''); set('street', ''); setStreetConfirmed(false); setSuggestions([]); streetRef.current?.focus(); }}
                className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors">
                <X size={13} />
              </button>
            )}
            <button type="button" onClick={geolocate} disabled={locating}
              className="flex items-center gap-1 pl-2.5 border-l border-gray-200 dark:border-gray-700 text-primary-500 hover:text-primary-700 disabled:opacity-40 transition-colors flex-shrink-0">
              <Navigation size={13} className={locating ? 'animate-spin' : ''} />
              <span className="text-[11px] font-bold hidden sm:inline">GPS</span>
            </button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
              {suggestions.map((s, i) => {
                const road = s.address.road || s.display_name.split(',')[0];
                const sub = [s.address.neighbourhood || s.address.suburb, s.address.postcode].filter(Boolean).join(' · ');
                return (
                  <button key={s.place_id} onClick={() => pickSuggestion(s)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors ${i < suggestions.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}>
                    <MapPin size={13} className="text-primary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{road}</p>
                      {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
                    </div>
                    <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {noResults && !searching && (
            <div className="mt-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex items-center gap-2">
              <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Sin resultados — prueba con otro nombre de calle</p>
            </div>
          )}
          {outsideBcn && (
            <div className="mt-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">VELORA solo opera en Barcelona y área metropolitana</p>
            </div>
          )}
        </div>

        {/* Number + Postal code */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Número <span className="text-red-400">*</span></label>
            <input value={fields.number} onChange={e => set('number', e.target.value)}
              placeholder="42" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Código postal <span className="text-red-400">*</span></label>
            <input value={fields.postalCode} onChange={e => set('postalCode', e.target.value)}
              placeholder="08012" maxLength={5} className={inputCls} />
          </div>
        </div>

        {/* Neighborhood + City */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Barrio</label>
            <input value={fields.neighborhood} onChange={e => set('neighborhood', e.target.value)}
              placeholder="Gràcia, Eixample..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ciudad</label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <MapPin size={13} className="text-primary-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Barcelona</span>
            </div>
          </div>
        </div>

        {/* Housing type */}
        <div>
          <label className={labelCls}>Tipo de vivienda <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {([['casa', 'Casa / Chalet', Home], ['piso', 'Piso / Apartamento', Building2]] as const).map(([type, label, Icon]) => (
              <button key={type} type="button" onClick={() => set('housingType', type)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  fields.housingType === type
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}>
                <Icon size={15} /><span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Piso details */}
        {isPiso && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <div>
              <label className={labelCls}>Piso <span className="text-red-400">*</span></label>
              <input value={fields.floor} onChange={e => set('floor', e.target.value)}
                placeholder="3º" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Puerta <span className="text-red-400">*</span></label>
              <input value={fields.door} onChange={e => set('door', e.target.value)}
                placeholder="A, B, 1..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Escalera</label>
              <input value={fields.staircase} onChange={e => set('staircase', e.target.value)}
                placeholder="1, 2..." className={inputCls} />
            </div>
          </div>
        )}

        {/* Validation hint */}
        {!canConfirm && (fields.street || fields.number) && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertCircle size={12} />
            {!fields.street.trim() ? 'Escribe el nombre de la calle' :
             !fields.number.trim() ? 'Añade el número' :
             !fields.postalCode.trim() ? 'Añade el código postal' :
             isPiso && !fields.floor.trim() ? 'Indica el piso' :
             isPiso && !fields.door.trim() ? 'Indica la puerta' : ''}
          </p>
        )}

        {/* Confirm */}
        <button type="button" onClick={handleConfirm} disabled={!canConfirm}
          className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm tracking-wide">
          Confirmar dirección
        </button>
      </div>
    </div>
  );
}
