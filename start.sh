#!/bin/bash

# Function to kill processes on a port
kill_port() {
  PORT=$1
  PID=$(lsof -t -i:$PORT)
  if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID
  fi
}

# Cleanup function
cleanup() {
  echo "Stopping services..."
  # Kill all child processes in the same process group
  kill 0
  exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# Kill existing processes
kill_port 8000
kill_port 5173

# Start Backend
echo "Starting Backend..."
cd backend

# Environment Selection
CONDA_PYTHON="/Users/h1syu1/miniconda3/envs/mikuchat/bin/python"
if [ -f "$CONDA_PYTHON" ]; then
    echo "Using mikuchat conda environment..."
    PYTHON_CMD="$CONDA_PYTHON"
    PIP_CMD="/Users/h1syu1/miniconda3/envs/mikuchat/bin/pip"
else
    echo "Conda environment not found, falling back to local venv..."
    if command -v python3 &>/dev/null; then
        PYTHON_CMD_BASE=python3
    else
        PYTHON_CMD_BASE=python
    fi
    
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        $PYTHON_CMD_BASE -m venv venv
    fi
    source venv/bin/activate
    PYTHON_CMD=python
    PIP_CMD=pip
fi

# Install/Update dependencies
echo "Ensuring dependencies are installed..."
$PIP_CMD install -r requirements.txt

# Run backend
$PYTHON_CMD -m uvicorn main:app --reload --port 8000 &
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev &
cd ..

echo "MikuChat started!"
echo "Press Ctrl+C to stop."

# Wait for processes
wait
