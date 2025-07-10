import { PermissionFlagsBits } from 'discord.js';

/**
 * Verifica se o usuário tem permissões para gerenciar formulários
 * @param {GuildMember} member - Membro do servidor
 * @returns {boolean} - Se tem permissão ou não
 */
export function hasFormManagerPermission(member) {
    // Verifica se é administrador
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    // Verifica se tem o cargo "Gestor de Formulários"
    const formManagerRole = member.roles.cache.find(role => 
        role.name.toLowerCase() === 'gestor de formulários' || 
        role.name.toLowerCase() === 'gestor de formularios'
    );

    return !!formManagerRole;
}

/**
 * Verifica se o usuário pode revisar formulários (aprovar/reprovar)
 * @param {GuildMember} member - Membro do servidor
 * @returns {boolean} - Se tem permissão ou não
 */
export function hasReviewPermission(member) {
    // Mesmas permissões que gerenciar formulários
    return hasFormManagerPermission(member);
}

/**
 * Verifica se o canal é válido para logs
 * @param {Channel} channel - Canal
 * @returns {boolean} - Se é válido ou não
 */
export function isValidLogChannel(channel) {
    return channel && (channel.isTextBased() || channel.type === 0); // GUILD_TEXT
}

/**
 * Verifica se a categoria é válida para logs
 * @param {CategoryChannel} category - Categoria
 * @returns {boolean} - Se é válida ou não
 */
export function isValidLogCategory(category) {
    return category && category.type === 4; // GUILD_CATEGORY
}

/**
 * Verifica se o cargo é válido
 * @param {Role} role - Cargo
 * @returns {boolean} - Se é válido ou não
 */
export function isValidRole(role) {
    return role && !role.managed && role.name !== '@everyone';
}