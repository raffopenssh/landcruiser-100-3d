# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY server.go .
RUN go build -ldflags="-s -w" -o server server.go

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .

# Copy static files
COPY index.html .
COPY app.js .
COPY parts-data.js .
COPY parts-geometry.min.json .
COPY buy-links.json .
COPY og-image.png .
COPY robots.txt .
COPY sitemap.xml .

# Create empty visit count file
RUN touch visit_count.txt && echo "0" > visit_count.txt

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8001/ || exit 1

# Run the server
CMD ["./server"]
