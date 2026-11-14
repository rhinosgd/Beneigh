"use client";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BeneighLogo, type SiteLang } from "./site-header";

const disclaimerZh = [
  "陪诊员提供的服务仅限于非医疗性辅助服务，包括：陪同就医、路线引导、协助挂号/缴费/取报告、协助办理出入院手续、简单生活照料，以及在患者与医务人员之间进行沟通转达。陪诊员不是医务人员，不提供诊断、治疗、用药建议、检查结果判读，也不进行任何医疗操作。",
  "患者知悉并确认：所有诊断、治疗方案、用药决定及医疗操作，均由医疗机构及其医务人员独立作出并承担责任。陪诊员对医疗机构的诊疗行为不具有控制权，亦不参与任何医疗决策。因医疗机构或其医务人员的诊疗行为造成患者损害的，依法由该医疗机构承担赔偿责任。",
  "陪诊员提供的翻译服务限于日常沟通与信息转达，不构成医疗翻译或专业医疗口译服务。对于复杂的知情同意谈话、术前风险说明、关键医嘱等，患者应要求医疗机构安排具备相应能力的翻译人员，或另行委托专业医疗翻译。陪诊员不对因翻译理解差异导致的医疗后果承担责任，但陪诊员存在故意歪曲或重大过失误译的除外。陪诊员不得代签任何具有法律效力的医疗文件（包括手术同意书、麻醉同意书、输血同意书等）。",
  "患者确认，其已知悉自身健康状况及就医过程中可能发生的固有风险（包括但不限于病情突然变化、药物过敏反应、跌倒、感染等）。陪诊员不对疾病本身的发展、患者自身基础疾病发作、或医疗机构诊疗行为固有的风险承担责任。但陪诊员在服务过程中发现患者出现紧急健康状况时，应尽合理努力协助呼叫医务人员或急救，该等协助行为不构成对损害结果的承诺或责任承担。",
  "陪诊员仅在其违反本合同项下非医疗性辅助服务义务，且该违约或过错行为与患者损害之间存在直接因果关系的范围内承担相应责任。下列情形不属于陪诊员的责任范围：（一）医疗机构及其医务人员的诊疗过错；（二）患者自身未如实告知健康状况、不遵从医嘱或自行作出医疗决定；（三）翻译理解差异（故意或重大过失除外）；（四）不可抗力或意外事件；（五）患者超出本合同约定服务范围自行委托陪诊员从事医疗相关行为所产生的后果。",
  "遇患者突发紧急健康状况，陪诊员的首要义务是立即通知医疗机构医务人员并协助启动急救流程。陪诊员不实施超出其非医疗性辅助角色范围的急救操作，但可应医务人员或急救人员的合理请求提供语言沟通协助。患者知悉并同意，在此类紧急情况下，陪诊员对其未能实施医疗专业判断或医疗操作不承担责任。",
  "患者确认：其已以自己能够理解的语言阅读并理解本条款的全部内容，特别是第一条、第三条和第五条。患者有机会就本条款提问并获得答复，并在知情的基础上自愿接受陪诊服务。",
];
const disclaimerEn = [
  "The Companion provides non-medical ancillary services only, including accompanying the Patient to medical appointments, wayfinding, assisting with registration/payment/report collection, assisting with admission and discharge procedures, basic daily care, and communication relay between the Patient and medical staff. The Companion is not a medical professional and does not provide diagnosis, treatment, medication advice, interpretation of test results, or perform any medical procedures.",
  "The Patient acknowledges and confirms that all diagnoses, treatment plans, medication decisions, and medical procedures are made independently by, and are the responsibility of, the medical institution and its staff. The Companion has no control over the medical institution's clinical conduct and does not participate in any medical decision-making. Any harm caused by the clinical conduct of the medical institution or its staff shall be borne by that institution in accordance with law.",
  "The Companion's interpreting service is limited to routine communication and information relay and does not constitute medical translation or professional medical interpreting. For complex informed consent discussions, pre-surgical risk disclosures, and critical medical orders, the Patient should request that the medical institution arrange a suitably qualified interpreter or separately engage a professional medical interpreter. The Companion assumes no liability for medical outcomes arising from differences in translation comprehension, except where the Companion has intentionally distorted the communication or committed gross negligence in interpretation. The Companion shall not sign any legally effective medical document on the Patient's behalf, including surgical consent, anesthesia consent, or blood transfusion consent.",
  "The Patient confirms awareness of their own health condition and the inherent risks associated with medical care, including but not limited to sudden changes in condition, allergic reactions to medication, falls, and infection. The Companion assumes no liability for the progression of the disease itself, flare-ups of the Patient's underlying conditions, or risks inherent in the medical institution's clinical conduct. However, if the Companion becomes aware of an emergency health condition during the service, the Companion shall make reasonable efforts to assist in summoning medical personnel or emergency services, and such assistance does not constitute an assumption of liability for the outcome.",
  "The Companion shall be liable only to the extent that a breach of non-medical ancillary service obligations under this Agreement, or a fault attributable to the Companion, is directly causally linked to harm suffered by the Patient. The following are not within the Companion's scope of responsibility: (a) clinical faults of the medical institution or its staff; (b) the Patient's failure to disclose health information truthfully, failure to follow medical advice, or self-made medical decisions; (c) translation comprehension differences, except intentional or grossly negligent conduct; (d) force majeure or accidents; (e) consequences arising from the Patient separately engaging the Companion to perform medical-related acts beyond the scope of this Agreement.",
  "In the event of a sudden emergency health condition, the Companion's primary obligation is to immediately notify the medical institution's staff and assist in initiating emergency procedures. The Companion does not perform emergency medical procedures beyond the scope of a non-medical ancillary role but may provide language assistance upon the reasonable request of medical or emergency personnel. The Patient acknowledges and agrees that in such emergencies, the Companion bears no responsibility for failing to exercise professional medical judgment or perform medical procedures.",
  "The Patient confirms that they have read and understood all provisions of this Clause in a language they can comprehend, particularly Article 1 (non-medical boundary), Article 3 (translation liability limitation), and Article 5 (scope of responsibility). The Patient has had the opportunity to ask questions and receive answers regarding this Clause and voluntarily accepts the Companion service on an informed basis.",
];

