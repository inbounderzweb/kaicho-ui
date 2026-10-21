"use client";

import type { ReactNode } from "react";
import { useFormContext, type FieldValues } from "react-hook-form";

export const FIELD =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark disabled:opacity-50 dark:border-admin-border-dark dark:bg-admin-surface-dark";
export const LABEL = "mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";
export const CARD =
  "space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";
export const ERR = "mt-1 text-xs text-red-600 dark:text-red-400";
export const HINT = "mt-1 text-xs text-black/45 dark:text-white/45";

/** Read a nested error message ("timing.shared.initialDelaySeconds"). */
export function errorAt(errors: unknown, path: string): string | undefined {
  let cur = errors as Record<string, unknown> | undefined;
  for (const key of path.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[key] as Record<string, unknown> | undefined;
  }
  return typeof cur?.message === "string" ? cur.message : undefined;
}

export function NumberField({
  name,
  label,
  unit = "seconds",
  hint,
  disabled,
}: {
  name: string;
  label: string;
  unit?: string;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const { register, formState } = useFormContext<FieldValues>();
  const err = errorAt(formState.errors, name);
  return (
    <div>
      <label className={LABEL} htmlFor={name}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={name}
          type="number"
          inputMode="numeric"
          disabled={disabled}
          aria-invalid={err ? true : undefined}
          {...register(name, { valueAsNumber: true })}
          className={FIELD}
        />
        <span className="shrink-0 text-xs text-black/45 dark:text-white/45">{unit}</span>
      </div>
      {err ? <p className={ERR}>{err}</p> : hint ? <p className={HINT}>{hint}</p> : null}
    </div>
  );
}

export function ToggleField({
  name,
  label,
  hint,
  disabled,
  onToggle,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  disabled?: boolean;
  onToggle?: (checked: boolean) => void;
}) {
  const { register, formState } = useFormContext<FieldValues>();
  const err = errorAt(formState.errors, name);
  const reg = register(name);
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          disabled={disabled}
          {...reg}
          onChange={(e) => {
            void reg.onChange(e);
            onToggle?.(e.target.checked);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-admin-primary-dark)]"
        />
        <span>
          <span className="text-sm font-semibold">{label}</span>
          {hint && <span className={`block ${HINT} mt-0`}>{hint}</span>}
        </span>
      </label>
      {err && <p className={ERR}>{err}</p>}
    </div>
  );
}

export function SelectField({
  name,
  label,
  options,
  hint,
  disabled,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const { register, formState } = useFormContext<FieldValues>();
  const err = errorAt(formState.errors, name);
  return (
    <div>
      <label className={LABEL} htmlFor={name}>
        {label}
      </label>
      <select id={name} disabled={disabled} {...register(name)} className={FIELD}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {err ? <p className={ERR}>{err}</p> : hint ? <p className={HINT}>{hint}</p> : null}
    </div>
  );
}

export function TextField({
  name,
  label,
  placeholder,
  hint,
  multiline,
  maxLength,
}: {
  name: string;
  label: string;
  placeholder?: string;
  hint?: ReactNode;
  multiline?: boolean;
  maxLength?: number;
}) {
  const { register, formState } = useFormContext<FieldValues>();
  const err = errorAt(formState.errors, name);
  return (
    <div>
      <label className={LABEL} htmlFor={name}>
        {label}
      </label>
      {multiline ? (
        <textarea id={name} rows={3} maxLength={maxLength} placeholder={placeholder} {...register(name)} className={FIELD} />
      ) : (
        <input id={name} type="text" maxLength={maxLength} placeholder={placeholder} {...register(name)} className={FIELD} />
      )}
      {err ? <p className={ERR}>{err}</p> : hint ? <p className={HINT}>{hint}</p> : null}
    </div>
  );
}
