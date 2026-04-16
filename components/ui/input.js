import { cn } from '@/lib/utils';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full h-10 px-3 rounded bg-elevated border border-border text-primary text-sm',
        'placeholder:text-muted outline-none',
        'focus:border-accent/60 focus:ring-1 focus:ring-accent/20',
        'transition-colors duration-150',
        className,
      )}
      {...props}
    />
  );
}
