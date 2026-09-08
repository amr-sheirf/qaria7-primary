/* صفحة نتائج الطلاب */

let RESULTS_CACHE = null;

function initResultsPage() {
  const typeSel = document.getElementById("searchType");
  const label = document.getElementById("searchLabel");
  const input = document.getElementById("searchValue");
  const btn = document.getElementById("searchBtn");

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

    stateEl.innerHTML = "";
    outputEl.innerHTML = matches.map(renderResultCard).join("");

  } catch (err) {
    if (err.message === "CONFIG_NOT_SET") {
      setState(stateEl, "error", "لم يتم ربط شيت النتائج بعد. الرجاء إضافة الرابط في ملف assets/js/config.js.");
    } else {
      setState(stateEl, "error", "تعذّر تحميل النتائج حاليًا، الرجاء المحاولة لاحقًا.");
    }
  }
}

function renderResultCard(row) {
  const identityKeys = ["رقم الجلوس", "SeatNumber", "Seat", "اسم الطالب", "الاسم", "Name", "StudentName", "الصف", "Grade", "Class"];
  const seat = readField(row, "رقم الجلوس", "SeatNumber", "Seat");
  const name = readField(row, "اسم الطالب", "الاسم", "Name", "StudentName");
  const cls = readField(row, "الصف", "Grade", "Class");
  const totalKeys = ["المجموع", "Total"];

  const subjectEntries = Object.entries(row).filter(([k, v]) => !identityKeys.includes(k) && !totalKeys.includes(k) && v !== "");
  const total = readField(row, ...totalKeys);

  return `
    <div class="result-box" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <div><strong>الاسم:</strong> ${escapeHtml(name || "-")}</div>
        ${seat ? `<div><strong>رقم الجلوس:</strong> ${escapeHtml(seat)}</div>` : ""}
        ${cls ? `<div><strong>الصف:</strong> ${escapeHtml(cls)}</div>` : ""}
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>${subjectEntries.map(([k]) => `<th>${escapeHtml(k)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            <tr>${subjectEntries.map(([, v]) => `<td>${escapeHtml(v)}</td>`).join("")}</tr>
          </tbody>
          ${total ? `<tfoot><tr><td colspan="${subjectEntries.length}">المجموع الكلي: ${escapeHtml(total)}</td></tr></tfoot>` : ""}
        </table>
      </div>
    </div>
  `;
}
