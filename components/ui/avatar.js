import { cn } from '@/lib/utils';

export function Avatar({ initials, status, size = 'md', className }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  const ringColors = {
    active:  'ring-active',
    resting: 'ring-resting',
    warning: 'ring-warning',
    sos:     'ring-danger',
    offline: 'ring-offline',
  };
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full',
        'bg-elevated font-semibold text-secondary font-display ring-2',
        ringColors[status] ?? 'ring-border',
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
