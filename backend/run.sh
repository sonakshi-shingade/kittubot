#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Locate python with fastapi and uvicorn
if [ -f "/home/Project/2months/sh/bin/python" ]; then
    PYTHON="/home/Project/2months/sh/bin/python"
elif [ -f "$DIR/.venv/bin/python" ]; then
    PYTHON="$DIR/.venv/bin/python"
elif command -v python3 &> /dev/null; then
    PYTHON="python3"
else
    PYTHON="python"
fi

echo "Starting KittuBot FastAPI Backend on http://0.0.0.0:8003..."
exec $PYTHON -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload

