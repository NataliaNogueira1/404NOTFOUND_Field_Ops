#!/usr/bin/env bash
# FieldOps API boot for the EC2 instance (#315, architecture decision #7).
#
# Runs on every boot through fieldops-boot.service and can be re-run by hand at any time
# (sudo systemctl restart fieldops-boot). Every step is idempotent: it only does what is missing.
#
#   1. swap file active and persistent (the Learner Lab reset drops it unless it is in /etc/fstab)
#   2. Docker running
#   3. repository checked out at FIELDOPS_GIT_REF
#   4. API image built (only when absent, or with --update when the ref moved)
#   5. API container running with the secrets in the env file (recreated when image/.env changed)
#   6. waits until /actuator/health is UP (Flyway migrations + demo seed run inside the app boot)
#   7. with FIELDOPS_DOMAIN set: Caddy proxy in front (HTTPS, Web Admin + /api), API only on loopback
#
# Secrets never live in this script or in the EC2 user-data: they stay in FIELDOPS_ENV_FILE.
# Optional overrides go in /etc/fieldops/boot.conf (plain KEY=value lines, no secrets).
set -Eeuo pipefail

CONF_FILE="${FIELDOPS_CONF:-/etc/fieldops/boot.conf}"
if [[ -f "$CONF_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$CONF_FILE"
fi

FIELDOPS_HOME="${FIELDOPS_HOME:-/opt/fieldops}"
REPO_URL="${FIELDOPS_REPO_URL:-https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops.git}"
GIT_REF="${FIELDOPS_GIT_REF:-develop}"
REPO_DIR="${FIELDOPS_REPO_DIR:-$FIELDOPS_HOME/repo}"
ENV_FILE="${FIELDOPS_ENV_FILE:-$FIELDOPS_HOME/.env}"
IMAGE="${FIELDOPS_IMAGE:-fieldops-api}"
CONTAINER="${FIELDOPS_CONTAINER:-fieldops-api}"
PORT="${FIELDOPS_PORT:-8080}"
SWAP_FILE="${FIELDOPS_SWAP_FILE:-/swapfile}"
SWAP_MB="${FIELDOPS_SWAP_MB:-2048}"
HEALTH_TIMEOUT="${FIELDOPS_HEALTH_TIMEOUT:-240}"
UPDATE="${FIELDOPS_UPDATE:-0}"

# HTTPS front (#312): set FIELDOPS_DOMAIN in boot.conf to run the Caddy proxy. Empty = no proxy.
DOMAIN="${FIELDOPS_DOMAIN:-}"
WEB_HOST="${FIELDOPS_WEB_HOST:-fieldops-web-404nf.s3-website-us-east-1.amazonaws.com}"
PROXY_CONTAINER="${FIELDOPS_PROXY_CONTAINER:-fieldops-proxy}"
PROXY_IMAGE="${FIELDOPS_PROXY_IMAGE:-caddy:2}"
PROXY_WAIT="${FIELDOPS_PROXY_WAIT:-180}"
# Behind the proxy the API only listens on loopback; without a proxy it stays reachable on the port.
if [[ -n "$DOMAIN" ]]; then
  BIND_ADDR=127.0.0.1
else
  BIND_ADDR=0.0.0.0
fi

if [[ "${1:-}" == "--update" ]]; then
  UPDATE=1
fi

log() {
  printf '%s [fieldops-boot] %s\n' "$(date -u +%FT%TZ)" "$*"
}

trap 'log "ERROR: failed at line $LINENO (exit $?)"' ERR

require_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    log "ERROR: $ENV_FILE not found. Create it as described in docs/arquitetura/runbook-reset-ec2.md, then run: sudo systemctl restart fieldops-boot"
    exit 1
  fi
  chmod 600 "$ENV_FILE"
}

ensure_swap() {
  if swapon --show=NAME --noheadings | grep -qx "$SWAP_FILE"; then
    log "swap already active"
    return
  fi
  if [[ ! -f "$SWAP_FILE" ]]; then
    log "creating ${SWAP_MB} MB swap at $SWAP_FILE"
    dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$SWAP_MB" status=none
    chmod 600 "$SWAP_FILE"
    mkswap "$SWAP_FILE" > /dev/null
  fi
  if ! grep -q "^$SWAP_FILE " /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
  fi
  swapon "$SWAP_FILE"
  log "swap enabled"
}

ensure_docker() {
  systemctl enable --now docker
  local attempt
  for attempt in $(seq 1 30); do
    if docker info > /dev/null 2>&1; then
      return
    fi
    sleep 1
  done
  log "ERROR: Docker daemon did not become ready"
  exit 1
}

ensure_repo() {
  if [[ ! -d "$REPO_DIR/.git" ]]; then
    log "cloning $REPO_URL at $GIT_REF"
    git clone --quiet "$REPO_URL" "$REPO_DIR"
    git -C "$REPO_DIR" checkout --quiet "$GIT_REF"
  elif [[ "$UPDATE" == 1 ]]; then
    log "updating repository to $GIT_REF"
    git -C "$REPO_DIR" fetch --quiet --prune origin
    git -C "$REPO_DIR" checkout --quiet "$GIT_REF"
    git -C "$REPO_DIR" merge --quiet --ff-only "origin/$GIT_REF"
  fi
}

ensure_image() {
  local commit built_from
  commit="$(git -C "$REPO_DIR" rev-parse HEAD)"
  built_from="$(docker image inspect -f '{{ index .Config.Labels "fieldops.commit" }}' "$IMAGE" 2> /dev/null || true)"
  if docker image inspect "$IMAGE" > /dev/null 2>&1 && { [[ "$UPDATE" != 1 ]] || [[ "$built_from" == "$commit" ]]; }; then
    log "image $IMAGE kept (built from commit: ${built_from:-unknown})"
    return
  fi
  log "building image $IMAGE from $commit (several minutes on a t3.micro)"
  docker build --progress=plain --label "fieldops.commit=$commit" -t "$IMAGE" "$REPO_DIR/api"
  log "image built"
}

ensure_container() {
  local image_id env_hash current_image current_hash
  image_id="$(docker image inspect -f '{{.Id}}' "$IMAGE")"
  # Hash of everything that is baked into the container: the env file and the published address.
  env_hash="$({ printf '%s\n' "$BIND_ADDR"; cat "$ENV_FILE"; } | sha256sum | cut -d' ' -f1)"
  if docker container inspect "$CONTAINER" > /dev/null 2>&1; then
    current_image="$(docker container inspect -f '{{.Image}}' "$CONTAINER")"
    current_hash="$(docker container inspect -f '{{ index .Config.Labels "fieldops.env.sha256" }}' "$CONTAINER" 2> /dev/null || true)"
    if [[ "$current_image" == "$image_id" && "$current_hash" == "$env_hash" ]]; then
      if [[ "$(docker container inspect -f '{{.State.Running}}' "$CONTAINER")" == true ]]; then
        log "container already running"
      else
        log "starting existing container"
        docker start "$CONTAINER" > /dev/null
      fi
      return
    fi
    log "container is outdated (image or env file changed); recreating"
    docker rm -f "$CONTAINER" > /dev/null
  fi
  log "creating container $CONTAINER"
  docker run -d --name "$CONTAINER" --restart unless-stopped -p "$BIND_ADDR:$PORT:8080" \
    --env-file "$ENV_FILE" --label "fieldops.env.sha256=$env_hash" "$IMAGE" > /dev/null
}

wait_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT))
  until curl -fsS "http://localhost:$PORT/actuator/health" 2> /dev/null | grep -q '"status":"UP"'; do
    if ((SECONDS >= deadline)); then
      log "ERROR: API not healthy after ${HEALTH_TIMEOUT}s. Last container logs:"
      docker logs --tail 30 "$CONTAINER" 2>&1 || true
      exit 1
    fi
    sleep 5
  done
  log "API healthy (UP)"
}

