# 🎯 MCForceScanner-Pro - Guia de Comandos

## 🚀 Instalação e Configuração

### 1. Instalação Rápida
```bash
# Clone o projeto
git clone <repo-url>
cd MCForceScanner-Pro

# Execute a instalação
chmod +x install.sh
./install.sh

# Ative o ambiente virtual
source venv/bin/activate
```

### 2. Instalação Manual
```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install typer rich pydantic aiohttp dnspython pyyaml jinja2

# Instalar o projeto
pip install -e .
```

## 📋 Comandos Principais

### 🔍 **1. INFORMAÇÕES DO SISTEMA**

```bash
# Versão e informações
python -m mcforcescanner.interface.cli version

# Status do sistema
python -m mcforcescanner.interface.cli interactive
# Depois escolha opção 6 (Status do Sistema)
```

### ⚙️ **2. CONFIGURAÇÃO**

```bash
# Mostrar configuração atual
python -m mcforcescanner.interface.cli config --show

# Validar configuração
python -m mcforcescanner.interface.cli config --validate

# Editar configuração (placeholder)
python -m mcforcescanner.interface.cli config --edit
```

### 🌐 **3. SCANNER DE REDE**

```bash
# Scan básico de um servidor
python -m mcforcescanner.interface.cli scan minecraft.example.com

# Scan com portas específicas
python -m mcforcescanner.interface.cli scan minecraft.example.com --ports 25565,25566,25567

# Scan com range de portas
python -m mcforcescanner.interface.cli scan minecraft.example.com --ports 25565-25575

# Scan com exploits
python -m mcforcescanner.interface.cli scan minecraft.example.com --exploits

# Descoberta em rede
python -m mcforcescanner.interface.cli discover 192.168.1.0/24

# Descoberta com configurações personalizadas
python -m mcforcescanner.interface.cli discover 10.0.0.0/24 --threads 100 --timeout 3
```

### 💥 **4. EXPLOITS**

```bash
# Listar exploits disponíveis
python -m mcforcescanner.interface.cli exploit --list

# Executar exploit específico
python -m mcforcescanner.interface.cli exploit minecraft.example.com:25565 --exploit version_scan

# Executar todos os exploits
python -m mcforcescanner.interface.cli exploit minecraft.example.com:25565
```

### 📊 **5. RELATÓRIOS**

```bash
# Gerar relatório HTML
python -m mcforcescanner.interface.cli report --format html

# Gerar relatório JSON
python -m mcforcescanner.interface.cli report --format json --output meu_relatorio.json

# Gerar múltiplos formatos
python -m mcforcescanner.interface.cli report --format html,json,txt
```

### 🖥️ **6. MODO INTERATIVO**

```bash
# Entrar no modo interativo
python -m mcforcescanner.interface.cli interactive
```

**No modo interativo você terá:**
- 1. 🔍 Escanear Target
- 2. 🌐 Descobrir Rede  
- 3. 💥 Executar Exploits
- 4. 📊 Gerar Relatório
- 5. ⚙️ Configurações
- 6. 📋 Status do Sistema
- 7. 🚪 Sair

## 🎯 Exemplos Práticos de Uso

### Cenário 1: Scan Básico de um Servidor
```bash
# Ativar ambiente
source venv/bin/activate

# Fazer scan básico
python -m mcforcescanner.interface.cli scan hypixel.net

# Resultado: Tabela com informações do servidor
```

### Cenário 2: Descoberta de Rede Local
```bash
# Descobrir servidores na rede local
python -m mcforcescanner.interface.cli discover 192.168.1.0/24 --threads 50

# Salvar resultados
python -m mcforcescanner.interface.cli discover 192.168.1.0/24 --output servidores_locais.json
```

### Cenário 3: Auditoria Completa
```bash
# 1. Scan com exploits
python -m mcforcescanner.interface.cli scan minecraft.example.com --exploits --save-db

# 2. Gerar relatório completo
python -m mcforcescanner.interface.cli report --format html,json --output auditoria_completa
```

