"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cleanRichHtml, RichContent } from "./rich-content";

type SelectionStyleInfo = {
  textLength: number;
  isCaret: boolean;
  fontFamily: string;
  fontSize: string;
  color: string;
  colorSwatch: string | null;
  fontWeight: string;
  bold: boolean | null;
  italic: boolean | null;
  underline: boolean | null;
};

function distinctValue<T>(values: T[], format: (value: T) => string = String) {
  const formatted = [...new Set(values.map(format))];
  return formatted.length === 1 ? formatted[0] : "混合样式";
}

function distinctBoolean(values: boolean[]): boolean | null {
  const distinct = [...new Set(values)];
  return distinct.length === 1 ? distinct[0] : null;
}

function displayColor(value: string) {
  const parts = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!parts) return value;
  const hex = parts.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, "0")).join("");
  return `#${hex.toUpperCase()} · ${value}`;
}

function hasUnderline(element: Element, root: HTMLElement) {
  let current: Element | null = element;
  while (current && root.contains(current)) {
    if (current.tagName === "U" || window.getComputedStyle(current).textDecorationLine.split(/\s+/).includes("underline"))
      return true;
    if (current === root) break;
    current = current.parentElement;
  }
  return false;
}

function readSelectionStyle(root: HTMLElement | null, selection: Selection | null): SelectionStyleInfo | null {
  if (!root || !selection?.rangeCount || !selection.anchorNode || !root.contains(selection.anchorNode)) return null;

  const range = selection.getRangeAt(0);
  const elements: Element[] = [];

  if (range.collapsed) {
    const anchor = selection.anchorNode;
    const element = anchor.nodeType === Node.ELEMENT_NODE ? anchor as Element : anchor.parentElement;
    if (element && root.contains(element)) elements.push(element);
  } else {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node.textContent ?? "";
      let intersects = range.intersectsNode(node);
      if (intersects && range.startContainer === node) intersects = range.startOffset < text.length;
      if (intersects && range.endContainer === node) intersects = range.endOffset > 0;
      if (intersects && text.length) {
        const element = node.parentElement;
        if (element) elements.push(element);
      }
      node = walker.nextNode();
    }
  }

  if (!elements.length) return null;

  const styles = elements.map((element) => window.getComputedStyle(element));
  const weights = styles.map((style) => style.fontWeight);
  const boldValues = weights.map((weight) => {
    const numericWeight = Number.parseInt(weight, 10);
    return weight === "bold" || weight === "bolder" || (Number.isFinite(numericWeight) && numericWeight >= 600);
  });
  const italicValues = styles.map((style) => style.fontStyle !== "normal");
  const underlineValues = elements.map((element) => hasUnderline(element, root));
  const colors = styles.map((style) => style.color);
  const colorIsUniform = new Set(colors).size === 1;

  return {
    textLength: Array.from(selection.toString()).length,
    isCaret: range.collapsed,
    fontFamily: distinctValue(styles.map((style) => style.fontFamily)),
    fontSize: distinctValue(styles.map((style) => style.fontSize)),
    color: distinctValue(colors, displayColor),
    colorSwatch: colorIsUniform ? colors[0] : null,
    fontWeight: distinctValue(weights, (weight) => {
      const numericWeight = Number.parseInt(weight, 10);
      const isBold = weight === "bold" || weight === "bolder" || (Number.isFinite(numericWeight) && numericWeight >= 600);
      return `${weight}${isBold ? "（粗体）" : "（常规）"}`;
    }),
    bold: distinctBoolean(boldValues),
    italic: distinctBoolean(italicValues),
    underline: distinctBoolean(underlineValues),
  };
}

