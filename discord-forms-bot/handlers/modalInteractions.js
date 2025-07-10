import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed, createSubmissionEmbed } from '../utils/embeds.js';
import { CONFIG } from '../config/constants.js';
import { cache } from '../utils/cache.js';
import database from '../database/database.js';

export async function handleModalSubmit(interaction) {
    const { customId } = interaction;

    try {
        if (customId === 'add_question_modal') {
            await handleAddQuestionModal(interaction);
        } else if (customId.startsWith('form_modal:')) {
            await handleFormModal(interaction);
        } else {
            console.log(`Modal não reconhecido: ${customId}`);
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
        
        // Invalidar cache para forçar atualização
        if (cache) {
            cache.invalidateServerCache(interaction.guildId);
        }
        
        // Resposta discreta
        await interaction.reply({ 
            content: `${CONFIG.EMOJIS.SUCCESS} Pergunta adicionada: "${questionText.length > 50 ? questionText.substring(0, 50) + '...' : questionText}"`, 
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('Erro ao adicionar pergunta:', error);
        const errorEmbed = createErrorEmbed(
            'Erro de Banco de Dados',
            `${CONFIG.EMOJIS.ERROR} Não foi possível adicionar a pergunta.\n\n${CONFIG.EMOJIS.INFO} Tente novamente ou entre em contato com o suporte.`
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleFormModal(interaction) {
    const startIndex = parseInt(interaction.customId.split(':')[1]);
    const allQuestions = await database.getFormQuestions(interaction.guildId);
    
    try {
        let submissionId;
        let answers = [];
        
        // Se é o primeiro modal, criar nova submissão
        if (startIndex === 0) {
            submissionId = await database.createSubmission(
                interaction.guildId,
                interaction.user.id,
                interaction.user.tag
            );
            
            // Armazenar o ID da submissão temporariamente (você pode usar cache ou database)
            // Por simplicidade, vamos usar um Map global temporário
            if (!global.pendingSubmissions) {
                global.pendingSubmissions = new Map();
            }
            global.pendingSubmissions.set(interaction.user.id, submissionId);
        } else {
            // Recuperar ID da submissão existente
            submissionId = global.pendingSubmissions?.get(interaction.user.id);
            if (!submissionId) {
                const errorEmbed = createErrorEmbed(
                    'Sessão Expirada',
                    'Sua sessão de formulário expirou. Comece novamente.'
                );
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }

        // Processar respostas do modal atual
        const currentQuestions = allQuestions.slice(startIndex, startIndex + 5);
        
        for (const question of currentQuestions) {
            try {
                const answer = interaction.fields.getTextInputValue(`question_${question.id}`);
                answers.push(`**${question.question}**\n${answer}`);
                await database.addAnswer(submissionId, question.id, answer);
            } catch (fieldError) {
                console.error(`Erro ao processar pergunta ${question.id}:`, fieldError);
            }
        }

        // Verificar se há mais perguntas
        const remainingQuestions = allQuestions.slice(startIndex + 5);
        
        if (remainingQuestions.length > 0) {
            // Há mais perguntas, mostrar próximo modal
            const nextModal = new ModalBuilder()
                .setCustomId(`form_modal:${startIndex + 5}`)
                .setTitle(`Formulário (Parte ${Math.floor((startIndex + 5) / 5) + 1})`);

            const nextBatch = remainingQuestions.slice(0, 5);
            nextBatch.forEach((question, index) => {
                const input = new TextInputBuilder()
                    .setCustomId(`question_${question.id}`)
                    .setLabel(`${startIndex + 5 + index + 1}. ${question.question.substring(0, 45)}`)
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Digite sua resposta aqui...')
                    .setRequired(true)
                    .setMaxLength(1000);

                const row = new ActionRowBuilder().addComponents(input);
                nextModal.addComponents(row);
            });

            await interaction.reply({ content: `✅ Respostas salvas! Continuando... (${startIndex + 5}/${allQuestions.length})`, ephemeral: true });
            setTimeout(async () => {
                try {
                    await interaction.followUp({ modal: nextModal });
                } catch (error) {
                    console.error('Erro ao mostrar próximo modal:', error);
                }
            }, 1000);
            
        } else {
            // Formulário completo, processar submissão final
            await finalizeSubmission(interaction, submissionId);
            
            // Limpar submissão temporária
            if (global.pendingSubmissions) {
                global.pendingSubmissions.delete(interaction.user.id);
            }
        }

    } catch (error) {
        console.error('Erro ao processar modal do formulário:', error);
        const errorEmbed = createErrorEmbed(
            'Erro no Formulário',
            'Ocorreu um erro ao processar suas respostas. Tente novamente.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function finalizeSubmission(interaction, submissionId) {
    try {
        // Buscar todas as respostas da submissão
        const submission = await database.getSubmissionWithAnswers(submissionId);
        const config = await database.getServerConfig(interaction.guildId);

        // Preparar respostas formatadas
        const answers = submission.answers.map(answer => 
            `**${answer.question}**\n${answer.answer}`
        ).join('\n\n');

        // Enviar para categoria de logs
        const logCategory = interaction.guild.channels.cache.get(config.log_category_id);
        
        if (logCategory) {
            const logChannel = logCategory.children.cache.find(ch => ch.isTextBased());
            
            if (logChannel) {
                const submissionEmbed = createSubmissionEmbed(
                    interaction.user,
                    answers,
                    submissionId
                );

                const approveButton = new ButtonBuilder()
                    .setCustomId(`approve_submission:${submissionId}`)
                    .setLabel('Aprovar')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success);

                const rejectButton = new ButtonBuilder()
                    .setCustomId(`reject_submission:${submissionId}`)
                    .setLabel('Reprovar')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(approveButton, rejectButton);

                await logChannel.send({
                    embeds: [submissionEmbed],
                    components: [row]
                });
            }
        }

        // Resposta discreta
        await interaction.reply({ 
            content: `${CONFIG.EMOJIS.SUCCESS} **Formulário enviado!** Aguarde a análise da equipe.`, 
            ephemeral: true 
        });

    } catch (error) {
        console.error('Erro ao finalizar submissão:', error);
        const errorEmbed = createErrorEmbed(
            'Erro na Finalização',
            'Houve um problema ao enviar seu formulário. Entre em contato com os administradores.'
        );
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}