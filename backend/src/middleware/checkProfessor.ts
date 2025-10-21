import { Request, Response, NextFunction } from "express";

export const isProfessor = (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
        return res.status(401).json({ erro: "Usuário não autenticado." });
    }

    if (req.userRole !== 'PROFESSOR') {
        return res.status(403).json({ erro: "Acesso negado. Rota restrita a professores." });
    }

    next();
    return;
};
