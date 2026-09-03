# Daily log

One entry a day. Two minutes to write, and it's the only honest record of
whether the plan is actually happening.

## Template

```markdown
### Day N — YYYY-MM-DD  (Xh Ym)

**Covered:** …
**Lab:** what I actually ran, and what broke
**Drills:** set NN — ✅ n / 🟡 n / ❌ n
**Confusing:** the thing I still can't explain out loud
**Tomorrow:** …
```

---

### Day 1 — 2026-09-02

**Covered:** Repo scaffolded. Exam blueprint read, domain weights noted
(PromQL 28% is the priority). Exam simulator built under `content/exam/simulator/`.
**Lab:** Stack up, but nothing reachable from the browser — every port refused
while every container was healthy. Cause: the Podman machine was **rootful**, so
ports were published with kernel DNAT and no listening socket existed for WSL2 to
mirror onto Windows. Switching the machine to rootless fixed all of it. Written up
in `lab/README.md`. Prometheus and Grafana both up now.
**Drills:** —
**Confusing:** Nothing about Prometheus yet — this was all Podman-on-Windows
plumbing. Worth remembering as a debugging lesson though: the three-command split
(published? / listening on host? / alive inside?) found it in one round, because
each command cut the problem in half instead of guessing.
**Tomorrow:** Observability concepts; drill 01.

---

<!-- New entries go above this line, newest first, or below it if I prefer
     chronological. Pick one and stick to it. -->
