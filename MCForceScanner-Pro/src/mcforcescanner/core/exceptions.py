"""
Exceções customizadas para MCForceScanner-Pro

Este módulo define todas as exceções específicas do MCForceScanner-Pro,
organizadas em uma hierarquia clara para facilitar o tratamento de erros.
"""

from typing import Optional, Dict, Any


class MCForceScannerError(Exception):
    """
    Exceção base para todos os erros do MCForceScanner-Pro.
    
    Todas as outras exceções customizadas devem herdar desta classe.
    """
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        
    def __str__(self) -> str:
        if self.error_code:
            return f"[{self.error_code}] {self.message}"
        return self.message
        
    def to_dict(self) -> Dict[str, Any]:
        """Converte a exceção para um dicionário."""
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "error_code": self.error_code,
            "details": self.details
        }


class ConfigError(MCForceScannerError):
    """Exceções relacionadas à configuração."""
    
    def __init__(self, message: str, config_file: Optional[str] = None, **kwargs):
        super().__init__(message, **kwargs)
        if config_file:
            self.details["config_file"] = config_file


class NetworkError(MCForceScannerError):
    """Exceções relacionadas a operações de rede."""
    
    def __init__(
        self, 
        message: str, 
        host: Optional[str] = None,
        port: Optional[int] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        if host:
            self.details["host"] = host
        if port:
            self.details["port"] = port


class ConnectionError(NetworkError):
    """Exceções de falha de conexão."""
    pass


class TimeoutError(NetworkError):
    """Exceções de timeout."""
    pass


class ExploitError(MCForceScannerError):
    """Exceções relacionadas à execução de exploits."""
    
    def __init__(
        self, 
        message: str, 
        exploit_name: Optional[str] = None,
        target: Optional[str] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        if exploit_name:
            self.details["exploit_name"] = exploit_name
        if target:
            self.details["target"] = target


class ExploitNotFoundError(ExploitError):
    """Exceção quando um exploit não é encontrado."""
    pass


class ExploitExecutionError(ExploitError):
    """Exceção durante a execução de um exploit."""
    pass


class DatabaseError(MCForceScannerError):
    """Exceções relacionadas ao banco de dados."""
    
    def __init__(
        self, 
        message: str, 
        operation: Optional[str] = None,
        table: Optional[str] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        if operation:
            self.details["operation"] = operation
        if table:
            self.details["table"] = table


class DatabaseConnectionError(DatabaseError):
    """Exceção de falha de conexão com o banco de dados."""
    pass


class DatabaseMigrationError(DatabaseError):
    """Exceção durante migração do banco de dados."""
    pass


class ReportError(MCForceScannerError):
    """Exceções relacionadas à geração de relatórios."""
    
    def __init__(
        self, 
        message: str, 
        report_format: Optional[str] = None,
        output_path: Optional[str] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        if report_format:
            self.details["report_format"] = report_format
        if output_path:
            self.details["output_path"] = output_path


class TemplateError(ReportError):
    """Exceção relacionada a templates de relatório."""
    pass


class PluginError(MCForceScannerError):
    """Exceções relacionadas ao sistema de plugins."""
    
    def __init__(
        self, 
        message: str, 
        plugin_name: Optional[str] = None,
        plugin_path: Optional[str] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        if plugin_name:
            self.details["plugin_name"] = plugin_name
        if plugin_path:
            self.details["plugin_path"] = plugin_path


class PluginLoadError(PluginError):
    """Exceção durante carregamento de plugin."""
    pass


class PluginValidationError(PluginError):
    """Exceção de validação de plugin."""
    pass


class APIError(MCForceScannerError):
    """Exceções relacionadas à API."""
    
    def __init__(
        self, 
        message: str, 
        status_code: Optional[int] = None,
        endpoint: Optional[str] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        if status_code:
            self.details["status_code"] = status_code
        if endpoint:
            self.details["endpoint"] = endpoint


class AuthenticationError(APIError):
    """Exceção de falha de autenticação."""
    pass


class AuthorizationError(APIError):
    """Exceção de falha de autorização."""
    pass


class RateLimitError(APIError):
    """Exceção de limite de taxa excedido."""
    pass


class ValidationError(MCForceScannerError):
    """Exceções de validação de dados."""
    
    def __init__(
        self, 
        message: str, 
        field: Optional[str] = None,
        value: Optional[Any] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        if field:
            self.details["field"] = field
        if value is not None:
            self.details["value"] = value


class ScannerError(MCForceScannerError):
    """Exceções relacionadas ao scanner principal."""
    
    def __init__(
        self, 
        message: str, 
        scan_id: Optional[str] = None,
        phase: Optional[str] = None,
        **kwargs
    ):
        super().__init__(message, **kwargs)
        if scan_id:
            self.details["scan_id"] = scan_id
        if phase:
            self.details["phase"] = phase


class ScannerInitializationError(ScannerError):
    """Exceção durante inicialização do scanner."""
    pass


class ScannerExecutionError(ScannerError):
    """Exceção durante execução do scan."""
    pass


# Mapeamento de códigos de erro para exceções
ERROR_CODE_MAP = {
    "CFG001": ConfigError,
    "CFG002": ConfigError,
    "NET001": NetworkError,
    "NET002": ConnectionError,
    "NET003": TimeoutError,
    "EXP001": ExploitError,
    "EXP002": ExploitNotFoundError,
    "EXP003": ExploitExecutionError,
    "DB001": DatabaseError,
    "DB002": DatabaseConnectionError,
    "DB003": DatabaseMigrationError,
    "RPT001": ReportError,
    "RPT002": TemplateError,
    "PLG001": PluginError,
    "PLG002": PluginLoadError,
    "PLG003": PluginValidationError,
    "API001": APIError,
    "API002": AuthenticationError,
    "API003": AuthorizationError,
    "API004": RateLimitError,
    "VAL001": ValidationError,
    "SCN001": ScannerError,
    "SCN002": ScannerInitializationError,
    "SCN003": ScannerExecutionError,
}


def create_exception_from_code(
    error_code: str, 
    message: str, 
    **kwargs
) -> MCForceScannerError:
    """
    Cria uma exceção baseada no código de erro.
    
    Args:
        error_code: Código do erro
        message: Mensagem de erro
        **kwargs: Argumentos adicionais para a exceção
        
    Returns:
        Instância da exceção apropriada
    """
    exception_class = ERROR_CODE_MAP.get(error_code, MCForceScannerError)
    return exception_class(message, error_code=error_code, **kwargs)


def handle_exception(func):
    """
    Decorator para tratamento padrão de exceções.
    
    Converte exceções não tratadas em MCForceScannerError.
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except MCForceScannerError:
            # Re-raise exceções já conhecidas
            raise
        except Exception as e:
            # Converte exceções desconhecidas
            raise MCForceScannerError(
                f"Erro inesperado em {func.__name__}: {str(e)}",
                error_code="UNK001",
                details={"original_exception": type(e).__name__}
            ) from e
    return wrapper