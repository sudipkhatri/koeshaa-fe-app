"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
} from "react";

type Option = { value: string; label: string };

type ChoiceFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label: string;
  error?: string | undefined;
  /** Opens over the content above the control, so a card edge cannot cover the list. */
  placement?: "below" | "above";
  children: ReactNode;
  ref?: Ref<HTMLSelectElement>;
};

function readOptions(children: ReactNode): Option[] {
  const options: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode }>(child)) return;
    if (child.type !== "option") return;
    const value = child.props.value == null ? "" : String(child.props.value);
    const text = child.props.children;
    options.push({ value, label: text == null ? value : String(text) });
  });
  return options;
}

export function ChoiceField({
  label,
  error,
  placement = "below",
  children,
  value,
  defaultValue,
  name,
  onChange,
  onBlur,
  disabled,
  ref,
}: ChoiceFieldProps) {
  const options = readOptions(children);
  const buttonId = useId();
  const listId = useId();
  const errorId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(String(defaultValue ?? ""));
  const selected = value === undefined ? uncontrolled : String(value);
  const selectedLabel = options.find((option) => option.value === selected)?.label ?? "";

  useEffect(() => {
    if (value !== undefined) return;
    const current = selectRef.current?.value;
    if (current) setUncontrolled(current);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function setSelectRef(node: HTMLSelectElement | null) {
    selectRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  function choose(next: string) {
    if (value === undefined) setUncontrolled(next);
    setOpen(false);
    onChange?.({
      target: { value: next, name: name ?? "" },
      currentTarget: { value: next, name: name ?? "" },
    } as ChangeEvent<HTMLSelectElement>);
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <label
        htmlFor={buttonId}
        className="text-micro font-semibold tracking-widest text-admin-soft uppercase"
      >
        {label}
      </label>
      <select
        ref={setSelectRef}
        name={name}
        value={selected}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          if (value === undefined) setUncontrolled(event.target.value);
          onChange?.(event);
        }}
        onBlur={onBlur}
      >
        {children}
      </select>
      <div className="relative">
        <button
          id={buttonId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-describedby={error ? errorId : undefined}
          onClick={() => setOpen((current) => !current)}
          className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-square border bg-admin-surface pr-3 pl-3 text-left text-admin-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 md:min-h-10 ${error ? "border-danger" : "border-admin-border"}`}
        >
          <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
          <Chevron />
        </button>
        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={buttonId}
            className={`absolute z-30 max-h-72 w-full overflow-y-auto rounded-xl border border-admin-border bg-admin-surface p-1 shadow-card ${placement === "above" ? "bottom-full mb-1" : "mt-1"}`}
          >
            {options.map((option) => {
              const current = option.value === selected;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={current}
                    onClick={() => choose(option.value)}
                    className={`flex min-h-12 w-full cursor-pointer items-center rounded-lg px-2.5 text-left md:min-h-9 ${current ? "bg-primary-tint font-semibold text-admin-on-tint" : "text-admin-ink hover:bg-admin-page"}`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4 shrink-0 text-admin-soft"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
