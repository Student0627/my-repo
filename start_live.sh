#!/usr/bin/env bash
# ==============================================================================
# FineGuard - Live Public Deployment & Tunnel Launcher
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "  🚀 Starting FineGuard Live Deployment"
echo "=========================================================="

# 1. Check/Build Frontend
if [ ! -d "frontend/dist" ]; then
    echo "📦 Building production frontend bundle..."
    cd frontend && npm run build && cd ..
fi

# 2. Start Backend on Port 8000 if not already running
if ! lsof -i :8000 > /dev/null 2>&1; then
    echo "🐍 Launching FastAPI Explainable AI engine on port 8000..."
    source venv/bin/activate
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir backend > backend.log 2>&1 &
    sleep 2
else
    echo "✅ Backend engine is already active on http://localhost:8000"
fi

# 3. Start Frontend dev server on Port 5173 if not active
if ! lsof -i :5173 > /dev/null 2>&1; then
    echo "⚛️ Launching Vite Frontend on port 5173..."
    cd frontend
    nohup npx vite --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &
    cd ..
    sleep 2
else
    echo "✅ Frontend is already active on http://localhost:5173"
fi

# 4. Launch Live Public Tunnel via Pinggy / Localtunnel
echo "🌐 Creating Live Public Internet URL..."
echo "----------------------------------------------------------"
echo "Public Tunnel 1 (Localtunnel - Custom Subdomain):"
echo "👉 https://fineguard-student-demo.loca.lt"
echo "   (If prompted for tunnel password, enter: $(curl -s https://loca.lt/mytunnelpassword || echo 'your public IP'))"
echo ""
echo "Public Tunnel 2 (Pinggy - Direct Password-Free Link):"
ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:5173 a.pinggy.io
