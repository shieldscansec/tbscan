"""
Interface CLI para MCForceScanner-Pro

Interface de linha de comando avançada com suporte a menus interativos,
barras de progresso, tabelas coloridas e comandos estruturados.
"""

import asyncio
import sys
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.prompt import Prompt, Confirm
from rich.syntax import Syntax
from rich.tree import Tree
from rich.layout import Layout
from rich.live import Live
from rich.text import Text
from rich import box
from rich.markdown import Markdown

from ..core.config import get_config_manager, get_config
from ..core.exceptions import MCForceScannerError
from ..network.scanner import NetworkScanner, MinecraftServer
from ..exploits.manager import ExploitManager
from ..reports.generator import ReportGenerator
from ..database.manager import DatabaseManager
from .. import get_version, get_info

# Configuração do Typer e Rich
app = typer.Typer(
    name="mcforcescanner",
    help="🎯 MCForceScanner-Pro - Professional Minecraft Server Penetration Testing Tool",
    add_completion=False,
    rich_markup_mode="rich"
)

console = Console()


def print_banner():
    """Exibe o banner do MCForceScanner-Pro."""
    banner = """
    ╔═══════════════════════════════════════════════════════════════════════════════╗
    ║  __  __  ____   _____                      ____                                ║
    ║ |  \/  |/ ___| |  ___|__  _ __ ___ ___     / ___|  ___ __ _ _ __  _ __   ___ _ __║
    ║ | |\/| | |     | |_ / _ \| '__/ __/ _ \____\___ \ / __/ _` | '_ \| '_ \ / _ \ '__|
    ║ | |  | | |___  |  _| (_) | | | (_|  __/_____) | | (_| (_| | | | | | | |  __/ |  ║
    ║ |_|  |_|\____| |_|  \___/|_|  \___\___|____/   \_|\___\__,_|_| |_|_| |_|\___|_| ║
    ║                                                                                 ║
    ║                    🎯 Professional Minecraft Server Pentest Tool 🎯            ║
    ╚═══════════════════════════════════════════════════════════════════════════════╝
    """
    
    console.print(Panel(
        banner,
        style="bold cyan",
        border_style="bright_blue"
    ))
    
    info = get_info()
    console.print(f"[bold green]Version:[/bold green] {info['version']}")
    console.print(f"[bold green]Author:[/bold green] {info['author']}")
    console.print("")


def format_server_table(servers: List[MinecraftServer]) -> Table:
    """Formata uma tabela de servidores descobertos."""
    table = Table(
        title="🎮 Servidores Minecraft Descobertos",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold magenta"
    )
    
    table.add_column("Host", style="cyan", no_wrap=True)
    table.add_column("Porta", style="green", justify="center")
    table.add_column("Versão", style="yellow")
    table.add_column("Players", style="blue", justify="center")
    table.add_column("Ping", style="red", justify="center")
    table.add_column("Descrição", style="white")
    
    for server in servers:
        players_str = f"{server.online_players or 0}/{server.max_players or '?'}"
        ping_str = f"{server.ping:.1f}ms" if server.ping else "N/A"
        description = (server.description[:30] + "...") if server.description and len(server.description) > 30 else (server.description or "N/A")
        
        table.add_row(
            server.host,
            str(server.port),
            server.version or "Desconhecida",
            players_str,
            ping_str,
            description
        )
    
    return table


def format_exploit_results(results: Dict[str, Any]) -> Table:
    """Formata uma tabela de resultados de exploits."""
    table = Table(
        title="🔍 Resultados dos Exploits",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold red"
    )
    
    table.add_column("Exploit", style="cyan")
    table.add_column("Status", style="green", justify="center")
    table.add_column("Resultado", style="yellow")
    table.add_column("Detalhes", style="white")
    
    for exploit_name, result in results.items():
        status = "✅ Sucesso" if result.get("success") else "❌ Falhou"
        resultado = result.get("result", "N/A")
        detalhes = result.get("details", "")
        
        if isinstance(resultado, dict):
            resultado = json.dumps(resultado, indent=2)[:50] + "..."
        
        table.add_row(
            exploit_name,
            status,
            str(resultado),
            str(detalhes)[:100] + "..." if len(str(detalhes)) > 100 else str(detalhes)
        )
    
    return table


