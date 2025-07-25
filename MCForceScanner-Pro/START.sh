#!/bin/bash

echo "🎯 MCForceScanner-Pro - INICIANDO TUDO!"
echo "====================================="

# Verificar se Python3 está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale Python 3.8+ primeiro."
    exit 1
fi

# Criar e ativar ambiente virtual
echo "📦 Criando ambiente virtual..."
python3 -m venv venv
source venv/bin/activate

# Instalar dependências mínimas
echo "📥 Instalando dependências..."
pip install --upgrade pip --quiet
pip install typer rich pydantic aiohttp dnspython pyyaml jinja2 --quiet

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p data logs results wordlists plugins

# Criar wordlists básicas se não existirem
if [ ! -f "wordlists/usernames.txt" ]; then
    echo "📝 Criando wordlists..."
    cat > wordlists/usernames.txt << EOF
admin
administrator
root
minecraft
server
owner
op
moderator
player
EOF
fi

if [ ! -f "wordlists/passwords.txt" ]; then
    cat > wordlists/passwords.txt << EOF
admin
password
123456
minecraft
server
admin123
password123
root
12345
qwerty
EOF
fi

# Instalar o pacote
echo "🔧 Instalando MCForceScanner-Pro..."
pip install -e . --quiet

# Testar se funcionou
echo "🧪 Testando instalação..."
if python -c "import mcforcescanner; print('✅ MCForceScanner-Pro instalado com sucesso!')" 2>/dev/null; then
    echo ""
    echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    echo ""
    echo "🚀 COMANDOS PARA USAR:"
    echo "  source venv/bin/activate"
    echo "  python -m mcforcescanner.interface.cli interactive"
    echo ""
    echo "📖 OU TESTE RÁPIDO:"
    echo "  python -m mcforcescanner.interface.cli version"
    echo ""
    echo "⚡ INICIAR AGORA? Digite: python -m mcforcescanner.interface.cli interactive"
    echo ""
else
    echo "❌ Erro na instalação. Verifique as dependências."
    exit 1
fi