import { useTranslation } from "react-i18next";
import styles from "./PolicyPage.module.css";

export default function PolicyPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <div className={styles.page} dir={isAr ? "rtl" : "ltr"}>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLabel}>{isAr ? "الشروط والأحكام" : "Terms & Conditions"}</div>
        <h1 className={styles.heroTitle}>{isAr ? "السياسات والخصوصية" : "Policies & Privacy"}</h1>
        <p className={styles.heroSub}>
          {isAr
            ? "بياناتك خاصة. محتواك آمن. علامتك ملكك."
            : "Your data is private. Your content is secure. Your brand is yours."}
        </p>
      </div>

      {/* Privacy & Data */}
      <div className={styles.blockTitle}>
        {isAr ? "🔒 الخصوصية وحماية البيانات" : "🔒 Privacy & Data Protection"}
      </div>
      <div className={styles.grid}>
        {(isAr ? privacyAr : privacyEn).map((s, i) => (
          <Section key={i} {...s} />
        ))}
      </div>

      {/* Divider */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <div className={styles.dividerBadge}>
          {isAr ? "⚙️ قسم ١ — خدمة الموقع الذاتية" : "⚙️ Part 1 — Self-Service Platform"}
        </div>
        <div className={styles.dividerLine} />
      </div>
      <p className={styles.sectionDesc}>
        {isAr
          ? "هذا القسم يخص استخدامك للموقع مباشرة لتوليد الصور والفيديوهات عبر الذكاء الاصطناعي."
          : "This section applies to direct use of the platform to generate AI images and videos."}
      </p>
      <div className={styles.grid}>
        {(isAr ? selfServiceAr : selfServiceEn).map((s, i) => (
          <Section key={i} {...s} />
        ))}
      </div>

      {/* Divider */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <div className={styles.dividerBadge}>
          {isAr ? "🤝 قسم ٢ — الخدمة الخارجية المُدارة" : "🤝 Part 2 — Managed External Service"}
        </div>
        <div className={styles.dividerLine} />
      </div>
      <p className={styles.sectionDesc}>
        {isAr
          ? "هذا القسم يخص الطلبات الخارجية حيث ترسل لنا المواد ونقوم بالإنتاج نيابةً عنك."
          : "This section applies to external orders where you send us materials and we handle production on your behalf."}
      </p>
      <div className={styles.grid}>
        {(isAr ? managedServiceAr : managedServiceEn).map((s, i) => (
          <Section key={i} {...s} />
        ))}
      </div>

      <div className={styles.footer}>
        <p>
          {isAr
            ? "باستمرارك في استخدام المنصة أو طلب خدماتنا، فأنت توافق على جميع الشروط الواردة أعلاه دون استثناء. في حال وجود أي نزاع، تُعتمد النسخة العربية من هذه السياسة مرجعًا أساسيًا."
            : "By continuing to use our platform or requesting our services, you agree to all the terms stated above without exception."}
        </p>
      </div>
    </div>
  );
}

function Section({ icon, title, items, highlight }) {
  return (
    <div className={`${highlight ? "policyHighlight " : ""}sectionCard`} style={{
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: 22,
      background: highlight
        ? "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(255,255,255,0.01))"
        : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.00))",
      transition: "border-color 200ms ease, transform 200ms ease",
      borderColor: highlight ? "rgba(99,102,241,0.3)" : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900 }}>{title}</h2>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, lineHeight: 1.65, color: "var(--muted)" }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "rgba(99,102,241,0.65)", flexShrink: 0, marginTop: 7, display: "inline-block" }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Privacy ──────────────────────────────────────────────
const privacyAr = [
  { icon: "🔑", title: "تسجيل الدخول والحساب", items: ["إنشاء حساب يتم عبر البريد الإلكتروني فقط.", "نجمع الاسم والبريد الإلكتروني لإدارة حسابك.", "لن يُشارك بريدك الإلكتروني مع أي طرف ثالث."] },
  { icon: "🛡️", title: "خصوصية المحتوى", items: ["جميع الصور والبرومبتات التي تنشئها خاصة بك بالكامل.", "لا يمكن لأي مستخدم آخر الوصول إلى محتواك.", "لا نعرض محتواك للعموم بدون إذنك الصريح."] },
  { icon: "🚫", title: "عدم بيع البيانات", items: ["نحن لا نبيع بياناتك الشخصية.", "لا نشاركها مع أطراف ثالثة لأغراض تجارية.", "بياناتك تُستخدم فقط لتشغيل وتحسين الخدمة."] },
  { icon: "🧾", title: "ملكية المحتوى", items: ["جميع المحتوى الذي تنشئه يظل ملكًا لك.", "تحتفظ بحقوق الاستخدام التجاري الكاملة.", "SADA تحتفظ بحق عرض الأعمال في محفظتها ما لم تطلب السرية مسبقًا."] },
];

