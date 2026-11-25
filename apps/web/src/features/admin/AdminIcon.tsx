const paths = {
  overview: (
    <path d="M3.5 8.5 10 3.5l6.5 5v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
  ),
  accounts: (
    <>
      <circle cx="8" cy="7.5" r="2.6" />
      <path
        d="M3.5 16c0-2.5 2-4.2 4.5-4.2s4.5 1.7 4.5 4.2M13.5 6.2a2.3 2.3 0 0 1 0 4.4"
        strokeLinecap="round"
      />
    </>
  ),
  roles: (
    <path
      d="M10 3 16 5.5v4.2c0 3.4-2.4 6.2-6 7.3-3.6-1.1-6-3.9-6-7.3V5.5Z"
      strokeLinejoin="round"
    />
  ),
  curriculum: (
    <>
      <path d="M4 15.5V5a1.5 1.5 0 0 1 1.5-1.5H15a1 1 0 0 1 1 1v9.5" strokeLinejoin="round" />
      <path d="M5.5 14.5H16v2H5.5a1.5 1.5 0 0 1 0-3" strokeLinejoin="round" />
    </>
  ),
  content: (
    <>
      <path d="M4 4.5h5a2 2 0 0 1 2 2v9a1.6 1.6 0 0 0-1.6-1.6H4Z" strokeLinejoin="round" />
      <path d="M16 4.5h-5a2 2 0 0 0-2 2v9a1.6 1.6 0 0 1 1.6-1.6H16Z" strokeLinejoin="round" />
    </>
  ),
  releases: (
    <>
      <path d="M10 3.5 16.5 7v6L10 16.5 3.5 13V7Z" strokeLinejoin="round" />
      <path d="M3.5 7 10 10.5 16.5 7M10 10.5v6" />
    </>
  ),
  requests: (
    <>
      <path d="M4 6.5h9M11 4l2.5 2.5L11 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 13.5H7M9 11l-2.5 2.5L9 16" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  leads: (
    <>
      <path d="M3.5 5.5h13v9h-13Z" strokeLinejoin="round" />
      <path d="m3.5 6 6.5 4.5L16.5 6" />
    </>
  ),
  schools: (
    <>
      <path d="M4 16.5v-9L10 4l6 3.5v9" strokeLinejoin="round" />
      <path d="M8 16.5v-4h4v4" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.5" />
      <path
        d="M10 3v2M10 15v2M3 10h2M15 10h2M5 5l1.5 1.5M13.5 13.5 15 15M15 5l-1.5 1.5M6.5 13.5 5 15"
        strokeLinecap="round"
      />
    </>
  ),
  webhooks: (
    <path
      d="M7.5 8.5 5 11a3 3 0 0 0 4.2 4.2l1.3-1.3M12.5 11.5 15 9a3 3 0 0 0-4.2-4.2L9.5 6.1"
      strokeLinecap="round"
    />
  ),
  deliveries: <path d="m3.5 10.5 13-6-5 13-2-5Z" strokeLinejoin="round" />,
  sitePages: (
    <>
      <path d="M5.5 3.5h9v13h-9Z" strokeLinejoin="round" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" />
    </>
  ),
  collapse: (
    <>
      <path d="M11.5 5 6.5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 5.5v9" strokeLinecap="round" />
    </>
  ),
  expand: (
    <>
      <path d="M8.5 5 13.5 10l-5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 5.5v9" strokeLinecap="round" />
    </>
  ),
  alert: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v4.2M10 13.6v.2" strokeLinecap="round" />
    </>
  ),
  view: (
    <>
      <path d="M1.8 10S4.9 4.8 10 4.8 18.2 10 18.2 10 15.1 15.2 10 15.2 1.8 10 1.8 10Z" />
      <circle cx="10" cy="10" r="2.4" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9.3v4.2M10 6.4v.2" strokeLinecap="round" />
    </>
  ),
  chevronDown: <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronLeft: <path d="M12 5 7 10l5 5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronRight: <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />,
  plus: <path d="M10 4.5v11M4.5 10h11" strokeLinecap="round" />,
} as const;

export type AdminIconName = keyof typeof paths;

export function AdminIcon({
  name,
  className = "size-4.5",
  strokeWidth = 1.6,
}: {
  name: AdminIconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={`shrink-0 ${className}`}
    >
      {paths[name]}
    </svg>
  );
}
