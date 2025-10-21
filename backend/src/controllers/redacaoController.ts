import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { extrairTextoDaImagem } from "../services/ocrService";
import { analisarEnem, formatarTextoComLLM, AnaliseENEM } from "../services/ennAnalysisService";
import { corrigirTextoOCR } from "../services/openaiService";

const prisma = new PrismaClient();
type AnaliseJob = { promise: Promise<any>; startedAt: number };
const analiseJobs = new Map<string, AnaliseJob>();
// O cache armazena a análise pura
const analiseCache = new Map<string, { data: AnaliseENEM; cachedAt: number }>();
const ANALISE_TTL_MS = 10 * 60 * 1000;

// --- Endpoints do Controller ---

export const criarRedacao = async (req: Request, res: Response) => {
    try {
        const { titulo, turmaId } = req.body;
        const file = req.file as Express.Multer.File | undefined;
        const imagemUrl = file ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : req.body.imagemUrl;
        const usuarioId = req.userId;

        const userRole = req.userRole;

        if (!usuarioId) return res.status(401).json({ erro: "Usuário não autenticado." });
        if (!titulo || !imagemUrl) return res.status(400).json({ erro: "Título e imagem são obrigatórios." });

        const data: any = {
            titulo,
            imagemUrl,
            usuarioId: usuarioId
        };

        if (userRole === 'ALUNO' && turmaId) {
            console.log(`Aluno ${usuarioId} tentando enviar para turma ${turmaId}`);
            const matricula = await prisma.matricula.findFirst({
                where: { alunoId: usuarioId, turmaId: turmaId }
            });

            if (!matricula) {
                console.warn(`Acesso negado: Aluno ${usuarioId} não matriculado na turma ${turmaId}.`);
                return res.status(403).json({ erro: "Você não está matriculado nesta turma." });
            }
            data.alunoId = usuarioId;
            data.turmaId = turmaId;
        }
        console.log("🔍 Iniciando extração de texto com OCR...");
        const ocrResult = await extrairTextoDaImagem(imagemUrl);

        if (!ocrResult.text || ocrResult.text.trim().length < 50) {
            return res.status(400).json({
                erro: "Não foi possível extrair texto suficiente da imagem.",
                ocrResult,
            });
        }

        console.log("🤖 Iniciando correção automática com GPT...");
        const textoCorrigido = await corrigirTextoOCR(ocrResult.text);

        data.textoExtraido = textoCorrigido;

        console.log("💾 Salvando redação no banco de dados...");
        const redacao = await prisma.redacao.create({
            data: data,
        });

        console.log(`✅ Redação ${redacao.id} criada com sucesso!`);
        console.log("⚡ Iniciando análise ENEM automática...");
        setTimeout(async () => {
            try {
                const analiseEnem = await analisarEnem(textoCorrigido);
                await prisma.redacao.update({
                    where: { id: redacao.id },
                    data: {
                        notaGerada: analiseEnem.notaFinal1000,
                        notaFinal: analiseEnem.notaFinal1000
                    }
                });
                console.log(`📊 Análise da redação ${redacao.id} concluída: ${analiseEnem.notaFinal1000}/1000`);
            } catch (analyzeError) {
                console.error(`❌ Erro na análise automática da redação ${redacao.id}:`, analyzeError);
            }
        }, 1000);

        return res.status(201).json({
            ...redacao,
            ocr: {
                ...ocrResult,
                text: textoCorrigido,
                originalText: ocrResult.text,
                corrected: true
            }
        });

    } catch (error: any) {
        console.error("❌ Erro ao criar redação:", error);
        if (error.message.includes('PayloadTooLargeError')) {
            return res.status(413).json({ erro: "Imagem muito grande. Limite de 10MB." });
        }
        return res.status(500).json({ erro: "Erro interno do servidor.", detalhes: error.message });
    }
};

export const obterAnaliseEnem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const redacao = await prisma.redacao.findFirst({ where: { id, usuarioId: req.userId } });
        if (!redacao) return res.status(404).json({ erro: 'Redação não encontrada.' });

        const cacheEntry = analiseCache.get(id);
        if (cacheEntry) {
            return res.status(200).json({ status: 'completed', analise: cacheEntry.data });
        }
        if (analiseJobs.has(id)) {
            return res.status(202).json({ status: 'running', message: 'Análise em processamento...' });
        }

        const jobPromise = (async (): Promise<AnaliseENEM> => {
            // Lógica simplificada e correta: usa o texto direto do OCR
            const textoParaAnalise = redacao.textoExtraido || '';
            const analiseEnem = await analisarEnem(textoParaAnalise);

            try {
                const notaFinal = analiseEnem.notaFinal1000;
                if (notaFinal >= 0) {
                    await prisma.redacao.update({ where: { id: redacao.id }, data: { notaGerada: notaFinal } });
                }
            } catch (error: any) { /* ... */ }

            analiseCache.set(id, { data: analiseEnem, cachedAt: Date.now() });
            return analiseEnem;
        })();

        analiseJobs.set(id, { promise: jobPromise, startedAt: Date.now() });
        jobPromise.catch(err => {
            console.error(`[ERRO NO JOB] A análise para a redação ${id} falhou:`, err.message);
        }).finally(() => {
            analiseJobs.delete(id);
        });

        return res.status(202).json({ status: 'running', message: 'Análise iniciada...' });
    } catch (error: any) {
        console.error(`Erro na rota obterAnaliseEnem para redação ${req.params.id}:`, error);
        return res.status(500).json({ erro: 'Erro ao processar análise ENEM.', detalhes: error.message });
    }
};

