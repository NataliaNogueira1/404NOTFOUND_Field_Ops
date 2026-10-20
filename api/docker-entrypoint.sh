#!/bin/sh
set -eu

# Render exposes Postgres as postgresql://...; Spring's JDBC driver expects jdbc:postgresql://....
if [ -n "${DATABASE_URL:-}" ] && [ -z "${JDBC_DATABASE_URL:-}" ]; then
  export JDBC_DATABASE_URL="jdbc:${DATABASE_URL}"
fi

# Managed platforms set PORT dynamically; preserve SERVER_PORT when explicitly configured.
if [ -n "${PORT:-}" ] && [ -z "${SERVER_PORT:-}" ]; then
  export SERVER_PORT="${PORT}"
fi

exec java -jar /app/app.jar
