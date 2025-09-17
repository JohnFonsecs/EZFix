# Frontend Project for EZFix

Este é o projeto frontend desenvolvido em React para o backend do EZFix. A aplicação é estruturada para fornecer uma interface de usuário interativa e responsiva, permitindo que os usuários realizem login, registro, e interajam com avaliações e redações.

## Estrutura do Projeto

- **public/**
  - `index.html`: Ponto de entrada da aplicação web.
  - `favicon.ico`: Ícone da aplicação.

- **src/**
  - **components/**: Contém todos os componentes reutilizáveis da aplicação.
    - **Auth/**: Componentes relacionados à autenticação.
      - `Login.tsx`: Formulário de login.
      - `Register.tsx`: Formulário de registro.
    - **Avaliacao/**: Componentes relacionados a avaliações.
      - `AvaliacaoForm.tsx`: Formulário para criação ou edição de avaliações.
      - `AvaliacaoList.tsx`: Lista de avaliações.
    - **Redacao/**: Componentes relacionados a redações.
      - `RedacaoForm.tsx`: Formulário para criação ou edição de redações.
      - `RedacaoList.tsx`: Lista de redações.
    - **Layout/**: Componentes de layout da aplicação.
      - `Header.tsx`: Cabeçalho da aplicação.
      - `Footer.tsx`: Rodapé da aplicação.
  - **pages/**: Contém as páginas principais da aplicação.
    - `Home.tsx`: Página inicial.
    - `Dashboard.tsx`: Página do painel do usuário.
    - `Profile.tsx`: Página de perfil do usuário.
  - **services/**: Contém funções para interagir com a API do backend.
    - `api.ts`: Funções para requisições HTTP.
  - **hooks/**: Contém hooks personalizados.
    - `useAuth.ts`: Lógica de autenticação.
  - **utils/**: Contém utilitários e constantes.
    - `constants.ts`: Constantes utilizadas em todo o projeto.
  - **types/**: Contém tipos e interfaces.
    - `index.ts`: Tipos utilizados em todo o projeto.
  - `App.tsx`: Componente principal da aplicação.
  - `index.tsx`: Ponto de entrada da aplicação React.
  - `App.css`: Estilos globais da aplicação.

## Instalação

Para instalar as dependências do projeto, execute:

```
npm install
```

## Execução

Para iniciar a aplicação em modo de desenvolvimento, execute:

```
npm start
```

A aplicação estará disponível em `http://localhost:3000`.

## Contribuição

Sinta-se à vontade para contribuir com melhorias e correções. Para isso, faça um fork do repositório e envie um pull request.

## Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para mais detalhes.