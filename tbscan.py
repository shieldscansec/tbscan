import argparse
import logging
import socket
from utils.helpers import show_banner
from scanner.port_scanner import PortScanner
from scanner.service_detector import ServiceDetector
from scanner.os_detector import OSDetector
from scanner.vuln_checker import VulnChecker
from ai.chatbot import ChatBot
import config

def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logging.info("Iniciando o script")

    try:
        show_banner()
        logging.info("Banner exibido")

        parser = argparse.ArgumentParser(description="Ferramenta de varredura de rede tbscan")
        parser.add_argument("ip", help="Endereço IP alvo (IPv4 ou IPv6)")
        parser.add_argument("-p", "--ports", nargs="+", type=int, help="Lista de portas para escanear", default=config.DEFAULT_PORTS)
        args = parser.parse_args()

        ip = args.ip
        ports = args.ports

        logging.info(f"IP alvo: {ip}")
        logging.info(f"Portas a serem escaneadas: {ports}")

        port_scanner = PortScanner(ip, ports)
        open_ports = port_scanner.scan_ports()
        logging.info(f"Portas abertas: {open_ports}")

        service_detector = ServiceDetector(ip)
        services = {port: service_detector.detect_service(port) for port in open_ports}
        logging.info(f"Serviços detectados: {services}")

        os_detector = OSDetector(ip)
        os_info = os_detector.detect_os()
        logging.info(f"Sistema operacional detectado: {os_info}")

        vuln_checker = VulnChecker(api_key=config.VULNERS_API_KEY)
        vulnerabilities = {}
        for port, service in services.items():
            vuln_info = vuln_checker.check_vulnerabilities(service, "1.0")
            if isinstance(vuln_info, list):
                vulnerabilities[port] = vuln_info
            else:
                vulnerabilities[port] = [{"title": "Título não disponível", "description": "Informação sobre a vulnerabilidade não disponível"}]

        logging.info(f"Vulnerabilidades: {vulnerabilities}")

        chatbot = ChatBot()
        for port, service in services.items():
            formatted_vulnerabilities = vuln_checker.format_vulnerabilities(vulnerabilities[port])
            logging.info(f"Porta {port} com serviço {service} tem as seguintes vulnerabilidades:\n{formatted_vulnerabilities}")
            for vulnerability in vulnerabilities[port]:
                title = vulnerability.get('title', 'Título não disponível')
                description = vulnerability.get('description', 'Informação sobre a vulnerabilidade não disponível')
                chatbot.talk_about_vulnerability(service, title, description)

    except Exception as e:
        logging.error(f"Ocorreu um erro: {e}")

if __name__ == "__main__":
    main()