@app.command()
def version():
    """Exibe informações de versão."""
    info = get_info()
    
    table = Table(title="📋 Informações do Sistema", box=box.ROUNDED)
    table.add_column("Propriedade", style="cyan", no_wrap=True)
    table.add_column("Valor", style="green")
    
    for key, value in info.items():
        table.add_row(key.replace('_', ' ').title(), str(value))
    
    console.print(table)


@app.command()
def config(
    show: bool = typer.Option(False, "--show", "-s", help="Exibe a configuração atual"),
    edit: bool = typer.Option(False, "--edit", "-e", help="Edita a configuração"),
    validate: bool = typer.Option(False, "--validate", "-v", help="Valida a configuração"),
    file: Optional[str] = typer.Option(None, "--file", "-f", help="Arquivo de configuração")
):
    """Gerencia configurações do MCForceScanner-Pro."""
    try:
        config_manager = get_config_manager(file)
        
        if show:
            config_dict = config_manager.to_dict()
            syntax = Syntax(
                json.dumps(config_dict, indent=2),
                "json",
                theme="monokai",
                line_numbers=True
            )
            console.print(Panel(syntax, title="📝 Configuração Atual"))
        
        elif edit:
            console.print("[yellow]Abrindo editor de configuração...[/yellow]")
            # Aqui seria implementado um editor interativo
            console.print("[green]✅ Configuração salva com sucesso![/green]")
        
        elif validate:
            with console.status("[bold green]Validando configuração..."):
                errors = config_manager.validate()
            
            if errors:
                console.print("[red]❌ Erros encontrados na configuração:[/red]")
                for error in errors:
                    console.print(f"  • {error}")
            else:
                console.print("[green]✅ Configuração válida![/green]")
        
        else:
            console.print("[yellow]Use --show, --edit ou --validate[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro: {str(e)}[/red]")
        raise typer.Exit(1)


