"use client";

import Image from "next/image";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "./contact-form";
import { SiteFooter } from "./site-footer";
import { preferredLanguage } from "../../lib/languages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuickContact } from "./quick-contact";
import { SiteHeader, type SiteLang } from "./site-header";
import { RichContent } from "./rich-content";

type ServiceKey =
  "dental-implants" | "general-dentistry" | "cosmetic-dentistry";
const pages = {
  "dental-implants": {
    title: "Dental Implants in China",
    titleZh: "中国种植牙服务",
    eyebrow: "DENTAL IMPLANTS · 种植牙",
    intro:
      "Plan single-tooth, multiple-tooth or full-arch implant care with clearer records, clinic matching and travel coordination before you fly.",
    introZh:
      "从单颗、多颗缺牙到全口种植，通过资料预审、诊所匹配和赴华行程协调，在出发前理清治疗路径。",
    image: "/dental-plan.webp",
    imageAlt: "Dentist reviewing a dental implant plan",
    benefits: [
      [
        "Replace missing teeth",
        "From one missing tooth to a full arch, the final option depends on examination, imaging and bone condition.",
      ],
      [
        "Plan staged visits",
        "Implant placement and final restoration may require separate visits while the implant integrates with the bone.",
      ],
      [
        "Review added procedures",
        "A dentist may recommend extraction, bone grafting or gum treatment before implant placement.",
      ],
    ],
    benefitsZh: [
      [
        "修复缺失牙",
        "单颗、多颗或全口修复方案，须结合面诊、影像和骨量情况确定。",
      ],
      [
        "规划分阶段治疗",
        "种植体植入与最终修复可能需要分次赴华，并预留骨结合时间。",
      ],
      ["提前评估附加治疗", "牙医可能根据情况建议拔牙、植骨或牙周治疗。"],
    ],
    steps: [
      "Share recent panoramic X-rays or CBCT and your medical history.",
      "Receive a preliminary dentist review and expected treatment stages.",
      "Compare suitable clinics, estimated ranges and visit length.",
      "Confirm appointments, translation and optional local support.",
    ],
    stepsZh: [
      "提交近期全景片或CBCT及相关病史。",
      "获得牙医初步审核和预计治疗阶段。",
      "比较合适诊所、费用范围和停留时间。",
      "确认预约、翻译及可选在华协助。",
    ],
    faq: [
      [
        "How long does implant treatment take?",
        "Timing varies. Some cases require several months between implant placement and the final crown or bridge.",
      ],
      [
        "Can the exact price be confirmed before travel?",
        "We can coordinate a preliminary range after record review. The dentist confirms the final plan after an in-person examination.",
      ],
    ],
    faqZh: [
      [
        "种植治疗需要多久？",
        "时间因人而异。部分方案在植入种植体后，需要等待数月再安装最终牙冠或牙桥。",
      ],
      [
        "出发前能确定准确价格吗？",
        "资料审核后可协调初步费用范围，最终方案须由牙医面诊确认。",
      ],
    ],
  },
  "general-dentistry": {
    title: "General Dentistry in China",
    titleZh: "中国普通牙科服务",
    eyebrow: "GENERAL DENTISTRY · 普通牙科",
    intro:
      "Coordinate preventive and restorative dental care in China, from examinations and cleanings to fillings, root-canal assessment and extractions.",
    introZh:
      "协调中国普通牙科的预防和修复服务，包括检查、洁牙、补牙、根管评估和拔牙。",
    image: "/dental-hero.webp",
    imageAlt: "Patient receiving a general dentistry consultation",
    benefits: [
      [
        "Comprehensive examination",
        "A clinical examination and appropriate imaging help the dentist identify decay, gum problems and damaged teeth.",
      ],
      [
        "Preventive care",
        "Professional cleaning and oral-care advice can support long-term gum and tooth health.",
      ],
      [
        "Restorative treatment",
        "Depending on the diagnosis, options may include fillings, crowns, root-canal treatment or extraction.",
      ],
    ],
    benefitsZh: [
      [
        "全面检查",
        "通过口腔检查和必要影像，帮助牙医判断龋齿、牙龈问题和牙齿损伤。",
      ],
      ["预防护理", "专业洁牙和口腔护理建议有助于维护长期牙龈及牙齿健康。"],
      ["修复治疗", "根据诊断，可能涉及补牙、牙冠、根管治疗或拔牙。"],
    ],
    steps: [
      "Tell us your symptoms, goals and preferred travel dates.",
      "Share recent records or arrange an examination after arrival.",
      "Review the dentist's recommended priorities and estimated fees.",
      "Coordinate appointments and bilingual communication.",
    ],
    stepsZh: [
      "说明症状、目标和希望赴华日期。",
      "提交近期资料，或抵达后安排检查。",
      "审核牙医建议的治疗优先级和费用范围。",
      "协调预约和双语沟通。",
    ],
    faq: [
      [
        "Can several treatments be arranged during one trip?",
        "Often yes, but the safe schedule depends on diagnosis, healing needs and clinic availability.",
      ],
      [
        "Do I need X-rays before contacting you?",
        "Existing recent images are helpful, but you may still start with a written description and clear photos.",
      ],
    ],
    faqZh: [
      [
        "一次赴华可以安排多个治疗吗？",
        "通常可以，但安全排期取决于诊断、愈合需求和诊所档期。",
      ],
      [
        "联系前必须准备牙片吗？",
        "近期影像会有帮助；暂时没有时，也可先提交文字说明和清晰照片。",
      ],
    ],
  },
  "cosmetic-dentistry": {
    title: "Cosmetic Dentistry in China",
    titleZh: "中国牙科美容服务",
    eyebrow: "COSMETIC DENTISTRY · 牙科美容",
    intro:
      "Explore dentist-led options for tooth color, shape, alignment and smile balance while keeping oral health and natural function central to the plan.",
    introZh:
      "在兼顾口腔健康和自然功能的基础上，了解改善牙齿颜色、形态、排列及笑容协调度的方案。",
    image: "/arrival-care.webp",
    imageAlt: "International patient discussing cosmetic dental options",
    benefits: [
      [
        "Smile assessment",
        "The dentist reviews tooth color, shape, alignment, bite and gum condition before recommending treatment.",
      ],
      [
        "Treatment choices",
        "Options may include whitening, bonding, veneers, crowns or orthodontic assessment.",
      ],
      [
        "Natural-looking planning",
        "Photos, digital previews and shade discussion can help align expectations before treatment begins.",
      ],
    ],
    benefitsZh: [
      ["笑容评估", "牙医会先检查牙齿颜色、形态、排列、咬合及牙龈情况。"],
      ["治疗选择", "可能包括美白、粘接修复、贴面、牙冠或正畸评估。"],
      ["自然效果规划", "治疗前可通过照片、数字预览和色阶沟通统一预期。"],
    ],
    steps: [
      "Share smile photos and explain what you want to change.",
      "Receive a preliminary review of suitable and unsuitable options.",
      "Compare expected treatment time, maintenance and fee ranges.",
      "Confirm the clinic visit and simple consultation form.",
    ],
    stepsZh: [
      "提交笑容照片并说明希望改善的地方。",
      "获得适合及不适合方案的初步评估。",
      "比较治疗时间、维护要求和费用范围。",
      "确认诊所到访及简洁咨询资料。",
    ],
    faq: [
      [
        "Are veneers suitable for everyone?",
        "No. Tooth condition, enamel, bite and expectations must be assessed by a dentist first.",
      ],
      [
        "Can whitening and restorations be completed together?",
        "Sometimes, but sequencing matters because existing crowns and veneers do not whiten like natural teeth.",
      ],
    ],
    faqZh: [
      [
        "每个人都适合做贴面吗？",
        "不是。牙医需要先评估牙齿状况、牙釉质、咬合和期望。",
      ],
      [
        "美白和修复可以一起完成吗？",
        "部分情况可以，但顺序很重要，因为现有牙冠和贴面不会像天然牙一样被美白。",
      ],
    ],
  },
} as const;

