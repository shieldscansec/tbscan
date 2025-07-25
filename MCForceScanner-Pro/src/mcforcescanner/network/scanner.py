"""
Scanner de Rede para MCForceScanner-Pro

Este módulo implementa funcionalidades de descoberta e análise de rede
específicas para servidores Minecraft, incluindo ping, port scanning e
detecção de serviços.
"""

import asyncio
import socket
import struct
import json
import time
import logging
from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass
from ipaddress import ip_network, IPv4Address, IPv6Address
import aiohttp
import dns.resolver
import dns.asyncresolver

from ..core.exceptions import NetworkError, ConnectionError, TimeoutError
from ..core.config import get_config

logger = logging.getLogger(__name__)


@dataclass
class MinecraftServer:
    """Representa um servidor Minecraft descoberto."""
    host: str
    port: int
    version: Optional[str] = None
    protocol: Optional[int] = None
    max_players: Optional[int] = None
    online_players: Optional[int] = None
    description: Optional[str] = None
    favicon: Optional[str] = None
    ping: Optional[float] = None
    players: Optional[List[Dict[str, str]]] = None
    mods: Optional[List[Dict[str, Any]]] = None
    forge_data: Optional[Dict[str, Any]] = None
    response_time: Optional[float] = None
    last_seen: Optional[float] = None


@dataclass
class ScanResult:
    """Resultado de um scan de rede."""
    target: str
    port: int
    is_open: bool
    is_minecraft: bool
    server_info: Optional[MinecraftServer] = None
    error: Optional[str] = None
    scan_time: float = 0.0


class MinecraftProtocol:
    """Implementa o protocolo Minecraft para comunicação com servidores."""
    
    @staticmethod
    def pack_varint(value: int) -> bytes:
        """Empacota um VarInt para o protocolo Minecraft."""
        data = b''
        while value >= 0x80:
            data += bytes([value & 0x7F | 0x80])
            value >>= 7
        data += bytes([value & 0x7F])
        return data
    
    @staticmethod
    def unpack_varint(data: bytes, offset: int = 0) -> Tuple[int, int]:
        """Desempacota um VarInt do protocolo Minecraft."""
        value = 0
        position = 0
        current_byte = 0
        
        while True:
            if offset + position >= len(data):
                raise ValueError("VarInt incompleto")
            
            current_byte = data[offset + position]
            value |= (current_byte & 0x7F) << (position * 7)
            
            if (current_byte & 0x80) == 0:
                break
                
            position += 1
            if position >= 5:
                raise ValueError("VarInt muito longo")
        
        return value, position + 1
    
    @staticmethod
    def pack_string(text: str) -> bytes:
        """Empacota uma string para o protocolo Minecraft."""
        encoded = text.encode('utf-8')
        return MinecraftProtocol.pack_varint(len(encoded)) + encoded
    
    @staticmethod
    def unpack_string(data: bytes, offset: int = 0) -> Tuple[str, int]:
        """Desempacota uma string do protocolo Minecraft."""
        length, varint_size = MinecraftProtocol.unpack_varint(data, offset)
        string_start = offset + varint_size
        string_end = string_start + length
        
        if string_end > len(data):
            raise ValueError("String incompleta")
        
        string_data = data[string_start:string_end]
        return string_data.decode('utf-8'), varint_size + length
    
    @staticmethod
    def create_handshake_packet(host: str, port: int, protocol_version: int = 47) -> bytes:
        """Cria um pacote de handshake."""
        packet_id = b'\x00'  # Handshake packet ID
        protocol = MinecraftProtocol.pack_varint(protocol_version)
        server_address = MinecraftProtocol.pack_string(host)
        server_port = struct.pack('>H', port)
        next_state = MinecraftProtocol.pack_varint(1)  # Status
        
        packet_data = packet_id + protocol + server_address + server_port + next_state
        packet_length = MinecraftProtocol.pack_varint(len(packet_data))
        
        return packet_length + packet_data
    
    @staticmethod
    def create_status_request() -> bytes:
        """Cria um pacote de requisição de status."""
        packet_id = b'\x00'  # Status Request packet ID
        packet_length = MinecraftProtocol.pack_varint(len(packet_id))
        return packet_length + packet_id
    
    @staticmethod
    def create_ping_packet(payload: int = None) -> bytes:
        """Cria um pacote de ping."""
        if payload is None:
            payload = int(time.time() * 1000)
        
        packet_id = b'\x01'  # Ping packet ID
        ping_payload = struct.pack('>Q', payload)
        packet_data = packet_id + ping_payload
        packet_length = MinecraftProtocol.pack_varint(len(packet_data))
        
        return packet_length + packet_data


