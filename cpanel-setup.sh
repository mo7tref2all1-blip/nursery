#!/bin/bash
# ============================================================
# سكريبت إعداد نظام الحضانة على cPanel
# شغّل هذا السكريبت من Terminal Terminal أو SSH
# ============================================================
set -e

echo "======================================"
echo "  إعداد نظام إدارة الحضانات"
echo "======================================"

# Install dependencies
echo "[1/3] تثبيت المكتبات..."
npm install --prefix server --omit=dev

# Build (skip if dist/ already exists)
if [ ! -f "server/dist/index.js" ]; then
  echo "[2/3] بناء السيرفر..."
  npm run build --prefix server
else
  echo "[2/3] السيرفر مبني بالفعل ✓"
fi

# Create .env
echo "[3/3] إعداد ملف .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "  ⚠️  تم إنشاء ملف .env"
  echo "  افتحه وعدّل بيانات MySQL و JWT_SECRET"
fi

echo ""
echo "======================================"
echo "  تم! الخطوة الأخيرة:"
echo "  عدّل ملف .env ثم شغّل: npm start"
echo "======================================"
