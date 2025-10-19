import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, UserRole } from "@prisma/client"; // Import PrismaClient e UserRole

const prisma = new PrismaClient(); // Instancia o Prisma Client

// Estendendo a interface Request do Express
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userRole?: UserRole; // A propriedade userRole que 'autenticar' preenche
        }
    }
}

// Middleware para verificar o token e anexar userId e userRole
export const autenticar = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ erro: "Token ausente" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto") as any;
        const userId = decoded.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!user) {
            return res.status(401).json({ erro: "Usuário associado ao token não encontrado." });
        }

        req.userId = userId;
        req.userRole = user.role; // Anexa o role encontrado

        return next();

    } catch (error) {
        console.error("Erro na autenticação:", error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ erro: "Token inválido" });
        }
        return res.status(500).json({ erro: "Erro interno durante a autenticação." });
    }
};

export const authorize = (requiredRole: UserRole): RequestHandler => {
    // MUDANÇA: Usando ': any' para os parâmetros para desligar a verificação de tipo aqui.
    return (req: any, res: any, next: any) => {
        if (!req.userRole || req.userRole !== requiredRole) {
            return res.status(403).json({ erro: 'Acesso negado. Permissão insuficiente.' });
        }
        next();
    };
};