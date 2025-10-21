import { Router } from "express";
import redacaoRoutes from "./redacaoRoutes";
import avaliacaoRoutes from "./avaliacaoRoutes";
import turmaRoutes from "./turmaRoutes";

const router = Router();

// Rotas de Redações
router.use("/redacoes", redacaoRoutes);

// Rotas de Avaliações (aninhadas em Redações)
router.use("/redacoes", avaliacaoRoutes);

// Rotas de Turmas
router.use("/turmas", turmaRoutes)

export default router;
