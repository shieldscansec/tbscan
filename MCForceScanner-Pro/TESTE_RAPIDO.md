# 🚀 Teste Rápido do MCForceScanner-Pro

## ⚡ Instalação em 2 Minutos

```bash
# 1. Entrar no diretório
cd MCForceScanner-Pro

# 2. Executar instalação automática
chmod +x install.sh
./install.sh

# 3. Ativar ambiente virtual
source venv/bin/activate
```

## 🧪 Testando Cada Funcionalidade

### ✅ 1. Teste Básico - Verificar se Funciona
```bash
# Verificar versão
python -m mcforcescanner.interface.cli version

# Deve mostrar:
# ┌─────────────────────────────────────────────┐
# │             📋 Informações do Sistema       │
# ├─────────────────┬───────────────────────────┤
# │ Name            │ MCForceScanner-Pro        │
# │ Version         │ 1.0.0                     │
# │ Author          │ MCForceScanner Team       │
# └─────────────────┴───────────────────────────┘
```

### ✅ 2. Teste de Configuração
```bash
# Ver configuração atual
python -m mcforcescanner.interface.cli config --show

# Validar configuração
python -m mcforcescanner.interface.cli config --validate

# Deve mostrar: ✅ Configuração válida!
```

### ✅ 3. Teste de Scanner de Rede
```bash
# Teste com servidor público (apenas informações)
python -m mcforcescanner.interface.cli scan hypixel.net

# Deve mostrar tabela com:
# ┌─────────────┬───────┬─────────┬─────────┬──────────┬─────────────┐
# │ Host        │ Porta │ Versão  │ Players │ Ping     │ Descrição   │
# ├─────────────┼───────┼─────────┼─────────┼──────────┼─────────────┤
# │ hypixel.net │ 25565 │ 1.8-1.19│ 50000/  │ 45.2ms   │ Hypixel... │
# └─────────────┴───────┴─────────┴─────────┴──────────┴─────────────┘
```

### ✅ 4. Teste de Exploits
```bash
# Listar exploits disponíveis
python -m mcforcescanner.interface.cli exploit --list

# Deve mostrar:
# ┌─────────────────┬─────────────────────────────────┬──────────┐
# │ Nome            │ Descrição                       │ Risco    │
# ├─────────────────┼─────────────────────────────────┼──────────┤
# │ version_scan    │ Escaneia versão do servidor     │ Baixo    │
# │ motd_scan       │ Obtém MOTD do servidor          │ Baixo    │
# └─────────────────┴─────────────────────────────────┴──────────┘

# Executar exploit específico
python -m mcforcescanner.interface.cli exploit hypixel.net:25565 --exploit version_scan
```

### ✅ 5. Teste de Relatórios
```bash
# Gerar relatório HTML
python -m mcforcescanner.interface.cli report --format html

# Deve criar arquivo: results/mcforcescanner_report_YYYYMMDD_HHMMSS.html

# Verificar se foi criado
ls results/*.html
```

### ✅ 6. Teste do Modo Interativo
```bash
# Entrar no modo interativo
python -m mcforcescanner.interface.cli interactive

# Deve mostrar:
# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                    🎯 Professional Minecraft Server Pentest Tool 🎯            ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝
# 
# 🎯 Menu Principal
# 1. 🔍 Escanear Target
# 2. 🌐 Descobrir Rede
# 3. 💥 Executar Exploits
# 4. 📊 Gerar Relatório
# 5. ⚙️ Configurações
# 6. 📋 Status do Sistema
# 7. 🚪 Sair
```

## 🎯 Teste Completo - Cenário Real

### Cenário: Auditoria de um Servidor de Teste

```bash
# 1. Fazer scan básico
python -m mcforcescanner.interface.cli scan minecraft.example.com

# 2. Executar exploits de informação
python -m mcforcescanner.interface.cli exploit minecraft.example.com:25565 --exploit version_scan

# 3. Gerar relatório completo
python -m mcforcescanner.interface.cli report --format html,json --output auditoria_teste

# 4. Verificar arquivos gerados
ls results/auditoria_teste.*
```

