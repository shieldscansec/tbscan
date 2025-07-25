"""
MCForceScanner-Pro - Professional Minecraft Server Penetration Testing Tool

Uma ferramenta profissional de penetration testing especificamente desenvolvida
para auditorias de segurança em servidores Minecraft.

Author: MCForceScanner Team
License: MIT
Version: 1.0.0
"""

import logging
import sys
from typing import Dict, Any

# Versão do projeto
__version__ = "1.0.0"
__author__ = "MCForceScanner Team"
__email__ = "team@mcforcescanner.com"
__license__ = "MIT"

# Configuração básica de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Logger principal
logger = logging.getLogger(__name__)

# Verificação de versão do Python
if sys.version_info < (3, 8):
    logger.error("MCForceScanner-Pro requer Python 3.8 ou superior")
    sys.exit(1)

# Imports principais
try:
    from .core.scanner import MCForceScanner
    from .core.config import ConfigManager
    from .core.exceptions import (
        MCForceScannerError,
        NetworkError,
        ExploitError,
        ConfigError
    )
    from .network.scanner import NetworkScanner
    from .exploits.manager import ExploitManager
    from .reports.generator import ReportGenerator
    from .database.manager import DatabaseManager
    
    logger.info(f"MCForceScanner-Pro v{__version__} carregado com sucesso")
    
except ImportError as e:
    logger.error(f"Erro ao importar módulos: {e}")
    logger.error("Verifique se todas as dependências estão instaladas")

# Metadados do pacote
__all__ = [
    "__version__",
    "__author__",
    "__email__",
    "__license__",
    "MCForceScanner",
    "ConfigManager",
    "NetworkScanner",
    "ExploitManager",
    "ReportGenerator",
    "DatabaseManager",
    "MCForceScannerError",
    "NetworkError",
    "ExploitError",
    "ConfigError",
]

def get_version() -> str:
    """Retorna a versão atual do MCForceScanner-Pro."""
    return __version__

def get_info() -> Dict[str, Any]:
    """Retorna informações sobre o MCForceScanner-Pro."""
    return {
        "name": "MCForceScanner-Pro",
        "version": __version__,
        "author": __author__,
        "email": __email__,
        "license": __license__,
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "description": "Professional Minecraft Server Penetration Testing Tool"
    }