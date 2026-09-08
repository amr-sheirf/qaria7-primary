/* معرض الصور - تبسيط لصفحة طباعة PDF: حقل إدخال للكود وزر بحث */

let GALLERY_CACHE = [];

async function initGalleryPage() {
  // هذه الصفحة مخصصة لطباعة PDF — لا نحتاج لتحميل صور أو رسائل حالة.
  const stateEl = document.getElementById("galleryState");
  if (stateEl) stateEl.innerHTML = "";

  const filtersEl = document.getElementById("galleryFilters");
  if (!filtersEl) return;

  // واجهة بسيطة: حقل نصي أنيق وزر بحث
  filtersEl.innerHTML = `
    <div class="gallery-search-row">
      <input id="galleryCodeInput" class="gallery-input" type="text" placeholder="أدخل الكود هنا" aria-label="كود">
      <button id="gallerySearchBtn" class="gallery-btn">بحث</button>
    </div>
  `;

  const gridEl = document.getElementById("galleryGrid");
  if (gridEl) gridEl.innerHTML = ""; // نترك المساحة فارغة لعرض النتيجة

  const input = document.getElementById("galleryCodeInput");
  const btn = document.getElementById("gallerySearchBtn");

  // عند البحث نظهر الكود بشكل جمالي داخل المساحة المخصصة
  btn.addEventListener("click", () => {
    const code = input.value.trim();
    renderCodeResult(code);
  });

  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const code = input.value.trim();
      renderCodeResult(code);
    }
  });
}

function renderCodeResult(code) {
  const gridEl = document.getElementById("galleryGrid");
  if (!gridEl) return;
  if (!code) {
    gridEl.innerHTML = `<div class="gallery-note">الرجاء إدخال الكود ثم الضغط على \"بحث\".</div>`;
    return;
  }
  gridEl.innerHTML = `
    <div class="gallery-code-display">
      <label>الكود:</label>
      <div class="code-box">${escapeHtml(code)}</div>
    </div>
  `;
}

function buildFilters() {
  const filtersEl = document.getElementById("galleryFilters");
  const categories = [...new Set(GALLERY_CACHE
    .map(i => readField(i, "التصنيف", "القسم", "Category"))
    .filter(Boolean))];

  const all = ["الكل", ...categories];
  filtersEl.innerHTML = all.map((c, idx) =>
    `<button class="chip ${idx === 0 ? "active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
  ).join("");

  filtersEl.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      filtersEl.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderGallery(chip.dataset.cat);
    });
  });
}

function renderGallery(category) {
  const gridEl = document.getElementById("galleryGrid");
  const items = category === "الكل"
    ? GALLERY_CACHE
    : GALLERY_CACHE.filter(i => readField(i, "التصنيف", "القسم", "Category") === category);

  gridEl.innerHTML = items.map(item => {
    const img = readField(item, "الصورة", "Image");
    const caption = readField(item, "الوصف", "التعليق", "Caption");
    return `
      <div class="gallery-item" data-img="${escapeHtml(img)}" data-cap="${escapeHtml(caption)}">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(caption || "صورة من المدرسة")}" loading="lazy">
        ${caption ? `<div class="cap">${escapeHtml(caption)}</div>` : ""}
      </div>
    `;
  }).join("");

  gridEl.querySelectorAll(".gallery-item").forEach(el => {
    el.addEventListener("click", () => openLightbox(el.dataset.img, el.dataset.cap));
  });
}

function initLightbox() {
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightbox").addEventListener("click", e => {
    if (e.target.id === "lightbox") closeLightbox();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });
}

function openLightbox(src, alt) {
  const lb = document.getElementById("lightbox");
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightboxImg").alt = alt || "";
  lb.classList.add("open");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
  document.getElementById("lightboxImg").src = "";
}
