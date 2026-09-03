# PCA Lab — Prometheus Certified Associate

Linux Foundation / CNCF PCA çalışma ortamı. Lab Podman Compose; notlar ve deneme `study/` altında.

Sınav: 90 dakika, çoktan seçmeli, İngilizce, açık defter değil. Resmi LF materyali değildir.

## Dizin

```
pca/
  lab/           compose.yaml + Prometheus/Grafana/Alertmanager/exporters
  drills/        PromQL extras, sınav tuzakları (+ senin mevcut drill’lerin)
  docs/          structure.md (+ senin blueprint / notların)
  k8s/           isteğe bağlı Kind
  study/         Next.js: müfredat, PromQL, 28 soru, extras
  ci/            senin CI — dokunulmaz
```

Birleştirme kuralları: [docs/structure.md](docs/structure.md)

Laptop’taki mevcut `D:\dev\workspace\pca` üzerine yazmak için (ci / docs / drills silinmez):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\merge-into-pca.ps1
```

## Lab (Podman)

```powershell
cd D:\dev\workspace\pca\lab
podman compose up -d --build
```

| UI | URL |
| --- | --- |
| Prometheus | http://127.0.0.1:9090 |
| Grafana (`admin` / `pca`) | http://127.0.0.1:3000 |
| Alertmanager | http://127.0.0.1:9093 |
| Pushgateway | http://127.0.0.1:9091 |
| Sample app | http://127.0.0.1:8000 |
| Node Exporter | http://127.0.0.1:9100/metrics |
| Blackbox | http://127.0.0.1:9115 |

```powershell
curl.exe -X POST http://127.0.0.1:9090/-/reload
podman compose down
```

## Study UI

```powershell
cd D:\dev\workspace\pca\study
npm install
npm run dev
```

http://127.0.0.1:43145

## Sınav alanları

| Domain | Ağırlık |
| --- | ---: |
| PromQL | 28% |
| Prometheus Fundamentals | 20% |
| Observability Concepts | 18% |
| Alerting & Dashboarding | 18% |
| Instrumentation and Exporters | 16% |
