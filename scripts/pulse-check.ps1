param (
    [string]$ScreenshotPath = ""
)

"--- DASH24 TELEMETRY: $(Get-Date) ---" | Out-File -FilePath pulse_log.md -Encoding utf8
"## 1. GIT DIFF (Integration)" | Out-File -FilePath pulse_log.md -Append -Encoding utf8
git diff main..integration | Out-File -FilePath pulse_log.md -Append -Encoding utf8
"## 2. ACTIVE ERRORS" | Out-File -FilePath pulse_log.md -Append -Encoding utf8
npx tsc --noEmit 2>&1 | Out-File -FilePath pulse_log.md -Append -Encoding utf8
"## 3. COMPONENT AUDIT" | Out-File -FilePath pulse_log.md -Append -Encoding utf8
Get-ChildItem src/components/GlobalHeader.tsx, src/components/BrandCard.tsx, src/components/CartDrawer.tsx, src/store/useCartStore.ts | Select-Object Name, Length, LastWriteTime | Out-File -FilePath pulse_log.md -Append -Encoding utf8

if (![string]::IsNullOrEmpty($ScreenshotPath)) {
    "## 4. VISUAL SNAPSHOT" | Out-File -FilePath pulse_log.md -Append -Encoding utf8
    "![Visual Snapshot]($ScreenshotPath)" | Out-File -FilePath pulse_log.md -Append -Encoding utf8
}

Get-Content pulse_log.md | Out-File -FilePath public/AUDIT_LOG.md -Append -Encoding utf8
"---" | Out-File -FilePath public/AUDIT_LOG.md -Append -Encoding utf8
