#!/bin/bash

echo "🚀 Starting Nginx setup for ilovemeditation.online..."

# 1. Install Nginx
echo "📦 Installing Nginx..."
apt update
apt install nginx -y

# 2. Create Nginx configuration
echo "⚙️  Creating Nginx configuration..."
cat > /etc/nginx/sites-available/ilovemeditation.online << 'EOF'
server {
    listen 80;
    listen [::]:80;
    
    server_name ilovemeditation.online www.ilovemeditation.online;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 3. Enable the site
echo "🔗 Enabling site..."
ln -sf /etc/nginx/sites-available/ilovemeditation.online /etc/nginx/sites-enabled/

# 4. Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# 5. Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# 6. Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# 7. Check status
echo "✅ Checking Nginx status..."
systemctl status nginx --no-pager

# 8. Open firewall
echo "🔥 Configuring firewall..."
ufw allow 'Nginx Full' 2>/dev/null || echo "UFW not enabled or not installed"

echo ""
echo "✨ Nginx setup complete!"
echo "🌐 Your site should now be accessible at: http://ilovemeditation.online"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure your DNS A record points to 45.144.167.234"
echo "   2. Install SSL certificate with: certbot --nginx -d ilovemeditation.online -d www.ilovemeditation.online"
