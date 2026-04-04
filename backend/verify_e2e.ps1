$resultPath = 'C:\Mars\mars\backend\verification-result.json'
$jobLogPath = 'C:\Mars\mars\backend\verification-job.log'
$currentStep = 'boot'
$port = 8010
$baseUrl = "http://127.0.0.1:$port/api"

if (Test-Path -LiteralPath $resultPath) {
    Remove-Item -LiteralPath $resultPath -Force
}

if (Test-Path -LiteralPath $jobLogPath) {
    Remove-Item -LiteralPath $jobLogPath -Force
}

$job = Start-Job -ScriptBlock {
    param($launchPort)
    Set-Location 'C:\Mars\mars\backend'
    & 'C:\Mars\mars\backend\.venv\Scripts\python.exe' -m uvicorn server:app --host 127.0.0.1 --port $launchPort
} -ArgumentList $port

function Invoke-JsonRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $params = @{
        Method = $Method
        Uri = $Uri
        Headers = $Headers
    }

    if ($null -ne $Body) {
        $params.ContentType = 'application/json'
        $params.Body = ($Body | ConvertTo-Json -Depth 8 -Compress)
    }

    return Invoke-RestMethod @params
}

try {
    $currentStep = 'wait_for_backend'
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        try {
            $null = Invoke-RestMethod -Method Get -Uri "$baseUrl/events"
            $ready = $true
            break
        } catch {
            if ($job.State -in @('Failed', 'Stopped', 'Completed')) {
                break
            }
        }
    }

    if (-not $ready) {
        throw "Backend did not become ready on $baseUrl/events"
    }

    $currentStep = 'subscribe_first'
    $subscriptionOne = Invoke-JsonRequest -Method Post -Uri "$baseUrl/subscriptions" -Body @{
        email = 'fan.subscribe@example.com'
        source = 'subscribe-page'
    }

    $currentStep = 'subscribe_second'
    $subscriptionTwo = Invoke-JsonRequest -Method Post -Uri "$baseUrl/subscriptions" -Body @{
        email = 'fan.subscribe@example.com'
        source = 'footer'
    }

    $currentStep = 'seed_admin'
    $seed = Invoke-JsonRequest -Method Post -Uri "$baseUrl/admin/seed" -Headers @{
        'x-setup-key' = 'mars-admin-setup'
    }

    $currentStep = 'admin_login'
    $login = Invoke-JsonRequest -Method Post -Uri "$baseUrl/admin/login" -Body @{
        email = 'admin@brunomars.com'
        password = 'admin123'
    }

    $authHeaders = @{ Authorization = "Bearer $($login.token)" }

    $currentStep = 'load_events'
    $events = Invoke-RestMethod -Method Get -Uri "$baseUrl/events"
    if (-not $events -or $events.Count -eq 0) {
        throw 'No events returned from /api/events'
    }

    $event = $events[0]
    $currentStep = 'load_event_details'
    $eventDetails = Invoke-RestMethod -Method Get -Uri ("$baseUrl/events/{0}" -f $event.id)
    $ticket = $eventDetails.tickets | Where-Object { $_.type -eq 'vip' } | Select-Object -First 1
    if (-not $ticket) {
        $ticket = $eventDetails.tickets | Select-Object -First 1
    }
    if (-not $ticket) {
        throw 'No ticket types returned for selected event'
    }

    $currentStep = 'create_booking'
    $booking = Invoke-JsonRequest -Method Post -Uri "$baseUrl/bookings" -Body @{
        event_id = $event.id
        ticket_type = $ticket.type
        customer_name = 'Test Fan'
        email = 'testfan@example.com'
        phone = '+1 555 010 2026'
        quantity = 2
        message = 'Verification booking request'
    }

    $currentStep = 'load_initial_status'
    $initialStatus = Invoke-RestMethod -Method Get -Uri ("$baseUrl/bookings/{0}" -f $booking.confirmation_number)

    $currentStep = 'approve_booking'
    $approved = Invoke-JsonRequest -Method Put -Uri ("$baseUrl/admin/bookings/{0}/approve" -f $booking.id) -Headers $authHeaders -Body @{
        payment_method = 'cashapp'
        payment_instructions = 'Send payment to $bruno-test'
        admin_notes = 'Approved during end-to-end verification'
    }

    $currentStep = 'submit_payment_update'
    $paymentUpdate = Invoke-JsonRequest -Method Post -Uri ("$baseUrl/bookings/{0}/payment-update" -f $booking.confirmation_number) -Body @{
        payment_method = 'cashapp'
        transaction_id = 'PAYMENT-UPDATE-20260404'
        payment_amount = 5000
        proof_url = 'https://example.com/proof'
        notes = 'Customer payment update verification'
    }

    $currentStep = 'mark_paid'
    $paid = Invoke-JsonRequest -Method Put -Uri ("$baseUrl/admin/bookings/{0}/mark-paid" -f $booking.id) -Headers $authHeaders -Body @{
        transaction_id = 'TEST-TXN-20260404'
        admin_notes = 'Marked paid during verification'
    }

    $currentStep = 'confirm_booking'
    $confirmed = Invoke-JsonRequest -Method Put -Uri ("$baseUrl/admin/bookings/{0}/confirm" -f $booking.id) -Headers $authHeaders -Body @{
        admin_notes = 'Confirmed during verification'
    }

    $currentStep = 'load_final_status'
    $finalStatus = Invoke-RestMethod -Method Get -Uri ("$baseUrl/bookings/{0}" -f $booking.confirmation_number)
    $currentStep = 'load_dashboard'
    $dashboard = Invoke-RestMethod -Method Get -Uri "$baseUrl/admin/dashboard" -Headers $authHeaders

    [PSCustomObject]@{
        subscription_first = $subscriptionOne.status
        subscription_second = $subscriptionTwo.status
        seeded_admin = $seed.email
        login_email = $login.email
        chosen_event = "{0} | {1} | {2}" -f $event.date, $event.venue, $event.city
        chosen_ticket = $ticket.type
        confirmation_number = $booking.confirmation_number
        initial_status = $initialStatus.booking.status
        approved_status = $approved.status
        payment_update_reference = $paymentUpdate.customer_payment_reference
        paid_status = $paid.status
        final_status = $finalStatus.booking.status
        dashboard_confirmed_count = $dashboard.confirmed_count
        dashboard_total_requests = $dashboard.total_requests
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $resultPath
}
catch {
    $responseBody = $null
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
    }
    [PSCustomObject]@{
        step = $currentStep
        error = $_.Exception.Message
        response = $responseBody
    } | ConvertTo-Json | Set-Content -LiteralPath $resultPath
}
finally {
    if ($job) {
        Receive-Job -Job $job -Keep -ErrorAction SilentlyContinue | Set-Content -LiteralPath $jobLogPath
        Stop-Job -Job $job -ErrorAction SilentlyContinue | Out-Null
        Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    }
}
