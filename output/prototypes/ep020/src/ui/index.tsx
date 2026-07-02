/**
 * EP-020 Prototype — UI Primitives
 * Radix UI primitives styled with @soli92/solids CSS variables.
 * No hardcoded colors — only var(--sd-*) tokens (R.D1, ep020-design-brief.md §3).
 */

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

// ─── cn helper ────────────────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Button ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const buttonBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--sd-space-1-5)',
  fontFamily: 'var(--sd-font-body)',
  fontWeight: 'var(--sd-font-weight-medium)' as React.CSSProperties['fontWeight'],
  fontSize: 'var(--sd-font-size-sm)',
  borderRadius: 'var(--sd-radius-md)',
  border: '1px solid transparent',
  cursor: 'pointer',
  transition: 'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

function getButtonStyle(variant: ButtonVariant = 'default', size: ButtonSize = 'md'): React.CSSProperties {
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: 'var(--sd-space-1) var(--sd-space-3)', fontSize: 'var(--sd-font-size-xs)', height: '2rem' },
    md: { padding: 'var(--sd-space-2) var(--sd-space-4)', fontSize: 'var(--sd-font-size-sm)', height: '2.5rem' },
    lg: { padding: 'var(--sd-space-3) var(--sd-space-6)', fontSize: 'var(--sd-font-size-base)', height: '3rem' },
    icon: { padding: 'var(--sd-space-2)', width: '2.5rem', height: '2.5rem' },
  };
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    default: {
      background: 'var(--sd-color-primary-default)',
      color: 'var(--sd-color-primary-foreground)',
      borderColor: 'var(--sd-color-primary-default)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--sd-color-primary-default)',
      borderColor: 'var(--sd-color-primary-default)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--sd-color-text-primary)',
      borderColor: 'transparent',
    },
    destructive: {
      background: 'var(--sd-color-destructive-default)',
      color: 'var(--sd-color-destructive-foreground)',
      borderColor: 'var(--sd-color-destructive-default)',
    },
    secondary: {
      background: 'var(--sd-color-secondary-default)',
      color: 'var(--sd-color-secondary-foreground)',
      borderColor: 'var(--sd-color-secondary-default)',
    },
  };
  return { ...buttonBase, ...sizeStyles[size], ...variantStyles[variant] };
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', style, children, ...props }, ref) => (
    <button
      ref={ref}
      style={{ ...getButtonStyle(variant, size), ...style }}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', style, children, ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: { background: 'var(--sd-color-primary-default)', color: 'var(--sd-color-primary-foreground)' },
    secondary: { background: 'var(--sd-color-secondary-default)', color: 'var(--sd-color-secondary-foreground)' },
    outline: { background: 'transparent', color: 'var(--sd-color-text-primary)', border: '1px solid var(--sd-color-border-default)' },
    success: { background: 'var(--sd-color-intent-success-bg)', color: 'var(--sd-color-intent-success)', border: '1px solid var(--sd-color-intent-success-border)' },
    warning: { background: 'var(--sd-color-intent-warning-bg)', color: 'var(--sd-color-intent-warning)', border: '1px solid var(--sd-color-intent-warning-border)' },
    danger: { background: 'var(--sd-color-intent-danger-bg)', color: 'var(--sd-color-intent-danger)', border: '1px solid var(--sd-color-intent-danger-border)' },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 'var(--sd-radius-full)',
        padding: '0.125rem var(--sd-space-2)',
        fontSize: 'var(--sd-font-size-xs)',
        fontWeight: 'var(--sd-font-weight-medium)' as React.CSSProperties['fontWeight'],
        fontFamily: 'var(--sd-font-body)',
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
        border: '1px solid transparent',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ style, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: 'var(--sd-color-bg-elevated)',
        border: '1px solid var(--sd-color-border-default)',
        borderRadius: 'var(--sd-radius-lg)',
        boxShadow: 'var(--sd-shadow-sm)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ style, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ padding: 'var(--sd-space-4) var(--sd-space-5) var(--sd-space-2)', ...style }} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ style, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      style={{
        margin: 0,
        fontFamily: 'var(--sd-font-heading)',
        fontSize: 'var(--sd-font-size-base)',
        fontWeight: 'var(--sd-font-weight-semibold)' as React.CSSProperties['fontWeight'],
        color: 'var(--sd-color-text-primary)',
        ...style,
      }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ style, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ padding: 'var(--sd-space-2) var(--sd-space-5) var(--sd-space-4)', ...style }} {...props}>
      {children}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

