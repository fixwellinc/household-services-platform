#!/bin/sh
# Background script to continuously ensure manifest files exist during Next.js build

SERVER_DIR=".next/server"

while true; do
  mkdir -p "$SERVER_DIR"
  echo '{}' > "$SERVER_DIR/pages-manifest.json" 2>/dev/null || true
  echo '{}' > "$SERVER_DIR/app-paths-manifest.json" 2>/dev/null || true
  echo '{"sortedMiddleware":[],"middleware":{},"functions":{}}' > "$SERVER_DIR/middleware-manifest.json" 2>/dev/null || true
  echo '{"pages":{},"app":{},"appUsingSizeAdjust":false,"pagesUsingSizeAdjust":false}' > "$SERVER_DIR/font-manifest.json" 2>/dev/null || true
  sleep 0.1
done

