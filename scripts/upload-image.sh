#!/usr/bin/env bash
set -e

if [ $# -lt 1 ]; then
  echo "Usage: ./scripts/upload-image.sh <image-file> [folder]"
  echo "  folder defaults to 'velora'"
  exit 1
fi

IMAGE="$1"
FOLDER="${2:-velora}"

if [ ! -f "$IMAGE" ]; then
  echo "File not found: $IMAGE"
  exit 1
fi

read -rp "Admin email: " EMAIL
read -rsp "Password: " PASSWORD
echo ""

echo "Logging in..."
LOGIN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['session']['accessToken'])" 2>/dev/null || true)

if [ -z "$TOKEN" ]; then
  echo "Login failed: $(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','unknown error'))")"
  exit 1
fi

echo "Uploading $IMAGE to folder '$FOLDER'..."
B64=$(base64 -w0 "$IMAGE")

RESULT=$(curl -s -X POST http://localhost:4000/api/cloudinary/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"image\": \"data:image/jpeg;base64,$B64\", \"folder\": \"$FOLDER\"}")

echo ""
echo "$RESULT" | python3 -m json.tool
