#!/bin/bash

# SentinelCore Installation Script
# Shield Scan Security - Advanced SA-MP Server Management Panel
# Version: 1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SENTINELCORE_VERSION="1.0.0"
INSTALL_DIR="/opt/sentinelcore"
SERVICE_USER="sentinelcore"
DB_NAME="sentinelcore"
DB_USER="sentinel_admin"

# Functions
print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                        🛡️  SentinelCore                        ║"
    echo "║                   Shield Scan Security                       ║"
    echo "║            Advanced SA-MP Server Management Panel            ║"
    echo "║                        Version $SENTINELCORE_VERSION                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script deve ser executado como root"
        exit 1
    fi
}

check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        error "Sistema operacional não suportado"
        exit 1
    fi
    
    log "Sistema detectado: $OS $VER"
    
    case $OS in
        "Ubuntu"|"Debian GNU/Linux"|"CentOS Linux"|"Rocky Linux")
            log "Sistema operacional suportado"
            ;;
        *)
            warn "Sistema operacional não testado, continuando..."
            ;;
    esac
}

install_dependencies() {
    log "Instalando dependências do sistema..."
    
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y curl wget git unzip software-properties-common gnupg2
        
        # Install Node.js 18
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        
        # Install Docker Compose
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Install PostgreSQL client
        apt-get install -y postgresql-client
        
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL/Rocky
        yum update -y
        yum install -y curl wget git unzip epel-release
        
        # Install Node.js 18
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
        
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        
        # Install Docker Compose
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Install PostgreSQL client
        yum install -y postgresql
        
    else
        error "Gerenciador de pacotes não suportado"
        exit 1
    fi
    
    # Start Docker service
    systemctl enable docker
    systemctl start docker
    
    success "Dependências instaladas com sucesso"
}

create_user() {
    log "Criando usuário do sistema..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -d $INSTALL_DIR $SERVICE_USER
        usermod -aG docker $SERVICE_USER
        success "Usuário $SERVICE_USER criado"
    else
        log "Usuário $SERVICE_USER já existe"
    fi
}

setup_directories() {
    log "Configurando diretórios..."
    
    mkdir -p $INSTALL_DIR
    mkdir -p $INSTALL_DIR/logs
    mkdir -p $INSTALL_DIR/backups
    mkdir -p $INSTALL_DIR/servers
    mkdir -p $INSTALL_DIR/uploads
    mkdir -p $INSTALL_DIR/ssl
    mkdir -p /etc/sentinelcore
    
    chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
    chmod 755 $INSTALL_DIR
    
    success "Diretórios configurados"
}

