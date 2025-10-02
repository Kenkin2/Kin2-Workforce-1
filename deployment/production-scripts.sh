#!/bin/bash

# Kin2 Workforce Production Deployment Scripts
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Pre-deployment checks
check_environment() {
    log "Checking production environment..."
    
    # Check required environment variables
    required_vars=("DATABASE_URL" "STRIPE_SECRET_KEY" "SESSION_SECRET" "OPENAI_API_KEY")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Missing required environment variable: $var"
            exit 1
        fi
    done
    
    # Check Docker and Kubernetes
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Please install Docker."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        error "kubectl not found. Please install Kubernetes CLI."
        exit 1
    fi
    
    success "Environment checks passed"
}

# Build application
build_application() {
    log "Building Kin2 Workforce application..."
    
    # Build frontend
    npm run build
    
    # Build Docker image
    docker build -t kin2-workforce:latest -f deployment/Dockerfile .
    
    success "Application built successfully"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl apply -f deployment/kubernetes/namespace.yaml
    
    # Create secrets (assuming they exist in environment)
    kubectl create secret generic kin2-workforce-secrets \
        --namespace=kin2-workforce \
        --from-literal=database-url="$DATABASE_URL" \
        --from-literal=stripe-secret-key="$STRIPE_SECRET_KEY" \
        --from-literal=session-secret="$SESSION_SECRET" \
        --from-literal=openai-api-key="$OPENAI_API_KEY" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy application
    kubectl apply -f deployment/kubernetes/deployment.yaml
    kubectl apply -f deployment/kubernetes/ingress.yaml
    
    # Wait for deployment
    kubectl rollout status deployment/kin2-workforce-app -n kin2-workforce --timeout=300s
    
    success "Kubernetes deployment completed"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    log "Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose -f deployment/docker-compose.yml down
    
    # Start services
    docker-compose -f deployment/docker-compose.yml up -d
    
    # Wait for health check
    sleep 30
    if docker-compose -f deployment/docker-compose.yml ps | grep -q "Up"; then
        success "Docker Compose deployment completed"
    else
        error "Docker Compose deployment failed"
        exit 1
    fi
}

# Database migration
migrate_database() {
    log "Running database migrations..."
    npm run db:push
    success "Database migrations completed"
}

# Backup system
setup_backups() {
    log "Setting up backup system..."
    
    # Create backup directories
    mkdir -p backups/database backups/application backups/logs
    
    # Set up automated backup script
    cat > /etc/cron.d/kin2-workforce-backup << 'EOF'
# Kin2 Workforce automated backups
0 2 * * * root /opt/kin2-workforce/backup-database.sh
0 3 * * * root /opt/kin2-workforce/backup-application.sh
0 4 * * 0 root /opt/kin2-workforce/cleanup-old-backups.sh
EOF

    success "Backup system configured"
}

# Performance optimization
optimize_production() {
    log "Applying production optimizations..."
    
    # Optimize Node.js
    export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
    
    # Set production environment
    export NODE_ENV=production
    
    success "Production optimizations applied"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local endpoint="http://localhost:5000/health"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$endpoint" > /dev/null; then
            success "Health check passed"
            return 0
        fi
        warn "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 2
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Main deployment function
deploy_production() {
    log "🚀 Starting Kin2 Workforce production deployment..."
    
    check_environment
    build_application
    migrate_database
    
    # Choose deployment method
    if [ "$1" = "kubernetes" ]; then
        deploy_kubernetes
    else
        deploy_docker_compose
    fi
    
    setup_backups
    optimize_production
    health_check
    
    success "🎉 Kin2 Workforce platform deployed successfully!"
    log "Platform available at: https://workforce.yourdomain.com"
}

# Backup functions
backup_database() {
    log "Creating database backup..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    pg_dump "$DATABASE_URL" > "backups/database/backup_$timestamp.sql"
    success "Database backup created: backup_$timestamp.sql"
}

backup_application() {
    log "Creating application backup..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    tar -czf "backups/application/app_backup_$timestamp.tar.gz" \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='backups' \
        .
    success "Application backup created: app_backup_$timestamp.tar.gz"
}

# Monitoring setup
setup_monitoring() {
    log "Setting up production monitoring..."
    
    # Start monitoring stack
    docker-compose -f deployment/docker-compose.yml up -d prometheus grafana
    
    success "Monitoring stack deployed"
    log "Prometheus: http://localhost:9090"
    log "Grafana: http://localhost:3000"
}

# Rollback function
rollback_deployment() {
    warn "Rolling back deployment..."
    
    if [ "$1" = "kubernetes" ]; then
        kubectl rollout undo deployment/kin2-workforce-app -n kin2-workforce
    else
        docker-compose -f deployment/docker-compose.yml down
        # Restore from backup if needed
    fi
    
    success "Rollback completed"
}

# Command line interface
case "$1" in
    "deploy")
        deploy_production "$2"
        ;;
    "backup-db")
        backup_database
        ;;
    "backup-app")
        backup_application
        ;;
    "monitoring")
        setup_monitoring
        ;;
    "rollback")
        rollback_deployment "$2"
        ;;
    "health")
        health_check
        ;;
    *)
        echo "Kin2 Workforce Production Deployment Scripts"
        echo ""
        echo "Usage: $0 {deploy|backup-db|backup-app|monitoring|rollback|health} [kubernetes|docker]"
        echo ""
        echo "Commands:"
        echo "  deploy [kubernetes|docker] - Deploy the application"
        echo "  backup-db                  - Create database backup"
        echo "  backup-app                 - Create application backup"
        echo "  monitoring                 - Setup monitoring stack"
        echo "  rollback [kubernetes|docker] - Rollback deployment"
        echo "  health                     - Run health check"
        echo ""
        echo "Examples:"
        echo "  $0 deploy kubernetes"
        echo "  $0 deploy docker"
        echo "  $0 monitoring"
        exit 1
        ;;
esac