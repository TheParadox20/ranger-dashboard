import { cn } from '@/lib/utils';

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn('text-xs font-medium text-secondary uppercase tracking-wider', className)}
      {...props}
    >
      {children}
    </label>
  );
}
