#!/bin/bash
set -e

echo "🚀 Configurando Verified Marketplace..."
echo ""

# Check node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js no encontrado. Instala Node.js primero:"
  echo "   https://nodejs.org/en/download (versión LTS recomendada)"
  echo "   O con Homebrew: brew install node"
  exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"

# Backend
echo ""
echo "📦 Instalando dependencias del backend..."
cd "$(dirname "$0")/backend"
npm install

echo ""
echo "🗄️  Configurando base de datos..."
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts

# Frontend
echo ""
echo "📦 Instalando dependencias del frontend..."
cd "$(dirname "$0")/frontend"
npm install

echo ""
echo "✅ ¡Todo listo!"
echo ""
echo "Para iniciar la aplicación, ejecuta en dos terminales:"
echo ""
echo "  Terminal 1 (Backend):"
echo "  cd $(dirname "$0")/backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "  cd $(dirname "$0")/frontend && npm run dev"
echo ""
echo "  App disponible en: http://localhost:5173"
echo ""
echo "📋 Credenciales de prueba:"
echo "  Admin:       admin@marketplace.com  / Admin1234!"
echo "  Cliente:     cliente@test.com        / Client1234!"
echo "  Profesional: profesional@test.com    / Pro1234!"
