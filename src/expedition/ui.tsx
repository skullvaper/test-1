import {
  createContext,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

function cn(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({
  className,
  children,
  style,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn('rounded-lg border bg-card text-card-foreground', className)}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  children,
  style,
  variant = 'default',
}: {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  variant?: 'default' | 'outline';
}) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variant === 'outline' ? 'border bg-transparent' : 'bg-primary text-primary-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  children: ReactNode;
}

export function Button({
  className,
  children,
  style,
  variant = 'default',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      style={style}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]',
        variant === 'outline'
          ? 'border bg-transparent'
          : 'bg-primary text-primary-foreground',
        disabled && 'opacity-50 cursor-not-allowed active:scale-100',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-muted/60', className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function ScrollArea({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('overflow-y-auto overscroll-contain', className)}>{children}</div>;
}

// ── Tabs ────────────────────────────────────────────────────────────
interface TabsCtx {
  value: string;
  setValue: (v: string) => void;
}
const TabsContext = createContext<TabsCtx | null>(null);

export function Tabs({
  defaultValue,
  className,
  children,
}: {
  defaultValue: string;
  className?: string;
  children: ReactNode;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('inline-flex items-center justify-center rounded-lg p-1', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  style,
}: {
  value: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      style={style}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}

export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm m-0 sm:m-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function StatPill(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}
