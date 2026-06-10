#!/bin/bash
# ============================================================
# TriniBuild — Hetzner Server Bootstrap (Ubuntu 22.04/24.04)
# Run ONCE as root on a fresh server:
#   bash setup-server.sh
# Installs: Node.js 20, PostgreSQL 16, Nginx, PM2, Certbot, UFW
# ============================================================
set -e

DOMAIN="trinibuild.com"
APP_DIR="/var/www/trinibuild"
DB_NAME="trinibuild"
DB_USER="trinibuild"
# Generate a strong DB password and save it
DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)

echo "════════════════════════════════════════════"
echo " TriniBuild Server Setup — Starting"
echo "════════════════════════════════════════════"

# --- 1. System update ---
apt-get update -y && apt-get upgrade -y

# --- 2. Node.js 20 LTS ---
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "✅ Node $(node -v)"

# --- 3. PostgreSQL 16 ---
apt-get install -y postgresql postgresql-contrib
systemctl enable --now postgresql

# Create DB + user (idempotent)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
echo "✅ PostgreSQL ready — db: ${DB_NAME}"

# --- 4. Nginx ---
apt-get install -y nginx
systemctl enable --now nginx
echo "✅ Nginx running"

# --- 5. PM2 (process manager) ---
npm install -g pm2
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
echo "✅ PM2 installed"

# --- 6. Certbot (free SSL) ---
apt-get install -y certbot python3-certbot-nginx
echo "✅ Certbot installed"

# --- 7. Firewall ---
apt-get install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "✅ Firewall: SSH + HTTP/HTTPS only"

# --- 8. App directory + clone ---
mkdir -p ${APP_DIR}
if [ ! -d "${APP_DIR}/.git" ]; then
  read -p "Paste your GitHub repo URL (with token if private): " REPO_URL
  git clone "${REPO_URL}" ${APP_DIR}
fi

# --- 9. Write environment file ---
cat > ${APP_DIR}/.env <<EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
DOMAIN=https://${DOMAIN}
# Fill these in:
OPENAI_API_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_PLAN_GROWTH=P-1VD46331DR400625JNHTIZQA
PAYPAL_PLAN_ENTERPRISE=P-80N976241W079534TNHTIZQA
EOF
chmod 600 ${APP_DIR}/.env

# --- 10. Load database schema ---
if [ -f "${APP_DIR}/deploy/schema.sql" ]; then
  sudo -u postgres psql -d ${DB_NAME} -f ${APP_DIR}/deploy/schema.sql
  sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO ${DB_USER}; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};"
  echo "✅ Database schema loaded"
fi

# --- 11. Build frontend + start backend ---
cd ${APP_DIR}
npm install --ignore-scripts
npm run build
cd server && npm install && cd ..
pm2 start deploy/ecosystem.config.cjs
pm2 save
echo "✅ App running under PM2"

# --- 12. Nginx site config ---
cp ${APP_DIR}/deploy/nginx-trinibuild.conf /etc/nginx/sites-available/trinibuild
ln -sf /etc/nginx/sites-available/trinibuild /etc/nginx/sites-enabled/trinibuild
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "✅ Nginx configured for ${DOMAIN}"

echo ""
echo "════════════════════════════════════════════"
echo " SETUP COMPLETE"
echo "════════════════════════════════════════════"
echo " DB password saved in ${APP_DIR}/.env"
echo ""
echo " NEXT STEPS:"
echo " 1. Point DNS: trinibuild.com A record → this server's IP"
echo " 2. Wait for DNS to propagate (5-30 min)"
echo " 3. Run: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo " 4. Edit ${APP_DIR}/.env — add your OPENAI_API_KEY"
echo " 5. pm2 restart all"
echo "════════════════════════════════════════════"
