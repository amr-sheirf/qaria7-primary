/* صفحة طباعة PDF - واجهة مبسطة لحقل كود وزر بحث (تمت إزالة كود المعرض القديم) */

async function initGalleryPage() {
  // صفحة مخصصة للطباعة: لا نحمل صوراً أو نظهر رسائل حالة.
  const stateEl = document.getElementById("galleryState");
  if (stateEl) stateEl.innerHTML = "";

  const filtersEl = document.getElementById("galleryFilters");
  if (!filtersEl) return;

  // واجهة بسيطة: حقل نصي وزر بحث
  filtersEl.innerHTML = `
    <div class="gallery-search-row">
      <input id="galleryCodeInput" class="gallery-input" type="text" placeholder="أدخل الكود هنا" aria-label="كود">
      <button id="gallerySearchBtn" class="gallery-btn">بحث</button>
    </div>
  `;

  const gridEl = document.getElementById("galleryGrid");
  if (gridEl) gridEl.innerHTML = ""; // مساحة لعرض نتيجة الكود

  const input = document.getElementById("galleryCodeInput");
  const btn = document.getElementById("gallerySearchBtn");

  btn.addEventListener("click", () => {
    renderCodeResult(input.value.trim());
  });

  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") renderCodeResult(input.value.trim());
  });
}

function renderCodeResult(code) {
  const gridEl = document.getElementById("galleryGrid");
  if (!gridEl) return;

  if (!code) {
    gridEl.innerHTML = `<div class="gallery-note">الرجاء إدخال الكود ثم الضغط على &quot;بحث&quot;.</div>`;
    return;
  }

  // escapeHtml متوفر في المشروع؛ نستخدمه لحماية النص المعروض
  const safe = typeof escapeHtml === 'function' ? escapeHtml(code) : code;
  gridEl.innerHTML = `
    <div class="gallery-code-display">
      <label>الكود:</label>
      <div class="code-box">${safe}</div>
    </div>
  `;
}
