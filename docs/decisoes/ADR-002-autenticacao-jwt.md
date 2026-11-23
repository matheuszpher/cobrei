# ADR-002: Autenticação com JWT

**Status:** Aceita
**Data:** 16/11/2026
**Responsável:** Equipe

## Contexto
O sistema guarda dados pessoais de clientes (nome, telefone) e informações financeiras do comércio, e por isso precisa restringir o acesso. Na versão atual existe um único perfil, o lojista (RF01); multiusuário e multiloja ficam apenas documentados (RF10).

A API é consumida por uma aplicação web separada (React), e a execução local é feita com Docker Compose, sem infraestrutura adicional de sessão.

## Decisão
Usar autenticação baseada em JSON Web Token (JWT):

- `POST /api/auth/login` valida e-mail e senha e devolve um token assinado, com o identificador do usuário e prazo de expiração, e os dados básicos do usuário.
- O token é enviado pelo frontend no cabeçalho `Authorization: Bearer <token>`.
- Um middleware do adaptador HTTP valida o token em todas as rotas, exceto `/auth/*` e `/health`.
- As senhas são armazenadas com hash bcrypt.
- A emissão e a verificação do token ficam atrás de uma porta (`TokenService`), implementada com a biblioteca `jsonwebtoken`. O segredo de assinatura vem de variável de ambiente.
- Um usuário de demonstração (`admin@fiado.com`) é criado na carga inicial do banco.

## Alternativas consideradas
- **Sessão no servidor com cookie:** exigiria armazenamento de sessão e tratamento de CSRF. Para uma API REST consumida por uma SPA, o JWT é mais simples.
- **Provedor externo (OAuth, Auth0, Firebase):** reduziria o código de autenticação, mas adicionaria uma dependência externa e configuração sem relação com o problema central.
- **Sem autenticação:** inaceitável, pois os dados dos clientes e a carteira de fiado são sensíveis.

## Consequências
**Positivas**
- A API permanece sem estado, o que simplifica a execução local e os testes.
- Como a geração do token fica atrás de uma porta, o mecanismo pode ser trocado sem alterar os casos de uso.
- A inclusão futura de perfis ou da loja no token (RF10) é uma extensão natural.

**Negativas**
- Um token emitido não pode ser revogado antes de expirar. O risco é reduzido com tempo de expiração curto.
- Não haverá recuperação de senha, cadastro de novos usuários nem renovação de token (refresh token) nesta versão.
- Guardar o token no navegador (localStorage) o expõe a ataques XSS; aceito como limitação do escopo acadêmico.
