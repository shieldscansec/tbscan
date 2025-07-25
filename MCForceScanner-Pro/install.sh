#!/bin/bash

echo "🎯 MCForceScanner-Pro - Instalação Rápida"
echo "========================================"

# Criar ambiente virtual
echo "📦 Criando ambiente virtual..."
python3 -m venv venv
source venv/bin/activate

# Instalar dependências básicas
echo "📥 Instalando dependências..."
pip install --upgrade pip

# Instalar pacotes necessários
pip install typer rich pydantic aiohttp dnspython pyyaml jinja2

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p data logs results wordlists plugins

# Criar wordlists básicas
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

# Instalar o pacote em modo desenvolvimento
echo "🔧 Instalando MCForceScanner-Pro..."
pip install -e .

# Tornar executável
chmod +x install.sh

echo "✅ Instalação concluída!"
echo ""
echo "🚀 Para começar a usar:"
echo "  source venv/bin/activate"
echo "  python -m mcforcescanner.interface.cli --help"
echo ""
echo "📖 Comandos principais:"
echo "  python -m mcforcescanner.interface.cli version"
echo "  python -m mcforcescanner.interface.cli interactive"
echo "  python -m mcforcescanner.interface.cli scan minecraft.example.com"