const privacyEn = [
  { icon: "🔑", title: "Account Access", items: ["Account creation is done via email only.", "We collect your name and email to manage your account.", "Your email will never be shared with third parties."] },
  { icon: "🛡️", title: "Content Privacy", items: ["All images and prompts you generate are completely private.", "No other user can access your content.", "We do not display your content publicly without explicit permission."] },
  { icon: "🚫", title: "No Data Selling", items: ["We do NOT sell your personal data.", "We do not share it with third parties for commercial purposes.", "Your data is used solely to operate and improve the service."] },
  { icon: "🧾", title: "Content Ownership", items: ["All content you generate remains yours.", "You retain full commercial usage rights.", "SADA reserves the right to showcase work in its portfolio unless confidentiality is requested in advance."] },
];

// ── Self-Service ──────────────────────────────────────────
const selfServiceAr = [
  {
    icon: "💳", title: "الدفع والنقاط", highlight: true,
    items: [
      "شراء النقاط يتم مسبقًا قبل استخدام الخدمة.",
      "النقاط تُخصم تلقائيًا عند كل عملية توليد ناجحة.",
      "النقاط غير قابلة للاسترجاع بعد الاستخدام.",
      "في حالة فشل العملية من جانبنا، تُعاد النقاط تلقائيًا.",
      "المشتريات غير قابلة للاسترداد النقدي بعد إضافة النقاط للحساب.",
    ],
  },
  {
    icon: "⚠️", title: "مسؤولية النتائج", highlight: false,
    items: [
      "النتائج تعتمد على وصف الطلب — أنت مسؤول عن جودة الوصف.",
      "قد تظهر اختلافات بسيطة في الإضاءة والألوان بسبب طبيعة الذكاء الاصطناعي.",
      "لا نضمن تطابق النتائج 100% مع أي صورة مرجعية.",
      "إعادة التوليد تتطلب نقاطًا إضافية — لا استثناء.",
    ],
  },
  {
    icon: "🚫", title: "الاستخدام المحظور", highlight: false,
    items: [
      "يُمنع منعًا باتًا إنشاء محتوى غير قانوني أو مسيء أو ضار.",
      "يُمنع رفع مواد محمية بحقوق ملكية بدون إذن صريح.",
      "يُمنع استخدام الخدمة لأغراض تنتهك حقوق الآخرين.",
      "في حال اكتشاف مخالفة، نحتفظ بحق إيقاف الحساب فورًا بدون استرداد.",
    ],
  },
  {
    icon: "⏱️", title: "أداء الخدمة", highlight: false,
    items: [
      "يتم إنشاء الصور والفيديوهات خلال 1–5 دقائق في الغالب.",
      "قد يحدث تأخير في أوقات الضغط العالي — هذا ليس خللًا.",
      "لا نضمن توفر الخدمة 24/7 — قد تكون هناك فترات صيانة.",
      "في حالة العطل التقني الكامل، نعيد النقاط المخصومة فقط.",
    ],
  },
];

const selfServiceEn = [
  {
    icon: "💳", title: "Payment & Credits", highlight: true,
    items: [
      "Credits must be purchased before using the service.",
      "Credits are automatically deducted upon each successful generation.",
      "Credits are non-refundable once used.",
      "If a generation fails on our end, credits are automatically restored.",
      "Purchases are non-refundable in cash once credits are added to the account.",
    ],
  },
  {
    icon: "⚠️", title: "Results Responsibility", highlight: false,
    items: [
      "Results depend on your prompt — you are responsible for prompt quality.",
      "Minor variations in lighting and color may occur due to AI nature.",
      "We do not guarantee 100% match with any reference image.",
      "Re-generation requires additional credits — no exceptions.",
    ],
  },
  {
    icon: "🚫", title: "Prohibited Use", highlight: false,
    items: [
      "Strictly prohibited: creating illegal, offensive, or harmful content.",
      "Prohibited: uploading copyrighted materials without explicit permission.",
      "Prohibited: using the service in ways that violate others' rights.",
      "Violation may result in immediate account suspension without refund.",
    ],
  },
  {
    icon: "⏱️", title: "Service Performance", highlight: false,
    items: [
      "Images and videos are typically generated within 1–5 minutes.",
      "Delays may occur during peak hours — this is not a malfunction.",
      "We do not guarantee 24/7 uptime — maintenance periods may occur.",
      "In case of full technical failure, only deducted credits will be restored.",
    ],
  },
];

