#!/bin/bash
set -e
set -u

function create_db() {
	local db=$1
	echo "Creating database '$db' with user '$POSTGRES_USER'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
		    CREATE DATABASE "$db";
		    GRANT ALL PRIVILEGES ON DATABASE "$db" TO "$POSTGRES_USER";
	EOSQL
}

# Set the PostgreSQL timezone to UTC
function set_postgres_timezone() {
	echo "Setting PostgreSQL timezone to UTC"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
		    ALTER SYSTEM SET timezone = 'UTC';
		    SELECT pg_reload_conf();
	EOSQL
}

# Create databases if POSTGRES_DATABASES is set
if [ -n "${POSTGRES_DATABASES:-}" ]; then
	echo "Creating dB(s): $POSTGRES_DATABASES"
	for db in $(echo "$POSTGRES_DATABASES" | tr ',' ' '); do
		create_db "$db"
	done
	echo "Finished creating dB(s): $POSTGRES_DATABASES"
fi

set_postgres_timezone
