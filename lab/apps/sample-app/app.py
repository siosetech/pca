"""
A deliberately small instrumented service for the PCA lab.

It exists to give the lab one of each metric type so I can practise PromQL
against data I understand:

    app_requests_total ............ COUNTER   (method, route, status)
    app_inflight_requests ......... GAUGE
    app_request_duration_seconds .. HISTOGRAM (route)  -> _bucket/_sum/_count
    app_response_size_bytes ....... SUMMARY   (route)  -> _sum/_count
                                    NOTE: the Python client does not implement
                                    client-side quantiles, so this summary emits
                                    only _sum and _count -- no {quantile} series.
                                    The Go and Java clients do. Worth knowing:
                                    quantile support is per-library, not part of
                                    the wire format.
    app_build_info ................ GAUGE     an "info" metric, always 1

Routes:
    /api/users   fast
    /api/orders  medium
    /api/slow    slow, straddles the 1s bucket
    /api/flaky   returns 500 about 15% of the time
    /metrics     the exposition endpoint Prometheus scrapes
"""

import os
import random
import time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

from prometheus_client import (
    Counter, Gauge, Histogram, Summary,
    CONTENT_TYPE_LATEST, generate_latest,
)

VERSION = os.environ.get("APP_VERSION", "1.4.2")

# ── Metric definitions ────────────────────────────────────────────────────────
# Naming: snake_case, namespaced, base units (seconds/bytes), `_total` on counters.
REQUESTS = Counter(
    "app_requests_total",
    "Total HTTP requests handled.",
    ["method", "route", "status"],
)

INFLIGHT = Gauge(
    "app_inflight_requests",
    "Requests currently being handled.",
)

# Buckets chosen to straddle a 300ms SLO threshold -- le="0.3" must exist.
LATENCY = Histogram(
    "app_request_duration_seconds",
    "Request duration in seconds.",
    ["route"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.3, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# A summary, purely so I can see why its quantiles cannot be aggregated.
RESPONSE_SIZE = Summary(
    "app_response_size_bytes",
    "Response size in bytes.",
    ["route"],
)

BUILD_INFO = Gauge(
    "app_build_info",
    "Build information. Always 1; the labels carry the payload.",
    ["version", "language"],
)
BUILD_INFO.labels(version=VERSION, language="python").set(1)

# route -> (min_seconds, max_seconds, error_probability)
ROUTES = {
    "/api/users":  (0.005, 0.060, 0.00),
    "/api/orders": (0.030, 0.250, 0.02),
    "/api/slow":   (0.400, 1.800, 0.01),
    "/api/flaky":  (0.010, 0.120, 0.15),
}


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *args):        # keep the container logs quiet
        pass

    def do_GET(self):
        route = self.path.split("?")[0]

        if route == "/metrics":
            body = generate_latest()
            self.send_response(200)
            self.send_header("Content-Type", CONTENT_TYPE_LATEST)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if route in ("/", "/healthz"):
            self._plain(200, b"ok\n")
            return

        if route not in ROUTES:
            REQUESTS.labels("GET", route, "404").inc()
            self._plain(404, b"not found\n")
            return

        lo, hi, err_p = ROUTES[route]
        status = "500"          # so the finally block always has a value
        INFLIGHT.inc()
        start = time.perf_counter()
        try:
            time.sleep(random.uniform(lo, hi))
            status = "500" if random.random() < err_p else "200"
            payload = b"x" * random.randint(200, 4000)
            RESPONSE_SIZE.labels(route=route).observe(len(payload))
            self._plain(int(status), payload if status == "200" else b"error\n")
        finally:
            LATENCY.labels(route=route).observe(time.perf_counter() - start)
            REQUESTS.labels("GET", route, status).inc()
            INFLIGHT.dec()

    def _plain(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"sample-app {VERSION} listening on :{port} (metrics at /metrics)", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
