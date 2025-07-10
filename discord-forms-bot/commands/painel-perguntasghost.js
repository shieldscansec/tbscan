import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { hasFormManagerPermission } from '../utils/permissions.js';
import { createConfigPanelEmbed, createErrorEmbed } from '../utils/embeds.js';
import database from '../database/database.js';

export const data = new SlashCommandBuilder()
    .setName('painel-perguntasghost')
    .setDescription('Abre o painel de configuração do sistema de formulários')
    .setDefaultMemberPermissions(0); // Sem permissões padrão, será verificado no código

export async function execute(interaction) {
    try {
        // Verificar permissões
        if (!hasFormManagerPermission(interaction.member)) {
            const errorEmbed = createErrorEmbed(
                'Acesso Negado',
                'Você precisa ser **Administrador** ou ter o cargo **Gestor de Formulários** para usar este comando.'
            );
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Buscar configurações atuais
        const config = await database.getServerConfig(interaction.guildId);
        const questions = await database.getFormQuestions(interaction.guildId);

        // Criar embed do painel
        const embed = createConfigPanelEmbed(interaction.guild.name, config, questions);

        // Criar botões do painel
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('add_question')
                    .setLabel('Adicionar Pergunta')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('remove_question')
                    .setLabel('Remover Pergunta')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(questions.length === 0),
                new ButtonBuilder()
                    .setCustomId('view_questions')
                    .setLabel('Ver Perguntas')
                    .setEmoji('🧾')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(questions.length === 0)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('set_log_category')
                    .setLabel('Categoria de Logs')
                    .setEmoji('📁')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('set_roles')
                    .setLabel('Configurar Cargos')
                    .setEmoji('🧩')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('start_form')
                    .setLabel('Iniciar Formulário')
                    .setEmoji('🔗')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!config?.log_category_id || !config?.approved_role_id || questions.length === 0)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro no comando painel-perguntasghost:', error);
        const errorEmbed = createErrorEmbed(
            'Erro Interno',
            'Ocorreu um erro ao abrir o painel. Tente novamente mais tarde.'
        );
        
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}