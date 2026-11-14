#!/bin/sh
set -eu

# Database credentials are provided as discrete env vars (DB_HOST/DB_PORT/DB_NAME/DB_USER/
# DB_PASSWORD) and application.yml builds the JDBC URL from them. We deliberately do NOT
# derive JDBC_DATABASE_URL from a raw DATABASE_URL (postgresql://user:pass@host/db): the
# PostgreSQL JDBC driver does not read credentials embedded in the URL, so "jdbc:" + that
# string would be parsed with "user:pass@host" as the hostname and fail (issue #204).

# Managed platforms set PORT dynamically; preserve SERVER_PORT when explicitly configured.
if [ -n "${PORT:-}" ] && [ -z "${SERVER_PORT:-}" ]; then
  export SERVER_PORT="${PORT}"
fi

exec java -jar /app/app.jar
