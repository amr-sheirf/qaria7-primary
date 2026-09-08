/* تحميل وعرض الأخبار على الصفحة الرئيسية بنظام "البلوجات" */

function parseFlexibleDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// دالة آمنة لمعالجة وتحديد الترميز بدون إيقاف السكريبت
function fixEncoding(str) {
  if (typeof str !== 'string') return str || '';
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    // في حال فشل فك الترميز يتم إرجاع النص كما هو بدون إطلاق استثناء
    return str;
  }
}

function normalizeItem(rawItem) {
  const cleanObj = {};
  if (!rawItem || typeof rawItem !== 'object') return cleanObj;

  for (const key in rawItem) {
    if (Object.prototype.hasOwnProperty.call(rawItem, key)) {
      const cleanKey = fixEncoding(key).trim().replace(/^[\uFEFF\xA0]+|[\uFEFF\xA0]+$/g, '');
      const cleanVal = fixEncoding(rawItem[key]);
      cleanObj[cleanKey] = cleanVal;
    }
  }
  return cleanObj;
}

async function loadNews() {
  const stateEl = document.getElementById("newsState");
  const featureEl = document.getElementById("newsFeature");
  const gridEl = document.getElementById("newsGrid");

  if (stateEl) setState(stateEl, "loading", "جارٍ تحميل الأخبار ...");

  try {
    // جلب البيانات مع التحقق من الرابط
    if (!CONFIG || !CONFIG.SHEETS_CSV || !CONFIG.SHEETS_CSV.NEWS) {
      throw new Error("CONFIG_NOT_SET");
    }

    let rawItems = await fetchSheetCSV(CONFIG.SHEETS_CSV.NEWS);

    if (!Array.isArray(rawItems)) {
      rawItems = [];
    }

    // تنظيف المفاتيح والقيم
    let items = rawItems.map(normalizeItem);

    // تصفية العناصر التي تحتوي على عنوان فقط
    items = items.filter(i => {
      const title = readField(i, "العنوان", "Title");
      return title && String(title).trim() !== "";
    });

    // الترتيب بحسب التاريخ إن وجد
    items.sort((a, b) => {
      const da = parseFlexibleDate(readField(a, "التاريخ", "Date"));
      const db = parseFlexibleDate(readField(b, "التاريخ", "Date"));
      if (da && db) return db - da;
      return 0;
    });

    if (items.length === 0) {
      if (stateEl) setState(stateEl, "info", "لا توجد أخبار منشورة حاليًا. تابعونا قريبًا.");
      return;
    }

    if (stateEl) stateEl.innerHTML = "";

    const [first, ...rest] = items;
    if (featureEl) featureEl.innerHTML = renderFeature(first);
    if (gridEl) gridEl.innerHTML = rest.map(renderCard).join("");

  } catch (err) {
    console.error("تفاصيل الخطأ في الأخبار:", err); // يظهر الخطأ الحقيقي في Developer Tools

    if (err.message === "CONFIG_NOT_SET") {
      if (stateEl) setState(stateEl, "error", "لم يتم ربط شيت الأخبار بعد. الرجاء إضافة الرابط في ملف assets/js/config.js.");
    } else {
      if (stateEl) setState(stateEl, "error", "تعذّر تحميل الأخبار حاليًا، الرجاء المحاولة لاحقًا.");
    }
  }
}

function renderFeature(item) {
  const title = readField(item, "العنوان", "Title");
  const image = readField(item, "الصورة", "Image");
  const summary = readField(item, "الملخص", "الوصف", "Summary");
  const date = readField(item, "التاريخ", "Date");

  return `
    <article class="news-feature">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">` : ""}
      <div class="body">
        ${date ? `<div class="date">${escapeHtml(date)}</div>` : ""}
        <h3 style="font-size:1.4rem;">${escapeHtml(title)}</h3>
        <p>${escapeHtml(summary)}</p>
      </div>
    </article>
  `;
}

function renderCard(item) {
  const title = readField(item, "العنوان", "Title");
  const image = readField(item, "الصورة", "Image");
  const summary = readField(item, "الملخص", "الوصف", "Summary");
  const date = readField(item, "التاريخ", "Date");

  return `
    <article class="news-card">
      ${image ? `<img class="thumb" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">` : `<div class="thumb"></div>`}
      <div class="body">
        ${date ? `<div class="date">${escapeHtml(date)}</div>` : ""}
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(summary)}</p>
      </div>
    </article>
  `;
}
