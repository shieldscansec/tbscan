import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';
import database from '../database/database.js';

export async function handleModalSubmit(interaction) {
    const { customId } = interaction;

    try {
        switch (customId) {
            case 'add_question_modal':
                await handleAddQuestionModal(interaction);
                break;
                
            default:
                console.log(`Modal não reconhecido: ${customId}`);
                break;
        }
    } catch (error) {
        console.error('Erro no manipulador de modais:', error);
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

async function handleAddQuestionModal(interaction) {
    const questionText = interaction.fields.getTextInputValue('question_text');
    
    if (!questionText || questionText.trim().length === 0) {
        const errorEmbed = createErrorEmbed(
            'Pergunta Inválida',
            'A pergunta não pode estar vazia.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (questionText.length > 1000) {
        const errorEmbed = createErrorEmbed(
            'Pergunta Muito Longa',
            'A pergunta deve ter no máximo 1000 caracteres.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    try {
        await database.addFormQuestion(interaction.guildId, questionText.trim());
        
        const successEmbed = createSuccessEmbed(
            'Pergunta Adicionada',
            `A pergunta foi adicionada com sucesso:\n\n**"${questionText}"**`
        );
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        
    } catch (error) {
        console.error('Erro ao adicionar pergunta:', error);
        const errorEmbed = createErrorEmbed(
            'Erro de Banco de Dados',
            'Não foi possível adicionar a pergunta. Tente novamente.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}