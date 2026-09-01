$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8080

function Get-ContentType([string]$path) {
  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.htm'  { 'text/html; charset=utf-8' }
    '.js'   { 'text/javascript; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.jpg'  { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.png'  { 'image/png' }
    '.gif'  { 'image/gif' }
    '.webp' { 'image/webp' }
    '.svg'  { 'image/svg+xml' }
    '.mp4'  { 'video/mp4' }
    '.webm' { 'video/webm' }
    '.mov'  { 'video/quicktime' }
    '.pdf'  { 'application/pdf' }
    '.zip'  { 'application/zip' }
    default { 'application/octet-stream' }
  }
}

function Send-Response($stream,[int]$status,[string]$statusText,[hashtable]$headers,[byte[]]$body) {
  $sb = New-Object Text.StringBuilder
  [void]$sb.Append("HTTP/1.1 $status $statusText`r`n")
  foreach($k in $headers.Keys){ [void]$sb.Append("$k`: $($headers[$k])`r`n") }
  [void]$sb.Append("Content-Length: $($body.Length)`r`nConnection: close`r`n`r`n")
  $head = [Text.Encoding]::ASCII.GetBytes($sb.ToString())
  $stream.Write($head,0,$head.Length)
  if($body.Length -gt 0){$stream.Write($body,0,$body.Length)}
  $stream.Flush()
}

try {
  $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$port)
  $listener.Start()
} catch {
  Write-Host "Could not start TRJ website on port $port." -ForegroundColor Red
  Write-Host "Close any old TRJ server window and try again." -ForegroundColor Yellow
  Write-Host $_.Exception.Message
  Read-Host 'Press ENTER to close'
  exit 1
}

Write-Host "TRJ VISUAL GALLERY is running" -ForegroundColor Green
Write-Host "Customer Website: http://localhost:$port/"
Write-Host "Admin Page:       http://localhost:$port/admin.html"
Write-Host "Keep this window open while using the website." -ForegroundColor Yellow
Write-Host "Close this window to stop the local website."
Start-Process "http://localhost:$port/"

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object IO.StreamReader($stream,[Text.Encoding]::ASCII,$false,4096,$true)
    $requestLine = $reader.ReadLine()
    if([string]::IsNullOrWhiteSpace($requestLine)){ continue }
    $headers = @{}
    while($true){
      $line=$reader.ReadLine(); if([string]::IsNullOrEmpty($line)){break}
      $idx=$line.IndexOf(':'); if($idx -gt 0){$headers[$line.Substring(0,$idx).Trim().ToLowerInvariant()]=$line.Substring($idx+1).Trim()}
    }
    $parts=$requestLine.Split(' ')
    $method=$parts[0]; $target=$parts[1]
    if($method -notin @('GET','HEAD')){Send-Response $stream 405 'Method Not Allowed' @{'Content-Type'='text/plain'} ([Text.Encoding]::UTF8.GetBytes('Method Not Allowed')); continue}

    $pathOnly=$target.Split('?')[0]
    $query=''; if($target.Contains('?')){$query=$target.Substring($target.IndexOf('?')+1)}
    $isDownload = $pathOnly -eq '/__download'
    $requestedName = $null
    if($isDownload){
      $pairs=@{}
      foreach($p in $query.Split('&')){if($p.Contains('=')){ $kv=$p.Split('=',2); $pairs[$kv[0]]=[Uri]::UnescapeDataString($kv[1].Replace('+',' ')) }}
      $rel=$pairs['path']; $requestedName=$pairs['name']
    } else {
      $rel=[Uri]::UnescapeDataString($pathOnly.TrimStart('/'))
      if([string]::IsNullOrWhiteSpace($rel)){$rel='index.html'}
    }
    $rel=$rel.Replace('/',[IO.Path]::DirectorySeparatorChar)
    $full=[IO.Path]::GetFullPath((Join-Path $root $rel))
    $rootFull=[IO.Path]::GetFullPath($root+[IO.Path]::DirectorySeparatorChar)
    if(-not $full.StartsWith($rootFull,[StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $full -PathType Leaf)){
      Send-Response $stream 404 'Not Found' @{'Content-Type'='text/plain; charset=utf-8'} ([Text.Encoding]::UTF8.GetBytes('Not Found')); continue
    }

    $all=[IO.File]::ReadAllBytes($full)
    $ctype=Get-ContentType $full
    $respHeaders=@{'Content-Type'=$ctype;'Cache-Control'='no-cache';'Accept-Ranges'='bytes'}
    if($isDownload){
      if([string]::IsNullOrWhiteSpace($requestedName)){$requestedName=[IO.Path]::GetFileName($full)}
      $safeName=$requestedName.Replace('"','')
      $respHeaders['Content-Disposition']="attachment; filename=\"$safeName\"; filename*=UTF-8''$([Uri]::EscapeDataString($safeName))"
    }

    $body=$all; $status=200; $statusText='OK'
    if($headers.ContainsKey('range') -and $headers['range'] -match '^bytes=(\d*)-(\d*)$'){
      $start=if($matches[1]){[int64]$matches[1]}else{0}
      $end=if($matches[2]){[int64]$matches[2]}else{$all.LongLength-1}
      if($start -lt 0){$start=0}; if($end -ge $all.LongLength){$end=$all.LongLength-1}
      if($start -le $end){
        $len=[int]($end-$start+1); $body=New-Object byte[] $len; [Array]::Copy($all,$start,$body,0,$len)
        $status=206; $statusText='Partial Content'; $respHeaders['Content-Range']="bytes $start-$end/$($all.LongLength)"
      }
    }
    if($method -eq 'HEAD'){$body=[byte[]]@()}
    Send-Response $stream $status $statusText $respHeaders $body
  } catch {
    try{Send-Response $stream 500 'Internal Server Error' @{'Content-Type'='text/plain'} ([Text.Encoding]::UTF8.GetBytes($_.Exception.Message))}catch{}
  } finally {
    try{$stream.Dispose()}catch{}; try{$client.Close()}catch{}
  }
}
