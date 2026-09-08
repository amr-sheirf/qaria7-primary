/*  =========================================================
    Code.gs — تطبيق الويب الخاص بمدرسة قرية 7 الابتدائية
    -----------------------------------------------------------
    هذا الكود يُنسخ داخل محرر Apps Script المرتبط بملف جوجل
    شيت الخاص بالمدرسة (Extensions > Apps Script)، ثم يُنشر
    كـ "Web App" (تطبيق ويب). راجع README.md للخطوات كاملة.

    أسماء التبويبات (الشيتات) المتوقعة داخل ملف جوجل شيت:
      - News      (الأخبار)
      - Results   (نتائج الطلاب)
      - Absence   (غياب الطلاب)
      - Gallery   (معرض الصور)
      - Requests  (طلبات وشكاوى أولياء الأمور)
    ========================================================= */

// ⚠️ يجب أن تطابق هذه القيمة تمامًا القيمة الموجودة في
// assets/js/config.js داخل الموقع (ADMIN_PASSWORD)
const ADMIN_PASSWORD = "admin0100";

const SHEET_NAMES = {
  NEWS: "News",
  RESULTS: "Results",
  ABSENCE: "Absence",
  GALLERY: "Gallery",
  REQUESTS: "Requests",
  SETTINGS: "Settings"
};

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkPassword_(pwd) {
  return pwd === ADMIN_PASSWORD;
}

/* -------------------- طلبات القراءة (GET) --------------------
   تُستخدم فقط من لوحة التحكم لعرض قوائم قابلة للحذف/التعديل
   (مثل قائمة طلبات أولياء الأمور)، وتتطلب كلمة المرور. */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const password = e.parameter.password;
    const sheetKey = (e.parameter.sheet || "").toUpperCase();

    if (action === "stats") {
      return jsonOut_({ ok: true, stats: getStats_() });
    }

    if (action !== "list") {
      return jsonOut_({ ok: false, message: "إجراء غير معروف" });
    }
    if (!checkPassword_(password)) {
      return jsonOut_({ ok: false, message: "كلمة مرور غير صحيحة" });
    }
    const sheetName = SHEET_NAMES[sheetKey];
    if (!sheetName) {
      return jsonOut_({ ok: false, message: "شيت غير معروف" });
    }

    const sheet = getSheet_(sheetName);
    const values = sheet.getDataRange().getValues();
    if (values.length === 0) return jsonOut_({ ok: true, rows: [] });

    const headers = values[0];
    const rows = values.slice(1).map((row, idx) => {
      const obj = { _row: idx + 2 }; // رقم الصف الحقيقي داخل الشيت (بعد رأس الجدول)
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    }).reverse(); // الأحدث أولًا

    return jsonOut_({ ok: true, rows });

  } catch (err) {
    return jsonOut_({ ok: false, message: "خطأ في الخادم: " + err.message });
  }
}

/* -------------------- طلبات الكتابة (POST) -------------------- */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    switch (action) {
      case "addRequest":     return handleAddRequest_(payload);
      case "addNews":        return handleAdminWrite_(payload, addNews_);
      case "addGalleryImage":return handleAdminWrite_(payload, addGalleryImage_);
      case "updateStats":    return handleAdminWrite_(payload, updateStats_);
      case "deleteRow":      return handleAdminWrite_(payload, deleteRow_);
      case "updateStatus":   return handleAdminWrite_(payload, updateStatus_);
      default:
        return jsonOut_({ ok: false, message: "إجراء غير معروف" });
    }
  } catch (err) {
    return jsonOut_({ ok: false, message: "خطأ في الخادم: " + err.message });
  }
}

/* --- طلب ولي أمر: عام، لا يحتاج كلمة مرور --- */
function handleAddRequest_(payload) {
  const sheet = getSheet_(SHEET_NAMES.REQUESTS);
  ensureHeader_(sheet, ["ID", "التاريخ", "اسم مقدم الطلب", "رقم التليفون", "العنوان", "نوع الطلب", "نص الطلب", "الحالة"]);
  sheet.appendRow([
    Utilities.getUuid(),
    payload.date || new Date().toLocaleString("ar-EG"),
    payload.name || "",
    payload.phone || "",
    payload.address || "",
    payload.type || "طلب",
    payload.message || "",
    "جديد"
  ]);
  return jsonOut_({ ok: true, message: "تم إرسال الطلب بنجاح" });
}

