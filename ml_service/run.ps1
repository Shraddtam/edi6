$ErrorActionPreference = "Stop"

$candidatePythons = @(
  "python",
  "py",
  "D:\PostgreSQL\18\pgAdmin 4\python\python.exe"
)

$python = $null
foreach ($candidate in $candidatePythons) {
  try {
    if ($candidate -eq "py") {
      & $candidate -3 --version *> $null
    } else {
      & $candidate --version *> $null
    }
    $python = $candidate
    break
  } catch {
  }
}

if (-not $python) {
  throw "Python was not found. Install Python 3.11 or 3.12, then rerun npm run ml:service."
}

try {
  if ($python -eq "py") {
    & py -3 -c "import uvicorn" *> $null
  } else {
    & $python -c "import uvicorn" *> $null
  }
} catch {
  throw "ML dependencies are not installed. Run npm run ml:install first."
}

if ($python -eq "py") {
  & py -3 -m uvicorn ml_service.main:app --host 127.0.0.1 --port 8001
} else {
  & $python -m uvicorn ml_service.main:app --host 127.0.0.1 --port 8001
}
