import { EmbedBuilder } from 'discord.js';

const COLORS = {
    SUCCESS: 0x00ff00,
    ERROR: 0xff0000,
    WARNING: 0xffff00,
    INFO: 0x0099ff,
    PENDING: 0xffa500,
    PRIMARY: 0x5865f2
};

/**
 * Cria um embed de sucesso
 */
export function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Cria um embed de erro
 */
export function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Cria um embed de aviso
 */
export function createWarningEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Cria um embed informativo
 */
export function createInfoEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle(`ℹ️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Cria um embed para o painel de configuração
 */
export function createConfigPanelEmbed(guildName, config, questions) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('🛠️ Painel de Configuração - Formulários Ghost')
        .setDescription(`Gerencie o sistema de formulários do servidor **${guildName}**`)
        .setTimestamp();

    // Status da configuração
    const logCategory = config?.log_category_id ? '✅ Configurada' : '❌ Não configurada';
    const approvedRole = config?.approved_role_id ? '✅ Configurado' : '❌ Não configurado';
    const rejectedRole = config?.rejected_role_id ? '✅ Configurado' : '⚠️ Opcional';

    embed.addFields(
        {
            name: '📊 Status da Configuração',
            value: `**Categoria de Logs:** ${logCategory}\n**Cargo Aprovado:** ${approvedRole}\n**Cargo Reprovado:** ${rejectedRole}`,
            inline: false
        },
        {
            name: '📝 Perguntas do Formulário',
            value: questions.length > 0 ? `${questions.length} pergunta(s) configurada(s)` : '❌ Nenhuma pergunta configurada',
            inline: true
        },
        {
            name: '🎯 Ações Disponíveis',
            value: 'Use os botões abaixo para configurar o sistema',
            inline: true
        }
    );

    return embed;
}

/**
 * Cria um embed para listar perguntas
 */
export function createQuestionsListEmbed(questions) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('📋 Perguntas do Formulário')
        .setTimestamp();

    if (questions.length === 0) {
        embed.setDescription('❌ Nenhuma pergunta configurada ainda.\n\nUse o botão "➕ Adicionar Pergunta" para começar!');
    } else {
        let description = '';
        questions.forEach((q, index) => {
            description += `**${index + 1}.** ${q.question}\n`;
        });
        embed.setDescription(description);
        embed.setFooter({ text: `Total: ${questions.length} pergunta(s)` });
    }

    return embed;
}

/**
 * Cria um embed para submissão de formulário
 */
export function createSubmissionEmbed(user, answers, submissionId) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.PENDING)
        .setTitle('📨 Nova Submissão de Formulário')
        .setDescription(`**Usuário:** ${user.tag} (${user.id})`)
        .addFields({
            name: '📝 Respostas',
            value: answers || 'Erro ao carregar respostas',
            inline: false
        })
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `ID da Submissão: ${submissionId}` })
        .setTimestamp();

    return embed;
}

/**
 * Cria um embed para o botão de enviar formulário
 */
export function createFormStartEmbed(guildName) {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('📋 Formulário de Inscrição')
        .setDescription(`Bem-vindo ao sistema de formulários do **${guildName}**!\n\nClique no botão abaixo para iniciar o preenchimento do formulário. As perguntas serão enviadas diretamente na sua DM.`)
        .addFields({
            name: '📝 Como funciona?',
            value: '1️⃣ Clique em "📨 Enviar Formulário"\n2️⃣ Responda as perguntas na sua DM\n3️⃣ Aguarde a análise dos administradores\n4️⃣ Receba o resultado na sua DM',
            inline: false
        })
        .setFooter({ text: 'Certifique-se de que suas DMs estão abertas!' })
        .setTimestamp();
}

/**
 * Cria um embed de resultado de aprovação/reprovação
 */
export function createResultEmbed(approved, guildName, reviewer) {
    const color = approved ? COLORS.SUCCESS : COLORS.ERROR;
    const emoji = approved ? '✅' : '❌';
    const status = approved ? 'APROVADO' : 'REPROVADO';
    
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} Formulário ${status}`)
        .setDescription(`Seu formulário no servidor **${guildName}** foi **${status.toLowerCase()}**!`)
        .addFields({
            name: '👤 Revisado por',
            value: reviewer.tag,
            inline: true
        })
        .setTimestamp();
}