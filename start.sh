#!/bin/bash
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Liberar puertos si están ocupados
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 0.5

echo "▶ Backend..."
cd /Users/borjaescalante/SERVICE-MARKETPLACE/backend && npm run dev &

echo "▶ Frontend..."
cd /Users/borjaescalante/SERVICE-MARKETPLACE/frontend && npm run dev &

echo "▶ Stripe..."
stripe listen --forward-to localhost:3001/api/bookings/webhook/stripe &

wait
