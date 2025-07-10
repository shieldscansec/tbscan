import { CONFIG, CACHE_KEYS } from '../config/constants.js';

class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    set(key, value, ttl = CONFIG.TIMEOUTS.CACHE_TTL) {
        // Limpar timer existente se houver
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Armazenar valor
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });

        // Configurar expiração
        const timer = setTimeout(() => {
            this.delete(key);
        }, ttl);

        this.timers.set(key, timer);
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        return cached.value;
    }

    has(key) {
        return this.cache.has(key);
    }

    delete(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        return this.cache.delete(key);
    }

    clear() {
        // Limpar todos os timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }

    // Métodos específicos para o bot
    getServerConfig(guildId) {
        return this.get(`${CACHE_KEYS.SERVER_CONFIG}${guildId}`);
    }

    setServerConfig(guildId, config) {
        this.set(`${CACHE_KEYS.SERVER_CONFIG}${guildId}`, config);
    }

    getFormQuestions(guildId) {
        return this.get(`${CACHE_KEYS.FORM_QUESTIONS}${guildId}`);
    }

    setFormQuestions(guildId, questions) {
        this.set(`${CACHE_KEYS.FORM_QUESTIONS}${guildId}`, questions);
    }

    getUserSession(userId) {
        return this.get(`${CACHE_KEYS.USER_SESSION}${userId}`);
    }

    setUserSession(userId, session) {
        this.set(`${CACHE_KEYS.USER_SESSION}${userId}`, session, CONFIG.TIMEOUTS.FORM_SESSION);
    }

    deleteUserSession(userId) {
        this.delete(`${CACHE_KEYS.USER_SESSION}${userId}`);
    }

    // Invalidar cache relacionado a um servidor
    invalidateServerCache(guildId) {
        this.delete(`${CACHE_KEYS.SERVER_CONFIG}${guildId}`);
        this.delete(`${CACHE_KEYS.FORM_QUESTIONS}${guildId}`);
    }
}

// Exportar instância singleton
export const cache = new SimpleCache();

// Limpeza periódica (a cada 10 minutos)
setInterval(() => {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, data] of cache.cache.entries()) {
        if (now - data.timestamp > CONFIG.TIMEOUTS.CACHE_TTL * 2) {
            keysToDelete.push(key);
        }
    }

    keysToDelete.forEach(key => cache.delete(key));
}, 600000); // 10 minutos