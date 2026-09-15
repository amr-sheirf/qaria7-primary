/* صفحة نتائج الطلاب */

let RESULTS_CACHE = null;
let CURRENT_MATCHES = [];
let SCHOOL_TERM = null; // "1" أو "2"، تُجلب من إعدادات لوحة التحكم

/** يجلب الفصل الدراسي الحالي المحدَّد من لوحة التحكم (مرة واحدة فقط) */
async function loadCurrentTerm() {
  if (SCHOOL_TERM !== null) return;
  try {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.startsWith("PASTE_")) return;
    const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=term`, { cache: "no-store" });
    const data = await res.json();
    if (data.ok && data.term) SCHOOL_TERM = data.term;
  } catch (err) {
    // تجاهل الخطأ: النتيجة والشهادة ستظهران بدون تحديد الفصل الدراسي
  }
}

function termLabel() {
  if (SCHOOL_TERM === "2") return "نتيجة الفصل الدراسي الثاني";
  if (SCHOOL_TERM === "1") return "نتيجة الفصل الدراسي الأول";
  return "";
}

function initResultsPage() {
  const typeSel = document.getElementById("searchType");
  const label = document.getElementById("searchLabel");
  const input = document.getElementById("searchValue");
  const btn = document.getElementById("searchBtn");

  loadCurrentTerm();

  typeSel.addEventListener("change", () => {
    if (typeSel.value === "seat") {
      label.textContent = "أدخل رقم الجلوس";
      input.placeholder = "مثال: 1023";
      input.inputMode = "numeric";
    } else {
      label.textContent = "أدخل اسم الطالب (كل أو جزء من الاسم)";
      input.placeholder = "مثال: أحمد محمد";
      input.inputMode = "text";
    }
  });

  btn.addEventListener("click", runResultsSearch);
  input.addEventListener("keydown", e => { if (e.key === "Enter") runResultsSearch(); });
}

async function runResultsSearch() {
  const stateEl = document.getElementById("resultsState");
  const outputEl = document.getElementById("resultsOutput");
  const type = document.getElementById("searchType").value;
  const value = document.getElementById("searchValue").value.trim();

  outputEl.innerHTML = "";

  if (!value) {
    setState(stateEl, "error", "الرجاء إدخال قيمة للبحث.");
    return;
  }

  setState(stateEl, "loading", "جارٍ البحث عن النتيجة ...");

  try {
    await loadCurrentTerm();
    if (!RESULTS_CACHE) {
      RESULTS_CACHE = await fetchSheetCSV(CONFIG.SHEETS_CSV.RESULTS);
    }

    const seatKeys = ["رقم الجلوس", "SeatNumber", "Seat"];
    const nameKeys = ["اسم الطالب", "الاسم", "Name", "StudentName"];

    const matches = RESULTS_CACHE.filter(row => {
      if (type === "seat") {
        const seat = readField(row, ...seatKeys);
        return seat && seat === value;
      } else {
        const name = readField(row, ...nameKeys);
        return name && name.includes(value);
      }
    });

    if (matches.length === 0) {
      setState(stateEl, "error", "لم يتم العثور على نتيجة مطابقة. تأكد من البيانات المدخلة.");
      return;
    }

    CURRENT_MATCHES = matches;
    stateEl.innerHTML = "";
    outputEl.innerHTML = matches.map((row, idx) => renderResultCard(row, idx)).join("");

  } catch (err) {
    if (err.message === "CONFIG_NOT_SET") {
      setState(stateEl, "error", "لم يتم ربط شيت النتائج بعد. الرجاء إضافة الرابط في ملف assets/js/config.js.");
    } else {
      setState(stateEl, "error", "تعذّر تحميل النتائج حاليًا، الرجاء المحاولة لاحقًا.");
    }
  }
}

/** يفصل بيانات صف الطالب إلى: الهوية، المواد والدرجات، والمجموع */
function extractStudentData(row) {
  const identityKeys = ["رقم الجلوس", "SeatNumber", "Seat", "اسم الطالب", "الاسم", "Name", "StudentName", "الصف", "Grade", "Class"];
  const totalKeys = ["المجموع", "Total"];

  const seat = readField(row, "رقم الجلوس", "SeatNumber", "Seat");
  const name = readField(row, "اسم الطالب", "الاسم", "Name", "StudentName");
  const cls = readField(row, "الصف", "Grade", "Class");
  const subjectEntries = Object.entries(row).filter(([k, v]) => !identityKeys.includes(k) && !totalKeys.includes(k) && v !== "");
  const total = readField(row, ...totalKeys);

  return { seat, name, cls, subjectEntries, total };
}

function renderResultCard(row, idx) {
  const { seat, name, cls, subjectEntries, total } = extractStudentData(row);
  const initial = escapeHtml((name || "؟").trim().charAt(0));

  return `
    <div class="result-card">
      <div class="result-card-head">
        <div class="result-avatar">${initial}</div>
        <div class="result-card-info">
          <h3>${escapeHtml(name || "-")}</h3>
          <div class="result-card-tags">
            ${seat ? `<span class="tag"><span class="tag-label">رقم الجلوس</span> ${escapeHtml(seat)}</span>` : ""}
            ${cls ? `<span class="tag"><span class="tag-label">الصف</span> ${escapeHtml(cls)}</span>` : ""}
            ${termLabel() ? `<span class="tag tag-term">${escapeHtml(termLabel())}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="grades-table">
          <thead>
            <tr><th>المادة</th><th>الدرجة</th></tr>
          </thead>
          <tbody>
            ${subjectEntries.map(([k, v]) => `<tr><td class="subject-cell">${escapeHtml(k)}</td><td class="grade-cell">${escapeHtml(v)}</td></tr>`).join("")}
          </tbody>
          ${total ? `<tfoot><tr><td>المجموع الكلي</td><td>${escapeHtml(total)}</td></tr></tfoot>` : ""}
        </table>
      </div>

      <button class="btn btn-gold btn-block certificate-btn" type="button" onclick="printCertificate(${idx})">
        &#128424; طباعة الشهادة
      </button>
    </div>
  `;
}

/** ينشئ صفحة شهادة رسمية للطالب ويفتحها في نافذة جديدة جاهزة للطباعة */
function printCertificate(idx) {
  const row = CURRENT_MATCHES[idx];
  if (!row) return;

  const win = window.open("", "_blank");
  if (!win) {
    alert("الرجاء السماح بفتح النوافذ المنبثقة لطباعة الشهادة.");
    return;
  }
  win.document.open();
  win.document.write(buildCertificateHTML(row));
  win.document.close();
}

function buildCertificateHTML(row) {
  const s = CONFIG.SCHOOL;
  const { seat, name, cls, subjectEntries, total } = extractStudentData(row);
  const logoUrl = new URL("assets/img/logo.png", window.location.href).href;
  const today = new Date().toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" });

  // لو المواد كتيرة، نعرضها في عمودين جنب بعض بدل عمود طويل، عشان تفضل الشهادة صفحة واحدة
  const useTwoColumns = subjectEntries.length > 6;
  const half = Math.ceil(subjectEntries.length / 2);
  const columns = useTwoColumns
    ? [subjectEntries.slice(0, half), subjectEntries.slice(half)]
    : [subjectEntries];

  const renderGradeRow = ([k, v]) => {
    const isResultRow = k.trim() === "النتيجة";
    let badgeClass = "";
    if (isResultRow) {
      if (/ناجح/.test(v)) badgeClass = "cert-badge-pass";
      else if (/راسب|ضعيف/.test(v)) badgeClass = "cert-badge-fail";
    }
    return `<tr><td class="cert-subject">${escapeHtml(k)}</td><td class="cert-grade ${badgeClass}">${escapeHtml(v)}</td></tr>`;
  };

  const gradesHTML = columns.map(col => `
    <table class="cert-table-vertical">
      <tbody>${col.map(renderGradeRow).join("")}</tbody>
    </table>
  `).join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>شهادة نتيجة - ${escapeHtml(name || "")}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}
  @page{size:A4;margin:9mm;}
  body{font-family:'Cairo',sans-serif;margin:0;padding:16px 10px;background:#e8edf3;direction:rtl;}
  .cert{position:relative;max-width:210mm;margin:0 auto;background:linear-gradient(180deg,#fffdf7 0%,#fff9ec 100%);border:6px double #a9791f;border-radius:8px;padding:20px 28px 16px;box-shadow:0 12px 45px rgba(8,40,79,.18);}
  .cert::before{content:"";position:absolute;inset:7px;border:1.2px solid #c9a227;border-radius:5px;pointer-events:none;}
  .corner{position:absolute;width:20px;height:20px;border:2.5px solid #c9a227;}
  .corner.tl{top:11px;right:11px;border-left:0;border-bottom:0;}
  .corner.tr{top:11px;left:11px;border-right:0;border-bottom:0;}
  .corner.bl{bottom:11px;right:11px;border-left:0;border-top:0;}
  .corner.br{bottom:11px;left:11px;border-right:0;border-top:0;}
  .cert-header{text-align:center;position:relative;}
  .cert-header img{width:46px;height:46px;margin-bottom:3px;}
  .cert-header .ministry{font-size:.8rem;color:#08284f;font-weight:700;}
  .cert-header .dept{font-size:.72rem;color:#334b67;margin-top:1px;}
  .cert-header h1{font-size:1.15rem;color:#08284f;margin:6px 0 0;font-weight:900;}
  .cert-title{text-align:center;margin:10px 0 3px;}
  .cert-title span{display:inline-block;padding:6px 24px;border:1.5px solid #c9a227;border-radius:999px;color:#a9791f;font-weight:900;font-size:1rem;letter-spacing:.5px;background:#fbf6e9;}
  .cert-term{text-align:center;color:#fff;font-weight:800;font-size:.82rem;margin:8px auto 8px;background:#155fa8;display:table;padding:3px 18px;border-radius:999px;}
  .cert-intro{text-align:center;font-size:.86rem;line-height:1.5;color:#334b67;margin-top:4px;}
  .cert-intro strong{display:block;color:#08284f;font-size:1.08rem;margin-top:2px;font-weight:900;}
  .cert-meta{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin:8px 0 12px;font-size:.82rem;}
  .cert-meta span{background:#f1e2b3;padding:3px 14px;border-radius:999px;}
  .cert-meta span strong{color:#a9791f;font-weight:800;}
  .cert-grades-columns{display:flex;gap:14px;align-items:flex-start;}
  .cert-grades-columns table.cert-table-vertical{flex:1;}
  table.cert-table-vertical{width:100%;max-width:400px;margin:0 auto 4px;border-collapse:separate;border-spacing:0 4px;}
  table.cert-table-vertical td{padding:5px 12px;font-size:.82rem;}
  table.cert-table-vertical tbody tr:nth-child(odd) td.cert-subject{background:#08284f;}
  table.cert-table-vertical tbody tr:nth-child(even) td.cert-subject{background:#104b8f;}
  td.cert-subject{color:#fff;font-weight:700;border-radius:6px 0 0 6px;text-align:right;}
  td.cert-grade{background:#fbf6e9;font-weight:800;color:#08284f;text-align:center;border-radius:0 6px 6px 0;border:1px solid #dcb94a;border-right:0;}
  td.cert-grade.cert-badge-pass{background:#2f7a4f;color:#fff;}
  td.cert-grade.cert-badge-fail{background:#a3242a;color:#fff;}
  .cert-total-bar{display:flex;justify-content:space-between;align-items:center;max-width:610px;margin:10px auto 0;background:#f1e2b3;border:1.5px solid #c9a227;border-radius:8px;padding:9px 22px;}
  .cert-total-bar .label{color:#a9791f;font-weight:800;font-size:.92rem;}
  .cert-total-bar .value{color:#08284f;font-weight:900;font-size:1.15rem;}
  .cert-footer-single{display:flex;justify-content:center;margin-top:18px;font-size:.8rem;color:#334b67;}
  .cert-footer-single .sign{text-align:center;width:170px;}
  .cert-footer-single .sign .line{margin-top:18px;border-top:1.5px solid #334b67;padding-top:4px;font-weight:700;}
  .cert-date{text-align:center;margin-top:10px;color:#64748b;font-size:.72rem;}
  .print-bar{text-align:center;margin-bottom:14px;}
  .print-bar button{background:#155fa8;color:#fff;border:0;padding:12px 30px;border-radius:999px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:'Cairo',sans-serif;box-shadow:0 6px 16px rgba(8,40,79,.25);}
  .print-bar button:hover{background:#104b8f;}
  @media (max-width:480px){
    body{padding:10px 6px;}
    .cert{padding:16px 12px 12px;}
    .cert-grades-columns{flex-direction:column;gap:4px;}
    .cert-header h1{font-size:1rem;}
    table.cert-table-vertical td{padding:6px 10px;font-size:.8rem;}
  }
  @media print{
    html,body{background:#fff;padding:0;}
    .cert{box-shadow:none;max-width:100%;margin:0;border-width:5px;page-break-inside:avoid;}
    .no-print{display:none;}
  }
</style>
</head>
<body>
  <div class="print-bar no-print"><button onclick="window.print()">&#128424; طباعة / حفظ كملف PDF</button></div>
  <div class="cert">
    <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
    <div class="cert-header">
      <img src="${logoUrl}" alt="شعار المدرسة" onerror="this.style.display='none'">
      <div class="ministry">${escapeHtml(s.ministry)}</div>
      <div class="dept">${escapeHtml(s.department)}</div>
      <h1>${escapeHtml(s.name)}</h1>
    </div>

    <div class="cert-title"><span>شهادة نتيجة الطالب</span></div>
    ${termLabel() ? `<div class="cert-term">${escapeHtml(termLabel())}</div>` : ""}

    <div class="cert-intro">
      تشهد إدارة ${escapeHtml(s.name)} بأن نتيجة الطالب/ـة
      <strong>${escapeHtml(name || "-")}</strong>
    </div>

    <div class="cert-meta">
      ${seat ? `<span><strong>رقم الجلوس:</strong> ${escapeHtml(seat)}</span>` : ""}
      ${cls ? `<span><strong>الصف:</strong> ${escapeHtml(cls)}</span>` : ""}
    </div>

    <div class="cert-grades-columns">${gradesHTML}</div>

    ${total ? `<div class="cert-total-bar"><span class="label">المجموع الكلي</span><span class="value">${escapeHtml(total)}</span></div>` : ""}

    <div class="cert-footer-single">
      <div class="sign"><div class="line">ختم المدرسة</div></div>
    </div>

    <div class="cert-date">صدرت هذه الشهادة إلكترونيًا بتاريخ ${today}</div>
  </div>
</body>
</html>`;
}
