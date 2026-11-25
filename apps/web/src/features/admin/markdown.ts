export type FormatName = "bold" | "italic" | "heading" | "list" | "numbered" | "quote" | "link";

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string };

export type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: Inline[] }
  | { type: "quote"; text: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "paragraph"; text: Inline[] };

type Edit = { value: string; selectionStart: number; selectionEnd: number };

/** Wrap the selection, or prefix its lines, the way a Markdown toolbar does. */
export function applyFormat(
  value: string,
  start: number,
  end: number,
  format: FormatName,
  sample: string,
): Edit {
  const from = clamp(start, 0, value.length);
  const to = clamp(end, from, value.length);
  if (format === "bold") return wrap(value, from, to, "**", "**", sample);
  if (format === "italic") return wrap(value, from, to, "*", "*", sample);
  if (format === "link") return insertLink(value, from, to, sample);
  return prefixLines(value, from, to, format, sample);
}

/** Turn Markdown into blocks. Links are kept only for http and https. */
export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const headingText = heading?.[2];
    const marks = heading?.[1];
    if (headingText && marks) {
      const level = marks.length === 1 ? 1 : marks.length === 2 ? 2 : 3;
      blocks.push({ type: "heading", level, text: parseInline(headingText) });
      index += 1;
      continue;
    }
    if (line.startsWith(">")) {
      const parts: string[] = [];
      while (index < lines.length && (lines[index] ?? "").startsWith(">")) {
        parts.push((lines[index] ?? "").replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: parseInline(parts.join(" ")) });
      continue;
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const items: Inline[][] = [];
      const pattern = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (index < lines.length && pattern.test(lines[index] ?? "")) {
        items.push(parseInline((lines[index] ?? "").replace(pattern, "")));
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    const parts: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() !== "" &&
      !blockStart(lines[index] ?? "")
    ) {
      parts.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push({ type: "paragraph", text: parseInline(parts.join(" ")) });
  }
  return blocks;
}

function wrap(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  sample: string,
): Edit {
  const selected = value.slice(start, end);
  const open = start - before.length;
  if (
    selected.length > 0 &&
    value.slice(open, start) === before &&
    value.slice(end, end + after.length) === after
  ) {
    return {
      value: value.slice(0, open) + selected + value.slice(end + after.length),
      selectionStart: open,
      selectionEnd: open + selected.length,
    };
  }
  const inner = selected.length > 0 ? selected : sample;
  return {
    value: value.slice(0, start) + before + inner + after + value.slice(end),
    selectionStart: start + before.length,
    selectionEnd: start + before.length + inner.length,
  };
}

function insertLink(value: string, start: number, end: number, sample: string): Edit {
  const label = value.slice(start, end) || sample;
  const href = "https://";
  const inserted = `[${label}](${href})`;
  const selectionStart = start + label.length + 3;
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    selectionStart,
    selectionEnd: selectionStart + href.length,
  };
}

function prefixLines(
  value: string,
  start: number,
  end: number,
  format: FormatName,
  sample: string,
): Edit {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const breakAt = value.indexOf("\n", end);
  const lineEnd = breakAt === -1 ? value.length : breakAt;
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const source = lines.every((line) => line.trim() === "") ? [sample] : lines;
  const prefixed = source
    .map((line, index) => {
      const mark =
        format === "numbered"
          ? `${index + 1}. `
          : format === "heading"
            ? "## "
            : format === "quote"
              ? "> "
              : "- ";
      return line.startsWith(mark) ? line.slice(mark.length) : mark + line;
    })
    .join("\n");
  return {
    value: value.slice(0, lineStart) + prefixed + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + prefixed.length,
  };
}

function parseInline(source: string): Inline[] {
  const nodes: Inline[] = [];
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) nodes.push({ type: "text", text: source.slice(last, at) });
    const code = match[1];
    const bold = match[2];
    const italic = match[3];
    const label = match[4];
    const href = match[5];
    if (code !== undefined) nodes.push({ type: "code", text: code });
    else if (bold !== undefined) nodes.push({ type: "bold", text: bold });
    else if (italic !== undefined) nodes.push({ type: "italic", text: italic });
    else if (label !== undefined && href !== undefined) {
      const safe = safeHref(href);
      nodes.push(
        safe ? { type: "link", text: label, href: safe } : { type: "text", text: match[0] },
      );
    }
    last = at + match[0].length;
  }
  if (last < source.length) nodes.push({ type: "text", text: source.slice(last) });
  return nodes;
}

function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

function blockStart(line: string): boolean {
  return (
    /^(#{1,3})\s+/.test(line) ||
    line.startsWith(">") ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line)
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
