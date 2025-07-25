"""
Gerenciador de Configuração para MCForceScanner-Pro

Este módulo gerencia todas as configurações do MCForceScanner-Pro,
incluindo carregamento de arquivos YAML, validação e valores padrão.
"""

import os
import yaml
import json
from pathlib import Path
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field, validator
import logging

from .exceptions import ConfigError

logger = logging.getLogger(__name__)


class ProxyConfig(BaseModel):
    """Configurações de proxy."""
    enabled: bool = False
    type: str = Field(default="http", regex="^(http|socks4|socks5)$")
    host: str = "127.0.0.1"
    port: int = Field(default=8080, ge=1, le=65535)
    username: Optional[str] = None
    password: Optional[str] = None


class ScannerConfig(BaseModel):
    """Configurações do scanner."""
    threads: int = Field(default=50, ge=1, le=1000)
    timeout: int = Field(default=10, ge=1, le=300)
    delay: float = Field(default=0.1, ge=0.0, le=10.0)
    retries: int = Field(default=3, ge=0, le=10)
    stealth_mode: bool = False
    user_agent: str = "MCForceScanner-Pro/1.0"
    random_delay: bool = True
    proxy: ProxyConfig = ProxyConfig()


class DiscoveryConfig(BaseModel):
    """Configurações de descoberta de rede."""
    enabled: bool = True
    port_range: str = "25565-25575"
    common_ports: List[int] = [25565, 25566, 25567, 25568, 25569]
    
    @validator('port_range')
    def validate_port_range(cls, v):
        try:
            start, end = map(int, v.split('-'))
            if start < 1 or end > 65535 or start > end:
                raise ValueError("Range de portas inválido")
            return v
        except ValueError:
            raise ValueError("Formato de range inválido. Use: 'start-end'")


class DNSConfig(BaseModel):
    """Configurações de DNS."""
    servers: List[str] = ["8.8.8.8", "1.1.1.1"]
    timeout: int = Field(default=5, ge=1, le=30)


class PingConfig(BaseModel):
    """Configurações de ping."""
    enabled: bool = True
    timeout: int = Field(default=3, ge=1, le=30)
    count: int = Field(default=3, ge=1, le=10)


class NetworkConfig(BaseModel):
    """Configurações de rede."""
    discovery: DiscoveryConfig = DiscoveryConfig()
    dns: DNSConfig = DNSConfig()
    ping: PingConfig = PingConfig()


class AuthBypassConfig(BaseModel):
    """Configurações de bypass de autenticação."""
    wordlists: Dict[str, str] = {
        "usernames": "./wordlists/usernames.txt",
        "passwords": "./wordlists/passwords.txt"
    }
    max_attempts: int = Field(default=1000, ge=1, le=100000)
    delay_between_attempts: float = Field(default=0.5, ge=0.0, le=10.0)


class BruteForceConfig(BaseModel):
    """Configurações de brute force."""
    enabled: bool = False
    max_attempts: int = Field(default=100, ge=1, le=10000)
    delay: float = Field(default=1.0, ge=0.0, le=10.0)


class RCONConfig(BaseModel):
    """Configurações de RCON."""
    common_passwords: List[str] = ["admin", "password", "123456", "minecraft"]
    port: int = Field(default=25575, ge=1, le=65535)


class ExploitsConfig(BaseModel):
    """Configurações de exploits."""
    enabled: List[str] = [
        "version_scan", "motd_scan", "player_enum", 
        "plugin_enum", "auth_bypass", "rcon_scan", "query_scan"
    ]
    auth_bypass: AuthBypassConfig = AuthBypassConfig()
    brute_force: BruteForceConfig = BruteForceConfig()
    rcon: RCONConfig = RCONConfig()


class TargetConfig(BaseModel):
    """Configuração de um target."""
    host: str
    port: int = Field(default=25565, ge=1, le=65535)
    description: str = ""


