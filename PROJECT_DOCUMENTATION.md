# دليل المشروع الشامل - روبوت الدردشة العاطفي بالذكاء الاصطناعي

## نظرة عامة على المشروع

هذا مشروع روبوت دردشة ذكي يجمع بين تحليل المشاعر من خلال الوجه والذكاء الاصطناعي للمحادثة. يستخدم المشروع تقنيات حديثة لتوفير تجربة تفاعلية متقدمة باللغة العربية.

## هيكل المشروع

```
├── client/                    # الجانب الأمامي (Frontend)
│   ├── src/
│   │   ├── components/        # المكونات الرئيسية
│   │   │   ├── ui/           # مكونات واجهة المستخدم
│   │   │   ├── ChatInterface.tsx      # واجهة الدردشة الرئيسية
│   │   │   ├── EmotionAnalysis.tsx    # تحليل المشاعر
│   │   │   ├── CameraFeed.tsx         # تغذية الكاميرا
│   │   │   ├── SmartNotifications.tsx # نظام الإشعارات الذكية
│   │   │   └── ...
│   │   ├── hooks/            # الخطافات المخصصة
│   │   ├── lib/              # المكتبات والأدوات
│   │   ├── pages/            # الصفحات
│   │   └── ...
│   └── index.html            # الصفحة الرئيسية
├── server/                   # الجانب الخلفي (Backend)
│   ├── index.ts             # نقطة البداية للخادم
│   ├── routes.ts            # مسارات API
│   ├── ai-providers.ts      # مقدمو خدمات الذكاء الاصطناعي
│   ├── storage.ts           # إدارة التخزين
│   └── vite.ts              # إعدادات Vite
├── shared/                  # الملفات المشتركة
│   └── schema.ts            # مخطط قاعدة البيانات
└── ...                      # ملفات التكوين

```

## البيئة التقنية المستخدمة

### Frontend Stack
- **React 18** - مكتبة واجهة المستخدم
- **TypeScript** - لغة البرمجة مع الأنواع الثابتة
- **Vite** - أداة البناء والتطوير
- **Tailwind CSS** - إطار عمل CSS للتصميم
- **Shadcn/ui** - مكونات واجهة المستخدم
- **TanStack Query** - إدارة حالة الخادم
- **Wouter** - توجيه صفحات خفيف

### Backend Stack
- **Node.js** - بيئة تشغيل JavaScript
- **Express.js** - إطار عمل الخادم
- **TypeScript** - لغة البرمجة
- **Drizzle ORM** - أداة إدارة قاعدة البيانات
- **PostgreSQL** - قاعدة البيانات

### AI & Computer Vision
- **Google Gemini API** - الذكاء الاصطناعي للمحادثة
- **Face-API.js** - تحليل المشاعر من الوجه
- **MediaDevices API** - الوصول للكاميرا

## شرح الملفات الرئيسية

### 1. client/src/App.tsx
```typescript
// نقطة البداية للتطبيق الأمامي
// يدير التوجيه بين الصفحات المختلفة
// يضبط مقدم خدمة React Query
```

### 2. client/src/components/ChatInterface.tsx
```typescript
// المكون الرئيسي للدردشة
// يدير:
// - عرض الرسائل
// - إرسال واستقبال الرسائل
// - ربط تحليل المشاعر بالمحادثة
// - واجهة المستخدم الرئيسية
```

### 3. client/src/components/EmotionAnalysis.tsx
```typescript
// مكون تحليل المشاعر
// المسؤوليات:
// - تحليل الوجه باستخدام Face-API
// - عرض البيانات العاطفية
// - ربط النتائج بالمحادثة
```

### 4. client/src/components/CameraFeed.tsx
```typescript
// مكون تغذية الكاميرا
// يدير:
// - الوصول للكاميرا
// - عرض الفيديو المباشر
// - معالجة أذونات الكاميرا
```

### 5. client/src/components/SmartNotifications.tsx
```typescript
// نظام الإشعارات الذكية
// الميزات:
// - إشعارات مبنية على الحالة العاطفية
// - نظام cooldown لتجنب الإزعاج
// - إخفاء تلقائي بعد فترة زمنية
```

