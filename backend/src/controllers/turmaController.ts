import { PrismaClient, UserRole } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Criar uma nova turma (Apenas Professores)
export const criarTurma = async (req: Request, res: Response) => {
    try {
        const { nome } = req.body;
        const professorId = req.userId; // Vem do middleware 'autenticar'

        if (!nome) {
            return res.status(400).json({ erro: "O nome da turma é obrigatório." });
        }
        if (!professorId) {
            return res.status(401).json({ erro: "Professor não autenticado corretamente." });
        }

        const novaTurma = await prisma.turma.create({
            data: {
                nome,
                professorId: professorId,
            }
        });
        console.log(` Turma "${nome}" criada pelo professor ${professorId}`);
        return res.status(201).json(novaTurma);
    } catch (error) {
        console.error(" Erro ao criar turma:", error);
        return res.status(500).json({ erro: "Erro interno ao criar turma." });
    }
};

// Listar as turmas do professor logado (Apenas Professores)
export const listarMinhasTurmas = async (req: Request, res: Response) => {
    try {
        const professorId = req.userId;
        if (!professorId) {
            return res.status(401).json({ erro: "Professor não autenticado corretamente." });
        }

        const turmas = await prisma.turma.findMany({
            where: { professorId: professorId },
            orderBy: { nome: 'asc' },
            // Opcional: Contar alunos em cada turma
            include: {
                _count: {
                    select: { matriculas: true }
                }
            }
        });
        return res.json(turmas);
    } catch (error) {
        console.error(" Erro ao listar turmas:", error);
        return res.status(500).json({ erro: "Erro interno ao listar turmas." });
    }
};

// Obter detalhes de uma turma específica (Apenas Professor dono da turma)
export const obterDetalhesTurma = async (req: Request, res: Response) => {
    try {
        const { id: turmaId } = req.params;
        const professorId = req.userId;
        if (!professorId) return res.status(401).json({ erro: "Professor não autenticado." });

        const turma = await prisma.turma.findFirst({
            where: {
                id: turmaId,
                professorId: professorId // Garante que só o professor dono veja
            },
            include: {
                // Inclui a lista de matrículas e os dados dos alunos matriculados
                matriculas: {
                    orderBy: { aluno: { nome: 'asc' } },
                    include: {
                        aluno: {
                            select: { id: true, nome: true, email: true } // Seleciona apenas dados não sensíveis do aluno
                        }
                    }
                }
            }
        });

        if (!turma) {
            return res.status(404).json({ erro: "Turma não encontrada ou você não tem permissão." });
        }
        return res.json(turma);
    } catch (error) {
        console.error(" Erro ao obter detalhes da turma:", error);
        return res.status(500).json({ erro: "Erro interno ao obter detalhes da turma." });
    }
};

// Adicionar um aluno a uma turma (Apenas Professor dono da turma)
export const adicionarAlunoNaTurma = async (req: Request, res: Response) => {
    try {
        const { id: turmaId } = req.params;
        const { alunoEmail } = req.body; // Assume que o professor adiciona pelo email
        const professorId = req.userId;
        if (!professorId) return res.status(401).json({ erro: "Professor não autenticado." });
        if (!alunoEmail) return res.status(400).json({ erro: "Email do aluno é obrigatório." });

        // 1. Verificar se a turma pertence ao professor
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professorId: professorId }
        });
        if (!turma) {
            return res.status(404).json({ erro: "Turma não encontrada ou você não tem permissão." });
        }

        // 2. Encontrar o aluno pelo email
        const aluno = await prisma.user.findUnique({
            where: { email: alunoEmail }
        });
        if (!aluno) {
            return res.status(404).json({ erro: `Aluno com email "${alunoEmail}" não encontrado.` });
        }
        // Opcional: Verificar se o usuário encontrado é realmente um ALUNO
        if (aluno.role !== UserRole.ALUNO) {
            return res.status(400).json({ erro: `O usuário com email "${alunoEmail}" não é um aluno.` });
        }

        // 3. Criar a matrícula (o @@unique no schema impede duplicados)
        const matricula = await prisma.matricula.create({
            data: {
                alunoId: aluno.id,
                turmaId: turmaId,
            },
            include: { // Retorna os dados do aluno para atualizar a UI
                aluno: { select: { id: true, nome: true, email: true } }
            }
        });
        console.log(` Aluno ${aluno.id} adicionado à turma ${turmaId}`);
        return res.status(201).json(matricula);

    } catch (error: any) {
        // Código P2002 indica violação de constraint unique (aluno já matriculado)
        if (error.code === 'P2002') {
            return res.status(409).json({ erro: "Este aluno já está matriculado nesta turma." });
        }
        console.error(" Erro ao adicionar aluno:", error);
        return res.status(500).json({ erro: "Erro interno ao adicionar aluno." });
    }
};

// Remover um aluno de uma turma (Apenas Professor dono da turma)
export const removerAlunoDaTurma = async (req: Request, res: Response) => {
    try {
        const { id: turmaId, alunoId } = req.params; // Pega ambos da URL
        const professorId = req.userId;
        if (!professorId) return res.status(401).json({ erro: "Professor não autenticado." });

        // 1. Verificar se a turma pertence ao professor (segurança extra)
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professorId: professorId }
        });
        if (!turma) {
            return res.status(404).json({ erro: "Turma não encontrada ou você não tem permissão." });
        }

        // 2. Tentar deletar a matrícula
        const result = await prisma.matricula.deleteMany({
            where: {
                turmaId: turmaId,
                alunoId: alunoId,
            }
        });

        if (result.count === 0) {
            return res.status(404).json({ erro: "Matrícula não encontrada para este aluno nesta turma." });
        }

        console.log(` Aluno ${alunoId} removido da turma ${turmaId}`);
        return res.status(200).json({ mensagem: "Aluno removido com sucesso." });

    } catch (error) {
        console.error(" Erro ao remover aluno:", error);
        return res.status(500).json({ erro: "Erro interno ao remover aluno." });
    }
};

// Excluir uma turma (Apenas Professor dono da turma)
export const excluirTurma = async (req: Request, res: Response) => {
    try {
        const { id: turmaId } = req.params;
        const professorId = req.userId;
        if (!professorId) return res.status(401).json({ erro: "Professor não autenticado." });

        // Usar deleteMany para garantir que só o professor dono possa excluir
        const result = await prisma.turma.deleteMany({
            where: {
                id: turmaId,
                professorId: professorId
            }
        });

        if (result.count === 0) {
            return res.status(404).json({ erro: "Turma não encontrada ou você não tem permissão para excluí-la." });
        }

        // Importante: A exclusão da turma pode precisar lidar com redações órfãs
        // ou matrículas órfãs, dependendo da sua regra no schema (onDelete).
        // Se não houver onDelete Cascade, você precisaria excluir matrículas/redações manualmente antes.

        console.log(` Turma ${turmaId} excluída pelo professor ${professorId}`);
        return res.status(200).json({ mensagem: "Turma excluída com sucesso." });
    } catch (error: any) {
        // Se houver redações/matrículas vinculadas e não houver cascade delete, dará erro P2014
        if (error.code === 'P2014' || error.message.includes('constraint')) {
            return res.status(400).json({ erro: "Não é possível excluir a turma. Remova todos os alunos e redações associadas primeiro." });
        }
        console.error(" Erro ao excluir turma:", error);
        return res.status(500).json({ erro: "Erro interno ao excluir turma." });
    }
};