download_sentinelcore() {
    log "Baixando SentinelCore..."
    
    cd /tmp
    
    # In a real scenario, this would download from a repository
    # For now, we'll assume the files are in the current directory
    if [[ -d "$(pwd)" && -f "$(pwd)/package.json" ]]; then
        log "Copiando arquivos do SentinelCore..."
        cp -r "$(pwd)"/* $INSTALL_DIR/
    else
        error "Arquivos do SentinelCore não encontrados"
        exit 1
    fi
    
    chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
    success "SentinelCore baixado"
}

generate_secrets() {
    log "Gerando chaves de segurança..."
    
    DB_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    GRAFANA_PASSWORD=$(openssl rand -base64 16)
    
    cat > /etc/sentinelcore/secrets.env << EOF
# SentinelCore Security Configuration
# Generated on $(date)
# DO NOT SHARE THESE KEYS

DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
EOF
    
    chmod 600 /etc/sentinelcore/secrets.env
    chown root:root /etc/sentinelcore/secrets.env
    
    success "Chaves de segurança geradas"
}

create_env_file() {
    log "Criando arquivo de configuração..."
    
    cat > $INSTALL_DIR/.env << EOF
# SentinelCore Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Application Configuration
FRONTEND_URL=http://localhost
API_PREFIX=api/v1

# Security Configuration
CORS_ORIGIN=http://localhost
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# File Upload Configuration
UPLOAD_MAX_SIZE=104857600
MAX_FILE_UPLOADS=10

# Features Configuration
FEATURE_REGISTRATION=true
FEATURE_2FA=true
FEATURE_FILE_UPLOAD=true
FEATURE_SERVER_CONSOLE=true
FEATURE_BACKUPS=true
FEATURE_MONITORING=true
FEATURE_NOTIFICATIONS=true

# Paths Configuration
SERVER_DATA_PATH=/app/servers
BACKUP_PATH=/app/backups
LOGS_PATH=/app/logs
UPLOADS_PATH=/app/uploads

# Load secrets
$(cat /etc/sentinelcore/secrets.env)
EOF
    
    chown $SERVICE_USER:$SERVICE_USER $INSTALL_DIR/.env
    chmod 640 $INSTALL_DIR/.env
    
    success "Arquivo de configuração criado"
}

install_ssl_certificate() {
    log "Configurando certificado SSL..."
    
    # Generate self-signed certificate for development
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $INSTALL_DIR/ssl/sentinelcore.key \
        -out $INSTALL_DIR/ssl/sentinelcore.crt \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=ShieldScanSecurity/CN=sentinelcore.local"
    
    chown $SERVICE_USER:$SERVICE_USER $INSTALL_DIR/ssl/*
    chmod 600 $INSTALL_DIR/ssl/sentinelcore.key
    chmod 644 $INSTALL_DIR/ssl/sentinelcore.crt
    
    success "Certificado SSL configurado"
}

install_application() {
    log "Instalando aplicação..."
    
    cd $INSTALL_DIR
    
    # Install dependencies
    sudo -u $SERVICE_USER npm run install:all
    
    # Build application
    sudo -u $SERVICE_USER npm run build
    
    success "Aplicação instalada"
}

setup_systemd_service() {
    log "Configurando serviço systemd..."
    
    cat > /etc/systemd/system/sentinelcore.service << EOF
[Unit]
Description=SentinelCore - SA-MP Server Management Panel
Documentation=https://github.com/shieldscan/sentinelcore
After=network.target docker.service
Requires=docker.service

[Service]
Type=forking
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
ExecReload=/usr/local/bin/docker-compose restart
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable sentinelcore
    
    success "Serviço systemd configurado"
}

configure_firewall() {
    log "Configurando firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian UFW
        ufw --force enable
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3000/tcp
        ufw allow 3001/tcp
        success "Firewall UFW configurado"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL FirewallD
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=3001/tcp
        firewall-cmd --reload
        success "Firewall FirewallD configurado"
    else
        warn "Firewall não detectado, configure manualmente"
    fi
}

start_services() {
    log "Iniciando serviços..."
    
    cd $INSTALL_DIR
    docker-compose up -d
    
    # Wait for services to start
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        success "Serviços iniciados com sucesso"
    else
        error "Falha ao iniciar serviços"
        exit 1
    fi
}

create_admin_user() {
    log "Configurando usuário administrador..."
    
    echo ""
    echo -e "${CYAN}Configuração do Usuário Administrador${NC}"
    echo "======================================"
    
    read -p "Nome do administrador: " ADMIN_NAME
    read -p "Email do administrador: " ADMIN_EMAIL
    
    while true; do
        read -s -p "Senha do administrador: " ADMIN_PASSWORD
        echo
        read -s -p "Confirme a senha: " ADMIN_PASSWORD_CONFIRM
        echo
        
        if [[ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD_CONFIRM" ]]; then
            break
        else
            error "Senhas não coincidem. Tente novamente."
        fi
    done
    
    # Create admin user via API (this would be implemented in the actual application)
    log "Usuário administrador será criado no primeiro acesso"
    
    # Save admin credentials
    cat > /etc/sentinelcore/admin.txt << EOF
SentinelCore - Credenciais do Administrador
==========================================
Nome: $ADMIN_NAME
Email: $ADMIN_EMAIL
Senha: $ADMIN_PASSWORD

IMPORTANTE: Delete este arquivo após o primeiro login!
EOF
    
    chmod 600 /etc/sentinelcore/admin.txt
    
    success "Configuração do administrador salva"
}

show_completion_message() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  🎉 INSTALAÇÃO CONCLUÍDA! 🎉                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}SentinelCore foi instalado com sucesso!${NC}"
    echo ""
    echo -e "${YELLOW}Informações de Acesso:${NC}"
    echo "• URL: https://$(hostname -I | awk '{print $1}')"
    echo "• Painel: https://$(hostname -I | awk '{print $1}')/dashboard"
    echo "• API: https://$(hostname -I | awk '{print $1}')/api/v1"
    echo "• Documentação: https://$(hostname -I | awk '{print $1}')/api/docs"
    echo ""
    echo -e "${YELLOW}Monitoramento:${NC}"
    echo "• Grafana: https://$(hostname -I | awk '{print $1}'):3003"
    echo "• Prometheus: https://$(hostname -I | awk '{print $1}'):9090"
    echo ""
    echo -e "${YELLOW}Comandos Úteis:${NC}"
    echo "• Iniciar: systemctl start sentinelcore"
    echo "• Parar: systemctl stop sentinelcore"
    echo "• Status: systemctl status sentinelcore"
    echo "• Logs: journalctl -u sentinelcore -f"
    echo "• Docker: cd $INSTALL_DIR && docker-compose logs -f"
    echo ""
    echo -e "${YELLOW}Arquivos Importantes:${NC}"
    echo "• Configuração: $INSTALL_DIR/.env"
    echo "• Logs: $INSTALL_DIR/logs/"
    echo "• Backups: $INSTALL_DIR/backups/"
    echo "• SSL: $INSTALL_DIR/ssl/"
    echo ""
    echo -e "${RED}IMPORTANTE:${NC}"
    echo "• Credenciais salvas em: /etc/sentinelcore/admin.txt"
    echo "• Delete este arquivo após o primeiro login!"
    echo "• Configure seu domínio e certificado SSL para produção"
    echo "• Altere as senhas padrão antes de usar em produção"
    echo ""
    echo -e "${GREEN}Shield Scan Security - Máxima Segurança, Zero Vulnerabilidades${NC}"
    echo ""
}

# Main installation process
main() {
    print_banner
    
    log "Iniciando instalação do SentinelCore..."
    
    check_root
    check_os
    install_dependencies
    create_user
    setup_directories
    download_sentinelcore
    generate_secrets
    create_env_file
    install_ssl_certificate
    install_application
    setup_systemd_service
    configure_firewall
    start_services
    create_admin_user
    
    show_completion_message
}

# Run installation
main "$@"