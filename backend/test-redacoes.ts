import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verificarRedacoes() {
  try {
    const count = await prisma.redacao.count();
    console.log('✅ Total de redações no banco:', count);
    
    if (count > 0) {
      const redacoes = await prisma.redacao.findMany({ 
        take: 5, 
        orderBy: { criadoEm: 'desc' },
        include: { 
          aluno: { select: { nome: true, id: true } },
          usuario: { select: { nome: true } }
        } 
      });
      console.log('\n📝 Últimas 5 redações:');
      redacoes.forEach((r, i) => {
        console.log(`\n${i+1}. ${r.titulo}`);
        console.log(`   ID: ${r.id}`);
        console.log(`   Aluno ID: ${r.alunoId}`);
        console.log(`   Aluno Nome: ${r.aluno?.nome || 'N/A'}`);
        console.log(`   Usuario ID (quem enviou): ${r.usuarioId}`);
        console.log(`   Usuario Nome: ${r.usuario?.nome || 'N/A'}`);
        console.log(`   Criado em: ${r.criadoEm}`);
      });
    } else {
      console.log('\n⚠️  Não há redações no banco de dados.');
    }
    
    const users = await prisma.user.findMany({ select: { id: true, nome: true, email: true, role: true } });
    console.log('\n👥 Usuários cadastrados:');
    users.forEach(u => {
      console.log(`   - ${u.nome} (${u.email}) - ${u.role} [ID: ${u.id}]`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarRedacoes();
