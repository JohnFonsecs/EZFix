import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "secreto";

export const register = async (req: Request, res: Response) => {
    try {
        // MUDANÇA: 'role' agora é pego do corpo da requisição
        const { nome, email, senha, role } = req.body;

        console.log('📝 Tentativa de registro:', { nome, email: email ? '[REDACTED]' : undefined, role });

        const existente = await prisma.user.findUnique({ where: { email } });
        if (existente) {
            console.log('❌ Email já cadastrado');
            return res.status(400).json({ erro: "Usuário já existe." });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const user = await prisma.user.create({
            data: {
                nome,
                email,
                senhaHash,
                // MUDANÇA: Salva o 'role' fornecido, ou usa ALUNO como padrão
                role: role === UserRole.PROFESSOR ? UserRole.PROFESSOR : UserRole.ALUNO
            },
        });

        console.log(`✅ Usuário ${user.role} criado com sucesso`);
        return res.status(201).json({ id: user.id, nome: user.nome, email: user.email, role: user.role });
    } catch (error) {
        console.error('💥 Erro no registro:', error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, senha } = req.body;
        console.log('🔐 Tentativa de login');
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('❌ Usuário não encontrado');
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }

        const senhaValida = await bcrypt.compare(senha, user.senhaHash);
        if (!senhaValida) {
            console.log('❌ Senha inválida');
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }

        console.log('✅ Login bem-sucedido');
        const tokenPayload = {
            userId: user.id,
            userRole: user.role
        };
        const token = jwt.sign(tokenPayload, SECRET, { expiresIn: "1d" });

        return res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                criadoEm: user.criadoEm
            }
        });
    } catch (error) {
        console.error('💥 Erro no login:', error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { senhaAtual, novaSenha } = req.body;
        // Pega o userId anexado pelo middleware 'autenticar'
        const userId = req.userId;

        console.log('🔄 Tentativa de alterar senha');

        if (!userId) {
            // Isso não deveria acontecer se o middleware 'autenticar' estiver funcionando
            return res.status(401).json({ erro: "Usuário não autenticado corretamente." });
        }
        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ erro: "Senha atual e nova senha são obrigatórias." });
        }
        if (novaSenha.length < 6) {
            return res.status(400).json({ erro: "A nova senha deve ter pelo menos 6 caracteres." });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.log('❌ Usuário não encontrado para alteração de senha');
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        const senhaValida = await bcrypt.compare(senhaAtual, user.senhaHash);
        if (!senhaValida) {
            console.log('❌ Senha atual incorreta');
            return res.status(401).json({ erro: "Senha atual incorreta." });
        }

        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { senhaHash: novaSenhaHash }
        });

        console.log('✅ Senha alterada com sucesso');
        return res.json({ mensagem: "Senha alterada com sucesso." });
    } catch (error) {
        console.error('💥 Erro ao alterar senha:', error);
        return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
    }
};