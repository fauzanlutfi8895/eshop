# Pre-Docker Testing Script
# Run this to test services locally before building Docker images

param(
    [switch]$Quick,
    [string]$Service
)

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Success "`n=== E-Shop Pre-Docker Test Suite ===`n"

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "✓ Node.js installed: $nodeVersion"
} catch {
    Write-Error "✗ Node.js not found. Please install Node.js 20+"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "✓ npm installed: $npmVersion"
} catch {
    Write-Error "✗ npm not found"
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Info "`nInstalling dependencies..."
    npm install
}

Write-Success "`n=== Building Services ===`n"

# Function to build a service
function Build-NxService {
    param([string]$ServiceName)
    
    Write-Info "Building $ServiceName..."
    
    try {
        npx nx build $ServiceName --prod 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ $ServiceName built successfully"
            return $true
        } else {
            Write-Error "✗ Failed to build $ServiceName"
            return $false
        }
    } catch {
        Write-Error "✗ Error building $ServiceName"
        return $false
    }
}

# List of services to build
$backendServices = @(
    "auth-service",
    "product-service",
    "user-service",
    "admin-service",
    "order-service",
    "seller-service",
    "recommendation-service",
    "chatting-service",
    "kafka-service",
    "logger-service",
    "api-gateway"
)

$frontendServices = @(
    "user-ui",
    "seller-ui",
    "admin-ui"
)

$buildResults = @{}

# Build services
if ($Service) {
    # Build specific service
    Write-Info "`nBuilding $Service...`n"
    $result = Build-NxService -ServiceName $Service
    $buildResults[$Service] = $result
} elseif ($Quick) {
    # Quick test - build only essential services
    Write-Info "`nQuick test mode - building essential services...`n"
    
    $essentialServices = @("auth-service", "product-service", "api-gateway", "user-ui")
    
    foreach ($service in $essentialServices) {
        $result = Build-NxService -ServiceName $service
        $buildResults[$service] = $result
    }
} else {
    # Build all backend services
    Write-Info "`nBuilding all backend services...`n"
    
    foreach ($service in $backendServices) {
        $result = Build-NxService -ServiceName $service
        $buildResults[$service] = $result
    }
    
    # Build all frontend services
    Write-Info "`nBuilding all frontend services...`n"
    
    foreach ($service in $frontendServices) {
        $result = Build-NxService -ServiceName $service
        $buildResults[$service] = $result
    }
}

# Summary
Write-Success "`n=== Build Summary ===`n"

$successCount = 0
$failCount = 0

foreach ($service in $buildResults.Keys) {
    if ($buildResults[$service]) {
        Write-Success "✓ $service"
        $successCount++
    } else {
        Write-Error "✗ $service"
        $failCount++
    }
}

Write-Info "`nTotal: $($buildResults.Count) | Success: $successCount | Failed: $failCount`n"

if ($failCount -eq 0) {
    Write-Success "=== All builds successful! ===`n"
    Write-Info "You can now build Docker images with:"
    Write-Info "  npm run docker:build`n"
    Write-Info "Or test with Docker:"
    Write-Info "  npm run docker:test`n"
    exit 0
} else {
    Write-Error "=== Some builds failed ===`n"
    Write-Info "Please fix the errors before building Docker images.`n"
    Write-Info "To see detailed errors, run:"
    Write-Info "  npx nx build <service-name> --prod`n"
    exit 1
}
