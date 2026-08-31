#!/bin/bash
set -e

# ==========================================
# Configuration
# ==========================================
API_BASE_URL="/api"
ADMIN_EMAILS="mahakaldarshnain1@gmail.com,wv9304@gmail.com"
IMAGE_TAG="v3"
COMPOSE_FILE="docker-compose.stag.yml"

# ==========================================
# Pre-flight checks
# ==========================================
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker daemon is not running or not accessible."
  exit 1
fi

if ! docker info 2>/dev/null | grep -q "Username"; then
  echo "⚠️  You may not be logged in to Docker Hub. Run 'docker login' if the push step fails."
fi

# Export so it's available to docker compose's variable substitution
export IMAGE_TAG

# ==========================================
# Build & push frontend
# ==========================================
echo "=========================================="
echo "🚀 Building Frontend with API_BASE_URL=$API_BASE_URL (tag: $IMAGE_TAG)"
echo "=========================================="

docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" \
  --build-arg NEXT_PUBLIC_ADMIN_EMAILS="$ADMIN_EMAILS" \
  -t "growwkaro/frontend:$IMAGE_TAG" ./grow-karo

echo "✅ Frontend image built successfully!"
docker push "growwkaro/frontend:$IMAGE_TAG"

# ==========================================
# Build & push backend
# ==========================================
# echo "=========================================="
# echo "🚀 Building Backend (tag: $IMAGE_TAG)"
# echo "=========================================="

# docker build -t "growwkaro/backend:$IMAGE_TAG" ./backend

# echo "✅ Backend image built successfully!"
# docker push "growwkaro/backend:$IMAGE_TAG"

# ==========================================
# Deploy
# ==========================================
echo "=========================================="
echo "🎉 Starting containers..."
echo "=========================================="

docker compose -f "$COMPOSE_FILE" down
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "=========================================="
echo "✨ Deployment complete! (frontend & backend: $IMAGE_TAG)"
echo "=========================================="