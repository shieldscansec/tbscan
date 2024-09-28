import requests
import logging

class VulnChecker:
    """
    Classe para verificar vulnerabilidades conhecidas usando a API do Vulners.

    :param api_key: Chave da API do Vulners
    """
    def __init__(self, api_key):
        self.api_key = api_key

    def check_vulnerabilities(self, service, version):
        """
        Verifica vulnerabilidades conhecidas para um serviço específico.

        :param service: Nome do serviço
        :param version: Versão do serviço
        :return: Lista de vulnerabilidades ou uma mensagem de erro se não for possível acessar a API
        """
        api_url = f"https://vulners.com/api/v3/search/lucene/?query={service} {version}&apiKey={self.api_key}"
        try:
            response = requests.get(api_url)
            response.raise_for_status()
            vulnerabilities = response.json().get('data', {}).get('search', [])
            return vulnerabilities
        except requests.exceptions.RequestException as e:
            logging.error(f"Erro ao acessar a API do Vulners: {e}")
            return []

    def format_vulnerabilities(self, vulnerabilities):
        """
        Formata a lista de vulnerabilidades para uma saída mais organizada.

        :param vulnerabilities: Lista de vulnerabilidades
        :return: Lista formatada de vulnerabilidades
        """
        formatted_output = []
        for vuln in vulnerabilities:
            title = vuln.get('_source', {}).get('title', 'Título não disponível')
            description = vuln.get('_source', {}).get('description', 'Informação sobre a vulnerabilidade não disponível')
            severity = vuln.get('_source', {}).get('cvss', {}).get('score', 'Informação não disponível')
            href = vuln.get('_source', {}).get('href', 'Informação não disponível')

            formatted_output.append(
                f"Nome: {title}\n"
                f"Descrição: {description}\n"
                f"Severidade: {severity}\n"
                f"Referência: {href}\n"
                "----------------------------------------"
            )
        return "\n".join(formatted_output)
