# EventFlow Backend Runner
# This avoids shadowing issues with global python packages
$env:PYTHONIOENCODING='utf-8'
$env:PYTHONPATH= "$(Get-Location)/backend"
python -m uvicorn backend.main:app --reload --port 8000
