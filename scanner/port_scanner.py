import socket

class PortScanner:
    """
    Classe para escanear portas em um endereço IP específico.

    :param ip: Endereço IP alvo
    :param ports: Lista de portas para escanear
    :param is_ipv6: Booleano indicando se o IP é IPv6
    """
    def __init__(self, ip, ports, is_ipv6=False):
        """
        Inicializa o scanner de portas.

        :param ip: Endereço IP alvo
        :param ports: Lista de portas para escanear
        :param is_ipv6: Booleano indicando se o IP é IPv6
        """
        self.ip = ip
        self.ports = ports
        self.is_ipv6 = is_ipv6

    def scan_port(self, port):
        """
        Verifica se uma porta está aberta.

        :param port: Porta a ser escaneada
        :return: True se a porta estiver aberta, False caso contrário
        """
        sock = socket.socket(socket.AF_INET6 if self.is_ipv6 else socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((self.ip, port))
        sock.close()
        return result == 0

    def scan_ports(self):
        """
        Escaneia uma lista de portas em um IP específico.

        :return: Lista de portas abertas
        """
        open_ports = []
        for port in self.ports:
            if self.scan_port(port):
                open_ports.append(port)
        return open_ports

# Lista mais extensa de portas comuns
COMMON_PORTS = [
    20, 21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 1024, 1080, 1352, 1433, 1521, 1723, 3306, 3389, 5432, 5900, 8080, 8443
]

# Exemplo de uso
if __name__ == "__main__":
    ip = "2001:0db8:85a3:0000:0000:8a2e:0370:7334"  # Exemplo de endereço IPv6
    ports = COMMON_PORTS
    scanner = PortScanner(ip, ports, is_ipv6=True)
    open_ports = scanner.scan_ports()
    print(f"Portas abertas: {open_ports}")
