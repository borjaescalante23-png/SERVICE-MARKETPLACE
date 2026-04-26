#!/bin/bash

# Ir al directorio del proyecto
cd "$(dirname "$0")"

echo "=== Arrancando el Marketplace ==="
echo ""

# Iniciar backend
echo "Iniciando backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Esperar a que el backend arranque
sleep 4

# Iniciar frontend
echo "Iniciando frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Esperar a que el frontend arranque
sleep 4

# Abrir en el navegador
echo ""
echo "Abriendo en el navegador..."
open http://localhost:5173

echo ""
echo "=== App corriendo ==="
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo ""
echo "Cierra esta ventana para detener los servidores."

# Mantener vivos los procesos
wait $BACKEND_PID $FRONTEND_PID
