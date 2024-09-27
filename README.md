# CRIADA POR NIGHT

!Logo {logo/logo.jpg}

# TBSCAN VERSÃO TESTE SEM A TRADUÇÃO

TBSCAN é uma ferramenta de varredura de rede inspirada no Nmap, mas desenvolvida de forma independente e sem qualquer código do Nmap. Ela oferece funcionalidades avançadas para análise e mapeamento de redes.

## Índice

- [Introdução](#introdução)
- [Instalação](#instalação)
- [Uso](#uso)
- [Funcionalidades](#funcionalidades)
- [Contribuição](#contribuição)
- [Licença](#licença)

## Introdução

TBSCAN é uma ferramenta poderosa para administradores de rede e entusiastas de segurança cibernética. Com TBSCAN, você pode realizar varreduras detalhadas de redes, identificar dispositivos conectados, e obter informações valiosas sobre a infraestrutura de rede.

## Instalação

Para instalar o TBSCAN, siga os passos abaixo:

1. Clone o repositório:
   ```bash
   git clone https://github.com/BlackNight1884/tbscan.git
   ```
2. Navegue até o diretório do projeto:
   ```bash
   cd tbscan
   ```
3. Instale as dependências necessárias:
   ```bash
   pip install -r requirements.txt
   ```

## Uso

Para usar o TBSCAN, execute o comando abaixo:

```bash
python tbscan.py [opções]
```

### Exemplos de Uso

- Varredura básica:
  ```bash
  python tbscan.py 192.168.1.1 -p 22 80 443 -sV
  ```

## Funcionalidades

- **Varredura de portas**: Identifique portas abertas em dispositivos da rede.
- **Detecção de sistema operacional**: Obtenha informações sobre o sistema operacional dos dispositivos.
- **Mapeamento de rede**: Visualize a topologia da rede.
- **Relatórios detalhados**: Gere relatórios detalhados das varreduras.

## Contribuição

Contribuições são bem-vindas! Para contribuir com o TBSCAN, siga os passos abaixo:

1. Faça um fork do repositório.
2. Crie uma nova branch:
   ```bash
   git checkout -b minha-nova-funcionalidade
   ```
3. Faça suas alterações e commit:
   ```bash
   git commit -m "Adiciona nova funcionalidade"
   ```
4. Envie suas alterações:
   ```bash
   git push origin minha-nova-funcionalidade
   ```
5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
