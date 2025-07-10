import sqlite3 from 'sqlite3';
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

class Database {
    constructor() {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Erro ao conectar com o banco de dados:', err);
            } else {
                console.log('✅ Conectado ao banco de dados SQLite');
                this.initTables();
            }
        });
    }

    initTables() {
        // Tabela de configurações do servidor
        this.db.run(`
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
        this.db.run(`
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
        this.db.run(`
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
        this.db.run(`
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
    }

    // Métodos para configurações do servidor
    async getServerConfig(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM server_configs WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async updateServerConfig(guildId, config) {
        return new Promise((resolve, reject) => {
            const { logCategoryId, approvedRoleId, rejectedRoleId } = config;
            
            this.db.run(
                `INSERT OR REPLACE INTO server_configs 
                (guild_id, log_category_id, approved_role_id, rejected_role_id, updated_at) 
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [guildId, logCategoryId, approvedRoleId, rejectedRoleId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Métodos para perguntas
    async getFormQuestions(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM form_questions WHERE guild_id = ? ORDER BY order_index',
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async addFormQuestion(guildId, question) {
        return new Promise((resolve, reject) => {
            // Primeiro, pega o próximo índice
            this.db.get(
                'SELECT MAX(order_index) as max_index FROM form_questions WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const nextIndex = (row?.max_index || 0) + 1;
                    
                    this.db.run(
                        'INSERT INTO form_questions (guild_id, question, order_index) VALUES (?, ?, ?)',
                        [guildId, question, nextIndex],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                }
            );
        });
    }

    async removeFormQuestion(questionId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM form_questions WHERE id = ?',
                [questionId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Métodos para submissões
    async createSubmission(guildId, userId, username) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO form_submissions (guild_id, user_id, username) VALUES (?, ?, ?)',
                [guildId, userId, username],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async addAnswer(submissionId, questionId, answer) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO form_answers (submission_id, question_id, answer) VALUES (?, ?, ?)',
                [submissionId, questionId, answer],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getSubmissionWithAnswers(submissionId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT s.*, GROUP_CONCAT(q.question || ': ' || a.answer, '\n\n') as answers
                FROM form_submissions s
                LEFT JOIN form_answers a ON s.id = a.submission_id
                LEFT JOIN form_questions q ON a.question_id = q.id
                WHERE s.id = ?
                GROUP BY s.id`,
                [submissionId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async updateSubmissionStatus(submissionId, status, reviewerId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE form_submissions SET status = ?, reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, reviewerId, submissionId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    close() {
        this.db.close();
    }
}

export default new Database();