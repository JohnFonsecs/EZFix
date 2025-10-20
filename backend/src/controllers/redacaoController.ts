import { PrismaClient, UserRole } from "@prisma/client"; // Adicionado UserRole
import { Request, Response } from "express";
import { extrairTextoDaImagem } from "../services/ocrService";
import { analisarEnem, formatarTextoComLLM, AnaliseENEM } from "../services/ennAnalysisService";
import { chamarLLM as corrigirTextoOCR } from "../services/openaiService";

const prisma = new PrismaClient();
type AnaliseJob = { promise: Promise<AnaliseENEM>; startedAt: number }; // Corrigido o tipo da Promise
const analiseJobs = new Map<string, AnaliseJob>();
const analiseCache = new Map<string, { data: AnaliseENEM; cachedAt: number }>();
const ANALISE_TTL_MS = 10 * 60 * 1000;

// --- FUNÇÃO AUXILIAR PARA INICIAR ANÁLISE EM BACKGROUND ---
const iniciarAnaliseBackground = (redacaoId: string, textoParaAnalise: string) => {
    console.log(`⚡ Iniciando análise ENEM para redação ${redacaoId}...`);
    analiseCache.delete(redacaoId);
    analiseJobs.delete(redacaoId);
    const jobPromise = analisarEnem(textoParaAnalise); // analisarEnem retorna AnaliseENEM
    analiseJobs.set(redacaoId, { promise: jobPromise, startedAt: Date.now() });
    jobPromise.then(async (analiseEnem) => {
        try {
            await prisma.redacao.update({
                where: { id: redacaoId },
                data: { notaGerada: analiseEnem.notaFinal1000, notaFinal: analiseEnem.notaFinal1000 }
            });
            analiseCache.set(redacaoId, { data: analiseEnem, cachedAt: Date.now() });
            console.log(`📊 Análise da redação ${redacaoId} concluída: ${analiseEnem.notaFinal1000}/1000`);
        } catch (updateError: any) {
            if (updateError.code !== 'P2025') {
                console.error(`❌ Erro ao salvar nota da redação ${redacaoId}:`, updateError.message);
            }
        }
    }).catch(analyzeError => {
        console.error(`❌ Erro na análise automática da redação ${redacaoId}:`, analyzeError.message);
    }).finally(() => {
        analiseJobs.delete(redacaoId);
    });
};

// --- CONTROLLERS ---

// POST /api/redacoes (Aluno envia para si)
// POST /api/alunos/:alunoId/redacoes (Professor envia para aluno)
export const criarRedacao = async (req: Request, res: Response) => {
    try {
        const { titulo, turmaId } = req.body;
        const file = req.file as Express.Multer.File | undefined;
        const imagemUrl = file ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : req.body.imagemUrl;

        const usuarioLogadoId = req.userId; // Quem está fazendo o upload
        const usuarioLogadoRole = req.userRole; // Papel de quem está fazendo o upload
        const alunoIdParam = req.params.alunoId || null; // Aluno alvo (se professor)

        if (!usuarioLogadoId || !usuarioLogadoRole) return res.status(401).json({ erro: "Usuário não autenticado corretamente." });
        if (!titulo || !imagemUrl) return res.status(400).json({ erro: "Título e imagem são obrigatórios." });

        // Validação de Permissão
        if (alunoIdParam && usuarioLogadoRole !== UserRole.PROFESSOR) {
            return res.status(403).json({ erro: "Apenas professores podem enviar redações para alunos específicos." });
        }

        const alunoDestinoId = alunoIdParam || (usuarioLogadoRole === UserRole.ALUNO ? usuarioLogadoId : null);

        console.log("🔍 Iniciando extração de texto com OCR...");
        const ocrResult = await extrairTextoDaImagem(imagemUrl);

        if (!ocrResult.text || ocrResult.text.trim().length < 50) {
            return res.status(400).json({ erro: "Não foi possível extrair texto suficiente.", ocrResult });
        }

        // Mantendo a etapa de correção conforme seu código original
        console.log("🤖 Iniciando correção automática com IA...");
        const textoCorrigido = await corrigirTextoOCR(ocrResult.text);

        console.log("💾 Salvando redação no banco de dados...");
        const redacaoData: any = {
            titulo,
            imagemUrl,
            textoExtraido: ocrResult.text, // Salva o texto bruto extraído do OCR
            usuarioId: usuarioLogadoId,    // Quem fez o upload
            alunoId: alunoDestinoId,     // A quem pertence
        };
        if (turmaId && usuarioLogadoRole === UserRole.PROFESSOR) {
            redacaoData.turmaId = turmaId;
        }

        const redacao = await prisma.redacao.create({ data: redacaoData });
        console.log(`✅ Redação ${redacao.id} criada! Pertence ao aluno ${alunoDestinoId || 'próprio usuário'}.`);

        // Iniciar análise em background com o texto corrigido (que foi processado pela IA)
        iniciarAnaliseBackground(redacao.id, textoCorrigido);

        // Retorna o resultado do OCR e o texto corrigido
        return res.status(201).json({
            ...redacao,
            ocr: {
                ...ocrResult,
                text: textoCorrigido, // Retorna o texto corrigido
                originalText: ocrResult.text, // Mantém o original para referência
                corrected: true
            }
        });

    } catch (error: any) {
        console.error("❌ Erro ao criar redação:", error);
        if (error.code === 'P2003' && error.meta?.field_name?.includes('turmaId')) {
            return res.status(400).json({ erro: "Turma não encontrada." });
        }
        if (error.code === 'P2003' && error.meta?.field_name?.includes('alunoId')) {
            return res.status(400).json({ erro: "Aluno não encontrado." });
        }
        return res.status(500).json({ erro: "Erro interno do servidor.", detalhes: error.message });
    }
};

