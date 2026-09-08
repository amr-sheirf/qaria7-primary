/* تحميل وعرض الأخبار على الصفحة الرئيسية بنظام "البلوجات" */

function parseFlexibleDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function loadNews() {
  const stateEl = document.getElementById("newsState");
  const featureEl = document.getElementById("newsFeature");
  const gridEl = document.getElementById("newsGrid");

  setState(stateEl, "loading", "جارٍ تحميل الأخبار ...");

  try {
    let items = await fetchSheetCSV(CONFIG.SHEETS_CSV.NEWS);

    // استبعاد الصفوف الفارغة، وترتيب الأحدث أولًا إن وُجد عمود تاريخ
    items = items.filter(i => i.العنوان || i.Title);
    items.sort((a, b) => {
      const da = parseFlexibleDate(a.التاريخ || a.Date);
      const db = parseFlexibleDate(b.التاريخ || b.Date);
      if (da && db) return db - da;
      return 0;
    });

    if (items.length === 0) {
      setState(stateEl, "info", "لا توجد أخبار منشورة حاليًا. تابعونا قريبًا.");
      return;
    }

    stateEl.innerHTML = "";

    const [first, ...rest] = items;
    featureEl.innerHTML = renderFeature(first);
    gridEl.innerHTML = rest.map(renderCard).join("");

  } catch (err) {
    if (err.message === "CONFIG_NOT_SET") {
      setState(stateEl, "error", "لم يتم ربط شيت الأخبار بعد. الرجاء إضافة الرابط في ملف assets/js/config.js (راجع README).");
    } else {
      setState(stateEl, "error", "تعذّر تحميل الأخبار حاليًا، الرجاء المحاولة لاحقًا.");
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