export function Alert({ variant = 'default', title, style, children, ...props }: AlertProps) {
  const variantStyles: Record<AlertVariant, React.CSSProperties> = {
    default: { background: 'var(--sd-color-bg-surface)', borderColor: 'var(--sd-color-border-default)' },
    info: { background: 'var(--sd-color-intent-info-bg)', borderColor: 'var(--sd-color-intent-info-border)' },
    success: { background: 'var(--sd-color-intent-success-bg)', borderColor: 'var(--sd-color-intent-success-border)' },
    warning: { background: 'var(--sd-color-intent-warning-bg)', borderColor: 'var(--sd-color-intent-warning-border)' },
    danger: { background: 'var(--sd-color-intent-danger-bg)', borderColor: 'var(--sd-color-intent-danger-border)' },
  };
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sd-space-1)',
        padding: 'var(--sd-space-3) var(--sd-space-4)',
        borderRadius: 'var(--sd-radius-md)',
        border: '1px solid',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {title && (
        <div style={{ fontWeight: 'var(--sd-font-weight-semibold)' as React.CSSProperties['fontWeight'], fontSize: 'var(--sd-font-size-sm)' }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Label + Input ────────────────────────────────────────────────────────────
export function Label({ style, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 'var(--sd-font-size-sm)',
        fontWeight: 'var(--sd-font-weight-medium)' as React.CSSProperties['fontWeight'],
        color: 'var(--sd-color-text-secondary)',
        marginBottom: 'var(--sd-space-1)',
        ...style,
      }}
      {...props}
    >
      {children}
    </label>
  );
}

export function Input({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{
        width: '100%',
        height: '2.5rem',
        padding: 'var(--sd-space-2) var(--sd-space-3)',
        background: 'var(--sd-color-bg-surface)',
        color: 'var(--sd-color-text-primary)',
        border: '1px solid var(--sd-color-border-default)',
        borderRadius: 'var(--sd-radius-md)',
        fontSize: 'var(--sd-font-size-sm)',
        fontFamily: 'var(--sd-font-body)',
        outline: 'none',
        transition: 'border-color 150ms ease',
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    />
  );
}

// ─── Tabs (Radix) ─────────────────────────────────────────────────────────────
export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ style, children, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    style={{
      display: 'flex',
      alignItems: 'center',
      background: 'var(--sd-color-bg-surface)',
      borderRadius: 'var(--sd-radius-lg)',
      padding: 'var(--sd-space-1)',
      gap: 'var(--sd-space-1)',
      ...style,
    }}
    {...props}
  >
    {children}
  </TabsPrimitive.List>
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ style, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    style={{
      flex: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--sd-space-1-5)',
      padding: 'var(--sd-space-2) var(--sd-space-3)',
      borderRadius: 'var(--sd-radius-md)',
      border: 'none',
      background: 'transparent',
      color: 'var(--sd-color-text-secondary)',
      fontSize: 'var(--sd-font-size-sm)',
      fontWeight: 'var(--sd-font-weight-medium)' as React.CSSProperties['fontWeight'],
      fontFamily: 'var(--sd-font-body)',
      cursor: 'pointer',
      transition: 'all 150ms ease',
      whiteSpace: 'nowrap',
      ...style,
    }}
    onMouseEnter={e => {
      const el = e.currentTarget;
      if (el.getAttribute('data-state') !== 'active') {
        el.style.background = 'var(--sd-color-bg-hover)';
        el.style.color = 'var(--sd-color-text-primary)';
      }
    }}
    onMouseLeave={e => {
      const el = e.currentTarget;
      if (el.getAttribute('data-state') !== 'active') {
        el.style.background = 'transparent';
        el.style.color = 'var(--sd-color-text-secondary)';
      }
    }}
    {...props}
  >
    {children}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = 'TabsTrigger';

// Apply active style via data-state attribute in CSS through inline approach
export function ActiveTabStyle() {
  return (
    <style>{`
      [data-state="active"][role="tab"] {
        background: var(--sd-color-primary-default) !important;
        color: var(--sd-color-primary-foreground) !important;
        box-shadow: var(--sd-shadow-sm);
      }
    `}</style>
  );
}

export const TabsContent = TabsPrimitive.Content;

// ─── Switch (Radix) ───────────────────────────────────────────────────────────
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ style, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    style={{
      position: 'relative',
      display: 'inline-flex',
      width: '2.75rem',
      height: '1.5rem',
      borderRadius: 'var(--sd-radius-full)',
      border: '2px solid transparent',
      background: 'var(--sd-color-secondary-default)',
      cursor: 'pointer',
      transition: 'background 150ms ease',
      flexShrink: 0,
      ...style,
    }}
    {...props}
  >
    <style>{`
      [data-state="checked"][role="switch"] {
        background: var(--sd-color-primary-default) !important;
      }
      [data-state="checked"][role="switch"] span[data-radix-switch-thumb] {
        transform: translateX(1.25rem);
      }
    `}</style>
    <SwitchPrimitive.Thumb
      style={{
        display: 'block',
        width: '1rem',
        height: '1rem',
        borderRadius: 'var(--sd-radius-full)',
        background: 'var(--sd-color-text-inverse)',
        boxShadow: 'var(--sd-shadow-sm)',
        transition: 'transform 150ms ease',
        transform: 'translateX(0)',
        margin: '1px',
      }}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';

// ─── Slider (Radix) ───────────────────────────────────────────────────────────
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ style, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      userSelect: 'none',
      touchAction: 'none',
      width: '100%',
      height: '1.25rem',
      cursor: 'pointer',
      ...style,
    }}
    {...props}
  >
    <SliderPrimitive.Track
      style={{
        position: 'relative',
        flexGrow: 1,
        height: '4px',
        background: 'var(--sd-color-secondary-default)',
        borderRadius: 'var(--sd-radius-full)',
        overflow: 'hidden',
      }}
    >
      <SliderPrimitive.Range
        style={{
          position: 'absolute',
          height: '100%',
          background: 'var(--sd-color-primary-default)',
          borderRadius: 'var(--sd-radius-full)',
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      style={{
        display: 'block',
        width: '1.25rem',
        height: '1.25rem',
        background: 'var(--sd-color-primary-default)',
        borderRadius: 'var(--sd-radius-full)',
        border: '2px solid var(--sd-color-bg-canvas)',
        boxShadow: 'var(--sd-shadow-sm)',
      }}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = 'Slider';

// ─── Select (Radix) ───────────────────────────────────────────────────────────
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ style, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--sd-space-2)',
      width: '100%',
      height: '2.5rem',
      padding: 'var(--sd-space-2) var(--sd-space-3)',
      background: 'var(--sd-color-bg-surface)',
      color: 'var(--sd-color-text-primary)',
      border: '1px solid var(--sd-color-border-default)',
      borderRadius: 'var(--sd-radius-md)',
      fontSize: 'var(--sd-font-size-sm)',
      fontFamily: 'var(--sd-font-body)',
      cursor: 'pointer',
      ...style,
    }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon style={{ color: 'var(--sd-color-icon-muted)' }}>▾</SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ style, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      style={{
        background: 'var(--sd-color-bg-elevated)',
        border: '1px solid var(--sd-color-border-default)',
        borderRadius: 'var(--sd-radius-md)',
        boxShadow: 'var(--sd-shadow-lg)',
        padding: 'var(--sd-space-1)',
        zIndex: 9999,
        minWidth: '8rem',
        ...style,
      }}
      {...props}
    >
      <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ style, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sd-space-2)',
      padding: 'var(--sd-space-2) var(--sd-space-3)',
      borderRadius: 'var(--sd-radius-sm)',
      fontSize: 'var(--sd-font-size-sm)',
      color: 'var(--sd-color-text-primary)',
      cursor: 'pointer',
      outline: 'none',
      ...style,
    }}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

