"use client";
import { RichEditor } from "../components/rich-editor";
import { MediaEditor as ImageEditor } from "../components/media-editor";
import { AdminInbox } from "../components/admin-inbox";
import {
  FormIssueList,
  clearInvalidFields,
  collectFormIssues,
  markInvalidFields,
  summaryText,
  type FieldIssue,
} from "../components/form-validation";
import { useEffect, useId, useRef, useState } from "react";
import {
  CalendarOff,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Languages,
  LogOut,
  MessageCircle,
  Newspaper,
  Search,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
type Booking = {
  currency?: string;
  id: number;
  reference: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  arrivalDate: string;
  returnDate: string;
  preferredDate: string;
  timeSlot: string;
  services: string;
  amount: number;
  status: string;
};
type Service = {
  id: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  price: number;
  active: boolean;
  imageUrl: string;
  sortOrder: number;
};
type Inquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
};
type AdminSection =
  "dashboard" | "orders" | "messages" | "services" | "content" | "media" | "languages" | "news" | "calendar" | "settings";
type AdminData = {
  role?: "owner" | "staff";
  bookings: Booking[];
  inquiries: Inquiry[];
  services: Service[];
  availability: unknown[];
  content: Record<string, string>;
};
export default function Admin() {
  const [ready, setReady] = useState(false),
    [data, setData] = useState<AdminData>({
      bookings: [],
      inquiries: [],
      services: [],
      availability: [],
      content: {},
    }),
    [q, setQ] = useState("");
  async function load() {
    const r = await fetch(`/api/admin/data?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });
    if (r.ok) {
      setData(await r.json());
      setReady(true);
    } else if (r.status === 401) {
      setReady(false);
    }
  }
  useEffect(() => {
    const initialLoad = requestAnimationFrame(() => void load());
    const timer = setInterval(() => void load(), 30000);
    return () => {
      cancelAnimationFrame(initialLoad);
      clearInterval(timer);
    };
  }, []);
  async function patch(body: unknown) {
    const change = (body && typeof body === "object" ? body : {}) as Record<
      string,
      unknown
    >;
    const shouldPublish = ["content", "contentBatch", "service"].includes(
      String(change.type),
    );
    try {
      const response = await fetch("/api/admin/data", {
        method: "PATCH",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const out = (await response.json()) as { error?: string };
        throw new Error(out.error || "后台保存失败");
      }

      if (shouldPublish) {
        const publicResponse = await fetch("/api/site-config", {
          cache: "no-store",
          headers: { accept: "application/json" },
        });
        if (!publicResponse.ok) {
          throw new Error(`前台配置接口返回 ${publicResponse.status}`);
        }
        const published = (await publicResponse.json()) as {
          services?: Array<Record<string, unknown>>;
          content?: Record<string, string>;
        };
        if (change.type === "content") {
          const key = String(change.key ?? "");
          if (!key || published.content?.[key] !== String(change.value ?? "")) {
            throw new Error("前台读取到的内容与本次保存内容不一致");
          }
        } else if (change.type === "contentBatch") {
          const values = (change.values ?? {}) as Record<string, unknown>;
          const mismatchedKey = Object.entries(values).find(
            ([key, value]) => published.content?.[key] !== String(value),
          )?.[0];
          if (mismatchedKey) {
            throw new Error(`前台尚未读取到更新内容：${mismatchedKey}`);
          }
        } else if (change.type === "service") {
          const item = (change.item ?? {}) as Record<string, unknown>;
          const actual = published.services?.find(
            (service) => service.id === item.id,
          );
          const mismatch =
            item.active === false
              ? Boolean(actual)
              : !actual ||
                [
                  "nameEn",
                  "nameZh",
                  "descriptionEn",
                  "descriptionZh",
                  "price",
                  "active",
                  "imageUrl",
                  "sortOrder",
                ].some((key) => actual[key] !== item[key]);
          if (mismatch) {
            throw new Error("前台服务列表尚未反映本次更新");
          }
        }
      }

      await load();
      if (shouldPublish) alert("发布成功：前台已读取到最新内容。");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "未知错误";
      alert(
        shouldPublish
          ? `发布失败：${reason}。请检查后重试；如后台已保存，请刷新前台再确认。`
          : `保存失败：${reason}`,
      );
      throw error;
    }
  }
  if (!ready) return <Login done={load} />;
  return (
    <SidebarProvider
      defaultOpen
      className="min-h-screen bg-[#f2f7f7] text-[#173a37]"
    >
      <AdminShell data={data} q={q} setQ={setQ} load={load} patch={patch} />
    </SidebarProvider>
  );
}
function AdminShell({
  data,
  q,
  setQ,
  load,
  patch,
}: {
  data: AdminData;
  q: string;
  setQ: (q: string) => void;
  load: () => void;
  patch: (body: unknown) => Promise<void>;
}) {
  const [section, setSection] = useState<AdminSection>("dashboard"),
    { setOpenMobile } = useSidebar(),
    titles: { [K in AdminSection]: string } = {
      dashboard: "控制台",
      orders: "预约订单",
      messages: "客户留言与回复",
      services: "增值服务",
      content: "网站内容",
      media: "媒体库",
      languages: "多语言内容",
      news: "新闻公告",
      calendar: "日期与容量",
      settings: "系统设置",
    },
    items: {
      id: AdminSection;
      label: string;
      icon: typeof Users;
    }[] = [
      { id: "dashboard", label: "控制台", icon: LayoutDashboard },
      { id: "orders", label: "预约订单", icon: Users },
      { id: "messages", label: "客户留言与回复", icon: MessageCircle },
      { id: "services", label: "增值服务", icon: Settings2 },
      { id: "content", label: "网站内容", icon: ImageIcon },
      { id: "media", label: "媒体库", icon: ImageIcon },
      { id: "languages", label: "多语言内容", icon: Languages },
      { id: "news", label: "新闻公告", icon: Newspaper },
      { id: "calendar", label: "日期与容量", icon: CalendarOff },
      { id: "settings", label: "系统设置", icon: Settings2 },
    ];
  function select(id: AdminSection) {
    setSection(id);
    setOpenMobile(false);
  }
  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    location.reload();
  }
  return (
    <>
      <Sidebar collapsible="offcanvas" className="border-r border-[#d7e7e5]">
        <SidebarHeader className="border-b border-[#d7e7e5] p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0f6d68] text-white">
              <LayoutDashboard />
            </span>
            <div className="min-w-0">
              <b className="block truncate text-lg">比邻管理中心</b>
              <p className="truncate text-sm text-slate-500">日常运营管理</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-5">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2 px-3 text-sm font-bold tracking-[.1em] text-[#6b8582]">
              管理菜单
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items
                  .filter(
                    (item) =>
                      data.role !== "staff" ||
                      ["dashboard", "orders", "messages"].includes(item.id),
                  )
                  .map(({ id, label, icon: Icon }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        isActive={section === id}
                        onClick={() => select(id)}
                        tooltip={label}
                        className="h-13 px-3 text-[17px] data-[active=true]:bg-[#dff2f0] data-[active=true]:text-[#0f6d68]"
                      >
                        <Icon />
                        <b>{label}</b>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-[#d7e7e5] p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-11">
                <a href="/" target="_blank">
                  <ExternalLink />
                  <span>查看前台网站</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} className="h-11 text-red-700">
                <LogOut />
                <span>退出登录</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 bg-[#f2f7f7]">
        <header className="sticky top-0 z-30 flex min-h-18 items-center gap-3 border-b border-[#d7e7e5] bg-white/95 px-4 backdrop-blur lg:px-7">
          <SidebarTrigger className="size-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-[.1em] text-[#0f8b82]">
              比邻运营管理中心
            </p>
            <h1 className="truncate text-lg font-bold sm:text-xl">
              {titles[section]}
            </h1>
          </div>
          <Button className="shrink-0" size="sm" asChild>
            <a href="/api/admin/export">
              <Download />
              <span className="hidden sm:inline">导出 Excel</span>
            </a>
          </Button>
        </header>
        <div className="w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {titles[section]}
            </h2>
            <p className="mt-1 text-base text-slate-500">
              在这里集中处理网站日常运营事项。
            </p>
          </div>
          {section === "dashboard" && <Dashboard data={data} select={select} />}
          {section === "messages" && <div className="grid gap-6"><AdminInbox email={data.content.manager_email || "info@beneigh.com"} /><InquiriesPanel items={data.inquiries} patch={patch} /></div>}
          {section === "orders" && (
            <OrdersPanel
              bookings={data.bookings}
              q={q}
              setQ={setQ}
              load={load}
              patch={patch}
            />
          )}{" "}
          {section === "services" && (
            <ServiceEditor items={data.services} save={patch} />
          )}{" "}
          {section === "calendar" && <Capacity save={patch} />}{" "}
          {section === "content" && (
            <ContentEditor content={data.content} save={patch} />
          )}
          {section === "media" && <MediaLibrary content={data.content} save={patch} />}
          {section === "languages" && <LanguageEditor content={data.content} save={patch} />}
          {section === "settings" && <div className="grid gap-5"><SystemSettings content={data.content} save={patch} /><PasswordSettings /></div>}
          {section === "news" && <NewsEditor content={data.content} save={patch} />}
        </div>
      </SidebarInset>
    </>
  );
}
function Dashboard({ data, select }: { data: AdminData; select: (id: AdminSection) => void }) {
  const pending = data.bookings.filter((x) => x.status === "pending").length;
  const newInquiries = data.inquiries.filter((x) => x.status === "new").length;
  const cards = [
    ["待处理预约", pending, "orders", Users],
    ["新客户留言", newInquiries, "messages", MessageCircle],
    ["已启用服务", data.services.filter((x) => x.active).length, "services", Settings2],
    ["网站内容模块", "可编辑", "content", FileText],
  ] as const;
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,target,Icon]) => <button key={label} onClick={() => select(target)} className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid size-11 place-items-center rounded-xl bg-[#e2f4f1] text-[#0f6d68]"><Icon /></span><p className="mt-5 text-sm font-bold text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></button>)}</div>;
}

type EditableItem = { id: string; titleEn: string; titleZh: string; textEn: string; textZh: string; date?: string; active: boolean; sortOrder: number };
const defaultFlowItems: EditableItem[] = [
  ["Step One: Provide Personal Information","第一步：提供个人资料","Choose a service, provide your name, contact details, nationality and expected travel dates.","选择服务，提供姓名、联络资料、国籍及预计往返日期。"],
  ["Step Two: Pre-assessment","第二步：预审","Understand the current situation, records, insurance or self-pay plan and preferred city.","了解患者情况、病历、保险或自费安排及意向城市。"],
  ["Step Three: Confirm the Itinerary","第三步：确定行程","Book flights, accommodation and dentist consultation dates.","预定机票、住宿和医生诊症日期。"],
  ["Step Four: Accompaniment","第四步：陪诊","Arrange airport pickup, translation, transportation, accommodation and consultation support.","安排接机、翻译、交通、住宿和会诊等支持。"],
  ["Step Five: Treatment","第五步：诊疗","The specialist provides the diagnosis, treatment plan, price and schedule.","专科医生提供诊断、治疗方案、价钱和治疗时间。"],
  ["Step Six: Follow-up","第六步：跟进","Continue remote communication and follow-up support when another visit is needed.","如需复诊或多次来华完成疗程，持续跟进和远程沟通。"],
].map((x,i)=>({id:`flow-${i+1}`,titleEn:x[0],titleZh:x[1],textEn:x[2],textZh:x[3],active:true,sortOrder:i+1}));
const defaultFaqItems: EditableItem[] = [
  ["Can I Get An Exact Price Before I Travel?","出发前能拿到准确报价吗？","A preliminary range may be possible after reviewing scans and records. Final fees require an examination.","审核资料后可提供初步范围，最终费用须面诊确认。"],
  ["Which Dental Records Should I Send?","需要提交哪些牙科资料？","Recent X-rays or CBCT, treatment history, medication and allergy information are helpful.","建议提供近期牙片或CBCT、治疗史、用药及过敏信息。"],
].map((x,i)=>({id:`faq-${i+1}`,titleEn:x[0],titleZh:x[1],textEn:x[2],textZh:x[3],active:true,sortOrder:i+1}));
function readItems(value: string | undefined, fallback: EditableItem[] = []): EditableItem[] { try { const x = JSON.parse(value || ""); return Array.isArray(x) ? x : fallback; } catch { return fallback; } }
function NewsEditor({ content, save }: { content: Record<string,string>; save: (x: unknown) => Promise<void> }) {
  const [items,setItems] = useState<EditableItem[]>(readItems(content.news_announcements));
  const add = () => setItems([...items,{id:`news-${Date.now()}`,titleEn:"New Announcement",titleZh:"新公告",textEn:"",textZh:"",date:new Date().toISOString().slice(0,10),active:true,sortOrder:items.length+1}]);
  return <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">新闻公告管理</h2><p className="mt-1 text-sm text-slate-500">新增、编辑、排序或隐藏前台公告。</p></div><Button variant="outline" onClick={add}>+ 新增公告</Button></div><div className="mt-6 grid gap-4">{items.map((item,i) => <div key={item.id} className="rounded-2xl border p-4"><div className="grid gap-4"><label className="grid gap-1 text-sm font-medium">英文标题<RichEditor value={item.titleEn} onChange={value=>setItems(items.map((x,j)=>j===i?{...x,titleEn:value}:x))} showPreview={false}/></label><label className="grid gap-1 text-sm font-medium">中文标题<RichEditor value={item.titleZh} onChange={value=>setItems(items.map((x,j)=>j===i?{...x,titleZh:value}:x))} showPreview={false}/></label><label className="grid gap-1 text-sm font-medium">英文内容<RichEditor value={item.textEn} onChange={value=>setItems(items.map((x,j)=>j===i?{...x,textEn:value}:x))} showPreview={false}/></label><label className="grid gap-1 text-sm font-medium">中文内容<RichEditor value={item.textZh} onChange={value=>setItems(items.map((x,j)=>j===i?{...x,textZh:value}:x))} showPreview={false}/></label><Input type="date" value={item.date || ""} onChange={e=>setItems(items.map((x,j)=>j===i?{...x,date:e.target.value}:x))}/><label className="flex items-center gap-3"><Switch checked={item.active} onCheckedChange={v=>setItems(items.map((x,j)=>j===i?{...x,active:v}:x))}/>前台显示</label></div><Button variant="ghost" className="mt-3 text-red-600" onClick={()=>setItems(items.filter((_,j)=>j!==i))}><Trash2 /> 删除</Button></div>)}</div><Button className="mt-6" onClick={()=>save({type:"content",key:"news_announcements",value:JSON.stringify(items)})}>保存并发布</Button></section>;
}
function ContentListEditor({ title, storageKey, value, fallback, save }: { title: string; storageKey: string; value?: string; fallback: EditableItem[]; save: (x: unknown) => Promise<void> }) {
  const [items,setItems] = useState<EditableItem[]>(readItems(value, fallback));
  const add = () => setItems([...items,{id:`item-${Date.now()}`,titleEn:"",titleZh:"",textEn:"",textZh:"",active:true,sortOrder:items.length+1}]);
  return <section className="rounded-2xl bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">可新增、编辑、排序或隐藏，保存后同步前台。</p></div><Button variant="outline" onClick={add}>+ 新增项目</Button></div><div className="mt-5 grid gap-4">{items.map((item,i)=><div key={item.id} className="rounded-xl border p-4"><div className="grid gap-4"><label className="grid gap-1 text-sm font-medium">英文标题<RichEditor value={item.titleEn} onChange={value=>setItems(items.map((x,j)=>j===i?{...x,titleEn:value}:x))} showPreview={false}/></label><label className="grid gap-1 text-sm font-medium">中文标题<RichEditor value={item.titleZh} onChange={value=>setItems(items.map((x,j)=>j===i?{...x,titleZh:value}:x))} showPreview={false}/></label><label className="grid gap-1 text-sm font-medium">英文内容<RichEditor value={item.textEn} onChange={value=>setItems(items.map((x,j)=>j===i?{...x,textEn:value}:x))} showPreview={false}/></label><label className="grid gap-1 text-sm font-medium">中文内容<RichEditor value={item.textZh} onChange={value=>setItems(items.map((x,j)=>j===i?{...x,textZh:value}:x))} showPreview={false}/></label><Input type="number" value={item.sortOrder} onChange={e=>setItems(items.map((x,j)=>j===i?{...x,sortOrder:Number(e.target.value)}:x))} placeholder="排序"/><label className="flex items-center gap-3"><Switch checked={item.active} onCheckedChange={v=>setItems(items.map((x,j)=>j===i?{...x,active:v}:x))}/>前台显示</label></div><Button variant="ghost" className="mt-2 text-red-600" onClick={()=>setItems(items.filter((_,j)=>j!==i))}><Trash2 /> 删除</Button></div>)}</div><Button className="mt-5" onClick={()=>save({type:"content",key:storageKey,value:JSON.stringify(items)})}>保存并发布</Button></section>;
}
function OrdersPanel({
  bookings,
  q,
  setQ,
  load,
  patch,
}: {
  bookings: Booking[];
  q: string;
  setQ: (q: string) => void;
  load: () => void;
  patch: (body: unknown) => Promise<void>;
}) {
  const [dateFilter, setDateFilter] = useState(""),
    [serviceFilter, setServiceFilter] = useState(""),
    [statusFilter, setStatusFilter] = useState("");
  const filtered = bookings.filter(
    (b) =>
      (!dateFilter || b.preferredDate === dateFilter) &&
      (!serviceFilter || b.services.includes(serviceFilter)) &&
      (!statusFilter || b.status === statusFilter),
  );
  return (
    <section className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex w-full max-w-lg gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
          placeholder="姓名、电话、服务或预约编号"
        />
        <Button aria-label="Search orders" onClick={load}>
          <Search />
        </Button>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Input
          type="date"
          aria-label="Filter booking date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <select
          aria-label="Filter service"
          className="min-h-11 rounded-lg border px-3"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
        >
          <option value="">全部服务</option>
          <option value="implants">Dental Implants</option>
          <option value="general">General Dentistry</option>
          <option value="cosmetic">Cosmetic Dentistry</option>
          <option value="customized">Customized</option>
        </select>
        <select
          aria-label="Filter status"
          className="min-h-11 rounded-lg border px-3"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已确认</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>
      <div className="grid gap-3 sm:hidden">{filtered.map((b)=><article key={b.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><b>{b.name}</b><p className="mt-1 text-xs text-slate-500">{b.reference}</p></div><select className="h-10 rounded-lg border px-2" value={b.status} onChange={e=>patch({type:"booking",id:b.id,status:e.target.value})}><option value="pending">待确认</option><option value="confirmed">已确认</option><option value="cancelled">已取消</option></select></div><p className="mt-3 text-sm">{b.arrivalDate || b.preferredDate} 至 {b.returnDate || "待确认"}</p><p className="mt-1 text-sm text-slate-600">{b.email}</p></article>)}</div>
      <div className="hidden overflow-x-auto sm:block">
        <Table className="min-w-[850px]">
          <TableHeader>
            <TableRow>
              <TableHead>预约编号</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>计划行程</TableHead>
              <TableHead>服务</TableHead>
              <TableHead>国家/地区</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-bold">{b.reference}</TableCell>
                <TableCell>
                  {b.name}
                  <br />
                  <span className="text-xs text-slate-500">
                    {b.phone} · {b.email}
                  </span>
                </TableCell>
                <TableCell>
                  {b.arrivalDate || b.preferredDate}
                  <br />
                  至 {b.returnDate || "待确认"}
                </TableCell>
                <TableCell className="max-w-60 truncate">
                  {b.services
                    .replace(/implants/g, "Dental Implants")
                    .replace(/general/g, "General Dentistry")
                    .replace(/cosmetic/g, "Cosmetic Dentistry")
                    .replace(/customized/g, "Customized")}
                </TableCell>
                <TableCell>
                  {b.country || "—"}<br />{b.region || ""}
                </TableCell>
                <TableCell>
                  <select
                    className="h-10 rounded-lg border px-2"
                    value={b.status}
                    onChange={(e) =>
                      patch({
                        type: "booking",
                        id: b.id,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="pending">待确认</option>
                    <option value="confirmed">已确认</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && (
          <p className="py-12 text-center text-slate-500">没有符合条件的预约</p>
        )}
      </div>
    </section>
  );
}
function InquiriesPanel({
  items,
  patch,
}: {
  items: Inquiry[];
  patch: (body: unknown) => Promise<void>;
}) {
  return (
    <section className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-4 text-base text-slate-600">
        查看前台 Contact Us 表单提交的姓名、联系方式和询问内容。
      </p>
      <div className="grid gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[#d7e7e5] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {item.email}
                  {item.phone && ` · ${item.phone}`}
                </p>
                <p className="mt-1 text-sm text-slate-500">{item.createdAt}</p>
              </div>
              <select
                className="h-10 rounded-lg border px-3 text-sm"
                value={item.status}
                onChange={(e) =>
                  patch({
                    type: "inquiry",
                    id: item.id,
                    status: e.target.value,
                  })
                }
              >
                <option value="new">新询问</option>
                <option value="contacted">已联系</option>
                <option value="closed">已完成</option>
              </select>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f3f8f7] p-4 leading-7">
              {item.message}
            </p>
          </article>
        ))}
        {!items.length && (
          <p className="py-12 text-center text-slate-500">暂无客户询问</p>
        )}
      </div>
    </section>
  );
}
function Login({ done }: { done: () => void }) {
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const found = collectFormIssues(form, "zh");
    setIssues(found);
    if (found.length) {
      const first = markInvalidFields(form, "zh");
      first?.focus();
      setError(summaryText(found, "zh"));
      return;
    }
    clearInvalidFields(form);
    setError("");
    const f = new FormData(form);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(f.entries())),
    });
    if (r.ok) done();
    else setError("账号或密码不正确");
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#153f3c] p-5">
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        <FormIssueList issues={issues} lang="zh" />
        <p className="text-sm font-bold text-[#0f8b82]">安全管理入口</p>
        <h1 className="mt-2 text-3xl font-bold">管理员登录</h1>
        <p className="mt-2 text-slate-500">登录会话将在30分钟后自动过期。</p>
        <Input
          className="mt-7 h-12"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="账号"
          required
        />
        <Input
          className="mt-3 h-12"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="密码"
          required
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="mt-5 h-12 w-full">
          登录
        </Button>
        <button type="button" className="mt-4 w-full text-sm text-[#0f6d68] underline" onClick={() => setForgot(!forgot)}>
          忘记密码 / 重设密码
        </button>
        {forgot && <div className="mt-4 rounded-xl bg-slate-50 p-4"><Input type="email" value={recoveryEmail} onChange={e=>setRecoveryEmail(e.target.value)} placeholder="管理员恢复邮箱"/><Button type="button" variant="outline" className="mt-3 w-full" onClick={async()=>{setNotice(""); const r=await fetch("/api/admin/password/forgot",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:recoveryEmail})}); const out=await r.json() as {message?:string;error?:string}; setNotice(out.message||out.error||"请求已提交");}}>发送重设邮件</Button>{notice&&<p className="mt-2 text-sm text-slate-600">{notice}</p>}</div>}
      </form>
    </main>
  );
}
function ServiceEditor({
  items,
  save,
}: {
  items: Service[];
  save: (x: unknown) => void;
}) {
  const blank = {
    id: "",
    nameEn: "",
    nameZh: "",
    descriptionEn: "",
    descriptionZh: "",
    price: 0,
    active: true,
    imageUrl: "",
    sortOrder: 0,
  };
  const [item, setItem] = useState<Service>(items[0] || blank);
  const generatedIdPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const createdCount = useRef(0);
  return (
    <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
      <aside className="rounded-2xl bg-white p-4">
        {items.map((x) => (
          <button
            key={x.id}
            onClick={() => setItem(x)}
            className="mb-2 w-full rounded-xl border p-3 text-left hover:bg-[#eef8f7]"
          >
            <b>{x.nameEn}</b>
            <span className="float-right">${x.price}</span>
            <p className="text-sm text-slate-500">
              {x.nameZh} · {x.active ? "已显示" : "已隐藏"}
            </p>
          </button>
        ))}
        <Button
          className="mt-2 w-full"
          variant="outline"
          onClick={() => {
            createdCount.current += 1;
            setItem({
              ...blank,
              id: `service-${generatedIdPrefix}-${createdCount.current}`,
            });
          }}
        >
          + 新增服务
        </Button>
      </aside>
      <section className="rounded-2xl bg-white p-6">
        <h2 className="text-xl font-bold">服务项目详情</h2>
        <p className="mt-2 text-sm text-slate-500">
          可编辑图片、中英文内容、美元价格及排序；暂不使用时可关闭前台显示。
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">英文名称<RichEditor key={`${item.id}-name-en`} value={item.nameEn} onChange={(nameEn) => setItem({ ...item, nameEn })} showPreview={false} /></label>
          <label className="grid gap-1 text-sm font-medium">中文名称<RichEditor key={`${item.id}-name-zh`} value={item.nameZh} onChange={(nameZh) => setItem({ ...item, nameZh })} showPreview={false} /></label>
          <label className="grid gap-1 text-sm font-medium">英文简介<RichEditor key={`${item.id}-description-en`} value={item.descriptionEn} onChange={(descriptionEn) => setItem({ ...item, descriptionEn })} showPreview={false} /></label>
          <label className="grid gap-1 text-sm font-medium">中文描述<RichEditor key={`${item.id}-description-zh`} value={item.descriptionZh} onChange={(descriptionZh) => setItem({ ...item, descriptionZh })} showPreview={false} /></label>
          <Input
            type="number"
            value={item.price}
            onChange={(e) =>
              setItem({ ...item, price: Number(e.target.value) })
            }
            placeholder="美元价格"
          />
          <Input
            type="number"
            value={item.sortOrder}
            onChange={(e) =>
              setItem({ ...item, sortOrder: Number(e.target.value) })
            }
            placeholder="显示顺序"
          />
          <div className="sm:col-span-2">
            <ImageEditor
              label="服务图片"
              value={item.imageUrl}
              slot={`service-${item.id || "new"}`}
              onChange={(imageUrl) => setItem({ ...item, imageUrl })}
            />
          </div>
          <label className="flex items-center gap-3">
            <Switch
              checked={item.active}
              onCheckedChange={(v) => setItem({ ...item, active: v })}
            />
            在前台显示
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => save({ type: "service", item })}>
            保存并发布
          </Button>
          {items.some((x) => x.id === item.id) && (
            <Button
              variant="outline"
              className="text-red-600"
              onClick={async () => {
                if (confirm("确定删除这个服务项目吗？")) {
                  await fetch("/api/admin/data", {
                    method: "DELETE",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ type: "service", id: item.id }),
                  });
                  location.reload();
                }
              }}
            >
              <Trash2 />
              删除
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
function Capacity({ save }: { save: (x: unknown) => void }) {
  const [date, setDate] = useState(""),
    [slot, setSlot] = useState("09:00–12:00"),
    [capacity, setCapacity] = useState(3),
    [closed, setClosed] = useState(false);
  return (
    <section className="max-w-2xl rounded-2xl bg-white p-6">
      <h2 className="text-xl font-bold">日期与时段容量</h2>
      <p className="mt-2 text-slate-500">
        可关闭整天或某个时段，也可设置可接待人数。
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <select
          className="h-10 rounded-lg border px-3"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
        >
          <option value="*">整天 / 每日总容量</option>
          <option>09:00–12:00</option>
          <option>13:00–17:00</option>
          <option>18:00–21:00</option>
        </select>
        <Input
          type="number"
          min="0"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
        <label className="flex items-center gap-3">
          <Switch checked={closed} onCheckedChange={setClosed} />
          关闭该时段
        </label>
      </div>
      <Button
        className="mt-6"
        disabled={!date}
        onClick={() =>
          save({ type: "availability", date, timeSlot: slot, capacity, closed })
        }
      >
        保存容量设置
      </Button>
    </section>
  );
}
function ContentEditor({
  content,
  save,
}: {
  content: Record<string, string>;
  save: (x: unknown) => Promise<void>;
}) {
  const payment = (() => {
    try {
      return JSON.parse(content.payment_settings || "{}") as Record<
        string,
        boolean
      >;
    } catch {
      return {};
    }
  })();
  const [intro, setIntro] = useState(content.homepage_intro || ""),
    [defaultImage, setDefaultImage] = useState(
      content.hero_default_image || "/dental-hero.webp",
    ),
    [specialImage, setSpecialImage] = useState(
      content.hero_special_image || "",
    ),
    [specialEnabled, setSpecialEnabled] = useState(
      content.hero_special_enabled === "true",
    ),
    [labelEn, setLabelEn] = useState(
      content.hero_special_label_en || "Special seasonal welcome",
    ),
    [labelZh, setLabelZh] = useState(
      content.hero_special_label_zh || "特别节日欢迎场景",
    ),
    [email, setEmail] = useState(content.manager_email || "info@beneigh.com"),
    [wechatUrl, setWechatUrl] = useState(content.wechat_chat_url || ""),
    [wechatQr, setWechatQr] = useState(content.wechat_qr_image || ""),
    [methods, setMethods] = useState<Record<string, boolean>>({
      wechat: !!payment.wechat,
      alipay: !!payment.alipay,
      card: !!payment.card,
      paypal: !!payment.paypal,
    }),
    [saved, setSaved] = useState(false);
  async function saveAll() {
    await save({
      type: "contentBatch",
      values: {
        homepage_intro: intro,
        hero_default_image: defaultImage,
        hero_special_image: specialImage,
        hero_special_enabled: String(specialEnabled),
        hero_special_label_en: labelEn,
        hero_special_label_zh: labelZh,
        manager_email: email,
        wechat_chat_url: wechatUrl,
        wechat_qr_image: wechatQr,
        payment_settings: JSON.stringify(methods),
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="grid gap-5">
      <PageContentManager content={content} save={save} />
      <CaseItemsEditor content={content} save={save} />
      <section className="rounded-2xl bg-white p-6">
        <h2 className="text-xl font-bold">首页文案</h2>
        <RichEditor value={intro} onChange={setIntro} />
      </section>
      <ContentListEditor title="服务流程" storageKey="service_flow_json" value={content.service_flow_json} fallback={defaultFlowItems} save={save} />
      <ContentListEditor title="常见问题" storageKey="faq_items_json" value={content.faq_items_json} fallback={defaultFaqItems} save={save} />
      <section className="rounded-2xl bg-white p-6">
        <h2 className="text-xl font-bold">首页场景图片</h2>
        <p className="mt-2 text-sm text-slate-500">
          可保留默认主图，也可在节日或特殊日期切换临时图片；发布前可裁剪、旋转并添加水印。
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <ImageEditor
            label="默认首页主图"
            value={defaultImage}
            slot="hero-default"
            onChange={setDefaultImage}
          />
          <div>
            <ImageEditor
              label="特殊日期图片"
              value={specialImage}
              slot="hero-special"
              onChange={setSpecialImage}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">英文标签<RichEditor key="special-label-en" value={labelEn} onChange={setLabelEn} showPreview={false}/></label>
              <label className="grid gap-1 text-sm font-medium">中文标签<RichEditor key="special-label-zh" value={labelZh} onChange={setLabelZh} showPreview={false}/></label>
            </div>
            <label className="mt-4 flex items-center gap-3">
              <Switch
                checked={specialEnabled}
                onCheckedChange={setSpecialEnabled}
              />
              首页启用特殊日期图片
            </label>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-6">
        <h2 className="text-xl font-bold">
          联系方式与预留支付方式
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          邮箱将向客户显示。支付方式在商业条款及收款账户确认前仅作为接口预留。
        </p>
        <Input
          className="mt-5 max-w-xl"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="管理员邮箱，例如 name@beneigh.com"
        />
        <label className="mt-5 block text-base font-bold">
          微信官方聊天链接（u.wechat.com 或 work.weixin.qq.com）
        </label>
        <Input
          className="mt-2"
          value={wechatUrl}
          onChange={(e) => setWechatUrl(e.target.value)}
          placeholder="填写官方聊天链接，不填写电话号码"
        />
        <label className="mt-5 block text-base font-bold">
          微信联系二维码图片地址
        </label>
        <Input
          className="mt-2"
          value={wechatQr}
          onChange={(e) => setWechatQr(e.target.value)}
          placeholder="填写真实微信联系二维码图片地址"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["wechat", "WeChat Pay"],
            ["alipay", "Alipay"],
            ["card", "Credit card"],
            ["paypal", "PayPal"],
          ].map(([id, name]) => (
            <label
              key={id}
              className="flex items-center gap-3 rounded-xl border p-4"
            >
              <Switch
                checked={!!methods[id]}
                onCheckedChange={(v) => setMethods({ ...methods, [id]: v })}
              />
              {name}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          开启后仅显示为“计划支持/确认后可用”；支付网关接入前不会实际收款。
        </p>
      </section>
      <Button className="w-fit" onClick={saveAll}>
        {saved ? "已保存" : "保存全部网站设置"}
      </Button>
    </div>
  );
}
type EditableCase = { id: string; titleEn: string; titleZh: string; bodyEn: string; bodyZh: string; prices: { flights: number; stay: number; treatment: number; support: number; other: number } };
const defaultCaseItems: EditableCase[] = [
  { id:"smith", titleEn:"Mr Smith's Half-arch Implant Journey", titleZh:"史勿夫先生半口植牙案例", bodyEn:"After a full examination and 3D scan, decayed roots were removed and a half-arch implant plan was arranged.", bodyZh:"经全面检查及3D扫描后，拔除已腐坏牙根并安排半口植牙。", prices:{flights:2500,stay:2400,treatment:8500,support:800,other:500} },
  { id:"mary", titleEn:"Mary's Multi-stage Dental Journey", titleZh:"玛莉多阶段牙科治疗案例", bodyEn:"After a sports injury, Mary planned four visits to China for extractions, implants, periodontal care and orthodontic restoration.", bodyZh:"玛莉因运动受伤，计划四次来华完成拔牙、植牙、牙周治疗及矫形修补。", prices:{flights:5000,stay:4000,treatment:5200,support:1200,other:0} },
  { id:"john", titleEn:"John's Dental Care During a China Visit", titleZh:"约翰旅游期间牙齿保养案例", bodyEn:"John combined a routine dental visit with his China holiday, including cleaning, fillings and light orthodontic care.", bodyZh:"约翰在中国旅游期间完成洗牙、补牙和轻度矫形。", prices:{flights:0,stay:0,treatment:300,support:35,other:0} },
];
function CaseItemsEditor({content,save}:{content:Record<string,string>;save:(x:unknown)=>Promise<void>}) {
  const [items,setItems]=useState<EditableCase[]>(()=>{try{const x=JSON.parse(content.case_items_json||"");return Array.isArray(x)&&x.length?x:defaultCaseItems}catch{return defaultCaseItems}});
  const patchItem=(i:number,patch:Partial<EditableCase>)=>setItems(items.map((x,j)=>j===i?{...x,...patch}:x));
  const patchPrice=(i:number,key:keyof EditableCase["prices"],value:number)=>setItems(items.map((x,j)=>j===i?{...x,prices:{...x.prices,[key]:value}}:x));
  return <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">案例与参考价格</h2><p className="mt-2 text-sm text-slate-500">案例内容和价格可分别编辑；价格为 0 时前台自动隐藏该项目。英文版与中文版独立维护。</p><div className="mt-5 grid gap-5">{items.map((item,i)=><article key={item.id} className="rounded-2xl border p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">英文标题<Input value={item.titleEn} onChange={e=>patchItem(i,{titleEn:e.target.value})}/></label><label className="grid gap-1 text-sm font-medium">中文标题<Input value={item.titleZh} onChange={e=>patchItem(i,{titleZh:e.target.value})}/></label><label className="grid gap-1 text-sm font-medium sm:col-span-2">英文案例内容<Textarea rows={4} value={item.bodyEn} onChange={e=>patchItem(i,{bodyEn:e.target.value})}/></label><label className="grid gap-1 text-sm font-medium sm:col-span-2">中文案例内容<Textarea rows={4} value={item.bodyZh} onChange={e=>patchItem(i,{bodyZh:e.target.value})}/></label>{([['flights','来回机票'],['stay','中国交通食宿'],['treatment','治疗费用'],['support','陪诊服务'],['other','其他']] as const).map(([key,label])=><label key={key} className="grid gap-1 text-sm font-medium">{label}<Input type="number" min="0" value={item.prices[key]} onChange={e=>patchPrice(i,key,Number(e.target.value))}/></label>)}</div></article>)}</div><Button className="mt-5" onClick={()=>save({type:"content",key:"case_items_json",value:JSON.stringify(items)})}>保存并发布案例</Button></section>;
}

type CmsSection = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  body: string;
  image: string;
  buttonText: string;
  buttonUrl: string;
  visible: boolean;
  sortOrder: number;
};
type CmsPage = { title: string; seoTitle: string; seoDescription: string; sections: CmsSection[] };
const cmsDefaults: Record<string, CmsPage> = {
  home_page_json: { title: "首页", seoTitle: "Be Neighbor | MediCare", seoDescription: "Professional medical accompaniment services in China.", sections: [
    { id:"hero",label:"首页首屏",title:"Close Care to Afar Friends, Stay Comfort on the Treatment Journey",subtitle:"Professional medical accompaniment services in China",body:"China covers a vast territory and has a large population. After years of development, various medical services have become increasingly comprehensive, and its equipment and experience have reached international standards.",image:"/dental-hero.webp",buttonText:"Choose Your Service",buttonUrl:"#services",visible:true,sortOrder:1 },
    { id:"services",label:"服务项目",title:"China Medical Care",subtitle:"Services",body:"From pre-assessment, booking, flight ticket, pick up, transportation and accommodation in China, translation, accompaniment, post consultation, sightseeing and follow up.",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:2 },
    { id:"pricing",label:"案例与参考价格",title:"Cases and Reference Price",subtitle:"Cases",body:"Illustrative patient journeys and reference costs. Final treatment scope and clinical fees are confirmed separately.",image:"",buttonText:"More...",buttonUrl:"#cases",visible:true,sortOrder:3 },
    { id:"process",label:"服务流程",title:"The Completed Process Indication",subtitle:"Flow",body:"Please follow the direction to enjoy the China medical services.",image:"",buttonText:"Apply for Medical Booking",buttonUrl:"#booking",visible:true,sortOrder:4 },
    { id:"testimonials",label:"客户案例",title:"Cases and Reference Price",subtitle:"Cases",body:"",image:"",buttonText:"More...",buttonUrl:"#cases",visible:false,sortOrder:5 },
    { id:"faq",label:"常见问题",title:"Questions Before You Travel",subtitle:"FAQ",body:"",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:6 },
    { id:"contact",label:"联系我们",title:"Contact Us",subtitle:"Get In Touch",body:"Send a short inquiry and our team will reply.",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:7 },
  ]},
  dental_implants_page_json: { title:"种植牙页面",seoTitle:"Dental Implants In China | Be Neighbor",seoDescription:"Plan dental implant care in China with record review and bilingual coordination.",sections:servicePageSections("Dental Implants At Be Neighbor","Plan implant care with clearer records, clinic matching and travel coordination.","/dental-plan.webp") },
  general_dentistry_page_json: { title:"普通牙科页面",seoTitle:"General Dentistry In China | Be Neighbor",seoDescription:"Coordinate examinations, preventive care and restorative dentistry in China.",sections:servicePageSections("General Dentistry At Be Neighbor","Coordinate preventive and restorative dental care in China.","/dental-hero.webp") },
  cosmetic_dentistry_page_json: { title:"牙科美容页面",seoTitle:"Cosmetic Dentistry In China | Be Neighbor",seoDescription:"Explore dentist-led cosmetic dentistry options in China.",sections:servicePageSections("Cosmetic Dentistry At Be Neighbor","Explore dentist-led options for tooth color, shape and smile balance.","/arrival-care.webp") },
};
function servicePageSections(title:string,body:string,image:string):CmsSection[]{return [
  {id:"hero",label:"服务页首屏",title,subtitle:"Dental Care In China",body,image,buttonText:"Request A Consultation",buttonUrl:"#consult",visible:true,sortOrder:1},
  {id:"benefits",label:"项目优势",title:"What This Service Can Address",subtitle:"Treatment Overview",body:"Edit the detailed treatment overview and key benefits here.",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:2},
  {id:"cases",label:"案例展示",title:"Illustrative Patient Journey",subtitle:"Demo Case",body:"Replace this demo with an authorized patient case when available.",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:3},
  {id:"process",label:"服务流程",title:"How The Process Works",subtitle:"Planning Steps",body:"Explain the record review, treatment planning and travel coordination process.",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:4},
  {id:"team",label:"团队介绍",title:"Your Coordination Team",subtitle:"Bilingual Support",body:"Introduce the authorized clinical and coordination team here.",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:5},
  {id:"faq",label:"常见问题",title:"Frequently Asked Questions",subtitle:"FAQ",body:"",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:6},
  {id:"contact",label:"咨询表单",title:"Request A Consultation",subtitle:"Contact Us",body:"Share your needs and our team will reply.",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:7},
]}
function parseCmsPage(value: string | undefined, key: string): CmsPage { try { const parsed=JSON.parse(value||""); return {...cmsDefaults[key],...parsed,sections:Array.isArray(parsed.sections)?parsed.sections:cmsDefaults[key].sections}; } catch { return cmsDefaults[key]; } }
function PageContentManager({content,save}:{content:Record<string,string>;save:(x:unknown)=>Promise<void>}) {
  const pages = Object.keys(cmsDefaults);
  const [pageKey,setPageKey]=useState(pages[0]);
  const [page,setPage]=useState<CmsPage>(()=>parseCmsPage(content[pages[0]],pages[0]));
  function choose(key:string){setPageKey(key);setPage(parseCmsPage(content[key],key));}
  function updateSection(i:number, patch:Partial<CmsSection>){setPage({...page,sections:page.sections.map((s,j)=>j===i?{...s,...patch}:s)});}
  function addSection(){setPage({...page,sections:[...page.sections,{id:`section-${Date.now()}`,label:"新模块",title:"",subtitle:"",body:"",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:page.sections.length+1}]});}
  return <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">页面内容管理</h2><p className="mt-1 text-sm text-slate-500">编辑各页面文字、图片、按钮、SEO；可框选文字设置字体、字号和颜色。未设置格式的文字沿用前台原样式。</p></div><Button variant="outline" onClick={addSection}>+ 新增内容模块</Button></div>
    <div className="mt-5 flex flex-wrap gap-2">{pages.map(k=><Button key={k} variant={pageKey===k?"default":"outline"} onClick={()=>choose(k)}>{cmsDefaults[k].title}</Button>)}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><Input value={page.seoTitle} onChange={e=>setPage({...page,seoTitle:e.target.value})} placeholder="SEO标题"/><Input value={page.seoDescription} onChange={e=>setPage({...page,seoDescription:e.target.value})} placeholder="SEO描述"/></div>
    <div className="mt-5 grid gap-4">{page.sections.sort((a,b)=>a.sortOrder-b.sortOrder).map((s,i)=><article key={`${pageKey}-${s.id}`} className="rounded-2xl border p-4"><div className="flex items-center justify-between gap-3"><Input className="max-w-xs font-bold" value={s.label} onChange={e=>updateSection(i,{label:e.target.value})}/><label className="flex items-center gap-2"><Switch checked={s.visible} onCheckedChange={v=>updateSection(i,{visible:v})}/>前台显示</label></div><div className="mt-3 grid gap-4"><label className="grid gap-1 text-sm font-medium">小标题<RichEditor key={`${pageKey}-${s.id}-subtitle`} value={s.subtitle} onChange={subtitle=>updateSection(i,{subtitle})} showPreview={false}/></label><label className="grid gap-1 text-sm font-medium">主标题<RichEditor key={`${pageKey}-${s.id}-title`} value={s.title} onChange={title=>updateSection(i,{title})} showPreview={false}/></label><label className="grid gap-1 text-sm font-medium">正文<RichEditor key={`${pageKey}-${s.id}-body`} value={s.body} onChange={body=>updateSection(i,{body})} showPreview={false}/></label><ImageEditor label="模块图片" value={s.image} slot={`${pageKey}-${s.id}`} onChange={image=>updateSection(i,{image})}/><div className="grid content-start gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">按钮文字<RichEditor key={`${pageKey}-${s.id}-button`} value={s.buttonText} onChange={buttonText=>updateSection(i,{buttonText})} showPreview={false}/></label><Input value={s.buttonUrl} onChange={e=>updateSection(i,{buttonUrl:e.target.value})} placeholder="按钮链接"/><Input type="number" value={s.sortOrder} onChange={e=>updateSection(i,{sortOrder:Number(e.target.value)})} placeholder="排序"/></div></div><Button variant="ghost" className="mt-2 text-red-600" onClick={()=>setPage({...page,sections:page.sections.filter(x=>x.id!==s.id)})}><Trash2/>删除模块</Button></article>)}</div>
    <Button className="mt-5" onClick={()=>save({type:"content",key:pageKey,value:JSON.stringify(page)})}>保存并发布此页面</Button>
  </section>;
}
function MediaLibrary({content,save}:{content:Record<string,string>;save:(x:unknown)=>Promise<void>}) { const [items,setItems]=useState<string[]>(()=>{try{return JSON.parse(content.media_library_json||"[]")}catch{return[]}}); const [image,setImage]=useState(""); const uploadSlot=useId().replace(/[^a-zA-Z0-9_-]/g, ""); return <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">媒体库</h2><p className="mt-1 text-sm text-slate-500">上传后可复制图片地址，用于首页、服务页、案例和团队模块。</p><div className="mt-5 max-w-xl"><ImageEditor label="上传新图片" value={image} slot={`library-${uploadSlot}`} onChange={setImage}/><Button className="mt-3" disabled={!image} onClick={async()=>{const next=[image,...items.filter(x=>x!==image)];setItems(next);await save({type:"content",key:"media_library_json",value:JSON.stringify(next)});setImage("")}}>加入媒体库</Button></div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((url,i)=><article key={url} className="rounded-xl border p-3"><img src={url} alt="媒体库图片" className="aspect-video w-full rounded-lg object-cover"/><Input readOnly value={url} className="mt-2 text-xs"/><Button variant="ghost" className="mt-1 text-red-600" onClick={async()=>{const next=items.filter((_,j)=>j!==i);setItems(next);await save({type:"content",key:"media_library_json",value:JSON.stringify(next)})}}><Trash2/>移除记录</Button></article>)}</div></section> }
function LanguageEditor({content,save}:{content:Record<string,string>;save:(x:unknown)=>Promise<void>}) { const [value,setValue]=useState(content.language_overrides_json||"{}"); return <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">多语言内容</h2><p className="mt-2 text-sm text-slate-500">用于保存日语、韩语、葡萄牙语、西班牙语、法语和阿拉伯语的人工校对译文。未填写的内容继续使用英文。</p><Textarea className="mt-5 min-h-80 font-mono" value={value} onChange={e=>setValue(e.target.value)} placeholder='{"ja":{"home.hero.title":"..."}}'/><Button className="mt-4" onClick={()=>save({type:"content",key:"language_overrides_json",value})}>保存多语言内容</Button></section> }
function SystemSettings({content,save}:{content:Record<string,string>;save:(x:unknown)=>Promise<void>}) { const defaults={brandName:"Be Neighbor",tagline:"MediCare",phone:"+86 139 1234 5678",email:"info@beneigh.com",whatsapp:"8613912345678",footerText:"Dental care planning and travel coordination in China."}; const [settings,setSettings]=useState(()=>{try{return {...defaults,...JSON.parse(content.global_settings_json||"{}")}}catch{return defaults}}); return <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">全站设置</h2><p className="mt-2 text-sm text-slate-500">统一管理品牌、联系方式、页头和页脚基础内容。</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(settings).map(([k,v])=><label key={k} className="grid gap-1 text-sm font-bold">{({brandName:"品牌名称",tagline:"品牌副标题",phone:"电话号码",email:"联系邮箱",whatsapp:"WhatsApp号码",footerText:"页脚简介"} as Record<string,string>)[k]||k}<Input value={String(v)} onChange={e=>setSettings({...settings,[k]:e.target.value})}/></label>)}</div><Button className="mt-5" onClick={()=>save({type:"content",key:"global_settings_json",value:JSON.stringify(settings)})}>保存全站设置</Button></section> }
function PasswordSettings(){const [currentPassword,setCurrentPassword]=useState("");const [newPassword,setNewPassword]=useState("");const [confirmPassword,setConfirmPassword]=useState("");const [recoveryEmail,setRecoveryEmail]=useState("");const [message,setMessage]=useState("");const [issues,setIssues]=useState<FieldIssue[]>([]);async function submit(e:React.FormEvent){e.preventDefault();const form=e.currentTarget;const found=collectFormIssues(form,"zh");setIssues(found);if(found.length){const first=markInvalidFields(form,"zh");first?.focus();setMessage(summaryText(found,"zh"));return}clearInvalidFields(form);setMessage("");if(newPassword!==confirmPassword){setMessage("两次输入的新密码不一致");return}const r=await fetch("/api/admin/password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({currentPassword,newPassword,recoveryEmail})});const out=await r.json() as {ok?:boolean;error?:string};if(r.ok){setMessage("密码和恢复邮箱已更新，请妥善保存新密码");setCurrentPassword("");setNewPassword("");setConfirmPassword("")}else setMessage(out.error||"修改失败")}return <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">登录安全</h2><p className="mt-2 text-sm text-slate-500">修改管理员密码并设置忘记密码时使用的恢复邮箱。新密码至少6位，并须包含小写字母和数字。</p><form onSubmit={submit} noValidate className="mt-5 grid max-w-xl gap-3"><FormIssueList issues={issues} lang="zh"/><Input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="当前密码" required/><Input type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="新密码（至少6位，含小写字母和数字）" minLength={6} required/><Input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="再次输入新密码" minLength={6} required/><Input type="email" value={recoveryEmail} onChange={e=>setRecoveryEmail(e.target.value)} placeholder="恢复邮箱" required/><Button type="submit">更新登录安全设置</Button>{message&&<p className="text-sm text-slate-600">{message}</p>}</form></section>}
