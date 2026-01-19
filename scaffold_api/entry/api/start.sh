#!/bin/bash
set -e

export APP_MODULE=${APP_MODULE:-"app.main:app"}

HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8123}
LOG_LEVEL=${LOG_LEVEL:-info}

# PRE_START_PATH=${PRE_START_PATH:-"entry/api/prestart.sh"}
echo "Checking for script in $PRE_START_PATH"
if [ -n "$PRE_START_PATH" ] && [ -f "$PRE_START_PATH" ]; then
    echo "Running script $PRE_START_PATH"
    # shellcheck disable=SC1090
    . "$PRE_START_PATH"
else
    echo "There is no script $PRE_START_PATH"
fi

if [[ $APP_ENV == "local"* ]]; then
    exec uvicorn "$APP_MODULE" --reload --host "$HOST" --port "$PORT" --log-level "$LOG_LEVEL"
else
    exec uvicorn "$APP_MODULE" --host "$HOST" --port "$PORT" --log-level "$LOG_LEVEL"
fi
