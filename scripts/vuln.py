# scripts/vuln_script.py

import socket

def check_vulnerability(ip):
    """
    Verifica várias vulnerabilidades no endereço IP fornecido.
    """
    vulnerabilities = []

    # Verificar serviços HTTP vulneráveis
    vulnerabilities.extend(check_http_vulnerabilities(ip))

    # Verificar credenciais fracas
    vulnerabilities.extend(check_weak_credentials(ip))

    # Verificar software desatualizado
    vulnerabilities.extend(check_outdated_software(ip))

    # Verificar configurações incorretas
    vulnerabilities.extend(check_misconfigurations(ip))

    # Verificar vulnerabilidades de dia zero
    vulnerabilities.extend(check_zero_day_vulnerabilities(ip))

    if vulnerabilities:
        return f"Vulnerabilidades encontradas no IP {ip}: {vulnerabilities}"
    else:
        return f"Nenhuma vulnerabilidade encontrada no IP {ip}"

def check_http_vulnerabilities(ip):
    """Verifica serviços HTTP vulneráveis."""
    http_ports = [80, 8080, 443]
    found_vulnerabilities = []

    for port in http_ports:
        banner = detect_service(ip, port)
        if banner:
            if "Apache/2.4.49" in banner:
                found_vulnerabilities.append((port, "Apache 2.4.49 - CVE-2021-41773"))
            elif "nginx/1.18.0" in banner:
                found_vulnerabilities.append((port, "nginx 1.18.0 - CVE-2020-11724"))

    return found_vulnerabilities

def check_weak_credentials(ip):
    """Verifica se há credenciais fracas."""
    weak_credentials = [("admin", "admin"), ("root", "root")]
    found_vulnerabilities = []

    for username, password in weak_credentials:
        if attempt_login(ip, username, password):
            found_vulnerabilities.append(f"Credenciais fracas encontradas: {username}/{password}")

    return found_vulnerabilities

def check_outdated_software(ip):
    """Verifica se há software desatualizado."""
    outdated_software = ["OpenSSL 1.0.1", "PHP 5.6"]
    found_vulnerabilities = []

    for software in outdated_software:
        if is_software_installed(ip, software):
            found_vulnerabilities.append(f"Software desatualizado encontrado: {software}")

    return found_vulnerabilities

def check_misconfigurations(ip):
    """Verifica se há configurações incorretas."""
    misconfigurations = ["SSH sem autenticação de chave", "FTP anônimo habilitado"]
    found_vulnerabilities = []

    for config in misconfigurations:
        if is_misconfigured(ip, config):
            found_vulnerabilities.append(f"Configuração incorreta encontrada: {config}")

    return found_vulnerabilities

def check_zero_day_vulnerabilities(ip):
    """Verifica se há vulnerabilidades de dia zero."""
    zero_day_vulnerabilities = ["Zero-Day Exploit 1", "Zero-Day Exploit 2"]
    found_vulnerabilities = []

    for vuln in zero_day_vulnerabilities:
        if is_vulnerable_to_zero_day(ip, vuln):
            found_vulnerabilities.append(f"Vulnerabilidade de dia zero encontrada: {vuln}")

    return found_vulnerabilities

def detect_service(ip, port):
    """Detecta o serviço rodando em uma porta específica."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    try:
        sock.connect((ip, port))
        sock.send(b'HEAD / HTTP/1.0\r\n\r\n')
        banner = sock.recv(1024).decode().strip()
        return banner
    except socket.error:
        return None
    finally:
        sock.close()

def attempt_login(ip, username, password):
    """Tenta fazer login com credenciais fornecidas."""
    # Simulação de tentativa de login
    # Aqui você pode adicionar a lógica real para tentar login em serviços específicos
    return False  # Substitua por lógica real

def is_software_installed(ip, software):
    """Verifica se um software específico está instalado."""
    # Simulação de verificação de software instalado
    # Aqui você pode adicionar a lógica real para verificar software instalado
    return False  # Substitua por lógica real

def is_misconfigured(ip, config):
    """Verifica se há uma configuração específica incorreta."""
    # Simulação de verificação de configuração incorreta
    # Aqui você pode adicionar a lógica real para verificar configurações incorretas
    return False  # Substitua por lógica real

def is_vulnerable_to_zero_day(ip, vuln):
    """Verifica se há uma vulnerabilidade de dia zero específica."""
    # Simulação de verificação de vulnerabilidade de dia zero
    # Aqui você pode adicionar a lógica real para verificar vulnerabilidades de dia zero
    return False  # Substitua por lógica real

