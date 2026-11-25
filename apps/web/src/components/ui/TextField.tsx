"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export { ChoiceField } from "./ChoiceField";

const fieldClass = "min-h-12 w-full rounded-card bg-surface px-3 text-text";
const fieldBorder = "border border-border";
const fieldFocus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const borderedFieldClass = `${fieldClass} ${fieldBorder} ${fieldFocus}`;

function FieldFrame({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: (ids: { inputId: string; errorId: string }) => ReactNode;
}) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="font-medium">
        {label}
      </label>
      {children({ inputId, errorId })}
      {hint ? <p className="text-text-muted">{hint}</p> : null}
      {error ? (
        <p id={errorId} className="text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  trailing?: ReactNode;
};

export function TextField({ label, error, hint, trailing, className, ...props }: TextFieldProps) {
  return (
    <FieldFrame label={label} error={error} hint={hint}>
      {({ inputId, errorId }) => {
        const input = (
          <input
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
            className={
              trailing
                ? `${fieldClass} border-0 bg-transparent outline-none ${className ?? ""}`
                : `${borderedFieldClass} ${className ?? ""}`
            }
          />
        );
        if (!trailing) return input;
        return (
          <div
            className={`flex items-center rounded-card bg-surface pr-1 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${fieldBorder}`}
          >
            {input}
            {trailing}
          </div>
        );
      }}
    </FieldFrame>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string | undefined;
};

export function TextArea({ label, error, ...props }: TextAreaProps) {
  return (
    <FieldFrame label={label} error={error}>
      {({ inputId, errorId }) => (
        <textarea
          id={inputId}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${borderedFieldClass} min-h-28 py-3`}
          {...props}
        />
      )}
    </FieldFrame>
  );
}