// GET /api/redacoes/:id/analise-enem
export const obterAnaliseEnem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        const redacao = await prisma.redacao.findUnique({
            where: { id },
            include: { turma: { select: { professorId: true } } }
        });

        if (!redacao) return res.status(404).json({ erro: 'Redação não encontrada.' });

        // VERIFICAÇÃO DE PERMISSÃO
        const isAlunoDono = userRole === UserRole.ALUNO && redacao.alunoId === userId;
        const isProfessorDaTurma = userRole === UserRole.PROFESSOR && redacao.turma?.professorId === userId;
        const isProfessorQueEnviou = userRole === UserRole.PROFESSOR && redacao.usuarioId === userId;

        if (!isAlunoDono && !isProfessorDaTurma && !isProfessorQueEnviou) {
            return res.status(403).json({ erro: 'Você não tem permissão para ver esta análise.' });
        }

        const cacheEntry = analiseCache.get(id);
        if (cacheEntry) {
            return res.status(200).json({ status: 'completed', analise: cacheEntry.data });
        }
        if (analiseJobs.has(id)) {
            return res.status(202).json({ status: 'running', message: 'Análise em processamento...' });
        }

        // Se não está no cache nem rodando, inicia o job
        console.warn(`⚠️ Análise para redação ${id} não encontrada. Iniciando job...`);
        iniciarAnaliseBackground(redacao.id, redacao.textoExtraido || '');

        return res.status(202).json({ status: 'running', message: 'Análise iniciada...' });

    } catch (error: any) {
        console.error(`Erro na rota obterAnaliseEnem para redação ${req.params.id}:`, error);
        return res.status(500).json({ erro: 'Erro ao obter análise ENEM.', detalhes: error.message });
    }
};

// POST /api/redacoes/reanalisar
export const reanalisarTexto = async (req: Request, res: Response) => {
    try {
        const { texto } = req.body;
        if (!texto || texto.trim().length < 50) return res.status(400).json({ erro: 'Texto inválido.' });

        // Mantendo a formatação nesta rota, conforme seu código original
        const textoFormatado = (await formatarTextoComLLM(texto)).textoFormatado;
        const analise = await analisarEnem(textoFormatado); // Usa a análise de alta precisão

        // Retornando no formato que o frontend espera para esta rota
        return res.json({ textoAnalisado: textoFormatado, analise: analise });
    } catch (e: any) {
        console.error('Erro ao reanalisar texto:', e);
        return res.status(500).json({ erro: 'Erro interno ao reanalisar.', detalhes: e.message });
    }
};