ensure_proxy() {
  if [[ -z "$DOMAIN" ]]; then
    if docker container inspect "$PROXY_CONTAINER" > /dev/null 2>&1; then
      log "FIELDOPS_DOMAIN not set; removing the HTTPS proxy"
      docker rm -f "$PROXY_CONTAINER" > /dev/null
    fi
    return
  fi
  local caddyfile="$REPO_DIR/infra/aws/ec2/Caddyfile" config_hash current_hash
  if [[ ! -f "$caddyfile" ]]; then
    log "ERROR: $caddyfile not found at ref $GIT_REF"
    exit 1
  fi
  config_hash="$({ printf '%s\n%s\n%s\n' "$DOMAIN" "$WEB_HOST" "$PROXY_IMAGE"; cat "$caddyfile"; } | sha256sum | cut -d' ' -f1)"
  current_hash="$(docker container inspect -f '{{ index .Config.Labels "fieldops.proxy.sha256" }}' "$PROXY_CONTAINER" 2> /dev/null || true)"
  if [[ "$current_hash" == "$config_hash" ]]; then
    docker start "$PROXY_CONTAINER" > /dev/null
    log "HTTPS proxy already configured for $DOMAIN"
    return
  fi
  docker rm -f "$PROXY_CONTAINER" > /dev/null 2>&1 || true
  log "starting the HTTPS proxy for $DOMAIN (certificate is issued on the first request)"
  docker run -d --name "$PROXY_CONTAINER" --restart unless-stopped --network host \
    -e FIELDOPS_DOMAIN="$DOMAIN" -e FIELDOPS_WEB_HOST="$WEB_HOST" \
    -v "$caddyfile:/etc/caddy/Caddyfile:ro" -v fieldops-caddy-data:/data -v fieldops-caddy-config:/config \
    --label "fieldops.proxy.sha256=$config_hash" "$PROXY_IMAGE" > /dev/null
}

# A missing certificate must not fail the boot: the API is already up, so this only warns.
wait_proxy() {
  [[ -n "$DOMAIN" ]] || return 0
  local deadline=$((SECONDS + PROXY_WAIT))
  # --resolve keeps the check on this machine, so it does not depend on the public address looping back.
  until curl -fsS --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/actuator/health" 2> /dev/null | grep -q '"status":"UP"'; do
    if ((SECONDS >= deadline)); then
      log "WARNING: https://$DOMAIN did not answer within ${PROXY_WAIT}s (certificate pending, DNS or ports 80/443 blocked). Proxy logs:"
      docker logs --tail 20 "$PROXY_CONTAINER" 2>&1 || true
      return 0
    fi
    sleep 5
  done
  log "HTTPS proxy healthy: https://$DOMAIN"
}

main() {
  log "boot start (ref=$GIT_REF, update=$UPDATE)"
  require_env_file
  ensure_swap
  ensure_docker
  ensure_repo
  ensure_image
  ensure_container
  wait_healthy
  ensure_proxy
  wait_proxy
  log "boot done"
}

main "$@"
