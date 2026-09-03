# Kind cluster (optional, PCA Kubernetes SD)

Podman Desktop already has `kind` and `kubectl`. The compose lab is enough for the exam.
Use Kind only when you want to practice `kubernetes_sd_configs`.

## Create the cluster (Podman provider)

```powershell
$env:KIND_EXPERIMENTAL_PROVIDER = "podman"
kind create cluster --config k8s/kind-cluster.yaml
kubectl cluster-info
```

## What the exam actually asks

You do **not** need a full kube-prometheus-stack install. You need to recognize:

- `kubernetes_sd_configs` roles: `node`, `pod`, `service`, `endpoints`, `endpointslice`, `ingress`. There is no `deployment` role.
- Relabeling from `__meta_kubernetes_*` labels
- The `prometheus.io/scrape` annotation pattern

See `lab/prometheus/examples/kubernetes-sd.yml`.

## Tear down

```powershell
kind delete cluster --name pca
```

Give the Podman machine breathing room: this Kind cluster is two extra containers on top of the eight-container compose stack. With 16 GB allocated to the machine that is fine; pause compose first if Windows starts swapping.