// GET /api/redacoes
export const listarRedacoes = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;
        let whereClause: any = {}; // Usar 'any' temporariamente para flexibilidade

        if (userRole === UserRole.ALUNO) {
            whereClause = { alunoId: userId };
        } else if (userRole === UserRole.PROFESSOR) {
            // Professor vê todas as redações associadas às suas turmas
            whereClause = { turma: { professorId: userId } };
        } else {
            return res.status(403).json({ erro: "Papel de usuário desconhecido." });
        }

        const redacoes = await prisma.redacao.findMany({
            where: whereClause,
            orderBy: { criadoEm: 'desc' },
            include: { // Incluir dados do aluno para exibição no frontend do professor
                usuario: { select: { nome: true } }, // Quem enviou
                aluno: { select: { nome: true, id: true } } // A quem pertence
            }
        });
        return res.json(redacoes);
    } catch (error) {
        console.error("Erro ao listar redações:", error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

// GET /api/redacoes/:id
export const obterRedacao = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        const redacao = await prisma.redacao.findUnique({
            where: { id },
            include: { turma: { select: { professorId: true } } }
        });

        if (!redacao) return res.status(404).json({ erro: "Redação não encontrada." });

        // VERIFICAÇÃO DE PERMISSÃO
        const isAlunoDono = userRole === UserRole.ALUNO && redacao.alunoId === userId;
        const isProfessorDaTurma = userRole === UserRole.PROFESSOR && redacao.turma?.professorId === userId;
        const isProfessorQueEnviou = userRole === UserRole.PROFESSOR && redacao.usuarioId === userId;

        if (!isAlunoDono && !isProfessorDaTurma && !isProfessorQueEnviou) {
            return res.status(403).json({ erro: 'Você não tem permissão.' });
        }

        return res.json(redacao);
    } catch (error) {
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

// PUT /api/redacoes/:id
export const atualizarRedacao = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Permite atualizar título ou nota final (pelo professor)
        const { titulo, notaFinal, textoExtraido } = req.body;
        const userId = req.userId;
        const userRole = req.userRole;

        const redacao = await prisma.redacao.findUnique({
            where: { id },
            include: { turma: { select: { professorId: true } } }
        });
        if (!redacao) return res.status(404).json({ erro: "Redação não encontrada." });

        const canEditTitle = redacao.usuarioId === userId || (userRole === UserRole.ALUNO && redacao.alunoId === userId);
        const canEditGrade = userRole === UserRole.PROFESSOR && redacao.turma?.professorId === userId;
        const canEditText = redacao.usuarioId === userId || (userRole === UserRole.ALUNO && redacao.alunoId === userId); // Permite editar o texto OCR se for o dono

        const dataToUpdate: any = {};
        if (titulo !== undefined && canEditTitle) dataToUpdate.titulo = titulo;
        if (notaFinal !== undefined && canEditGrade) dataToUpdate.notaFinal = Number(notaFinal);
        if (textoExtraido !== undefined && canEditText) {
            dataToUpdate.textoExtraido = textoExtraido;
            // Se o texto mudou, reseta a nota gerada e reinicia a análise
            dataToUpdate.notaGerada = null;
            dataToUpdate.notaFinal = null;
            analiseCache.delete(id);
            analiseJobs.delete(id);
            // Inicia nova análise em background após salvar
            setTimeout(() => iniciarAnaliseBackground(id, textoExtraido), 500);
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(403).json({ erro: "Nenhuma alteração permitida ou nenhum dado fornecido." });
        }

        const redacaoAtualizada = await prisma.redacao.update({
            where: { id },
            data: dataToUpdate
        });
        console.log(`✅ Redação ${id} atualizada.`);
        return res.json(redacaoAtualizada);
    } catch (error) {
        console.error("❌ Erro ao atualizar redação:", error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

// DELETE /api/redacoes/:id
export const excluirRedacao = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        const redacao = await prisma.redacao.findUnique({
            where: { id },
            include: { turma: { select: { professorId: true } } }
        });
        if (!redacao) return res.status(404).json({ erro: "Redação não encontrada." });

        const isAlunoDono = userRole === UserRole.ALUNO && redacao.alunoId === userId;
        const isProfessorDaTurma = userRole === UserRole.PROFESSOR && redacao.turma?.professorId === userId;

        if (!isAlunoDono && !isProfessorDaTurma) {
            return res.status(403).json({ erro: "Você não tem permissão para excluir." });
        }

        await prisma.redacao.delete({ where: { id } });
        analiseCache.delete(id);
        analiseJobs.delete(id);
        console.log(`🗑️ Redação ${id} excluída.`);
        return res.status(200).json({ mensagem: "Redação excluída com sucesso." });
    } catch (error) {
        console.error("❌ Erro ao excluir redação:", error);
        return res.status(500).json({ erro: "Ocorreu um erro ao excluir." });
    }
};

// --- NOVAS ROTAS PARA PROFESSOR ---

// GET /api/turmas/:id/redacoes
export const listarRedacoesDaTurma = async (req: Request, res: Response) => {
    try {
        const { id: turmaId } = req.params;
        const professorId = req.userId;

        const turma = await prisma.turma.findFirst({ where: { id: turmaId, professorId } });
        if (!turma) return res.status(404).json({ erro: "Turma não encontrada ou sem permissão." });

        const redacoes = await prisma.redacao.findMany({
            where: { turmaId },
            orderBy: { criadoEm: 'desc' },
            include: { aluno: { select: { nome: true, id: true } } }
        });
        return res.json(redacoes);
    } catch (error) {
        console.error(`Erro ao listar redações da turma ${req.params.id}:`, error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

// GET /api/turmas/:id/estatisticas
export const calcularEstatisticasTurma = async (req: Request, res: Response) => {
    try {
        const { id: turmaId } = req.params;
        const professorId = req.userId;

        const turma = await prisma.turma.findFirst({ where: { id: turmaId, professorId } });
        if (!turma) return res.status(404).json({ erro: "Turma não encontrada ou sem permissão." });

        const stats = await prisma.redacao.aggregate({
            _avg: { notaFinal: true },
            _count: { id: true },
            where: { turmaId, notaFinal: { not: null } }
        });

        const ultimasNotas = await prisma.redacao.findMany({
            where: { turmaId, notaFinal: { not: null } },
            orderBy: { criadoEm: 'desc' },
            take: 10, select: { notaFinal: true }
        });
        const mediaRecentes = ultimasNotas.length > 0
            ? ultimasNotas.reduce((sum, r) => sum + (r.notaFinal || 0), 0) / ultimasNotas.length
            : null;

        return res.json({
            mediaGeral: stats._avg.notaFinal,
            totalRedacoesComNota: stats._count.id,
            mediaUltimas10: mediaRecentes
        });
    } catch (error) {
        console.error(`Erro ao calcular estatísticas da turma ${req.params.id}:`, error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};