param(
    [string]$Root,
    [switch]$DryRun,
    [switch]$SkipChatCheck,
    [switch]$RepairUserEnv
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$script:ExcludedDirNames = @(
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "dist",
    "build",
    "__pycache__"
)

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=== {0} ===" -f $Message) -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host ("[INFO] {0}" -f $Message) -ForegroundColor Gray
}

function Write-WarnLine {
    param([string]$Message)
    Write-Host ("[WARN] {0}" -f $Message) -ForegroundColor Yellow
}

function Write-ErrorLine {
    param([string]$Message)
    Write-Host ("[ERROR] {0}" -f $Message) -ForegroundColor Red
}

function Mask-Key {
    param([string]$Key)
    if ([string]::IsNullOrWhiteSpace($Key)) {
        return "<empty>"
    }

    if ($Key.Length -le 12) {
        return $Key
    }

    return "{0}...{1}" -f $Key.Substring(0, 6), $Key.Substring($Key.Length - 4)
}

function Get-ResolvedPathSafe {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $null
    }

    try {
        return (Resolve-Path -Path $Path -ErrorAction Stop).Path
    } catch {
        return $null
    }
}

function Get-AncestorPaths {
    param([string]$Path)

    $resolved = Get-ResolvedPathSafe -Path $Path
    if ([string]::IsNullOrWhiteSpace($resolved)) {
        return @()
    }

    $ancestors = New-Object System.Collections.Generic.List[string]
    $current = $resolved

    while (-not [string]::IsNullOrWhiteSpace($current)) {
        if (-not $ancestors.Contains($current)) {
            $ancestors.Add($current)
        }

        $parent = Split-Path -Path $current -Parent
        if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current) {
            break
        }

        $current = $parent
    }

    return @($ancestors.ToArray())
}

function Test-ProjectRoot {
    param([string]$Path)

    $resolved = Get-ResolvedPathSafe -Path $Path
    if ([string]::IsNullOrWhiteSpace($resolved)) {
        return [pscustomobject]@{
            IsMatch = $false
            Path = $null
            Score = 0
            Reasons = @()
        }
    }

    if (-not (Test-Path -Path $resolved -PathType Container)) {
        return [pscustomobject]@{
            IsMatch = $false
            Path = $resolved
            Score = 0
            Reasons = @()
        }
    }

    $backendMain = Join-Path $resolved "backend\main.py"
    $frontendPackage = Join-Path $resolved "frontend\package.json"
    if (-not (Test-Path -Path $backendMain -PathType Leaf) -or -not (Test-Path -Path $frontendPackage -PathType Leaf)) {
        return [pscustomobject]@{
            IsMatch = $false
            Path = $resolved
            Score = 0
            Reasons = @()
        }
    }

    $score = 100
    $reasons = New-Object System.Collections.Generic.List[string]
    $reasons.Add("backend/main.py + frontend/package.json")

    $weightedMarkers = @(
        @{ RelativePath = "start.bat"; Weight = 40 },
        @{ RelativePath = "start.sh"; Weight = 40 },
        @{ RelativePath = "MikuChat.bat"; Weight = 30 },
        @{ RelativePath = "MikuChat.command"; Weight = 30 },
        @{ RelativePath = "README.md"; Weight = 10 },
        @{ RelativePath = "backend\.env"; Weight = 10 }
    )

    foreach ($marker in $weightedMarkers) {
        $markerPath = Join-Path $resolved $marker.RelativePath
        if (Test-Path -Path $markerPath) {
            $score += $marker.Weight
            $reasons.Add($marker.RelativePath)
        }
    }

    if ((Split-Path -Path $resolved -Leaf) -ieq "MikuChat") {
        $score += 20
        $reasons.Add("folder-name:MikuChat")
    }

    return [pscustomobject]@{
        IsMatch = $true
        Path = $resolved
        Score = $score
        Reasons = @($reasons.ToArray())
    }
}

