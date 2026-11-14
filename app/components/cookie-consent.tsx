"use client";

import { Cookie } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Lang = "en" | "zh";

const STORAGE_KEY = "beneigh_cookie_consent";

function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem("beneigh_language_override");
  if (saved === "zh" || saved === "en") return saved;
  const locales = [navigator.language, ...(navigator.languages || [])].map((x) =>
    x.toLowerCase(),
  );
  const hit = locales.find((l) => l.startsWith("zh") || l.startsWith("en"));
  if (hit?.startsWith("zh")) return "zh";
  return "en";
}

const COPY = {
  en: {
    title: "We Value Your Privacy",
    body: "We use cookies to keep the site working, remember your language choice and understand how pages are used. You can accept all cookies, or continue with essential cookies only.",
    accept: "Accept All",
    reject: "Essential Only",
    settings: "Cookie Settings",
    label: "Cookie and privacy preferences",
  },
  zh: {
    title: "我们重视您的隐私",
    body: "我们使用 Cookie 来保障网站正常运行、记住您的语言选择，并了解页面的使用情况。您可以接受全部 Cookie，或仅保留必要 Cookie 继续浏览。",
    accept: "接受全部",
    reject: "仅必要 Cookie",
    settings: "Cookie 设置",
    label: "Cookie 与隐私偏好",
  },
};

/**
 * 初次打开网站时弹出 Cookie 隐私对话框，供用户选择。
 * 选择结果保存在 localStorage，并同步写入一条同名 cookie；
 * 页脚“Cookie 设置”可随时重新打开。
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");

  const openDialog = useCallback(() => setOpen(true), []);

  useEffect(() => {
    setLang(detectLang());
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (!stored) setOpen(true);

    const onLang = (e: Event) => {
      const value = (e as CustomEvent<string>).detail;
      if (value === "zh" || value === "en") setLang(value);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("beneigh:lang-change", onLang);
    window.addEventListener("beneigh:cookie-consent-open", onOpen);
    return () => {
      window.removeEventListener("beneigh:lang-change", onLang);
      window.removeEventListener("beneigh:cookie-consent-open", onOpen);
    };
  }, []);

  const decide = (value: "all" | "essential") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    document.cookie = `${STORAGE_KEY}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    setOpen(false);
  };

  if (!open) return null;

  const t = COPY[lang];

  return (
    <div
      id="beneigh-cookie-consent"
      role="dialog"
      aria-modal="true"
      aria-label={t.label}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center"
    >
      <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-7 text-[#163533] shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e4f3f1] text-[#0f8b82]">
            <Cookie size={22} />
          </span>
          <h2 className="text-xl font-bold sm:text-2xl">{t.title}</h2>
        </div>
        <p className="mt-4 text-[15px] leading-7 text-[#55716f]">{t.body}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="h-12 rounded-full border border-[#b9d6d3] px-6 font-bold text-[#0f6d68] transition hover:bg-[#e4f3f1] active:scale-[.98]"
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={() => decide("all")}
            className="h-12 rounded-full bg-[#ec765f] px-6 font-bold text-white transition hover:bg-[#257a76] active:scale-[.98] btn-shimmer"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
