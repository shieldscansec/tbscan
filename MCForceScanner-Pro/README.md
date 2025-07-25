# MCForceScanner-Pro 🎯

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://python.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://github.com/mcforcescanner/mcforcescanner-pro/workflows/CI/badge.svg)](https://github.com/mcforcescanner/mcforcescanner-pro/actions)
[![Coverage](https://codecov.io/gh/mcforcescanner/mcforcescanner-pro/branch/main/graph/badge.svg)](https://codecov.io/gh/mcforcescanner/mcforcescanner-pro)
[![Documentation](https://readthedocs.org/projects/mcforcescanner-pro/badge/?version=latest)](https://mcforcescanner-pro.readthedocs.io)

**MCForceScanner-Pro** é uma ferramenta profissional de penetration testing especificamente desenvolvida para auditorias de segurança em servidores Minecraft. Construída com arquitetura modular e escalável, oferece funcionalidades avançadas para profissionais de segurança cibernética.

## ⚠️ Aviso Legal

Esta ferramenta é destinada exclusivamente para:
- **Testes de penetração autorizados**
- **Auditorias de segurança legítimas**
- **Pesquisa em segurança cibernética**
- **Testes em ambientes próprios**

O uso desta ferramenta contra sistemas sem autorização explícita é **ILEGAL** e pode resultar em consequências criminais. Os desenvolvedores não se responsabilizam pelo uso indevido desta ferramenta.

## 🚀 Características Principais

### 🏗️ Arquitetura Profissional
- **Modular**: Separação clara entre camadas (Rede, Exploits, Relatórios, Interface)
- **Escalável**: Suporte a plugins dinâmicos e extensões
- **Assíncrono**: Operações paralelas com asyncio e multiprocessing
- **Configurável**: Configuração via YAML/JSON sem alteração de código

### 🔧 Funcionalidades Avançadas
- **Scanner de Rede**: Detecção automática de servidores Minecraft
- **Exploits Modulares**: Sistema de plugins para diferentes vulnerabilidades
- **Relatórios Multi-formato**: TXT, JSON, PDF, HTML com gráficos
- **Interface CLI Rica**: Menus interativos com Rich e Typer
- **API RESTful**: Integração com painéis web e bots
- **Banco de Dados**: Histórico completo de scans e resultados

### 🛡️ Recursos de Segurança
- **Brute Force Inteligente**: Detecção de proteções anti-bot
- **Rate Limiting**: Controle de velocidade para evitar detecção
- **Proxy Support**: Suporte a proxies e Tor
- **Stealth Mode**: Técnicas de evasão avançadas

## 📦 Instalação

### Pré-requisitos
- Python 3.8+
- Git
- nmap (opcional, para scans de rede avançados)

### Instalação Rápida
```bash
# Clone o repositório
git clone https://github.com/mcforcescanner/mcforcescanner-pro.git
cd mcforcescanner-pro

# Instale as dependências
pip install -e .

# Configure o ambiente
./scripts/setup.sh
```

### Instalação para Desenvolvimento
```bash
# Clone e instale em modo desenvolvimento
git clone https://github.com/mcforcescanner/mcforcescanner-pro.git
cd mcforcescanner-pro

# Instale com dependências de desenvolvimento
pip install -e ".[dev]"

# Configure pre-commit hooks
pre-commit install

# Execute os testes
pytest
```

## 🎯 Uso Rápido

### Interface CLI
```bash
# Scan básico
mcforcescanner scan --target minecraft.example.com

# Scan com configuração personalizada
mcforcescanner scan --config custom_config.yaml

# Modo interativo
mcforcescanner interactive

# Gerar relatório
mcforcescanner report --format pdf --output results.pdf
```

### API Web
```bash
# Iniciar servidor API
mcforcescanner api --host 0.0.0.0 --port 8000

# Painel web disponível em http://localhost:8000
```

### Configuração
```yaml
# config/default.yaml
scanner:
  threads: 50
  timeout: 10
  delay: 0.1
  
targets:
  - host: "minecraft.example.com"
    port: 25565
    
exploits:
  enabled:
    - "auth_bypass"
    - "version_scan"
    - "plugin_enum"
    
reports:
  formats: ["json", "html", "pdf"]
  output_dir: "./results"
```

## 📊 Estrutura do Projeto

```
MCForceScanner-Pro/
├── src/mcforcescanner/           # Código principal
│   ├── core/                     # Núcleo da aplicação
│   ├── network/                  # Módulos de rede
│   ├── exploits/                 # Sistema de exploits
│   ├── reports/                  # Geração de relatórios
│   ├── interface/                # Interface CLI/Web
│   ├── config/                   # Gerenciamento de configuração
│   ├── database/                 # Modelos e ORM
│   ├── plugins/                  # Sistema de plugins
│   ├── api/                      # API RESTful
│   └── utils/                    # Utilitários
├── tests/                        # Testes automatizados
├── docs/                         # Documentação
├── scripts/                      # Scripts de automação
├── web/                          # Interface web
├── config/                       # Arquivos de configuração
└── plugins/                      # Plugins externos
```

## 🔌 Sistema de Plugins

### Criando um Plugin Personalizado
```python
# plugins/my_exploit.py
from mcforcescanner.core.plugin import BaseExploit

class MyCustomExploit(BaseExploit):
    name = "my_custom_exploit"
    description = "Descrição do exploit personalizado"
    
    async def execute(self, target):
        # Implementação do exploit
        result = await self.scan_target(target)
        return result
```

### Carregamento Dinâmico
```python
# Os plugins são carregados automaticamente do diretório plugins/
# Configuração em config/plugins.yaml
plugins:
  enabled:
    - "my_custom_exploit"
  directories:
    - "./plugins"
    - "./custom_plugins"
```

## 📈 API RESTful

### Endpoints Principais
```bash
# Listar targets
GET /api/v1/targets

# Iniciar scan
POST /api/v1/scans
{
  "target": "minecraft.example.com",
  "port": 25565,
  "exploits": ["auth_bypass", "version_scan"]
}

# Status do scan
GET /api/v1/scans/{scan_id}

# Resultados
GET /api/v1/scans/{scan_id}/results

# Relatórios
GET /api/v1/reports/{report_id}
```

### Documentação Interativa
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🧪 Testes

```bash
# Executar todos os testes
pytest

# Testes com cobertura
pytest --cov=mcforcescanner

# Testes específicos
pytest tests/unit/
pytest tests/integration/

# Testes lentos (marcados como slow)
pytest -m "not slow"
```

## 📚 Documentação

### Gerando Documentação
```bash
# Sphinx (API Reference)
cd docs
make html

# MkDocs (Guias de usuário)
mkdocs serve
```

### Links Úteis
- [Documentação Completa](https://mcforcescanner-pro.readthedocs.io)
- [Guia de Desenvolvimento](docs/development.md)
- [API Reference](docs/api.md)
- [Exemplos](docs/examples/)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição
- Siga o PEP 8 e use Black para formatação
- Adicione testes para novas funcionalidades
- Atualize a documentação quando necessário
- Use conventional commits

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Comunidade de segurança cibernética
- Desenvolvedores das bibliotecas utilizadas
- Contribuidores do projeto

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/mcforcescanner/mcforcescanner-pro/issues)
- **Discussões**: [GitHub Discussions](https://github.com/mcforcescanner/mcforcescanner-pro/discussions)
- **Email**: team@mcforcescanner.com

---

**⚡ MCForceScanner-Pro - Auditorias de Segurança Profissionais para Minecraft ⚡**