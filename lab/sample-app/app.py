#!/usr/bin/env python3
"""Instrumented shop API for Linux Foundation PCA lab practice."""

from __future__ import annotations

import os
import random
import threading
import time

from flask import Flask, Response, jsonify, request
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    Summary,
    generate_latest,
)

app = Flask(__name__)

ERROR_RATE = float(os.environ.get("ERROR_RATE", "0.28"))

REQUESTS = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "code"],
)
IN_FLIGHT = Gauge("http_in_flight_requests", "In-flight HTTP requests")
LATENCY = Histogram(
    "http_request_duration_seconds",
    "Request latency in seconds",
    ["endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
)
UPLOAD = Histogram(
    "upload_duration_seconds",
    "Simulated file upload duration; SLO is 97% under 30s",
    buckets=(10, 25, 27, 30, 32, 35, 40, 50),
)
CPU_TEMP = Gauge("app_cpu_temp_celsius", "Simulated CPU temperature", ["cpu"])
QUEUE = Gauge("app_queue_depth", "Simulated checkout queue depth")

# An "info" metric: always 1, the labels carry the payload. Drill 03 joins
# against this with group_left, which is a named PromQL skill.
BUILD_INFO = Gauge(
    "app_build_info",
    "Build information. Always 1; the labels carry the payload.",
    ["version", "language"],
)
BUILD_INFO.labels(version=os.environ.get("APP_VERSION", "1.4.2"), language="python").set(1)
CHECKOUT = Summary("checkout_latency_seconds", "Checkout latency (client-side quantiles)")
ORDERS = Counter("shop_orders_total", "Orders by status", ["status"])
WEBHOOKS = Counter("alertmanager_webhooks_total", "Alertmanager webhook deliveries", ["status"])
LAST_ALERT = Gauge("alertmanager_last_webhook_timestamp_seconds", "Unix time of last webhook")


def observe(endpoint: str, status: int, started: float) -> None:
    REQUESTS.labels(request.method, endpoint, str(status)).inc()
    LATENCY.labels(endpoint).observe(time.perf_counter() - started)


@app.before_request
def _before() -> None:
    IN_FLIGHT.inc()


@app.after_request
def _after(response: Response) -> Response:
    IN_FLIGHT.dec()
    return response


@app.get("/health")
def health() -> tuple[dict[str, str], int]:
    started = time.perf_counter()
    observe("/health", 200, started)
    return {"status": "ok"}, 200


@app.get("/")
def index() -> tuple[dict[str, object], int]:
    started = time.perf_counter()
    observe("/", 200, started)
    return {
        "service": "pca-sample-app",
        "metrics": "/metrics",
        "routes": ["/health", "/api/orders", "/api/unstable", "/api/upload"],
    }, 200


@app.get("/api/orders")
def orders() -> tuple[dict[str, object], int]:
    started = time.perf_counter()
    time.sleep(random.uniform(0.01, 0.08))
    status = random.choices(["ok", "rejected"], weights=[92, 8])[0]
    ORDERS.labels(status).inc()
    CHECKOUT.observe(random.uniform(0.04, 0.4))
    observe("/api/orders", 200, started)
    return {"status": status, "id": random.randint(1000, 9999)}, 200


@app.get("/api/unstable")
def unstable() -> tuple[dict[str, str], int]:
    started = time.perf_counter()
    time.sleep(random.uniform(0.02, 0.35))
    if random.random() < ERROR_RATE:
        observe("/api/unstable", 500, started)
        return {"error": "upstream timeout"}, 500
    observe("/api/unstable", 200, started)
    return {"status": "ok"}, 200


@app.post("/api/upload")
def upload() -> tuple[dict[str, float], int]:
    started = time.perf_counter()
    duration = random.choices(
        [8, 18, 26, 29, 31, 38],
        weights=[5, 40, 30, 15, 7, 3],
    )[0] + random.random()
    UPLOAD.observe(duration)
    observe("/api/upload", 200, started)
    return {"seconds": round(duration, 2)}, 200


@app.post("/webhook")
def webhook() -> tuple[dict[str, str], int]:
    WEBHOOKS.labels("received").inc()
    LAST_ALERT.set(time.time())
    return {"status": "accepted"}, 200


@app.get("/metrics")
def metrics() -> Response:
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


def _simulate_gauges() -> None:
    while True:
        CPU_TEMP.labels("0").set(random.uniform(42, 71))
        CPU_TEMP.labels("1").set(random.uniform(40, 68))
        QUEUE.set(random.randint(0, 24))
        time.sleep(5)


if __name__ == "__main__":
    threading.Thread(target=_simulate_gauges, daemon=True).start()
    app.run(host="0.0.0.0", port=8000, threaded=True)