function Find-ProjectRootsUnder {
    param(
        [string]$BasePath,
        [int]$MaxDepth = 4
    )

    $resolvedBase = Get-ResolvedPathSafe -Path $BasePath
    if ([string]::IsNullOrWhiteSpace($resolvedBase) -or -not (Test-Path -Path $resolvedBase -PathType Container)) {
        return @()
    }

    $queue = New-Object System.Collections.Generic.Queue[object]
    $visited = New-Object System.Collections.Generic.HashSet[string]
    $matches = New-Object System.Collections.Generic.List[object]
    $queue.Enqueue([pscustomobject]@{ Path = $resolvedBase; Depth = 0 })

    while ($queue.Count -gt 0) {
        $item = $queue.Dequeue()
        $currentPath = $item.Path

        if (-not $visited.Add($currentPath)) {
            continue
        }

        $test = Test-ProjectRoot -Path $currentPath
        if ($test.IsMatch) {
            $matches.Add($test) | Out-Null
        }

        if ($item.Depth -ge $MaxDepth) {
            continue
        }

        try {
            $children = Get-ChildItem -Path $currentPath -Directory -Force -ErrorAction Stop
        } catch {
            continue
        }

        foreach ($child in $children) {
            if ($script:ExcludedDirNames -contains $child.Name) {
                continue
            }
            $queue.Enqueue([pscustomobject]@{
                Path = $child.FullName
                Depth = $item.Depth + 1
            })
        }
    }

    return @($matches.ToArray())
}

function Find-MikuChatFolders {
    param([string]$BasePath)

    $resolvedBase = Get-ResolvedPathSafe -Path $BasePath
    if ([string]::IsNullOrWhiteSpace($resolvedBase) -or -not (Test-Path -Path $resolvedBase -PathType Container)) {
        return @()
    }

    try {
        return Get-ChildItem -Path $resolvedBase -Directory -Recurse -Force -Filter "MikuChat" -ErrorAction Stop |
            Select-Object -ExpandProperty FullName
    } catch {
        return @()
    }
}

