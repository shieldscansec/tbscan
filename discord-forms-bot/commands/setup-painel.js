import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { hasFormManagerPermission } from '../utils/permissions.js';
import { createErrorEmbed, createSuccessEmbed } from '../utils/embeds.js';
import { CONFIG } from '../config/constants.js';

export const data = new SlashCommandBuilder()
    .setName('setup-painel')
    .setDescription('Central de Controle - Sistema de Formulários Profissional')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    try {
        // Verificar permissões
        if (!hasFormManagerPermission(interaction.member)) {
            const errorEmbed = createErrorEmbed(
                'Acesso Negado',
                CONFIG.MESSAGES.PERMISSION_DENIED
            );
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Criar embed do painel de controle profissional
        const panelEmbed = {
            color: CONFIG.COLORS.PRIMARY,
            title: `${CONFIG.EMOJIS.ADMIN} Central de Controle | Sistema de Formulários`,
            description: `**Servidor:** ${interaction.guild.name}\n\n${CONFIG.EMOJIS.INFO} Gerencie todas as configurações do sistema de formulários através desta interface centralizada e profissional.`,
            fields: [
                {
                    name: `${CONFIG.EMOJIS.FORM} Gerenciamento de Perguntas`,
                    value: `${CONFIG.EMOJIS.ADD} Adicionar Pergunta\n${CONFIG.EMOJIS.REMOVE} Remover Pergunta\n${CONFIG.EMOJIS.VIEW} Visualizar Perguntas`,
                    inline: true
                },
                {
                    name: `${CONFIG.EMOJIS.CONFIG} Configurações do Sistema`,
                    value: `${CONFIG.EMOJIS.CATEGORY} Categoria de Logs\n${CONFIG.EMOJIS.ROLE} Configurar Cargos\n${CONFIG.EMOJIS.INFO} Status do Sistema`,
                    inline: true
                },
                {
                    name: `${CONFIG.EMOJIS.SUCCESS} Ativação`,
                    value: `${CONFIG.EMOJIS.FORM} Ativar Formulário\n\n*Configure todas as opções antes de ativar*`,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: `Sistema de Formulários Profissional • ${interaction.guild.name}`
            }
        };

        // Criar botões do painel (primeira linha)
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_add_question')
                    .setLabel('Adicionar Pergunta')
                    .setEmoji(CONFIG.EMOJIS.ADD)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('panel_remove_question')
                    .setLabel('Remover Pergunta')
                    .setEmoji(CONFIG.EMOJIS.REMOVE)
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('panel_view_questions')
                    .setLabel('Ver Perguntas')
                    .setEmoji(CONFIG.EMOJIS.VIEW)
                    .setStyle(ButtonStyle.Secondary)
            );

        // Segunda linha de botões
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_set_log_category')
                    .setLabel('Categoria de Logs')
                    .setEmoji(CONFIG.EMOJIS.CATEGORY)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('panel_set_roles')
                    .setLabel('Configurar Cargos')
                    .setEmoji(CONFIG.EMOJIS.ROLE)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('panel_activate_form')
                    .setLabel('Ativar Formulário')
                    .setEmoji(CONFIG.EMOJIS.FORM)
                    .setStyle(ButtonStyle.Success)
            );

        // Terceira linha com botão especial
        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_status')
                    .setLabel('Ver Status do Sistema')
                    .setEmoji(CONFIG.EMOJIS.INFO)
                    .setStyle(ButtonStyle.Secondary)
            );

        // Enviar painel de controle
        await interaction.reply({
            embeds: [panelEmbed],
            components: [row1, row2, row3]
        });

    } catch (error) {
        console.error('Erro no comando setup-painel:', error);
        const errorEmbed = createErrorEmbed(
            'Erro Interno',
            CONFIG.MESSAGES.INTERNAL_ERROR
        );
        
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}