#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Starting KittuBot React Dev Server on http://0.0.0.0:5173..."
exec npm run dev

