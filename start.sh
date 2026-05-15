#!/bin/bash
# start.sh — Start both backend and frontend with one command.
# Usage: chmod +x start.sh && ./start.sh

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     ISL Translator — Starting Up     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Start backend
echo "[1/2] Starting FastAPI backend on port 8000..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo "[2/2] Starting React frontend on port 5173..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are running!"
echo ""
echo "  Frontend → http://localhost:5173"
echo "  Backend  → http://localhost:8000"
echo "  API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait and clean up on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
