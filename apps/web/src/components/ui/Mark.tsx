export function Mark({ tone = "brand" }: { tone?: "brand" | "inverse" }) {
  const frame =
    tone === "inverse"
      ? "h-9 w-9 rounded-xl bg-canvas text-lg text-primary"
      : "h-8 w-8 rounded-lg bg-primary text-lg text-on-primary";
  return (
    <span
      className={`inline-flex items-center justify-center font-extrabold ${frame}`}
      aria-hidden="true"
    >
      K
    </span>
  );
}