### 6. server/index.ts
```typescript
// نقطة البداية للخادم
// يضبط:
// - خادم Express
// - إعدادات CORS
// - ربط المسارات
// - خدمة الملفات الثابتة
```

### 7. server/routes.ts
```typescript
// مسارات API
// يحتوي على:
// - /api/users - إدارة المستخدمين
// - /api/sessions - إدارة الجلسات
// - /api/messages - إدارة الرسائل
// - /api/emotions - حفظ بيانات المشاعر
// - /api/ai-providers - خدمات الذكاء الاصطناعي
```

### 8. server/ai-providers.ts
```typescript
// مقدمو خدمات الذكاء الاصطناعي
// يدير:
// - ربط Google Gemini API
// - معالجة الطلبات والاستجابات
// - تحويل النصوص للعربية
```

### 9. shared/schema.ts
```typescript
// مخطط قاعدة البيانات
// يحدد هيكل:
// - جدول المستخدمين
// - جدول الجلسات
// - جدول الرسائل
// - جدول تحليل المشاعر
```

## المكتبات والاعتماديات

### Frontend Dependencies
```json
{
  "@google/genai": "^0.x.x",           // Google Gemini API
  "@vladmandic/face-api": "^1.x.x",   // تحليل الوجه والمشاعر
  "@tanstack/react-query": "^5.x.x",  // إدارة حالة الخادم
  "@radix-ui/react-*": "^1.x.x",      // مكونات واجهة المستخدم
  "tailwindcss": "^3.x.x",            // إطار عمل CSS
  "wouter": "^3.x.x",                 // توجيه الصفحات
  "react": "^18.x.x",                 // مكتبة واجهة المستخدم
  "typescript": "^5.x.x"              // لغة البرمجة
}
```

### Backend Dependencies
```json
{
  "express": "^4.x.x",                 // إطار عمل الخادم
  "drizzle-orm": "^0.x.x",            // أداة إدارة قاعدة البيانات
  "@neondatabase/serverless": "^0.x.x", // اتصال قاعدة البيانات
  "express-session": "^1.x.x",        // إدارة الجلسات
  "zod": "^3.x.x"                     // التحقق من البيانات
}
```

## تشغيل المشروع في Visual Studio Code

### 1. المتطلبات الأساسية
```bash
# تثبيت Node.js (الإصدار 18 أو أحدث)
# يمكن تحميله من: https://nodejs.org

# التحقق من التثبيت
node --version
npm --version
```

### 2. إعداد المشروع
```bash
# 1. فتح المجلد في VS Code
code .

# 2. تثبيت الاعتماديات
npm install

# 3. إنشاء ملف البيئة
# إنشاء ملف .env في الجذر وإضافة:
GOOGLE_API_KEY=your_google_gemini_api_key
DATABASE_URL=your_postgresql_database_url
```

### 3. إعداد VS Code

#### إضافات مُوصى بها:
```json
// في .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",      // Tailwind CSS IntelliSense
    "esbenp.prettier-vscode",         // Prettier Code Formatter
    "ms-vscode.vscode-typescript-next", // TypeScript Hero
    "formulahendry.auto-rename-tag",   // Auto Rename Tag
    "christian-kohler.path-intellisense" // Path Intellisense
  ]
}
```

#### إعدادات VS Code:
```json
// في .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### 4. تشغيل المشروع
```bash
# في Terminal داخل VS Code
npm run dev

# أو باستخدام المهام المضبوطة مسبقاً
# Ctrl+Shift+P -> Tasks: Run Task -> npm: dev
```

### 5. الوصول للتطبيق
```
http://localhost:5000
```

## معالجة الأخطاء الشائعة

### 1. خطأ في مفتاح Google API
```typescript
// في server/ai-providers.ts
// التحقق من صحة المفتاح
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is required');
}
```

### 2. مشاكل الكاميرا
```typescript
// في client/src/hooks/useFaceDetection.ts
// معالجة أذونات الكاميرا
try {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: true 
  });
} catch (error) {
  console.error('Camera access denied:', error);
  // عرض رسالة خطأ للمستخدم
}
```

### 3. أخطاء قاعدة البيانات
```typescript
// في server/storage.ts
// معالجة أخطاء الاتصال
try {
  const result = await db.select().from(users);
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Database connection failed');
}
```

### 4. أخطاء التحميل
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install

# تنظيف cache
npm run dev --reset-cache
```

