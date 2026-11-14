"use client";

import { Check, Send } from "lucide-react";
import { cloneElement, isValidElement, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitNotice, type SubmitState } from "./submit-notice";
import {
  FormIssueList,
  clearInvalidFields,
  collectFormIssues,
  markInvalidFields,
  summaryText,
  type FieldIssue,
} from "./form-validation";
import type { SiteLang } from "./site-header";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-bold">
        {label}
      </Label>
      {isValidElement<{ id?: string }>(children)
        ? cloneElement(children, { id })
        : children}
    </div>
  );
}
export function ContactForm({
  lang,
  service,
  variant = "light",
  hideIntro = false,
  className = "",
}: {
  lang: SiteLang;
  service?: string;
  variant?: "light" | "dark";
  hideIntro?: boolean;
  className?: string;
}) {
  const zh = lang === "zh",
    dark = variant === "dark",
    [sent, setSent] = useState(false),
    [portalUrl, setPortalUrl] = useState(""),
    [emailStatus, setEmailStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [issues, setIssues] = useState<FieldIssue[]>([]),
    [result, setResult] = useState<SubmitState>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const found = collectFormIssues(form, lang);
    setIssues(found);
    if (found.length) {
      const first = markInvalidFields(form, lang);
      first?.focus();
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      setError("");
      setResult({ kind: "error", message: summaryText(found, lang) });
      return;
    }
    clearInvalidFields(form);
    setBusy(true);
    setError("");
    setResult(null);
    const fd = new FormData(form),
      raw = Object.fromEntries(fd.entries()),
      message = service
        ? `[${service}] ${String(raw.message || "")}`
        : raw.message;
    try {
      const r = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...raw, message, language: lang, service }),
      });
      const out = (await r.json()) as {
        portalUrl: string;
        emailStatus: string;
        error?: string;
      };
      if (!r.ok) throw new Error(out.error);
      form.reset();
      setSent(true);
      setPortalUrl(out.portalUrl);
      setEmailStatus(out.emailStatus);
      setIssues([]);
      setResult({ kind: "success" });
    } catch (e) {
      const detail =
        zh
          ? "暂时无法提交，请稍后重试。"
          : "We could not submit your inquiry. Please try again.";
      setError(detail);
      setResult({ kind: "error", message: detail });
      void e;
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      noValidate
      className={`${dark ? "rounded-none bg-transparent p-0 shadow-none [&_label]:text-white" : "rounded-[2rem] bg-white p-6 shadow-xl sm:p-8"} ${className}`}
    >
      {!hideIntro && <>
      <h3 className="text-2xl font-bold">
        {zh ? "联系比邻" : "Contact Be Neighbor"}
      </h3>
      <p className={`mt-2 text-base leading-7 ${dark ? "text-white/70" : "text-[#627b79]"}`}>
        {zh
          ? "留下联系方式和问题，我们会安排人员回复。"
          : "Leave your contact details and question. A coordinator will reply."}
      </p>
      </>}
      <FormIssueList issues={issues} lang={lang} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={zh ? "姓名" : "Full name"}>
          <Input name="name" required minLength={2} className={dark ? "border-white/30 bg-white/10 text-white" : undefined} />
        </Field>
        <Field label={zh ? "电子邮箱" : "Email"}>
          <Input name="email" type="email" required className={dark ? "border-white/30 bg-white/10 text-white" : undefined} />
        </Field>
        <div className="sm:col-span-2">
          <Field
            label={zh ? "电话或 WhatsApp 选填" : "Phone or WhatsApp optional"}
          >
            <Input name="phone" inputMode="tel" className={dark ? "border-white/30 bg-white/10 text-white" : undefined} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={zh ? "您的问题" : "How can we help?"}>
            <Textarea name="message" rows={5} required maxLength={3000} className={dark ? "border-white/30 bg-white/10 text-white" : undefined} />
          </Field>
        </div>
      </div>
      {sent && (
        <p className="mt-4 flex items-center gap-2 font-bold text-[#0f6d68]">
          <Check size={18} />
          {zh
            ? "询问已提交，我们会尽快回复。"
            : "Your inquiry has been submitted. Open your private portal to read replies."}
        </p>
      )}
      {portalUrl && (
        <div className="mt-4">
          <Button asChild className="min-h-12">
            <a href={portalUrl}>{zh ? "打开客户入口" : "Open Client Portal"}</a>
          </Button>
          <p className="mt-3 break-all text-sm">
            {zh ? "请保存此私密链接：" : "Keep this private link: "}{portalUrl}
          </p>
          <p className="mt-3 text-base">
            {emailStatus === "sent"
              ? zh ? "邮件通知已被邮件服务接受。" : "Email notification accepted by the email provider."
              : zh ? "邮件通知未发送，请保存您的客户入口链接。" : "Email notification was not sent. Save your private portal link."}
          </p>
        </div>
      )}
      {error && <p className="mt-4 font-bold text-red-600">{error}</p>}
      <Button
        disabled={busy}
        type="submit"
        className="mt-6 h-12 w-full rounded-xl bg-[#ec765f] text-base text-white hover:bg-[#257a76] btn-shimmer"
      >
        {busy
          ? zh
            ? "提交中"
            : "Submitting"
          : zh
            ? "提交询问"
            : "Submit inquiry"}
        <Send />
      </Button>
      {result && (
        <SubmitNotice
          kind={result.kind}
          lang={lang}
          message={result.message}
          onDone={() => setResult(null)}
        />
      )}
    </form>
  );
}
