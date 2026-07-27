# Local dev preview only - GitHub Pages serves static files; this script never runs in production.
param(
    [int]$Port = 8080,
    [string]$Root = $PSScriptRoot
)

$requestedPort = $Port
$script:shuttingDown = $false

$mime = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".pdf"   = "application/pdf"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".webp"  = "image/webp"
    ".mp4"   = "video/mp4"
    ".mov"   = "video/quicktime"
    ".webm"  = "video/webm"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
}

function Write-Safe {
    param([IO.Stream]$Stream, [byte[]]$Buffer, [int]$Offset, [int]$Count)
    try {
        $Stream.Write($Buffer, $Offset, $Count)
        return $true
    }
    catch [System.Net.HttpListenerException] { return $false }
    catch [System.IO.IOException] { return $false }
}

function Send-Bytes {
    param($Response, [byte[]]$Bytes, [int]$StatusCode = 200)
    $Response.StatusCode = $StatusCode
    $Response.ContentLength64 = $Bytes.Length
    [void](Write-Safe $Response.OutputStream $Bytes 0 $Bytes.Length)
}

function Send-File {
    param($Request, $Response, [string]$FilePath, [string]$ContentType)

    $total = (Get-Item -LiteralPath $FilePath).Length
    $Response.ContentType = $ContentType
    $Response.AddHeader("Accept-Ranges", "bytes")

    $start = 0
    $end = $total - 1
    $range = $Request.Headers["Range"]

    if ($range -match '^bytes=(\d+)-(\d*)$') {
        $start = [int64]$Matches[1]
        if ($Matches[2]) { $end = [int64]$Matches[2] }
        if ($end -ge $total) { $end = $total - 1 }
        if ($start -gt $end -or $start -ge $total) {
            $Response.StatusCode = 416
            $Response.AddHeader("Content-Range", "bytes */$total")
            return
        }
        $Response.StatusCode = 206
        $Response.ContentLength64 = $end - $start + 1
        $Response.AddHeader("Content-Range", "bytes $start-$end/$total")
    }
    else {
        $Response.StatusCode = 200
        $Response.ContentLength64 = $total
    }

    $input = [IO.File]::OpenRead($FilePath)
    try {
        [void]$input.Seek($start, [IO.SeekOrigin]::Begin)
        $remaining = $end - $start + 1
        $buffer = New-Object byte[] 65536
        while ($remaining -gt 0 -and -not $script:shuttingDown) {
            $toRead = [Math]::Min($buffer.Length, $remaining)
            $read = $input.Read($buffer, 0, $toRead)
            if ($read -le 0) { break }
            if (-not (Write-Safe $Response.OutputStream $buffer 0 $read)) { break }
            $remaining -= $read
        }
    }
    finally {
        $input.Close()
    }
}

function Handle-Request {
    param($Context)

    $request = $Context.Request
    $response = $Context.Response

    try {
        $path = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($path -eq "/") { $path = "/index.html" }

        $filePath = Join-Path $Root ($path.TrimStart("/") -replace "/", [IO.Path]::DirectorySeparatorChar)
        $filePath = [IO.Path]::GetFullPath($filePath)
        $rootFull = [IO.Path]::GetFullPath($Root)

        if (-not $filePath.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
            Send-Bytes $response ([Text.Encoding]::UTF8.GetBytes("403 Forbidden")) 403
            return
        }

        if (Test-Path -LiteralPath $filePath -PathType Container) {
            $filePath = Join-Path $filePath "index.html"
        }

        if (Test-Path -LiteralPath $filePath -PathType Leaf) {
            $ext = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
            $contentType = $mime[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }
            Send-File $request $response $filePath $contentType
        }
        else {
            Send-Bytes $response ([Text.Encoding]::UTF8.GetBytes("404 Not Found")) 404
        }
    }
    catch [System.Net.HttpListenerException] { }
    catch [System.IO.IOException] { }
    catch {
        if ($script:shuttingDown) { return }
        Write-Host "Request error: $($_.Exception.Message)"
        try {
            if (-not $response.OutputStream.CanWrite) { return }
            Send-Bytes $response ([Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")) 500
        }
        catch { }
    }
    finally {
        try { $response.Close() } catch { }
    }
}

function Stop-Server {
    if ($script:shuttingDown) { return }
    $script:shuttingDown = $true
    Write-Host ""
    Write-Host "Stopping..."
    if ($null -ne $script:listener -and $script:listener.IsListening) {
        $script:listener.Stop()
    }
}

$script:listener = $null
$started = $false

for ($tryPort = $requestedPort; $tryPort -lt ($requestedPort + 20); $tryPort++) {
    $candidate = New-Object System.Net.HttpListener
    foreach ($bindHost in @("localhost", "127.0.0.1", "[::1]")) {
        $candidate.Prefixes.Add("http://${bindHost}:$tryPort/")
    }
    try {
        $candidate.Start()
        $script:listener = $candidate
        $Port = $tryPort
        $started = $true
        break
    }
    catch {
        $candidate.Close()
        if ($tryPort -eq ($requestedPort + 19)) {
            Write-Error "No free port found between $requestedPort and $($requestedPort + 19). Close other servers or pass -Port 9000"
            exit 1
        }
    }
}

Write-Host "Serving: $Root"
if ($Port -ne $requestedPort) {
    Write-Host "Note:    $requestedPort was busy - using $Port instead"
}
Write-Host "Open:    http://127.0.0.1:$Port/"
Write-Host "         http://localhost:$Port/"
Write-Host "Stop:    Ctrl+C once, then wait for: Server stopped."
Write-Host ""

$cancelHandler = [ConsoleCancelEventHandler] {
    param($sender, $e)
    $e.Cancel = $true
    Stop-Server
}
$script:cancelRegistered = $false
try {
    [Console]::CancelKeyPress += $cancelHandler
    $script:cancelRegistered = $true
}
catch {
    Write-Host "Note:    Ctrl+C handler unavailable here - close this terminal tab to stop."
}

try {
    while ($script:listener.IsListening -and -not $script:shuttingDown) {
        try {
            $async = $script:listener.BeginGetContext($null, $null)
            while ($script:listener.IsListening -and -not $async.IsCompleted -and -not $script:shuttingDown) {
                [void]$async.AsyncWaitHandle.WaitOne(200)
            }
            if ($script:shuttingDown -or -not $script:listener.IsListening) { break }

            $context = $script:listener.EndGetContext($async)
            Handle-Request $context
        }
        catch [System.Net.HttpListenerException] {
            if ($script:shuttingDown -or -not $script:listener.IsListening) { break }
        }
        catch {
            if ($script:shuttingDown) { break }
            Write-Host "Listener error: $($_.Exception.Message)"
        }
    }
}
finally {
    if ($script:cancelRegistered) {
        [Console]::CancelKeyPress -= $cancelHandler
    }
    if ($started -and $script:listener) {
        if ($script:listener.IsListening) { $script:listener.Stop() }
        $script:listener.Close()
    }
    Write-Host "Server stopped."
}
