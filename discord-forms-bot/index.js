import { Client, GatewayIntentBits, Collection, Events, InteractionType } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Importar manipuladores
import { handleButtonInteraction } from './handlers/buttonInteractions.js';
import { handleModalSubmit } from './handlers/modalInteractions.js';
import { handleSelectMenuInteraction } from './handlers/selectMenuInteractions.js';

// Configurar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Criar cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ]
});

// Coleção para armazenar comandos
client.commands = new Collection();

// Carregar comandos
const commandsPath = join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Comando carregado: ${command.data.name}`);
    } else {
        console.log(`⚠️ Comando em ${filePath} está faltando uma propriedade "data" ou "execute" obrigatória.`);
    }
}

// Evento: Bot pronto
client.once(Events.ClientReady, readyClient => {
    console.log(`🤖 Bot logado como ${readyClient.user.tag}!`);
    console.log(`📊 Conectado a ${client.guilds.cache.size} servidor(es)`);
    console.log(`👥 Servindo ${client.users.cache.size} usuário(s)`);
    console.log('🚀 Sistema de formulários Ghost está online!');
});

// Evento: Interação criada
client.on(Events.InteractionCreate, async interaction => {
    try {
        // Comando Slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`❌ Comando ${interaction.commandName} não encontrado.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ Erro ao executar comando ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: '❌ Houve um erro ao executar este comando!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        // Interação de Botão
        else if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        }
        // Submissão de Modal
        else if (interaction.type === InteractionType.ModalSubmit) {
            await handleModalSubmit(interaction);
        }
        // Select Menu (String, Channel, Role, etc.)
        else if (interaction.isAnySelectMenu()) {
            await handleSelectMenuInteraction(interaction);
        }
    } catch (error) {
        console.error('❌ Erro geral ao processar interação:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content: '❌ Ocorreu um erro inesperado!',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('❌ Erro ao enviar mensagem de erro:', replyError);
            }
        }
    }
});

// Evento: Bot entrou em um servidor
client.on(Events.GuildCreate, guild => {
    console.log(`🎉 Bot adicionado ao servidor: ${guild.name} (${guild.id})`);
    console.log(`👥 Membros: ${guild.memberCount}`);
});

// Evento: Bot removido de um servidor
client.on(Events.GuildDelete, guild => {
    console.log(`👋 Bot removido do servidor: ${guild.name} (${guild.id})`);
});

// Tratamento de erros
process.on('unhandledRejection', error => {
    console.error('❌ Erro não tratado:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Exceção não capturada:', error);
    process.exit(1);
});

// Verificar token
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN não encontrado no arquivo .env!');
    console.log('📝 Crie um arquivo .env baseado no .env.example');
    process.exit(1);
}

// Login do bot
console.log('🔄 Iniciando bot Discord...');
client.login(process.env.DISCORD_TOKEN);