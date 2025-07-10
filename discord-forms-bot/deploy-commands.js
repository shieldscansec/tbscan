import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Configurar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Carregar comandos
const commandsPath = join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Comando carregado para deploy: ${command.data.name}`);
    } else {
        console.log(`⚠️ Comando em ${filePath} está faltando uma propriedade "data" ou "execute" obrigatória.`);
    }
}

// Verificar variáveis de ambiente
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('❌ DISCORD_TOKEN ou CLIENT_ID não encontrados no arquivo .env!');
    console.log('📝 Certifique-se de que seu arquivo .env está configurado corretamente');
    process.exit(1);
}

// Construir e preparar uma instância do módulo REST
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy dos comandos
(async () => {
    try {
        console.log(`🔄 Iniciando deploy de ${commands.length} comando(s) slash...`);

        // Registrar comandos globalmente
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} comando(s) slash registrado(s) com sucesso globalmente!`);
        console.log('🎉 Deploy concluído! Os comandos podem levar alguns minutos para aparecer em todos os servidores.');
        
    } catch (error) {
        console.error('❌ Erro durante o deploy dos comandos:', error);
        
        if (error.code === 50001) {
            console.log('💡 Dica: Verifique se o CLIENT_ID está correto e se o bot tem as permissões necessárias.');
        } else if (error.code === 401) {
            console.log('💡 Dica: Verifique se o DISCORD_TOKEN está correto e válido.');
        }
    }
})();