class TargetsConfig(BaseModel):
    """Configurações de targets."""
    default: List[TargetConfig] = []
    import_config: Dict[str, Any] = {
        "from_file": None,
        "format": "txt"
    }
    validation: Dict[str, bool] = {
        "check_connectivity": True,
        "resolve_dns": True
    }


class PDFConfig(BaseModel):
    """Configurações de relatório PDF."""
    enabled: bool = False
    template: str = "default"
    include_graphs: bool = True


class HTMLConfig(BaseModel):
    """Configurações de relatório HTML."""
    template: str = "modern"
    include_css: bool = True
    interactive: bool = True


class ExportConfig(BaseModel):
    """Configurações de exportação."""
    compress: bool = True
    encryption: bool = False
    password: Optional[str] = None


class ReportsConfig(BaseModel):
    """Configurações de relatórios."""
    formats: List[str] = ["json", "html", "txt"]
    output_dir: str = "./results"
    pdf: PDFConfig = PDFConfig()
    html: HTMLConfig = HTMLConfig()
    export: ExportConfig = ExportConfig()


class SQLiteConfig(BaseModel):
    """Configurações do SQLite."""
    path: str = "./data/mcforcescanner.db"


class PostgreSQLConfig(BaseModel):
    """Configurações do PostgreSQL."""
    host: str = "localhost"
    port: int = Field(default=5432, ge=1, le=65535)
    database: str = "mcforcescanner"
    username: str = "mcfs_user"
    password: str = "secure_password"


class DatabaseConfig(BaseModel):
    """Configurações do banco de dados."""
    type: str = Field(default="sqlite", regex="^(sqlite|postgresql|mysql)$")
    sqlite: SQLiteConfig = SQLiteConfig()
    postgresql: PostgreSQLConfig = PostgreSQLConfig()
    pool_size: int = Field(default=10, ge=1, le=100)
    max_overflow: int = Field(default=20, ge=0, le=100)
    echo: bool = False


class FileLoggingConfig(BaseModel):
    """Configurações de logging em arquivo."""
    enabled: bool = True
    path: str = "./logs/mcforcescanner.log"
    max_size: str = "10MB"
    backup_count: int = Field(default=5, ge=0, le=100)
    rotation: str = "daily"


class ConsoleLoggingConfig(BaseModel):
    """Configurações de logging no console."""
    enabled: bool = True
    colored: bool = True
    format: str = Field(default="rich", regex="^(simple|detailed|rich)$")


class LoggingConfig(BaseModel):
    """Configurações de logging."""
    level: str = Field(default="INFO", regex="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    file: FileLoggingConfig = FileLoggingConfig()
    console: ConsoleLoggingConfig = ConsoleLoggingConfig()
    modules: Dict[str, str] = {
        "network": "INFO",
        "exploits": "INFO", 
        "database": "WARNING",
        "api": "INFO"
    }


class SecurityConfig(BaseModel):
    """Configurações de segurança da API."""
    cors_enabled: bool = True
    cors_origins: List[str] = ["http://localhost:3000"]
    rate_limiting: bool = True
    max_requests_per_minute: int = Field(default=100, ge=1, le=10000)


class AuthConfig(BaseModel):
    """Configurações de autenticação."""
    enabled: bool = False
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=30, ge=1, le=1440)


class DocsConfig(BaseModel):
    """Configurações de documentação."""
    enabled: bool = True
    swagger_ui: bool = True
    redoc: bool = True


class APIConfig(BaseModel):
    """Configurações da API."""
    host: str = "127.0.0.1"
    port: int = Field(default=8000, ge=1, le=65535)
    debug: bool = False
    security: SecurityConfig = SecurityConfig()
    auth: AuthConfig = AuthConfig()
    docs: DocsConfig = DocsConfig()


class PluginSecurityConfig(BaseModel):
    """Configurações de segurança de plugins."""
    validate_signature: bool = False
    allowed_imports: List[str] = ["mcforcescanner", "asyncio", "aiohttp", "json"]


