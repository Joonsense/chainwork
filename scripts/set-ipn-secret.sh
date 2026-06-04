#!/usr/bin/env bash
# NowPayments IPN Secret 한 번에 등록 + 재배포
# 사용법:  ./scripts/set-ipn-secret.sh '<IPN_SECRET>'
set -euo pipefail

SECRET="${1:-}"
if [ -z "$SECRET" ]; then
  echo "사용법: ./scripts/set-ipn-secret.sh '<IPN_SECRET>'" >&2
  echo "  IPN Secret = NowPayments 대시보드 > Settings > IPN > IPN Secret key" >&2
  exit 1
fi

# nvm 경로 보장 (vercel/node/pnpm)
export PATH="$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" | tail -1)/bin:$PATH"
cd "$(dirname "$0")/.."

echo "==> 기존 production 값 제거(있으면)"
vercel env rm NOWPAYMENTS_IPN_SECRET production --yes >/dev/null 2>&1 || true

echo "==> production env 등록 (암호화)"
printf '%s' "$SECRET" | vercel env add NOWPAYMENTS_IPN_SECRET production

echo "==> 재배포 (env는 새 배포부터 반영)"
git commit --allow-empty -m "chore: redeploy for NOWPAYMENTS_IPN_SECRET" >/dev/null
git push origin main

echo
echo "완료. Vercel이 자동 배포한다. 배포 끝나면 라이브 /post 에서 실인보이스 생성 확인하면 된다."
