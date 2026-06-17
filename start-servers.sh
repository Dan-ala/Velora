#!/usr/bin/env bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  VELORA - Wear Your Identity"
echo "  Starting Servers..."
echo "============================================"
echo ""

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill $API_PID $WEB_PID 2>/dev/null || true
  wait $API_PID $WEB_PID 2>/dev/null || true
  echo "Servers stopped. Goodbye!"
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "[1/4] Checking for existing processes..."
lsof -ti :4000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

echo "[2/4] Generating Prisma client..."
cd "$ROOT_DIR/apps/api"
npx prisma generate 2>/dev/null || true
cd "$ROOT_DIR"

echo "[3/4] Starting API server on port 4000..."
cd "$ROOT_DIR/apps/api"
npx tsx src/index.ts &
API_PID=$!
cd "$ROOT_DIR"

echo "      Waiting for API to start..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    echo "      API is ready!"
    break
  fi
  sleep 2
done

echo "[4/4] Starting Web app on port 3000..."
cd "$ROOT_DIR/apps/web"
PORT=3000 npx next dev &
WEB_PID=$!
cd "$ROOT_DIR"

echo "      Waiting for Web app to start..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "      Web app is ready!"
    break
  fi
  sleep 2
done

echo ""
echo "============================================"
echo "  Servers are running!"
echo "============================================"
echo ""
echo "  Web App:    http://localhost:3000 ($(hostname -I | awk '{print $1}'))"
echo "  API:        http://localhost:4000 ($(hostname -I | awk '{print $1}'))"
echo "  API Health: http://localhost:4000/health"
echo ""
echo "  Press Ctrl+C to stop all servers..."
echo "============================================"
echo ""

wait
