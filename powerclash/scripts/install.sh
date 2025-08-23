#!/bin/bash

# PowerClash - Script de Instalação Completa
# Versão: 1.0.0
# Autor: PowerClash Team

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
 ____                           ____ _           _     
|  _ \ _____      _____ _ __   / ___| | __ _ ___| |__  
| |_) / _ \ \ /\ / / _ \ '__| | |   | |/ _` / __| '_ \ 
|  __/ (_) \ V  V /  __/ |    | |___| | (_| \__ \ | | |
|_|   \___/ \_/\_/ \___|_|     \____|_|\__,_|___/_| |_|

Sistema Avançado de Detecção de Cheats
EOF
echo -e "${NC}"

log "Iniciando instalação do PowerClash..."

# Verificar se é root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root!"
fi

# Verificar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    error "Sistema operacional não suportado: $OSTYPE"
fi

log "Sistema operacional detectado: $OS"

# Verificar dependências
check_dependencies() {
    log "Verificando dependências..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não encontrado. Instale Node.js 18+ primeiro."
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js versão 18+ é necessária. Versão atual: $(node --version)"
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        error "npm não encontrado."
    fi
    
    # Docker (opcional)
    if command -v docker &> /dev/null; then
        log "Docker encontrado - modo containerizado disponível"
        DOCKER_AVAILABLE=true
    else
        warn "Docker não encontrado - apenas instalação local disponível"
        DOCKER_AVAILABLE=false
    fi
    
    # MongoDB
    if command -v mongod &> /dev/null; then
        log "MongoDB encontrado"
        MONGODB_LOCAL=true
    else
        warn "MongoDB não encontrado localmente"
        MONGODB_LOCAL=false
    fi
    
    # Redis
    if command -v redis-server &> /dev/null; then
        log "Redis encontrado"
        REDIS_LOCAL=true
    else
        warn "Redis não encontrado localmente"
        REDIS_LOCAL=false
    fi
    
    log "Verificação de dependências concluída"
}

# Instalar dependências do sistema
install_system_dependencies() {
    log "Instalando dependências do sistema..."
    
    if [[ "$OS" == "linux" ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y curl wget git build-essential python3 python3-pip
        elif command -v yum &> /dev/null; then
            sudo yum update -y
            sudo yum install -y curl wget git gcc gcc-c++ make python3 python3-pip
        fi
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew update
            brew install curl wget git python3
        else
            warn "Homebrew não encontrado. Instale manualmente as dependências."
        fi
    fi
}

# Instalar dependências do projeto
install_project_dependencies() {
    log "Instalando dependências do projeto..."
    
    # Instalar dependências do root
    npm install
    
    # Instalar dependências do backend
    log "Instalando dependências do backend..."
    cd backend
    npm install
    cd ..
    
    # Instalar dependências do frontend
    log "Instalando dependências do frontend..."
    cd web-panel
    npm install
    cd ..
    
    log "Dependências do projeto instaladas"
}

# Configurar banco de dados
setup_database() {
    log "Configurando banco de dados..."
    
    if [[ "$DOCKER_AVAILABLE" == true ]]; then
        log "Usando Docker para banco de dados..."
        docker-compose up -d mongodb redis
    else
        if [[ "$MONGODB_LOCAL" == false ]] || [[ "$REDIS_LOCAL" == false ]]; then
            warn "MongoDB ou Redis não encontrados localmente"
            warn "Considere usar Docker ou instalar manualmente"
        fi
    fi
}

# Configurar variáveis de ambiente
setup_environment() {
    log "Configurando variáveis de ambiente..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        log "Criando arquivo .env do backend..."
        cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/powerclash
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
EOF
    fi
    
    # Frontend .env
    if [ ! -f "web-panel/.env" ]; then
        log "Criando arquivo .env do frontend..."
        cat > web-panel/.env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
GENERATE_SOURCEMAP=false
EOF
    fi
    
    log "Variáveis de ambiente configuradas"
}

# Executar migrações
run_migrations() {
    log "Executando migrações do banco de dados..."
    
    cd backend
    if [ -f "scripts/migrate.js" ]; then
        npm run migrate
    else
        log "Nenhuma migração encontrada"
    fi
    cd ..
}

# Executar seeds
run_seeds() {
    log "Executando seeds do banco de dados..."
    
    cd backend
    if [ -f "scripts/seed.js" ]; then
        npm run seed
    else
        log "Nenhum seed encontrado"
    fi
    cd ..
}

# Build do projeto
build_project() {
    log "Fazendo build do projeto..."
    
    # Build do frontend
    log "Build do frontend..."
    cd web-panel
    npm run build
    cd ..
    
    # Build do backend (se necessário)
    log "Build do backend..."
    cd backend
    if grep -q "build" package.json; then
        npm run build
    fi
    cd ..
    
    log "Build concluído"
}

# Configurar serviços do sistema
setup_services() {
    log "Configurando serviços do sistema..."
    
    # Criar diretório de logs
    mkdir -p logs
    
    # Configurar PM2 (se disponível)
    if command -v pm2 &> /dev/null; then
        log "Configurando PM2..."
        
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'powerclash-backend',
      script: 'backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF
    else
        warn "PM2 não encontrado. Considere instalar para gerenciamento de processos."
    fi
}

# Executar testes
run_tests() {
    log "Executando testes..."
    
    # Testes do backend
    cd backend
    if grep -q "test" package.json; then
        npm test
    fi
    cd ..
    
    # Testes do frontend
    cd web-panel
    if grep -q "test" package.json; then
        npm test -- --watchAll=false
    fi
    cd ..
    
    log "Testes concluídos"
}

# Verificar instalação
verify_installation() {
    log "Verificando instalação..."
    
    # Verificar se os serviços estão funcionando
    if [[ "$DOCKER_AVAILABLE" == true ]]; then
        docker-compose ps
    fi
    
    # Verificar arquivos de configuração
    if [ -f "backend/.env" ] && [ -f "web-panel/.env" ]; then
        log "Arquivos de configuração OK"
    else
        error "Arquivos de configuração não encontrados"
    fi
    
    log "Verificação concluída"
}

# Mostrar informações pós-instalação
show_post_install_info() {
    log "Instalação concluída com sucesso!"
    
    echo ""
    echo -e "${BLUE}=== Informações Pós-Instalação ===${NC}"
    echo ""
    echo -e "${GREEN}Para iniciar o PowerClash:${NC}"
    echo "  npm run dev          # Modo desenvolvimento"
    echo "  npm run start        # Modo produção"
    echo ""
    echo -e "${GREEN}URLs de acesso:${NC}"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:3001"
    echo "  API Docs: http://localhost:3001/api-docs"
    echo ""
    echo -e "${GREEN}Comandos úteis:${NC}"
    echo "  npm run build:all    # Build completo"
    echo "  npm run test         # Executar testes"
    echo "  npm run lint         # Verificar código"
    echo ""
    echo -e "${GREEN}Docker (se disponível):${NC}"
    echo "  docker-compose up -d # Iniciar serviços"
    echo "  docker-compose logs  # Ver logs"
    echo ""
    echo -e "${YELLOW}Próximos passos:${NC}"
    echo "1. Configure as variáveis de ambiente conforme necessário"
    echo "2. Ajuste as configurações de segurança para produção"
    echo "3. Configure certificados SSL para HTTPS"
    echo "4. Configure backup automático do banco de dados"
    echo ""
    echo -e "${GREEN}Documentação:${NC}"
    echo "  README.md           # Documentação principal"
    echo "  docs/               # Documentação detalhada"
    echo ""
    echo -e "${GREEN}Suporte:${NC}"
    echo "  Email: support@powerclash.com"
    echo "  GitHub: https://github.com/powerclash/detector"
    echo ""
}

# Menu principal
main() {
    log "Iniciando instalação do PowerClash..."
    
    # Verificar argumentos
    SKIP_TESTS=false
    SKIP_BUILD=false
    DOCKER_MODE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --docker)
                DOCKER_MODE=true
                shift
                ;;
            --help)
                echo "Uso: $0 [opções]"
                echo "Opções:"
                echo "  --skip-tests    Pular execução de testes"
                echo "  --skip-build    Pular build do projeto"
                echo "  --docker        Usar modo Docker"
                echo "  --help          Mostrar esta ajuda"
                exit 0
                ;;
            *)
                error "Opção desconhecida: $1"
                ;;
        esac
    done
    
    # Executar instalação
    check_dependencies
    install_system_dependencies
    install_project_dependencies
    setup_environment
    setup_database
    
    if [[ "$SKIP_BUILD" == false ]]; then
        build_project
    fi
    
    run_migrations
    run_seeds
    setup_services
    
    if [[ "$SKIP_TESTS" == false ]]; then
        run_tests
    fi
    
    verify_installation
    show_post_install_info
}

# Executar instalação
main "$@"