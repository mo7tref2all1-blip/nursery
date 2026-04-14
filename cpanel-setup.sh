#!/bin/bash
# =============================================================
# سكريبت إعداد نظام الحضانة على cPanel
# شغّل هذا السكريبت مرة واحدة بعد رفع الملفات
# =============================================================

echo "======================================"
echo "  إعداد نظام إدارة الحضانات"
echo "======================================"

# 1. تثبيت الـ dependencies
echo ""
echo "[1/3] تثبيت المكتبات..."
npm install
npm install --prefix client
npm install --prefix server

# 2. بناء المشروع
echo ""
echo "[2/3] بناء المشروع (Build)..."
npm run build --prefix client
npm run build --prefix server

# 3. إنشاء ملف .env إذا لم يكن موجوداً
echo ""
echo "[3/3] إعداد ملف البيئة..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "تم إنشاء ملف .env - تأكد من تغيير JWT_SECRET"
else
  echo "ملف .env موجود بالفعل"
fi

echo ""
echo "======================================"
echo "  تم الإعداد بنجاح!"
echo ""
echo "  لتشغيل السيستم:"
echo "  npm start"
echo ""
echo "  أو اضبط cPanel Node.js App على:"
echo "  Startup File: server/dist/index.js"
echo "======================================"
