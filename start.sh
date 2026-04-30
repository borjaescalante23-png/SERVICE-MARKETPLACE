#!/bin/bash

kill $(lsof -ti:3001) 2>/dev/null
kill $(lsof -ti:5173) 2>/dev/null

cd /Users/borjaescalante/SERVICE-MARKETPLACE/backend && npm run dev &
cd /Users/borjaescalante/SERVICE-MARKETPLACE/frontend && npm run dev -- --host &

wait
