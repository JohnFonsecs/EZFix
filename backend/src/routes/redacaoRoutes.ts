import { Router } from "express";
import multer from 'multer';
import {
    listarRedacoes,
    obterRedacao,
    criarRedacao,
    atualizarRedacao,
    excluirRedacao,
    obterAnaliseEnem,
    reanalisarTexto,
    listarRedacoesDaTurma,
    calcularEstatisticasTurma
} from "../controllers/redacaoController";
import { autenticar } from "../middleware/auth";
import { authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Configuração do Multer (sem alterações)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- ROTAS GENÉRICAS DE REDAÇÃO (Alunos e Professores, com lógica interna) ---

/**
 * @route   POST /api/redacoes
 * @desc    ALUNO cria uma nova redação para si mesmo.
 * @access  Privado (Aluno)
 */
router.post("/", autenticar, upload.single('file'), criarRedacao);

/**
 * @route   GET /api/redacoes
 * @desc    Lista redações (Aluno vê as suas, Professor vê as das suas turmas).
 * @access  Privado (Aluno, Professor)
 */
router.get("/", autenticar, listarRedacoes);

/**
 * @route   POST /api/redacoes/reanalisar
 * @desc    Reanalisa um texto fornecido.
 * @access  Privado (Aluno, Professor)
 */
router.post("/reanalisar", autenticar, reanalisarTexto);

// --- ROTAS ESPECÍFICAS POR ID DA REDAÇÃO (Alunos e Professores, com verificação de permissão no controller) ---

/**
 * @route   GET /api/redacoes/:id
 * @desc    Obtém dados de uma redação específica.
 * @access  Privado (Dono ou Professor da Turma)
 */
router.get("/:id", autenticar, obterRedacao);

/**
 * @route   PUT /api/redacoes/:id
 * @desc    Atualiza título ou notaFinal de uma redação.
 * @access  Privado (Dono ou Professor da Turma para nota)
 */
router.put("/:id", autenticar, atualizarRedacao);

/**
 * @route   DELETE /api/redacoes/:id
 * @desc    Exclui uma redação específica.
 * @access  Privado (Dono ou Professor da Turma)
 */
router.delete("/:id", autenticar, excluirRedacao);

/**
 * @route   GET /api/redacoes/:id/analise-enem
 * @desc    Obtém a análise ENEM de uma redação.
 * @access  Privado (Dono ou Professor da Turma)
 */
router.get("/:id/analise-enem", autenticar, obterAnaliseEnem);


// --- NOVAS ROTAS ESPECÍFICAS PARA PROFESSORES ---

/**
 * @route   POST /api/alunos/:alunoId/redacoes
 * @desc    PROFESSOR cria uma nova redação para um aluno específico.
 * @access  Privado (Professor)
 */
router.post(
    "/alunos/:alunoId/redacoes",
    autenticar,
    authorize(UserRole.PROFESSOR), // Garante que só professores acessem
    upload.single('file'),
    criarRedacao // Reutiliza a função criarRedacao, que agora lê :alunoId
);

/**
 * @route   GET /api/turmas/:id/redacoes
 * @desc    PROFESSOR lista as redações de uma turma específica.
 * @access  Privado (Professor)
 */
router.get(
    "/turmas/:id/redacoes",
    autenticar,
    authorize(UserRole.PROFESSOR),
    listarRedacoesDaTurma
);

/**
 * @route   GET /api/turmas/:id/estatisticas
 * @desc    PROFESSOR obtém estatísticas (média de notas) de uma turma.
 * @access  Privado (Professor)
 */
router.get(
    "/turmas/:id/estatisticas",
    autenticar,
    authorize(UserRole.PROFESSOR),
    calcularEstatisticasTurma
);


export default router;