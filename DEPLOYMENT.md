# WeAD Deployment Guide

This guide covers deployment of the WeAD platform to production environments.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Python 3.8+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- Nginx
- SSL certificate (Let's Encrypt recommended)
- BNB Chain node access or RPC endpoint

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Kennethlee83/WeAD.git
cd WeAD
```

### 2. Configure Environment

```bash
cp env.example .env
nano .env
```

**Required Configuration:**

```bash
# Blockchain (REQUIRED)
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key

# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@localhost:5432/wead_db
REDIS_URL=redis://localhost:6379

# Security (REQUIRED - Generate strong secrets!)
JWT_SECRET=your_strong_jwt_secret_here
SECRET_KEY=your_strong_secret_key_here

# Optional Services
GOOGLE_MAPS_API_KEY=your_api_key
STRIPE_SECRET_KEY=your_stripe_key
```

### 3. Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres createdb wead_db
sudo -u postgres createuser wead_user
sudo -u postgres psql -c "ALTER USER wead_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE wead_db TO wead_user;"

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### 4. Backend Deployment

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Test the application
python bot_simple.py
```

### 5. Smart Contract Deployment

```bash
cd blockchain

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to BSC Mainnet
npm run deploy:base

# Save contract addresses to .env
# Add to .env:
# WEAD_TOKEN_ADDRESS=0x...
# AD_VIEWING_ADDRESS=0x...
# CROSS_CHAIN_BRIDGE_ADDRESS=0x...
```

### 6. Systemd Service Setup

Create `/etc/systemd/system/wead.service`:

```ini
[Unit]
Description=WeAD Dashboard Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/WeAD
Environment="PATH=/var/www/WeAD/venv/bin"
ExecStart=/var/www/WeAD/venv/bin/python bot_simple.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable wead
sudo systemctl start wead
sudo systemctl status wead
```

### 7. Nginx Configuration

Create `/etc/nginx/sites-available/wead`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /var/www/WeAD/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 100M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/wead /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL Setup (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Production Checklist

### Security

- [ ] Change all default secrets in `.env`
- [ ] Use strong database passwords
- [ ] Enable firewall (UFW)
- [ ] Configure fail2ban
- [ ] Keep private keys secure (never commit!)
- [ ] Enable HTTPS only
- [ ] Set up regular backups

### Performance

- [ ] Configure Redis caching
- [ ] Enable Nginx gzip compression
- [ ] Set up CDN for static files
- [ ] Configure database connection pooling
- [ ] Monitor resource usage

### Monitoring

- [ ] Set up application logging
- [ ] Configure error tracking (Sentry)
- [ ] Monitor blockchain transactions
- [ ] Set up uptime monitoring
- [ ] Configure alerting

## Firewall Configuration

```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

## Backup Strategy

### Database Backup

```bash
# Create backup script
cat > /usr/local/bin/backup-wead-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/wead"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump wead_db | gzip > $BACKUP_DIR/wead_db_$DATE.sql.gz
# Keep only last 30 days
find $BACKUP_DIR -name "wead_db_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-wead-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-wead-db.sh") | crontab -
```

## Monitoring & Logs

```bash
# View application logs
sudo journalctl -u wead -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check service status
sudo systemctl status wead
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis
```

## Updating the Application

```bash
cd /var/www/WeAD

# Pull latest changes
git pull origin main

# Update Python dependencies
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Update blockchain contracts (if needed)
cd blockchain
npm install
npm run compile

# Restart service
sudo systemctl restart wead
```

## Troubleshooting

### Application won't start

```bash
# Check logs
sudo journalctl -u wead -n 50

# Verify environment variables
source venv/bin/activate
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('DB:', os.getenv('DATABASE_URL'))"

# Test database connection
psql $DATABASE_URL
```

### High memory usage

```bash
# Check process memory
ps aux | grep python

# Monitor with htop
htop

# Restart service
sudo systemctl restart wead
```

### Blockchain connection issues

```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://bsc-dataseed.binance.org/

# Verify contract deployment
cd blockchain
npx hardhat verify --network bsc CONTRACT_ADDRESS
```

## Performance Optimization

### Nginx Caching

Add to Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=wead_cache:10m max_size=1g inactive=60m;

server {
    # ... existing config ...
    
    location /api/ {
        proxy_cache wead_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_bypass $http_cache_control;
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://127.0.0.1:5000;
    }
}
```

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_earnings_device_id ON earnings(device_id);
```

## Support

For deployment issues:
- Email: support@wead.io
- Telegram: @WeADSupport
- Documentation: https://docs.wead.io

---

**Remember**: Never commit sensitive data like private keys or API keys to the repository!

