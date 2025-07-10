import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Garante que o diretório existe
const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = join(dbDir, 'forms.db');

class DatabaseManager {
    constructor() {
        try {
            this.db = new Database(dbPath);
            console.log('✅ Conectado ao banco de dados SQLite');
            this.initTables();
        } catch (err) {
            console.error('Erro ao conectar com o banco de dados:', err);
            throw err;
        }
    }

    initTables() {
        try {
            // Tabela de configurações do servidor
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS server_configs (
                    guild_id TEXT PRIMARY KEY,
                    log_category_id TEXT,
                    approved_role_id TEXT,
                    rejected_role_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tabela de perguntas do formulário
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS form_questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    guild_id TEXT NOT NULL,
                    question TEXT NOT NULL,
                    order_index INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (guild_id) REFERENCES server_configs(guild_id)
                )
            `);

            // Tabela de submissões de formulário
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS form_submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    guild_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    username TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    reviewed_at DATETIME,
                    reviewer_id TEXT,
                    FOREIGN KEY (guild_id) REFERENCES server_configs(guild_id)
                )
            `);

            // Tabela de respostas do formulário
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS form_answers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    submission_id INTEGER NOT NULL,
                    question_id INTEGER NOT NULL,
                    answer TEXT NOT NULL,
                    FOREIGN KEY (submission_id) REFERENCES form_submissions(id),
                    FOREIGN KEY (question_id) REFERENCES form_questions(id)
                )
            `);

            console.log('✅ Tabelas do banco de dados inicializadas');
        } catch (error) {
            console.error('Erro ao criar tabelas:', error);
            throw error;
        }
    }

    // Métodos para configurações do servidor
    async getServerConfig(guildId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM server_configs WHERE guild_id = ?');
            return stmt.get(guildId);
        } catch (error) {
            console.error('Erro ao buscar configuração do servidor:', error);
            throw error;
        }
    }

    async updateServerConfig(guildId, config) {
        try {
            const { logCategoryId, approvedRoleId, rejectedRoleId } = config;
            
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO server_configs 
                (guild_id, log_category_id, approved_role_id, rejected_role_id, updated_at) 
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);
            
            const result = stmt.run(guildId, logCategoryId, approvedRoleId, rejectedRoleId);
            return result.changes;
        } catch (error) {
            console.error('Erro ao atualizar configuração do servidor:', error);
            throw error;
        }
    }

    // Métodos para perguntas
    async getFormQuestions(guildId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM form_questions WHERE guild_id = ? ORDER BY order_index');
            return stmt.all(guildId) || [];
        } catch (error) {
            console.error('Erro ao buscar perguntas do formulário:', error);
            throw error;
        }
    }

    async addFormQuestion(guildId, question) {
        try {
            // Primeiro, pega o próximo índice
            const maxStmt = this.db.prepare('SELECT MAX(order_index) as max_index FROM form_questions WHERE guild_id = ?');
            const row = maxStmt.get(guildId);
            const nextIndex = (row?.max_index || 0) + 1;
            
            // Insere a nova pergunta
            const insertStmt = this.db.prepare('INSERT INTO form_questions (guild_id, question, order_index) VALUES (?, ?, ?)');
            const result = insertStmt.run(guildId, question, nextIndex);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Erro ao adicionar pergunta:', error);
            throw error;
        }
    }

    async removeFormQuestion(questionId) {
        try {
            const stmt = this.db.prepare('DELETE FROM form_questions WHERE id = ?');
            const result = stmt.run(questionId);
            return result.changes;
        } catch (error) {
            console.error('Erro ao remover pergunta:', error);
            throw error;
        }
    }

    // Métodos para submissões
    async createSubmission(guildId, userId, username) {
        try {
            const stmt = this.db.prepare('INSERT INTO form_submissions (guild_id, user_id, username) VALUES (?, ?, ?)');
            const result = stmt.run(guildId, userId, username);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Erro ao criar submissão:', error);
            throw error;
        }
    }

    async addAnswer(submissionId, questionId, answer) {
        try {
            const stmt = this.db.prepare('INSERT INTO form_answers (submission_id, question_id, answer) VALUES (?, ?, ?)');
            const result = stmt.run(submissionId, questionId, answer);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Erro ao adicionar resposta:', error);
            throw error;
        }
    }

    async getSubmissionWithAnswers(submissionId) {
        try {
            const stmt = this.db.prepare(`
                SELECT s.*, GROUP_CONCAT(q.question || ': ' || a.answer, '\n\n') as answers
                FROM form_submissions s
                LEFT JOIN form_answers a ON s.id = a.submission_id
                LEFT JOIN form_questions q ON a.question_id = q.id
                WHERE s.id = ?
                GROUP BY s.id
            `);
            return stmt.get(submissionId);
        } catch (error) {
            console.error('Erro ao buscar submissão com respostas:', error);
            throw error;
        }
    }

    async updateSubmissionStatus(submissionId, status, reviewerId) {
        try {
            const stmt = this.db.prepare('UPDATE form_submissions SET status = ?, reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?');
            const result = stmt.run(status, reviewerId, submissionId);
            return result.changes;
        } catch (error) {
            console.error('Erro ao atualizar status da submissão:', error);
            throw error;
        }
    }

    close() {
        try {
            this.db.close();
            console.log('✅ Conexão com banco de dados fechada');
        } catch (error) {
            console.error('Erro ao fechar banco de dados:', error);
        }
    }
}

export default new DatabaseManager();