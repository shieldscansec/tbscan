import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ChannelType,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from 'discord.js';
import { hasFormManagerPermission, hasReviewPermission, isValidLogCategory, isValidRole } from '../utils/permissions.js';
import { 
    createErrorEmbed, 
    createSuccessEmbed, 
    createQuestionsListEmbed, 
    createConfigPanelEmbed,
    createFormStartEmbed,
    createSubmissionEmbed,
    createResultEmbed
} from '../utils/embeds.js';
import { CONFIG } from '../config/constants.js';
import { cache } from '../utils/cache.js';
import database from '../database/database.js';

export async function handleButtonInteraction(interaction) {
    const { customId } = interaction;

    try {
        // Verificar permissões para botões administrativos
        const adminButtons = [
            'add_question', 'remove_question', 'view_questions', 'set_log_category', 'set_roles', 'start_form',
            'panel_add_question', 'panel_remove_question', 'panel_view_questions', 
            'panel_set_log_category', 'panel_set_roles', 'panel_activate_form', 'panel_status'
        ];
        
        if (adminButtons.includes(customId)) {
            if (!hasFormManagerPermission(interaction.member)) {
                const errorEmbed = createErrorEmbed(
                    'Acesso Negado',
                    CONFIG.MESSAGES.PERMISSION_DENIED
                );
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        switch (customId) {
            // Botões originais
            case 'add_question':
            case 'panel_add_question':
                await handleAddQuestion(interaction);
                break;
                
            case 'remove_question':
            case 'panel_remove_question':
                await handleRemoveQuestion(interaction);
                break;
                
            case 'view_questions':
            case 'panel_view_questions':
                await handleViewQuestions(interaction);
                break;
                
            case 'set_log_category':
            case 'panel_set_log_category':
                await handleSetLogCategory(interaction);
                break;
                
            case 'set_roles':
            case 'panel_set_roles':
                await handleSetRoles(interaction);
                break;
                
            case 'start_form':
            case 'panel_activate_form':
                await handleStartForm(interaction);
                break;

            case 'panel_status':
                await handlePanelStatus(interaction);
                break;
                
            case 'submit_form':
                await handleSubmitForm(interaction);
                break;
                
            default:
                if (customId.startsWith('approve_submission:')) {
                    await handleApproveSubmission(interaction);
                } else if (customId.startsWith('reject_submission:')) {
                    await handleRejectSubmission(interaction);
                } else if (customId.startsWith('remove_q_')) {
                    await handleRemoveSpecificQuestion(interaction);
                }
                break;
        }
    } catch (error) {
        console.error('Erro no manipulador de botões:', error);
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

async function handleAddQuestion(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('add_question_modal')
        .setTitle(`${CONFIG.EMOJIS.ADD} Adicionar Nova Pergunta`);

    const questionInput = new TextInputBuilder()
        .setCustomId('question_text')
        .setLabel('Digite sua pergunta para o formulário')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Exemplo: Qual é o seu nome completo? Como você conheceu nosso servidor?')
        .setRequired(true)
        .setMaxLength(CONFIG.DISCORD_LIMITS.MODAL_INPUT_VALUE_MAX);

    const row = new ActionRowBuilder().addComponents(questionInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function handleRemoveQuestion(interaction) {
    // Buscar perguntas com cache
    let questions = cache.getFormQuestions(interaction.guildId);
    if (!questions) {
        questions = await database.getFormQuestions(interaction.guildId);
        if (questions) cache.setFormQuestions(interaction.guildId, questions);
    }
    
    if (!questions || questions.length === 0) {
        const errorEmbed = createErrorEmbed(
            'Nenhuma Pergunta Configurada',
            `${CONFIG.EMOJIS.WARNING} Não há perguntas para remover.\n\n${CONFIG.EMOJIS.INFO} Use o botão **"${CONFIG.EMOJIS.ADD} Adicionar Pergunta"** para criar perguntas primeiro.`
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_question_to_remove')
        .setPlaceholder(`${CONFIG.EMOJIS.REMOVE} Selecione uma pergunta para remover`)
        .addOptions(
            questions.map((q, index) => {
                const labelMaxLength = CONFIG.DISCORD_LIMITS.SELECT_OPTION_LABEL_MAX - 10; // Reservar espaço para numeração
                const truncatedQuestion = q.question.length > labelMaxLength 
                    ? `${q.question.substring(0, labelMaxLength)}...` 
                    : q.question;
                
                return new StringSelectMenuOptionBuilder()
                    .setLabel(`${index + 1}. ${truncatedQuestion}`)
                    .setValue(q.id.toString())
                    .setDescription(`ID: ${q.id} | Clique para remover esta pergunta`)
                    .setEmoji(CONFIG.EMOJIS.REMOVE);
            })
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    await interaction.reply({
        content: `${CONFIG.EMOJIS.REMOVE} **Remover Pergunta do Formulário**\n\n${CONFIG.EMOJIS.WARNING} **Atenção:** Esta ação não pode ser desfeita!`,
        components: [row],
        ephemeral: true
    });
}

async function handleViewQuestions(interaction) {
    // Buscar perguntas com cache
    let questions = cache.getFormQuestions(interaction.guildId);
    if (!questions) {
        questions = await database.getFormQuestions(interaction.guildId);
        if (questions) cache.setFormQuestions(interaction.guildId, questions);
    }
    
    const embed = createQuestionsListEmbed(questions || []);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleSetLogCategory(interaction) {
    const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId('select_log_category')
        .setPlaceholder('Selecione a categoria para logs')
        .setChannelTypes(ChannelType.GuildCategory);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    await interaction.reply({
        content: `${CONFIG.EMOJIS.CATEGORY} **Configurar Categoria de Logs**\n\n${CONFIG.EMOJIS.INFO} Selecione a categoria onde as submissões de formulários serão enviadas para análise.\n\n${CONFIG.EMOJIS.WARNING} **Importante:** Certifique-se de que o bot tem permissão para enviar mensagens nesta categoria.`,
        components: [row],
        ephemeral: true
    });
}

async function handleSetRoles(interaction) {
    const selectMenuApproved = new RoleSelectMenuBuilder()
        .setCustomId('select_approved_role')
        .setPlaceholder('Selecione o cargo para usuários aprovados');

    const selectMenuRejected = new RoleSelectMenuBuilder()
        .setCustomId('select_rejected_role')
        .setPlaceholder('Selecione o cargo para usuários reprovados (opcional)');

    const row1 = new ActionRowBuilder().addComponents(selectMenuApproved);
    const row2 = new ActionRowBuilder().addComponents(selectMenuRejected);
    
    await interaction.reply({
        content: `${CONFIG.EMOJIS.ROLE} **Configurar Sistema de Cargos**\n\n${CONFIG.EMOJIS.SUCCESS} **Cargo para Aprovados:** Obrigatório - será dado aos usuários aprovados\n${CONFIG.EMOJIS.WARNING} **Cargo para Reprovados:** Opcional - será dado aos usuários reprovados\n\n${CONFIG.EMOJIS.INFO} **Dica:** Configure primeiro o cargo obrigatório, depois o opcional.`,
        components: [row1, row2],
        ephemeral: true
    });
}

async function handleStartForm(interaction) {
    // Buscar configurações com cache
    let config = cache.getServerConfig(interaction.guildId);
    let questions = cache.getFormQuestions(interaction.guildId);

    if (!config) {
        config = await database.getServerConfig(interaction.guildId);
        if (config) cache.setServerConfig(interaction.guildId, config);
    }

    if (!questions) {
        questions = await database.getFormQuestions(interaction.guildId);
        if (questions) cache.setFormQuestions(interaction.guildId, questions);
    }

    // Verificar se está tudo configurado
    const missingItems = [];
    if (!config?.log_category_id) missingItems.push(`${CONFIG.EMOJIS.CATEGORY} Categoria de Logs`);
    if (!config?.approved_role_id) missingItems.push(`${CONFIG.EMOJIS.ROLE} Cargo para Aprovados`);
    if (!questions || questions.length === 0) missingItems.push(`${CONFIG.EMOJIS.FORM} Perguntas do Formulário`);

    if (missingItems.length > 0) {
        const errorEmbed = createErrorEmbed(
            'Sistema Não Configurado',
            `${CONFIG.EMOJIS.WARNING} **Configuração incompleta!**\n\n**Faltam os seguintes itens:**\n${missingItems.join('\n')}\n\n${CONFIG.EMOJIS.INFO} Complete a configuração usando os botões do painel de controle.`
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Criar embed e botão do formulário
    const embed = createFormStartEmbed(interaction.guild.name);
    
    const button = new ButtonBuilder()
        .setCustomId('submit_form')
        .setLabel('Enviar Formulário')
        .setEmoji(CONFIG.EMOJIS.SEND)
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
        content: `${CONFIG.EMOJIS.SUCCESS} **Formulário ativado!** Sistema pronto com **${questions.length}** pergunta(s).`,
        embeds: [embed],
        components: [row]
    });
}

async function handleSubmitForm(interaction) {
    const questions = await database.getFormQuestions(interaction.guildId);
    
    if (questions.length === 0) {
        const errorEmbed = createErrorEmbed(
            'Formulário Indisponível',
            'Este formulário não está configurado corretamente.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Discord permite máximo 5 inputs por modal, então vamos dividir as perguntas se necessário
    if (questions.length <= 5) {
        // Se temos 5 ou menos perguntas, usar um modal único
        await showFormModal(interaction, questions, 0);
    } else {
        // Se temos mais de 5 perguntas, usar múltiplos modais
        await showFormModal(interaction, questions.slice(0, 5), 0);
    }
}

async function showFormModal(interaction, questions, startIndex) {
    const isFirstModal = startIndex === 0;
    const allQuestions = await database.getFormQuestions(interaction.guildId);
    const remainingQuestions = allQuestions.slice(startIndex + 5);
    
    const modal = new ModalBuilder()
        .setCustomId(`form_modal:${startIndex}`)
        .setTitle(`Formulário ${allQuestions.length > 5 ? `(Parte ${Math.floor(startIndex / 5) + 1})` : ''}`);

    // Adicionar campos de input para cada pergunta
    questions.forEach((question, index) => {
        const input = new TextInputBuilder()
            .setCustomId(`question_${question.id}`)
            .setLabel(`${startIndex + index + 1}. ${question.question.substring(0, 45)}`)
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Digite sua resposta aqui...')
            .setRequired(true)
            .setMaxLength(1000);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);
    });

    if (isFirstModal) {
        await interaction.showModal(modal);
    } else {
        await interaction.reply({ content: 'Continuando o formulário...', ephemeral: true });
        await interaction.showModal(modal);
    }
}

async function handleApproveSubmission(interaction) {
    if (!hasReviewPermission(interaction.member)) {
        const errorEmbed = createErrorEmbed(
            'Acesso Negado',
            'Você não tem permissão para revisar formulários.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const submissionId = interaction.customId.split(':')[1];
    await processSubmissionReview(interaction, submissionId, true);
}

async function handleRejectSubmission(interaction) {
    if (!hasReviewPermission(interaction.member)) {
        const errorEmbed = createErrorEmbed(
            'Acesso Negado',
            'Você não tem permissão para revisar formulários.'
        );
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const submissionId = interaction.customId.split(':')[1];
    await processSubmissionReview(interaction, submissionId, false);
}

async function processSubmissionReview(interaction, submissionId, approved) {
    await interaction.deferReply({ ephemeral: true });

    try {
        // Buscar dados da submissão
        const submission = await database.getSubmissionWithAnswers(submissionId);
        
        if (!submission) {
            const errorEmbed = createErrorEmbed(
                'Submissão Não Encontrada',
                'Esta submissão não foi encontrada no banco de dados.'
            );
            return interaction.editReply({ embeds: [errorEmbed] });
        }

        // Atualizar status no banco
        await database.updateSubmissionStatus(
            submissionId,
            approved ? 'approved' : 'rejected',
            interaction.user.id
        );

        // Buscar configurações
        const config = await database.getServerConfig(interaction.guildId);
        
        // Atribuir cargo ao usuário
        const member = await interaction.guild.members.fetch(submission.user_id).catch(() => null);
        
        if (member) {
            const roleId = approved ? config.approved_role_id : config.rejected_role_id;
            if (roleId) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (role && isValidRole(role)) {
                    try {
                        await member.roles.add(role);
                    } catch (roleError) {
                        console.error('Erro ao atribuir cargo:', roleError);
                    }
                }
            }
        }

        // Enviar resultado ao usuário por DM
        try {
            const user = await interaction.client.users.fetch(submission.user_id);
            const resultEmbed = createResultEmbed(approved, interaction.guild.name, interaction.user);
            await user.send({ embeds: [resultEmbed] });
        } catch (dmError) {
            console.error('Erro ao enviar DM de resultado:', dmError);
        }

        // Atualizar mensagem original (desabilitar botões)
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('disabled_approve')
                    .setLabel(approved ? 'APROVADO' : 'Aprovar')
                    .setEmoji('✅')
                    .setStyle(approved ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('disabled_reject')
                    .setLabel(approved ? 'Reprovar' : 'REPROVADO')
                    .setEmoji('❌')
                    .setStyle(!approved ? ButtonStyle.Danger : ButtonStyle.Secondary)
                    .setDisabled(true)
            );

        await interaction.message.edit({ components: [disabledRow] });

        const successEmbed = createSuccessEmbed(
            `Formulário ${approved ? 'Aprovado' : 'Reprovado'}`,
            `O usuário **${submission.username}** foi **${approved ? 'aprovado' : 'reprovado'}** com sucesso!`
        );
        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error('Erro ao processar revisão:', error);
        const errorEmbed = createErrorEmbed(
            'Erro de Processamento',
            'Ocorreu um erro ao processar a revisão.'
        );
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

async function handlePanelStatus(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        // Buscar dados com cache
        let config = cache.getServerConfig(interaction.guildId);
        let questions = cache.getFormQuestions(interaction.guildId);

        if (!config) {
            config = await database.getServerConfig(interaction.guildId);
            if (config) cache.setServerConfig(interaction.guildId, config);
        }

        if (!questions) {
            questions = await database.getFormQuestions(interaction.guildId);
            if (questions) cache.setFormQuestions(interaction.guildId, questions);
        }

        // Criar embed do status atual
        const embed = createConfigPanelEmbed(interaction.guild.name, config, questions || []);
        
        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erro ao buscar status do painel:', error);
        const errorEmbed = createErrorEmbed(
            'Erro de Status',
            CONFIG.MESSAGES.INTERNAL_ERROR
        );
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}