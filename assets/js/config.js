/* =========================================================
   ملف الإعدادات العام لموقع مدرسة قرية 7 الابتدائية
   ---------------------------------------------------------
   عدّل القيم أدناه فقط، ولا تحتاج لتعديل أي ملف آخر لتشغيل
   الموقع مع بيانات مدرستك. راجع ملف README.md لمعرفة طريقة
   الحصول على كل رابط بالتفصيل خطوة بخطوة.
   ========================================================= */

const CONFIG = {

  /* بيانات الترويسة والتواصل (تظهر أعلى وأسفل الصفحة) */
  SCHOOL: {
    ministry: "مديرية التربية والتعليم بكفر الشيخ",
    department: "إدارة الحامول التعليمية",
    welcome: "البوابة الإلكترونية لمدرسة قرية 7 الابتدائية ترحب بكم ..",
    name: "مدرسة قرية 7 الابتدائية",
    address: "قرية 7 - مركز الحامول - محافظة كفر الشيخ",
    phone: "0470000000",
    whatsapp: "201000000000",   /* بصيغة دولية بدون + أو أصفار في البداية */
    facebook: "https://facebook.com/",
    email: "info@example.com"
  },

  /* -----------------------------------------------------
     روابط قراءة البيانات (CSV) من جوجل شيت
     كل شيت (تبويب) يُنشر على الويب بصيغة CSV بشكل مستقل،
     ثم يُلصق رابطه هنا. راجع README.md لمعرفة كيفية النشر.
     ----------------------------------------------------- */
  SHEETS_CSV: {
    NEWS:     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvJmmLJSroyo-OzSIcRtnxm5C0Rc7HJRgilCOf82u-QVEJQKlYhlyMp6LSYj1uf3pM8jIWYCZzmZeA/pub?gid=0&single=true&output=csv",
    RESULTS:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvJmmLJSroyo-OzSIcRtnxm5C0Rc7HJRgilCOf82u-QVEJQKlYhlyMp6LSYj1uf3pM8jIWYCZzmZeA/pub?gid=704149059&single=true&output=csv",
    ABSENCE:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvJmmLJSroyo-OzSIcRtnxm5C0Rc7HJRgilCOf82u-QVEJQKlYhlyMp6LSYj1uf3pM8jIWYCZzmZeA/pub?gid=1790910271&single=true&output=csv",
    GALLERY:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvJmmLJSroyo-OzSIcRtnxm5C0Rc7HJRgilCOf82u-QVEJQKlYhlyMp6LSYj1uf3pM8jIWYCZzmZeA/pub?gid=1346329102&single=true&output=csv"
  },

  /* -----------------------------------------------------
     رابط تطبيق ويب Google Apps Script (Code.gs)
     يُستخدم في: إرسال طلبات/شكاوى أولياء الأمور، وجميع
     عمليات لوحة التحكم (إضافة/تعديل/حذف).
     ----------------------------------------------------- */
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzBbCdyf8vPWbRSdwgVQYNvNC3ldAtAJLxqah0xzvHQPgG4HNbeHS8v5LHh5yMS3jztpQ/exec",

  /* رابط ملف جوجل شيت نفسه (وضع التعديل) — يُستخدم في لوحة
     التحكم لفتح الملف مباشرة عند استيراد نتائج/غياب الطلاب */
  SPREADSHEET_EDIT_URL: "1GZ6M7bDi36s4MgdUk26XF1vfU_pOO0YJTMDTE7Ty6rM",

  /* -----------------------------------------------------
     كلمة مرور لوحة التحكم (تحقّق أولي من جهة المتصفح فقط
     لإخفاء اللوحة عن الزوار العاديين). التحقق الحقيقي
     والمُعتمَد عليه أمنيًا يتم داخل Code.gs على السيرفر،
     فتأكد أن القيمتين متطابقتان.
     ----------------------------------------------------- */
  ADMIN_PASSWORD: "admin0100"
};