/* --- كل عمليات الإدارة تمر من هنا للتحقق من كلمة المرور أولًا --- */
function handleAdminWrite_(payload, fn) {
  if (!checkPassword_(payload.password)) {
    return jsonOut_({ ok: false, message: "كلمة مرور الإدارة غير صحيحة" });
  }
  return fn(payload);
}

function addNews_(payload) {
  const sheet = getSheet_(SHEET_NAMES.NEWS);
  ensureHeader_(sheet, ["ID", "التاريخ", "العنوان", "الصورة", "الملخص"]);
  sheet.appendRow([
    Utilities.getUuid(),
    payload.date || new Date().toLocaleDateString("ar-EG"),
    payload.title || "",
    payload.image || "",
    payload.summary || ""
  ]);
  return jsonOut_({ ok: true, message: "تم إضافة الخبر" });
}

function addGalleryImage_(payload) {
  const sheet = getSheet_(SHEET_NAMES.GALLERY);
  ensureHeader_(sheet, ["ID", "الصورة", "الوصف", "التصنيف"]);
  sheet.appendRow([
    Utilities.getUuid(),
    payload.image || "",
    payload.caption || "",
    payload.category || "عام"
  ]);
  return jsonOut_({ ok: true, message: "تم إضافة الصورة" });
}

/* حذف صف بواسطة رقم الصف الحقيقي (_row) المُستلم من doGet */
function deleteRow_(payload) {
  const sheetKey = (payload.sheet || "").toUpperCase();
  const sheetName = SHEET_NAMES[sheetKey];
  if (!sheetName) return jsonOut_({ ok: false, message: "شيت غير معروف" });

  const sheet = getSheet_(sheetName);
  const rowNumber = Number(payload.rowNumber);
  if (!rowNumber || rowNumber < 2) return jsonOut_({ ok: false, message: "رقم صف غير صالح" });

  sheet.deleteRow(rowNumber);
  return jsonOut_({ ok: true, message: "تم الحذف" });
}

/* تحديث حالة طلب ولي أمر (مثال: جديد -> تم الرد) */
function updateStatus_(payload) {
  const sheet = getSheet_(SHEET_NAMES.REQUESTS);
  const rowNumber = Number(payload.rowNumber);
  if (!rowNumber || rowNumber < 2) return jsonOut_({ ok: false, message: "رقم صف غير صالح" });

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf("الحالة") + 1;
  if (statusCol === 0) return jsonOut_({ ok: false, message: "عمود الحالة غير موجود" });

  sheet.getRange(rowNumber, statusCol).setValue(payload.status || "تم الرد");
  return jsonOut_({ ok: true, message: "تم تحديث الحالة" });
}

function getStats_() {
  const sheet = getSheet_(SHEET_NAMES.SETTINGS);
  ensureHeader_(sheet, ["المفتاح", "القيمة"]);
  const values = sheet.getDataRange().getValues();
  const stats = { students: 0, teachers: 0, classes: 0 };
  values.slice(1).forEach(row => {
    const key = String(row[0] || "").trim();
    const value = row[1] === "" || row[1] === null ? 0 : row[1];
    if (key === "students") stats.students = value;
    if (key === "teachers") stats.teachers = value;
    if (key === "classes") stats.classes = value;
  });
  return stats;
}

function updateStats_(payload) {
  const sheet = getSheet_(SHEET_NAMES.SETTINGS);
  ensureHeader_(sheet, ["المفتاح", "القيمة"]);
  const values = sheet.getDataRange().getValues();
  const updates = {
    students: Number(payload.students),
    teachers: Number(payload.teachers),
    classes: Number(payload.classes)
  };
  if (Object.values(updates).some(v => !Number.isInteger(v) || v < 0)) {
    return jsonOut_({ ok: false, message: "قيم الإحصائيات غير صالحة" });
  }
  Object.keys(updates).forEach(key => {
    const rowIndex = values.findIndex((row, i) => i > 0 && String(row[0]).trim() === key);
    if (rowIndex === -1) sheet.appendRow([key, updates[key]]);
    else sheet.getRange(rowIndex + 1, 2).setValue(updates[key]);
  });
  return jsonOut_({ ok: true, message: "تم حفظ الإحصائيات" });
}

function ensureHeader_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
}
