import { Router } from "express";
import { autenticar } from "../middleware/auth";
import { isProfessor } from "../middleware/checkProfessor";
import {
    criarTurma,
    adicionarAluno,
    listarTurmasProfessor,
    listarRedacoesDaTurma,
    listarAlunosDaTurma,
    listarTurmasAluno
} from "../controllers/turmaController";

const router = Router();

// Todas as rotas aqui são privadas e exigem autenticação
router.use(autenticar);

// --- Rotas de Professor ---
router.post("/", isProfessor, criarTurma);
router.post("/matricular", isProfessor, adicionarAluno);
router.get("/professor", isProfessor, listarTurmasProfessor);

// --- Rota do Aluno ---
// Coloque a rota específica "/aluno" ANTES de rotas genéricas com parâmetros.
router.get("/aluno", listarTurmasAluno);

// --- Rotas de Professor (com parâmetros) ---
// (Estas devem vir DEPOIS de rotas específicas como "/aluno")
router.get("/:turmaId/redacoes", isProfessor, listarRedacoesDaTurma);
router.get("/:turmaId/alunos", isProfessor, listarAlunosDaTurma);


export default router;