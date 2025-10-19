-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ALUNO', 'PROFESSOR');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ALUNO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Turma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Matricula" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Redacao" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "imagemUrl" TEXT NOT NULL,
    "textoExtraido" TEXT,
    "notaGerada" DOUBLE PRECISION,
    "notaFinal" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "alunoId" TEXT,
    "turmaId" TEXT,

    CONSTRAINT "Redacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Avaliacao" (
    "id" TEXT NOT NULL,
    "competencia" INTEGER NOT NULL,
    "notaComp" DOUBLE PRECISION NOT NULL,
    "comentario" TEXT,
    "redacaoId" TEXT NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_alunoId_turmaId_key" ON "public"."Matricula"("alunoId", "turmaId");

-- AddForeignKey
ALTER TABLE "public"."Turma" ADD CONSTRAINT "Turma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Matricula" ADD CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Matricula" ADD CONSTRAINT "Matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "public"."Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Redacao" ADD CONSTRAINT "Redacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Redacao" ADD CONSTRAINT "Redacao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Redacao" ADD CONSTRAINT "Redacao_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "public"."Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Avaliacao" ADD CONSTRAINT "Avaliacao_redacaoId_fkey" FOREIGN KEY ("redacaoId") REFERENCES "public"."Redacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
