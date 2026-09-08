/* معرض الصور */

let GALLERY_CACHE = [];

async function initGalleryPage() {
  const stateEl = document.getElementById("galleryState");
  setState(stateEl, "loading", "جارٍ تحميل الصور ...");

  try {
    GALLERY_CACHE = await fetchSheetCSV(CONFIG.SHEETS_CSV.GALLERY);
    GALLERY_CACHE = GALLERY_CACHE.filter(i => readField(i, "الصورة", "Image"));

    if (GALLERY_CACHE.length === 0) {
      setState(stateEl, "info", "لا توجد صور مضافة حتى الآن.");
      return;
    }

    stateEl.innerHTML = "";
    buildFilters();
    renderGallery("الكل");
    initLightbox();

  } catch (err) {
    if (err.message === "CONFIG_NOT_SET") {
      setState(stateEl, "error", "لم يتم ربط شيت معرض الصور بعد. الرجاء إضافة الرابط في ملف assets/js/config.js.");
    } else {
      setState(stateEl, "error", "تعذّر تحميل الصور حاليًا.");
    }
  }
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