// ─── Accordion (Radix) ────────────────────────────────────────────────────────
export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ style, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    style={{
      borderBottom: '1px solid var(--sd-color-border-muted)',
      ...style,
    }}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ style, children, ...props }, ref) => (
  <AccordionPrimitive.Header>
    <AccordionPrimitive.Trigger
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 'var(--sd-space-3) 0',
        background: 'none',
        border: 'none',
        color: 'var(--sd-color-text-primary)',
        fontFamily: 'var(--sd-font-body)',
        fontSize: 'var(--sd-font-size-sm)',
        fontWeight: 'var(--sd-font-weight-semibold)' as React.CSSProperties['fontWeight'],
        cursor: 'pointer',
        textAlign: 'left',
        ...style,
      }}
      {...props}
    >
      {children}
      <span style={{ transition: 'transform 200ms ease', fontSize: '0.75rem', color: 'var(--sd-color-icon-muted)' }}>▾</span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ style, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="accordion-content"
    style={{
      overflow: 'hidden',
      ...style,
    }}
    {...props}
  >
    <div style={{ paddingBottom: 'var(--sd-space-4)' }}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

// ─── RadioGroup (Radix) ───────────────────────────────────────────────────────
export const RadioGroup = RadioGroupPrimitive.Root;

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ style, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    style={{
      width: '1.25rem',
      height: '1.25rem',
      borderRadius: 'var(--sd-radius-full)',
      border: '2px solid var(--sd-color-border-default)',
      background: 'transparent',
      cursor: 'pointer',
      flexShrink: 0,
      ...style,
    }}
    {...props}
  >
    <style>{`
      [data-state="checked"][role="radio"] {
        border-color: var(--sd-color-primary-default) !important;
        background: var(--sd-color-primary-default) !important;
      }
    `}</style>
    <RadioGroupPrimitive.Indicator
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: 'var(--sd-radius-full)',
        background: 'var(--sd-color-primary-foreground)',
        display: 'block',
      }} />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

