#!/usr/bin/env bash
set -euo pipefail

git add .
git commit -m "$(cat <<'EOF'
Build full-stack AI Log Intelligence Dashboard.

Add FastAPI NLP log analysis backend, Next.js analytics dashboard frontend, Docker setup, and deployment-ready documentation for GitHub/Vercel workflows.
EOF
)"
git status
