export const CONFIG = {
    // Limites do Discord
    DISCORD_LIMITS: {
        MODAL_MAX_INPUTS: 5,
        EMBED_DESCRIPTION_MAX: 4096,
        EMBED_FIELD_VALUE_MAX: 1024,
        EMBED_TITLE_MAX: 256,
        BUTTON_LABEL_MAX: 80,
        SELECT_OPTION_LABEL_MAX: 100,
        MODAL_INPUT_LABEL_MAX: 45,
        MODAL_INPUT_VALUE_MAX: 1000
    },

    // Timeouts e delays
    TIMEOUTS: {
        FORM_SESSION: 1800000, // 30 minutos
        MODAL_TRANSITION: 1000, // 1 segundo
        CACHE_TTL: 300000 // 5 minutos
    },

    // Cores para embeds
    COLORS: {
        SUCCESS: 0x00ff00,
        ERROR: 0xff0000,
        WARNING: 0xffff00,
        INFO: 0x0099ff,
        PRIMARY: 0x5865f2,
        SECONDARY: 0x99aab5
    },

    // Emojis
    EMOJIS: {
        SUCCESS: '✅',
        ERROR: '❌',
        WARNING: '⚠️',
        INFO: 'ℹ️',
        LOADING: '🔄',
        ADD: '➕',
        REMOVE: '🗑️',
        EDIT: '✏️',
        VIEW: '👁️',
        CONFIG: '⚙️',
        FORM: '📋',
        USER: '👤',
        ADMIN: '👑',
        LOG: '📝',
        CATEGORY: '📁',
        ROLE: '🎭',
        SEND: '📨',
        APPROVE: '✅',
        REJECT: '❌'
    },

    // Mensagens padrão
    MESSAGES: {
        PERMISSION_DENIED: 'Você não tem permissão para usar esta funcionalidade.',
        INTERNAL_ERROR: 'Ocorreu um erro interno. Tente novamente mais tarde.',
        INVALID_CONFIG: 'Configuração inválida ou incompleta.',
        SESSION_EXPIRED: 'Sua sessão expirou. Inicie o processo novamente.',
        SUCCESS_GENERIC: 'Operação realizada com sucesso!',
        PROCESSING: 'Processando sua solicitação...'
    }
};

export const CACHE_KEYS = {
    SERVER_CONFIG: 'server_config_',
    FORM_QUESTIONS: 'form_questions_',
    USER_SESSION: 'user_session_',
    PENDING_SUBMISSIONS: 'pending_submissions'
};

export const PERMISSIONS = {
    FORM_MANAGER: 'FORM_MANAGER',
    FORM_REVIEWER: 'FORM_REVIEWER',
    ADMINISTRATOR: 'ADMINISTRATOR'
};