import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const listarRedacoes = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        
        const usuarioId = req.userId;
        const redacoes = await prisma.redacao.findMany({
            where: { usuarioId },
            include: { avaliacoes: true }
        });
        return res.json(redacoes);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao listar redações" });
    }
};

export const criarRedacao = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const { titulo, imagemUrl, textoExtraido } = req.body;

        const redacao = await prisma.redacao.create({
            data: {
                titulo,
                imagemUrl,
                textoExtraido,
                usuarioId: req.userId
            }
        });

        return res.status(201).json(redacao);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao criar redação" });
    }
};

export const avaliarRedacao = async (req: Request, res: Response) => {
    const { redacaoId } = req.params;
    const { competencias } = req.body; // array de { competencia, notaComp, comentario }

    await Promise.all(
        competencias.map(async (comp: any) => {
            await prisma.avaliacao.create({
                data: {
                    competencia: comp.competencia,
                    notaComp: comp.notaComp,
                    comentario: comp.comentario,
                    redacaoId
                }
            });
        })
    );

    res.json({ ok: true });
};
