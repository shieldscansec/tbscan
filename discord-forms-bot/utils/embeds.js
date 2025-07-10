import { EmbedBuilder } from 'discord.js';
import { CONFIG } from '../config/constants.js';

/**
 * Cria um embed de sucesso
 */
export function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(CONFIG.COLORS.SUCCESS)
        .setTitle(`${CONFIG.EMOJIS.SUCCESS} ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Cria um embed de erro
 */
export function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(CONFIG.COLORS.ERROR)
        .setTitle(`${CONFIG.EMOJIS.ERROR} ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Cria um embed de aviso
 */
export function createWarningEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(CONFIG.COLORS.WARNING)
        .setTitle(`${CONFIG.EMOJIS.WARNING} ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Cria um embed informativo
 */
export function createInfoEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(CONFIG.COLORS.INFO)
        .setTitle(`${CONFIG.EMOJIS.INFO} ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Cria um embed para o painel de configuração
 */
export function createConfigPanelEmbed(guildName, config, questions) {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.COLORS.PRIMARY)
        .setTitle(`${CONFIG.EMOJIS.CONFIG} Central de Controle - Sistema de Formulários`)
        .setDescription(`**${CONFIG.EMOJIS.ADMIN} Servidor:** ${guildName}\n${CONFIG.EMOJIS.INFO} Gerencie todas as configurações do sistema de formulários de forma centralizada.`)
        .setTimestamp();

    // Status da configuração com emojis
    const logCategory = config?.log_category_id 
        ? `${CONFIG.EMOJIS.SUCCESS} Configurada` 
        : `${CONFIG.EMOJIS.ERROR} Pendente`;
    
    const approvedRole = config?.approved_role_id 
        ? `${CONFIG.EMOJIS.SUCCESS} Configurado` 
        : `${CONFIG.EMOJIS.ERROR} Pendente`;
    
    const rejectedRole = config?.rejected_role_id 
        ? `${CONFIG.EMOJIS.SUCCESS} Configurado` 
        : `${CONFIG.EMOJIS.WARNING} Opcional`;

    const isReady = config?.log_category_id && config?.approved_role_id && questions.length > 0;
    const statusIcon = isReady ? CONFIG.EMOJIS.SUCCESS : CONFIG.EMOJIS.WARNING;
    const statusText = isReady ? 'Sistema Pronto' : 'Configuração Pendente';

    embed.addFields(
        {
            name: `${CONFIG.EMOJIS.CONFIG} Configurações Principais`,
            value: `${CONFIG.EMOJIS.CATEGORY} **Categoria de Logs:** ${logCategory}\n${CONFIG.EMOJIS.ROLE} **Cargo para Aprovados:** ${approvedRole}\n${CONFIG.EMOJIS.ROLE} **Cargo para Reprovados:** ${rejectedRole}`,
            inline: false
        },
        {
            name: `${CONFIG.EMOJIS.FORM} Formulário`,
            value: questions.length > 0 
                ? `${CONFIG.EMOJIS.SUCCESS} **${questions.length}** pergunta(s) configurada(s)` 
                : `${CONFIG.EMOJIS.ERROR} Nenhuma pergunta configurada`,
            inline: true
        },
        {
            name: `${CONFIG.EMOJIS.INFO} Status do Sistema`,
            value: `${statusIcon} **${statusText}**\n${isReady ? 'Pronto para receber formulários!' : 'Complete a configuração para ativar'}`,
            inline: true
        }
    );

    if (isReady) {
        embed.setFooter({ text: `${CONFIG.EMOJIS.SUCCESS} Sistema operacional e pronto para uso!` });
    } else {
        embed.setFooter({ text: `${CONFIG.EMOJIS.WARNING} Configure todos os itens para ativar o sistema` });
    }

    return embed;
}

/**
 * Cria um embed para listar perguntas
 */
export function createQuestionsListEmbed(questions) {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.COLORS.INFO)
        .setTitle(`${CONFIG.EMOJIS.FORM} Lista de Perguntas do Formulário`)
        .setTimestamp();

    if (questions.length === 0) {
        embed.setDescription(`${CONFIG.EMOJIS.WARNING} **Nenhuma pergunta configurada**\n\n${CONFIG.EMOJIS.INFO} Para começar a usar o sistema de formulários, você precisa adicionar pelo menos uma pergunta.\n\n${CONFIG.EMOJIS.ADD} Use o botão **"Adicionar Pergunta"** no painel de controle para criar sua primeira pergunta!`);
        embed.setColor(CONFIG.COLORS.WARNING);
    } else {
        let description = `${CONFIG.EMOJIS.SUCCESS} **Sistema configurado com ${questions.length} pergunta(s)**\n\n`;
        questions.forEach((q, index) => {
            const truncatedQuestion = q.question.length > 80 
                ? `${q.question.substring(0, 80)}...` 
                : q.question;
            description += `**${index + 1}.** ${truncatedQuestion}\n`;
        });
        embed.setDescription(description);
        embed.setFooter({ text: `${CONFIG.EMOJIS.FORM} Total de perguntas configuradas: ${questions.length}` });
    }

    return embed;
}

