# Render the lab journal to a self-contained HTML file and a PDF.
# Asciidoctor runs in a container, so nothing needs installing on Windows.
#
#   .\journal\render.ps1
#
# The repository root is mounted (not journal/), because entries include::
# files from lab/. Output goes to build/, which is git-ignored.

$ErrorActionPreference = "Stop"
$root  = Split-Path -Parent $PSScriptRoot
$image = "docker.io/asciidoctor/docker-asciidoctor"

Write-Host "Rendering from $root" -ForegroundColor Cyan

# -a data-uri embeds the screenshots, so the HTML is one shareable file.
podman run --rm -v "${root}:/documents" $image `
  asciidoctor -a data-uri -a toc=left -a icons=font `
  -D /documents/build -o pca-lab-journal.html journal/index.adoc

podman run --rm -v "${root}:/documents" $image `
  asciidoctor-pdf `
  -D /documents/build -o pca-lab-journal.pdf journal/index.adoc

Write-Host "`nbuild\pca-lab-journal.html" -ForegroundColor Green
Write-Host "build\pca-lab-journal.pdf"   -ForegroundColor Green
