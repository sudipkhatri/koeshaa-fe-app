import { Text } from "@/components/ui";

/** Shows `text` with the first match of `query` marked. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <Text className="bg-primary-tint font-ui-bold text-on-primary-tint">
        {text.slice(at, at + q.length)}
      </Text>
      {text.slice(at + q.length)}
    </>
  );
}