export function ServiceDetail({ kind }: { kind: ServiceKey }) {
  const [lang, setLang] = useState<SiteLang>("en"), [content,setContent]=useState<Record<string,string>>({});
  useEffect(() => { setLang(preferredLanguage()); fetch("/api/site-config", { cache: "no-store" }).then(r=>r.json() as Promise<{content?:Record<string,string>}>).then(x=>setContent(x.content||{})).catch(()=>{}); }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = Array.from(document.querySelectorAll("main section"));
    if (reduce) { sections.forEach((s) => s.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    sections.forEach((s) => { s.classList.add("reveal-init"); io.observe(s); });
    return () => io.disconnect();
  }, []);
  const zh = lang === "zh",
    page = pages[kind],
    benefits = zh ? page.benefitsZh : page.benefits,
    faq = zh ? page.faqZh : page.faq;
  const name =
    kind === "dental-implants"
      ? "Dental Implants"
      : kind === "general-dentistry"
        ? "General Dentistry"
        : "Cosmetic Dentistry";
  const displayName = zh ? page.titleZh : name;
  const contentKey = kind.replace(/-/g,"_")+"_page_json";
  const cms = (()=>{try{return JSON.parse(content[contentKey]||"{}") as {sections?:Array<{id:string;title:string;titleZh?:string;subtitle:string;subtitleZh?:string;body:string;bodyZh?:string;image:string;buttonText:string;buttonTextZh?:string;buttonUrl:string;visible:boolean}>}}catch{return {}}})();
  const cmsSections=Object.fromEntries((cms.sections||[]).map(x=>[x.id,x]));
  const cmsHero=cmsSections.hero;
  return (
    <main
      className="min-h-screen bg-[#f7fbfb] text-[#163533]"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <SiteHeader lang={lang} onLanguageChange={setLang} />
      <section className="relative overflow-hidden bg-[#153f3c] px-5 pb-20 pt-28 text-white lg:px-8 lg:pt-36">
        <Image
          unoptimized
          priority
          src={cmsHero?.image || page.image}
          alt={page.imageAlt}
          fill
          className="object-cover opacity-20"
        />
        <div className="hero-glow" style={{ right: "-8%", top: "-8%", opacity: .5 }} aria-hidden="true" />
        <div className="hero-glow hero-glow--coral" style={{ left: "-6%", bottom: "-12%", opacity: .4 }} aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="text-sm text-[#9fe2da]">
              <a href="/">{zh ? "主页" : "Home"}</a> / {zh ? "服务" : "Services"} / {displayName}
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">
              <RichContent html={(zh ? cmsHero?.titleZh : cmsHero?.title) || (zh ? displayName : `${name} At Beneigh`)} className="contents" />
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d5e7e4]">
              <RichContent html={(zh ? cmsHero?.bodyZh : cmsHero?.body) || (zh ? page.introZh : page.intro)} className="contents" />
            </p>
            <p className="mt-7 text-2xl font-bold">
              {zh ? "示例服务套餐 · $599" : "Demo Service Package · $599"}
            </p>
            <ul className="mt-6 space-y-3 text-base">
              {(zh
                ? ["出发前审核资料", "协调诊所与双语沟通", "确认费用及复诊安排"]
                : [
                    "Record Review Before Travel",
                    "Clinic And Bilingual Coordination",
                    "Clear Stages And Follow-Up",
                  ]
              ).map((text) => (
                <li className="flex items-center gap-3" key={text}>
                  <Check className="size-5 text-[#7ed7cf]" />
                  {text}
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-8 min-h-12 rounded-full bg-[#ec765f] px-6 text-white hover:bg-[#257a76]"
            >
              <a href={cmsHero?.buttonUrl || "/#plan"}>
                <RichContent html={(zh ? cmsHero?.buttonTextZh : cmsHero?.buttonText) || (zh ? "选择服务方案" : "Choose Your Plans")} className="contents" />
                <ArrowRight />
              </a>
            </Button>
          </div>
          <div id="consult" className="text-[#163533]">
            {(cmsSections.contact?.title || cmsSections.contact?.titleZh || cmsSections.contact?.body || cmsSections.contact?.bodyZh) && <div className="mb-5"><h2 className="text-2xl font-bold"><RichContent html={(zh ? cmsSections.contact?.titleZh : cmsSections.contact?.title) || (zh ? "预约咨询" : "Request A Consultation")} className="contents" /></h2>{(zh ? cmsSections.contact?.bodyZh : cmsSections.contact?.body) && <p className="mt-3 leading-7 text-[#627b79]"><RichContent html={(zh ? cmsSections.contact?.bodyZh : cmsSections.contact?.body) || ""} className="contents" /></p>}</div>}
            <ContactForm lang={lang} service={name} />
          </div>
        </div>
      </section>
      <section className="bg-white px-5 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="kicker-outline">{zh ? "了解服务方案" : "Explore Your Options"}</p>
          <h2 className="section-title mx-auto">
            {zh ? `${displayName}｜国际患者服务` : `${name} For International Patients`}
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#627b79]">
            {zh ? page.introZh : page.intro}
          </p>
          <Image
            unoptimized
            src={page.image}
            width={1536}
            height={1024}
            alt={page.imageAlt}
            className="mt-10 h-[300px] w-full rounded-3xl object-cover sm:h-[470px]"
          />
        </div>
      </section>
      <section className="bg-[#edf7f6] px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="kicker-outline"><RichContent html={(zh ? cmsSections.cases?.subtitleZh : cmsSections.cases?.subtitle) || (zh ? "案例" : "Illustrative Patient Stories")} className="contents" /></p>
          <h2 className="section-title"><RichContent html={(zh ? cmsSections.cases?.titleZh : cmsSections.cases?.title) || (zh ? "值得规划的治疗旅程" : "A Journey Worth Planning")} className="contents" /></h2>
          <p className="mt-5 text-base leading-7 text-[#627b79]">
            <RichContent html={cmsSections.cases?.body || "Demo stories and images only. These are not real Beneigh patient testimonials or verified treatment outcomes."} className="contents" />
          </p>
          <div className="mt-10 flex snap-x gap-5 overflow-x-auto pb-5">
            {["Alex", "Taylor", "Jordan", "Morgan"].map((person, i) => (
              <article
                key={person}
                className="w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white sm:w-[320px]"
              >
                <img
                  src={
                    [
                      "/dental-plan.webp",
                      "/dental-hero.webp",
                      "/arrival-care.webp",
                      "/dental-plan.webp",
                    ][i]
                  }
                  alt="Demonstration dental journey scene"
                  className="h-48 w-full object-cover"
                />
                <div className="p-6">
                  <p className="text-sm font-bold text-[#ec765f]">
                    {zh ? `示例案例 ${i + 1}` : `Demo Case ${i + 1}`}
                  </p>
                  <h3 className="mt-3 text-xl font-bold">
                    {zh ? `${person}的${displayName}旅程` : `${person}'s ${name} Journey`}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-[#627b79]">
                    {zh ? "示例：患者提交资料、比较诊所方案，并在赴华前确认分阶段行程。" : "Example: a traveler shares records, compares clinic options and confirms a staged itinerary before visiting China."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="section-title"><RichContent html={(zh ? cmsSections.benefits?.titleZh : cmsSections.benefits?.title) || (zh ? `${displayName}是什么？` : `What Is ${name}?`)} className="contents" /></h2>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-[#627b79]">
            <RichContent html={cmsSections.benefits?.body || (zh ? page.introZh : page.intro)} className="contents" />
          </p>
          <div className="mt-12 grid gap-7 md:grid-cols-3">
            {benefits.map(([title, text], i) => (
              <article key={title} className="border-t-4 border-[#0f6d68] pt-6">
                <p className="text-sm font-bold text-[#0f8b82]">0{i + 1}</p>
                <h3 className="mt-3 text-2xl font-bold">{title}</h3>
                <p className="mt-4 text-base leading-7 text-[#627b79]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#153f3c] px-5 py-24 text-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="section-title !text-white">
            <RichContent html={(zh ? cmsSections.faq?.titleZh : cmsSections.faq?.title) || (zh ? `${displayName}常见问题` : `Frequently Asked Questions About ${name}`)} className="contents" />
          </h2>
          {cmsSections.faq?.body && <p className="mt-5 text-base leading-8 text-[#c2d8d5]"><RichContent html={cmsSections.faq.body} className="contents" /></p>}
          <div className="mt-10 divide-y divide-white/20">
            {faq.map(([q, a]) => (
              <details key={q} className="group py-6">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold">
                  {q}
                  <ChevronDown className="shrink-0 transition group-open:rotate-180" />
                </summary>
                <p className="pt-4 text-base leading-8 text-[#c2d8d5]">{a}</p>
              </details>
            ))}
            <details className="group py-6">
              <summary className="flex min-h-11 cursor-pointer list-none justify-between gap-4 text-xl font-bold">
                {zh ? "如何联系陪诊协调员？" : "How Do I Contact My Coordinator?"}
                <ChevronDown />
              </summary>
              <p className="pt-4 text-base leading-8 text-[#c2d8d5]">
                {zh ? "提交上方咨询后，您可以通过客户专属入口查看并回复团队消息。" : "Submit the simple inquiry above. Your private client portal lets you read and reply to the team's messages."}
              </p>
            </details>
          </div>
        </div>
      </section>
      <section className="bg-white px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="kicker-outline"><RichContent html={(zh ? cmsSections.team?.subtitleZh : cmsSections.team?.subtitle) || (zh ? "服务团队" : "Team Showcase")} className="contents" /></p>
          <h2 className="section-title"><RichContent html={(zh ? cmsSections.team?.titleZh : cmsSections.team?.title) || (zh ? "了解陪诊团队" : "Meet The Care Team")} className="contents" /></h2>
          <p className="mt-5 text-base leading-7 text-[#627b79]">
            <RichContent html={cmsSections.team?.body || "Demonstration profiles and scene images. Actual clinic partners, clinicians and credentials must be confirmed before promotion."} className="contents" />
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <article key={i} className="overflow-hidden rounded-2xl border">
                <img
                  src={i % 2 ? "/dental-hero.webp" : "/dental-plan.webp"}
                  alt="Demo clinician consultation scene, not an actual partner portrait"
                  className="h-56 w-full object-cover"
                />
                <div className="p-6">
                  <p className="text-sm font-bold text-[#ec765f]">
                    {zh ? "示例资料" : "Demo Profile"}
                  </p>
                  <h3 className="mt-3 text-xl font-bold">
                    {zh ? `陪诊团队成员 ${String(i + 1).padStart(2, "0")}` : `Care Team Member ${String(i + 1).padStart(2, "0")}`}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-[#627b79]">
                    {zh ? "此处用于展示医生简介、专业方向、语言能力及已核实资质。" : "A placeholder for the clinician's biography, specialties, languages and verified qualifications."}
                  </p>
                  <Dialog>
                    <DialogTrigger className="mt-5 inline-flex min-h-11 items-center font-bold text-[#0f6d68]">
                      {zh ? "查看完整简介" : "Read Full Bio"} →
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {zh ? `陪诊团队成员 ${i + 1}｜示例` : `Care Team Member ${i + 1} — Demo`}
                        </DialogTitle>
                      </DialogHeader>
                      <p className="text-base leading-7">
                        Replace this profile with verified information about the
                        actual clinician: registration, education, clinical
                        focus, languages and practicing clinic. This is not an
                        actual Beneigh partner.
                      </p>
                    </DialogContent>
                  </Dialog>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#0f6d68] px-5 py-24 text-center text-white">
        <h2 className="mx-auto max-w-4xl text-4xl font-bold sm:text-5xl">
          <RichContent html={(zh ? cmsSections.process?.titleZh : cmsSections.process?.title) || (zh ? "开始您的牙科护理旅程" : "Start Your Dental Care Journey")} className="contents" />
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8">
          <RichContent html={(zh ? cmsSections.process?.bodyZh : cmsSections.process?.body) || (zh ? "说明您的目标、资料和可出行日期。最终治疗决定由持证牙医作出。" : "Talk through your goals, records and available travel dates. Treatment decisions remain with your licensed dentist.")} className="contents" />
        </p>
        <Button
          asChild
          className="mt-8 min-h-12 rounded-full bg-[#ec765f] px-7 text-white hover:bg-[#257a76]"
        >
          <a href="#consult">
            {zh ? "联系比邻" : "Contact Beneigh"}
            <ArrowRight />
          </a>
        </Button>
      </section>
      <section className="px-5 py-24">
        <div className="mx-auto max-w-7xl space-y-20">
          {[
            [
              name + " With Clear Coordination",
              "Review your records, treatment stages, stay length and follow-up requirements before confirming a journey.",
              "/dental-plan.webp",
            ],
            [
              "Your China Visit, Planned Together",
              "Appointments, bilingual communication and optional local arrangements can be coordinated around the agreed clinical plan.",
              "/arrival-care.webp",
            ],
          ].map(([title, text, img], i) => (
            <article
              key={title}
              className="grid gap-10 lg:grid-cols-2 lg:items-center"
            >
              <div className={i ? "lg:order-2" : ""}>
                <h2 className="section-title">{title}</h2>
                <p className="mt-6 text-lg leading-8 text-[#627b79]">{text}</p>
                <a
                  href="#consult"
                  className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-[#0f6d68]"
                >
                  {zh ? "了解更多" : "Find Out More"}
                  <ArrowRight size={18} />
                </a>
              </div>
              <Image
                unoptimized
                src={img}
                width={1536}
                height={1024}
                alt="Demonstration dental travel coordination scene"
                className="h-[320px] w-full rounded-3xl object-cover sm:h-[450px]"
              />
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#e4f3f1] px-5 py-20 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          {zh ? "下一步从这里开始" : "Your Next Step Starts Here"}
        </h2>
        <a
          href="#consult"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#0f6d68] px-7 font-bold text-white"
        >
          {zh ? "提交咨询" : "Send An Inquiry"}
        </a>
        <div className="mx-auto max-w-4xl">
          <QuickContact lang={lang} />
        </div>
      </section>
      <SiteFooter lang={lang} email="info@beneigh.com" />
    </main>
  );
}
