#!/bin/bash

echo "=== 3D Shooting Game Deployment Script ==="

# Configuration
APP_DIR="/var/www/game"
GIT_REPO="https://github.com/song-hao/AdWebHW2.git"
BRANCH="master"

echo ""
echo "1. Installing dependencies..."

# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install npm dependencies
echo "Installing npm dependencies..."
cd $APP_DIR
npm install --production

echo ""
echo "2. Setting up directories..."

# Create logs directory
mkdir -p logs

echo ""
echo "3. Copying configuration files..."

# Copy Systemd service file
sudo cp deploy/game-server.service /etc/systemd/system/

# Copy Nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/sites-available/game
sudo ln -sf /etc/nginx/sites-available/game /etc/nginx/sites-enabled/

echo ""
echo "4. Configuring SSL (Let's Encrypt)..."

# Install Certbot (if not installed)
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Obtain SSL certificate
echo "Obtaining SSL certificate..."
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

echo ""
echo "5. Starting services..."

# Reload Systemd
sudo systemctl daemon-reload

# Start game server
sudo systemctl enable game-server
sudo systemctl start game-server

# Restart Nginx
sudo systemctl restart nginx

echo ""
echo "=== Deployment Complete! ==="
echo "Game server is running at: https://your-domain.com"
echo "Check server status: sudo systemctl status game-server"