class PluginsConfig(BaseModel):
    """Configurações de plugins."""
    directories: List[str] = ["./plugins", "./custom_plugins"]
    enabled: List[str] = []
    auto_load: bool = True
    reload_on_change: bool = False
    security: PluginSecurityConfig = PluginSecurityConfig()


class RedisConfig(BaseModel):
    """Configurações do Redis."""
    enabled: bool = False
    host: str = "localhost"
    port: int = Field(default=6379, ge=1, le=65535)
    database: int = Field(default=0, ge=0, le=15)
    password: Optional[str] = None


class MemoryCacheConfig(BaseModel):
    """Configurações de cache em memória."""
    max_size: int = Field(default=1000, ge=1, le=100000)


class CacheConfig(BaseModel):
    """Configurações de cache."""
    enabled: bool = True
    ttl: int = Field(default=3600, ge=1, le=86400)
    redis: RedisConfig = RedisConfig()
    memory: MemoryCacheConfig = MemoryCacheConfig()


class MCForceScannerConfig(BaseModel):
    """Configuração principal do MCForceScanner-Pro."""
    scanner: ScannerConfig = ScannerConfig()
    network: NetworkConfig = NetworkConfig()
    exploits: ExploitsConfig = ExploitsConfig()
    targets: TargetsConfig = TargetsConfig()
    reports: ReportsConfig = ReportsConfig()
    database: DatabaseConfig = DatabaseConfig()
    logging: LoggingConfig = LoggingConfig()
    api: APIConfig = APIConfig()
    plugins: PluginsConfig = PluginsConfig()
    cache: CacheConfig = CacheConfig()