### Cenário 4: Modo Interativo para Iniciantes
```bash
# Entrar no modo interativo
python -m mcforcescanner.interface.cli interactive

# Seguir o menu guiado:
# 1. Escolher "1. 🔍 Escanear Target"
# 2. Digitar: minecraft.example.com
# 3. Deixar portas em branco (padrão)
# 4. Escolher se quer executar exploits
```

## 🔧 Comandos de Desenvolvimento

### Executar Testes
```bash
# Instalar dependências de teste
pip install pytest pytest-asyncio

# Executar testes (quando implementados)
pytest tests/
```

### Verificar Código
```bash
# Instalar ferramentas de qualidade
pip install black isort flake8 mypy

# Formatar código
black src/
isort src/

# Verificar qualidade
flake8 src/
mypy src/ --ignore-missing-imports
```

## 📁 Estrutura de Arquivos Importante

```
MCForceScanner-Pro/
├── config/default.yaml         # Configuração principal
├── wordlists/                  # Listas para brute force
│   ├── usernames.txt
│   └── passwords.txt
├── results/                    # Resultados de scans
├── logs/                       # Arquivos de log
├── data/                       # Banco de dados
└── src/mcforcescanner/         # Código fonte
```

## 🎮 Testando com Servidores Reais

### Servidores Públicos para Teste (APENAS PARA APRENDIZADO)
```bash
# Servidores grandes (apenas scan de informações)
python -m mcforcescanner.interface.cli scan hypixel.net
python -m mcforcescanner.interface.cli scan mineplex.com
python -m mcforcescanner.interface.cli scan cubecraft.net

# ⚠️ IMPORTANTE: Apenas para teste de conectividade
# NÃO execute exploits em servidores que não são seus!
```

### Configurar Servidor de Teste Local
```bash
# Se você tem um servidor Minecraft local
python -m mcforcescanner.interface.cli scan localhost:25565 --exploits

# Ou servidor em rede local
python -m mcforcescanner.interface.cli scan 192.168.1.100:25565
```

## 🔧 Solução de Problemas

### Erro: "Módulo não encontrado"
```bash
# Verificar se está no ambiente virtual
source venv/bin/activate

# Reinstalar o projeto
pip install -e .
```

### Erro: "Configuração não encontrada"
```bash
# Verificar se existe o arquivo de configuração
ls config/default.yaml

# Se não existir, copiar do exemplo
cp config/default.yaml config/local.yaml
```

### Erro: "Permissão negada"
```bash
# Dar permissões aos scripts
chmod +x install.sh
chmod +x scripts/*.sh
```

## 📊 Formatos de Saída

### JSON
```bash
python -m mcforcescanner.interface.cli scan minecraft.example.com --format json
```

### HTML (com tabelas bonitas)
```bash
python -m mcforcescanner.interface.cli scan minecraft.example.com --format table
```

### Salvar em arquivo
```bash
python -m mcforcescanner.interface.cli scan minecraft.example.com --output resultado.json
```

## 🎯 Comandos Mais Usados

```bash
# Top 5 comandos mais úteis:

# 1. Modo interativo (mais fácil para iniciantes)
python -m mcforcescanner.interface.cli interactive

# 2. Scan básico
python -m mcforcescanner.interface.cli scan <servidor>

# 3. Descoberta de rede
python -m mcforcescanner.interface.cli discover <rede>/24

# 4. Ver configuração
python -m mcforcescanner.interface.cli config --show

# 5. Ver versão
python -m mcforcescanner.interface.cli version
```

## ⚠️ Aviso Legal

**IMPORTANTE**: Esta ferramenta deve ser usada apenas em:
- Servidores próprios
- Testes autorizados
- Ambientes de laboratório
- Auditorias com permissão explícita

O uso não autorizado pode ser **ILEGAL** e resultar em consequências criminais!

---

**🎯 MCForceScanner-Pro - Use com Responsabilidade!**