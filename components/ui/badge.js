import { cn } from '@/lib/utils';

const variants = {
  active:  'bg-active/15  text-active  border-active/30',
  resting: 'bg-resting/15 text-resting border-resting/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  sos:     'bg-danger/15  text-danger  border-danger/30',
  offline: 'bg-offline/15 text-offline border-offline/30',
  default: 'bg-elevated   text-secondary border-border',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest border',
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status, className }) {
  const colors = {
    active:  'bg-active  shadow-[0_0_6px_theme(colors.active)]',
    resting: 'bg-resting shadow-[0_0_6px_theme(colors.resting)]',
    warning: 'bg-warning shadow-[0_0_6px_theme(colors.warning)]',
    sos:     'bg-danger  shadow-[0_0_6px_theme(colors.danger)]',
    offline: 'bg-offline',
  };
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full flex-shrink-0',
        colors[status] ?? colors.offline,
        className,
      )}
    />
  );
}
