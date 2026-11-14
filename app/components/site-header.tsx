"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export type SiteLang = "en" | "zh" | "ja" | "ko" | "pt" | "es" | "fr" | "ar";
const nav = [
  { en: "Home", zh: "主页", href: "/#top" },
  { en: "Services", zh: "服务", href: "/#services" },
  { en: "Cases", zh: "案例", href: "/#cases" },
  { en: "Flow", zh: "流程", href: "/#services-flow" },
  { en: "Booking", zh: "预约", href: "/#booking" },
  { en: "FAQ", zh: "常见问题", href: "/#faq" },
  { en: "Contact Us", zh: "联系我们", href: "/#contact" },
];

export function BeneighLogo({brandName="Be Neighbor",tagline="MediCare"}:{brandName?:string;tagline?:string}) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-[15px] bg-[#0f6d68] font-serif text-lg font-black tracking-[-.18em] text-white shadow-sm" aria-hidden="true">
        比邻
      </span>
      <span className="leading-none">
        <b className="block text-xl tracking-[-.02em]">{brandName}</b>
        <small className="mt-1 hidden text-[15px] font-semibold leading-none tracking-[.08em] text-[#ec765f] sm:block sm:text-[16px]">
          {tagline}
        </small>
      </span>
    </span>
  );
}

const zhNav: Record<string, string> = {
  Home: "主页",
  Services: "服务",
  Cases: "案例",
  Flow: "流程",
  Booking: "预约",
  FAQ: "常见问题",
  "Contact Us": "联系我们",
};

function BilingualLabel({ en, zh, lang }: { en: string; zh: string; lang: SiteLang }) {
  return <span className="flex flex-col leading-tight"><b className="text-base">{lang === "zh" ? zhNav[en] || zh : en}</b></span>;
}

export function SiteHeader({
  lang,
  onLanguageChange,
}: {
  lang: SiteLang;
  onLanguageChange: (lang: SiteLang) => void;
}) {
  const [open, setOpen] = useState(false);
  const [global,setGlobal]=useState({brandName:"Be Neighbor",tagline:"MediCare"});
  useEffect(()=>{fetch("/api/site-config",{cache:"no-store"}).then(r=>r.json() as Promise<{content?:Record<string,string>}>).then(x=>{try{setGlobal({...global,...JSON.parse(x.content?.global_settings_json||"{}")})}catch{}}).catch(()=>{})},[]);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dcebea]/90 bg-[#f7fbfb]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 xl:px-7">
        <a href="/#top" aria-label="Be Neighbor home">
          <BeneighLogo brandName={global.brandName} tagline={global.tagline} />
        </a>
        <nav className="hidden items-center gap-4 xl:flex">
          {nav.map((item) => <a key={item.en} href={item.href} className="text-[#294f4c] hover:text-[#ec765f]"><BilingualLabel en={item.en} zh={item.zh} lang={lang} /></a>)}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/client-portal"
            className="inline-flex min-h-11 items-center rounded-full bg-[#0f6d68] px-3 text-sm font-bold text-white hover:bg-[#0b504c] active:scale-95"
          >
            {lang === "zh" ? "登录" : <><span className="hidden sm:inline">Sign Up/</span>Login</>}
          </a>
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => {
              const value = e.target.value as SiteLang;
              localStorage.setItem("beneigh_language_override", value);
              window.dispatchEvent(new CustomEvent("beneigh:lang-change", { detail: value }));
              onLanguageChange(value);
            }}
            className="min-h-11 max-w-24 sm:max-w-28 rounded-full border bg-white px-2 text-sm font-bold"
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
          <button
            aria-label="Open navigation"
            className="grid size-11 place-items-center rounded-full bg-white xl:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t bg-[#f7fbfb] px-5 pb-5 xl:hidden">
          {nav.map((item) => <a onClick={() => setOpen(false)} key={item.en} href={item.href} className="block border-b py-4"><BilingualLabel en={item.en} zh={item.zh} lang={lang} /></a>)}
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => {
              const value = e.target.value as SiteLang;
              localStorage.setItem("beneigh_language_override", value);
              window.dispatchEvent(new CustomEvent("beneigh:lang-change", { detail: value }));
              onLanguageChange(value);
            }}
            className="min-h-11 max-w-28 rounded-full border bg-white px-2 text-sm font-bold"
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </nav>
      )}
    </header>
  );
}
