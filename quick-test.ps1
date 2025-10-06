# PowerShell Railway Deployment Test
# Quick automated test for Railway deployment

$RAILWAY_URL = "https://fixwell.ca"

Write-Host "🚀 Quick Railway Deployment Test" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        $status = if ($response.StatusCode -eq 200) { "✅" } else { "❌" }
        Write-Host "🔍 $Description`: $status ($($response.StatusCode))" -ForegroundColor $(if ($response.StatusCode -eq 200) { "Green" } else { "Red" })
        return $response.StatusCode -eq 200
    }
    catch {
        Write-Host "🔍 $Description`: ❌ (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

Write-Host "🎯 Testing: $RAILWAY_URL" -ForegroundColor Cyan
Write-Host ""

$tests = @(
    @("$RAILWAY_URL/health", "Health Check"),
    @("$RAILWAY_URL/api/stripe-test/test-stripe", "Stripe Connection"),
    @("$RAILWAY_URL/api/admin/email-templates/campaigns", "Email Campaigns"),
    @("$RAILWAY_URL/stripe-test.html", "Stripe Web Interface")
)

$passed = 0

foreach ($test in $tests) {
    $url = $test[0]
    $description = $test[1]
    $success = Test-Endpoint -Url $url -Description $description
    if ($success) { $passed++ }
}

Write-Host ""
Write-Host "📊 Results: $passed/$($tests.Count) tests passed" -ForegroundColor Cyan

if ($passed -eq $tests.Count) {
    Write-Host "🎉 All tests passed! Deployment is working." -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Test your Stripe integration:" -ForegroundColor Yellow
    Write-Host "   $RAILWAY_URL/stripe-test.html" -ForegroundColor Blue
    Write-Host ""
    Write-Host "💳 Test card numbers:" -ForegroundColor Yellow
    Write-Host "   4242424242424242 - Visa Success" -ForegroundColor Blue
    Write-Host "   4000000000000002 - Card Declined" -ForegroundColor Blue
    Write-Host "   4000000000009995 - Insufficient Funds" -ForegroundColor Blue
} else {
    Write-Host "⚠️  Some tests failed. Deployment may still be in progress." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Wait a few more minutes and try again." -ForegroundColor Yellow
}
