/* =========================================================
   وظائف مشتركة بين كل صفحات الموقع
   ========================================================= */

const NAV_LINKS = [
  { id: "index",    label: "الرئيسية والأخبار", href: "index.html" },
  { id: "results",  label: "نتائج الطلاب",      href: "results.html" },
  { id: "absence",  label: "غياب الطلاب",        href: "absence.html" },
  { id: "requests", label: "الشكاوى والمقترحات", href: "requests.html" },
//  { id: "gallery",  label: "معرض الصور",         href: "gallery.html" },
  { id: "admin",    label: "إدارة الصفحة",       href: "admin.html" }
];

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderHeader(activeId) {
  const s = CONFIG.SCHOOL;
  const headerMount = document.getElementById("site-header");
  if (!headerMount) return;

  headerMount.innerHTML = `
    <div class="gov-strip">
      <div class="container">
        <span><strong>${escapeHtml(s.ministry)}</strong></span>
        <span>${escapeHtml(s.department)}</span>
      </div>
    </div>

    <header class="site-header">
      <div class="container header-inner">
        <img class="header-logo" src="assets/img/logo.png" alt="شعار ${escapeHtml(s.name)}">
        <div class="header-titles">
          <h1>${escapeHtml(s.name)}</h1>
          <p class="school-sub">${escapeHtml(s.welcome)}</p>
        </div>
      </div>
    </header>

    <nav class="navbar">
      <div class="container">
        <button class="nav-toggle" id="navToggle" aria-label="فتح القائمة" aria-expanded="false">&#9776;</button>
        <ul class="nav-links" id="navLinks">
          ${NAV_LINKS.map(l => `<li><a href="${l.href}" class="${l.id === activeId ? "active" : ""}">${l.label}</a></li>`).join("")}
        </ul>
      </div>
    </nav>
  `;

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function renderFooter() {
  const s = CONFIG.SCHOOL;
  const footerMount = document.getElementById("site-footer");
  if (!footerMount) return;

  const waLink = s.whatsapp ? `https://wa.me/${s.whatsapp}` : "#";

  footerMount.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
         <div>
            <h4>عن المدرسة</h4>
            <p style="margin-top: 8px; font-size: 0.95em; line-height: 1.6;">
              ${escapeHtml(s.name)} إحدى مدارس ${escapeHtml(s.department)} التابعة لـ${escapeHtml(s.ministry)}.<br><br>
              <strong>مديرة المدرسة:</strong><br>
              منال مرسى ابراهيم<br><br>
              <strong>وكيلة المدرسة:</strong><br>
              هدى ابوزيد هجرس
            </p>
          </div>
          <div>
            <h4>تواصل معنا</h4>
            <ul>
              <li>&#128205; ${escapeHtml(s.address)}</li>
              <li>&#9742; ${escapeHtml(s.phone)}</li>
              <li><a href="${waLink}" target="_blank" rel="noopener">&#128241; واتساب المدرسة</a></li>
              <li>&#9993; ${escapeHtml(s.email)}</li>
            </ul>
          </div>
          <div>
            <h4>روابط سريعة</h4>
            <ul>
              ${NAV_LINKS.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
            </ul>
            <div class="footer-social">
              <a href="${escapeHtml(s.facebook)}" target="_blank" rel="noopener" aria-label="فيسبوك">f</a>
              <a href="${waLink}" target="_blank" rel="noopener" aria-label="واتساب">W</a>
            </div>
          </div>
        </div>
       <div class="footer-bottom">
          <div style="margin-bottom: 10px;">
            © <span id="yearNow"></span> ${escapeHtml(s.name)} — جميع الحقوق محفوظة
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 0.9em; color: #ccc;">
            <span>تصميم مستر عمرو شريف</span>
            <span>|</span>
            <span dir="ltr">📞 01008560950</span>
            <img src="assets/img/amr-logo.png" style="height: 45px; width: auto; border-radius: 4px;">
          </div>
        </div>
    </footer>
  `;
  document.getElementById("yearNow").textContent = new Date().getFullYear();
}

/**
 * يجلب ملف CSV منشور من جوجل شيت ويحوّله لمصفوفة كائنات
 * باستخدام أسماء الأعمدة (الصف الأول) كمفاتيح.
 * يرجع Promise<Array<Object>>
 */
async function fetchSheetCSV(url) {
  if (!url || url.startsWith("PASTE_")) {
    throw new Error("CONFIG_NOT_SET");
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP_" + res.status);
  const text = await res.text();
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  return parsed.data.map(row => {
    const clean = {};
    Object.keys(row).forEach(k => { clean[k.trim()] = (row[k] ?? "").toString().trim(); });
    return clean;
  });
}

/** إرسال بيانات إلى تطبيق Google Apps Script (Code.gs) */
async function postToAppsScript(payload) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.startsWith("PASTE_")) {
    throw new Error("CONFIG_NOT_SET");
  }
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // يتفادى preflight CORS مع Apps Script
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({ ok: false, message: "تعذّرت قراءة الرد" }));
  return data;
}

function setState(el, type, message) {
  el.innerHTML = `<div class="state-msg ${type}">${message}</div>`;
}

/** يقرأ أول عمود موجود من بين عدة أسماء محتملة لنفس الحقل
 *  (لمرونة أكبر إن اختلفت تسمية الأعمدة في الشيت) */
function readField(item, ...keys) {
  for (const k of keys) if (item[k]) return item[k];
  return "";
}

async function loadStats() {
  const mount = document.getElementById("schoolStats");
  if (!mount) return;
  try {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.startsWith("PASTE_")) return;
    const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=stats`, { cache: "no-store" });
    const data = await res.json();
    if (!data.ok || !data.stats) return;
    const items = [
      ["👨‍🎓", data.stats.students, "عدد الطلاب"],
      ["👨‍🏫", data.stats.teachers, "عدد المعلمين"],
      ["🏫", data.stats.classes, "عدد الفصول"]
    ];
    mount.innerHTML = items.map(([icon, number, label]) => `
      <div class="stat-card">
        <div class="stat-icon">${icon}</div>
        <div class="stat-number">${escapeHtml(number)}</div>
        <div class="stat-label">${label}</div>
      </div>`).join("");
  } catch (err) {
    // تبقى القيم الافتراضية ظاهرة عند تعذر الاتصال.
  }
}
