# Nginx SSL + WebSocket Setup for Azure VM

## Prerequisites
- Azure VM with public IP: `20.16.250.75`
- Domain: `20.16.250.75.nip.io`
- Backend running on port 8000 (FastAPI)

## Step 1: Install Nginx and Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

## Step 2: Configure Nginx with WebSocket Support

**Important**: Regular proxy setup won't work for WebSockets. You need upgrade headers.

Edit nginx config:
```bash
sudo nano /etc/nginx/sites-available/default
```

**Complete Configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name 20.16.250.75.nip.io;
    
    # Allow certbot challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect everything else to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server with WebSocket Support
server {
    listen 443 ssl http2;
    server_name 20.16.250.75.nip.io;

    # SSL certificates (certbot will add these)
    ssl_certificate /etc/letsencrypt/live/20.16.250.75.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/20.16.250.75.nip.io/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

    # Increase timeouts for WebSocket
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    # WebSocket endpoints (CRITICAL for wss://)
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        
        # WebSocket upgrade headers (REQUIRED)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Disable buffering for real-time data
        proxy_buffering off;
    }

    # API endpoints
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        # Handle preflight
        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    # Root location (for health checks)
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Increase client body size for file uploads (OTA updates)
    client_max_body_size 500M;
}
```

## Step 3: Test Nginx Configuration

```bash
sudo nginx -t
```

Should output: `syntax is ok` and `test is successful`

## Step 4: Open Ports in Azure NSG

In Azure Portal → VM → Networking → Add inbound port rules:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 80   | TCP      | Any    | HTTP (Let's Encrypt) |
| 443  | TCP      | Any    | HTTPS |
| 8000 | TCP      | Localhost only | Backend (optional, for debugging) |

## Step 5: Get SSL Certificate

```bash
sudo certbot --nginx -d 20.16.250.75.nip.io
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

Certbot will:
1. Validate domain ownership
2. Issue SSL certificate
3. Automatically update nginx config
4. Set up auto-renewal

## Step 6: Reload Nginx

```bash
sudo systemctl reload nginx
sudo systemctl status nginx
```

## Step 7: Verify SSL Certificate

```bash
sudo certbot certificates
```

## Step 8: Test WebSocket Connection

### From command line:
```bash
# Install websocat
sudo snap install websocat

# Test WebSocket
websocat wss://20.16.250.75.nip.io/ws
```

### From browser console:
```javascript
const ws = new WebSocket('wss://20.16.250.75.nip.io/ws');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.error('Error:', e);
```

## Step 9: Auto-Renewal Setup

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### WebSocket not connecting?

1. **Check nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

2. **Check backend is running:**
```bash
sudo netstat -tulpn | grep 8000
curl http://localhost:8000/api/health
```

3. **Verify SSL certificate:**
```bash
openssl s_client -connect 20.16.250.75.nip.io:443 -showcerts
```

4. **Test WebSocket upgrade:**
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: 20.16.250.75.nip.io" \
  -H "Origin: https://20.16.250.75.nip.io" \
  https://20.16.250.75.nip.io/ws
```

### CORS issues?

Add to nginx location block:
```nginx
add_header Access-Control-Allow-Origin "https://your-frontend-domain.com" always;
add_header Access-Control-Allow-Credentials true always;
```

### Backend CORS (FastAPI):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://20.16.250.75.nip.io", "https://your-frontend.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Key Differences for WebSocket

❌ **Regular proxy (won't work for WS):**
```nginx
location /ws {
    proxy_pass http://localhost:8000;  # Missing upgrade headers!
}
```

✅ **WebSocket proxy (correct):**
```nginx
location /ws {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;      # REQUIRED
    proxy_set_header Connection "upgrade";        # REQUIRED
}
```

## Security Best Practices

1. **Firewall rules:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Fail2ban (optional, protect against brute force):**
```bash
sudo apt install fail2ban -y
```

3. **Rate limiting in nginx:**
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of config
}
```

## Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | https://20.16.250.75.nip.io | Web dashboard |
| API | https://20.16.250.75.nip.io/api | REST API |
| WebSocket | wss://20.16.250.75.nip.io/ws | Real-time communication |
| Camera | https://20.16.250.75.nip.io/api/robot/camera/stream | Video stream |

## Maintenance

### Renew certificate manually:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Check certificate expiry:
```bash
sudo certbot certificates
```

### Restart services:
```bash
sudo systemctl restart nginx
sudo systemctl restart your-backend-service
```