// ─── ToggleGroup (Radix) ──────────────────────────────────────────────────────
export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ style, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--sd-space-1-5)',
      ...style,
    }}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = 'ToggleGroup';

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ style, className, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn('platform-chip', className)}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sd-space-1) var(--sd-space-3)',
      borderRadius: 'var(--sd-radius-full)',
      border: '1px solid var(--sd-color-border-default)',
      background: 'transparent',
      color: 'var(--sd-color-text-secondary)',
      fontSize: 'var(--sd-font-size-xs)',
      fontWeight: 'var(--sd-font-weight-medium)' as React.CSSProperties['fontWeight'],
      cursor: 'pointer',
      transition: 'all 150ms ease',
      ...style,
    }}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Item>
));
ToggleGroupItem.displayName = 'ToggleGroupItem';

// ─── AlertDialog (Radix) ──────────────────────────────────────────────────────
export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ style, children, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--sd-color-bg-overlay)',
        zIndex: 'var(--sd-z-modal)' as React.CSSProperties['zIndex'],
        backdropFilter: 'blur(2px)',
      }}
    />
    <AlertDialogPrimitive.Content
      ref={ref}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--sd-color-bg-elevated)',
        border: '1px solid var(--sd-color-border-default)',
        borderRadius: 'var(--sd-radius-xl)',
        boxShadow: 'var(--sd-shadow-xl)',
        padding: 'var(--sd-space-6)',
        width: 'min(90vw, 28rem)',
        zIndex: 'calc(var(--sd-z-modal) + 1)' as React.CSSProperties['zIndex'],
        ...style,
      }}
      {...props}
    >
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ style, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    style={{
      margin: '0 0 var(--sd-space-2)',
      fontFamily: 'var(--sd-font-heading)',
      fontSize: 'var(--sd-font-size-lg)',
      fontWeight: 'var(--sd-font-weight-bold)' as React.CSSProperties['fontWeight'],
      color: 'var(--sd-color-text-primary)',
      ...style,
    }}
    {...props}
  />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ style, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    style={{
      margin: '0 0 var(--sd-space-5)',
      fontSize: 'var(--sd-font-size-sm)',
      color: 'var(--sd-color-text-secondary)',
      lineHeight: 'var(--sd-font-leading-relaxed)',
      ...style,
    }}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;

// ─── Separator ────────────────────────────────────────────────────────────────
export function Separator({ style }: { style?: React.CSSProperties }) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--sd-color-border-muted)',
        margin: 0,
        ...style,
      }}
    />
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
export function SectionHeading({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2
      style={{
        margin: '0 0 var(--sd-space-3)',
        fontFamily: 'var(--sd-font-heading)',
        fontSize: 'var(--sd-font-size-lg)',
        fontWeight: 'var(--sd-font-weight-semibold)' as React.CSSProperties['fontWeight'],
        color: 'var(--sd-color-text-primary)',
        ...style,
      }}
    >
      {children}
    </h2>
  );
}
