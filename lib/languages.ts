import type { SiteLang } from "../app/components/site-header";
export const languageCodes: SiteLang[] = [
  "en",
  "zh",
];
export function preferredLanguage() {
  const saved = localStorage.getItem("beneigh_language_override") as SiteLang;
  if (languageCodes.includes(saved)) return saved;
  const locales = [navigator.language, ...(navigator.languages || [])].map((x) => x.toLowerCase());
  const preferred = locales.find((locale) => locale.startsWith("zh") || locale.startsWith("en"));
  if (preferred?.startsWith("zh")) return "zh";
  if (preferred?.startsWith("en")) return "en";
  const region = locales[0]?.split("-")[1];
  return ["cn", "hk", "mo", "tw", "sg"].includes(region || "") ? "zh" : "en";
}
export const primaryCopy = {
  ja: {
    cta: "プランを選択",
    titleA: "笑顔を取り戻す。",
    titleB: "中国での治療をサポート。",
    intro:
      "記録の確認、クリニック選び、予約、通訳、現地サポートまで、渡航前に計画を明確にします。",
    formTitle: "予約リクエスト",
    faqTitle: "渡航前のよくある質問",
  },
  ko: {
    cta: "플랜 선택",
    titleA: "미소를 되찾으세요.",
    titleB: "중국 치료 여정을 함께합니다.",
    intro:
      "자료 검토, 치과 선택, 예약, 통역 및 현지 지원까지 출발 전에 치료 여정을 계획합니다.",
    formTitle: "예약 요청",
    faqTitle: "여행 전 자주 묻는 질문",
  },
  pt: {
    cta: "Escolha Seus Planos",
    titleA: "Recupere Seu Sorriso.",
    titleB: "Coordenamos Sua Jornada.",
    intro:
      "Da análise dos exames à escolha da clínica, consultas, tradução e apoio local: planeje sua viagem à China com clareza.",
    formTitle: "Solicitação De Reserva",
    faqTitle: "Perguntas Antes De Viajar",
  },
  es: {
    cta: "Elija Sus Planes",
    titleA: "Recupere Su Sonrisa.",
    titleB: "Coordinamos Su Viaje.",
    intro:
      "Revisión de estudios, selección de clínica, citas, traducción y apoyo local: planifique su atención dental en China antes de viajar.",
    formTitle: "Solicitud De Reserva",
    faqTitle: "Preguntas Antes De Viajar",
  },
  fr: {
    cta: "Choisir Vos Formules",
    titleA: "Retrouvez Votre Sourire.",
    titleB: "Nous Coordonnons Votre Parcours.",
    intro:
      "Analyse des examens, choix de la clinique, rendez-vous, traduction et accompagnement local pour préparer vos soins dentaires en Chine.",
    formTitle: "Demande De Réservation",
    faqTitle: "Questions Avant Votre Voyage",
  },
  ar: {
    cta: "اختر خطتك",
    titleA: "استعد ابتسامتك.",
    titleB: "ننسق رحلتك العلاجية.",
    intro:
      "مراجعة السجلات واختيار العيادة والمواعيد والترجمة والدعم المحلي لتخطيط علاج الأسنان في الصين قبل السفر.",
    formTitle: "طلب الحجز",
    faqTitle: "أسئلة قبل السفر",
  },
};
