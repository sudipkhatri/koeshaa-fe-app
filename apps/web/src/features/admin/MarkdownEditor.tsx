"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { useMessages } from "@/lib/locale";

import { FieldLabel } from "./admin-ui";
import { applyFormat, parseMarkdown, type Block, type FormatName, type Inline } from "./markdown";

const FORMATS = ["heading", "bold", "italic", "list", "numbered", "quote", "link"] as const;

export function MarkdownEditor({
  id,
  label,
  value,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  error?: string | undefined;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const { translate } = useMessages();
  const area = useRef<HTMLTextAreaElement>(null);
  const pending = useRef<{ start: number; end: number } | null>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const samples: Record<FormatName, string> = {
    bold: translate("admin.boldSample"),
    italic: translate("admin.italicSample"),
    heading: translate("admin.headingSample"),
    list: translate("admin.listSample"),
    numbered: translate("admin.listSample"),
    quote: translate("admin.quoteSample"),
    link: translate("admin.linkSample"),
  };
  const names: Record<(typeof FORMATS)[number], string> = {
    heading: translate("admin.formatHeading"),
    bold: translate("admin.formatBold"),
    italic: translate("admin.formatItalic"),
    list: translate("admin.formatList"),
    numbered: translate("admin.formatNumbered"),
    quote: translate("admin.formatQuote"),
    link: translate("admin.formatLink"),
  };

  useEffect(() => {
    const field = area.current;
    const range = pending.current;
    if (!field || !range) return;
    field.focus();
    field.setSelectionRange(range.start, range.end);
    pending.current = null;
  }, [value]);

  function format(kind: FormatName) {
    const field = area.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const next = applyFormat(value, start, end, kind, samples[kind]);
    pending.current = { start: next.selectionStart, end: next.selectionEnd };
    setMode("write");
    onChange(next.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!event.metaKey && !event.ctrlKey) return;
    const key = event.key.toLowerCase();
    const kind = key === "b" ? "bold" : key === "i" ? "italic" : key === "k" ? "link" : null;
    if (!kind) return;
    event.preventDefault();
    format(kind);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className={`overflow-hidden rounded-square border bg-admin-surface ${error ? "border-admin-danger" : "border-admin-border"}`}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-admin-rule bg-admin-page p-1.5">
          <div
            role="toolbar"
            aria-label={translate("admin.formatting")}
            className="flex flex-wrap gap-1"
          >
            {FORMATS.map((kind) => (
              <button
                key={kind}
                type="button"
                className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-2.5 text-caption font-semibold text-admin-ink hover:bg-admin-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => format(kind)}
              >
                {names[kind]}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label={translate("admin.editorMode")}
            className="ms-auto flex gap-0.5 rounded-lg bg-admin-subtle p-0.5"
          >
            {(["write", "preview"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                className={`min-h-11 cursor-pointer rounded-md px-3 text-caption font-semibold ${mode === item ? "bg-admin-surface text-admin-ink" : "text-admin-soft"}`}
                onClick={() => setMode(item)}
              >
                {translate(item === "write" ? "admin.write" : "admin.preview")}
              </button>
            ))}
          </div>
        </div>
        {mode === "write" ? (
          <textarea
            ref={area}
            id={id}
            rows={16}
            value={value}
            aria-invalid={error ? true : undefined}
            placeholder={translate("admin.bodyPlaceholder")}
            className="min-h-80 w-full resize-y bg-admin-surface px-4 py-4 text-body leading-relaxed text-admin-ink placeholder:text-admin-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
          />
        ) : (
          <MarkdownView id={id} source={value} empty={translate("admin.nothingToPreview")} />
        )}
      </div>
      {error ? <p className="text-micro text-admin-danger">{error}</p> : null}
    </div>
  );
}

function MarkdownView({ id, source, empty }: { id: string; source: string; empty: string }) {
  const blocks = parseMarkdown(source);
  if (blocks.length === 0) {
    return (
      <p id={id} className="min-h-80 px-4 py-4 text-body text-admin-soft">
        {empty}
      </p>
    );
  }
  return (
    <article
      id={id}
      className="flex min-h-80 flex-col gap-3 px-4 py-4 text-body leading-relaxed text-admin-ink"
    >
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "heading") {
    const Tag = block.level === 3 ? "h3" : "h2";
    const size =
      block.level === 1 ? "text-title" : block.level === 2 ? "text-heading" : "text-body";
    return (
      <Tag className={`${size} font-semibold`}>
        <InlineText nodes={block.text} />
      </Tag>
    );
  }
  if (block.type === "quote") {
    return (
      <blockquote className="border-s-2 border-admin-border ps-3 text-admin-soft">
        <InlineText nodes={block.text} />
      </blockquote>
    );
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag className={`ps-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineText nodes={item} />
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <p>
      <InlineText nodes={block.text} />
    </p>
  );
}

function InlineText({ nodes }: { nodes: Inline[] }) {
  return nodes.map((node, index) => {
    if (node.type === "bold") return <strong key={index}>{node.text}</strong>;
    if (node.type === "italic") return <em key={index}>{node.text}</em>;
    if (node.type === "code") {
      return (
        <code key={index} className="rounded-square bg-admin-page px-1 text-caption">
          {node.text}
        </code>
      );
    }
    if (node.type === "link") {
      return (
        <a
          key={index}
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {node.text}
        </a>
      );
    }
    return <span key={index}>{node.text}</span>;
  });
}
