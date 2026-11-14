import { env } from "./runtime-env";
import { defaultPlans } from "./plans";
// A one-time requested catalog replacement. Subsequent administrator edits are preserved.
export async function ensureCatalog() {
  const catalogDone = await env.DB.prepare(
    "SELECT value FROM site_content WHERE key = ?",
  )
    .bind("plans_catalog_20261020")
    .first();
  const contentDone = await env.DB.prepare(
    "SELECT value FROM site_content WHERE key = ?",
  )
    .bind("content_revision_20261020_A")
    .first();
  const statements = [];
  if (!catalogDone) {
    statements.push(
      env.DB.prepare(
        "UPDATE services SET active = 0 WHERE id IN ('review','coordination','travel','interpreter','customized')",
      ),
      ...defaultPlans.map((p) =>
        env.DB.prepare(
          "INSERT INTO services (id,name_en,name_zh,description_en,description_zh,price,active,image_url,sort_order) VALUES (?,?,?,?,?,?,1,'',?) ON CONFLICT(id) DO NOTHING",
        ).bind(p.id,p.nameEn,p.nameZh,p.descriptionEn,p.descriptionZh,p.price,p.sortOrder),
      ),
      env.DB.prepare(
        "INSERT INTO site_content (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING",
      ).bind("plans_catalog_20261020", "1"),
    );
  }
  if (!contentDone) {
    const sections = [
      { id:"hero",label:"首页首屏",title:"Close Care to Afar Friends, Stay Comfort on the Treatment Journey",subtitle:"Professional medical accompaniment services in China",body:"China covers a vast territory and has a large population. After years of development, various medical services have become increasingly comprehensive, and its equipment and experience have reached international standards. Seeking medical treatment in China has now become a trend among international friends.",image:"/dental-hero.webp",buttonText:"Choose Your Service",buttonUrl:"#services",visible:true,sortOrder:1 },
      { id:"services",label:"服务类别",title:"Services",titleZh:"服务类别",subtitle:"Services",body:"From pre-assessment, booking, flight ticket, pick up, transportation and accommodation in China, translation, accompaniment, post consultation, sightseeing and follow up. We will make the right arrangement as per your requirements.",bodyZh:"从预审、预约、机票、接机、交通和住宿，到翻译、陪诊、复诊、观光和跟进，我们会按你的要求作出合适安排。",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:2 },
      { id:"pricing",label:"案例与参考价格",title:"Cases and Reference Price",subtitle:"Cases",body:"Illustrative patient journeys and reference costs. Final treatment scope and clinical fees are confirmed separately.",image:"",buttonText:"More...",buttonUrl:"#cases",visible:true,sortOrder:3 },
      { id:"process",label:"服务流程",title:"The Completed Process Indication",titleZh:"流程图示",subtitle:"Flow",body:"Please Follow the Direction to Enjoy the China Medical Services.",bodyZh:"请参照下列流程，申办中国的医疗服务。",image:"",buttonText:"Apply for Medical Booking",buttonTextZh:"预约申请",buttonUrl:"#booking",visible:true,sortOrder:4 },
      { id:"testimonials",label:"客户案例",title:"Cases and Reference Price",subtitle:"Cases",body:"",image:"",buttonText:"More...",buttonUrl:"#cases",visible:false,sortOrder:5 },
      { id:"faq",label:"常见问题",title:"Questions Before You Travel",subtitle:"FAQ",body:"",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:6 },
      { id:"contact",label:"联系我们",title:"Contact Us",subtitle:"Get In Touch",body:"Please leave your contact information, we will reply to you shortly.",image:"",buttonText:"",buttonUrl:"",visible:true,sortOrder:7 },
    ];
    const flow = [
      ["Step One: Provide Personal Information","第一步：提供个人资料","Provide personal information including the selected service, name and age, contact details by email or phone, nationality and expected return dates. After receiving the information, we will contact you for a preliminary review.","提供个人资料包括选择服务、姓名和年龄、联络资料（电邮或电话）、国籍及预计往返日期。收到信息后，我们会有专人和你联络，进行预审。"],
      ["Step Two: Pre-assessment","第二步：预审","The pre-assessment is mainly to understand the patient's current situation and medical history, whether the patient has suitable medical insurance in China or will self-pay, preferred city or hospital, and whether the travel dates conflict with the treatment time. We can then arrange the specialist department and collect USD200.","预审最主要是理解患者要求和交流详细资料，例如患者现时情况、有关病历、是否购买中国适用的医疗保险或自费、心目中的城市或医院，以及来往日期会否和疗程时间有所抵触等。之后便可进行预约专科部门，并缴交费用 USD200。"],
      ["Step Three: Confirm the Itinerary","第三步：确定行程","Book flights, accommodation and the dentist consultation dates.","预定机票、住宿和医生诊症日期。"],
      ["Step Four: Accompaniment","第四步：陪诊","After the patient arrives in China, an escort will meet the patient at the airport and arrange translation, transportation, accommodation, consultation, communication with doctors, follow-up visits or sightseeing where needed.","患者到达中国后，便会有陪诊员接机，全程安排翻译、交通、住宿、会诊、与医生交流、复诊或观光（如有需要）等。"],
      ["Step Five: Treatment","第五步：诊疗","The specialist will make a detailed diagnosis and provide the treatment plan, price and treatment time, so the patient understands the whole treatment process and risks.","专科医生会作详细诊断，提供治疗方案、价钱和治疗时间，让患者明了整个疗程的步骤和风险。"],
      ["Step Six: Follow-up","第六步：跟进","If the patient needs follow-up visits or multiple trips to China to complete treatment, our escort will continue to follow up and communicate remotely about post-treatment questions.","若患者需要复诊或多次往来中国完成疗程，我们的陪诊员会持续跟进和远程沟通诊后问题。"],
    ].map(([titleEn,titleZh,textEn,textZh],i)=>({id:String(i+1),titleEn,titleZh,textEn,textZh,active:true,sortOrder:i+1}));
    const cases = [
      { id:"smith", titleEn:"Mr. Smith's Dental Implant Journey", titleZh:"史勿夫先生植牙案例", bodyEn:"Mr. Smith travelled from Australia to China for dental implants. He had few remaining loose lower teeth and gum recession; 3D scans showed unsalvageable roots. Thanks to healthy jawbone, extractions and lower full-arch implants were done on the same day with a temporary restoration fitted. He stayed two weeks for recovery, sightseeing and passed review, then flew back for six months of healing before returning for one week to fit the permanent prosthesis and complete treatment.", bodyZh:"史勿夫先生因长期对口腔缺乏护理，下颚仅存小部份牙齿，并牙肉萎缩，牙齿松动，决定从澳洲飞往中国治疗，到埗后休息一天，翌日由专科医生进行彻底检验，经3D X-光扫瞄，原生牙齿根部已腐坏，不值得保留，选择了拔牙和做半口植牙手术，因患者口腔骨骼健康，可即日完成拔牙和植牙手术，术后已可装带牙套恢复进食，外观正常，之后逗留两周予术后观察和等候复检，期间史勿夫先生仍可到处观光，体验中国文化，之后复检正常，植体无发炎，无偏位，飞回澳洲待半年巩固期，再回中国逗留约一周，做永久固定牙套，完成整个疗程。", prices:{flights:2500,stay:2400,treatment:8500,support:800,other:500} },
      { id:"mary", titleEn:"Mary's Dental Treatment Journey", titleZh:"玛莉牙科治疗案例", bodyEn:"Mary suffered an oral injury from sports. High dental costs in New Zealand led her to travel to China for comprehensive dental care. Examination identified a treatment plan: 3 extractions, 4 implants, periodontal therapy and restorative bonding. She will make four trips to China, staying around 10 days each visit, with the full treatment spanning approximately nine months.", bodyZh:"玛莉因做运动致口腔受伤，因新西兰牙医收费太贵，遂决定飞往中国作彻底牙齿治疗，经医生检验，做出如下方案：拔牙3颗、植牙4颗、牙周治疗和矫形修补，期间需来回中国4次，每次逗留约10天，整个疗程约需时9个月。", prices:{flights:5000,stay:4000,treatment:5200,support:1200,other:0} },
      { id:"john", titleEn:"John's Dental Care During a China Visit", titleZh:"约翰旅游期间牙齿保养案例", bodyEn:"John, an American visitor to China, took time out from his travel schedule to receive dental maintenance treatment. His care included professional teeth cleaning, fillings and minor orthodontic adjustments. Since John came here as a tourist, only the fees for dental treatment and patient escort service will be charged.", bodyZh:"约翰是美国人，趁在中国旅游期间抽空做牙齿保养，包括洗牙、补牙和轻度矫形，因为约翰是旅游形式，只有治疗和陪诊费用。", prices:{flights:0,stay:0,treatment:300,support:35,other:0} },
    ];
    statements.push(
      env.DB.prepare("INSERT INTO site_content (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP").bind("home_page_json", JSON.stringify({title:"首页",seoTitle:"Be Neighbor | MediCare",seoDescription:"Professional medical accompaniment services in China.",sections})),
      env.DB.prepare("INSERT INTO site_content (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP").bind("service_flow_json", JSON.stringify(flow)),
      env.DB.prepare("INSERT INTO site_content (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP").bind("case_items_json", JSON.stringify(cases)),
      env.DB.prepare("INSERT INTO site_content (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING").bind("content_revision_20261020_A", "1"),
    );
  }
  if (statements.length) await env.DB.batch(statements);
}
