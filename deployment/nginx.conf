#!/bin/bash

# SSL Certificate Setup Script
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

# SSL Certificate generation with Let's Encrypt
generate_ssl_certificates() {
    log "Generating SSL certificates with Let's Encrypt..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Generate certificates for main domain
    sudo certbot certonly --nginx \
        -d workforce.yourdomain.com \
        -d api.workforce.yourdomain.com \
        --email admin@yourdomain.com \
        --agree-tos \
        --non-interactive
    
    # Set up auto-renewal
    sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -
    
    success "SSL certificates generated and auto-renewal configured"
}

# CDN Configuration
setup_cdn() {
    log "Setting up CDN configuration..."
    
    # Create CDN optimization script
    cat > deployment/cdn-config.js << 'EOF'
// CDN Configuration for Kin2 Workforce
const cdnConfig = {
  provider: 'cloudflare', // or 'cloudfront', 'fastly'
  zones: {
    static: 'static.workforce.yourdomain.com',
    api: 'api.workforce.yourdomain.com',
    media: 'media.workforce.yourdomain.com'
  },
  caching: {
    staticFiles: '1y',
    apiResponses: '5m',
    userContent: '1h'
  },
  compression: true,
  minification: true,
  imageOptimization: true
};

module.exports = cdnConfig;
EOF
    
    success "CDN configuration created"
}

# Performance monitoring
setup_performance_monitoring() {
    log "Setting up performance monitoring..."
    
    # Create performance monitoring configuration
    cat > deployment/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'kin2-workforce'
    static_configs:
      - targets: ['app:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
EOF
    
    success "Performance monitoring configured"
}

case "$1" in
    "ssl")
        generate_ssl_certificates
        ;;
    "cdn")
        setup_cdn
        ;;
    "monitoring")
        setup_performance_monitoring
        ;;
    *)
        echo "SSL and CDN Setup Script"
        echo "Usage: $0 {ssl|cdn|monitoring}"
        ;;
esac