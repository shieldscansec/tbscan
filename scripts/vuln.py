import requests

def check_vulnerabilities(service, version):
    api_url = f"https://vulners.com/api/v3/search/lucene/?query={service} {version}"
    response = requests.get(api_url)
    if response.status_code == 200:
        vulnerabilities = response.json()
        return vulnerabilities
    else:
        return None

service = 'apache'
version = '2.4.49'
vulnerabilities = check_vulnerabilities(service, version)
print(f"Vulnerabilities for {service} {version}: {vulnerabilities}")
