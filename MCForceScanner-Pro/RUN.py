#!/usr/bin/env python3
"""
MCForceScanner-Pro - Script de Instalação e Execução Automática
Este script instala e executa o MCForceScanner-Pro automaticamente
"""

import os
import sys
import subprocess
import platform

def print_banner():
    print("🎯 MCForceScanner-Pro - INSTALAÇÃO AUTOMÁTICA")
    print("=" * 50)

def check_python():
    """Verifica se o Python é compatível"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ é necessário. Versão atual:", sys.version)
        return False
    print("✅ Python compatível:", sys.version.split()[0])
    return True

def run_command(cmd, description=""):
    """Executa um comando e mostra o resultado"""
    if description:
        print(f"📦 {description}...")
    
    try:
        if platform.system() == "Windows":
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        else:
            result = subprocess.run(cmd.split(), capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Erro ao executar: {cmd}")
            print(f"Erro: {result.stderr}")
            return False
        return True
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def create_directories():
    """Cria diretórios necessários"""
    dirs = ["data", "logs", "results", "wordlists", "plugins"]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print("✅ Diretórios criados")

def create_wordlists():
    """Cria wordlists básicas"""
    usernames = [
        "admin", "administrator", "root", "minecraft", "server",
        "owner", "op", "moderator", "player"
    ]
    
    passwords = [
        "admin", "password", "123456", "minecraft", "server",
        "admin123", "password123", "root", "12345", "qwerty"
    ]
    
    with open("wordlists/usernames.txt", "w") as f:
        f.write("\n".join(usernames))
    
    with open("wordlists/passwords.txt", "w") as f:
        f.write("\n".join(passwords))
    
    print("✅ Wordlists criadas")

def install_dependencies():
    """Instala dependências necessárias"""
    packages = [
        "typer", "rich", "pydantic", "aiohttp", 
        "dnspython", "pyyaml", "jinja2"
    ]
    
    print("📥 Instalando dependências...")
    for package in packages:
        cmd = f"{sys.executable} -m pip install {package}"
        if not run_command(cmd):
            return False
    
    print("✅ Dependências instaladas")
    return True

def install_package():
    """Instala o MCForceScanner-Pro"""
    cmd = f"{sys.executable} -m pip install -e ."
    return run_command(cmd, "Instalando MCForceScanner-Pro")

def test_installation():
    """Testa se a instalação funcionou"""
    try:
        import mcforcescanner
        print("✅ MCForceScanner-Pro instalado com sucesso!")
        print(f"Versão: {mcforcescanner.get_version()}")
        return True
    except ImportError:
        print("❌ Falha na instalação")
        return False

def show_usage():
    """Mostra como usar"""
    print("\n🎉 INSTALAÇÃO CONCLUÍDA!")
    print("\n🚀 COMANDOS PARA USAR:")
    print("  python -m mcforcescanner.interface.cli interactive")
    print("  python -m mcforcescanner.interface.cli version")
    print("  python -m mcforcescanner.interface.cli scan minecraft.example.com")
    print("\n📖 MODO INTERATIVO (RECOMENDADO):")
    print("  python -m mcforcescanner.interface.cli interactive")

def main():
    """Função principal"""
    print_banner()
    
    # Verificar Python
    if not check_python():
        return False
    
    # Atualizar pip
    print("🔧 Atualizando pip...")
    run_command(f"{sys.executable} -m pip install --upgrade pip")
    
    # Criar estrutura
    create_directories()
    create_wordlists()
    
    # Instalar dependências
    if not install_dependencies():
        return False
    
    # Instalar pacote
    if not install_package():
        return False
    
    # Testar instalação
    if not test_installation():
        return False
    
    # Mostrar uso
    show_usage()
    
    # Perguntar se quer executar
    try:
        choice = input("\n⚡ Quer executar o modo interativo agora? (s/n): ").lower()
        if choice in ['s', 'sim', 'y', 'yes']:
            print("\n🚀 Iniciando MCForceScanner-Pro...")
            os.system(f"{sys.executable} -m mcforcescanner.interface.cli interactive")
    except KeyboardInterrupt:
        print("\n👋 Até logo!")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Instalação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        sys.exit(1)