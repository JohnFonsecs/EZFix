// turmaController.ts

import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Rota: POST /api/turmas
export const criarTurma = async (req: Request, res: Response) => {
    const { nome } = req.body;
    const professorId = req.userId; // Vem do middleware 'autenticar'

    if (!nome) {
        return res.status(400).json({ erro: "O nome da turma é obrigatório." });
    }

    try {
        const turma = await prisma.turma.create({
            data: {
                nome,
                professorId: professorId!,
            },
        });
        return res.status(201).json(turma);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao criar turma." });
    }
};

// Rota: POST /api/turmas/matricular
export const adicionarAluno = async (req: Request, res: Response) => {
    const { turmaId, emailAluno } = req.body;
    const professorId = req.userId;

    try {
        // 1. Verificar se o professor é dono da turma
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professorId: professorId },
        });
        if (!turma) {
            return res.status(403).json({ erro: "Você não tem permissão para adicionar alunos a esta turma." });
        }

        // 2. Encontrar o aluno pelo email
        const aluno = await prisma.user.findUnique({
            where: { email: emailAluno, role: 'ALUNO' },
        });
        if (!aluno) {
            return res.status(404).json({ erro: "Aluno não encontrado ou não é um aluno." });
        }

        // 3. Matricular o aluno
        const matricula = await prisma.matricula.create({
            data: {
                alunoId: aluno.id,
                turmaId: turma.id,
            },
        });

        return res.status(201).json(matricula);
    } catch (error: any) {
        if (error.code === 'P2002') { // Erro de constraint única (aluno já matriculado)
            return res.status(400).json({ erro: "Aluno já matriculado nesta turma." });
        }
        return res.status(500).json({ erro: "Erro ao matricular aluno." });
    }
};

// Rota: GET /api/turmas/professor
export const listarTurmasProfessor = async (req: Request, res: Response) => {
    const professorId = req.userId;
    try {
        const turmas = await prisma.turma.findMany({
            where: { professorId: professorId },
            include: {
                _count: { select: { matriculas: true } } // Conta quantos alunos
            }
        });
        return res.json(turmas);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao listar turmas." });
    }
};

export const listarTurmasAluno = async (req: Request, res: Response) => {
    const alunoId = req.userId;
    try {
        const matriculas = await prisma.matricula.findMany({
            where: { alunoId: alunoId },
            include: {
                turma: true // Inclui os dados da turma em cada matrícula
            }
        });
        // Retorna apenas a lista de turmas
        const turmas = matriculas.map(m => m.turma);
        return res.json(turmas);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao listar turmas do aluno." });
    }
};

export const listarRedacoesDaTurma = async (req: Request, res: Response) => {
    const { turmaId } = req.params;
    const professorId = req.userId;

    try {
        // Verificar se o professor é dono da turma
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professorId: professorId }
        });
        if (!turma) return res.status(403).json({ erro: "Turma não encontrada ou você não tem permissão." });

        const redacoes = await prisma.redacao.findMany({
            where: { turmaId: turmaId },
            include: { aluno: { select: { nome: true, email: true } } } // Inclui nome do aluno
        });
        return res.json(redacoes);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao listar redações." });
    }
};

// Rota: GET /api/turmas/:turmaId/alunos
export const listarAlunosDaTurma = async (req: Request, res: Response) => {
    const { turmaId } = req.params;
    const professorId = req.userId;
    try {
        // Verificar se o professor é dono da turma
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professorId: professorId }
        });
        if (!turma) return res.status(403).json({ erro: "Turma não encontrada ou você não tem permissão." });

        const matriculas = await prisma.matricula.findMany({
            where: { turmaId: turmaId },
            include: { aluno: { select: { id: true, nome: true, email: true } } }
        });
        const alunos = matriculas.map(m => m.aluno);
        return res.json(alunos);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao listar alunos." });
    }
};