export const reanalisarTexto = async (req: Request, res: Response) => {
    try {
        const { texto } = req.body;
        if (!texto || texto.trim().length < 50) return res.status(400).json({ erro: 'Texto inválido.' });

        // Esta rota continua usando a formatação, e agora funciona
        const textoFormatado = (await formatarTextoComLLM(texto)).textoFormatado;
        const analise = await analisarEnem(textoFormatado);

        // Retornando no formato correto que o frontend espera
        return res.json({ textoAnalisado: textoFormatado, analise: analise });
    } catch (e: any) {
        console.error('Erro ao reanalisar texto:', e);
        return res.status(500).json({ erro: 'Erro interno ao reanalisar.', detalhes: e.message });
    }
};

export const listarRedacoes = async (req: Request, res: Response) => {
    try {
        const redacoes = await prisma.redacao.findMany({
            where: { usuarioId: req.userId },
            orderBy: { criadoEm: 'desc' }, // Requer o campo 'createdAt' no schema.prisma
        });
        return res.json(redacoes);
    } catch (error) {
        console.error("Erro ao listar redações:", error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

export const obterRedacao = async (req: Request, res: Response) => {
    try {
        const redacao = await prisma.redacao.findFirst({
            where: { id: req.params.id, usuarioId: req.userId },
        });
        return redacao ? res.json(redacao) : res.status(404).json({ erro: "Redação não encontrada." });
    } catch (error) {
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

export const atualizarRedacao = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { textoExtraido, titulo } = req.body;

        console.log(`📝 Atualizando redação ${id}...`);

        const redacao = await prisma.redacao.findFirst({
            where: { id, usuarioId: req.userId },
        });
        
        if (!redacao) {
            return res.status(404).json({ erro: "Redação não encontrada." });
        }

        // Se o texto foi atualizado, limpar cache e iniciar nova análise
        if (textoExtraido !== undefined && textoExtraido !== redacao.textoExtraido) {
            console.log(`✏️ Texto da redação ${id} foi editado. Limpando análise antiga...`);
            
            // Limpar cache e jobs de análise antiga
            analiseCache.delete(id);
            analiseJobs.delete(id);

            // Atualizar com o novo texto e resetar notas
            const redacaoAtualizada = await prisma.redacao.update({
                where: { id },
                data: {
                    textoExtraido,
                    titulo: titulo || redacao.titulo,
                    notaGerada: null,
                    notaFinal: null
                }
            });

            // Iniciar nova análise automática em background
            console.log("⚡ Iniciando análise ENEM do texto editado...");
            setTimeout(async () => {
                try {
                    const analiseEnem = await analisarEnem(textoExtraido);
                    await prisma.redacao.update({
                        where: { id },
                        data: { 
                            notaGerada: analiseEnem.notaFinal1000,
                            notaFinal: analiseEnem.notaFinal1000 
                        }
                    });
                    
                    // Adicionar ao cache
                    analiseCache.set(id, { data: analiseEnem, cachedAt: Date.now() });
                    
                    console.log(`✅ Análise do texto editado concluída: ${analiseEnem.notaFinal1000}/1000`);
                } catch (analyzeError) {
                    console.error(`❌ Erro na análise do texto editado:`, analyzeError);
                }
            }, 1000);

            return res.json(redacaoAtualizada);
        }

        // Se apenas o título foi atualizado
        const redacaoAtualizada = await prisma.redacao.update({
            where: { id },
            data: { titulo: titulo || redacao.titulo }
        });

        return res.json(redacaoAtualizada);
    } catch (error) {
        console.error("❌ Erro ao atualizar redação:", error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

export const excluirRedacao = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.warn(`[LOG-SISTEMA] ATENÇÃO: Recebida requisição para EXCLUIR a redação ${id}.`);

        const redacao = await prisma.redacao.findFirst({ where: { id, usuarioId: req.userId } });
        if (!redacao) return res.status(404).json({ erro: "Redação não encontrada para exclusão." });

        await prisma.redacao.delete({ where: { id } });
        analiseCache.delete(id);
        analiseJobs.delete(id);

        return res.status(200).json({ mensagem: "Redação excluída com sucesso." });
    } catch (error) {
        return res.status(500).json({ erro: "Ocorreu um erro ao excluir a redação." });
    }
};