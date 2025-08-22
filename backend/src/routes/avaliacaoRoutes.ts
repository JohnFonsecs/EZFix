import { Router } from "express";
import {
    criarAvaliacao,
    listarAvaliacoes,
    atualizarAvaliacao,
    deletarAvaliacao,
} from "../controllers/avaliacaoController";

const router = Router();

/**
 * Rotas de Avalia��es
 */

// Criar uma avalia��o
router.post("/", criarAvaliacao);

// Listar todas avalia��es de uma reda��o
router.get("/:redacaoId", listarAvaliacoes);

// Atualizar uma avalia��o pelo ID
router.put("/:id", atualizarAvaliacao);

// Deletar uma avalia��o pelo ID
router.delete("/:id", deletarAvaliacao);

export default router;
