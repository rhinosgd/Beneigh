"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Laptop, Monitor, RotateCcw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeneighLogo } from "../components/site-header";

type Surface = "website" | "client" | "admin";
type Device = "desktop" | "mobile";

const surfaces: Record<Surface, { label: string; path: string; note: string }> = {
  website: { label: "网站前端", path: "/", note: "查看客户实际访问的 Beneigh 网站。" },
  client: { label: "客户中心", path: "/client-portal", note: "查看客户登录、预约资料和消息回复入口。" },
  admin: { label: "管理后台", path: "/manage-portal-7x", note: "查看中文管理端登录界面与响应式布局。" },
};

export default function ReviewPage() {
  const [surface, setSurface] = useState<Surface>("website");
  const [device, setDevice] = useState<Device>("desktop");
  const [version, setVersion] = useState(0);
  const current = surfaces[surface];
  const src = useMemo(() => `${current.path}?review=${version}`, [current.path, version]);
  return (
    <main className="min-h-screen bg-[#e8efee] text-[#163533]">
      <header className="border-b border-[#cbdcda] bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BeneighLogo />
          <div className="flex items-center gap-2 text-sm font-bold text-[#55716f]">
            <span className="size-2 rounded-full bg-[#18a56f]" />
            客户验收预览
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        <div className="rounded-2xl border border-[#cbdcda] bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Beneigh 网站效果预览</h1>
              <p className="mt-1 text-sm text-[#607976] sm:text-base">{current.note}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(surfaces) as Surface[]).map((id) => (
                <button key={id} onClick={() => setSurface(id)} className={`min-h-11 rounded-full px-4 text-sm font-bold transition ${surface === id ? "bg-[#0f6d68] text-white" : "border border-[#cbdcda] bg-white hover:bg-[#edf7f6]"}`}>
                  {surfaces[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#dce8e6] pt-4">
            <div className="flex rounded-full bg-[#edf3f2] p-1">
              <button onClick={() => setDevice("desktop")} className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold ${device === "desktop" ? "bg-white shadow-sm" : "text-[#627b79]"}`}><Monitor size={18} />电脑版</button>
              <button onClick={() => setDevice("mobile")} className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold ${device === "mobile" ? "bg-white shadow-sm" : "text-[#627b79]"}`}><Smartphone size={18} />手机版</button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setVersion((x) => x + 1)}><RotateCcw />刷新</Button>
              <Button asChild><a href={current.path} target="_blank" rel="noreferrer"><ExternalLink />新窗口打开</a></Button>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-auto rounded-2xl border border-[#bcd0ce] bg-[#cbd8d6] p-2 sm:p-5">
          <div className={`mx-auto overflow-hidden bg-white shadow-2xl transition-all ${device === "mobile" ? "w-[390px] max-w-full rounded-[2.4rem] border-[9px] border-[#173a37]" : "w-full rounded-xl border border-[#afc4c1]"}`}>
            <div className={`flex items-center bg-[#173a37] ${device === "mobile" ? "h-7 justify-center" : "h-10 gap-2 px-4"}`}>
              {device === "mobile" ? <span className="h-1.5 w-20 rounded-full bg-white/35" /> : <><span className="size-3 rounded-full bg-[#ee7562]"/><span className="size-3 rounded-full bg-[#e8bd55]"/><span className="size-3 rounded-full bg-[#68bc76]"/><span className="ml-4 flex-1 rounded-md bg-white/10 px-3 py-1 text-center text-xs text-white/70">{current.path}</span></>}
            </div>
            <iframe key={`${surface}-${device}-${version}`} title={`${current.label} ${device === "mobile" ? "手机版" : "电脑版"}`} src={src} className={`block w-full bg-white ${device === "mobile" ? "h-[760px]" : "h-[820px]"}`} />
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-[#607976]"><Laptop className="mr-1 inline size-4" />此页面仅用于验收展示；网站内容仍以正式发布版本为准。</p>
      </section>
    </main>
  );
}
