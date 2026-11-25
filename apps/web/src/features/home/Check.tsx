export function Check({ className = "text-primary" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-5 w-5 shrink-0 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 10.5 8.5 14.5 15.5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