function Resolve-ProjectRoot {
    param([string]$PreferredRoot)

    $matchTable = @{}
    $matchList = New-Object System.Collections.Generic.List[object]

    function Add-Match {
        param([object]$Match)

        if ($null -eq $Match -or -not $Match.IsMatch -or [string]::IsNullOrWhiteSpace($Match.Path)) {
            return
        }

        if (-not $matchTable.ContainsKey($Match.Path)) {
            $matchTable[$Match.Path] = $Match
            $matchList.Add($Match) | Out-Null
        } elseif ($Match.Score -gt $matchTable[$Match.Path].Score) {
            $matchTable[$Match.Path] = $Match
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($PreferredRoot)) {
        $explicit = Test-ProjectRoot -Path $PreferredRoot
        if ($explicit.IsMatch) {
            return [pscustomobject]@{
                Selected = $explicit
                Candidates = @($explicit)
                Strategy = "explicit-root"
            }
        }

        Write-WarnLine ("Provided root is not a valid MikuChat project: {0}" -f $PreferredRoot)
    }

    $cwd = (Get-Location).Path
    $probeAncestors = New-Object System.Collections.Generic.List[string]
    foreach ($seed in @($cwd, $PSScriptRoot)) {
        foreach ($ancestor in Get-AncestorPaths -Path $seed) {
            if (-not $probeAncestors.Contains($ancestor)) {
                $probeAncestors.Add($ancestor)
            }
        }
    }

    foreach ($ancestor in $probeAncestors) {
        Add-Match -Match (Test-ProjectRoot -Path $ancestor)
    }

    if ($matchList.Count -eq 0) {
        $searchPlans = @(
            @{ Path = $cwd; Depth = 4 },
            @{ Path = $PSScriptRoot; Depth = 4 },
            @{ Path = (Split-Path -Path $cwd -Parent); Depth = 4 },
            @{ Path = (Split-Path -Path $PSScriptRoot -Parent); Depth = 4 },
            @{ Path = [Environment]::GetFolderPath("Desktop"); Depth = 5 },
            @{ Path = [Environment]::GetFolderPath("MyDocuments"); Depth = 5 }
        )

        foreach ($plan in $searchPlans) {
            foreach ($match in Find-ProjectRootsUnder -BasePath $plan.Path -MaxDepth $plan.Depth) {
                Add-Match -Match $match
            }
        }
    }

    if ($matchList.Count -eq 0 -and -not [string]::IsNullOrWhiteSpace($env:USERPROFILE)) {
        foreach ($folder in Find-MikuChatFolders -BasePath $env:USERPROFILE) {
            Add-Match -Match (Test-ProjectRoot -Path $folder)
        }
    }

    if ($matchList.Count -eq 0) {
        return $null
    }

    $selected = $matchList |
        Sort-Object `
            @{ Expression = { $_.Score }; Descending = $true }, `
            @{ Expression = { $_.Path.Length }; Descending = $false }, `
            @{ Expression = { $_.Path }; Descending = $false } |
        Select-Object -First 1

    return [pscustomobject]@{
        Selected = $selected
        Candidates = @($matchList.ToArray())
        Strategy = "auto-detected"
    }
}

function Get-WebErrorDetails {
    param([System.Management.Automation.ErrorRecord]$Record)

    $statusCode = $null
    $body = $null
    $response = $Record.Exception.Response

    if ($null -ne $response) {
        try {
            $statusCode = [int]$response.StatusCode
        } catch {
            $statusCode = $null
        }

        try {
            $stream = $response.GetResponseStream()
            if ($null -ne $stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Close()
                $stream.Close()
            }
        } catch {
            $body = $null
        }
    }

    if ([string]::IsNullOrWhiteSpace($body)) {
        $body = $Record.Exception.Message
    }

    return [pscustomobject]@{
        StatusCode = $statusCode
        Body = $body
    }
}

function Show-EnvFileContents {
    param([System.IO.FileInfo[]]$EnvFiles)

    Write-Section ".env contents"
    foreach ($file in $EnvFiles) {
        Write-Host ("--- {0} ---" -f $file.FullName) -ForegroundColor DarkCyan
        try {
            $lines = [System.IO.File]::ReadAllLines($file.FullName)
            if ($lines.Count -eq 0) {
                Write-WarnLine "<empty file>"
                continue
            }

            for ($i = 0; $i -lt $lines.Count; $i++) {
                Write-Host ("{0,4}: {1}" -f ($i + 1), $lines[$i])
            }
        } catch {
            Write-ErrorLine ("Failed to read {0}: {1}" -f $file.FullName, $_.Exception.Message)
        }
    }
}

function Get-EnvFiles {
    param([string]$SearchRoot)

    return Get-ChildItem -Path $SearchRoot -Recurse -Force -File |
        Where-Object {
            $_.Name -eq ".env"
        } |
        Where-Object {
            $fullName = $_.FullName
            $include = $true
            foreach ($segment in $script:ExcludedDirNames) {
                if ($fullName -like "*\$segment\*") {
                    $include = $false
                    break
                }
            }
            $include
        } |
        Sort-Object FullName
}

function New-CandidateEntry {
    param([string]$Key)

    return [pscustomobject]@{
        Key = $Key
        Sources = New-Object System.Collections.Generic.List[string]
    }
}

function Find-KeyCandidates {
    param([System.IO.FileInfo[]]$EnvFiles)

    $entries = New-Object System.Collections.Generic.List[object]
    $byKey = @{}
    $keyRegex = New-Object System.Text.RegularExpressions.Regex("sk-[A-Za-z0-9]{20,}")

    foreach ($file in $EnvFiles) {
        $lineNumber = 0
        foreach ($line in [System.IO.File]::ReadAllLines($file.FullName)) {
            $lineNumber += 1
            foreach ($match in $keyRegex.Matches($line)) {
                $key = $match.Value.Trim()
                if (-not $byKey.ContainsKey($key)) {
                    $entry = New-CandidateEntry -Key $key
                    $byKey[$key] = $entry
                    $entries.Add($entry) | Out-Null
                }

                $source = "{0}:{1}" -f $file.FullName, $lineNumber
                if (-not $byKey[$key].Sources.Contains($source)) {
                    $byKey[$key].Sources.Add($source)
                }
            }
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($env:SILICONFLOW_API_KEY)) {
        $processKey = $env:SILICONFLOW_API_KEY.Trim()
        if (-not $byKey.ContainsKey($processKey)) {
            $entry = New-CandidateEntry -Key $processKey
            $byKey[$processKey] = $entry
            $entries.Add($entry) | Out-Null
        }

        $processSource = "process-env:SILICONFLOW_API_KEY"
        if (-not $byKey[$processKey].Sources.Contains($processSource)) {
            $byKey[$processKey].Sources.Add($processSource)
        }
    }

    return @($entries.ToArray())
}

function Get-PreferredTestModel {
    param([string[]]$ModelIds)

    $preferredModels = @(
        "Qwen/Qwen3-VL-235B-A22B-Instruct",
        "Qwen/Qwen3.5-9B",
        "Qwen/Qwen3.5-27B",
        "deepseek-ai/DeepSeek-V3.2",
        "deepseek-ai/DeepSeek-V3.1-Terminus"
    )

    foreach ($model in $preferredModels) {
        if ($ModelIds -contains $model) {
            return $model
        }
    }

    foreach ($model in $ModelIds) {
        if ($model -and -not $model.StartsWith("Pro/")) {
            return $model
        }
    }

    if ($ModelIds.Count -gt 0) {
        return $ModelIds[0]
    }

    return $null
}

function Test-SiliconFlowKey {
    param(
        [string]$Key,
        [switch]$SkipChat
    )

    $headers = @{
        Authorization = "Bearer $Key"
        "Content-Type" = "application/json"
    }

    try {
        $modelsResponse = Invoke-WebRequest `
            -Uri "https://api.siliconflow.cn/v1/models" `
            -Method Get `
            -Headers $headers `
            -UseBasicParsing `
            -TimeoutSec 20
    } catch {
        $details = Get-WebErrorDetails -Record $_
        return [pscustomobject]@{
            Key = $Key
            AuthOk = $false
            ChatOk = $false
            Usable = $false
            StatusCode = $details.StatusCode
            TestModel = $null
            Reason = $details.Body
        }
    }

    $modelIds = @()
    try {
        $modelsJson = $modelsResponse.Content | ConvertFrom-Json
        if ($null -ne $modelsJson.data) {
            $modelIds = @($modelsJson.data | ForEach-Object { $_.id })
        }
    } catch {
        $modelIds = @()
    }

    $testModel = Get-PreferredTestModel -ModelIds $modelIds

    if ($SkipChat) {
        return [pscustomobject]@{
            Key = $Key
            AuthOk = $true
            ChatOk = $false
            Usable = $true
            StatusCode = 200
            TestModel = $testModel
            Reason = "Auth OK; chat test skipped."
        }
    }

    if ([string]::IsNullOrWhiteSpace($testModel)) {
        return [pscustomobject]@{
            Key = $Key
            AuthOk = $true
            ChatOk = $false
            Usable = $false
            StatusCode = 200
            TestModel = $null
            Reason = "Auth OK, but no model was available for a chat test."
        }
    }

    $chatBody = @{
        model = $testModel
        messages = @(
            @{
                role = "user"
                content = "reply with ok"
            }
        )
        max_tokens = 8
    } | ConvertTo-Json -Depth 6 -Compress

    try {
        Invoke-WebRequest `
            -Uri "https://api.siliconflow.cn/v1/chat/completions" `
            -Method Post `
            -Headers $headers `
            -Body $chatBody `
            -UseBasicParsing `
            -TimeoutSec 20 | Out-Null
    } catch {
        $details = Get-WebErrorDetails -Record $_
        return [pscustomobject]@{
            Key = $Key
            AuthOk = $true
            ChatOk = $false
            Usable = $false
            StatusCode = $details.StatusCode
            TestModel = $testModel
            Reason = $details.Body
        }
    }

    return [pscustomobject]@{
        Key = $Key
        AuthOk = $true
        ChatOk = $true
        Usable = $true
        StatusCode = 200
        TestModel = $testModel
        Reason = "Auth and chat test passed."
    }
}