export function SiteFooter({
  lang,
  email,
}: {
  lang: SiteLang;
  email?: string;
}) {
  const zh = lang === "zh";
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [global,setGlobal]=useState({brandName:"Be Neighbor",tagline:"MediCare",footerText:"",footerTextZh:"",email:email||"info@beneigh.com"});
  useEffect(()=>{fetch("/api/site-config",{cache:"no-store"}).then(r=>r.json() as Promise<{content?:Record<string,string>}>).then(x=>{try{setGlobal(v=>({...v,...JSON.parse(x.content?.global_settings_json||"{}")}))}catch{}}).catch(()=>{})},[]);
  return (
    <footer className="bg-[#0e2f2d] px-5 py-14 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_.8fr_.8fr]">
        <div>
          <div className="[&_*]:!text-white">
            <BeneighLogo brandName={global.brandName} tagline={global.tagline} />
          </div>
          <p className="mt-5 max-w-md text-base leading-7 text-[#aac6c3]">
            {(zh ? (global.footerTextZh ||
              "为国际患者提供赴华牙科治疗信息、诊所匹配与行程协调服务。诊断和治疗由独立持证牙科专业人员提供。") : (global.footerText ||
              "Information, clinic matching and travel coordination for international patients seeking dental care in China. Diagnosis and treatment are provided by independently licensed dental professionals."))}
          </p>
        </div>
        <div>
          <b className="text-lg">{zh ? "服务项目" : "Services"}</b>
          <div className="mt-4 space-y-3 text-[#aac6c3]">
            <a className="block" href="/services/dental-implants">
              {zh ? "种植牙" : "Dental Implants"}
            </a>
            <a className="block" href="/#services">
              {zh ? "牙周护理" : "Periodontal Care"}
            </a>
            <a className="block" href="/services/general-dentistry">
              {zh ? "普通牙科" : "General Dentistry"}
            </a>
            <a className="block" href="/services/cosmetic-dentistry">
              {zh ? "牙科美容" : "Cosmetic Dentistry"}
            </a>
          </div>
        </div>
        <div>
          <b className="text-lg">{zh ? "开始咨询" : "Start here"}</b>
          <a
            href="/#contact"
            className="mt-4 flex items-center gap-2 text-[#7ed7cf]"
          >
            {zh ? "提交简单询问" : "Send an inquiry"}
            <ArrowRight size={17} />
          </a>
          {(email || global.email) && (
            <a
              className="mt-4 block text-sm text-[#aac6c3]"
              href={`mailto:${email || global.email}`}
            >
              {email || global.email}
            </a>
          )}
          <a href="#disclaimer" onClick={() => setDisclaimerOpen(true)} className="mt-6 inline-block text-left text-sm font-semibold text-[#7ed7cf] hover:text-white">
            {zh ? "免责条款" : "Disclaimer"}
          </a>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("beneigh:cookie-consent-open"))
            }
            className="mt-3 block text-left text-sm font-semibold text-[#7ed7cf] hover:text-white"
          >
            {zh ? "Cookie 设置" : "Cookie Settings"}
          </button>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl text-sm text-[#779a97]">
        © 2026 {global.brandName}.{" "}
        {zh
          ? "网站内容不构成医疗建议。"
          : "Website content is not medical advice."}
      </div>
      <div id="disclaimer" className={`pointer-events-auto fixed inset-0 z-[9999] ${disclaimerOpen ? "grid" : "hidden"} place-items-center bg-black/70 p-4`} role="dialog" aria-modal="true">
        <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 text-[#163533] shadow-2xl sm:p-9">
          <a href="#" aria-label="Close" onClick={() => setDisclaimerOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={21}/></a>
          <h2 className="pr-10 text-2xl font-bold sm:text-3xl">{zh ? "免责条款" : "Disclaimer Clause"}</h2>
          <div className="mt-6 space-y-5 text-sm leading-7 text-[#405f5b]">{(zh ? disclaimerZh : disclaimerEn).map((paragraph, index) => <p key={index}><span className="mr-1 font-bold">{index + 1}.</span>{paragraph}</p>)}</div>
        </div>
      </div>
    </footer>
  );
}
