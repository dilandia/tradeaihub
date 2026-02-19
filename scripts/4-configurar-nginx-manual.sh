#!/bin/bash
# Execute NO VPS como takez (vai pedir senha sudo: qvZstYia0drblNYV)
# Ou conecte como root e rode sem sudo

sudo tee /etc/nginx/sites-available/takez > /dev/null << 'EOF'
server {
    listen 80;
    server_name 116.203.190.102;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

sudo ln -sf /etc/nginx/sites-available/takez /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "Nginx configurado! Teste: http://116.203.190.102"
