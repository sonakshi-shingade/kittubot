#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "=========================================================="
echo "           🚀 Launching KittuBot Application              "
echo "=========================================================="

# Check if build exists, if not build it
if [ ! -d "$DIR/frontend/dist" ]; then
    echo "Building React frontend..."
    cd "$DIR/frontend" && npm run build
fi

# Locate python with fastapi and uvicorn
if [ -f "/home/Project/2months/sh/bin/python" ]; then
    PYTHON="/home/Project/2months/sh/bin/python"
elif [ -f "$DIR/backend/.venv/bin/python" ]; then
    PYTHON="$DIR/backend/.venv/bin/python"
elif command -v python3 &> /dev/null; then
    PYTHON="python3"
else
    PYTHON="python"
fi

echo "=========================================================="
echo "KittuBot is running at: http://localhost:8001"
echo "FastAPI Docs at:       http://localhost:8001/docs"
echo "Target vLLM Endpoint:  http://localhost:8000/v1"
echo "Target Model:          Qwen/Qwen3-0.6B"
echo "=========================================================="

cd "$DIR/backend"
exec $PYTHON -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

