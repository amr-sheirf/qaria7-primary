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

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>شهادة نتيجة - ${escapeHtml(name || "")}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;}
  @page{size:A4;margin:10mm;}
  body{font-family:'Cairo',sans-serif;margin:0;padding:18px 10px;background:#eef1f5;direction:rtl;}
  .cert{position:relative;max-width:210mm;margin:0 auto;background:#fffdf7;border:6px double #a9791f;border-radius:8px;padding:22px 26px 18px;box-shadow:0 12px 45px rgba(8,40,79,.18);}
  .cert::before{content:"";position:absolute;inset:8px;border:1.2px solid #c9a227;border-radius:5px;pointer-events:none;}
  .corner{position:absolute;width:22px;height:22px;border:2.5px solid #c9a227;}
  .corner.tl{top:12px;right:12px;border-left:0;border-bottom:0;}
  .corner.tr{top:12px;left:12px;border-right:0;border-bottom:0;}
  .corner.bl{bottom:12px;right:12px;border-left:0;border-top:0;}
  .corner.br{bottom:12px;left:12px;border-right:0;border-top:0;}
  .cert-header{text-align:center;position:relative;}
  .cert-header img{width:52px;height:52px;margin-bottom:4px;}
  .cert-header .ministry{font-size:.82rem;color:#08284f;font-weight:700;}
  .cert-header .dept{font-size:.76rem;color:#334b67;margin-top:1px;}
  .cert-header h1{font-size:1.22rem;color:#08284f;margin:8px 0 0;font-weight:900;}
  .cert-title{text-align:center;margin:14px 0 4px;}
  .cert-title span{display:inline-block;padding:7px 26px;border:1.5px solid #c9a227;border-radius:999px;color:#a9791f;font-weight:900;font-size:1.05rem;letter-spacing:.5px;background:#fbf6e9;}
  .cert-term{text-align:center;color:#a9791f;font-weight:800;font-size:.9rem;margin-top:6px;margin-bottom:10px;}
  .cert-intro{text-align:center;font-size:.92rem;line-height:1.6;color:#334b67;margin-top:8px;}
  .cert-intro strong{display:block;color:#08284f;font-size:1.15rem;margin-top:2px;font-weight:900;}
  .cert-meta{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;margin:10px 0 16px;font-size:.88rem;}
  .cert-meta span strong{color:#a9791f;font-weight:800;}
  table.cert-table-vertical{width:100%;max-width:400px;margin:0 auto 16px;border-collapse:separate;border-spacing:0 5px;}
  table.cert-table-vertical td{padding:7px 14px;font-size:.9rem;}
  table.cert-table-vertical tbody tr td:first-child{background:#08284f;color:#fff;font-weight:700;border-radius:6px 0 0 6px;text-align:right;}
  table.cert-table-vertical tbody tr td:last-child{background:#fbf6e9;font-weight:800;color:#08284f;text-align:center;border-radius:0 6px 6px 0;border:1px solid #dcb94a;border-right:0;}
  table.cert-table-vertical tfoot td{background:#f1e2b3;font-weight:900;color:#a9791f;font-size:.96rem;}
  table.cert-table-vertical tfoot td:first-child{border-radius:6px 0 0 6px;text-align:right;}
  table.cert-table-vertical tfoot td:last-child{border-radius:0 6px 6px 0;text-align:center;border:1px solid #c9a227;border-right:0;}
  .cert-footer-single{display:flex;justify-content:center;margin-top:22px;font-size:.85rem;color:#334b67;}
  .cert-footer-single .sign{text-align:center;width:180px;}
  .cert-footer-single .sign .line{margin-top:22px;border-top:1.5px solid #334b67;padding-top:5px;font-weight:700;}
  .cert-date{text-align:center;margin-top:12px;color:#64748b;font-size:.76rem;}
  .print-bar{text-align:center;margin-bottom:16px;}
  .print-bar button{background:#155fa8;color:#fff;border:0;padding:12px 30px;border-radius:999px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:'Cairo',sans-serif;box-shadow:0 6px 16px rgba(8,40,79,.25);}
  .print-bar button:hover{background:#104b8f;}
  @media (max-width:480px){
    body{padding:12px 6px;}
    .cert{padding:18px 14px 14px;}
    .cert-header h1{font-size:1.05rem;}
    .cert-title span{font-size:.92rem;padding:6px 18px;}
    .cert-intro strong{font-size:1rem;}
    .cert-meta{gap:12px;font-size:.82rem;}
    table.cert-table-vertical td{padding:6px 10px;font-size:.82rem;}
  }
  @media print{
    body{background:#fff;padding:0;}
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

    <table class="cert-table-vertical">
      <tbody>
        ${subjectEntries.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("")}
      </tbody>
      ${total ? `<tfoot><tr><td>المجموع الكلي</td><td>${escapeHtml(total)}</td></tr></tfoot>` : ""}
    </table>

    <div class="cert-footer-single">
      <div class="sign"><div class="line">ختم المدرسة</div></div>
    </div>

    <div class="cert-date">صدرت هذه الشهادة إلكترونيًا بتاريخ ${today}</div>
  </div>
</body>
</html>`;
}
