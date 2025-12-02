#!/bin/bash

echo "=== Iniciando build do Vercel (ignorando TypeScript) ==="

# Desativar verificação de tipos TypeScript
export TS_NODE_TRANSPILE_ONLY=true
export TS_NODE_SKIP_PROJECT=true

# Build do frontend (ignorando erros TypeScript)
echo "1. Build do frontend com Vite..."
npx vite build --mode production 2>&1 | (grep -v "error TS" || cat)

# Build do backend
echo "2. Build do backend com esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "=== Build concluído ==="
echo "Arquivos em: dist/"