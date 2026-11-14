"use client";
import { useEffect, useState } from "react";
export function cleanRichHtml(html: string, inline = false) {
  if (typeof DOMParser === "undefined") return "";
  const source = new DOMParser().parseFromString(html, "text/html"),
    target = document.createElement("div"),
    allowed = new Set([
      "P",
      "BR",
      "DIV",
      "SPAN",
      "B",
      "STRONG",
      "I",
      "EM",
      "U",
      "UL",
      "OL",
      "LI",
      "FONT",
    ]);
  // inline 模式：把块级标签降级为行内标签，用于嵌入 <p>/<h1> 等短语级容器
  const inlineTag = (tag: string) =>
    inline && ["P", "DIV", "UL", "OL", "LI"].includes(tag) ? "span" : null;
  function copy(node: Node, parent: Node) {
    if (node.nodeType === 3) {
      parent.appendChild(document.createTextNode(node.textContent || ""));
      return;
    }
    if (!(node instanceof Element)) return;
    if (!allowed.has(node.tagName)) {
      if (
        ["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG", "MATH"].includes(
          node.tagName,
        )
      )
        return;
      for (const child of Array.from(node.childNodes)) copy(child, parent);
      return;
    }
    const lowered = inlineTag(node.tagName),
      out = document.createElement(
        lowered || (node.tagName === "FONT" ? "span" : node.tagName.toLowerCase()),
      );
    const style = (node as HTMLElement).style;
    if (style) {
      for (const key of [
        "color",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "textDecoration",
      ] as const) {
        const value = style[key];
        if (value && !/url|expression|@|[<>]/i.test(value))
          out.style[key] = value;
      }
    }
    const color = node.getAttribute("color"),
      face = node.getAttribute("face");
    if (color && /^#[a-f0-9]{3,8}$/i.test(color)) out.style.color = color;
    if (face && face.length <= 120 && !/[<>;{}]|url|expression|@/i.test(face))
      out.style.fontFamily = face;
    for (const child of Array.from(node.childNodes)) copy(child, out);
    parent.appendChild(out);
  }
  for (const n of Array.from(source.body.childNodes)) copy(n, target);
  return target.innerHTML;
}
function escapeHtml(text: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (character) => entities[character]);
}
export function RichContent({
  html,
  className = "text-base leading-8",
}: {
  html?: string | null;
  className?: string;
}) {
  const normalizedHtml = html ?? "";
  const inline = className.includes("contents");
  const [safe, setSafe] = useState(() =>
    normalizedHtml.includes("<") ? "" : escapeHtml(normalizedHtml),
  );
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setSafe(cleanRichHtml(normalizedHtml, inline)),
    );
    return () => cancelAnimationFrame(frame);
  }, [normalizedHtml, inline]);
  return (
    // 当以 "contents" 方式嵌入 <p>/<h1> 等短语级标签时，用 <span> 承载，
    // 避免 <div> 作为 <p> 子元素导致浏览器解析提前闭合、引发 hydration 报错。
    inline ? (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    ) : (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    )
  );
}
