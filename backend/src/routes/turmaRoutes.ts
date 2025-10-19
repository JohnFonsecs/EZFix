import { Router } from "express";
import {
    criarTurma,
    listarMinhasTurmas,
    obterDetalhesTurma,
    adicionarAlunoNaTurma,
    removerAlunoDaTurma,
    excluirTurma
} from "../controllers/turmaController"; // Importa as funções do controller
import { autenticar } from "../middleware/auth"; // Importa o middleware de autenticação
import { authorize } from "../middleware/auth"; // Importa o middleware de autorização
import { UserRole } from "@prisma/client"; // Importa o Enum UserRole

const router = Router();

// APLICAR MIDDLEWARES A TODAS AS ROTAS DESTE ARQUIVO
// 1. Verifica se o usuário está logado (autenticar)
// 2. Verifica se o usuário logado tem o papel de PROFESSOR (authorize)
router.use(autenticar);
router.use(authorize(UserRole.PROFESSOR));

// --- ROTAS PARA GERENCIAMENTO DE TURMAS ---

// POST /api/turmas - Criar nova turma
router.post("/", criarTurma);

// GET /api/turmas - Listar turmas do professor logado
router.get("/", listarMinhasTurmas);

// GET /api/turmas/:id - Obter detalhes de uma turma (incluindo alunos)
router.get("/:id", obterDetalhesTurma);

// DELETE /api/turmas/:id - Excluir uma turma
router.delete("/:id", excluirTurma);

// --- ROTAS PARA GERENCIAMENTO DE ALUNOS NA TURMA ---

// POST /api/turmas/:id/alunos - Adicionar aluno (por email no body)
router.post("/:id/alunos", adicionarAlunoNaTurma);

// DELETE /api/turmas/:id/alunos/:alunoId - Remover aluno da turma
router.delete("/:id/alunos/:alunoId", removerAlunoDaTurma);

export default router;