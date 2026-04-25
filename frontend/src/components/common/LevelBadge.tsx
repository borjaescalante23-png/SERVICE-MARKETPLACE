import { ProfessionalLevel } from '../../types';

const config: Record<ProfessionalLevel, { label: string; classes: string }> = {
  VERIFIED: {
    label: 'Verificado',
    classes: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  PRO: {
    label: 'Pro',
    classes: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
  ELITE: {
    label: 'Elite',
    classes: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
};

export default function LevelBadge({ level, size = 'sm' }: { level: ProfessionalLevel; size?: 'sm' | 'md' }) {
  const { label, classes } = config[level] || config.VERIFIED;
  const sizeClasses = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClasses} ${classes}`}>
      {level === 'ELITE' && <span className="mr-1">★</span>}
      {level === 'PRO' && <span className="mr-1">◆</span>}
      {label}
    </span>
  );
}
