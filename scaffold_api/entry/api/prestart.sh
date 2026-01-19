#!/bin/bash

if [ -z "$WORKDIR" ]; then
    WORKDIR=$(pwd)
fi

# start DB
python "${WORKDIR}"/app/backend_pre_start.py

# Run migrations
alembic upgrade head

# # Create initial data in DB
# python ${WORKDIR}/app/db/setup/init_db.py