## 🔧 Verificação de Funcionalidades

### ✅ Checklist de Testes

- [ ] **Instalação**: Script de instalação executa sem erros
- [ ] **CLI**: Comando `version` mostra informações corretas
- [ ] **Configuração**: Comando `config --show` exibe configurações
- [ ] **Scanner**: Comando `scan` conecta e obtém informações
- [ ] **Exploits**: Comando `exploit --list` mostra exploits disponíveis
- [ ] **Relatórios**: Comando `report` gera arquivos de saída
- [ ] **Interativo**: Modo interativo inicia e mostra menu
- [ ] **Arquivos**: Diretórios `results/`, `logs/`, `data/` são criados

### 🐛 Solução de Problemas Comuns

#### Erro: "ModuleNotFoundError"
```bash
# Solução:
source venv/bin/activate
pip install -e .
```

#### Erro: "FileNotFoundError: config/default.yaml"
```bash
# Solução:
# Verificar se o arquivo existe
ls config/default.yaml

# Se não existir, executar novamente:
./install.sh
```

#### Erro: "Permission denied"
```bash
# Solução:
chmod +x install.sh
chmod 755 venv/bin/activate
```

## 🎮 Testando com Servidor Real

### Servidores Públicos Seguros para Teste

```bash
# Estes servidores são grandes e permitem pings/scans básicos:

# Hypixel (maior servidor Minecraft)
python -m mcforcescanner.interface.cli scan hypixel.net

# CubeCraft
python -m mcforcescanner.interface.cli scan play.cubecraft.net

# Mineplex
python -m mcforcescanner.interface.cli scan us.mineplex.com

# ⚠️ IMPORTANTE: Apenas scan de informações básicas!
# NÃO execute exploits agressivos em servidores públicos!
```

### Configurar Servidor Local para Testes

Se você tem um servidor Minecraft local:

```bash
# Teste completo com servidor próprio
python -m mcforcescanner.interface.cli scan localhost:25565 --exploits

# Descoberta na rede local
python -m mcforcescanner.interface.cli discover 192.168.1.0/24
```

## 📊 Resultados Esperados

### Scan Bem-sucedido:
```
🎮 Servidores Minecraft Descobertos
┌─────────────┬───────┬─────────┬─────────┬──────────┬─────────────┐
│ Host        │ Porta │ Versão  │ Players │ Ping     │ Descrição   │
├─────────────┼───────┼─────────┼─────────┼──────────┼─────────────┤
│ example.com │ 25565 │ 1.19.4  │ 10/100  │ 25.3ms   │ Meu Server  │
└─────────────┴───────┴─────────┴─────────┴──────────┴─────────────┘
✅ Resultados salvos no banco de dados
```

### Exploit Executado:
```
🔍 Resultados dos Exploits
┌──────────────┬─────────────┬─────────────┬─────────────┐
│ Exploit      │ Status      │ Resultado   │ Detalhes    │
├──────────────┼─────────────┼─────────────┼─────────────┤
│ version_scan │ ✅ Sucesso  │ 1.19.4      │ Paper       │
└──────────────┴─────────────┴─────────────┴─────────────┘
```

### Relatório Gerado:
```
📊 Gerando relatório em formato html...
✅ Relatório gerado: results/mcforcescanner_report_20231215_143022.html
```

## 🚀 Próximos Passos

Após testar com sucesso:

1. **Configurar wordlists personalizadas** em `wordlists/`
2. **Ajustar configurações** em `config/default.yaml`
3. **Criar plugins customizados** em `plugins/`
4. **Configurar banco de dados** para histórico
5. **Integrar com outras ferramentas** via API

## 📞 Suporte

Se algum teste falhar:

1. Verificar logs em `logs/mcforcescanner.log`
2. Executar com modo debug: `--verbose`
3. Verificar dependências: `pip list`
4. Reportar issue com detalhes do erro

---

**✅ Se todos os testes passaram, o MCForceScanner-Pro está funcionando perfeitamente!**