function StyleValue({ label, value, swatch }: { label: string; value: string; swatch?: string | null }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-white px-2 py-1 text-xs ring-1 ring-slate-200">
      <span className="shrink-0 text-slate-500">{label}</span>
      {swatch !== undefined && <span aria-hidden="true" className="size-3 shrink-0 rounded-sm border border-slate-300" style={swatch ? { backgroundColor: swatch } : { background: "linear-gradient(135deg, #fff 45%, #94a3b8 46%, #94a3b8 54%, #fff 55%)" }} />}
      <span className="truncate font-medium text-slate-800" title={value}>{value}</span>
    </span>
  );
}

const fontSuggestions = [
  "Arial",
  "Georgia",
  "Verdana",
  "Times New Roman",
  "Helvetica",
  "Noto Sans SC",
  "Microsoft YaHei",
  "SimSun",
  "KaiTi",
  "serif",
  "sans-serif",
  "monospace",
];

export function RichEditor({
  value,
  onChange,
  className = "",
  showPreview = true,
}: {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  showPreview?: boolean;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const selection = useRef<Range | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<SelectionStyleInfo | null>(null);
  const [fontFamily, setFontFamily] = useState("");
  const [fontSize, setFontSize] = useState("");
  const [color, setColor] = useState("#163533");

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = cleanRichHtml(value);
    // Initializing the editable DOM once avoids moving the caret on each keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function syncSelectionInfo() {
      if (toolbar.current?.contains(document.activeElement)) return;
      const current = window.getSelection();
      const root = editor.current;
      if (current?.rangeCount && current.anchorNode && root?.contains(current.anchorNode))
        selection.current = current.getRangeAt(0).cloneRange();
      setSelectionInfo(readSelectionStyle(root, current));
    }

    document.addEventListener("selectionchange", syncSelectionInfo);
    return () => document.removeEventListener("selectionchange", syncSelectionInfo);
  }, []);

  function save() {
    if (editor.current) onChange(cleanRichHtml(editor.current.innerHTML));
  }

  function rememberSelection() {
    const current = window.getSelection();
    if (current?.rangeCount && editor.current?.contains(current.anchorNode))
      selection.current = current.getRangeAt(0).cloneRange();
  }

  function refreshSelectionInfo() {
    setSelectionInfo(readSelectionStyle(editor.current, window.getSelection()));
  }

  function restoreSelection() {
    editor.current?.focus();
    if (!selection.current) return;
    const current = window.getSelection();
    current?.removeAllRanges();
    current?.addRange(selection.current);
  }

  function command(name: string, argument?: string) {
    restoreSelection();
    document.execCommand(name, false, argument);
    rememberSelection();
    refreshSelectionInfo();
    save();
  }

  function applySize() {
    const parsed = Number(fontSize);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    restoreSelection();
    document.execCommand("fontSize", false, "7");
    editor.current?.querySelectorAll('font[size="7"]').forEach((node) => {
      const span = document.createElement("span");
      span.style.fontSize = `${parsed}px`;
      while (node.firstChild) span.appendChild(node.firstChild);
      node.replaceWith(span);
    });
    rememberSelection();
    refreshSelectionInfo();
    save();
  }

  return (
    <div className="min-w-0">
      <div ref={toolbar} className="flex flex-wrap items-center gap-2 rounded-t-xl border border-b-0 bg-slate-50 p-2">
        <div aria-live="polite" className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-100/80 p-2">
          <span className="text-xs font-semibold text-slate-700">当前选区样式</span>
          {selectionInfo ? <>
            <span className="text-xs text-slate-500">{selectionInfo.isCaret ? "光标位置" : `已选 ${selectionInfo.textLength} 字`}</span>
            <StyleValue label="字体" value={selectionInfo.fontFamily} />
            <StyleValue label="字号" value={selectionInfo.fontSize} />
            <StyleValue label="颜色" value={selectionInfo.color} swatch={selectionInfo.colorSwatch} />
            <StyleValue label="字重" value={selectionInfo.fontWeight} />
            <StyleValue label="粗体" value={selectionInfo.bold === null ? "混合样式" : selectionInfo.bold ? "是" : "否"} />
            <StyleValue label="斜体" value={selectionInfo.italic === null ? "混合样式" : selectionInfo.italic ? "是" : "否"} />
            <StyleValue label="下划线" value={selectionInfo.underline === null ? "混合样式" : selectionInfo.underline ? "有" : "无"} />
          </> : <span className="text-xs text-slate-500">在下方编辑区选择文字或放置光标后显示实际样式</span>}
        </div>
        <Button type="button" variant="outline" aria-pressed={selectionInfo?.bold === null ? "mixed" : selectionInfo?.bold ?? false} className={`min-h-10 ${selectionInfo?.bold === true ? "ring-2 ring-emerald-500" : selectionInfo?.bold === null ? "ring-2 ring-amber-400" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => command("bold")}>
          粗体
        </Button>
        <Button type="button" variant="outline" aria-pressed={selectionInfo?.italic === null ? "mixed" : selectionInfo?.italic ?? false} className={`min-h-10 ${selectionInfo?.italic === true ? "ring-2 ring-emerald-500" : selectionInfo?.italic === null ? "ring-2 ring-amber-400" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => command("italic")}>
          斜体
        </Button>
        <Button type="button" variant="outline" aria-pressed={selectionInfo?.underline === null ? "mixed" : selectionInfo?.underline ?? false} className={`min-h-10 ${selectionInfo?.underline === true ? "ring-2 ring-emerald-500" : selectionInfo?.underline === null ? "ring-2 ring-amber-400" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => command("underline")}>
          下划线
        </Button>
        <input
          aria-label="字体（可输入字体名称）"
          list="beneigh-rich-fonts"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              command("fontName", fontFamily.trim());
            }
          }}
          placeholder="字体名称"
          className="h-10 w-36 rounded-lg border bg-white px-2 text-sm"
        />
        <Button type="button" variant="outline" className="min-h-10" onMouseDown={(e) => e.preventDefault()} onClick={() => fontFamily.trim() && command("fontName", fontFamily.trim())}>
          应用字体
        </Button>
        <datalist id="beneigh-rich-fonts">
          {fontSuggestions.map((font) => <option value={font} key={font} />)}
        </datalist>
        <label className="flex h-10 items-center gap-2 rounded-lg border bg-white px-2 text-sm">
          字号
          <input
            aria-label="字号（像素）"
            type="number"
            min="0.1"
            step="any"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            onMouseDown={rememberSelection}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applySize(); } }}
            placeholder="px"
            className="w-20 bg-transparent outline-none"
          />
          <Button type="button" variant="ghost" className="h-8 px-2" onMouseDown={(e) => e.preventDefault()} onClick={applySize}>
            应用
          </Button>
        </label>
        <label className="flex h-10 items-center gap-2 rounded-lg border bg-white px-2 text-sm">
          颜色
          <input
            aria-label="文字颜色"
            type="color"
            value={color}
            onMouseDown={rememberSelection}
            onChange={(e) => { setColor(e.target.value); command("foreColor", e.target.value); }}
            className="size-7 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
        <Button type="button" variant="outline" className="min-h-10" onMouseDown={(e) => e.preventDefault()} onClick={() => command("removeFormat")}>
          清除选区格式
        </Button>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        onInput={save}
        onBlur={(e) => {
          rememberSelection();
          if (!toolbar.current?.contains(e.relatedTarget as Node | null)) setSelectionInfo(null);
        }}
        onKeyUp={() => { rememberSelection(); refreshSelectionInfo(); }}
        onMouseUp={() => { rememberSelection(); refreshSelectionInfo(); }}
        onTouchEnd={() => { rememberSelection(); refreshSelectionInfo(); }}
        className={`min-h-28 rounded-b-xl border bg-white p-4 outline-none ${className}`}
      />
      {showPreview && <div className="mt-3 rounded-xl bg-[#f2f7f7] p-4">
        <p className="mb-2 text-sm font-bold">保存效果预览</p>
        <RichContent html={value} className={className || "text-base leading-8"} />
      </div>}
    </div>
  );
}
