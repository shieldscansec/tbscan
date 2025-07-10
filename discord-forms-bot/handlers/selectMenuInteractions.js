import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';
import { isValidLogCategory, isValidRole } from '../utils/permissions.js';
import { CONFIG } from '../config/constants.js';
import { cache } from '../utils/cache.js';
import database from '../database/database.js';

export async function handleSelectMenuInteraction(interaction) {
    const { customId } = interaction;

    try {
        switch (customId) {
            case 'select_log_category':
                await handleSelectLogCategory(interaction);
                break;
                
            case 'select_approved_role':
                await handleSelectApprovedRole(interaction);
                break;
                
            case 'select_rejected_role':
                await handleSelectRejectedRole(interaction);
                break;
                
            case 'select_question_to_remove':
                await handleSelectQuestionToRemove(interaction);
                break;
                
            default:
                console.log(`Select menu não reconhecido: ${customId}`);
                break;
        }
    } catch (error) {
        console.error('Erro no manipulador de select menus:', error);
        const errorEmbed = createErrorEmbed(
            'Erro Interno',
            'Ocorreu um erro ao processar sua solicitação.'
        );
        
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleSelectLogCategory(interaction) {
    const categoryId = interaction.values[0];
    const category = interaction.guild.channels.cache.get(categoryId);
    
    if (!category || !isValidLogCategory(category)) {
        const errorEmbed = createErrorEmbed(
            'Categoria Inválida',
            'A categoria selecionada não é válida.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    try {
        // Buscar configuração atual
        const currentConfig = await database.getServerConfig(interaction.guildId);
        
        // Atualizar configuração com nomes corretos
        await database.updateServerConfig(interaction.guildId, {
            log_category_id: categoryId,
            approved_role_id: currentConfig?.approved_role_id || null,
            rejected_role_id: currentConfig?.rejected_role_id || null
        });
        
        // Invalidar cache para forçar atualização
        cache.invalidateServerCache(interaction.guildId);
        
        // Resposta silenciosa - apenas confirma a ação
        await interaction.deferUpdate();
        
    } catch (error) {
        console.error('Erro ao configurar categoria:', error);
        const errorEmbed = createErrorEmbed(
            'Erro de Configuração',
            `${CONFIG.EMOJIS.ERROR} Não foi possível salvar a categoria. Tente novamente.`
        );
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleSelectApprovedRole(interaction) {
    const roleId = interaction.values[0];
    const role = interaction.guild.roles.cache.get(roleId);
    
    if (!role || !isValidRole(role)) {
        const errorEmbed = createErrorEmbed(
            'Cargo Inválido',
            'O cargo selecionado não é válido ou é um cargo do sistema.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    try {
        // Buscar configuração atual
        const currentConfig = await database.getServerConfig(interaction.guildId);
        
        // Atualizar configuração com nomes corretos
        await database.updateServerConfig(interaction.guildId, {
            log_category_id: currentConfig?.log_category_id || null,
            approved_role_id: roleId,
            rejected_role_id: currentConfig?.rejected_role_id || null
        });
        
        // Invalidar cache para forçar atualização
        cache.invalidateServerCache(interaction.guildId);
        
        // Resposta silenciosa - apenas confirma a ação
        await interaction.deferUpdate();
        
    } catch (error) {
        console.error('Erro ao configurar cargo aprovado:', error);
        const errorEmbed = createErrorEmbed(
            'Erro de Configuração',
            `${CONFIG.EMOJIS.ERROR} Não foi possível salvar o cargo. Tente novamente.`
        );
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleSelectRejectedRole(interaction) {
    const roleId = interaction.values[0];
    const role = interaction.guild.roles.cache.get(roleId);
    
    if (!role || !isValidRole(role)) {
        const errorEmbed = createErrorEmbed(
            'Cargo Inválido',
            'O cargo selecionado não é válido ou é um cargo do sistema.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    try {
        // Buscar configuração atual
        const currentConfig = await database.getServerConfig(interaction.guildId);
        
        // Atualizar configuração com nomes corretos
        await database.updateServerConfig(interaction.guildId, {
            log_category_id: currentConfig?.log_category_id || null,
            approved_role_id: currentConfig?.approved_role_id || null,
            rejected_role_id: roleId
        });
        
        // Invalidar cache para forçar atualização
        cache.invalidateServerCache(interaction.guildId);
        
        // Resposta silenciosa - apenas confirma a ação
        await interaction.deferUpdate();
        
    } catch (error) {
        console.error('Erro ao configurar cargo reprovado:', error);
        const errorEmbed = createErrorEmbed(
            'Erro de Configuração',
            `${CONFIG.EMOJIS.ERROR} Não foi possível salvar o cargo. Tente novamente.`
        );
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleSelectQuestionToRemove(interaction) {
    const questionId = parseInt(interaction.values[0]);
    
    if (isNaN(questionId)) {
        const errorEmbed = createErrorEmbed(
            'ID Inválido',
            'O ID da pergunta não é válido.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    try {
        // Buscar a pergunta antes de remover para mostrar no feedback
        const questions = await database.getFormQuestions(interaction.guildId);
        const questionToRemove = questions.find(q => q.id === questionId);
        
        if (!questionToRemove) {
            const errorEmbed = createErrorEmbed(
                'Pergunta Não Encontrada',
                'A pergunta selecionada não foi encontrada.'
            );
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Remover a pergunta
        await database.removeFormQuestion(questionId);
        
        // Invalidar cache para forçar atualização
        cache.invalidateServerCache(interaction.guildId);
        
        // Resposta silenciosa - apenas confirma a ação
        await interaction.deferUpdate();
        
    } catch (error) {
        console.error('Erro ao remover pergunta:', error);
        const errorEmbed = createErrorEmbed(
            'Erro de Banco de Dados',
            'Não foi possível remover a pergunta. Tente novamente.'
        );
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}