import { describe, expect, it } from "vitest";

import { applyFormat, parseMarkdown } from "./markdown";

describe("markdown editor", () => {
  it("wraps the selection and removes the wrap when used again", () => {
    const wrapped = applyFormat("Keep this promise", 5, 9, "bold", "bold");
    expect(wrapped.value).toBe("Keep **this** promise");
    expect(wrapped.selectionStart).toBe(7);
    expect(wrapped.selectionEnd).toBe(11);
    const plain = applyFormat(
      wrapped.value,
      wrapped.selectionStart,
      wrapped.selectionEnd,
      "bold",
      "bold",
    );
    expect(plain.value).toBe("Keep this promise");
  });

  it("inserts a heading on the current line", () => {
    const next = applyFormat("Intro", 0, 5, "heading", "Heading");
    expect(next.value).toBe("## Intro");
  });

  it("keeps an https link and leaves a script link as text", () => {
    const blocks = parseMarkdown(
      "# Terms\n\nA [site](https://keoshaa.com) and [bad](javascript:alert(1)).",
    );
    expect(blocks[0]).toMatchObject({ type: "heading", level: 1 });
    const paragraph = blocks[1];
    expect(paragraph?.type).toBe("paragraph");
    if (paragraph?.type !== "paragraph") return;
    expect(paragraph.text).toContainEqual({
      type: "link",
      text: "site",
      href: "https://keoshaa.com/",
    });
    expect(
      paragraph.text.some((node) => node.type === "text" && node.text.includes("javascript:")),
    ).toBe(true);
    expect(paragraph.text.some((node) => node.type === "link" && node.text === "bad")).toBe(false);
  });
});
