import type {
  ComponentPropsWithoutRef,
  ElementType,
  HTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from "react";

const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-panel",
  secondary: "border-stroke-soft bg-surface-glass text-ink-950 shadow-soft",
  ghost: "border-stroke-soft bg-white/70 text-ink-950",
  danger: "border-stroke-soft bg-white/70 text-danger-700"
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 py-3 text-sm max-[640px]:min-h-10 max-[640px]:px-3.5 max-[640px]:py-2.5",
  md: "min-h-12 px-5 py-3.5 text-sm max-[640px]:min-h-11 max-[640px]:px-4 max-[640px]:py-3"
};

export function Button({
  className,
  fullWidth = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-action border font-semibold transition duration-150 ease-out hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0",
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      type={type}
      {...props}
    />
  );
}

type PanelProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Panel<T extends ElementType = "section">({
  as,
  children,
  className,
  ...props
}: PanelProps<T>) {
  const Component = as || "section";

  return (
    <Component
      className={cx(
        "rounded-panel border border-stroke-soft bg-surface-glass p-6 shadow-panel backdrop-blur-xl max-[640px]:p-4",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Card<T extends ElementType = "article">({
  as,
  children,
  className,
  ...props
}: PanelProps<T>) {
  const Component = as || "article";

  return (
    <Component
      className={cx(
        "rounded-card border border-stroke-softer bg-surface-glass p-4.5 shadow-soft backdrop-blur-xl max-[640px]:p-4",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

type EyebrowProps = HTMLAttributes<HTMLParagraphElement>;

export function Eyebrow({ className, ...props }: EyebrowProps) {
  return (
    <p
      className={cx(
        "m-0 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-brand-700",
        className
      )}
      {...props}
    />
  );
}

type PanelHeadingProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function PanelHeading({
  className,
  description,
  icon,
  title
}: PanelHeadingProps) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <h2 className="m-0 inline-flex items-center gap-2 text-[clamp(1.4rem,2vw,2rem)] font-semibold text-ink-950">
        {icon}
        <span>{title}</span>
      </h2>
      {description ? <p className="m-0 text-ink-700">{description}</p> : null}
    </div>
  );
}

type FieldProps = HTMLAttributes<HTMLLabelElement> & {
  label: ReactNode;
};

export function Field({ className, children, label, ...props }: FieldProps) {
  return (
    <label className={cx("mt-2 flex flex-col gap-2", className)} {...props}>
      <span className="text-sm font-semibold text-ink-800">{label}</span>
      {children}
    </label>
  );
}

type InputProps = ComponentPropsWithoutRef<"input">;
type SelectProps = ComponentPropsWithoutRef<"select">;
type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const controlClassName =
  "w-full rounded-control border border-stroke-soft bg-surface-warm px-4 py-3.5 text-ink-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 max-[640px]:px-3.5 max-[640px]:py-3";

export function TextInput({ className, ...props }: InputProps) {
  return <input className={cx(controlClassName, className)} {...props} />;
}

export function SelectInput({ className, ...props }: SelectProps) {
  return <select className={cx(controlClassName, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextAreaProps) {
  return <textarea className={cx(controlClassName, className)} {...props} />;
}

type StatusTone = "default" | "ready" | "neutral" | "danger";

const statusToneClasses: Record<StatusTone, string> = {
  default: "bg-ink-950/6 text-ink-800",
  ready: "bg-success-100 text-success-700",
  neutral: "bg-warning-100 text-warning-700",
  danger: "bg-danger-100 text-danger-700"
};

type StatusChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
};

export function StatusChip({
  children,
  className,
  tone = "default",
  ...props
}: StatusChipProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium",
        statusToneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

type BannerTone = "info" | "success" | "error";

const bannerToneClasses: Record<BannerTone, string> = {
  info: "bg-ink-950/8 text-ink-800",
  success: "bg-success-100 text-success-700",
  error: "bg-danger-100 text-danger-700"
};

type BannerProps = HTMLAttributes<HTMLParagraphElement> & {
  tone?: BannerTone;
  icon?: ReactNode;
};

export function Banner({
  children,
  className,
  icon,
  tone = "info",
  ...props
}: BannerProps) {
  return (
    <p
      className={cx(
        "mt-4 inline-flex items-center gap-2 rounded-card px-3.5 py-3 text-sm",
        bannerToneClasses[tone],
        className
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </p>
  );
}

export function Divider({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "my-7 h-px bg-[linear-gradient(90deg,rgba(20,48,74,0.06),rgba(20,48,74,0.18),rgba(20,48,74,0.06))]",
        className
      )}
      {...props}
    />
  );
}

type EmptyStateProps = HTMLAttributes<HTMLParagraphElement> & {
  icon?: ReactNode;
};

export function EmptyState({
  children,
  className,
  icon,
  ...props
}: EmptyStateProps) {
  return (
    <p
      className={cx(
        "mt-4 inline-flex items-center gap-2 rounded-card bg-ink-950/8 px-3.5 py-3 text-sm text-ink-800",
        className
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </p>
  );
}
