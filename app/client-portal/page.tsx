"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, ClipboardList, Home, LogOut, MessageSquare, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BeneighLogo } from "../components/site-header";
import { SubmitNotice, useSiteLang, type SubmitState } from "../components/submit-notice";
import {
  FormIssueList,
  clearInvalidFields,
  collectFormIssues,
  markInvalidFields,
  summaryText,
  type FieldIssue,
} from "../components/form-validation";

type Message = { id: number; sender: string; body: string; manager_email: string; created_at: string };
type Booking = { reference: string; title: string; name: string; email: string; country: string; region: string; arrival_date: string; return_date: string; preferred_date: string; time_slot: string; services: string; notes: string; status: string };
type Data = { thread: { reference: string; name: string; subject: string; status: string }; messages: Message[]; booking?: Booking };
const statusText: Record<string, string> = { pending: "Under Review", confirmed: "Confirmed", cancelled: "Cancelled", "awaiting-team": "Waiting For Our Team", "awaiting-customer": "Reply Requested", closed: "Closed" };

export default function ClientPortal() {
  const [key, setKey] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [result, setResult] = useState<SubmitState>(null);
  const [tab, setTab] = useState<"overview" | "booking" | "messages">("overview");
  async function load(credential: string) {
    try {
      const r = await fetch("/api/client/messages", { headers: { Authorization: `Bearer ${credential}` }, cache: "no-store" });
      const d = (await r.json()) as Data & { error?: string };
      if (!r.ok) throw new Error(d.error);
      setData(d); setError(""); sessionStorage.setItem("beneigh_portal_key", credential);
    } catch (e) { setError(e instanceof Error ? e.message : "Messages unavailable"); }
  }
  useEffect(() => { const credential = location.hash.slice(1) || sessionStorage.getItem("beneigh_portal_key") || ""; if (credential) { setKey(credential); history.replaceState(null, "", "/client-portal"); load(credential); } }, []);
  useEffect(() => { if (!key) return; const timer = setInterval(() => load(key), 15000); return () => clearInterval(timer); }, [key]);
  function reply(form: HTMLFormElement) {
    const found = collectFormIssues(form, noticeLang);
    setIssues(found);
    if (found.length) {
      const first = markInvalidFields(form, noticeLang);
      first?.focus();
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      setResult({ kind: "error", message: summaryText(found, noticeLang) });
      return;
    }
    clearInvalidFields(form);
    void sendReply();
  }
  async function sendReply() {
    setBusy(true);
    setResult(null);
    try { const r = await fetch("/api/client/messages", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ body }) }); const d = (await r.json()) as { error?: string }; if (!r.ok) throw new Error(d.error); setBody(""); setIssues([]); setResult({ kind: "success" }); await load(key); }
    catch (e) { const msg = e instanceof Error ? e.message : "Reply unavailable"; setError(msg); setResult({ kind: "error", message: msg }); } finally { setBusy(false); }
  }
  function signOut() { setData(null); setKey(""); sessionStorage.removeItem("beneigh_portal_key"); }
  const plans = (() => { try { return data?.booking ? JSON.parse(data.booking.services) as string[] : []; } catch { return []; } })();
  const noticeLang = useSiteLang("en");
  return <main className="min-h-screen bg-[#eef5f4] text-[#163533]">
    {result && <SubmitNotice kind={result.kind} lang={noticeLang} message={result.message} onDone={() => setResult(null)} />}
    <header className="border-b border-[#d7e7e5] bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6"><a href="/"><BeneighLogo /></a><div className="flex gap-2"><Button variant="outline" asChild className="hidden sm:inline-flex"><a href="/"><Home /> Website</a></Button>{data && <Button variant="ghost" onClick={signOut}><LogOut /> <span className="hidden sm:inline">Sign Out</span></Button>}</div></div></header>
    {!data ? <section className="mx-auto max-w-xl px-4 py-14 sm:py-24"><div className="rounded-[2rem] bg-white p-7 shadow-xl sm:p-10"><span className="grid size-14 place-items-center rounded-2xl bg-[#e2f4f1] text-[#0f6d68]"><ShieldCheck /></span><p className="mt-6 text-sm font-bold uppercase tracking-[.14em] text-[#0f8b82]">Secure Client Access</p><h1 className="mt-2 text-3xl font-bold">Open Your Client Portal</h1><p className="mt-3 leading-7 text-[#627b79]">Use the private link received after your inquiry or booking. It lets you view updates and reply directly to our coordination team.</p><form className="mt-7 space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const found = collectFormIssues(form, noticeLang); setIssues(found); if (found.length) { const first = markInvalidFields(form, noticeLang); first?.focus(); setResult({ kind: "error", message: summaryText(found, noticeLang) }); return; } clearInvalidFields(form); const credential = input.includes("#") ? input.split("#")[1] : input; setKey(credential); load(credential); }}><FormIssueList issues={issues} lang={noticeLang} /><Input className="h-12" required value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste private access link" aria-label="Private access link" autoComplete="off"/><Button className="h-12 w-full">Open Client Portal <ChevronRight /></Button></form><p className="mt-5 text-sm leading-6 text-[#627b79]">Lost your link? Email <a className="font-bold text-[#0f6d68]" href="mailto:info@beneigh.com">info@beneigh.com</a> for identity verification.</p></div></section> :
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:py-8">
      <aside className="h-fit rounded-2xl bg-[#153f3c] p-4 text-white lg:sticky lg:top-6"><p className="px-3 pt-2 text-sm text-[#9fc3bf]">Welcome Back</p><h1 className="px-3 pb-5 text-xl font-bold">{data.thread.name}</h1><nav className="grid grid-cols-3 gap-2 lg:grid-cols-1">{([['overview','Overview',ClipboardList],['booking','My Booking',CalendarDays],['messages','Messages',MessageSquare]] as const).map(([id,label,Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold lg:justify-start ${tab === id ? "bg-white text-[#153f3c]" : "text-[#c9deda] hover:bg-white/10"}`}><Icon size={19}/><span>{label}</span></button>)}</nav><div className="mt-5 hidden border-t border-white/10 px-3 pt-5 text-sm text-[#9fc3bf] lg:block">Reference<br/><b className="break-all text-white">{data.thread.reference}</b></div></aside>
      <section className="min-w-0"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-[.12em] text-[#0f8b82]">Client Portal</p><h2 className="mt-1 text-3xl font-bold">{tab === 'overview' ? 'Overview' : tab === 'booking' ? 'My Booking' : 'Messages'}</h2></div><Button variant="outline" onClick={() => load(key)}><RefreshCw /> Refresh</Button></div>
        {tab === 'overview' && <div className="grid gap-5 sm:grid-cols-2"><article className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm font-bold text-[#6e8583]">Request Status</p><p className="mt-3 text-2xl font-bold text-[#0f6d68]">{statusText[data.booking?.status || data.thread.status] || data.booking?.status || data.thread.status}</p><p className="mt-3 leading-7 text-[#627b79]">Our team will post review updates and any questions in Messages.</p></article><article className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm font-bold text-[#6e8583]">Conversation</p><p className="mt-3 text-2xl font-bold">{data.messages.length} Messages</p><button className="mt-4 font-bold text-[#0f6d68]" onClick={() => setTab('messages')}>Open Conversation →</button></article><article className="rounded-2xl bg-white p-6 shadow-sm sm:col-span-2"><h3 className="text-xl font-bold">Next Step</h3><p className="mt-3 leading-7 text-[#627b79]">Please monitor your messages. A coordinator may request dental scans or additional travel details before preparing a detailed quotation.</p></article></div>}
        {tab === 'booking' && <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#6e8583]">Booking Reference</p><h3 className="mt-1 text-2xl font-bold">{data.booking?.reference || data.thread.reference}</h3></div><span className="rounded-full bg-[#e3f4f1] px-4 py-2 text-sm font-bold text-[#0f6d68]">{statusText[data.booking?.status || 'pending'] || data.booking?.status}</span></div>{data.booking ? <dl className="mt-7 grid gap-5 border-t pt-7 sm:grid-cols-2"><Info label="Client" value={`${data.booking.title || ''} ${data.booking.name || data.thread.name}`.trim()}/><Info label="Country / Region" value={[data.booking.country,data.booking.region].filter(Boolean).join(' · ')}/><Info label="Expected Arrival" value={data.booking.arrival_date || data.booking.preferred_date}/><Info label="Expected Return" value={data.booking.return_date || 'To be confirmed'}/><Info label="Selected Plans" value={plans.join(', ') || 'Recorded in your request'}/><Info label="Notes" value={data.booking.notes || 'No additional notes'}/></dl> : <p className="mt-6">This conversation is not linked to a booking request.</p>}</article>}
        {tab === 'messages' && <article className="rounded-2xl bg-white shadow-sm"><div className="border-b p-5 sm:p-6"><h3 className="text-xl font-bold">Conversation With Be Neighbor</h3><p className="mt-1 text-sm text-[#627b79]">Replies are saved securely to this request.</p></div><div className="max-h-[560px] space-y-4 overflow-y-auto p-4 sm:p-6">{data.messages.map((m) => <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}><article className={`max-w-[90%] rounded-2xl p-4 sm:max-w-[75%] ${m.sender === 'customer' ? 'bg-[#0f6d68] text-white' : 'bg-[#eef4f3]'}`}><p className="text-xs font-bold uppercase tracking-[.1em] opacity-70">{m.sender === 'team' ? 'Be Neighbor Team' : 'You'}</p><p className="mt-2 whitespace-pre-wrap break-words leading-7">{m.body}</p><p className="mt-3 text-xs opacity-65">{m.created_at} UTC</p></article></div>)}</div><form className="border-t p-4 sm:p-6" noValidate onSubmit={(e) => { e.preventDefault(); reply(e.currentTarget); }}><FormIssueList issues={issues} lang={noticeLang} /><Textarea required rows={4} maxLength={3000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your reply…" aria-label="Your reply"/><div className="mt-3 flex justify-end"><Button disabled={busy}>{busy ? 'Sending…' : 'Send Reply'} <Send /></Button></div></form></article>}
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      </section>
    </div>}
  </main>;
}
function Info({label,value}:{label:string;value:string}) { return <div><dt className="text-sm font-bold text-[#6e8583]">{label}</dt><dd className="mt-1 break-words text-base font-semibold">{value || '—'}</dd></div>; }
