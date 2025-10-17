import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "secreto";

export const register = async (req: Request, res: Response) => {
  try {
    const { nome, email, senha } = req.body;

    console.log('📝 Tentativa de registro:', { nome, email });

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      console.log('❌ Email já cadastrado:', email);
      return res.status(400).json({ erro: "Usuário já existe." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: { nome, email, senhaHash },
    });

    console.log('✅ Usuário criado com sucesso:', email);
    return res.json({ id: user.id, nome: user.nome, email: user.email });
  } catch (error) {
    console.error('💥 Erro no registro:', error);
    return res.status(500).json({ erro: "Ocorreu um erro no servidor." });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    console.log('🔐 Tentativa de login:', { email });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) {
      console.log('❌ Senha inválida para:', email);
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    console.log('✅ Login bem-sucedido:', email);
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
