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
# Check if virtual environment is active or needs to be used
# Assuming the user's environment is already set up or using the system python
# If a specific env is needed, it should be activated here. 
# Based on previous context, user was running: python -m uvicorn main:app --reload --port 8000
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