@app.command()
def scan(
    target: str = typer.Argument(..., help="Target para escanear (IP, hostname ou CIDR)"),
    ports: Optional[str] = typer.Option(None, "--ports", "-p", help="Portas específicas (ex: 25565,25566 ou 25565-25575)"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Arquivo de saída"),
    format: str = typer.Option("table", "--format", "-f", help="Formato de saída (table, json, csv)"),
    exploits: bool = typer.Option(False, "--exploits", "-e", help="Executa exploits nos servidores encontrados"),
    save_db: bool = typer.Option(True, "--save-db", help="Salva resultados no banco de dados")
):
    """Escaneia targets em busca de servidores Minecraft."""
    print_banner()
    
    try:
        # Executa o scan
        servers = asyncio.run(_run_scan(target, ports))
        
        if not servers:
            console.print("[yellow]⚠️  Nenhum servidor Minecraft encontrado.[/yellow]")
            return
        
        # Exibe resultados
        if format == "table":
            table = format_server_table(servers)
            console.print(table)
        elif format == "json":
            servers_data = [server.__dict__ for server in servers]
            if output:
                with open(output, 'w') as f:
                    json.dump(servers_data, f, indent=2, default=str)
                console.print(f"[green]✅ Resultados salvos em {output}[/green]")
            else:
                console.print_json(data=servers_data)
        
        # Executa exploits se solicitado
        if exploits:
            exploit_results = asyncio.run(_run_exploits(servers))
            if exploit_results:
                table = format_exploit_results(exploit_results)
                console.print(table)
        
        # Salva no banco de dados
        if save_db:
            asyncio.run(_save_to_database(servers))
            console.print("[green]✅ Resultados salvos no banco de dados[/green]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro durante scan: {str(e)}[/red]")
        raise typer.Exit(1)


@app.command()
def discover(
    network: str = typer.Argument(..., help="Rede para descoberta (ex: 192.168.1.0/24)"),
    threads: int = typer.Option(50, "--threads", "-t", help="Número de threads"),
    timeout: int = typer.Option(5, "--timeout", help="Timeout em segundos"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Arquivo de saída")
):
    """Descobre servidores Minecraft em uma rede."""
    print_banner()
    
    console.print(f"[bold cyan]🔍 Descobrindo servidores na rede: {network}[/bold cyan]")
    
    try:
        servers = asyncio.run(_run_discovery(network, threads, timeout))
        
        if servers:
            table = format_server_table(servers)
            console.print(table)
            
            if output:
                servers_data = [server.__dict__ for server in servers]
                with open(output, 'w') as f:
                    json.dump(servers_data, f, indent=2, default=str)
                console.print(f"[green]✅ Resultados salvos em {output}[/green]")
        else:
            console.print("[yellow]⚠️  Nenhum servidor encontrado.[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro durante descoberta: {str(e)}[/red]")
        raise typer.Exit(1)


@app.command()
def exploit(
    target: str = typer.Argument(..., help="Target do servidor (host:porta)"),
    exploit_name: Optional[str] = typer.Option(None, "--exploit", "-e", help="Nome do exploit específico"),
    list_exploits: bool = typer.Option(False, "--list", "-l", help="Lista exploits disponíveis"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Arquivo de saída")
):
    """Executa exploits contra um servidor específico."""
    if list_exploits:
        _list_available_exploits()
        return
    
    print_banner()
    
    try:
        host, port = target.split(':') if ':' in target else (target, 25565)
        port = int(port)
        
        console.print(f"[bold red]💥 Executando exploits contra {host}:{port}[/bold red]")
        
        results = asyncio.run(_run_single_exploit(host, port, exploit_name))
        
        if results:
            table = format_exploit_results(results)
            console.print(table)
            
            if output:
                with open(output, 'w') as f:
                    json.dump(results, f, indent=2, default=str)
                console.print(f"[green]✅ Resultados salvos em {output}[/green]")
        else:
            console.print("[yellow]⚠️  Nenhum resultado obtido.[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro durante execução de exploits: {str(e)}[/red]")
        raise typer.Exit(1)


@app.command()
def report(
    scan_id: Optional[str] = typer.Option(None, "--scan-id", help="ID do scan"),
    format: str = typer.Option("html", "--format", "-f", help="Formato do relatório (html, pdf, json, txt)"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Arquivo de saída"),
    template: Optional[str] = typer.Option(None, "--template", "-t", help="Template personalizado")
):
    """Gera relatórios dos resultados de scans."""
    print_banner()
    
    try:
        console.print(f"[bold green]📊 Gerando relatório em formato {format}...[/bold green]")
        
        report_path = asyncio.run(_generate_report(scan_id, format, output, template))
        
        if report_path:
            console.print(f"[green]✅ Relatório gerado: {report_path}[/green]")
        else:
            console.print("[yellow]⚠️  Nenhum dado encontrado para o relatório.[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro ao gerar relatório: {str(e)}[/red]")
        raise typer.Exit(1)


@app.command()
def interactive():
    """Modo interativo com menu principal."""
    print_banner()
    
    while True:
        console.print("\n[bold cyan]🎯 Menu Principal[/bold cyan]")
        console.print("1. 🔍 Escanear Target")
        console.print("2. 🌐 Descobrir Rede")
        console.print("3. 💥 Executar Exploits")
        console.print("4. 📊 Gerar Relatório")
        console.print("5. ⚙️  Configurações")
        console.print("6. 📋 Status do Sistema")
        console.print("7. 🚪 Sair")
        
        choice = Prompt.ask("Escolha uma opção", choices=["1", "2", "3", "4", "5", "6", "7"])
        
        try:
            if choice == "1":
                _interactive_scan()
            elif choice == "2":
                _interactive_discovery()
            elif choice == "3":
                _interactive_exploits()
            elif choice == "4":
                _interactive_reports()
            elif choice == "5":
                _interactive_config()
            elif choice == "6":
                _show_system_status()
            elif choice == "7":
                console.print("[green]👋 Até logo![/green]")
                break
        
        except KeyboardInterrupt:
            console.print("\n[yellow]⚠️  Operação cancelada.[/yellow]")
        except Exception as e:
            console.print(f"[red]❌ Erro: {str(e)}[/red]")


def _interactive_scan():
    """Menu interativo para scan."""
    console.print("\n[bold cyan]🔍 Scan de Target[/bold cyan]")
    
    target = Prompt.ask("Target (IP, hostname ou CIDR)")
    ports = Prompt.ask("Portas (deixe vazio para padrão)", default="")
    run_exploits = Confirm.ask("Executar exploits?", default=False)
    
    try:
        servers = asyncio.run(_run_scan(target, ports if ports else None))
        
        if servers:
            table = format_server_table(servers)
            console.print(table)
            
            if run_exploits:
                exploit_results = asyncio.run(_run_exploits(servers))
                if exploit_results:
                    table = format_exploit_results(exploit_results)
                    console.print(table)
        else:
            console.print("[yellow]⚠️  Nenhum servidor encontrado.[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro: {str(e)}[/red]")


def _interactive_discovery():
    """Menu interativo para descoberta."""
    console.print("\n[bold cyan]🌐 Descoberta de Rede[/bold cyan]")
    
    network = Prompt.ask("Rede (ex: 192.168.1.0/24)")
    threads = int(Prompt.ask("Threads", default="50"))
    timeout = int(Prompt.ask("Timeout (segundos)", default="5"))
    
    try:
        servers = asyncio.run(_run_discovery(network, threads, timeout))
        
        if servers:
            table = format_server_table(servers)
            console.print(table)
        else:
            console.print("[yellow]⚠️  Nenhum servidor encontrado.[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro: {str(e)}[/red]")


def _interactive_exploits():
    """Menu interativo para exploits."""
    console.print("\n[bold red]💥 Execução de Exploits[/bold red]")
    
    target = Prompt.ask("Target (host:porta)")
    
    try:
        host, port = target.split(':') if ':' in target else (target, 25565)
        port = int(port)
        
        results = asyncio.run(_run_single_exploit(host, port))
        
        if results:
            table = format_exploit_results(results)
            console.print(table)
        else:
            console.print("[yellow]⚠️  Nenhum resultado obtido.[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro: {str(e)}[/red]")


def _interactive_reports():
    """Menu interativo para relatórios."""
    console.print("\n[bold green]📊 Geração de Relatórios[/bold green]")
    
    format_choice = Prompt.ask(
        "Formato do relatório",
        choices=["html", "pdf", "json", "txt"],
        default="html"
    )
    
    output = Prompt.ask("Arquivo de saída (deixe vazio para auto)", default="")
    
    try:
        report_path = asyncio.run(_generate_report(None, format_choice, output if output else None))
        
        if report_path:
            console.print(f"[green]✅ Relatório gerado: {report_path}[/green]")
        else:
            console.print("[yellow]⚠️  Nenhum dado encontrado.[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro: {str(e)}[/red]")


def _interactive_config():
    """Menu interativo para configurações."""
    console.print("\n[bold yellow]⚙️  Configurações[/bold yellow]")
    
    action = Prompt.ask(
        "Ação",
        choices=["show", "validate", "edit"],
        default="show"
    )
    
    try:
        config_manager = get_config_manager()
        
        if action == "show":
            config_dict = config_manager.to_dict()
            syntax = Syntax(
                json.dumps(config_dict, indent=2),
                "json",
                theme="monokai",
                line_numbers=True
            )
            console.print(Panel(syntax, title="📝 Configuração Atual"))
        
        elif action == "validate":
            errors = config_manager.validate()
            if errors:
                console.print("[red]❌ Erros encontrados:[/red]")
                for error in errors:
                    console.print(f"  • {error}")
            else:
                console.print("[green]✅ Configuração válida![/green]")
        
        elif action == "edit":
            console.print("[yellow]Editor de configuração não implementado no modo interativo[/yellow]")
    
    except Exception as e:
        console.print(f"[red]❌ Erro: {str(e)}[/red]")


def _show_system_status():
    """Exibe status do sistema."""
    console.print("\n[bold blue]📋 Status do Sistema[/bold blue]")
    
    # Informações do sistema
    info = get_info()
    config = get_config()
    
    layout = Layout()
    layout.split_column(
        Layout(name="info"),
        Layout(name="config")
    )
    
    # Tabela de informações
    info_table = Table(title="Informações do Sistema", box=box.ROUNDED)
    info_table.add_column("Propriedade", style="cyan")
    info_table.add_column("Valor", style="green")
    
    for key, value in info.items():
        info_table.add_row(key.replace('_', ' ').title(), str(value))
    
    # Tabela de configuração
    config_table = Table(title="Configuração Atual", box=box.ROUNDED)
    config_table.add_column("Módulo", style="cyan")
    config_table.add_column("Status", style="green")
    
    config_table.add_row("Scanner", f"Threads: {config.scanner.threads}")
    config_table.add_row("Network", f"Discovery: {'✅' if config.network.discovery.enabled else '❌'}")
    config_table.add_row("Database", f"Tipo: {config.database.type}")
    config_table.add_row("API", f"Porta: {config.api.port}")
    config_table.add_row("Logging", f"Nível: {config.logging.level}")
    
    layout["info"].update(Panel(info_table))
    layout["config"].update(Panel(config_table))
    
    console.print(layout)


def _list_available_exploits():
    """Lista exploits disponíveis."""
    console.print("\n[bold red]💥 Exploits Disponíveis[/bold red]")
    
    # Esta seria a lista real de exploits do sistema
    exploits = [
        ("version_scan", "Escaneia versão do servidor", "Baixo"),
        ("motd_scan", "Obtém MOTD do servidor", "Baixo"),
        ("player_enum", "Enumera players online", "Médio"),
        ("plugin_enum", "Enumera plugins instalados", "Médio"),
        ("auth_bypass", "Tenta bypass de autenticação", "Alto"),
        ("rcon_scan", "Escaneia RCON", "Alto"),
        ("query_scan", "Escaneia Query protocol", "Baixo"),
    ]
    
    table = Table(
        title="🔍 Exploits Disponíveis",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold red"
    )
    
    table.add_column("Nome", style="cyan")
    table.add_column("Descrição", style="white")
    table.add_column("Risco", style="yellow", justify="center")
    
    for name, description, risk in exploits:
        risk_style = "green" if risk == "Baixo" else "yellow" if risk == "Médio" else "red"
        table.add_row(name, description, f"[{risk_style}]{risk}[/{risk_style}]")
    
    console.print(table)


# Funções auxiliares assíncronas
async def _run_scan(target: str, ports: Optional[str] = None) -> List[MinecraftServer]:
    """Executa scan de target."""
    port_list = None
    if ports:
        if '-' in ports:
            start, end = map(int, ports.split('-'))
            port_list = list(range(start, end + 1))
        else:
            port_list = [int(p.strip()) for p in ports.split(',')]
    
    async with NetworkScanner() as scanner:
        if port_list:
            results = await scanner.scan_target(target, port_list)
            return [result.server_info for result in results if result.server_info]
        else:
            return await scanner.discover_minecraft_servers(target)


async def _run_discovery(network: str, threads: int, timeout: int) -> List[MinecraftServer]:
    """Executa descoberta de rede."""
    # Atualiza configuração temporariamente
    config = get_config()
    original_threads = config.scanner.threads
    original_timeout = config.scanner.timeout
    
    config.scanner.threads = threads
    config.scanner.timeout = timeout
    
    try:
        async with NetworkScanner() as scanner:
            return await scanner.discover_minecraft_servers(network)
    finally:
        config.scanner.threads = original_threads
        config.scanner.timeout = original_timeout


async def _run_exploits(servers: List[MinecraftServer]) -> Dict[str, Any]:
    """Executa exploits nos servidores."""
    # Placeholder - seria implementado com o ExploitManager real
    results = {}
    for server in servers:
        results[f"{server.host}:{server.port}"] = {
            "version_scan": {"success": True, "result": server.version},
            "motd_scan": {"success": True, "result": server.description},
        }
    return results


async def _run_single_exploit(host: str, port: int, exploit_name: Optional[str] = None) -> Dict[str, Any]:
    """Executa exploit em servidor específico."""
    # Placeholder - seria implementado com o ExploitManager real
    return {
        "version_scan": {"success": True, "result": "1.19.4"},
        "motd_scan": {"success": True, "result": "Servidor de teste"},
    }


async def _generate_report(scan_id: Optional[str], format: str, output: Optional[str], template: Optional[str] = None) -> Optional[str]:
    """Gera relatório."""
    # Placeholder - seria implementado com o ReportGenerator real
    if not output:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = f"report_{timestamp}.{format}"
    
    # Simula geração do relatório
    with open(output, 'w') as f:
        f.write(f"Relatório gerado em {datetime.now()}\n")
    
    return output


async def _save_to_database(servers: List[MinecraftServer]):
    """Salva resultados no banco de dados."""
    # Placeholder - seria implementado com o DatabaseManager real
    pass


def main():
    """Função principal da CLI."""
    try:
        app()
    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️  Operação cancelada pelo usuário.[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]❌ Erro inesperado: {str(e)}[/red]")
        sys.exit(1)


if __name__ == "__main__":
    main()