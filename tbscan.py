import argparse
import socket
import os
import sys
import logging
import importlib.util
from scapy.all import *

# Configuração do logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def check_root():
    """Verifica se o script está sendo executado como root."""
    return os.geteuid() == 0

def show_banner():
    """Exibe o banner da ferramenta."""
    banner = """
        ,----,                                                              
      ,/   .`|                                                         ,--. 
    ,`   .'  :   ,---,.   .--.--.     ,----..     ,---,              ,--.'| 
  ;    ;     / ,'  .'  \ /  /    '.  /   /   \   '  .' \         ,--,:  : | 
.'___,/    ,',---.' .' ||  :  /`. / |   :     : /  ;    '.    ,`--.'`|  ' : 
|    :     | |   |  |: |;  |  |--`  .   |  ;. /:  :       \   |   :  :  | | 
;    |.';  ; :   :  :  /|  :  ;_    .   ; /--` :  |   /\   \  :   |   \ | : 
`----'  |  | :   |    ;  \  \    `. ;   | ;    |  :  ' ;.   : |   : '  '; | 
    '   :  ; |   :     \  `----.   \|   : |    |  |  ;/  \   '   ' ;.    ; 
    |   |  ' |   |   . |  __ \  \  |.   | '___ '  :  | \  \ ,'|   | | \   | 
    '   :  | '   :  '; | /  /`--'  /'   ; : .'||  |  '  '--'  '   : |  ; .' 
    ;   |.'  |   |  | ; '--'.     / '   | '/  :|  :  :        |   | '`--'   
    '---'    |   :   /    `--'---'  |   :    / |  | ,'        '   : |       
             |   | ,'                \   \ .'  `--''          ;   |.'       
             `----'                   `---`                   '---'
    """
    print(banner)

def scan_port(ip, port):
    """Verifica se uma porta está aberta em um IP específico."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((ip, port))
    sock.close()
    return result == 0

def scan_ports(ip, ports):
    """Escaneia uma lista de portas em um IP específico."""
    open_ports = []
    for port in ports:
        if scan_port(ip, port):
            open_ports.append(port)
    return open_ports

def detect_service(ip, port):
    """Detecta o serviço rodando em uma porta específica."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    try:
        sock.connect((ip, port))
        sock.send(b'HEAD / HTTP/1.0\r\n\r\n')
        banner = sock.recv(1024).decode().strip()
        return banner
    except socket.error as e:
        logging.error(f"Erro ao conectar na porta {port}: {e}")
        return None
    finally:
        sock.close()

def os_detection(ip):
    """Detecta o sistema operacional do alvo."""
    try:
        ans, unans = sr(IP(dst=ip)/ICMP(), timeout=2, verbose=0)
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
        sys.exit(1)

def load_vuln_scripts(ip):
    """Carrega e executa scripts de vulnerabilidade da pasta 'scripts'."""
    scripts_dir = os.path.join(os.path.dirname(__file__), 'scripts')
    for script_name in os.listdir(scripts_dir):
        if script_name.endswith('.py'):
            script_path = os.path.join(scripts_dir, script_name)
            spec = importlib.util.spec_from_file_location(script_name, script_path)
            script_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(script_module)
            if hasattr(script_module, 'check_vulnerability'):
                result = script_module.check_vulnerability(ip)
                logging.info(result)

def main():
    """Função principal que executa a ferramenta de varredura de rede."""
    is_root = check_root()
    parser = argparse.ArgumentParser(description="Ferramenta de varredura de rede")
    parser.add_argument("ip", help="Endereço IP alvo")
    parser.add_argument("-p", "--ports", nargs='+', type=int, help="Portas a serem escaneadas")
    parser.add_argument("-sV", action='store_true', help="Detectar versões dos serviços")
    parser.add_argument("-O", action='store_true', help="Detectar sistema operacional")
    parser.add_argument("-A", action='store_true', help="Habilitar detecção avançada (requer root)")
    parser.add_argument("--script-vuln", action='store_true', help="Executar scripts de vulnerabilidade")
    parser.add_argument("-Pn", action='store_true', help="Desabilitar ping")
    args = parser.parse_args()

    show_banner()
    logging.info(f"Escaneando IP: {args.ip}")

    if args.ports:
        open_ports = scan_ports(args.ip, args.ports)
        logging.info(f"Portas abertas: {open_ports}")
        if args.sV:
            for port in open_ports:
                service = detect_service(args.ip, port)
                if service:
                    logging.info(f"Serviço detectado na porta {port}: {service}")
    else:
        open_ports = scan_ports(args.ip, range(1, 1025))
        logging.info(f"Portas abertas: {open_ports}")

    if args.O:
        os_info = os_detection(args.ip)
        logging.info(f"Sistema operacional detectado: {os_info}")

    if args.A:
        if is_root:
            os_info = os_detection(args.ip)
            logging.info(f"Sistema operacional detectado: {os_info}")
        else:
            logging.warning("Detecção avançada (-A) requer privilégios de root. Execute o script com 'sudo'.")

    if args.script_vuln:
        load_vuln_scripts(args.ip)

if __name__ == "__main__":
    main()