function Rewrite-EnvFile {
    param(
        [string]$Path,
        [string]$Key,
        [string]$BackupSuffix,
        [switch]$DryRunMode
    )

    $originalLines = [System.IO.File]::ReadAllLines($Path)
    $newLines = New-Object System.Collections.Generic.List[string]
    $replaced = $false

    foreach ($line in $originalLines) {
        if ($line -match "^\s*SILICONFLOW_API_KEY\s*=") {
            if (-not $replaced) {
                $newLines.Add("SILICONFLOW_API_KEY=$Key")
                $replaced = $true
            }
            continue
        }

        $newLines.Add($line)
    }

    if (-not $replaced) {
        if ($newLines.Count -gt 0 -and $newLines[$newLines.Count - 1] -ne "") {
            $newLines.Add("")
        }
        $newLines.Add("SILICONFLOW_API_KEY=$Key")
    }

    $backupPath = "{0}.bak.{1}" -f $Path, $BackupSuffix
    $content = [string]::Join([Environment]::NewLine, $newLines) + [Environment]::NewLine

    if ($DryRunMode) {
        return [pscustomobject]@{
            Path = $Path
            BackupPath = $backupPath
            Updated = $true
            DryRun = $true
        }
    }

    [System.IO.File]::Copy($Path, $backupPath, $true)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $content, $utf8NoBom)

    return [pscustomobject]@{
        Path = $Path
        BackupPath = $backupPath
        Updated = $true
        DryRun = $false
    }
}

Write-Section "MikuChat SiliconFlow env repair"

$projectRootInfo = Resolve-ProjectRoot -PreferredRoot $Root
if ($null -eq $projectRootInfo) {
    Write-ErrorLine "Could not automatically locate the MikuChat project root."
    Write-WarnLine "Re-run with -Root <project-folder> if your project is in an unusual location."
    exit 10
}

