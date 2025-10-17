# ✏️ Funcionalidade: Editar Texto Antes da Análise

## 🎯 Objetivo

Permitir que o usuário **edite o texto extraído por OCR** antes de enviá-lo para análise de correção ENEM, possibilitando correções manuais de erros de reconhecimento ou ajustes no conteúdo.

---

## 🚀 Como Funciona

### 1️⃣ **Fluxo do Usuário**

```
1. Upload da imagem ➜ OCR extrai texto
2. Usuário visualiza o texto extraído
3. Clica em "✏️ Editar Texto"
4. Faz as correções necessárias
5. Clica em "💾 Salvar e Reanalisar"
6. Sistema atualiza o texto e reanalisa automaticamente
```

### 2️⃣ **Interface**

#### **Modo Visualização** 👁️

```
┌─────────────────────────────────────┐
│ 📄 Texto Extraído pela IA           │
├─────────────────────────────────────┤
│ Estatísticas:                       │
│ 450 palavras | 28 parágrafos       │
├─────────────────────────────────────┤
│ [Texto extraído em pré-formatado]   │
│                                     │
├─────────────────────────────────────┤
│          [✏️ Editar Texto] [Fechar] │
└─────────────────────────────────────┘
```

#### **Modo Edição** ✏️

```
┌─────────────────────────────────────┐
│ ✏️ Editando Texto                   │
├─────────────────────────────────────┤
│ Estatísticas atualizadas em tempo real│
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Textarea editável]             │ │
│ │ O usuário pode digitar aqui...  │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│  [Cancelar] [💾 Salvar e Reanalisar]│
└─────────────────────────────────────┘
```

---

## 💻 Implementação

### **Frontend**

#### **1. Componente VisualizarTexto.tsx**

**Estados adicionados:**

```typescript
const [isEditing, setIsEditing] = useState(false);
const [editedText, setEditedText] = useState("");
const [isSaving, setIsSaving] = useState(false);
```

**Props atualizadas:**

```typescript
interface VisualizarTextoProps {
  isVisible: boolean;
  onClose: () => void;
  redacao: Redacao | null;
  onSave?: (redacaoId: string, novoTexto: string) => Promise<void>; // Nova!
}
```

**Funcionalidades:**

- ✅ Botão "Editar Texto" ativa modo de edição
- ✅ Textarea com o texto completo para edição
- ✅ Estatísticas (palavras, parágrafos, caracteres) atualizam em tempo real
- ✅ Header muda de cor (azul → roxo) no modo edição
- ✅ Botões "Cancelar" e "Salvar e Reanalisar"
- ✅ Desabilita salvamento se texto vazio
- ✅ Feedback visual durante salvamento

#### **2. Dashboard.tsx**

**Função de callback para salvar:**

```typescript
onSave={async (redacaoId: string, novoTexto: string) => {
    try {
        // Atualizar o texto no backend
        await redacaoService.updateTexto(redacaoId, novoTexto);

        // Recarregar a lista de redações
        await loadRedacoes();

        // Mostrar mensagem de sucesso
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
        console.error('Erro ao atualizar texto:', error);
        throw error;
    }
}}
```

#### **3. Serviço de API (api.ts)**

**Nova função:**

```typescript
updateTexto: async (id: string, textoExtraido: string): Promise<Redacao> => {
  const response = await api.put(`/redacoes/${id}`, { textoExtraido });
  return response.data;
};
```

---

### **Backend**

#### **1. Controller (redacaoController.ts)**

**Nova função `atualizarRedacao`:**

```typescript
export const atualizarRedacao = async (req: Request, res: Response) => {
  // 1. Busca a redação
  // 2. Se texto foi alterado:
  //    - Limpa cache de análise antiga
  //    - Atualiza com novo texto
  //    - Reseta notas (notaGerada, notaFinal = null)
  //    - Inicia nova análise ENEM em background
  // 3. Retorna redação atualizada
};
```

**Características:**

- ✅ Valida que a redação pertence ao usuário
- ✅ Detecta se o texto foi alterado
- ✅ Limpa cache e jobs de análise antiga
- ✅ Reseta notas para forçar nova análise
- ✅ Análise automática em background (async)
- ✅ Atualiza cache com nova análise
- ✅ Logs detalhados para debug

#### **2. Rotas (redacaoRoutes.ts)**

**Nova rota:**

```typescript
/**
 * @route   PUT /api/redacoes/:id
 * @desc    Atualiza uma redação específica (texto ou título).
 * @access  Privado
 */
router.put("/:id", autenticar, atualizarRedacao);
```

---

## 🔄 Fluxo Completo

### **Exemplo de Uso**

```
Usuário faz upload de imagem
    ↓
OCR extrai: "A socíedade precísa de mudamças..."  ← Erros de OCR
    ↓
Usuário clica em "📄 Ver Texto"
    ↓
Clica em "✏️ Editar Texto"
    ↓
Corrige para: "A sociedade precisa de mudanças..."
    ↓
Clica em "💾 Salvar e Reanalisar"
    ↓
Backend:
  1. Atualiza textoExtraido
  2. Reseta notaGerada e notaFinal
  3. Inicia análise ENEM do texto corrigido
    ↓
Frontend:
  1. Recarrega lista de redações
  2. Mostra mensagem "✨ Texto analisado com sucesso!"
  3. Fecha modal
    ↓
Usuário pode ver análise do texto corrigido
```

