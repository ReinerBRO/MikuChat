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

# Check for python command
if command -v python3 &>/dev/null; then
    PYTHON_CMD=python3
else
    PYTHON_CMD=python
fi

# Setup/Activate venv
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run backend
python -m uvicorn main:app --reload --port 8000 &
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