// ── Managed Service ───────────────────────────────────────
const managedServiceAr = [
  {
    icon: "💳", title: "الدفع والحجز", highlight: true,
    items: [
      "الدفع الكامل مطلوب مسبقًا لتأكيد الطلب.",
      "لن يبدأ أي عمل قبل استلام الدفع.",
      "جميع المدفوعات غير قابلة للاسترداد بعد تأكيد الطلب وبدء الإنتاج.",
      "في حال إلغاء الطلب قبل البدء، يتم خصم رسوم الحجز (25% من المبلغ).",
    ],
  },
  {
    icon: "📸", title: "المواد المطلوبة", highlight: false,
    items: [
      "ترسل لنا صورًا واضحة وعالية الجودة للملابس أو المنتج.",
      "يُفضل تقديم صورتين مرجعيتين: صورة كاملة + صورة مقربة.",
      "الصور منخفضة الجودة قد تؤثر سلبًا على النتيجة النهائية — ولا يحق المطالبة بإعادة التنفيذ مجانًا.",
      "أنت مسؤول قانونيًا عن امتلاكك حقوق استخدام جميع المواد المُرسلة.",
      "في حال ثبوت انتهاك حقوق ملكية، يتحمل العميل وحده المسؤولية الكاملة.",
    ],
  },
  {
    icon: "🎨", title: "العملية الإبداعية والنتائج", highlight: false,
    items: [
      "ستُعاد إنشاء الخلفيات والعارضين والوضعيات لتتطابق مع مراجعك قدر الإمكان.",
      "قد تحدث اختلافات طفيفة في الإضاءة أو درجة اللون بسبب طبيعة الذكاء الاصطناعي.",
      "لا يمكن ضمان التطابق التام مع أي صورة مرجعية — هذا ليس عيبًا في الخدمة.",
      "الاختلافات الطفيفة لا تُعدّ مسوّغًا للمطالبة باسترداد المبلغ.",
    ],
  },
  {
    icon: "⏱️", title: "وقت التسليم", highlight: false,
    items: [
      "التسليم الاعتيادي: خلال 3–5 أيام عمل من استلام جميع المواد.",
      "التسليم السريع (24–48 ساعة) متاح برسوم إضافية — يجب الطلب مسبقًا.",
      "التأخير بسبب عدم اكتمال المواد لا يُحتسب ضمن وقت التسليم.",
      "لا نتحمل مسؤولية التأخير الناتج عن عدم استجابة العميل.",
    ],
  },
  {
    icon: "🔄", title: "سياسة التعديلات", highlight: false,
    items: [
      "جولة واحدة فقط من التعديلات البسيطة مشمولة: (إضاءة، تعديلات وضعية طفيفة، تصحيح ألوان).",
      "التعديلات يجب طلبها خلال 48 ساعة من استلام النتائج.",
      "التغييرات الجوهرية (وضعية جديدة، خلفية جديدة، مفهوم مختلف) تُعامل كطلب جديد بتكلفة كاملة.",
      "التعديلات الإضافية خارج النطاق المشمول تخضع لرسوم إضافية.",
      "لا يحق طلب تعديلات بعد مرور 48 ساعة من التسليم.",
    ],
  },
  {
    icon: "©️", title: "حقوق الاستخدام والمحفظة", highlight: false,
    items: [
      "يحصل العميل على حقوق استخدام تجارية كاملة للمحتوى المُسلَّم.",
      "SADA تحتفظ بحق عرض الأعمال المختارة في محفظتها التسويقية.",
      "إذا كان الطلب سريًا، يجب الإفصاح عن ذلك كتابيًا قبل بدء العمل.",
      "طلب السرية بعد التسليم لا يُقبل ولا يُلزمنا بإزالة المحتوى من المحفظة.",
    ],
  },
];

const managedServiceEn = [
  {
    icon: "💳", title: "Payment & Booking", highlight: true,
    items: [
      "Full payment is required upfront to confirm the order.",
      "No work will begin before payment is received.",
      "All payments are non-refundable once the order is confirmed and production has started.",
      "If cancelled before start, a 25% booking fee will be deducted.",
    ],
  },
  {
    icon: "📸", title: "Required Materials", highlight: false,
    items: [
      "Send clear, high-quality images of the clothing or product.",
      "Preferred: two reference photos — one full-body + one close-up.",
      "Low-quality images may negatively affect the final result — free re-execution cannot be claimed.",
      "You are legally responsible for owning usage rights to all submitted materials.",
      "In case of proven copyright violation, the client bears full legal responsibility.",
    ],
  },
  {
    icon: "🎨", title: "Creative Process & Output", highlight: false,
    items: [
      "Backgrounds, models, and poses will be recreated to closely match your references.",
      "Minor variations in lighting or color tone may occur due to AI nature.",
      "Exact replication of any reference image cannot be guaranteed — this is not a service defect.",
      "Minor variations do not constitute grounds for a refund claim.",
    ],
  },
  {
    icon: "⏱️", title: "Delivery Time", highlight: false,
    items: [
      "Standard delivery: within 3–5 business days of receiving all materials.",
      "Express delivery (24–48 hours) is available for an additional fee — must be requested in advance.",
      "Delays caused by incomplete materials do not count toward delivery time.",
      "We are not responsible for delays caused by client non-response.",
    ],
  },
  {
    icon: "🔄", title: "Revisions Policy", highlight: false,
    items: [
      "One round of minor adjustments is included: lighting, small pose tweaks, color correction.",
      "Revisions must be requested within 48 hours of receiving the results.",
      "Major changes (new pose, new background, new concept) are treated as a new order at full cost.",
      "Additional revisions outside the included scope are subject to extra fees.",
      "No revisions can be requested after 48 hours of delivery.",
    ],
  },
  {
    icon: "©️", title: "Usage & Portfolio Rights", highlight: false,
    items: [
      "Client receives full commercial usage rights for all delivered content.",
      "SADA reserves the right to showcase selected work in its marketing portfolio.",
      "If the order is confidential, this must be stated in writing before work begins.",
      "Requesting confidentiality after delivery is not accepted.",
    ],
  },
];