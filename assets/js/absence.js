/* صفحة غياب الطلاب */

let ABSENCE_CACHE = null;

const GRADE_KEYS = ["الصف", "الصف الدراسي", "Grade", "Class"];
const ABS_NAME_KEYS = ["اسم الطالب", "الاسم", "Name", "StudentName"];
const ABS_DATE_KEYS = ["تاريخ الغياب", "التاريخ", "Date"];
const ABS_NOTE_KEYS = ["ملاحظات", "السبب", "Notes"];

async function initAbsencePage() {
  const stateEl = document.getElementById("absenceState");
  const gradeSelect = document.getElementById("gradeSelect");

  setState(stateEl, "loading", "جارٍ تحميل بيانات الصفوف ...");

  try {
    ABSENCE_CACHE = await fetchSheetCSV(CONFIG.SHEETS_CSV.ABSENCE);

    const grades = [...new Set(ABSENCE_CACHE
      .map(r => readField(r, ...GRADE_KEYS))
      .filter(Boolean))];

    gradeSelect.innerHTML =
      `<option value="">كل الصفوف</option>` +
      grades.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");

    stateEl.innerHTML = "";
  } catch (err) {
    gradeSelect.innerHTML = `<option value="">تعذّر التحميل</option>`;
    if (err.message === "CONFIG_NOT_SET") {
      setState(stateEl, "error", "لم يتم ربط شيت الغياب بعد. الرجاء إضافة الرابط في ملف assets/js/config.js.");
    } else {
      setState(stateEl, "error", "تعذّر تحميل بيانات الغياب حاليًا.");
    }
  }

  document.getElementById("absenceBtn").addEventListener("click", runAbsenceSearch);
  document.getElementById("studentName").addEventListener("keydown", e => {
    if (e.key === "Enter") runAbsenceSearch();
  });
}

function runAbsenceSearch() {
  const stateEl = document.getElementById("absenceState");
  const outputEl = document.getElementById("absenceOutput");
  const grade = document.getElementById("gradeSelect").value;
  const name = document.getElementById("studentName").value.trim();

  outputEl.innerHTML = "";

  if (!ABSENCE_CACHE) {
    setState(stateEl, "error", "بيانات الغياب غير متاحة حاليًا.");
    return;
  }

  if (!grade && !name) {
    setState(stateEl, "error", "الرجاء اختيار الصف الدراسي أو كتابة اسم الطالب على الأقل.");
    return;
  }

  const matches = ABSENCE_CACHE.filter(row => {
    const rowGrade = readField(row, ...GRADE_KEYS);
    const rowName = readField(row, ...ABS_NAME_KEYS);
    const gradeOk = !grade || rowGrade === grade;
    const nameOk = !name || rowName.includes(name);
    return gradeOk && nameOk;
  });

  if (matches.length === 0) {
    setState(stateEl, "info", "لا توجد سجلات غياب مطابقة لما تم إدخاله.");
    return;
  }

  stateEl.innerHTML = "";
  outputEl.innerHTML = `
    <div class="alert-box" style="margin-bottom:16px;">
      عدد أيام الغياب المسجّلة: <strong>${matches.length}</strong>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>اسم الطالب</th><th>الصف</th><th>تاريخ الغياب</th><th>ملاحظات</th></tr>
        </thead>
        <tbody>
          ${matches.map(row => `
            <tr>
              <td>${escapeHtml(readField(row, ...ABS_NAME_KEYS))}</td>
              <td>${escapeHtml(readField(row, ...GRADE_KEYS))}</td>
              <td>${escapeHtml(readField(row, ...ABS_DATE_KEYS))}</td>
              <td>${escapeHtml(readField(row, ...ABS_NOTE_KEYS)) || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}
