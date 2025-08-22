import { Router } from "express";
import { autenticar } from "../middleware/auth";
import {
    listarRedacoes,
    obterRedacao,
    criarRedacao,
    atualizarRedacao,
    deletarRedacao,
    avaliarRedacao,
} from "../controllers/redacaoController";

const router = Router();

router.use(autenticar);

// CRUD de reda��es
router.get("/", listarRedacoes);
router.get("/:id", obterRedacao);
router.post("/", criarRedacao);
router.put("/:id", atualizarRedacao);
router.delete("/:id", deletarRedacao);

// Avalia��o de reda��o
router.post("/:redacaoId/avaliar", avaliarRedacao);

export default router;