$Root = $projectRootInfo.Selected.Path
Write-Step ("Project root: {0}" -f $Root)
Write-Step ("Detection: {0}" -f $projectRootInfo.Strategy)
if ($projectRootInfo.Selected.Reasons.Count -gt 0) {
    Write-Step ("Markers: {0}" -f (($projectRootInfo.Selected.Reasons | Select-Object -First 6) -join ", "))
}

if ($projectRootInfo.Candidates.Count -gt 1) {
    Write-WarnLine "Multiple candidate MikuChat roots were found. The highest-scoring match was selected:"
    foreach ($candidate in ($projectRootInfo.Candidates | Sort-Object @{ Expression = { $_.Score }; Descending = $true }, Path | Select-Object -First 5)) {
        Write-Step ("Candidate score {0}: {1}" -f $candidate.Score, $candidate.Path)
    }
}

$envFiles = @(Get-EnvFiles -SearchRoot $Root)
if ($envFiles.Count -eq 0) {
    Write-ErrorLine "No .env files were found under the selected root."
    exit 1
}

Write-Section "Discovered .env files"
foreach ($file in $envFiles) {
    Write-Host $file.FullName
}

Show-EnvFileContents -EnvFiles $envFiles

$candidates = @(Find-KeyCandidates -EnvFiles $envFiles)
if ($candidates.Count -eq 0) {
    Write-ErrorLine "No SiliconFlow-style key candidates were found in any .env file or current process env."
    exit 2
}

Write-Section "Testing candidate keys"
$results = New-Object System.Collections.Generic.List[object]
foreach ($candidate in $candidates) {
    Write-Step ("Testing {0}" -f (Mask-Key -Key $candidate.Key))
    $result = Test-SiliconFlowKey -Key $candidate.Key -SkipChat:$SkipChatCheck
    $result | Add-Member -NotePropertyName Sources -NotePropertyValue $candidate.Sources
    $results.Add($result) | Out-Null

    if ($result.Usable) {
        Write-Host ("[OK]   {0} -> {1}" -f (Mask-Key -Key $candidate.Key), $result.Reason) -ForegroundColor Green
        if ($result.TestModel) {
            Write-Step ("Selected test model: {0}" -f $result.TestModel)
        }
    } else {
        $statusLabel = if ($null -ne $result.StatusCode) { $result.StatusCode } else { "n/a" }
        Write-WarnLine ("{0} -> failed (status {1})" -f (Mask-Key -Key $candidate.Key), $statusLabel)
        if ($result.Reason) {
            Write-WarnLine $result.Reason
        }
    }
}

$validResult = $results | Where-Object { $_.Usable } | Select-Object -First 1
if ($null -eq $validResult) {
    Write-ErrorLine "No usable SiliconFlow key was found."
    exit 3
}

Write-Section "Selected valid key"
Write-Host ("Using {0}" -f (Mask-Key -Key $validResult.Key)) -ForegroundColor Green
foreach ($source in $validResult.Sources) {
    Write-Step ("Source: {0}" -f $source)
}

$backupSuffix = Get-Date -Format "yyyyMMddHHmmss"

Write-Section "Rewriting .env files"
$rewrites = New-Object System.Collections.Generic.List[object]
foreach ($file in $envFiles) {
    $rewrite = Rewrite-EnvFile `
        -Path $file.FullName `
        -Key $validResult.Key `
        -BackupSuffix $backupSuffix `
        -DryRunMode:$DryRun
    $rewrites.Add($rewrite) | Out-Null

    if ($DryRun) {
        Write-Step ("Would update {0}" -f $file.FullName)
    } else {
        Write-Step ("Updated {0}" -f $file.FullName)
        Write-Step ("Backup  {0}" -f $rewrite.BackupPath)
    }
}

if ($RepairUserEnv) {
    [Environment]::SetEnvironmentVariable("SILICONFLOW_API_KEY", $validResult.Key, "User")
    $env:SILICONFLOW_API_KEY = $validResult.Key
    Write-Section "User environment"
    Write-Step "Updated user-level SILICONFLOW_API_KEY to the selected valid key."
} elseif (-not [string]::IsNullOrWhiteSpace($env:SILICONFLOW_API_KEY) -and $env:SILICONFLOW_API_KEY -ne $validResult.Key) {
    Write-Section "Warning"
    Write-WarnLine "The current process already has SILICONFLOW_API_KEY set to a different value."
    Write-WarnLine "That can override .env loading on some launches. Re-run with -RepairUserEnv if needed."
}

Write-Section "Done"
if ($DryRun) {
    Write-Host "Dry run completed. No files were modified." -ForegroundColor Green
} else {
    Write-Host "All discovered .env files were normalized to the same validated SiliconFlow key." -ForegroundColor Green
}
