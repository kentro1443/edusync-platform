import {
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink-900)] shadow-[var(--shadow-inset)] transition-[border-color,box-shadow,background-color] placeholder:text-[var(--color-ink-400)] hover:border-[var(--color-ink-400)] focus:border-[var(--color-brand-500)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-100)] disabled:cursor-not-allowed disabled:bg-[var(--color-ink-50)] disabled:text-[var(--color-ink-400)] aria-[invalid=true]:border-[var(--color-danger-600)] aria-[invalid=true]:ring-[var(--color-danger-100)]";

export function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[var(--color-ink-800)]">
      {children}
      {required ? (
        <span className="ml-1 text-[var(--color-danger-600)]" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

type DescribedControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function Field({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactElement<DescribedControlProps>;
  className?: string;
}) {
  const describedBy = [
    description ? `${id}-description` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
        {required ? <span className="sr-only"> (bắt buộc)</span> : null}
      </Label>
      {control}
      {description ? (
        <p id={`${id}-description`} className="text-xs leading-relaxed text-[var(--color-ink-500)]">
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium leading-relaxed text-[var(--color-danger-600)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={cn(fieldClass, className)} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={cn(fieldClass, "min-h-32 resize-y", className)} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={cn(fieldClass, className)} {...rest} />;
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  description?: ReactNode;
}) {
  const id = props.id ?? props.name;
  return (
    <label className={cn("flex items-start gap-3 text-sm", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-[var(--color-ink-300)] accent-[var(--color-brand-700)]"
        {...props}
      />
      <span>
        <span className="block font-medium text-[var(--color-ink-800)]">{label}</span>
        {description ? (
          <span id={id ? `${id}-description` : undefined} className="mt-0.5 block text-xs text-[var(--color-ink-500)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function Radio(props: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  const { label, className, ...inputProps } = props;
  return (
    <label className={cn("flex items-center gap-2.5 text-sm font-medium text-[var(--color-ink-800)]", className)}>
      <input
        type="radio"
        className="h-4 w-4 border-[var(--color-ink-300)] accent-[var(--color-brand-700)]"
        {...inputProps}
      />
      {label}
    </label>
  );
}

export function Switch({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  description?: ReactNode;
}) {
  return (
    <label className={cn("flex items-center justify-between gap-4", className)}>
      <span>
        <span className="block text-sm font-medium text-[var(--color-ink-800)]">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-[var(--color-ink-500)]">{description}</span> : null}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-full bg-[var(--color-ink-300)] transition-colors peer-checked:bg-[var(--color-brand-700)] peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--color-brand-100)]" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
