# 🤖 Bot Discord - Sistema de Formulários Ghost

Bot Discord moderno desenvolvido com **Discord.js v14+** que implementa um sistema completo de formulários com interface por botões e Application Commands (Slash Commands).

## ✨ Funcionalidades

### 🔧 Sistema de Configuração
- **Comando principal**: `/painel-perguntasghost` - Painel completo de configuração
- **Gerenciamento de perguntas**: Adicionar, remover e visualizar perguntas do formulário
- **Configuração de logs**: Definir categoria onde as submissões serão enviadas
- **Sistema de cargos**: Configurar cargos para usuários aprovados e reprovados
- **Interface moderna**: Totalmente baseada em botões e select menus

### 📋 Sistema de Formulários
- **Botão de submissão**: Interface limpa para usuários enviarem formulários
- **Perguntas por DM**: Sistema inteligente que envia perguntas via mensagem direta
- **Timeout inteligente**: 5 minutos por pergunta com tratamento de erros
- **Validação de DM**: Verifica se o usuário tem DMs abertas

### 🧪 Sistema de Revisão
- **Aprovação/Reprovação**: Botões para administradores revisarem formulários
- **Atribuição automática de cargos**: Sistema inteligente de roles
- **Notificação por DM**: Usuários recebem resultado automaticamente
- **Logs completos**: Histórico de todas as ações no banco de dados

### 🔐 Controle de Acesso
- **Administradores**: Acesso completo ao sistema
- **Cargo "Gestor de Formulários"**: Acesso específico para gerenciar formulários
- **Multi-servidor**: Configurações isoladas por servidor

## 🚀 Instalação

### Pré-requisitos
- **Node.js** 18.0.0 ou superior
- **npm** ou **yarn**
- **Bot Discord** criado no Discord Developer Portal

### 1. Clone o projeto
```bash
git clone <repo-url>
cd discord-forms-bot
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Discord Bot Configuration
DISCORD_TOKEN=seu_token_do_bot_aqui
CLIENT_ID=id_da_aplicacao_aqui

# Database Configuration
DATABASE_URL=./database/forms.db

# Optional: Set to 'development' for additional logging
NODE_ENV=production
```

### 4. Deploy dos comandos slash
```bash
npm run deploy
```

### 5. Inicie o bot
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 🛠️ Configuração do Bot Discord

### 1. Criar Application
1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em "New Application"
3. Dê um nome ao seu bot
4. Copie o **Application ID** para `CLIENT_ID` no `.env`

### 2. Criar Bot
1. Na aba "Bot" da sua aplicação
2. Clique em "Add Bot"
3. Copie o **Token** para `DISCORD_TOKEN` no `.env`
4. Ative as seguintes **Privileged Gateway Intents**:
   - ✅ **Message Content Intent** (para DMs)

### 3. Configurar Permissões
O bot precisa das seguintes permissões:
- ✅ **Send Messages**
- ✅ **Use Slash Commands**
- ✅ **Manage Roles**
- ✅ **Read Message History**
- ✅ **Embed Links**
- ✅ **Attach Files**

### 4. Convidar Bot
Use o seguinte link (substitua `YOUR_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=268496960&scope=bot%20applications.commands
```

## 📖 Como Usar

### 1. Configuração Inicial
Execute o comando `/painel-perguntasghost` para abrir o painel de configuração.

### 2. Configurar Sistema
1. **➕ Adicionar Pergunta**: Adicione perguntas para o formulário
2. **📁 Categoria de Logs**: Selecione onde as submissões serão enviadas
3. **🧩 Configurar Cargos**: Defina cargos para aprovados e reprovados

### 3. Iniciar Formulário
1. Use **🔗 Iniciar Formulário** no painel
2. Um botão aparecerá no canal para usuários clicarem
3. Os usuários receberão perguntas por DM

### 4. Revisar Submissões
1. As submissões aparecem na categoria de logs configurada
2. Use os botões **✅ Aprovar** ou **❌ Reprovar**
3. O usuário recebe notificação automática

## 🎯 Comandos Disponíveis

| Comando | Descrição | Permissão |
|---------|-----------|-----------|
| `/painel-perguntasghost` | Abre o painel de configuração | Admin ou Gestor de Formulários |

## 🗄️ Estrutura do Banco de Dados

O bot usa **SQLite** com as seguintes tabelas:

- **server_configs**: Configurações por servidor
- **form_questions**: Perguntas dos formulários
- **form_submissions**: Submissões dos usuários
- **form_answers**: Respostas individuais

## 🔧 Scripts Disponíveis

```bash
# Iniciar bot
npm start

# Desenvolvimento com auto-reload
npm run dev

# Deploy de comandos slash
npm run deploy
```

## 🎨 Estrutura do Projeto

```
discord-forms-bot/
├── commands/                 # Comandos slash
│   └── painel-perguntasghost.js
├── handlers/                 # Manipuladores de eventos
│   ├── buttonInteractions.js
│   ├── modalInteractions.js
│   └── selectMenuInteractions.js
├── database/                 # Configuração do banco
│   └── database.js
├── utils/                    # Utilitários
│   ├── permissions.js
│   └── embeds.js
├── index.js                  # Arquivo principal
├── deploy-commands.js        # Script de deploy
├── package.json
├── .env.example
└── README.md
```

## 🛡️ Segurança

- ✅ **Validação de permissões** em todas as interações
- ✅ **Sanitização de dados** de entrada
- ✅ **Tratamento de erros** robusto
- ✅ **Timeouts** para prevenir spam
- ✅ **Logs detalhados** para auditoria

## 🔄 Atualizações

Para atualizar o bot:
1. Pare o processo atual
2. Faça git pull das atualizações
3. Execute `npm install` para novas dependências
4. Execute `npm run deploy` se houver novos comandos
5. Reinicie o bot

## 📝 Logs

O bot gera logs detalhados:
- ✅ **Conexão**: Status de conexão e servidores
- ✅ **Comandos**: Execução de comandos e erros
- ✅ **Interações**: Botões, modais e select menus
- ✅ **Banco de dados**: Operações e erros

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 🆘 Suporte

Se você encontrar problemas:

1. **Verifique os logs** no console
2. **Confirme as permissões** do bot
3. **Valide o arquivo .env**
4. **Teste em servidor de desenvolvimento**

### Problemas Comuns

| Problema | Solução |
|----------|---------|
| Comandos não aparecem | Execute `npm run deploy` |
| Bot não responde | Verifique token e permissões |
| DMs não funcionam | Verifique Message Content Intent |
| Cargos não atribuídos | Verifique hierarquia de cargos |

---

**🚀 Bot Discord de Formulários Ghost - Sistema moderno e completo para gerenciamento de formulários em servidores Discord!**