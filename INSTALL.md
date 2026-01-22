# Installation Guide

Detailed installation instructions for the Toyota Land Cruiser 100 3D Parts Catalog.

## Table of Contents

- [Requirements](#requirements)
- [Quick Install](#quick-install)
- [Detailed Installation](#detailed-installation)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Troubleshooting](#troubleshooting)

## Requirements

### Minimum Requirements

- Any web server capable of serving static files
- Modern web browser with WebGL support

### For Full Features (Visit Counter)

- Go 1.19 or later
- 50MB disk space
- 64MB RAM

### For Development

- Node.js 16+ (for geometry generation tools)
- Git

## Quick Install

```bash
# Clone
git clone https://github.com/raffopenssh/landcruiser-100-3d.git
cd landcruiser-100-3d

# Option A: Static server (simplest)
python3 -m http.server 8001

# Option B: Go server (with visitor counter)
go build -o server server.go && ./server
```

Open http://localhost:8001 in your browser.

## Detailed Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/raffopenssh/landcruiser-100-3d.git
cd landcruiser-100-3d
```

### Step 2: Choose Your Server

#### Option A: Static File Server

Any static file server works. The application is entirely client-side except for the optional visit counter.

**Python:**
```bash
python3 -m http.server 8001
```

**Node.js:**
```bash
npx serve -p 8001
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name example.com;
    root /path/to/landcruiser-100-3d;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### Option B: Go Server (Recommended)

The Go server includes a visitor counter API.

```bash
# Install Go if needed
# See https://golang.org/doc/install

# Build
go build -o server server.go

# Run
./server
```

The server will start on port 8001 and display:
```
Server starting on :8001
Initial visit count: 0
```

### Step 3: Verify Installation

1. Open http://localhost:8001 in your browser
2. You should see the 3D Land Cruiser model
3. Try searching for a part (e.g., "oil filter")
4. Click on a part to see details

## Production Deployment

### Using Systemd (Linux)

1. **Edit the service file** to match your installation path:

```bash
nano lc100.service
```

Update these lines:
```ini
User=youruser
WorkingDirectory=/path/to/landcruiser-100-3d
ExecStart=/path/to/landcruiser-100-3d/server
```

2. **Install the service:**

```bash
sudo cp lc100.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lc100.service
sudo systemctl start lc100.service
```

3. **Check status:**

```bash
sudo systemctl status lc100.service
```

4. **View logs:**

```bash
sudo journalctl -u lc100.service -f
```

### Service Management Commands

```bash
# Start the service
sudo systemctl start lc100.service

# Stop the service
sudo systemctl stop lc100.service

# Restart the service
sudo systemctl restart lc100.service

# Disable auto-start
sudo systemctl disable lc100.service
```

## Docker Deployment

### Create Dockerfile

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY server.go .
RUN go build -ldflags="-s -w" -o server server.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
COPY index.html app.js parts-data.js parts-geometry.min.json .
COPY buy-links.json og-image.png robots.txt sitemap.xml ./
EXPOSE 8001
CMD ["./server"]
```

### Build and Run

```bash
# Build image
docker build -t lc100-catalog .

# Run container
docker run -d \
  --name lc100 \
  -p 8001:8001 \
  -v lc100-data:/app \
  --restart unless-stopped \
  lc100-catalog
```

### Docker Compose

```yaml
version: '3.8'
services:
  lc100:
    build: .
    ports:
      - "8001:8001"
    volumes:
      - ./visit_count.txt:/app/visit_count.txt
    restart: unless-stopped
```

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name parts.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name parts.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy

```caddyfile
parts.example.com {
    reverse_proxy localhost:8001
}
```

### Apache

```apache
<VirtualHost *:443>
    ServerName parts.example.com
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:8001/
    ProxyPassReverse / http://127.0.0.1:8001/
</VirtualHost>
```

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 8001
lsof -i :8001

# Kill the process
kill -9 <PID>

# Or change the port in server.go
```

### Permission Denied

```bash
# Make server executable
chmod +x server

# Check file ownership
ls -la server
```

### WebGL Not Working

- Update your graphics drivers
- Try a different browser
- Check browser console for errors (F12)
- Ensure hardware acceleration is enabled in browser settings

### Parts Not Loading

Check browser console (F12) for errors. Common issues:

1. **CORS errors**: Use the Go server or configure your static server for CORS
2. **File not found**: Ensure all files are in the same directory
3. **JSON parse errors**: Check that JSON files aren't corrupted

### Visit Counter Not Working

The visit counter only works with the Go server. Check:

1. Server is running (`./server`)
2. `visit_count.txt` is writable
3. Browser isn't blocking API requests

### High Memory Usage

The 3D model uses ~100MB of browser memory. On low-memory devices:

1. Close other browser tabs
2. Use a desktop browser instead of mobile
3. Disable other browser extensions

## Getting Help

- Check existing [GitHub Issues](https://github.com/raffopenssh/landcruiser-100-3d/issues)
- Open a new issue with:
  - Your OS and browser version
  - Error messages from browser console
  - Steps to reproduce the problem
