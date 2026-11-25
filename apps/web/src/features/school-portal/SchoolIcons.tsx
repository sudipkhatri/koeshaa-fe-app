const paths = {
  overview: (
    <path d="M3.5 8.5 10 3.5l6.5 5v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
  ),
  students: (
    <>
      <circle cx="8" cy="7.5" r="2.6" />
      <path
        d="M3.5 16c0-2.5 2-4.2 4.5-4.2s4.5 1.7 4.5 4.2M13.5 6.2a2.3 2.3 0 0 1 0 4.4"
        strokeLinecap="round"
      />
    </>
  ),
  import: (
    <path
      d="M10 13V4.5M6.8 7.8 10 4.5l3.2 3.3M4 13.5v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  progress: <path d="M4 16V9M8 16V5M12 16v-4M16 16v-8" strokeLinecap="round" />,
  people: (
    <>
      <circle cx="7" cy="7" r="2.4" />
      <circle cx="13.5" cy="8" r="2" />
      <path
        d="M3 15.5c0-2.2 1.8-3.6 4-3.6s4 1.4 4 3.6M12 15.5c0-1.6.9-2.8 2.4-2.8 1.4 0 2.6 1 2.6 2.8"
        strokeLinecap="round"
      />
    </>
  ),
  details: (
    <>
      <path d="M4 16.5v-9L10 4l6 3.5v9" strokeLinejoin="round" />
      <path d="M8 16.5v-4h4v4" />
    </>
  ),
} as const;

export type SchoolIconName = keyof typeof paths;

export function SchoolIcon({
  name,
  className = "size-4.5",
}: {
  name: SchoolIconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={`shrink-0 ${className}`}
    >
      {paths[name]}
    </svg>
  );
}
