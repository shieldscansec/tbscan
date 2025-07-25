# 🎯 MCForceScanner-Pro - COMO USAR

## ⚡ **MÉTODO 1: COMANDO MÁGICO (Linux/Mac)**

```bash
# UM COMANDO FAZ TUDO:
./START.sh
```

## 🐍 **MÉTODO 2: PYTHON (Funciona em tudo)**

```bash
# UM COMANDO FAZ TUDO:
python3 RUN.py
```

## 🔧 **MÉTODO 3: MANUAL (Se os outros não funcionarem)**

```bash
# 1. Instalar
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OU
venv\Scripts\activate     # Windows

# 2. Dependências
pip install typer rich pydantic aiohttp dnspython pyyaml jinja2
pip install -e .

# 3. Usar
python -m mcforcescanner.interface.cli interactive
```

---

## 🎮 **DEPOIS DE INSTALAR - COMANDOS PRINCIPAIS**

### 🥇 **MODO INTERATIVO (MAIS FÁCIL)**
```bash
python -m mcforcescanner.interface.cli interactive
```

### 🔍 **COMANDOS DIRETOS**
```bash
# Ver versão
python -m mcforcescanner.interface.cli version

# Escanear servidor
python -m mcforcescanner.interface.cli scan minecraft.example.com

# Descobrir rede
python -m mcforcescanner.interface.cli discover 192.168.1.0/24

# Ver exploits
python -m mcforcescanner.interface.cli exploit --list

# Gerar relatório
python -m mcforcescanner.interface.cli report --format html
```

---

## 🧪 **TESTE RÁPIDO**

```bash
# Testar com servidor público (seguro)
python -m mcforcescanner.interface.cli scan hypixel.net
```

---

## ❓ **SE NÃO FUNCIONAR**

### Erro: "Arquivo não encontrado"
```bash
# Você está no diretório certo?
cd MCForceScanner-Pro
ls -la  # Deve mostrar START.sh e RUN.py
```

### Erro: "Python não encontrado"
```bash
# Instalar Python 3.8+
sudo apt install python3 python3-pip  # Ubuntu
brew install python3                   # Mac
# Ou baixar do site oficial para Windows
```

### Erro: "Permissão negada"
```bash
chmod +x START.sh
chmod +x install.sh
```

---

## 🎯 **RESUMO - ESCOLHA UM:**

| Método | Comando | Quando usar |
|--------|---------|-------------|
| **Bash** | `./START.sh` | Linux/Mac |
| **Python** | `python3 RUN.py` | Qualquer sistema |
| **Manual** | Comandos separados | Se outros falharem |

---

## 🎉 **DEPOIS QUE FUNCIONAR**

1. **Use o modo interativo**: `python -m mcforcescanner.interface.cli interactive`
2. **Teste com servidor seguro**: `scan hypixel.net`
3. **Explore os menus**: Todas as funcionalidades estão lá!

---

**⚡ Escolha um método acima e em 2 minutos você terá uma ferramenta profissional de pentest para Minecraft funcionando!**