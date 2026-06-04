#!/usr/bin/env bash
# NowPayments API 키 유효성 즉시 검증 (실인보이스 1건 발행 테스트)
# 사용법:  ./scripts/verify-nowpayments.sh '<NOWPAYMENTS_API_KEY>'
# 키는 NowPayments 대시보드 > Settings > API keys 의 값 (위젯 public key 아님).
set -euo pipefail

KEY="${1:-}"
if [ -z "$KEY" ]; then
  echo "사용법: ./scripts/verify-nowpayments.sh '<NOWPAYMENTS_API_KEY>'" >&2
  echo "  키 위치: 대시보드 > Settings > API keys (위젯용 public key 말고 이거)" >&2
  exit 1
fi

RESP=$(curl -s -X POST https://api.nowpayments.io/v1/invoice \
  -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"price_amount":150,"price_currency":"usd","order_id":"verify:chainwork","order_description":"chainwork key check","success_url":"https://chainwork.dev/post/success","cancel_url":"https://chainwork.dev/post/success","ipn_callback_url":"https://chainwork.dev/api/payments/nowpayments-webhook"}')

if echo "$RESP" | grep -q '"invoice_url"'; then
  URL=$(echo "$RESP" | sed -n 's/.*"invoice_url":"\([^"]*\)".*/\1/p')
  echo "PASS — API 키 유효. 실인보이스 발행됨:"
  echo "  $URL"
  echo "위 URL 열면 실제 크립토 결제 페이지가 뜬다 (결제 안 해도 됨)."
else
  echo "FAIL — 인보이스 발행 실패. 응답:"
  echo "  $RESP"
  echo
  echo "INVALID_API_KEY 면: 저장된 키가 REST API 키가 아닐 가능성."
  echo "  대시보드 > Settings > API keys 에서 키 재확인 후, 필요시"
  echo "  vercel env 의 NOWPAYMENTS_API_KEY 를 그 값으로 교체."
fi
