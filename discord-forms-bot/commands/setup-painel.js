import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { hasFormManagerPermission } from '../utils/permissions.js';
import { createErrorEmbed, createSuccessEmbed } from '../utils/embeds.js';
import { CONFIG } from '../config/constants.js';

export const data = new SlashCommandBuilder()
    .setName('setup-painel')
    .setDescription('Cria um painel de controle permanente para gerenciar formulários (use apenas uma vez)')
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

        // Criar embed do painel de controle permanente
        const panelEmbed = {
            color: CONFIG.COLORS.PRIMARY,
            title: `${CONFIG.EMOJIS.ADMIN} Central de Controle - Sistema de Formulários`,
            description: `**${CONFIG.EMOJIS.CONFIG} Painel de Administração**\n\n${CONFIG.EMOJIS.INFO} Use os botões abaixo para gerenciar completamente o sistema de formulários do servidor.\n\n**${CONFIG.EMOJIS.ADMIN} Servidor:** ${interaction.guild.name}`,
            fields: [
                {
                    name: `${CONFIG.EMOJIS.CONFIG} Configurações Principais`,
                    value: `${CONFIG.EMOJIS.ADD} **Adicionar Pergunta** - Criar novas perguntas\n${CONFIG.EMOJIS.REMOVE} **Remover Pergunta** - Excluir perguntas existentes\n${CONFIG.EMOJIS.VIEW} **Ver Perguntas** - Listar todas as perguntas`,
                    inline: true
                },
                {
                    name: `${CONFIG.EMOJIS.CONFIG} Sistema`,
                    value: `${CONFIG.EMOJIS.CATEGORY} **Categoria de Logs** - Onde as submissões aparecem\n${CONFIG.EMOJIS.ROLE} **Configurar Cargos** - Cargos para aprovados/reprovados\n${CONFIG.EMOJIS.FORM} **Ativar Formulário** - Liberar para usuários`,
                    inline: true
                },
                {
                    name: `${CONFIG.EMOJIS.INFO} Como Usar`,
                    value: `Este painel é **permanente** e ficará sempre disponível.\nVocê não precisa mais digitar comandos!\n\n${CONFIG.EMOJIS.SUCCESS} **Configure uma vez, use sempre!**`,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: `${CONFIG.EMOJIS.ADMIN} Painel de Controle Permanente - ${interaction.guild.name}`
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

        // Enviar painel permanente
        await interaction.reply({
            embeds: [panelEmbed],
            components: [row1, row2, row3]
        });

        // Confirmar criação do painel
        setTimeout(async () => {
            const successEmbed = createSuccessEmbed(
                'Painel Criado com Sucesso!',
                `${CONFIG.EMOJIS.SUCCESS} **Painel de controle permanente criado!**\n\n${CONFIG.EMOJIS.INFO} A partir de agora, você pode usar os botões acima para gerenciar o sistema de formulários.\n\n${CONFIG.EMOJIS.WARNING} **Importante:** Este painel é permanente. Você não precisa mais digitar comandos!`
            );
            
            await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
        }, 1000);

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