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
  throw "Python was not found. Install Python 3.11 or 3.12, then rerun npm run ml:install."
}

if ($python -eq "py") {
  & py -3 -m pip install -r ml_service\requirements.txt
} else {
  & $python -m pip install -r ml_service\requirements.txt
}
