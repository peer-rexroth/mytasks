#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$DIR/.mytasks-server.pid"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  kill "$(cat "$PID_FILE")"
  echo "Stopped mytasks server (pid $(cat "$PID_FILE"))"
else
  echo "mytasks server isn't running."
fi
rm -f "$PID_FILE"
