"""
Módulo para detecção de sistema operacional.

Autor: BlackNight
"""

from scapy.all import *
import logging

class OSDetector:
    """
    Classe para detectar o sistema operacional do alvo.

    :param ip: Endereço IP alvo
    """
    def __init__(self, ip):
        self.ip = ip

    def detect_os(self):
        """
        Detecta o sistema operacional do alvo.

        :return: Nome do sistema operacional detectado ou mensagem de erro
        """
        try:
            ans, unans = sr(IP(dst=self.ip)/ICMP(), timeout=2, verbose=0)
            for snd, rcv in ans:
                if rcv.haslayer(ICMP):
                    ttl = rcv.getlayer(IP).ttl
                    if ttl <= 64:
                        return "Linux/Unix"
                    elif ttl <= 128:
                        return "Windows"
                    else:
                        return "Desconhecido"
            return "Sem resposta"
        except PermissionError:
            logging.error("Permissão negada para enviar pacotes ICMP. Execute o script com 'sudo' para detecção avançada.")
            return "Permissão negada"
        except Exception as e:
            logging.error(f"Erro ao detectar sistema operacional: {e}")
            return "Erro"
