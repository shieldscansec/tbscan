class ChatBot:
    def talk_about_vulnerability(self, service, vulnerability):
        explanations = {
            "SQL Injection": (
                "SQL Injection é uma vulnerabilidade que permite a um atacante inserir código SQL malicioso em consultas que são executadas pelo banco de dados. "
                "Isso pode resultar em acesso não autorizado a dados sensíveis, modificação de dados ou até mesmo exclusão de dados."
            ),
            "Cross-Site Scripting (XSS)": (
                "Cross-Site Scripting (XSS) é uma vulnerabilidade que permite a um atacante injetar scripts maliciosos em páginas web visualizadas por outros usuários. "
                "Isso pode ser usado para roubar cookies, sessões ou redirecionar usuários para sites maliciosos."
            ),
            "Nenhuma vulnerabilidade crítica": (
                "O serviço não possui vulnerabilidades críticas conhecidas. No entanto, é sempre bom manter o software atualizado e seguir as melhores práticas de segurança."
            )
        }

        explanation = explanations.get(vulnerability, "Informação sobre a vulnerabilidade não disponível.")
        print(f"O serviço {service} está vulnerável a {vulnerability}. {explanation}")

