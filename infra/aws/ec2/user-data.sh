#!/usr/bin/env bash
# EC2 user-data and manual installer for the FieldOps API boot automation (#315).
#
# Paste this file as the "User data" of a new Amazon Linux 2023 instance, or run it by hand on
# the existing one:  sudo FIELDOPS_GIT_REF=develop FIELDOPS_DOMAIN=<host>.sslip.io bash user-data.sh
# It is idempotent. It installs Docker and git, checks out the repository, installs the boot
# script and the systemd unit, and starts them. It never handles secrets: user-data is readable
# from the EC2 console and the instance metadata, so the API env file is created separately
# (see docs/arquitetura/runbook-reset-ec2.md).
set -Eeuo pipefail

FIELDOPS_HOME="${FIELDOPS_HOME:-/opt/fieldops}"
REPO_URL="${FIELDOPS_REPO_URL:-https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops.git}"
CONF_FILE=/etc/fieldops/boot.conf
REPO_DIR="$FIELDOPS_HOME/repo"

exec > >(tee -a /var/log/fieldops-user-data.log) 2>&1
echo "[user-data] start $(date -u +%FT%TZ)"

# An explicit FIELDOPS_GIT_REF wins; otherwise keep the one already configured, else use develop.
if [[ -z "${FIELDOPS_GIT_REF:-}" && -f "$CONF_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$CONF_FILE"
fi
GIT_REF="${FIELDOPS_GIT_REF:-develop}"

dnf install -y docker git

mkdir -p "$FIELDOPS_HOME" /etc/fieldops
if [[ ! -d "$REPO_DIR/.git" ]]; then
  git clone --quiet "$REPO_URL" "$REPO_DIR"
fi
git -C "$REPO_DIR" fetch --quiet --prune origin
git -C "$REPO_DIR" checkout --quiet "$GIT_REF"
git -C "$REPO_DIR" merge --quiet --ff-only "origin/$GIT_REF"

# Replaces KEY=value in boot.conf, or appends it. Values here are branch names and host names.
set_conf() {
  local key="$1" value="$2"
  touch "$CONF_FILE"
  if grep -q "^$key=" "$CONF_FILE"; then
    sed -i "s|^$key=.*|$key=$value|" "$CONF_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$CONF_FILE"
  fi
}

if [[ -n "${FIELDOPS_GIT_REF:-}" || ! -f "$CONF_FILE" ]]; then
  set_conf FIELDOPS_GIT_REF "$GIT_REF"
fi
# Public HTTPS host name (#312). Without it the API stays directly reachable on port 8080.
if [[ -n "${FIELDOPS_DOMAIN:-}" ]]; then
  set_conf FIELDOPS_DOMAIN "$FIELDOPS_DOMAIN"
fi

install -m 0755 "$REPO_DIR/infra/aws/ec2/fieldops-boot.sh" /usr/local/bin/fieldops-boot
install -m 0644 "$REPO_DIR/infra/aws/ec2/fieldops-boot.service" /etc/systemd/system/fieldops-boot.service

systemctl daemon-reload
systemctl enable fieldops-boot.service
# restart, not start: the unit is "active (exited)" after a boot, and start would do nothing then.
# --no-block: the first run builds the image and can take several minutes.
systemctl restart --no-block fieldops-boot.service

echo "[user-data] done. Follow the boot with: sudo tail -f /var/log/fieldops-boot.log"
