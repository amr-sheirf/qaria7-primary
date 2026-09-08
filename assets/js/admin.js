/* لوحة تحكم المدرسة */

let ADMIN_PASSWORD_CACHE = "";

function initAdminPage() {
  document.getElementById("openSheetBtn").href = CONFIG.SPREADSHEET_EDIT_URL;

  document.getElementById("adminLoginBtn").addEventListener("click", tryAdminLogin);
  document.getElementById("adminPass").addEventListener("keydown", e => {
    if (e.key === "Enter") tryAdminLogin();
  });
  document.getElementById("adminLogoutBtn").addEventListener("click", () => {
    ADMIN_PASSWORD_CACHE = "";
    sessionStorage.removeItem("qaria7_admin_ok");
    document.getElementById("adminPanel").classList.remove("open");
    document.getElementById("adminLock").style.display = "block";
  });

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("newsSubmitBtn").addEventListener("click", submitNews);
  document.getElementById("gallerySubmitBtn").addEventListener("click", submitGalleryImage);
  document.getElementById("statsSubmitBtn").addEventListener("click", submitStats);
  document.getElementById("refreshRequestsBtn").addEventListener("click", loadRequests);

  // تسهيل الدخول المتكرر أثناء نفس الجلسة فقط (لا يُخزَّن بشكل دائم)
  const remembered = sessionStorage.getItem("qaria7_admin_ok");
  if (remembered) {
    ADMIN_PASSWORD_CACHE = remembered;
    unlockAdmin();
  }
}

function tryAdminLogin() {
  const stateEl = document.getElementById("adminLoginState");
  const value = document.getElementById("adminPass").value;

  if (!CONFIG.ADMIN_PASSWORD || CONFIG.ADMIN_PASSWORD === "CHANGE_THIS_PASSWORD") {
    setState(stateEl, "error", "لم يتم ضبط كلمة مرور الإدارة بعد في ملف assets/js/config.js");
    return;
  }

  if (value === CONFIG.ADMIN_PASSWORD) {
    ADMIN_PASSWORD_CACHE = value;
    sessionStorage.setItem("qaria7_admin_ok", value);
    unlockAdmin();
  } else {
    setState(stateEl, "error", "كلمة المرور غير صحيحة");
  }
}

function unlockAdmin() {
  document.getElementById("adminLock").style.display = "none";
  document.getElementById("adminPanel").classList.add("open");
  loadRequests();
  loadStatsForAdmin();
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + tab));
}

/* ---------------- إضافة خبر ---------------- */
async function submitNews() {
  const stateEl = document.getElementById("newsAdminState");
  const title = document.getElementById("newsTitle").value.trim();
  const image = document.getElementById("newsImage").value.trim();
  const summary = document.getElementById("newsSummary").value.trim();

  if (!title || !summary) {
    setState(stateEl, "error", "الرجاء إدخال عنوان الخبر ونصّه على الأقل.");
    return;
  }

  setState(stateEl, "loading", "جارٍ نشر الخبر ...");
  try {
    const res = await postToAppsScript({
      action: "addNews",
      password: ADMIN_PASSWORD_CACHE,
      title, image, summary,
      date: new Date().toLocaleDateString("ar-EG")
    });
    if (res.ok) {
      setState(stateEl, "info", "تم نشر الخبر بنجاح. سيظهر في الصفحة الرئيسية خلال لحظات.");
      document.getElementById("newsTitle").value = "";
      document.getElementById("newsImage").value = "";
      document.getElementById("newsSummary").value = "";
    } else {
      setState(stateEl, "error", res.message || "تعذّر نشر الخبر.");
    }
  } catch (err) {
    setState(stateEl, "error", appsScriptErrorMessage(err));
  }
}

/* ---------------- إضافة صورة للمعرض ---------------- */
async function submitGalleryImage() {
  const stateEl = document.getElementById("galleryAdminState");
  const image = document.getElementById("galImage").value.trim();
  const caption = document.getElementById("galCaption").value.trim();
  const category = document.getElementById("galCategory").value.trim();

  if (!image) {
    setState(stateEl, "error", "الرجاء إدخال رابط الصورة.");
    return;
  }

  setState(stateEl, "loading", "جارٍ إضافة الصورة ...");
  try {
    const res = await postToAppsScript({
      action: "addGalleryImage",
      password: ADMIN_PASSWORD_CACHE,
      image, caption, category
    });
    if (res.ok) {
      setState(stateEl, "info", "تمت إضافة الصورة بنجاح.");
      document.getElementById("galImage").value = "";
      document.getElementById("galCaption").value = "";
      document.getElementById("galCategory").value = "";
    } else {
      setState(stateEl, "error", res.message || "تعذّرت إضافة الصورة.");
    }
  } catch (err) {
    setState(stateEl, "error", appsScriptErrorMessage(err));
  }
}

