"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/** Labelled text input with inline error; password type gets a show/hide toggle. */
const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, error, id, type = "text", className = "", ...rest },
  ref
) {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink-muted">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`w-full rounded-xl border bg-cream/50 px-4 py-3 text-sm font-semibold text-ink outline-none transition-all focus:border-forest focus:ring-[3px] focus:ring-forest/10 ${
            error ? "border-sale" : "border-border"
          } ${isPassword ? "pr-16" : ""} ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-ink-muted hover:text-forest"
          >
            {shown ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 animate-fade-up text-xs font-semibold text-sale">
          {error}
        </p>
      )}
    </div>
  );
});

export default AuthField;
