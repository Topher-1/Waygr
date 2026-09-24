import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--orange)] text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50",
  secondary:
    "bg-[var(--raised)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-50",
  ghost: "text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-xl px-5 py-3 text-base font-semibold transition-opacity ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