class NetworkScanner:
    """Scanner de rede principal para descoberta de servidores Minecraft."""
    
    def __init__(self):
        """Inicializa o scanner de rede."""
        self.config = get_config()
        self.session: Optional[aiohttp.ClientSession] = None
        self.resolver = dns.asyncresolver.Resolver()
        self.resolver.nameservers = self.config.network.dns.servers
        self.resolver.timeout = self.config.network.dns.timeout
    
    async def __aenter__(self):
        """Context manager entry."""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        await self.stop()
    
    async def start(self) -> None:
        """Inicia o scanner."""
        connector = aiohttp.TCPConnector(
            limit=self.config.scanner.threads,
            limit_per_host=10,
            ttl_dns_cache=300
        )
        
        timeout = aiohttp.ClientTimeout(
            total=self.config.scanner.timeout,
            connect=self.config.scanner.timeout // 2
        )
        
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': self.config.scanner.user_agent}
        )
        
        logger.info("Scanner de rede iniciado")
    
    async def stop(self) -> None:
        """Para o scanner."""
        if self.session:
            await self.session.close()
            self.session = None
        logger.info("Scanner de rede parado")
    
    async def resolve_hostname(self, hostname: str) -> List[str]:
        """
        Resolve um hostname para endereços IP.
        
        Args:
            hostname: Nome do host para resolver
            
        Returns:
            Lista de endereços IP
        """
        try:
            # Tenta IPv4 primeiro
            try:
                result = await self.resolver.resolve(hostname, 'A')
                return [str(rdata) for rdata in result]
            except Exception:
                pass
            
            # Depois tenta IPv6
            try:
                result = await self.resolver.resolve(hostname, 'AAAA')
                return [str(rdata) for rdata in result]
            except Exception:
                pass
            
            # Se falhar, tenta resolução síncrona como fallback
            return [socket.gethostbyname(hostname)]
            
        except Exception as e:
            raise NetworkError(f"Falha ao resolver hostname {hostname}: {str(e)}")
    
    async def check_port_open(self, host: str, port: int, timeout: float = None) -> bool:
        """
        Verifica se uma porta está aberta.
        
        Args:
            host: Endereço do host
            port: Porta para verificar
            timeout: Timeout da conexão
            
        Returns:
            True se a porta estiver aberta
        """
        if timeout is None:
            timeout = self.config.scanner.timeout
        
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=timeout
            )
            writer.close()
            await writer.wait_closed()
            return True
        except Exception:
            return False
    
    async def ping_minecraft_server(self, host: str, port: int = 25565) -> Optional[MinecraftServer]:
        """
        Faz ping em um servidor Minecraft e obtém informações.
        
        Args:
            host: Endereço do servidor
            port: Porta do servidor
            
        Returns:
            Informações do servidor ou None se falhar
        """
        start_time = time.time()
        
        try:
            # Conecta ao servidor
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=self.config.scanner.timeout
            )
            
            try:
                # Envia handshake
                handshake = MinecraftProtocol.create_handshake_packet(host, port)
                writer.write(handshake)
                await writer.drain()
                
                # Envia requisição de status
                status_request = MinecraftProtocol.create_status_request()
                writer.write(status_request)
                await writer.drain()
                
                # Lê resposta
                response_length_data = await reader.read(5)
                if not response_length_data:
                    return None
                
                response_length, varint_size = MinecraftProtocol.unpack_varint(response_length_data)
                response_data = await reader.read(response_length)
                
                if len(response_data) < response_length:
                    return None
                
                # Parse da resposta
                packet_id, offset = MinecraftProtocol.unpack_varint(response_data)
                if packet_id != 0x00:  # Status Response packet ID
                    return None
                
                json_string, _ = MinecraftProtocol.unpack_string(response_data, offset)
                server_data = json.loads(json_string)
                
                # Mede ping
                ping_start = time.time()
                ping_packet = MinecraftProtocol.create_ping_packet()
                writer.write(ping_packet)
                await writer.drain()
                
                ping_response = await reader.read(1024)
                ping_time = (time.time() - ping_start) * 1000
                
                # Cria objeto MinecraftServer
                server = MinecraftServer(
                    host=host,
                    port=port,
                    response_time=time.time() - start_time,
                    ping=ping_time,
                    last_seen=time.time()
                )
                
                # Parse dos dados do servidor
                if 'version' in server_data:
                    server.version = server_data['version'].get('name')
                    server.protocol = server_data['version'].get('protocol')
                
                if 'players' in server_data:
                    server.max_players = server_data['players'].get('max')
                    server.online_players = server_data['players'].get('online')
                    server.players = server_data['players'].get('sample', [])
                
                if 'description' in server_data:
                    desc = server_data['description']
                    if isinstance(desc, dict):
                        server.description = desc.get('text', '')
                    else:
                        server.description = str(desc)
                
                server.favicon = server_data.get('favicon')
                
                # Parse de dados do Forge (se presente)
                if 'modinfo' in server_data:
                    server.forge_data = server_data['modinfo']
                    server.mods = server_data['modinfo'].get('modList', [])
                
                return server
                
            finally:
                writer.close()
                await writer.wait_closed()
                
        except asyncio.TimeoutError:
            raise TimeoutError(f"Timeout ao conectar com {host}:{port}")
        except Exception as e:
            logger.debug(f"Erro ao fazer ping no servidor {host}:{port}: {str(e)}")
            return None
    
    async def scan_port_range(self, host: str, start_port: int, end_port: int) -> List[int]:
        """
        Escaneia um range de portas.
        
        Args:
            host: Endereço do host
            start_port: Porta inicial
            end_port: Porta final
            
        Returns:
            Lista de portas abertas
        """
        open_ports = []
        semaphore = asyncio.Semaphore(self.config.scanner.threads)
        
        async def check_port(port: int) -> None:
            async with semaphore:
                if await self.check_port_open(host, port):
                    open_ports.append(port)
                
                if self.config.scanner.delay > 0:
                    await asyncio.sleep(self.config.scanner.delay)
        
        tasks = [check_port(port) for port in range(start_port, end_port + 1)]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        return sorted(open_ports)
    
    async def discover_minecraft_servers(self, target: str) -> List[MinecraftServer]:
        """
        Descobre servidores Minecraft em um target.
        
        Args:
            target: Target para escanear (IP, hostname ou CIDR)
            
        Returns:
            Lista de servidores Minecraft encontrados
        """
        servers = []
        
        try:
            # Determina se é um range de IPs ou host único
            if '/' in target:
                # Range CIDR
                network = ip_network(target, strict=False)
                hosts = [str(ip) for ip in network.hosts()]
            else:
                # Host único - resolve se necessário
                try:
                    # Tenta interpretar como IP
                    IPv4Address(target)
                    hosts = [target]
                except ValueError:
                    try:
                        IPv6Address(target)
                        hosts = [target]
                    except ValueError:
                        # É um hostname - resolve
                        hosts = await self.resolve_hostname(target)
            
            # Obtém configuração de portas
            port_range = self.config.network.discovery.port_range
            start_port, end_port = map(int, port_range.split('-'))
            common_ports = self.config.network.discovery.common_ports
            
            # Combina portas comuns com range
            all_ports = set(common_ports + list(range(start_port, end_port + 1)))
            
            # Escaneia cada host
            semaphore = asyncio.Semaphore(self.config.scanner.threads)
            
            async def scan_host_port(host: str, port: int) -> None:
                async with semaphore:
                    try:
                        server = await self.ping_minecraft_server(host, port)
                        if server:
                            servers.append(server)
                            logger.info(f"Servidor Minecraft encontrado: {host}:{port}")
                    except Exception as e:
                        logger.debug(f"Erro ao escanear {host}:{port}: {str(e)}")
                    
                    if self.config.scanner.delay > 0:
                        await asyncio.sleep(self.config.scanner.delay)
            
            tasks = []
            for host in hosts:
                for port in all_ports:
                    tasks.append(scan_host_port(host, port))
            
            await asyncio.gather(*tasks, return_exceptions=True)
            
        except Exception as e:
            raise NetworkError(f"Erro durante descoberta: {str(e)}")
        
        return servers
    
    async def scan_target(self, target: str, ports: Optional[List[int]] = None) -> List[ScanResult]:
        """
        Escaneia um target específico.
        
        Args:
            target: Target para escanear
            ports: Lista de portas específicas (usa padrão se None)
            
        Returns:
            Lista de resultados do scan
        """
        results = []
        
        if ports is None:
            port_range = self.config.network.discovery.port_range
            start_port, end_port = map(int, port_range.split('-'))
            ports = list(range(start_port, end_port + 1))
        
        try:
            # Resolve hostname se necessário
            hosts = [target]
            if not target.replace('.', '').isdigit():  # Não é IP
                try:
                    hosts = await self.resolve_hostname(target)
                except Exception:
                    hosts = [target]  # Tenta usar diretamente
            
            semaphore = asyncio.Semaphore(self.config.scanner.threads)
            
            async def scan_host_port(host: str, port: int) -> None:
                async with semaphore:
                    start_time = time.time()
                    result = ScanResult(
                        target=host,
                        port=port,
                        is_open=False,
                        is_minecraft=False,
                        scan_time=0.0
                    )
                    
                    try:
                        # Verifica se a porta está aberta
                        result.is_open = await self.check_port_open(host, port)
                        
                        if result.is_open:
                            # Tenta identificar como servidor Minecraft
                            server = await self.ping_minecraft_server(host, port)
                            if server:
                                result.is_minecraft = True
                                result.server_info = server
                    
                    except Exception as e:
                        result.error = str(e)
                    
                    finally:
                        result.scan_time = time.time() - start_time
                        results.append(result)
                    
                    if self.config.scanner.delay > 0:
                        await asyncio.sleep(self.config.scanner.delay)
            
            tasks = []
            for host in hosts:
                for port in ports:
                    tasks.append(scan_host_port(host, port))
            
            await asyncio.gather(*tasks, return_exceptions=True)
            
        except Exception as e:
            raise NetworkError(f"Erro durante scan: {str(e)}")
        
        return results
    
    async def get_server_info(self, host: str, port: int = 25565) -> Optional[MinecraftServer]:
        """
        Obtém informações detalhadas de um servidor específico.
        
        Args:
            host: Endereço do servidor
            port: Porta do servidor
            
        Returns:
            Informações do servidor ou None se falhar
        """
        try:
            return await self.ping_minecraft_server(host, port)
        except Exception as e:
            logger.error(f"Erro ao obter informações do servidor {host}:{port}: {str(e)}")
            return None
    
    async def check_server_online(self, host: str, port: int = 25565) -> bool:
        """
        Verifica se um servidor está online.
        
        Args:
            host: Endereço do servidor
            port: Porta do servidor
            
        Returns:
            True se o servidor estiver online
        """
        try:
            server = await self.ping_minecraft_server(host, port)
            return server is not None
        except Exception:
            return False
    
    def parse_port_range(self, port_range: str) -> List[int]:
        """
        Parse de string de range de portas.
        
        Args:
            port_range: String do range (ex: "25565-25575" ou "25565,25566,25567")
            
        Returns:
            Lista de portas
        """
        ports = []
        
        for part in port_range.split(','):
            part = part.strip()
            if '-' in part:
                start, end = map(int, part.split('-'))
                ports.extend(range(start, end + 1))
            else:
                ports.append(int(part))
        
        return sorted(set(ports))  # Remove duplicatas e ordena


async def scan_network(targets: List[str], config_path: Optional[str] = None) -> List[MinecraftServer]:
    """
    Função de conveniência para escanear múltiplos targets.
    
    Args:
        targets: Lista de targets para escanear
        config_path: Caminho para arquivo de configuração
        
    Returns:
        Lista de servidores Minecraft encontrados
    """
    all_servers = []
    
    async with NetworkScanner() as scanner:
        tasks = []
        for target in targets:
            tasks.append(scanner.discover_minecraft_servers(target))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_servers.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Erro durante scan: {str(result)}")
    
    return all_servers