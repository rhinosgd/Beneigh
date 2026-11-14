"use client";

import { AlertCircle } from "lucide-react";
import type { SiteLang } from "./site-header";

export type ValidationLang = SiteLang;

export type FieldIssue = {
  name: string;
  label: string;
  message: string;
};

/** 这些类名必须以字面量出现在源码中，Tailwind 才能生成对应样式。 */
const INVALID_CLASSES = ["ring-2", "ring-[#e05a48]"];

function labelFor(el: Element, form: HTMLFormElement): string {
  const id = el.getAttribute("id");
  if (id) {
    const lab = form.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (lab?.textContent) return lab.textContent.trim();
  }
  // 同组内的可见控件可能已经绑定了 label（自定义日期框等场景）
  const scope = el.closest("div.space-y-2") || el.parentElement;
  if (scope) {
    const labs = Array.from(scope.querySelectorAll("label"));
    for (const lab of labs) {
      const forId = lab.getAttribute("for");
      if (!forId) continue;
      const bound = form.querySelector(`#${CSS.escape(forId)}`);
      if (bound && bound !== el && scope.contains(bound)) {
        const text = lab.textContent?.trim();
        if (text) return text;
      }
    }
    const plain = labs.find((l) => !l.getAttribute("for"))?.textContent?.trim();
    if (plain) return plain;
  }
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  const wrapping = el.closest("label");
  if (wrapping?.textContent) return wrapping.textContent.trim();
  const placeholder = el.getAttribute("placeholder");
  if (placeholder) return placeholder;
  const name = el.getAttribute("name") || "";
  return name || "This field";
}

function messageFor(el: Element, lang: ValidationLang): string {
  const v = (el as HTMLInputElement).validity;
  const zh = lang === "zh";
  if (v.valueMissing) {
    return zh ? "请填写此字段。" : "This field is required.";
  }
  if (v.typeMismatch) {
    return zh
      ? "请输入有效的电子邮箱地址。"
      : "Please enter a valid email address.";
  }
  if (v.tooShort) {
    const min = (el as HTMLInputElement).minLength || 2;
    return zh
      ? `至少需要输入 ${min} 个字符。`
      : `Please enter at least ${min} characters.`;
  }
  if (v.tooLong) {
    const max = (el as HTMLInputElement).maxLength || 0;
    return zh
      ? `内容不能超过 ${max} 个字符。`
      : `Please use no more than ${max} characters.`;
  }
  return zh ? "请检查此字段的填写内容。" : "Please check this field.";
}

/** 找到用户真正能操作的可视控件（隐藏的原生日期框等会被跳过）。 */
function visibleControl(el: Element): HTMLElement {
  const node = el as HTMLElement;
  const style = window.getComputedStyle(node);
  const hidden =
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0" ||
    node.getAttribute("aria-hidden") === "true";
  if (!hidden) return node;
  const scope = node.closest("div") || node.parentElement;
  const candidates = scope
    ? Array.from(
        scope.querySelectorAll<HTMLElement>("input, textarea, select"),
      )
    : [];
  const usable = candidates.filter((c) => {
    const s = window.getComputedStyle(c);
    return (
      s.display !== "none" &&
      s.visibility !== "hidden" &&
      s.opacity !== "0" &&
      c.getAttribute("aria-hidden") !== "true"
    );
  });
  return (
    usable.find((c) => !c.readOnly) || usable[0] || node
  );
}

/**
 * 读取原生约束校验结果（不弹浏览器气泡），返回按字段归集的问题清单。
 * 表单需配合 noValidate 使用，避免出现系统语言的气泡。
 */
export function collectFormIssues(
  form: HTMLFormElement,
  lang: ValidationLang,
): FieldIssue[] {
  const zh = lang === "zh";
  const issues: FieldIssue[] = [];
  const controls = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select",
    ),
  );
  for (const el of controls) {
    if (el.disabled || el.type === "hidden") continue;
    if (!el.validity || el.validity.valid) continue;
    issues.push({
      name: el.getAttribute("name") || el.id || "",
      label: labelFor(el, form),
      message: messageFor(el, lang),
    });
  }
  // 去重（同一 label 可能对应多个控件）
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.name}|${issue.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 给无效控件加红框 + aria-invalid，有效控件清除标记。 */
export function markInvalidFields(
  form: HTMLFormElement,
  lang: ValidationLang,
): HTMLElement | null {
  const zh = lang === "zh";
  let first: HTMLElement | null = null;
  const controls = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select",
    ),
  );
  for (const el of controls) {
    if (el.disabled || el.type === "hidden") continue;
    const invalid = !el.validity.valid;
    const target = visibleControl(el);
    if (invalid) {
      target.setAttribute("aria-invalid", "true");
      INVALID_CLASSES.forEach((c) => target.classList.add(c));
      if (!first) first = target;
    } else {
      target.removeAttribute("aria-invalid");
      INVALID_CLASSES.forEach((c) => target.classList.remove(c));
    }
  }
  void zh;
  return first;
}

export function clearInvalidFields(form: HTMLFormElement) {
  form
    .querySelectorAll<HTMLElement>("[aria-invalid='true']")
    .forEach((el) => {
      el.removeAttribute("aria-invalid");
      INVALID_CLASSES.forEach((c) => el.classList.remove(c));
    });
}

export function summaryText(
  issues: FieldIssue[],
  lang: ValidationLang,
): string {
  if (!issues.length) return "";
  const zh = lang === "zh";
  const first = issues[0];
  const rest = issues.length - 1;
  return zh
    ? `${first.message}${rest > 0 ? `（另有 ${rest} 处需要填写）` : ""}`
    : `${first.message}${rest > 0 ? ` (and ${rest} more field${rest > 1 ? "s" : ""} to complete)` : ""}`;
}

/** 表单顶部的字段级错误清单，替代浏览器原生气泡。 */
export function FormIssueList({
  issues,
  lang,
}: {
  issues: FieldIssue[];
  lang: ValidationLang;
}) {
  if (!issues.length) return null;
  const zh = lang === "zh";
  return (
    <div
      role="alert"
      className="mb-5 rounded-2xl border border-[#f0b7ae] bg-[#fdeeeb] p-4 text-[#9c2f21]"
    >
      <p className="flex items-center gap-2 text-base font-bold">
        <AlertCircle className="size-5 shrink-0" />
        {zh
          ? `请检查表单中的 ${issues.length} 处内容`
          : `Please check ${issues.length} field${issues.length > 1 ? "s" : ""}`}
      </p>
      <ul className="mt-2 space-y-1 text-sm leading-6">
        {issues.map((issue, i) => (
          <li key={`${issue.name}-${i}`}>
            <b>{issue.label}</b>：{issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
