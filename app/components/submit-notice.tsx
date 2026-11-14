"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SiteLang } from "./site-header";

/** 读取当前站点语言（与语言下拉框/localStorage 保持一致） */
export function useSiteLang(fallback: SiteLang = "en") {
  const [lang, setLang] = useState<SiteLang>(fallback);
  useEffect(() => {
    const saved = window.localStorage.getItem("beneigh_language_override");
    if (saved === "zh" || saved === "en") setLang(saved);
    const onLang = (e: Event) => {
      const value = (e as CustomEvent<string>).detail;
      if (value === "zh" || value === "en") setLang(value);
    };
    window.addEventListener("beneigh:lang-change", onLang);
    return () => window.removeEventListener("beneigh:lang-change", onLang);
  }, []);
  return lang;
}

/**
 * 统一的“表单提交结果”提示（Toast）。
 * 成功：提交已成功 / Submitted successfully
 * 失败：提交失败 / Submission failed
 * 语言随站点语言自动切换。
 */
export type SubmitResultKind = "success" | "error";

export function SubmitNotice({
  kind,
  lang,
  message,
  onDone,
}: {
  kind: SubmitResultKind;
  lang: SiteLang;
  /** 附加说明（可选），例如具体错误原因 */
  message?: string;
  onDone?: () => void;
}) {
  const [show, setShow] = useState(true);
  const zh = lang === "zh";
  const success = kind === "success";
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      doneRef.current?.();
    }, success ? 4500 : 7000);
    return () => clearTimeout(t);
  }, [kind, success]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-5 z-[120] flex justify-center px-4"
    >
      <div
        className={`flex max-w-lg items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl ${
          success
            ? "border border-[#9ed8cf] bg-[#e6f6f3] text-[#0b5750]"
            : "border border-[#f0b7ae] bg-[#fdeeeb] text-[#9c2f21]"
        }`}
      >
        {success ? (
          <CheckCircle2 className="mt-0.5 shrink-0 text-[#0f8b82]" size={22} />
        ) : (
          <AlertCircle className="mt-0.5 shrink-0 text-[#c93d32]" size={22} />
        )}
        <div>
          <p className="text-lg font-bold leading-tight">
            {success
              ? zh
                ? "提交已成功"
                : "Submitted successfully"
              : zh
                ? "提交失败"
                : "Submission failed"}
          </p>
          {message ? (
            <p className="mt-1 text-sm leading-6 opacity-90">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** 供表单组件使用的结果状态 */
export type SubmitState = { kind: SubmitResultKind; message?: string } | null;