async function loadStatsForAdmin() {
  const stateEl = document.getElementById("statsAdminState");
  try {
    const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=stats`, { cache: "no-store" });
    const data = await res.json();
    if (!data.ok) return;
    document.getElementById("statStudents").value = data.stats.students ?? "";
    document.getElementById("statTeachers").value = data.stats.teachers ?? "";
    document.getElementById("statClasses").value = data.stats.classes ?? "";
  } catch (err) {
    if (stateEl) setState(stateEl, "error", "تعذّر تحميل الإحصائيات الحالية.");
  }
}

async function submitStats() {
  const stateEl = document.getElementById("statsAdminState");
  const students = document.getElementById("statStudents").value.trim();
  const teachers = document.getElementById("statTeachers").value.trim();
  const classes = document.getElementById("statClasses").value.trim();
  if (students === "" || teachers === "" || classes === "") {
    setState(stateEl, "error", "الرجاء إدخال الأرقام الثلاثة.");
    return;
  }
  if ([students, teachers, classes].some(v => !/^\d+$/.test(v))) {
    setState(stateEl, "error", "يجب أن تكون الإحصائيات أرقامًا صحيحة غير سالبة.");
    return;
  }
  setState(stateEl, "loading", "جارٍ حفظ الإحصائيات ...");
  try {
    const res = await postToAppsScript({
      action: "updateStats",
      password: ADMIN_PASSWORD_CACHE,
      students: Number(students),
      teachers: Number(teachers),
      classes: Number(classes)
    });
    if (res.ok) setState(stateEl, "info", "تم حفظ الإحصائيات بنجاح.");
    else setState(stateEl, "error", res.message || "تعذّر حفظ الإحصائيات.");
  } catch (err) {
    setState(stateEl, "error", appsScriptErrorMessage(err));
  }
}

/* ---------------- طلبات أولياء الأمور ---------------- */
async function loadRequests() {
  const stateEl = document.getElementById("requestsAdminState");
  const table = document.getElementById("requestsTable");
  const tbody = document.getElementById("requestsTbody");

  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.startsWith("PASTE_")) {
    setState(stateEl, "error", "لم يتم ربط تطبيق Apps Script بعد في ملف assets/js/config.js");
    table.style.display = "none";
    return;
  }

  setState(stateEl, "loading", "جارٍ تحميل الطلبات ...");
  try {
    const url = `${CONFIG.APPS_SCRIPT_URL}?action=list&sheet=REQUESTS&password=${encodeURIComponent(ADMIN_PASSWORD_CACHE)}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!data.ok) {
      setState(stateEl, "error", data.message || "تعذّر تحميل الطلبات.");
      table.style.display = "none";
      return;
    }

    if (data.rows.length === 0) {
      setState(stateEl, "info", "لا توجد طلبات واردة حتى الآن.");
      table.style.display = "none";
      return;
    }

    stateEl.innerHTML = "";
    table.style.display = "table";
    tbody.innerHTML = data.rows.map(renderRequestRow).join("");

    tbody.querySelectorAll("[data-action='resolve']").forEach(btn => {
      btn.addEventListener("click", () => updateRequestStatus(btn.dataset.row, "تم الرد"));
    });
    tbody.querySelectorAll("[data-action='delete']").forEach(btn => {
      btn.addEventListener("click", () => deleteRequestRow(btn.dataset.row));
    });

  } catch (err) {
    setState(stateEl, "error", "تعذّر الاتصال بالخادم.");
    table.style.display = "none";
  }
}

function renderRequestRow(row) {
  const status = row["الحالة"] || "جديد";
  const badgeClass = status === "جديد" ? "badge-pending" : "badge-new";
  return `
    <tr>
      <td>${escapeHtml(row["التاريخ"])}</td>
      <td>${escapeHtml(row["اسم مقدم الطلب"])}</td>
      <td>${escapeHtml(row["رقم التليفون"])}</td>
      <td>${escapeHtml(row["العنوان"])}</td>
      <td>${escapeHtml(row["نوع الطلب"])}</td>
      <td style="max-width:260px;text-align:right;white-space:pre-wrap;">${escapeHtml(row["نص الطلب"])}</td>
      <td><span class="badge ${badgeClass}">${escapeHtml(status)}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn btn-outline" style="padding:6px 12px;font-size:.8rem;" data-action="resolve" data-row="${row._row}">تم الرد</button>
        <button class="btn btn-outline" style="padding:6px 12px;font-size:.8rem;border-color:var(--danger);color:var(--danger);" data-action="delete" data-row="${row._row}">حذف</button>
      </td>
    </tr>
  `;
}

async function updateRequestStatus(rowNumber, status) {
  try {
    await postToAppsScript({ action: "updateStatus", password: ADMIN_PASSWORD_CACHE, sheet: "REQUESTS", rowNumber, status });
    loadRequests();
  } catch (err) {
    alert("تعذّر تحديث حالة الطلب.");
  }
}

async function deleteRequestRow(rowNumber) {
  if (!confirm("هل تريد حذف هذا الطلب نهائيًا؟")) return;
  try {
    await postToAppsScript({ action: "deleteRow", password: ADMIN_PASSWORD_CACHE, sheet: "REQUESTS", rowNumber });
    loadRequests();
  } catch (err) {
    alert("تعذّر حذف الطلب.");
  }
}

function appsScriptErrorMessage(err) {
  if (err.message === "CONFIG_NOT_SET") {
    return "لم يتم ربط تطبيق Apps Script بعد في ملف assets/js/config.js";
  }
  return "حدث خطأ أثناء الاتصال بالخادم، حاول مرة أخرى.";
}