class ConfigManager:
    """Gerenciador de configurações do MCForceScanner-Pro."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Inicializa o gerenciador de configuração.
        
        Args:
            config_path: Caminho para o arquivo de configuração
        """
        self.config_path = config_path or self._find_config_file()
        self._config: Optional[MCForceScannerConfig] = None
        self._load_config()
    
    def _find_config_file(self) -> str:
        """Encontra o arquivo de configuração padrão."""
        possible_paths = [
            "./config/default.yaml",
            "./config.yaml",
            "~/.mcforcescanner/config.yaml",
            "/etc/mcforcescanner/config.yaml"
        ]
        
        for path in possible_paths:
            expanded_path = Path(path).expanduser()
            if expanded_path.exists():
                return str(expanded_path)
        
        # Retorna o caminho padrão se nenhum arquivo for encontrado
        return "./config/default.yaml"
    
    def _load_config(self) -> None:
        """Carrega a configuração do arquivo."""
        try:
            if not Path(self.config_path).exists():
                logger.warning(f"Arquivo de configuração não encontrado: {self.config_path}")
                logger.info("Usando configuração padrão")
                self._config = MCForceScannerConfig()
                return
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                if self.config_path.endswith('.json'):
                    config_data = json.load(f)
                else:
                    config_data = yaml.safe_load(f)
            
            self._config = MCForceScannerConfig(**config_data)
            logger.info(f"Configuração carregada de: {self.config_path}")
            
        except Exception as e:
            raise ConfigError(
                f"Erro ao carregar configuração: {str(e)}",
                config_file=self.config_path
            )
    
    def reload(self) -> None:
        """Recarrega a configuração do arquivo."""
        logger.info("Recarregando configuração...")
        self._load_config()
    
    def save(self, path: Optional[str] = None) -> None:
        """
        Salva a configuração atual em um arquivo.
        
        Args:
            path: Caminho para salvar (usa o atual se não especificado)
        """
        if not self._config:
            raise ConfigError("Nenhuma configuração carregada")
        
        save_path = path or self.config_path
        
        try:
            # Cria o diretório se não existir
            Path(save_path).parent.mkdir(parents=True, exist_ok=True)
            
            with open(save_path, 'w', encoding='utf-8') as f:
                if save_path.endswith('.json'):
                    json.dump(self._config.dict(), f, indent=2, ensure_ascii=False)
                else:
                    yaml.dump(self._config.dict(), f, default_flow_style=False, allow_unicode=True)
            
            logger.info(f"Configuração salva em: {save_path}")
            
        except Exception as e:
            raise ConfigError(f"Erro ao salvar configuração: {str(e)}")
    
    @property
    def config(self) -> MCForceScannerConfig:
        """Retorna a configuração atual."""
        if not self._config:
            raise ConfigError("Configuração não carregada")
        return self._config
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Obtém um valor de configuração usando notação de ponto.
        
        Args:
            key: Chave da configuração (ex: 'scanner.threads')
            default: Valor padrão se a chave não existir
            
        Returns:
            Valor da configuração
        """
        try:
            obj = self.config
            for part in key.split('.'):
                obj = getattr(obj, part)
            return obj
        except (AttributeError, KeyError):
            return default
    
    def set(self, key: str, value: Any) -> None:
        """
        Define um valor de configuração usando notação de ponto.
        
        Args:
            key: Chave da configuração (ex: 'scanner.threads')
            value: Novo valor
        """
        parts = key.split('.')
        obj = self.config
        
        # Navega até o objeto pai
        for part in parts[:-1]:
            obj = getattr(obj, part)
        
        # Define o valor final
        setattr(obj, parts[-1], value)
    
    def validate(self) -> List[str]:
        """
        Valida a configuração atual.
        
        Returns:
            Lista de erros de validação (vazia se válida)
        """
        errors = []
        
        try:
            # A validação é feita automaticamente pelo Pydantic
            # Aqui podemos adicionar validações customizadas
            
            # Verifica se os diretórios de wordlists existem
            wordlists = self.config.exploits.auth_bypass.wordlists
            for name, path in wordlists.items():
                if path and not Path(path).exists():
                    errors.append(f"Wordlist {name} não encontrada: {path}")
            
            # Verifica se os diretórios de plugins existem
            for plugin_dir in self.config.plugins.directories:
                if not Path(plugin_dir).exists():
                    errors.append(f"Diretório de plugins não encontrado: {plugin_dir}")
            
            # Verifica configurações de banco de dados
            if self.config.database.type == "sqlite":
                db_dir = Path(self.config.database.sqlite.path).parent
                if not db_dir.exists():
                    try:
                        db_dir.mkdir(parents=True, exist_ok=True)
                    except Exception as e:
                        errors.append(f"Não foi possível criar diretório do banco: {e}")
            
        except Exception as e:
            errors.append(f"Erro durante validação: {str(e)}")
        
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte a configuração para dicionário."""
        return self.config.dict()
    
    def to_json(self) -> str:
        """Converte a configuração para JSON."""
        return self.config.json(indent=2)
    
    def merge(self, other_config: Union[Dict[str, Any], 'MCForceScannerConfig']) -> None:
        """
        Faz merge com outra configuração.
        
        Args:
            other_config: Configuração para fazer merge
        """
        if isinstance(other_config, dict):
            # Merge recursivo de dicionários
            current_dict = self.to_dict()
            merged_dict = self._deep_merge(current_dict, other_config)
            self._config = MCForceScannerConfig(**merged_dict)
        elif isinstance(other_config, MCForceScannerConfig):
            self.merge(other_config.dict())
        else:
            raise ConfigError("Tipo de configuração inválido para merge")
    
    def _deep_merge(self, dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
        """Faz merge profundo de dois dicionários."""
        result = dict1.copy()
        
        for key, value in dict2.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        
        return result


# Instância global do gerenciador de configuração
config_manager: Optional[ConfigManager] = None


def get_config_manager(config_path: Optional[str] = None) -> ConfigManager:
    """
    Obtém a instância global do gerenciador de configuração.
    
    Args:
        config_path: Caminho para o arquivo de configuração
        
    Returns:
        Instância do ConfigManager
    """
    global config_manager
    
    if config_manager is None:
        config_manager = ConfigManager(config_path)
    
    return config_manager


def get_config() -> MCForceScannerConfig:
    """
    Obtém a configuração atual.
    
    Returns:
        Configuração do MCForceScanner-Pro
    """
    return get_config_manager().config