/**
 * Cria um embed para submissão de formulário
 */
export function createSubmissionEmbed(user, answers, submissionId) {
    const timestamp = new Date().toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const embed = new EmbedBuilder()
        .setColor(CONFIG.COLORS.WARNING)
        .setTitle(`${CONFIG.EMOJIS.SEND} Nova Submissão de Formulário`)
        .setDescription(`${CONFIG.EMOJIS.USER} **Candidato:** ${user.tag}\n${CONFIG.EMOJIS.INFO} **ID do Usuário:** \`${user.id}\`\n⏰ **Data/Hora:** ${timestamp}`)
        .addFields({
            name: `${CONFIG.EMOJIS.FORM} Respostas do Formulário`,
            value: answers || `${CONFIG.EMOJIS.ERROR} Erro ao carregar respostas`,
            inline: false
        })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
        .setFooter({ 
            text: `${CONFIG.EMOJIS.LOG} ID da Submissão: ${submissionId} | Aguardando revisão` 
        })
        .setTimestamp();

    return embed;
}

/**
 * Cria um embed para o botão de enviar formulário
 */
export function createFormStartEmbed(guildName) {
    return new EmbedBuilder()
        .setColor(CONFIG.COLORS.PRIMARY)
        .setTitle(`${CONFIG.EMOJIS.FORM} Sistema de Formulários - ${guildName}`)
        .setDescription(`${CONFIG.EMOJIS.SUCCESS} **Bem-vindo ao processo de inscrição!**\n\n${CONFIG.EMOJIS.INFO} Este é o sistema oficial de formulários do servidor. Para participar, você precisa preencher um formulário com algumas perguntas.`)
        .addFields({
            name: `${CONFIG.EMOJIS.CONFIG} Como Funciona o Processo`,
            value: `**1️⃣ Iniciar:** Clique no botão "${CONFIG.EMOJIS.SEND} Enviar Formulário"\n**2️⃣ Preencher:** Responda todas as perguntas que aparecerão\n**3️⃣ Enviar:** Confirme o envio das suas respostas\n**4️⃣ Aguardar:** Nossa equipe analisará seu formulário\n**5️⃣ Resultado:** Você receberá uma mensagem com o resultado`,
            inline: false
        },
        {
            name: `${CONFIG.EMOJIS.INFO} Informações Importantes`,
            value: `${CONFIG.EMOJIS.SUCCESS} **Interface Moderna:** As perguntas aparecerão em janelas popup\n${CONFIG.EMOJIS.SUCCESS} **Sem DM:** Não é necessário abrir mensagens diretas\n${CONFIG.EMOJIS.SUCCESS} **Seguro:** Suas respostas são armazenadas com segurança`,
            inline: false
        })
        .setFooter({ text: `${CONFIG.EMOJIS.FORM} Clique no botão abaixo para começar o processo de inscrição` })
        .setTimestamp();
}

/**
 * Cria um embed de resultado de aprovação/reprovação
 */
export function createResultEmbed(approved, guildName, reviewer) {
    const color = approved ? CONFIG.COLORS.SUCCESS : CONFIG.COLORS.ERROR;
    const emoji = approved ? CONFIG.EMOJIS.APPROVE : CONFIG.EMOJIS.REJECT;
    const status = approved ? 'APROVADO' : 'REPROVADO';
    const statusMessage = approved 
        ? `${CONFIG.EMOJIS.SUCCESS} **Parabéns!** Seu formulário foi aprovado com sucesso!`
        : `${CONFIG.EMOJIS.ERROR} Infelizmente, seu formulário não foi aprovado desta vez.`;
    
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} Resultado do Formulário: ${status}`)
        .setDescription(`**${CONFIG.EMOJIS.ADMIN} Servidor:** ${guildName}\n\n${statusMessage}`)
        .addFields({
            name: `${CONFIG.EMOJIS.USER} Revisado por`,
            value: `**${reviewer.tag}**\n\`${reviewer.id}\``,
            inline: true
        })
        .setTimestamp();

    if (approved) {
        embed.addFields({
            name: `${CONFIG.EMOJIS.SUCCESS} Próximos Passos`,
            value: `${CONFIG.EMOJIS.INFO} Você pode ter recebido novos cargos ou permissões no servidor!\n${CONFIG.EMOJIS.SUCCESS} Bem-vindo(a) à comunidade!`,
            inline: false
        });
        embed.setFooter({ text: `${CONFIG.EMOJIS.SUCCESS} Formulário aprovado com sucesso!` });
    } else {
        embed.addFields({
            name: `${CONFIG.EMOJIS.INFO} Informações`,
            value: `${CONFIG.EMOJIS.WARNING} Você pode tentar novamente seguindo as orientações da equipe.\n${CONFIG.EMOJIS.INFO} Entre em contato com os administradores se tiver dúvidas.`,
            inline: false
        });
        embed.setFooter({ text: `${CONFIG.EMOJIS.WARNING} Não desanime! Você pode tentar novamente.` });
    }
    
    return embed;
}