
# Publishes the Web Admin build (frontend/dist) to the S3 static website bucket (#311).
#
# Needs PowerShell and the AWS CLI with Learner Lab credentials. Without them,
# upload dist/ through the S3 console (option B of docs/arquitetura/runbook-web-s3.md).
#
# Usage (from the repository root):
#   .\infra\aws\web\deploy-web.ps1 -WhatIf       # shows what would be uploaded and DELETED, changes nothing
#   .\infra\aws\web\deploy-web.ps1               # shows the plan and asks for confirmation
#   .\infra\aws\web\deploy-web.ps1 -Force        # skips the confirmation (CI or repeated runs)
#   .\infra\aws\web\deploy-web.ps1 -Bucket fieldops-web-404nf -SkipBuild
#
# The sync uses --delete: every object of the bucket that is not in dist/ is removed.
# That is why the script prints the destination and the number of deletions before it changes anything.
#
# The Learner Lab credentials (AWS Details > AWS CLI) are temporary and secret:
# keep them in ~/.aws/credentials only, never in the repository.

[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [string]$Bucket = 'fieldops-web-404nf',
    [string]$Region = 'us-east-1',
    [switch]$SkipBuild,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

# Windows PowerShell 5.1 draws a progress bar for every Invoke-WebRequest
# and becomes very slow with it.
$ProgressPreference = 'SilentlyContinue'

if ($Force) {
    $ConfirmPreference = 'None'
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$frontend = Join-Path $repoRoot 'frontend'
$dist = Join-Path $frontend 'dist'
$hashedAssetsCache = 'public,max-age=31536000,immutable'

function Invoke-Aws {
    & aws @args

    if ($LASTEXITCODE -ne 0) {
        throw "aws $($args -join ' ') failed with exit code $LASTEXITCODE"
    }
}

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw 'AWS CLI not found. Install it from https://aws.amazon.com/cli/ or upload dist/ through the S3 console.'
}

# A typo in -Bucket could sync --delete into somebody else's bucket,
# so reject malformed names early.
if ($Bucket -notmatch '^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$') {
    throw "Invalid bucket name '$Bucket'."
}

Write-Host 'Checking the AWS credentials...'
Invoke-Aws sts get-caller-identity --query Arn --output text

if (-not $SkipBuild) {
    Push-Location $frontend

    try {
        if (-not (Test-Path 'node_modules')) {
            Write-Host 'Installing dependencies (npm ci)...'
            npm ci --no-audit --no-fund

            if ($LASTEXITCODE -ne 0) {
                throw 'npm ci failed'
            }
        }

        Write-Host 'Building the production bundle...'
        npm run build

        if ($LASTEXITCODE -ne 0) {
            throw 'npm run build failed'
        }
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path (Join-Path $dist 'index.html'))) {
    throw "dist/index.html not found in $dist. Run without -SkipBuild."
}

$distRoot = (Resolve-Path $dist).Path

# Dry run first: it changes nothing and tells how many objects
# the --delete operation will remove.
$plan = @(
    Invoke-Aws s3 sync `
        $distRoot `
        "s3://$Bucket" `
        --region $Region `
        --delete `
        --exclude 'index.html' `
        --dryrun
)

$uploads = @(
    $plan | Where-Object { $_ -match 'upload:' }
).Count

$deletes = @(
    $plan | Where-Object { $_ -match 'delete:' }
)

Write-Host ''
Write-Host "Destination : s3://$Bucket ($Region)"
Write-Host "To upload  : $uploads new or changed file(s), plus index.html"
Write-Host "To DELETE  : $($deletes.Count) object(s) in the bucket that are not in the build"

$deletes | Select-Object -First 10 | ForEach-Object {
    Write-Host "              $_"
}

if ($deletes.Count -gt 10) {
    Write-Host "              ... and $($deletes.Count - 10) more"
}

Write-Host ''

if (-not $PSCmdlet.ShouldProcess(
    "s3://$Bucket",
    "publish dist/ and delete $($deletes.Count) object(s) not in the build"
)) {
    return
}

# Hashed assets never change under the same name:
# cache them for a year.
#
# The full sync comes first and is the only step that deletes. The delete filters of aws s3 sync also
# apply to the destination, so excluding *.js or *.css here would leave the old bundles in the bucket
# even though the plan above lists them. index.html is excluded because it must have no-cache.
Write-Host "Syncing the build to s3://$Bucket ..."

Invoke-Aws s3 sync `
    $distRoot `
    "s3://$Bucket" `
    --region $Region `
    --delete `
    --exclude 'index.html' `
    --cache-control $hashedAssetsCache

# Windows can guess the wrong MIME type for .js and .css, and browsers refuse such scripts and styles.
# Re-send them with an explicit type instead of trusting the guess.
foreach ($rule in @(
    @{ Pattern = '*.js'; Type = 'application/javascript' },
    @{ Pattern = '*.css'; Type = 'text/css' }
)) {
    Write-Host "Uploading $($rule.Pattern) files with MIME type $($rule.Type)..."

    Invoke-Aws s3 cp `
        $distRoot `
        "s3://$Bucket" `
        --region $Region `
        --recursive `
        --exclude '*' `
        --include $rule.Pattern `
        --cache-control $hashedAssetsCache `
        --content-type $rule.Type
}

# index.html points at the current asset hashes,
# so it must always be revalidated.
Write-Host 'Uploading index.html ...'

Invoke-Aws s3 cp `
    (Join-Path $distRoot 'index.html') `
    "s3://$Bucket/index.html" `
    --region $Region `
    --cache-control 'no-cache' `
    --content-type 'text/html; charset=utf-8'

# Check MIME types for every JavaScript and CSS file.
$site = "http://$Bucket.s3-website-$Region.amazonaws.com"

# text/javascript is the current standard type and application/javascript is the legacy one.
# Browsers accept both, so the check must not fail on either.
$expectedType = @{
    '.js'  = '^(application|text)/javascript$'
    '.css' = '^text/css$'
}

$styleAndScripts = Get-ChildItem $distRoot -Recurse -File |
    Where-Object {
        $expectedType.ContainsKey($_.Extension.ToLowerInvariant())
    }

$wrong = @()

foreach ($file in $styleAndScripts) {
    $relative = $file.FullName.Substring($distRoot.Length).
        TrimStart('\', '/').
        Replace('\', '/')

    try {
        $response = Invoke-WebRequest `
            -Uri "$site/$relative" `
            -Method Head `
            -UseBasicParsing

        $type = [string]$response.Headers['Content-Type']
    }
    catch {
        $wrong += "$relative (could not be read: $($_.Exception.Message))"
        continue
    }

    # Ignore parameters such as charset and compare the MIME type itself.
    $actualMime = ($type -split ';')[0].Trim().ToLowerInvariant()
    $expectedMime = $expectedType[$file.Extension.ToLowerInvariant()]

    if ($actualMime -notmatch $expectedMime) {
        $wrong += "$relative served as '$type'; expected a match for '$expectedMime'"
    }
}

if ($wrong.Count -gt 0) {
    throw "Wrong MIME type or unreadable file(s) on $site :`n  $($wrong -join "`n  ")"
}

Write-Host ''
Write-Host "Done. Checked the MIME type of $(@($styleAndScripts).Count) script/style file(s)." -ForegroundColor Green
Write-Host "Website endpoint: $site"
