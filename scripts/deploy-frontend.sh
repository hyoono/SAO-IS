#!/bin/bash
# SAO-IS Frontend Deploy Script
# Builds the React app and copies output to Laravel's public directory.

set -e

FRONTEND_DIR="/home/joshu/SAO-IS/frontend"
PUBLIC_DIR="/home/joshu/SAO-IS/backend/public"

echo "=== SAO-IS Frontend Deploy ==="

cd "$FRONTEND_DIR"

echo "Installing dependencies..."
npm install

echo "Building for production..."
npm run build

echo "Copying build output to backend/public/..."
# Preserve Laravel's index.php and .htaccess
cp -r dist/* "$PUBLIC_DIR/"

echo "=== Deploy complete ==="
echo "Frontend is now served from $PUBLIC_DIR"
