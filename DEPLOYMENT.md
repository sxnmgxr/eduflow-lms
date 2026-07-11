# 🚀 EduFlow Deployment Guide — VPS + Nginx + SSL + CI/CD

## Prerequisites
- Ubuntu 22.04 VPS (Contabo, DigitalOcean, AWS EC2)
- Domain name pointed to VPS IP
- GitHub repository

## Step 1 — Initial VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
```

## Step 2 — Clone & Configure

```bash
cd /var/www
git clone https://github.com/yourusername/eduflow-lms.git
cd eduflow-lms

# Edit environment variables
nano backend/.env
```

### Production `.env` values
```env
PORT=8000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/eduflow
REDIS_URL=redis://redis:6379
JWT_SECRET=VERY_LONG_RANDOM_SECRET_256_BITS
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=ANOTHER_VERY_LONG_RANDOM_SECRET
REFRESH_TOKEN_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-bucket
KHALTI_SECRET_KEY=your_live_khalti_key
ESEWA_PRODUCT_CODE=your_esewa_merchant_code
ESEWA_SECRET=your_esewa_secret
ANTHROPIC_API_KEY=your_claude_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="EduFlow <noreply@yourdomain.com>"
CLIENT_URL=https://yourdomain.com
WORKER_SECRET=your_worker_secret
```

## Step 3 — Start Services

```bash
# Build and start
docker compose up -d --build

# Run migrations
docker exec -i eduflow-lms-postgres-1 psql -U postgres -d eduflow < backend/src/db/migrations/001_init.sql

# Create admin
docker exec -it eduflow-lms-postgres-1 psql -U postgres -d eduflow -c "
INSERT INTO users (name, email, password_hash, role, is_active, email_verified)
VALUES ('Admin', 'admin@yourdomain.com', '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', 'admin', TRUE, TRUE);
"
```

## Step 4 — Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/eduflow
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 2G;
        proxy_read_timeout 300s;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/eduflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5 — SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow prompts, select redirect HTTP to HTTPS
```

Auto-renewal test:
```bash
sudo certbot renew --dry-run
```

## Step 6 — Build Frontend for Production

```bash
cd frontend

# Update .env for production
echo "VITE_API_URL=https://yourdomain.com/api" > .env.production

# Build
npm run build

# Serve with Nginx directly
sudo mkdir -p /var/www/eduflow-frontend
sudo cp -r dist/* /var/www/eduflow-frontend/
```

Update Nginx location `/`:
```nginx
location / {
    root /var/www/eduflow-frontend;
    try_files $uri $uri/ /index.html;
}
```

## Step 7 — GitHub Actions CI/CD

### `.github/workflows/deploy.yml`

```yaml
name: Deploy EduFlow

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build Frontend
        working-directory: ./frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: |
          npm install
          npm run build

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/eduflow-lms
            git pull origin main
            docker compose up -d --build backend
            cp -r frontend/dist/* /var/www/eduflow-frontend/
            sudo systemctl reload nginx
            echo "✅ Deployment complete"
```

### GitHub Secrets to set: