#!/bin/bash

echo "=== Iniciando build do Vercel ==="

# Build do frontend - ignorando completamente TypeScript
echo "1. Build do frontend..."
npx vite build --mode production

# Build do backend
echo "2. Build do backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "=== Build concluído ==="