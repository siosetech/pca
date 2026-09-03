#!/bin/sh
# Generates HTTP traffic for PromQL practice and pushes a batch metric.
set -eu

APP="${SAMPLE_APP_URL:-http://sample-app:8000}"
PUSH="${PUSHGATEWAY_URL:-http://pushgateway:9091}"

echo "loadgen targeting $APP"

while true; do
  curl -fsS "$APP/" >/dev/null || true
  curl -fsS "$APP/health" >/dev/null || true
  curl -fsS "$APP/api/orders" >/dev/null || true
  curl -fsS "$APP/api/unstable" >/dev/null || true
  curl -fsS -X POST "$APP/api/upload" >/dev/null || true

  # Short-lived batch job pattern (PCA: Pushgateway)
  cat <<EOF | curl -fsS --data-binary @- "$PUSH/metrics/job/pca_batch/instance/laptop" >/dev/null || true
# TYPE batch_job_last_success_timestamp_seconds gauge
batch_job_last_success_timestamp_seconds $(date +%s)
# TYPE batch_job_items_processed_total counter
batch_job_items_processed_total 42
EOF

  sleep 1
done
