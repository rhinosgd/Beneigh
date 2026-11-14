"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
type Thread = {
  id: number;
  reference: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  latest_message: string;
};
type Message = {
  id: number;
  sender: string;
  body: string;
  created_at: string;
  manager_email: string;
};
export function AdminInbox({ email }: { email: string }) {
  const [threads, setThreads] = useState<Thread[]>([]),
    [selected, setSelected] = useState<Thread | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [body, setBody] = useState(""),
    [managerEmail, setManagerEmail] = useState(email || "info@beneigh.com"),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [result, setResult] = useState<SubmitState>(null),
    [issues, setIssues] = useState<FieldIssue[]>([]),
    [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      const r = await fetch("/api/admin/messages", { cache: "no-store" });
      const d = (await r.json()) as { threads: Thread[]; error?: string };
      if (!r.ok) throw new Error(d.error);
      setThreads(d.threads);
      if (selected) {
        const response = await fetch(`/api/admin/messages?id=${selected.id}`, {
          cache: "no-store",
        });
        const out = (await response.json()) as {
          messages: Message[];
          error?: string;
        };
        if (!response.ok) throw new Error(out.error);
        setMessages(out.messages);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "消息列表暂时不可用");
    }
  }
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [selected]);
  async function send() {
    if (!selected) return;
    setBusy(true);    setNotice("");
    setError("");
    setResult(null);
    try {
      const r = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, body, managerEmail }),
      });
      const d = (await r.json()) as { emailStatus: string; error?: string };
      if (!r.ok) throw new Error(d.error);
      setBody("");
      setIssues([]);
      setResult({ kind: "success" });
      setNotice(
        d.emailStatus === "sent"
          ? "回复已保存，邮件通知已发送。"
          : "回复已保存，客户可在客户端查看。邮件通知未发送：发信服务未配置或发送失败。",
      );
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "暂时无法发送回复";
      setError(msg);
      setResult({ kind: "error", message: msg });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="mb-5 text-base text-slate-500">
        前台询问与预约会建立专属会话；管理员可直接回复，客户在客户端查看并继续回复。旧版提交的记录仍在原列表中。
      </p>
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl bg-white p-4">
          <Input
            placeholder="搜索客户、邮箱、编号"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="mt-4 max-h-[650px] space-y-3 overflow-y-auto">
            {threads
              .filter((t) =>
                [t.name, t.email, t.reference, t.subject].some((x) =>
                  x.toLowerCase().includes(q.toLowerCase()),
                ),
              )
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelected(t);
                    setNotice("");
                    setError("");
                    setBody("");
                  }}
                  className={`w-full rounded-xl border p-4 text-left ${selected?.id === t.id ? "border-teal-600 bg-teal-50" : "hover:bg-slate-50"}`}
                >
                  <b className="text-base">{t.name}</b>
                  <p className="mt-1 break-all text-sm text-slate-500">
                    {t.email}
                  </p>
                  <p className="mt-2 text-sm">
                    {t.subject === "Booking Request" ? "预约申请" : t.subject === "Contact Inquiry" ? "客户询问" : t.subject} · {t.status === "awaiting-team" ? "等待管理员回复" : t.status === "awaiting-customer" ? "等待客户回复" : t.status === "closed" ? "已关闭" : t.status}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {t.latest_message}
                  </p>
                </button>
              ))}
            {!threads.length && (
              <p className="py-8 text-base text-slate-500">
                暂无新会话。客户提交后会出现在这里。
              </p>
            )}
          </div>
        </aside>
        <section className="min-w-0 rounded-2xl bg-white p-4 sm:p-6">
          {selected ? (
            <>
              <h2 className="text-xl font-bold">
                {selected.name} · {selected.subject}
              </h2>
              <div className="my-6 max-h-[500px] space-y-4 overflow-y-auto">
                {messages.map((m) => (
                  <article
                    key={m.id}
                    className={`rounded-xl p-4 ${m.sender === "team" ? "ml-6 bg-teal-50" : "mr-6 bg-slate-100"}`}
                  >
                    <b className="text-sm">
                      {m.sender === "team" ? "管理员" : "客户"}
                    </b>
                    <p className="mt-2 whitespace-pre-wrap break-words text-base leading-7">
                      {m.body}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {m.created_at} UTC · {m.manager_email}
                    </p>
                  </article>
                ))}
              </div>
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const found = collectFormIssues(form, "zh");
                  setIssues(found);
                  if (found.length) {
                    const first = markInvalidFields(form, "zh");
                    first?.focus();
                    first?.scrollIntoView({ block: "center", behavior: "smooth" });
                    setResult({ kind: "error", message: summaryText(found, "zh") });
                    return;
                  }
                  clearInvalidFields(form);
                  send();
                }}
              >
                <FormIssueList issues={issues} lang="zh" />
                <label className="mb-2 block text-base font-bold">
                  回复管理员邮箱
                </label>
                <Input
                  type="email"
                  required
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                />
                <Textarea
                  className="mt-4"
                  rows={5}
                  required
                  maxLength={3000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="直接回复客户…"
                />
                <Button disabled={busy} className="mt-4 min-h-12">
                  {busy ? "保存中…" : "发送回复到客户端"}
                </Button>
              </form>
            </>
          ) : (
            <p className="py-12 text-base text-slate-500">
              请选择一个客户会话查看与回复。
            </p>
          )}
        </section>
      </div>
      {notice && <p className="mt-5 rounded-xl bg-teal-50 p-4">{notice}</p>}
      {result && (
        <SubmitNotice
          kind={result.kind}
          lang="zh"
          message={result.message}
          onDone={() => setResult(null)}
        />
      )}
      {error && (
        <p role="alert" className="mt-5 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
