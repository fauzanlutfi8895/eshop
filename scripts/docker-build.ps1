# Docker Build and Test Script for Windows PowerShell

param(
    [switch]$All,
    [switch]$Test,
    [string[]]$Services
)

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Success "=== E-Shop Docker Build Script ===`n"

# Function to build a service
function Build-Service {
    param([string]$ServiceName)
    
    Write-Info "Building $ServiceName..."
    
    try {
        docker-compose build $ServiceName
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ $ServiceName built successfully`n"
            return $true
        } else {
            Write-Error "✗ Failed to build $ServiceName`n"
            return $false
        }
    } catch {
        Write-Error "✗ Error building $ServiceName : $_`n"
        return $false
    }
}

# Function to test a service
function Test-Service {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    Write-Info "Testing $ServiceName on port $Port..."
    
    # Start service
    docker-compose up -d $ServiceName
    
    # Wait for service to start
    Start-Sleep -Seconds 5
    
    # Check if container is running
    $running = docker ps --filter "name=$ServiceName" --format "{{.Names}}"
    
    if ($running -match $ServiceName) {
        Write-Success "✓ $ServiceName is running"
        
        # Try to connect to port
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($connection) {
                Write-Success "✓ $ServiceName is responding on port $Port`n"
                return $true
            } else {
                Write-Info "⚠ $ServiceName is running but port $Port is not responding`n"
                docker-compose logs --tail=20 $ServiceName
                return $false
            }
        } catch {
            Write-Info "⚠ Could not test port $Port`n"
            return $false
        }
    } else {
        Write-Error "✗ $ServiceName failed to start`n"
        docker-compose logs --tail=20 $ServiceName
        return $false
    }
}

# Build services
if ($All) {
    Write-Info "Building all services...`n"
    docker-compose build
} elseif ($Services.Count -gt 0) {
    foreach ($service in $Services) {
        Build-Service -ServiceName $service
    }
} else {
    Write-Info "No services specified. Building all services...`n"
    docker-compose build
}

# Test mode
if ($Test) {
    Write-Success "`n=== Running Tests ===`n"
    
    # Start infrastructure first
    Write-Info "Starting infrastructure services..."
    docker-compose up -d zookeeper kafka
    Start-Sleep -Seconds 10
    
    # Test backend services
    Test-Service -ServiceName "auth-service" -Port 3000
    Test-Service -ServiceName "product-service" -Port 3001
    Test-Service -ServiceName "user-service" -Port 3002
    Test-Service -ServiceName "api-gateway" -Port 4000
    
    Write-Success "`n=== Test Complete ==="
    Write-Info "Check logs with: docker-compose logs -f"
}

Write-Success "`n=== Build Complete ==="
Write-Info "To start services: docker-compose up -d"
Write-Info "To view logs: docker-compose logs -f"
Write-Info "To stop services: docker-compose down`n"