### 5. أخطاء TypeScript
```bash
# التحقق من الأخطاء
npx tsc --noEmit

# إصلاح الأخطاء الشائعة في VS Code:
# - استخدام Ctrl+. للحلول السريعة
# - التحقق من المسارات النسبية
# - التأكد من أنواع البيانات
```

## بنية API والاتصالات

### Frontend ↔ Backend Communication
```typescript
// استخدام TanStack Query للطلبات
const { data: messages } = useQuery({
  queryKey: ['/api/sessions', sessionId, 'messages'],
  refetchInterval: 1000 // تحديث كل ثانية
});

// إرسال الرسائل
const sendMessage = useMutation({
  mutationFn: (message: string) => 
    apiRequest(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: { content: message, emotionContext }
    })
});
```

### Real-time Features
```typescript
// حفظ المشاعر كل 5 ثواني
useEffect(() => {
  const interval = setInterval(() => {
    if (emotions) {
      saveEmotions(emotions);
    }
  }, 5000);
  return () => clearInterval(interval);
}, [emotions]);
```

## نصائح للتطوير

### 1. Hot Reload
```typescript
// Vite يوفر تحديث فوري للتغييرات
// لا حاجة لإعادة تشغيل الخادم عند تعديل Frontend
```

### 2. Debugging
```typescript
// استخدام React DevTools
// استخدام VS Code Debugger للخادم
// فحص Network Tab في المتصفح
```

### 3. Testing
```bash
# اختبار AI Provider
curl -X POST http://localhost:5000/api/ai-providers/test \
  -H "Content-Type: application/json" \
  -d '{"message": "مرحبا"}'
```

### 4. Performance Monitoring
```typescript
// مراقبة الأداء في المتصفح
// فحص استهلاك الذاكرة
// تحسين re-renders باستخدام React.memo
```

## Deployment

### Local Production Build
```bash
# بناء المشروع للإنتاج
npm run build

# تشغيل النسخة المبنية
npm start
```

### Environment Variables
```env
# ملف .env للتطوير
NODE_ENV=development
GOOGLE_API_KEY=your_key
DATABASE_URL=your_db_url

# ملف .env.production للإنتاج
NODE_ENV=production
GOOGLE_API_KEY=production_key
DATABASE_URL=production_db_url
```

## الأمان والخصوصية

### 1. API Keys Protection
```typescript
// عدم تخزين المفاتيح في الكود
// استخدام متغيرات البيئة فقط
// عدم رفع ملف .env للمستودع
```

### 2. Camera Privacy
```typescript
// طلب إذن المستخدم قبل الوصول
// عدم حفظ فيديو الكاميرا
// معالجة البيانات محلياً فقط
```

### 3. Data Validation
```typescript
// استخدام Zod للتحقق من البيانات
// تنظيف المدخلات
// التحقق من أذونات المستخدم
```

## الصيانة والتحديث

### 1. تحديث الاعتماديات
```bash
# فحص التحديثات المتاحة
npm outdated

# تحديث الحزم
npm update

# تحديث major versions بحذر
npm install package@latest
```

### 2. Monitoring
```typescript
// مراقبة الأخطاء
// تتبع استخدام API
// مراقبة الأداء
```

### 3. Backup
```bash
# نسخ احتياطية من قاعدة البيانات
# حفظ إعدادات البيئة
# توثيق التغييرات
```

هذا دليل شامل للمشروع يغطي جميع جوانب التطوير والتشغيل والصيانة. يمكنك الرجوع إليه عند الحاجة لفهم أي جزء من المشروع أو حل المشاكل التقنية.