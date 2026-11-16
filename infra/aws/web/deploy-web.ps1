# Publishes the Web Admin build (frontend/dist) to the S3 static website bucket (#311).
#
# Usage (from the repository root, with Learner Lab credentials configured for the AWS CLI):
#   .\infra\aws\web\deploy-web.ps1
#   .\infra\aws\web\deploy-web.ps1 -Bucket fieldops-web-404nf -SkipBuild
#
# The Learner Lab credentials (AWS Details > AWS CLI) are temporary and secret: keep them in
# ~/.aws/credentials only, never in the repository.
[CmdletBinding()]
param(
    [string]$Bucket = 'fieldops-web-404nf',
    [string]$Region = 'us-east-1',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$frontend = Join-Path $repoRoot 'frontend'
$dist = Join-Path $frontend 'dist'

function Invoke-Aws {
    & aws @args
    if ($LASTEXITCODE -ne 0) { throw "aws $($args -join ' ') failed with exit code $LASTEXITCODE" }
}

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw 'AWS CLI not found. Install it from https://aws.amazon.com/cli/ or upload dist/ through the S3 console.'
}

Write-Host 'Checking the AWS credentials...'
Invoke-Aws sts get-caller-identity --query Arn --output text

if (-not $SkipBuild) {
    Push-Location $frontend
    try {
        if (-not (Test-Path 'node_modules')) {
            Write-Host 'Installing dependencies (npm ci)...'
            npm ci --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
        }
        Write-Host 'Building the production bundle...'
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'npm run build failed' }
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path (Join-Path $dist 'index.html'))) {
    throw "dist/index.html not found in $dist. Run without -SkipBuild."
}

# Hashed assets never change under the same name: cache them for a year.
# index.html points at the current hashes, so it must always be revalidated.
Write-Host "Uploading hashed assets to s3://$Bucket ..."
Invoke-Aws s3 sync $dist "s3://$Bucket" --region $Region --delete --exclude 'index.html' --cache-control 'public,max-age=31536000,immutable'

Write-Host 'Uploading index.html ...'
Invoke-Aws s3 cp (Join-Path $dist 'index.html') "s3://$Bucket/index.html" --region $Region --cache-control 'no-cache' --content-type 'text/html; charset=utf-8'

# Windows can map .js to the wrong MIME type, which makes browsers refuse the script.
$script = Get-ChildItem (Join-Path $dist 'assets') -Filter '*.js' | Select-Object -First 1
if ($script) {
    $type = (aws s3api head-object --bucket $Bucket --key "assets/$($script.Name)" --region $Region --query ContentType --output text)
    if ($type -notmatch 'javascript') {
        Write-Warning "assets/$($script.Name) was uploaded as '$type'. Re-upload the .js files with --content-type application/javascript."
    }
}

Write-Host "Done. Website endpoint: http://$Bucket.s3-website-$Region.amazonaws.com"
