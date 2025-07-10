import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Garante que o diretório existe
const dbDir = __dirname;
const dbPath = join(dbDir, 'forms.json');

class JSONDatabase {
    constructor() {
        this.data = {
            serverConfigs: {},
            formQuestions: {},
            formSubmissions: {},
            formAnswers: {},
            nextIds: {
                question: 1,
                submission: 1,
                answer: 1
            }
        };
        this.initDatabase();
    }

    async initDatabase() {
        try {
            if (existsSync(dbPath)) {
                const fileContent = await fs.readFile(dbPath, 'utf8');
                this.data = JSON.parse(fileContent);
                console.log('✅ Conectado ao banco de dados JSON');
            } else {
                await this.saveData();
                console.log('✅ Banco de dados JSON criado');
            }
        } catch (error) {
            console.error('Erro ao inicializar banco de dados:', error);
            throw error;
        }
    }

    async saveData() {
        try {
            await fs.writeFile(dbPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            throw error;
        }
    }

    // Métodos para configurações do servidor
    async getServerConfig(guildId) {
        try {
            return this.data.serverConfigs[guildId] || null;
        } catch (error) {
            console.error('Erro ao buscar configuração do servidor:', error);
            throw error;
        }
    }

    async updateServerConfig(guildId, config) {
        try {
            const { logCategoryId, approvedRoleId, rejectedRoleId } = config;
            
            this.data.serverConfigs[guildId] = {
                guild_id: guildId,
                log_category_id: logCategoryId,
                approved_role_id: approvedRoleId,
                rejected_role_id: rejectedRoleId,
                created_at: this.data.serverConfigs[guildId]?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            await this.saveData();
            return 1; // Simula changes count
        } catch (error) {
            console.error('Erro ao atualizar configuração do servidor:', error);
            throw error;
        }
    }

    // Métodos para perguntas
    async getFormQuestions(guildId) {
        try {
            const questions = Object.values(this.data.formQuestions)
                .filter(q => q.guild_id === guildId)
                .sort((a, b) => a.order_index - b.order_index);
            return questions;
        } catch (error) {
            console.error('Erro ao buscar perguntas do formulário:', error);
            throw error;
        }
    }

    async addFormQuestion(guildId, question) {
        try {
            // Pega o próximo índice
            const existingQuestions = await this.getFormQuestions(guildId);
            const nextIndex = existingQuestions.length > 0 
                ? Math.max(...existingQuestions.map(q => q.order_index)) + 1 
                : 1;
            
            const questionId = this.data.nextIds.question++;
            
            this.data.formQuestions[questionId] = {
                id: questionId,
                guild_id: guildId,
                question: question,
                order_index: nextIndex,
                created_at: new Date().toISOString()
            };
            
            await this.saveData();
            return questionId;
        } catch (error) {
            console.error('Erro ao adicionar pergunta:', error);
            throw error;
        }
    }

    async removeFormQuestion(questionId) {
        try {
            if (this.data.formQuestions[questionId]) {
                delete this.data.formQuestions[questionId];
                
                // Remove respostas relacionadas
                Object.keys(this.data.formAnswers).forEach(answerId => {
                    if (this.data.formAnswers[answerId].question_id === questionId) {
                        delete this.data.formAnswers[answerId];
                    }
                });
                
                await this.saveData();
                return 1; // Simula changes count
            }
            return 0;
        } catch (error) {
            console.error('Erro ao remover pergunta:', error);
            throw error;
        }
    }

    // Métodos para submissões
    async createSubmission(guildId, userId, username) {
        try {
            const submissionId = this.data.nextIds.submission++;
            
            this.data.formSubmissions[submissionId] = {
                id: submissionId,
                guild_id: guildId,
                user_id: userId,
                username: username,
                status: 'pending',
                submitted_at: new Date().toISOString(),
                reviewed_at: null,
                reviewer_id: null
            };
            
            await this.saveData();
            return submissionId;
        } catch (error) {
            console.error('Erro ao criar submissão:', error);
            throw error;
        }
    }

    async addAnswer(submissionId, questionId, answer) {
        try {
            const answerId = this.data.nextIds.answer++;
            
            this.data.formAnswers[answerId] = {
                id: answerId,
                submission_id: submissionId,
                question_id: questionId,
                answer: answer
            };
            
            await this.saveData();
            return answerId;
        } catch (error) {
            console.error('Erro ao adicionar resposta:', error);
            throw error;
        }
    }

    async getSubmissionWithAnswers(submissionId) {
        try {
            const submission = this.data.formSubmissions[submissionId];
            if (!submission) return null;
            
            // Buscar respostas relacionadas
            const answers = Object.values(this.data.formAnswers)
                .filter(a => a.submission_id == submissionId);
            
            // Buscar perguntas relacionadas
            const questions = Object.values(this.data.formQuestions);
            
            // Montar as respostas formatadas
            const formattedAnswers = answers.map(answer => {
                const question = questions.find(q => q.id == answer.question_id);
                return `${question?.question || 'Pergunta não encontrada'}: ${answer.answer}`;
            }).join('\n\n');
            
            return {
                ...submission,
                answers: formattedAnswers
            };
        } catch (error) {
            console.error('Erro ao buscar submissão com respostas:', error);
            throw error;
        }
    }

    async updateSubmissionStatus(submissionId, status, reviewerId) {
        try {
            if (this.data.formSubmissions[submissionId]) {
                this.data.formSubmissions[submissionId].status = status;
                this.data.formSubmissions[submissionId].reviewer_id = reviewerId;
                this.data.formSubmissions[submissionId].reviewed_at = new Date().toISOString();
                
                await this.saveData();
                return 1; // Simula changes count
            }
            return 0;
        } catch (error) {
            console.error('Erro ao atualizar status da submissão:', error);
            throw error;
        }
    }

    // Método para backup dos dados
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = join(dbDir, `forms-backup-${timestamp}.json`);
            await fs.writeFile(backupPath, JSON.stringify(this.data, null, 2));
            console.log(`✅ Backup criado: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            throw error;
        }
    }

    // Método para limpeza (não necessário para JSON, mas mantido para compatibilidade)
    close() {
        console.log('✅ Banco de dados JSON fechado');
    }
}

export default new JSONDatabase();