---

## 🎨 Melhorias de UX

### **Visual**

- ✅ **Header muda de cor**: Azul (visualização) ➜ Roxo (edição)
- ✅ **Ícones descritivos**: 📄 (ver) ➜ ✏️ (editar) ➜ 💾 (salvar)
- ✅ **Estatísticas em tempo real**: Atualizam enquanto digita
- ✅ **Textarea grande**: 384px de altura (h-96)
- ✅ **Scroll interno**: Modal scrollável se conteúdo grande

### **Feedback**

- ✅ **Estado de loading**: "Salvando..." durante processo
- ✅ **Desabilita botões**: Não permite ações durante salvamento
- ✅ **Mensagem de sucesso**: Toast notification após salvar
- ✅ **Validação**: Não permite salvar texto vazio
- ✅ **Cancelamento**: Descarta mudanças e volta ao modo visualização

### **Responsividade**

- ✅ **Modal adaptativo**: Funciona em mobile e desktop
- ✅ **Botões empilhados**: Mobile-friendly
- ✅ **Textarea responsiva**: Ajusta altura em telas pequenas

---

## 🧪 Testes

### **Cenários de Teste**

#### ✅ **Teste 1: Edição Básica**

1. Visualizar texto extraído
2. Clicar em "Editar Texto"
3. Fazer mudanças
4. Salvar
5. Verificar que texto foi atualizado
6. Verificar que nova análise foi iniciada

#### ✅ **Teste 2: Cancelamento**

1. Iniciar edição
2. Fazer mudanças
3. Clicar em "Cancelar"
4. Verificar que mudanças foram descartadas
5. Verificar que volta ao texto original

#### ✅ **Teste 3: Validação**

1. Iniciar edição
2. Apagar todo o texto
3. Verificar que botão "Salvar" está desabilitado

#### ✅ **Teste 4: Estatísticas**

1. Iniciar edição
2. Adicionar/remover palavras
3. Verificar que contadores atualizam em tempo real

#### ✅ **Teste 5: Análise Automática**

1. Editar texto
2. Salvar
3. Aguardar alguns segundos
4. Verificar que nova nota aparece
5. Clicar em "📊 Ver Análise"
6. Verificar que análise reflete o texto editado

---

## 📊 Impacto

### **Antes** ❌

- Usuário não podia corrigir erros de OCR
- Erros de reconhecimento afetavam a nota
- Necessário refazer upload para corrigir

### **Depois** ✅

- Usuário pode corrigir qualquer erro
- Análise mais precisa com texto corrigido
- Fluxo contínuo sem necessidade de reupload
- Melhor experiência do usuário

---

## 🔒 Segurança

### **Validações Implementadas**

✅ **Autenticação**: Rota protegida com JWT
✅ **Autorização**: Usuário só pode editar suas próprias redações
✅ **Validação de entrada**: Texto não pode ser vazio
✅ **Sanitização**: Prisma previne SQL injection
✅ **Rate limiting**: Limite de 10MB para uploads (já existente)

---

## 📝 Endpoints da API

### **PUT /api/redacoes/:id**

**Request:**

```json
{
  "textoExtraido": "Texto editado pelo usuário...",
  "titulo": "Título opcional (se quiser atualizar)"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "titulo": "Redação sobre sustentabilidade",
  "imagemUrl": "data:image/jpeg;base64,...",
  "textoExtraido": "Texto editado pelo usuário...",
  "notaGerada": null, // Resetado
  "notaFinal": null, // Resetado
  "criadoEm": "2025-10-17T...",
  "usuarioId": "uuid"
}
```

**Erros:**

- `401`: Não autenticado
- `404`: Redação não encontrada
- `500`: Erro do servidor

---

## 🚀 Próximos Passos (Opcional)

### **Melhorias Futuras**

1. **Histórico de Edições** 📜

   - Salvar versões anteriores do texto
   - Permitir voltar a versões antigas
   - Comparação lado a lado

2. **Sugestões Automáticas** 💡

   - IA sugere correções de gramática
   - Destaque de erros comuns
   - Sugestões de melhoria

3. **Edição Inline** ✨

   - Editar diretamente na visualização
   - Sem modal de edição separado
   - Save automático (debounced)

4. **Colaboração** 👥
   - Comentários no texto
   - Revisão por pares
   - Compartilhamento de redações

---

## 📚 Arquivos Modificados

### **Frontend**

- ✅ `frontend/src/components/VisualizarTexto.tsx` - Componente de visualização/edição
- ✅ `frontend/src/pages/Dashboard.tsx` - Callback de salvamento
- ✅ `frontend/src/services/api.ts` - Função updateTexto

### **Backend**

- ✅ `backend/src/controllers/redacaoController.ts` - Função atualizarRedacao
- ✅ `backend/src/routes/redacaoRoutes.ts` - Rota PUT

---

## 🎉 Resumo

**Funcionalidade implementada com sucesso!**

✅ Usuário pode editar texto extraído
✅ Análise automática do texto editado
✅ Interface intuitiva e responsiva
✅ Feedback visual em tempo real
✅ Backend robusto com validações
✅ Documentação completa

**Pronto para usar!** 🚀
