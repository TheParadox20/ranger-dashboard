import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  const variants = {
    default:     'bg-accent text-white hover:bg-accent-bright active:scale-95',
    ghost:       'text-secondary hover:text-primary hover:bg-white/5',
    outline:     'border border-border text-primary hover:bg-elevated hover:border-border-light',
    destructive: 'bg-danger text-white hover:bg-red-700 active:scale-95',
    dim:         'bg-elevated text-secondary hover:text-primary hover:bg-border',
  };
  const sizes = {
    default: 'px-4 py-2 text-sm h-9',
    sm:      'px-3 py-1.5 text-xs h-7',
    lg:      'px-6 py-3 text-base h-11',
    icon:    'p-2 h-9 w-9',
    'icon-sm': 'p-1.5 h-7 w-7',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
