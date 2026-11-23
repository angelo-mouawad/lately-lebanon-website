"use client";

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FieldContext {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

const Ctx = createContext<FieldContext | null>(null);

/** Gives inputs inside a Field their id, aria-describedby and invalid state. */
export function useField() {
  return useContext(Ctx);
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  optionalLabel?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, optional, optionalLabel = "optional", className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <Ctx.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-muted">({optionalLabel})</span>}
        </label>
        {children}
        {error && (
          <p id={errorId} className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-sm text-muted">
            {hint}
          </p>
        )}
      </div>
    </Ctx.Provider>
  );
}

const control =
  "w-full border bg-paper px-3 text-[15px] text-ink placeholder:text-muted/70 transition-colors duration-150 focus:outline-none focus:border-ink disabled:bg-sand-deep disabled:text-muted";

function useControlProps(id?: string, invalid?: boolean) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  return {
    id: id ?? field?.id,
    "aria-describedby": field?.describedBy,
    "aria-invalid": isInvalid || undefined,
    className: cn(control, isInvalid ? "border-danger" : "border-line-strong"),
  };
}

interface InputProps extends ComponentProps<"input"> {
  invalid?: boolean;
}

export function Input({ className, id, invalid, ...props }: InputProps) {
  const p = useControlProps(id, invalid);
  return <input {...p} className={cn(p.className, "h-11", className)} {...props} />;
}

interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

export function Textarea({ className, id, invalid, rows = 4, ...props }: TextareaProps) {
  const p = useControlProps(id, invalid);
  return <textarea {...p} rows={rows} className={cn(p.className, "py-2.5 leading-relaxed", className)} {...props} />;
}

interface SelectProps extends ComponentProps<"select"> {
  invalid?: boolean;
}

export function Select({ className, id, invalid, children, ...props }: SelectProps) {
  const p = useControlProps(id, invalid);
  return (
    <div className="relative">
      <select {...p} className={cn(p.className, "h-11 pr-9", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-ink"
      >
        <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </div>
  );
}

interface MoneyInputProps extends Omit<ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** Value in cents, or null when empty. */
  value: number | null;
  onChange: (cents: number | null) => void;
  invalid?: boolean;
}

/** A dollar amount field. Shows dollars, stores cents. */
export function MoneyInput({ value, onChange, className, invalid, id, ...props }: MoneyInputProps) {
  const p = useControlProps(id, invalid);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">$</span>
      <input
        {...p}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value == null ? "" : (value / 100).toString()}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Math.round(Number(raw) * 100));
        }}
        className={cn(p.className, "h-11 pl-7 tabular-nums", className)}
        {...props}
      />
    </div>
  );
}

interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
  description?: ReactNode;
}

export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="peer mt-0.5 size-5 shrink-0 cursor-pointer border border-line-strong bg-paper checked:border-ink checked:bg-ink checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path d=%22M3.5 8.5l3 3 6-7%22 fill=%22none%22 stroke=%22%23fbf8f2%22 stroke-width=%222%22/></svg>')] bg-center bg-no-repeat"
        {...props}
      />
      <span className="flex flex-col">
        <span className="text-sm text-ink">{label}</span>
        {description && <span className="text-sm text-muted">{description}</span>}
      </span>
    </label>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

/** An on/off toggle with a visible text state, for settings like "Show on website". */
export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {description && <span className="text-sm text-muted">{description}</span>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 border transition-colors duration-150 disabled:opacity-50",
          checked ? "border-olive bg-olive" : "border-line-strong bg-sand-deep",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 size-[22px] bg-paper transition-transform duration-150",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
