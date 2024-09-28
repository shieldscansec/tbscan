"""
Módulo para detecção de serviços em portas específicas.

Autor: BlackNight
"""

import socket
import logging

class ServiceDetector:
    """
    Classe para detectar serviços rodando em portas específicas.

    :param ip: Endereço IP alvo
    """
    def __init__(self, ip):
        self.ip = ip

    def detect_service(self, port):
        """
        Detecta o serviço rodando em uma porta específica.

        :param port: Porta a ser verificada
        :return: Banner do serviço detectado ou None se não for possível detectar
        """
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        try:
            sock.connect((self.ip, port))
            sock.send(b'HEAD / HTTP/1.0\r\n\r\n')
            banner = sock.recv(1024).decode().strip()
            return banner
        except socket.error as e:
            logging.error(f"Erro ao conectar na porta {port}: {e}")
            return None
        finally:
            sock.close()
