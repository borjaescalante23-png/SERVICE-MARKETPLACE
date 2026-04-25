import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../services/api';
import { Clock, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_START = '09:00';
const DEFAULT_END = '18:00';

interface SlotState {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

function buildDefaultSlots(existing: any[]): SlotState[] {
  return DAYS.map((_, i) => {
    const found = existing.find((s: any) => s.dayOfWeek === i);
    return {
      dayOfWeek: i,
      startTime: found?.startTime || DEFAULT_START,
      endTime: found?.endTime || DEFAULT_END,
      isAvailable: found?.isAvailable ?? (i >= 1 && i <= 5), // Mon-Fri on by default
    };
  });
}

export default function AvailabilitySchedule() {
  const qc = useQueryClient();
  const { data: existing = [], isLoading } = useQuery({
    queryKey: ['my-availability'],
    queryFn: () => availabilityApi.getMy().then(r => r.data),
  });

  const [slots, setSlots] = useState<SlotState[] | null>(null);

  const currentSlots: SlotState[] = slots ?? buildDefaultSlots(existing);

  const mutation = useMutation({
    mutationFn: (s: SlotState[]) => availabilityApi.set(s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-availability'] });
      toast.success('Disponibilidad guardada');
    },
    onError: () => toast.error('Error al guardar'),
  });

  function toggle(day: number) {
    setSlots(currentSlots.map(s => s.dayOfWeek === day ? { ...s, isAvailable: !s.isAvailable } : s));
  }

  function setTime(day: number, field: 'startTime' | 'endTime', val: string) {
    setSlots(currentSlots.map(s => s.dayOfWeek === day ? { ...s, [field]: val } : s));
  }

  function handleSave() {
    mutation.mutate(currentSlots);
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {currentSlots.map(slot => (
        <div
          key={slot.dayOfWeek}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
            slot.isAvailable
              ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
          }`}
        >
          <button
            type="button"
            onClick={() => toggle(slot.dayOfWeek)}
            className={`w-11 h-6 rounded-full flex-shrink-0 transition-colors relative ${
              slot.isAvailable ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                slot.isAvailable ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>

          <span className={`w-24 text-sm font-medium flex-shrink-0 ${
            slot.isAvailable ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
          }`}>
            {DAYS[slot.dayOfWeek]}
          </span>

          {slot.isAvailable ? (
            <div className="flex items-center gap-2 flex-1">
              <Clock size={13} className="text-gray-400 flex-shrink-0" />
              <input
                type="time"
                value={slot.startTime}
                onChange={e => setTime(slot.dayOfWeek, 'startTime', e.target.value)}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400 text-xs">—</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={e => setTime(slot.dayOfWeek, 'endTime', e.target.value)}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-1">No disponible</span>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={handleSave}
        disabled={mutation.isPending}
        className="w-full mt-2 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {mutation.isPending ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : mutation.isSuccess ? (
          <Check size={15} />
        ) : (
          <Save size={15} />
        )}
        Guardar disponibilidad
      </button>
    </div>
  );
}
