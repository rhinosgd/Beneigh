"use client";

import Image from "next/image";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  HeartHandshake,
  Languages,
  Plane,
  Stethoscope,
  UserRoundCheck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defaultPlans } from "../lib/plans";
import { preferredLanguage, primaryCopy } from "../lib/languages";
import { RichContent } from "./components/rich-content";
import { ContactForm } from "./components/contact-form";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader, type SiteLang } from "./components/site-header";
import {
  SubmitNotice,
  type SubmitState,
} from "./components/submit-notice";
import {
  FormIssueList,
  clearInvalidFields,
  collectFormIssues,
  markInvalidFields,
  summaryText,
  type FieldIssue,
} from "./components/form-validation";

type Lang = SiteLang;
type PublicService = {
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
type SiteConfig = {
  configured?: boolean;
  services: PublicService[];
  content: Record<string, string>;
};
type ManagedItem = {
  id?: string;
  titleEn?: string;
  titleZh?: string;
  textEn?: string;
  textZh?: string;
  date?: string;
  active?: boolean;
  sortOrder?: number;
};
function parseList(value: string | undefined, fallback: ManagedItem[]): ManagedItem[] {
  try {
    const parsed = JSON.parse(value || "");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
function cleanFlowTitle(title: string, zh: boolean) {
  return title
    .replace(zh ? /^第[^步]{1,3}步[：:]\s*/ : /^Step\s+(One|Two|Three|Four|Five|Six)\s*:\s*/i, "")
    .trim();
}
const FLOW_ICON_FALLBACK = [Stethoscope, UserRoundCheck, CalendarDays, Languages, Plane, HeartHandshake];
// 按步骤文字智能匹配图标：无论后台如何改文案或调整顺序，图标都与该步骤表达的内容对应
function flowIconFor(titleEn: string, titleZh: string, i: number) {
  const s = `${titleEn} ${titleZh}`.toLowerCase();
  if (/accompan|陪诊|translat|翻译|language|语言|interpre/.test(s)) return Languages; // 陪诊/翻译
  if (/follow|跟进|复诊|aftercare|post-/.test(s)) return HeartHandshake; // 跟进/复诊
  if (/assess|预审|评估|审核/.test(s)) return UserRoundCheck; // 预审/评估
  if (/itinerary|行程|schedul|确定|confirm|calendar|机票/.test(s)) return CalendarDays; // 确定行程
  if (/treatment|诊疗|治疗|dental|牙|procedure|surgery/.test(s)) return Plane; // 赴华诊疗（沿用参考设计）
  if (/personal|information|资料|信息|intake|form|detail/.test(s)) return Stethoscope; // 个人资料
  if (/travel|arriv|pick ?up|接机|transport|交通|fly|flight|飞/.test(s)) return Plane; // 接送/交通
  return FLOW_ICON_FALLBACK[i % 6];
}
const copy = {
  en: {
    nav: ["Home", "Services", "Cases", "Flow", "Booking", "FAQ", "Contact Us"],
    cta: "Choose Your Service",
    eyebrow: "Professional medical accompaniment services in China",
    titleA: "Close Care to Afar Friends,",
    titleB: "Stay Comfort on the Treatment Journey",
    intro:
      "China covers a vast territory and has a large population. After years of development, various medical services have become increasingly comprehensive, and its equipment and experience have reached international standards. Seeking medical treatment in China has now become a trend among international friends.",
    trust: [
      "Good Value",
      "Advanced Equipment",
      "Professional and Experienced Doctor",
      "Comfortable Environment",
    ],
    servicesTitle: "Services",
    servicesIntro:
      "From pre-assessment, booking, flight ticket, pick up, transportation and accommodation in China, translation, accompaniment, post consultation, sightseeing and follow up. We will make the right arrangement as per your requirements.",
    stepsTitle: "The Completed Process Indication",
    whyTitle: "Why patients consider China",
    whyIntro:
      "Modern urban dental centers, broad treatment capability and coordinated scheduling can make complex restorative care easier to plan. Your final suitability and quote always depend on a dentist's review.",
    formTitle: "Apply for Medical Booking",
    formIntro: "Please provide your information. We will contact you soon.",
    faqTitle: "Questions before you travel",
  },
  zh: {
    nav: ["关于我们", "服务项目", "服务流程", "联系我们"],
    cta: "选择服务方案",
    eyebrow: "外国人赴华牙科治疗协调服务",
    titleA: "重拾自信笑容，",
    titleB: "我们协调赴华全程。",
    intro:
      "从病历预审、诊所匹配，到预约、翻译和在华协助，由一个双语团队把每一步讲清楚、安排好。",
    trust: ["先审核治疗资料", "中英双语协调", "出发前确认方案"],
    servicesTitle: "服务类别",
    servicesIntro: "只选择您需要的服务；所有临床决定均由您与持证牙医共同作出。",
    stepsTitle: "更清晰的赴华牙科治疗路径",
    whyTitle: "为什么考虑到中国看牙",
    whyIntro:
      "中国主要城市拥有现代化牙科中心、较完整的治疗能力与灵活排期。是否适合、需要多久以及最终费用，均须由牙医审核资料后确认。",
    formTitle: "提交预约申请",
    formIntro: "请提供初步数据，我们会有专人和你联系。",
    faqTitle: "出发前常见问题",
  },
};
const defaultFlow = [
  [
    Stethoscope,
    "Step One: Provide Personal Information",
    "第一步：提供个人资料",
    "Choose a service, provide your name, contact details, nationality and expected travel dates. We will contact you for a preliminary review.",
    "选择服务，提供姓名、联络资料、国籍及预计往返日期。收到资料后，我们会联系你进行预审。",
  ],
  [
    UserRoundCheck,
    "Step Two: Pre-assessment",
    "第二步：预审",
    "Understand the current situation, records, insurance or self-pay plan, preferred city and the time needed for treatment.",
    "了解患者情况、病历、保险或自费安排、意向城市，以及来往日期是否与疗程时间相符。",
  ],
  [
    CalendarDays,
    "Step Three: Confirm the Itinerary",
    "第三步：确定行程",
    "Book flights, accommodation and the dentist consultation dates after the preliminary review.",
    "预定机票、住宿和医生诊症日期。",
  ],
  [
    Languages,
    "Step Four: Accompaniment",
    "第四步：陪诊",
    "Arrange airport pickup, translation, transportation, accommodation, consultation and follow-up support after arrival.",
    "到达中国后安排接机、翻译、交通、住宿、会诊、复诊或观光等。",
  ],
  [
    Plane,
    "Step Five: Treatment",
    "第五步：诊疗",
    "The specialist provides a detailed diagnosis, treatment plan, price and schedule so the patient understands the next steps and risks.",
    "专科医生详细诊断，提供治疗方案、价钱和治疗时间，让患者了解疗程步骤和风险。",
  ],
  [
    HeartHandshake,
    "Step Six: Follow-up",
    "第六步：跟进",
    "Continue remote communication and follow-up support when a patient needs another visit to complete treatment.",
    "如需复诊或多次来华完成疗程，陪诊员会持续跟进和远程沟通。",
  ],
] as const;
const defaultCases = [
  { id: "smith", titleEn: "Mr. Smith's Dental Implant Journey", titleZh: "史勿夫先生植牙案例", bodyEn: "Mr. Smith travelled from Australia to China for dental implants. He had few remaining loose lower teeth and gum recession; 3D scans showed unsalvageable roots. Thanks to healthy jawbone, extractions and lower full-arch implants were done on the same day with a temporary restoration fitted. He stayed two weeks for recovery, sightseeing and passed review, then flew back for six months of healing before returning for one week to fit the permanent prosthesis and complete treatment.", bodyZh: "史勿夫先生因长期对口腔缺乏护理，下颚仅存小部份牙齿，并牙肉萎缩，牙齿松动，决定从澳洲飞往中国治疗，到埗后休息一天，翌日由专科医生进行彻底检验，经3D X-光扫瞄，原生牙齿根部已腐坏，不值得保留，选择了拔牙和做半口植牙手术，因患者口腔骨骼健康，可即日完成拔牙和植牙手术，术后已可装带牙套恢复进食，外观正常，之后逗留两周予术后观察和等候复检，期间史勿夫先生仍可到处观光，体验中国文化，之后复检正常，植体无发炎，无偏位，飞回澳洲待半年巩固期，再回中国逗留约一周，做永久固定牙套，完成整个疗程。", prices: { flights: 2500, stay: 2400, treatment: 8500, support: 800, other: 500 } },
  { id: "mary", titleEn: "Mary's Dental Treatment Journey", titleZh: "玛莉牙科治疗案例", bodyEn: "Mary suffered an oral injury from sports. High dental costs in New Zealand led her to travel to China for comprehensive dental care. Examination identified a treatment plan: 3 extractions, 4 implants, periodontal therapy and restorative bonding. She will make four trips to China, staying around 10 days each visit, with the full treatment spanning approximately nine months.", bodyZh: "玛莉因做运动致口腔受伤，因新西兰牙医收费太贵，遂决定飞往中国作彻底牙齿治疗，经医生检验，做出如下方案：拔牙3颗、植牙4颗、牙周治疗和矫形修补，期间需来回中国4次，每次逗留约10天，整个疗程约需时9个月。", prices: { flights: 5000, stay: 4000, treatment: 5200, support: 1200, other: 0 } },
  { id: "john", titleEn: "John's Dental Care During a China Visit", titleZh: "约翰旅游期间牙齿保养案例", bodyEn: "John, an American visitor to China, took time out from his travel schedule to receive dental maintenance treatment. His care included professional teeth cleaning, fillings and minor orthodontic adjustments. Since John came here as a tourist, only the fees for dental treatment and patient escort service will be charged.", bodyZh: "约翰是美国人，趁在中国旅游期间抽空做牙齿保养，包括洗牙、补牙和轻度矫形，因为约翰是旅游形式，只有治疗和陪诊费用。", prices: { flights: 0, stay: 0, treatment: 300, support: 35, other: 0 } },
];
const faqs = [
  [
    "Can I get an exact price before I travel?",
    "我能在出发前拿到准确报价吗？",
    "A preliminary range may be possible after reviewing scans and records. The final plan and fee are confirmed only after an in-person examination.",
    "审核牙片和病历后可提供初步范围；最终方案与费用须面诊后确认。",
  ],
  [
    "Which dental records should I send?",
    "需要提交哪些牙科资料？",
    "Recent panoramic X-ray or CBCT, treatment history, medication list, allergy information and clear photos of the problem area are helpful.",
    "建议提供近期全景片或CBCT、治疗史、用药清单、过敏信息及问题区域清晰照片。",
  ],
  [
    "How long should I stay in China?",
    "需要在中国停留多久？",
    "It depends on the procedure and healing stage. Some restorative work can be scheduled in one visit; implants may require staged visits months apart.",
    "取决于治疗项目与愈合周期。部分修复可一次完成；种植牙通常需要分阶段到访。",
  ],
  [
    "Do you provide dental treatment directly?",
    "你们直接提供牙科治疗吗？",
    "No. Be Neighbor is a coordination service. Diagnosis and treatment are provided by independently licensed dental professionals.",
    "不直接提供。比邻是协调服务平台，诊断与治疗由独立持证牙科专业人员提供。",
  ],
];

export default function Home() {
  const [lang, setLang] = useState<Lang>("en"),
    [config, setConfig] = useState<SiteConfig>({ services: [], content: {} });
  useEffect(() => {
    setLang(preferredLanguage());
    fetch("/api/site-config", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw Error("Unavailable");
        return r.json() as Promise<SiteConfig>;
      })
      .then(setConfig)
      .catch(() => {});
  }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = Array.from(document.querySelectorAll("main section"));
    if (reduce) {
      sections.forEach((s) => s.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add("is-visible");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      sections.forEach((s) => {
        s.classList.add("reveal-init");
        io.observe(s);
      });
    }
    const bar = document.getElementById("scroll-progress");
    const onScroll = () => {
      if (!bar) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      bar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + "%";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const cmsPage = (()=>{try{return JSON.parse(config.content.home_page_json||"{}") as {sections?:Array<{id:string;title:string;titleZh?:string;subtitle:string;subtitleZh?:string;body:string;bodyZh?:string;image:string;buttonText:string;buttonTextZh?:string;buttonUrl:string;visible:boolean;sortOrder:number}>}}catch{return {}}})();
  const cmsSections = Object.fromEntries((cmsPage.sections||[]).map(x=>[x.id,x]));
  const cmsHero = cmsSections.hero;
  const t = {
      ...copy[lang === "zh" ? "zh" : "en"],
      ...(lang !== "zh" && lang !== "en" ? primaryCopy[lang] : {}),
    },
    zh = lang === "zh",
    special =
      config.content.hero_special_enabled === "true" &&
      !!config.content.hero_special_image,
    heroImage = special
      ? config.content.hero_special_image
      : cmsHero?.image || config.content.hero_default_image || "/hero-banner-v2.webp",
    heroLabel = special
      ? zh
        ? config.content.hero_special_label_zh
        : config.content.hero_special_label_en
      : "",
    flowItems = parseList(config.content.service_flow_json, defaultFlow.map(([, en, cn, de, dc], i) => ({ id: String(i + 1), titleEn: en, titleZh: cn, textEn: de, textZh: dc, active: true, sortOrder: i + 1 }))),
    faqItems = parseList(config.content.faq_items_json, faqs.map(([en, cn, de, dc], i) => ({ id: String(i + 1), titleEn: en, titleZh: cn, textEn: de, textZh: dc, active: true, sortOrder: i + 1 }))),
    newsItems = parseList(config.content.news_announcements, []),
    caseItems = (() => { try { const x = JSON.parse(config.content.case_items_json || ""); return Array.isArray(x) && x.length ? x : defaultCases; } catch { return defaultCases; } })();
  return (
    <main
      className="min-h-screen overflow-x-clip bg-[#f7fbfb] text-[#163533]"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div
        id="scroll-progress"
        className="fixed left-0 top-0 z-[80] h-[3px] w-0 bg-gradient-to-r from-[#0f8b82] via-[#15b8a6] to-[#ec765f]"
        aria-hidden="true"
      />
      <SiteHeader lang={lang} onLanguageChange={setLang} />

      {cmsHero?.visible !== false && <section
        id="top"
        className="relative isolate min-h-[600px] overflow-hidden bg-[#0f3a37] sm:min-h-[660px] lg:min-h-[800px]"
      >
        <Image
          priority
          unoptimized
          src={heroImage}
          alt=""
          fill
          sizes="100vw"
          className="absolute inset-0 -z-10 size-full object-cover object-[72%_center]"
        />
        <div
          className="absolute inset-0 -z-10 hero-veil"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-16 pt-32 lg:px-8 lg:pb-20 lg:pt-40">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#badbd8] bg-white/95 px-4 py-2 text-sm font-bold text-[#0f6d68] shadow-sm">
            <span className="size-2 rounded-full bg-[#ec765f]" />
            <RichContent html={heroLabel || (zh ? t.eyebrow : cmsHero?.subtitle || t.eyebrow)} className="contents" />
          </p>
          <h1 className="max-w-[46rem] text-[2.5rem] font-semibold leading-[1.02] tracking-[-.05em] sm:text-[3.2rem] lg:text-[3.6rem]">
            {(zh ? cmsHero?.titleZh || t.titleA : cmsHero?.title || t.titleA) ? <RichContent html={zh ? cmsHero?.titleZh || `${t.titleA} ${t.titleB}` : cmsHero?.title || `${t.titleA} ${t.titleB}`} className="contents" /> : null}
          </h1>
          <div className="mt-6 max-w-xl text-lg leading-8 text-[#55716f]">
            {config.content.homepage_intro ? (
              <RichContent html={config.content.homepage_intro} />
            ) : (
              <RichContent html={(zh ? cmsHero?.bodyZh : cmsHero?.body) || t.intro} className="contents" />
            )}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-14 rounded-full bg-[#ec765f] px-7 text-base text-white shadow-lg hover:bg-[#257a76] btn-shimmer"
            >
              <a href={cmsHero?.buttonUrl || "#services"}>
                <RichContent html={(zh ? cmsHero?.buttonTextZh : cmsHero?.buttonText) || t.cta} className="contents" />
                <ArrowRight />
              </a>
            </Button>
          </div>
          <div className="mt-9 grid max-w-lg grid-cols-2 gap-x-8 gap-y-3">
            {t.trust.map((x) => (
              <span
                className="flex items-center gap-2 text-sm font-semibold text-[#466663]"
                key={x}
              >
                <Check className="size-4 shrink-0 text-[#0f8b82]" />
                {x}
              </span>
            ))}
          </div>
        </div>
      </section>}

      <div
        className="marquee border-y border-[#dcebea] bg-white py-5"
        aria-hidden="true"
      >
        <div className="marquee__track">
          {[
            "Dental Implants",
            "Cosmetic Dentistry",
            "Periodontal Care",
            "General Dental",
            "Bilingual Coordination",
            "Clinic Matching",
            "Travel & Stay",
            "牙齿种植",
            "美学修复",
            "牙周治疗",
            "全科牙科",
            "双语陪诊",
            "诊所匹配",
            "行程安排",
          ].map((word, i) => (
            <span className="marquee__item" key={`m-${i}`}>
              {word}
              <span className="marquee__dot" />
            </span>
          ))}
          {[
            "Dental Implants",
            "Cosmetic Dentistry",
            "Periodontal Care",
            "General Dental",
            "Bilingual Coordination",
            "Clinic Matching",
            "Travel & Stay",
            "牙齿种植",
            "美学修复",
            "牙周治疗",
            "全科牙科",
            "双语陪诊",
            "诊所匹配",
            "行程安排",
          ].map((word, i) => (
            <span className="marquee__item" key={`m2-${i}`}>
              {word}
              <span className="marquee__dot" />
            </span>
          ))}
        </div>
      </div>

      {cmsSections.services?.visible !== false && <section id="services" className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            title={zh ? cmsSections.services?.titleZh || "服务类别" : cmsSections.services?.title || "Services"}
            text={zh ? cmsSections.services?.bodyZh || t.servicesIntro : cmsSections.services?.body || t.servicesIntro}
            kicker={zh ? "比邻" : "Be Neighbor"}
            titleClassName="text-4xl sm:text-5xl"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(config.configured ? config.services : defaultPlans).filter((p) => p.active).map((p) => {
              const image = p.id === "implants" && (!p.imageUrl || p.imageUrl === "/dental-plan.webp")
                ? "/implant-tooth.webp"
                : p.id === "general" && (!p.imageUrl || p.imageUrl === "/dental-hero.webp")
                  ? "/general-dental.webp"
                  : p.id === "periodontal" && (!p.imageUrl || p.imageUrl === "/arrival-care.webp")
                    ? "/periodontal-care.webp"
                    : p.id === "cosmetic" && (!p.imageUrl || p.imageUrl === "/arrival-care.webp")
                      ? "/cosmetic-dentistry.webp"
                  : p.imageUrl || (p.id === "general" ? "/dental-hero.webp" : "/arrival-care.webp");
              return (
              <article
                key={p.id}
                className="group relative rounded-[1.8rem] border border-[#dcebea] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="overflow-hidden rounded-t-[1.8rem]"><Image unoptimized src={image} width={800} height={520} alt={p.nameEn} className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]" /></div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold"><RichContent html={zh ? p.nameZh : p.nameEn} className="contents" /></h3>
                  <p title={zh ? p.descriptionZh : p.descriptionEn} className="service-description mt-3 leading-7 text-[#627b79]">
                    <RichContent html={zh ? p.descriptionZh : p.descriptionEn} className="contents" />
                  </p>
                </div>
              </article>)}
            )}
          </div>
          <h3 id="services-flow" className="mt-16 scroll-mt-28 text-3xl font-bold">
            <RichContent html={zh ? cmsSections.process?.titleZh || "流程图示" : cmsSections.process?.title || "The Completed Process Indication"} className="contents" />
          </h3>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#627b79]"><RichContent html={(zh ? cmsSections.process?.bodyZh : cmsSections.process?.body) || (zh ? "请参照下列流程，申办中国的医疗服务。" : "Please Follow the Direction to Enjoy the China Medical Services.")} className="contents" /></p>
          <div className="relative my-10 hidden rounded-[2rem] bg-[#edf7f6] p-6 md:block md:p-8">
            <div className="absolute left-[8%] right-[8%] top-[4.5rem] h-px bg-[#b9dcd8]" aria-hidden="true" />
            <div className="relative grid grid-cols-6 gap-3">
              {flowItems.filter((x) => x.active !== false).sort((a,b) => Number(a.sortOrder)-Number(b.sortOrder)).slice(0, 6).map((item, i) => {
                const Icon = flowIconFor(String(item.titleEn || ""), String(item.titleZh || ""), i);
                return <div key={`flowchart-${String(item.id || i)}`} className="flex min-w-0 flex-col items-center text-center">
                  <div className="relative z-10 grid size-16 place-items-center rounded-full border-4 border-[#edf7f6] bg-[#0f8b82] text-white shadow-md transition duration-300 hover:scale-110 hover:bg-[#257a76]"><Icon className="h-6 w-6" /></div>
                  <span className="mt-3 text-sm font-extrabold text-[#0f6d68]">{zh ? `步骤 ${i + 1}` : `Step ${i + 1}`}</span>
                  <span className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#365856]">{cleanFlowTitle(zh ? item.titleZh : item.titleEn, zh)}</span>
                </div>;
              })}
            </div>
          </div>
          <div className="my-8 flex gap-3 overflow-x-auto rounded-2xl bg-[#edf7f6] p-3 pb-4 md:hidden">
            {flowItems.filter((x) => x.active !== false).sort((a,b) => Number(a.sortOrder)-Number(b.sortOrder)).slice(0, 6).map((item, i) => {
              const Icon = flowIconFor(String(item.titleEn || ""), String(item.titleZh || ""), i);
              return <div key={`mobile-flowchart-${String(item.id || i)}`} className="min-w-36 rounded-2xl border border-[#cfe5e2] bg-white p-3 text-center shadow-sm"><Icon className="mx-auto text-[#0f8b82]" /><b className="mt-2 block text-xs text-[#0f6d68]">{zh ? `步骤 ${i + 1}` : `Step ${i + 1}`}</b><span className="mt-1 block line-clamp-2 text-xs leading-4 text-[#365856]">{cleanFlowTitle(zh ? item.titleZh : item.titleEn, zh)}</span></div>;
            })}
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {flowItems.filter((x) => x.active !== false).sort((a,b) => Number(a.sortOrder)-Number(b.sortOrder)).map((item, i) => {
              const Icon = flowIconFor(String(item.titleEn || ""), String(item.titleZh || ""), i);
              const flowTitle = cleanFlowTitle(zh ? item.titleZh : item.titleEn, zh);
              return (
              <article
                key={String(item.id || i)}
                className="group rounded-[1.8rem] border border-[#dcebea] bg-[#fbfefe] p-7 transition hover:-translate-y-1 hover:border-[#9bceca] hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#e4f3f1] text-[#0f6d68]">
                    <Icon />
                  </span>
                  <span className="text-base font-extrabold text-[#6d9692]">
                    {zh ? `步骤 ${i + 1}` : `Step ${i + 1}`}
                  </span>
                </div>
                <h4 className="mt-6 text-xl font-bold"><RichContent html={flowTitle} className="contents" /></h4>
                <p className="mt-3 text-base leading-7 text-[#627b79]">
                  <RichContent html={zh ? item.textZh : item.textEn} className="contents" />
                </p>
                {i === 0 && <a href="#booking" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ec765f] px-5 py-3 font-bold text-white hover:bg-[#257a76]">{zh ? "预约申请" : "Booking Application"}<ArrowRight size={17} /></a>}
              </article>
            )})}
          </div>
        </div>
      </section>}

      {cmsSections.pricing?.visible !== false && <section id="cases" className="bg-[#edf7f6] py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            title={(zh ? cmsSections.pricing?.titleZh : cmsSections.pricing?.title) || (zh ? "案例和参考价钱" : "Cases and Reference Price")}
            kicker={zh ? "比邻" : "Be Neighbor"}
          />
          <div className="mt-12 space-y-8">
            {caseItems.slice(0, 3).map((item: any, i: number) => {
              const prices = item.prices || {};
              const avatar = [
                { src: "/avatar-smith.webp", position: "50% 45%" },
                { src: "/avatar-mary.webp", position: "50% 42%" },
                { src: "/avatar-john.webp", position: "50% 38%" },
              ][i];
              const rows = [[zh ? "来回机票" : "Return flights", prices.flights], [zh ? "中国交通食宿" : "China transport, food and stay", prices.stay], [zh ? "治疗费用" : "Treatment", prices.treatment], [zh ? "陪诊服务" : "Accompaniment", prices.support], [zh ? "其他" : "Other", prices.other]] as const;
              const total = rows.reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
              return <article key={item.id} className="grid gap-7 rounded-[1.8rem] border border-[#d3e5e3] bg-white p-7 lg:grid-cols-[1.2fr_.8fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-bold">{zh ? item.titleZh : item.titleEn}</h3>
                    {avatar && <span className="relative size-18 shrink-0 overflow-hidden rounded-full border-2 border-[#d3e5e3] bg-[#edf7f6] shadow-sm">
                      <Image src={avatar.src} alt="" fill unoptimized className="scale-[1.35] object-cover" style={{ objectPosition: avatar.position }} />
                    </span>}
                  </div>
                  <p className="mt-4 leading-8 text-[#627b79]">{zh ? item.bodyZh : item.bodyEn}</p>
                </div>
                <div className="rounded-2xl bg-[#f3f9f8] p-5"><h4 className="font-bold">{zh ? "参考费用" : "Reference costs"}</h4><dl className="mt-3 space-y-2 text-sm">{rows.filter(([, value]) => Number(value) > 0).map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-[#dcebea] py-2"><dt>{label}</dt><dd className="font-bold">USD{Number(value).toLocaleString()}</dd></div>)}<div className="flex justify-between gap-4 pt-2 text-base font-bold"><dt>{zh ? "总计" : "Total"}</dt><dd>USD{total.toLocaleString()}</dd></div></dl></div>
              </article>;
            })}
          </div>
          <Button
            asChild
            className="mt-8 h-13 rounded-full bg-[#ec765f] px-7 text-base text-white hover:bg-[#257a76] btn-shimmer"
          >
            <a href="#cases">
              {zh ? "更多…" : "More..."}
              <ArrowRight />
            </a>
          </Button>
        </div>
      </section>}

      <section id="booking" className="bg-[#eaf5f4] py-28">
        <div id="plan" className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading title={t.formTitle} text={t.formIntro} />
          <BookingForm lang={lang} config={config} />
        </div>
      </section>
      <section id="about" className="bg-[#153f3c] py-28 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_.9fr] lg:items-center lg:px-8">
          <div className="lg:pr-4">
            <p className="kicker-outline kicker-outline--dark">
              {zh ? "关于我们" : "ABOUT US"}
            </p>
            <h2 className="section-title !text-white">{zh ? "陪诊服务优点" : "Advantages of Accompaniment Services"}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#c2d8d5]">
              {zh ? "因语言和文化差别，外国友人对中国的医疗流程并不熟悉，因此我们提供医疗陪诊服务，让更多人享受中国优质医疗服务。" : "Due to language and cultural differences, international friends are not familiar with China's medical procedures. Therefore, we provide medical accompaniment services so that others can also enjoy China's high-quality medical care."}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                [Clock3, zh ? "提早预约，制定行程" : "Book in advance and plan your itinerary"],
                [
                  CircleDollarSign,
                  zh ? "预先了解诊疗费用" : "Learn about treatment costs in advance",
                ],
                [Languages, zh ? "减少语言障碍和操作流程" : "Reduce language barriers and simplify procedures"],
                [MapPin, zh ? "交通住宿，便利舒适" : "Convenient and comfortable transportation and accommodation"],
              ].map(([Icon, txt]) => (
                <div
                  className="flex items-center gap-3 rounded-2xl bg-white/7 p-4"
                  key={String(txt)}
                >
                  <Icon className="text-[#6fd0c8]" />
                  <b>{String(txt)}</b>
                </div>
              ))}
            </div>
            <p className="mt-7 text-[#c2d8d5]">Be Neighbor<br />Email: <a className="underline" href="mailto:info@beneigh.com">info@beneigh.com</a></p>
          </div>
          <div className="relative h-full min-h-[360px] overflow-hidden rounded-[2rem] bg-white/10 shadow-2xl lg:min-h-0">
            <Image
              unoptimized
              src="/dental-plan.webp"
              alt={zh ? "牙科陪诊服务" : "Dental accompaniment service"}
              fill
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        </div>
      </section>

      {false && cmsSections.testimonials?.visible !== false && <section id="testimonials" className="bg-[#f7fbfb] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            title={cmsSections.testimonials?.title || (zh ? "客户治疗旅程示例" : "Illustrative patient journeys")}
            text={cmsSections.testimonials?.body ||
              (zh
                ? "以下内容用于展示客户案例栏目结构，不代表已验证的比邻客户评价。正式推广前应替换为获得患者书面授权的真实案例。"
                : "These examples demonstrate the testimonial section structure and are not verified Be Neighbor patient reviews. Replace them with consented, documented patient stories before promotion.")
            }
            kicker={cmsSections.testimonials?.subtitle || "Be Neighbor"}
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [
                zh ? "多颗缺牙评估" : "Multiple missing teeth review",
                zh ? "演示案例" : "DEMO CASE",
                zh
                  ? "先提交CBCT和病史，比较分阶段种植方案、预计停留时间和复诊安排。"
                  : "Records and CBCT are reviewed first to compare staged implant options, expected stay and follow-up.",
              ],
              [
                zh ? "普通牙科集中治疗" : "General care during one visit",
                zh ? "演示案例" : "DEMO CASE",
                zh
                  ? "先确定治疗优先级，再把检查、洁牙和修复预约安排在一次赴华行程中。"
                  : "Treatment priorities are reviewed before coordinating examinations, cleaning and restorative appointments.",
              ],
              [
                zh ? "笑容美学方案沟通" : "Cosmetic smile planning",
                zh ? "演示案例" : "DEMO CASE",
                zh
                  ? "通过照片和影像初步沟通颜色、形态与咬合，再由牙医面诊确认适合的方案。"
                  : "Photos and scans support an early discussion of color, shape and bite before the dentist confirms suitability.",
              ],
            ].map(([title, label, text]) => (
              <article
                key={title}
                className="rounded-[1.8rem] bg-white p-7 shadow-sm"
              >
                <p className="text-sm font-bold tracking-[.12em] text-[#ec765f]">
                  {label}
                </p>
                <h3 className="mt-4 text-2xl font-bold">{title}</h3>
                <p className="mt-4 text-base leading-7 text-[#627b79]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>}
      {newsItems.some((x) => x.active !== false) && <section id="news" className="bg-[#f7fbfb] py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionHeading title={zh ? "新闻公告" : "News & Announcements"} /><div className="mt-10 grid gap-5 md:grid-cols-3">{newsItems.filter((x) => x.active !== false).sort((a,b) => String(b.date).localeCompare(String(a.date))).map((x,i) => <article key={String(x.id || i)} className="rounded-[1.6rem] bg-white p-6 shadow-sm"><p className="text-sm font-bold text-[#0f6d68]">{String(x.date || "")}</p><h3 className="mt-3 text-xl font-bold"><RichContent html={zh ? x.titleZh || x.titleEn : x.titleEn} className="contents" /></h3><p className="mt-3 leading-7 text-[#627b79]"><RichContent html={zh ? x.textZh || x.textEn : x.textEn} className="contents" /></p></article>)}</div></div></section>}
{cmsSections.contact?.visible !== false && <section id="contact" className="bg-[#eaf7f5] text-[#163533]">
  <div className="relative z-10 mx-auto grid max-w-[1920px] gap-8 overflow-hidden px-6 py-10 sm:px-10 lg:min-h-[680px] lg:grid-cols-[.8fr_1.35fr_1fr] lg:items-stretch lg:gap-0 lg:px-[4.8vw] lg:py-0">
          <div className="lg:col-start-1 lg:row-start-1 lg:pt-8">
            <p className="kicker-outline kicker-outline--compact"><RichContent html={(zh ? cmsSections.contact?.subtitleZh : cmsSections.contact?.subtitle) || (zh ? "联系方式" : "Get In Touch")} className="contents" /></p>
            <h2 className="section-title lg:!text-[3rem]">
              <RichContent html={(zh ? cmsSections.contact?.titleZh : cmsSections.contact?.title) || (zh ? "联系我们" : "Contact Us")} className="contents" />
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#627b79] sm:text-[17px] sm:leading-8">
              <RichContent className="contents" html={(zh ? cmsSections.contact?.bodyZh : cmsSections.contact?.body) || (zh
                ? "请留下您的联系方式，我们会尽快回复。"
                : "Please leave your contact information, we will reply to you shortly.")} />
            </p>
          </div>
    <div className="relative lg:col-start-2 lg:row-start-1">
      <div className="pointer-events-none relative mx-auto aspect-[1920/1080] w-full overflow-hidden lg:absolute lg:left-1/2 lg:top-0 lg:h-full lg:w-auto lg:-translate-x-1/2">
              <Image unoptimized src="/contact-wechat.webp" alt="" fill className="object-cover object-center" />
            </div>
          </div>
    <div className="relative z-10 self-start rounded-[1.6rem] bg-white/85 p-5 shadow-[0_18px_35px_rgba(22,53,51,.12)] sm:p-7 lg:col-start-3 lg:row-start-1 lg:mt-[96px] lg:h-fit lg:p-8 [&>p.section-kicker]:hidden [&>h2]:hidden [&>p.max-w-xl]:hidden">
            <p className="section-kicker"><RichContent html={(zh ? cmsSections.contact?.subtitleZh : cmsSections.contact?.subtitle) || (zh ? "联系方式" : "Get In Touch")} className="contents" /></p>
            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              <RichContent html={(zh ? cmsSections.contact?.titleZh : cmsSections.contact?.title) || (zh ? "联系我们" : "Contact Us")} className="contents" />
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              <RichContent className="contents" html={(zh ? cmsSections.contact?.bodyZh : cmsSections.contact?.body) || (zh ? "请留下您的联系方式，我们会尽快回复。" : "Please leave your contact information, we will reply to you shortly.")} />
            </p>
            <div className="mt-0 border-0 pt-0">
              <ContactForm lang={lang} />
            </div>
          </div>
        </div>
</section>}
      {cmsSections.faq?.visible !== false && <section id="faq" className="bg-white py-28">
        <div className="mx-auto max-w-4xl px-5">
          <SectionHeading title={(zh ? cmsSections.faq?.titleZh : cmsSections.faq?.title) || t.faqTitle} text={(zh ? cmsSections.faq?.bodyZh : cmsSections.faq?.body)} kicker={(zh ? cmsSections.faq?.subtitleZh : cmsSections.faq?.subtitle) || "Be Neighbor"} />
          <div className="mt-10 divide-y divide-[#dcebea]">
            {faqItems.filter((x) => x.active !== false).sort((a,b) => Number(a.sortOrder)-Number(b.sortOrder)).map((item, i) => (
              <details className="group py-5" key={String(item.id || i)}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-bold">
                  <RichContent html={zh ? item.titleZh : item.titleEn} className="contents" />
                  <ChevronDown className="shrink-0 transition group-open:rotate-180" />
                </summary>
                <p className="max-w-3xl pt-4 leading-7 text-[#627b79]">
                  <RichContent html={zh ? item.textZh : item.textEn} className="contents" />
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>}
      <SiteFooter lang={lang} email="info@beneigh.com" />
    </main>
  );
}
function SectionHeading({ title, text, kicker = "Be Neighbor", titleClassName = "" }: { title: string; text?: string; kicker?: string; titleClassName?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="kicker-outline"><RichContent html={kicker} className="contents" /></p>
      <h2 className={`section-title ${titleClassName}`}><RichContent html={title} className="contents" /></h2>
      {text && <p className="mt-5 text-lg leading-8 text-[#627b79]"><RichContent html={text} className="contents" /></p>}
    </div>
  );
}
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

function DateField({ name, zh, id }: { name: string; zh: boolean; id?: string }) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [text, setText] = useState("");
  const min = new Date().toISOString().slice(0, 10);
  const format = (iso: string) => {
    const [year, month, day] = iso.split("-");
    return zh ? `${year}年${month}月${day}日` : `${month}/${day}/${year}`;
  };
  const parse = (raw: string): string | null => {
    const s = raw.trim();
    if (!s) return "";
    let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
    if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    m = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/.exec(s);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    return null;
  };
  const openPicker = () => {
    try {
      pickerRef.current?.showPicker?.();
    } catch {
      pickerRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        value={text}
        placeholder={zh ? "年/月/日" : "MM/DD/YYYY"}
        className="pr-12"
        aria-label={zh ? "选择日期" : "Choose date"}
        inputMode="numeric"
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          const iso = parse(raw);
          if (iso !== null) setValue(iso);
        }}
        onBlur={() => {
          if (value) setText(format(value));
        }}
        onClick={openPicker}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#183c3b]"
        onClick={openPicker}
        aria-label={zh ? "打开日期选择器" : "Open date picker"}
      >
        <CalendarDays className="h-5 w-5" />
      </button>
      <input
        ref={pickerRef}
        name={name}
        type="date"
        value={value}
        min={min}
        required
        tabIndex={-1}
        aria-hidden="true"
        aria-label={zh ? "选择日期" : "Choose date"}
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 opacity-0"
        onChange={(event) => {
          setValue(event.target.value);
          if (event.target.value) setText(format(event.target.value));
        }}
      />
    </div>
  );
}

function BookingForm({ lang, config }: { lang: Lang; config: SiteConfig }) {
  const zh = lang === "zh";
  const defaults: PublicService[] = defaultPlans;
  const options = (config.configured ? config.services : defaults)
    .filter((x) => x.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const [selected, setSelected] = useState(["implants"]),
    [sent, setSent] = useState<{
      reference: string;
      arrivalDate: string;
      returnDate: string;
      portalUrl: string;
      emailStatus: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [issues, setIssues] = useState<FieldIssue[]>([]),
    [result, setResult] = useState<SubmitState>(null);
  function toggleService(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  useEffect(() => {
    setSelected((current) => {
      const valid = current.filter((id) => options.some((x) => x.id === id));
      return valid.length ? valid : options[0] ? [options[0].id] : [];
    });
  }, [config.services]);
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
    const fd = new FormData(form);
    const payload = {
      ...Object.fromEntries(fd.entries()),
      services: selected,
      language: lang,
    };
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = (await r.json()) as {
        reference: string;
        arrivalDate: string;
        returnDate: string;
        portalUrl: string;
        emailStatus: string;
        error?: string;
      };
      if (r.ok) {
        setResult({ kind: "success" });
        setSent({
          reference: out.reference,
          arrivalDate: out.arrivalDate,
          returnDate: out.returnDate,
          portalUrl: out.portalUrl,
          emailStatus: out.emailStatus,
        });
      } else {
        const detail =
          out.error ||
          (zh ? "暂时无法提交，请稍后重试。" : "Unable to submit. Please try again.");
        setError(detail);
        setResult({ kind: "error", message: detail });
      }
    } catch {
      const detail = zh
        ? "暂时无法提交，请稍后重试。您的填写内容已保留。"
        : "Unable to submit. Your entries are preserved; please try again.";
      setError(detail);
      setResult({ kind: "error", message: detail });
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <>
      <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-xl sm:p-12">
        <span className="grid size-16 place-items-center rounded-full bg-[#dff4ef] text-[#0f8b82]">
          <Check size={30} />
        </span>
        <h3 className="mt-5 text-3xl font-bold">
          {zh ? "预约提交成功" : "Booking submitted"}
        </h3>
        <p className="mt-3 text-[#627b79]">
          {zh
            ? "请保存预约编号。邮件发送将在正式发信域名配置后自动启用。"
            : "Save your booking reference. Keep your private portal link to read and reply to messages."}
        </p>
        <div className="mt-7 grid gap-4 rounded-2xl bg-[#f3f9f8] p-5 sm:grid-cols-3">
          <Info k={zh ? "预约编号" : "Reference"} v={sent.reference} />
          <Info k={zh ? "抵达日期" : "Arrival"} v={sent.arrivalDate} />
          <Info k={zh ? "返程日期" : "Return"} v={sent.returnDate} />
        </div>
        <Button className="mt-7 min-h-12 rounded-full" asChild>
          <a href={sent.portalUrl}>{zh ? "打开客户入口" : "Open Client Portal"}</a>
        </Button>
        <p className="mt-4 break-all text-sm">Private link: {sent.portalUrl}</p>
        <p className="mt-3 text-sm">
          Email:{" "}
          {sent.emailStatus === "sent"
            ? "Sent"
            : "Not sent — email service needs configuration."}
        </p>
        <Button className="mt-7 rounded-full" onClick={() => setSent(null)}>
          {zh ? "提交另一份预约" : "Make another booking"}
        </Button>
      </div>
      {result && (
        <SubmitNotice
          kind={result.kind}
          lang={lang}
          message={result.message}
          onDone={() => setResult(null)}
        />
      )}
      </>
    );
  return (
    <>
      {result && (
        <SubmitNotice
          kind={result.kind}
          lang={lang}
          message={result.message}
          onDone={() => setResult(null)}
        />
      )}
      <form onSubmit={submit} noValidate className="mt-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl sm:p-8">
          <FormIssueList issues={issues} lang={lang} />
          <h3 className="text-xl font-bold">1. {zh ? "选择服务" : "Choose Your Services"}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {options.map((option) => (
              <button
                type="button"
                key={option.id}
                aria-pressed={selected.includes(option.id)}
                onClick={() => toggleService(option.id)}
                className={`cursor-pointer overflow-hidden rounded-2xl border text-left transition active:scale-[.99] ${selected.includes(option.id) ? "border-[#0f8b82] bg-[#ecf8f6]" : "hover:border-[#9bcac6]"}`}
              >
                <div className="p-4">
                  <span
                    aria-hidden="true"
                    className={`grid size-4 place-items-center rounded-[4px] border text-[11px] font-bold ${selected.includes(option.id) ? "border-[#0f8b82] bg-[#0f8b82] text-white" : "border-[#c7dddd] bg-white text-transparent"}`}
                  >
                    ✓
                  </span>
                  <b className="mt-3 block">
                    {zh ? option.nameZh : option.nameEn}
                  </b>
                </div>
              </button>
            ))}
          </div>
          <h3 className="mt-9 text-xl font-bold">
            2. {zh ? "个人资料" : "Personal Information"}
          </h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label={zh ? "称谓" : "Title**"}>
              <select name="title" required className="min-h-11 w-full rounded-md border px-3">
                <option value="">{zh ? "请选择" : "Select"}</option>
                <option>Mr</option><option>Ms</option><option>Mrs</option>
              </select>
            </Field>
            <Field label={zh ? "姓名" : "Name**"}>
              <Input name="name" required minLength={2} />
            </Field>
            <Field label={zh ? "电邮" : "Email**"}>
              <Input name="email" type="email" required />
            </Field>
            <Field label={zh ? "国籍" : "Country**"}>
              <Input name="country" required />
            </Field>
            <Field label={zh ? "地区/城市" : "District / City"}>
              <Input name="region" required />
            </Field>
            <Field label={zh ? "预计抵达日期" : "Departure Date**"}>
              <DateField name="arrivalDate" zh={zh} />
            </Field>
            <Field label={zh ? "预计回程日期" : "Return Date**"}>
              <DateField name="returnDate" zh={zh} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={zh ? "备注" : "Remark"}>
                <Textarea name="notes" rows={5} />
              </Field>
            </div>
          </div>
          {error && <p className="mt-4 font-bold text-red-600">{error}</p>}
          <div className="mt-7 flex justify-end">
          <Button disabled={busy || !selected.length} className="h-13 rounded-full bg-[#ec765f] px-8 text-white hover:bg-[#257a76] active:scale-[.98] btn-shimmer">
            {busy
              ? zh
                ? "提交中…"
                : "Submitting…"
              : zh
                ? "提交预约"
              : "Submit Booking"}
            <ArrowRight />
          </Button></div>
        </div>
      </form>
    </>
  );
}
function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#78908e]">{k}</p>
      <p className="mt-1 font-bold">{v}</p>
    </div>
  );
}
