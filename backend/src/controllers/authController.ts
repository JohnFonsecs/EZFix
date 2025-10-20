import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "secreto";

export const register = async (req: Request, res: Response) => {
  try {
    const { nome, email, senha } = req.body;

    console.log('📝 Tentativa de registro:', { nome, email: email ? '[REDACTED]' : undefined });

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      console.log('❌ Email já cadastrado');
      return res.status(400).json({ erro: "Usuário já existe." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: { nome, email, senhaHash },
    });

    console.log('✅ Usuário criado com sucesso');
    return res.json({ id: user.id, nome: user.nome, email: user.email });
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
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1d" });
    return res.json({ 
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
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
    const userId = (req as any).userId; // Vem do middleware de autenticação

    console.log('🔄 Tentativa de alterar senha');

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: "Senha atual e nova senha são obrigatórias." });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ erro: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log('❌ Usuário não encontrado');
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
