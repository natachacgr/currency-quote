# Currency Quote

Aplicação web para consulta e acompanhamento de cotações de moedas em relação ao Real Brasileiro (BRL).

O projeto foi desenvolvido com uma arquitetura de **monólito modular**, separando frontend e backend em um monorepo com npm workspaces. As cotações são obtidas por meio da AwesomeAPI e passam por uma camada de cache com Redis antes de serem entregues ao frontend.

Além da consulta de cotações, a aplicação possui histórico de preços, autenticação de usuários e persistência de moedas favoritas.

## Funcionalidades

- Consulta das cotações de 10 moedas em relação ao BRL
- Atualização periódica das cotações
- Busca de moedas
- Ordenação por cotação, nome e variação
- Histórico de cotações
- Gráfico de evolução da moeda
- Seleção de período do histórico
- Cadastro de usuários
- Login com autenticação JWT
- Perfil do usuário
- Favoritos persistidos no PostgreSQL
- Priorização das moedas favoritas na listagem
- Tema claro e escuro
- Cache de cotações com Redis
- Proteção contra cache stampede
- Fallback em caso de indisponibilidade do Redis ou da API externa
- Interface responsiva
- Documentação da API com Swagger/OpenAPI
- Testes automatizados no backend e frontend

## Moedas disponíveis

Atualmente a aplicação acompanha:

| Código | Moeda             |
| ------ | ----------------- |
| USD    | Dólar Americano   |
| EUR    | Euro              |
| GBP    | Libra Esterlina   |
| JPY    | Iene Japonês      |
| CAD    | Dólar Canadense   |
| AUD    | Dólar Australiano |
| CHF    | Franco Suíço      |
| CNY    | Yuan Chinês       |
| ARS    | Peso Argentino    |
| MXN    | Peso Mexicano     |

## Tecnologias

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Axios
- Recharts
- Lucide React
- Vitest
- React Testing Library

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT
- Passport
- Argon2
- class-validator
- class-transformer
- Swagger / OpenAPI
- Jest
- Supertest

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL 17
- Redis 7

## Arquitetura

O projeto utiliza uma arquitetura de **monólito modular**, mantendo frontend e backend separados dentro de um mesmo repositório.

```text
┌─────────────────────┐
│        React        │
│    Vite + TS        │
└──────────┬──────────┘
           │
           │ REST
           ▼
┌─────────────────────┐
│       NestJS        │
│    Stateless API    │
└─────────┬─┬─────────┘
          │ │
          │ └───────────────► PostgreSQL
          │                    Users
          │                    Currencies
          │                    Favorites
          │
          ▼
┌─────────────────────┐
│        Redis        │
│   Cache + Locks     │
└──────────┬──────────┘
           │
           │ Cache miss
           ▼
┌─────────────────────┐
│     AwesomeAPI      │
│   Exchange Rates    │
└─────────────────────┘
```

O frontend nunca acessa diretamente a AwesomeAPI. Todas as consultas passam pelo backend NestJS.

Isso centraliza a integração externa e permite aplicar cache, tratamento de erros, controle de concorrência e outras regras sem expor detalhes da API externa ao cliente.

## Estrutura do projeto

```text
currency-quote/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   ├── test/
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── web/
│       ├── public/
│       ├── src/
│       └── package.json
│
├── compose.yaml
├── README.md
└── package.json
```

O projeto utiliza **npm workspaces**, permitindo gerenciar frontend e backend a partir da raiz do repositório.

## Fluxo das cotações

Quando o frontend solicita as cotações:

```text
React
  │
  ▼
NestJS
  │
  ▼
Redis
  │
  ├── Cache hit ─────────────► retorna cotação
  │
  └── Cache miss
          │
          ▼
      AwesomeAPI
          │
          ▼
        Redis
          │
          ▼
        NestJS
          │
          ▼
         React
```

Dessa forma, vários usuários consultando as mesmas moedas não provocam necessariamente novas chamadas à AwesomeAPI.

## Cache

As cotações atuais utilizam o padrão **Cache-Aside**.

O tempo padrão configurado para o cache é:

```env
EXCHANGE_RATES_CACHE_TTL=30
```

Ou seja, uma cotação pode permanecer no cache por aproximadamente 30 segundos antes de ser atualizada.

O histórico possui uma estratégia de cache própria, já que dados históricos não precisam da mesma frequência de atualização das cotações atuais.

### Cache stampede

Para evitar que várias requisições simultâneas façam chamadas iguais à AwesomeAPI quando uma chave expira, o backend utiliza um lock de curta duração no Redis.

O fluxo é semelhante a:

```text
100 requisições
       │
       ▼
cache expirado
       │
       ▼
apenas uma adquire o lock
       │
       ▼
AwesomeAPI
       │
       ▼
cache atualizado
       │
       ▼
demais requisições reutilizam o resultado
```

Essa estratégia reduz chamadas desnecessárias ao serviço externo e melhora o comportamento da aplicação sob concorrência.

## Resiliência

A integração com a AwesomeAPI possui mecanismos para reduzir o impacto de falhas externas.

Entre eles:

- timeout nas requisições externas;
- tentativa limitada de nova requisição;
- cache;
- utilização de dados em cache quando possível;
- fallback caso o Redis esteja indisponível.

A indisponibilidade do Redis, portanto, não impede automaticamente a aplicação de consultar a AwesomeAPI.

## Banco de dados

O PostgreSQL é utilizado para persistir dados pertencentes à aplicação.

Entre eles:

```text
User
Currency
FavoriteCurrency
```

As cotações atuais não são persistidas no PostgreSQL, pois são dados externos e temporais que podem ser obtidos novamente através da AwesomeAPI.

Essa separação evita armazenamento desnecessário de dados e mantém o banco focado nas informações pertencentes ao domínio da aplicação.

## Favoritos

Usuários autenticados podem adicionar e remover moedas favoritas.

Os favoritos são persistidos no PostgreSQL e associados ao usuário autenticado.

Quando o usuário acessa novamente a aplicação, suas moedas favoritas continuam disponíveis.

Na interface, moedas favoritas são priorizadas na listagem para facilitar o acesso às cotações mais relevantes para o usuário.

## Autenticação

A aplicação utiliza autenticação baseada em **JWT**.

O fluxo básico é:

```text
Cadastro / Login
       │
       ▼
     NestJS
       │
       ▼
validação do usuário
       │
       ▼
      JWT
       │
       ▼
    Frontend
```

As senhas não são armazenadas em texto puro. O backend utiliza **Argon2** para geração do hash da senha.

Rotas que dependem do usuário, como perfil e favoritos, exigem um token JWT válido.

## Histórico de cotações

O histórico é solicitado pelo frontend ao backend, que realiza a integração com a AwesomeAPI.

```text
React
  │
  ▼
NestJS
  │
  ▼
Redis
  │
  ▼
AwesomeAPI
```

Os dados históricos são exibidos através de gráficos utilizando Recharts.

O usuário pode visualizar diferentes períodos, como:

- 7 dias
- 15 dias
- 30 dias
- 60 dias
- 3 meses
- 6 meses
- 1 ano

O histórico não é persistido no PostgreSQL. Ele é obtido da AwesomeAPI e armazenado temporariamente no Redis.

## Pré-requisitos

Para executar o projeto localmente é necessário possuir:

- Node.js 22+
- npm
- Docker
- Docker Compose

## Instalação

Clone o repositório e acesse a pasta do projeto:

```bash
git clone https://github.com/natachacgr/currency-quote.git
cd currency-quote
```

Instale as dependências a partir da raiz:

```bash
npm install
```

Como o projeto utiliza npm workspaces, as dependências dos dois aplicativos são gerenciadas pelo workspace.

## Variáveis de ambiente

Na pasta da API existe um arquivo de exemplo:

```text
apps/api/.env.example
```

Crie o arquivo `.env`:

```bash
cp apps/api/.env.example apps/api/.env
```

Configuração de desenvolvimento:

```env
DATABASE_URL="postgresql://currency_quote:currency_quote@localhost:5432/currency_quote?schema=public"
REDIS_URL="redis://localhost:6379"
EXCHANGE_RATES_CACHE_TTL=30
JWT_SECRET="change-this-secret-in-production"
JWT_EXPIRES_IN="1h"
```

> Em ambientes reais, utilize um `JWT_SECRET` forte e não versione o arquivo `.env`.

## PostgreSQL e Redis

PostgreSQL e Redis são executados através do Docker Compose.

Na raiz do projeto:

```bash
docker compose up -d
```

Para verificar os containers:

```bash
docker compose ps
```

Os serviços configurados são:

| Serviço    | Porta |
| ---------- | ----: |
| PostgreSQL |  5432 |
| Redis      |  6379 |

Os dados são armazenados em volumes Docker para que não sejam perdidos quando os containers forem reiniciados.

Para encerrar os serviços:

```bash
docker compose down
```

## Prisma

Depois de iniciar o PostgreSQL e configurar o `.env`, acesse a API:

```bash
cd apps/api
```

Execute as migrations:

```bash
npx prisma migrate dev
```

Depois execute o seed:

```bash
npx prisma db seed
```

O seed utiliza `upsert`, permitindo sua execução mais de uma vez sem criar moedas duplicadas.

Para retornar à raiz:

```bash
cd ../..
```

## Executando o projeto

O frontend e o backend podem ser executados a partir da raiz em terminais separados.

### Backend

```bash
npm run dev:api
```

### Frontend

```bash
npm run dev:web
```

Durante o desenvolvimento, o frontend Vite é disponibilizado em:

```text
http://localhost:5173
```

A API NestJS é disponibilizada em:

```text
http://localhost:3000
```

## Scripts

Os principais comandos disponíveis são:

| Comando                        | Descrição                                    |
| ------------------------------ | -------------------------------------------- |
| `npm run dev:api`              | Inicia a API em modo de desenvolvimento      |
| `npm run dev:web`              | Inicia o frontend em modo de desenvolvimento |
| `npm run build:api`            | Gera o build da API                          |
| `npm run build:web`            | Gera o build do frontend                     |
| `npm run test:api`             | Executa os testes unitários da API           |
| `npm run test --workspace=web` | Executa os testes do frontend                |

A API também possui comandos próprios:

```bash
npm run lint --workspace=api
npm run test:cov --workspace=api
npm run test:e2e --workspace=api
```

## API

A API disponibiliza recursos para:

```text
/auth
/exchange-rates
/favorites
```

Entre as operações implementadas estão autenticação, identificação do usuário autenticado, consulta de cotações, consulta de histórico e gerenciamento de favoritos.

### Principais endpoints

```http
GET /exchange-rates

GET /exchange-rates?currencies=USD,EUR

GET /exchange-rates/history?currency=USD&days=30

POST /auth/register

POST /auth/login

GET /auth/me

GET /favorites

POST /favorites/USD

DELETE /favorites/USD
```

Rotas privadas devem receber o token JWT:

```http
Authorization: Bearer <access_token>
```

## Documentação da API

A API possui documentação interativa gerada com **Swagger/OpenAPI**.

Com o backend em execução, a documentação pode ser acessada em:

```text
http://localhost:3000/docs
```

A documentação permite visualizar os endpoints disponíveis, parâmetros, queries e rotas protegidas da aplicação.

## Atualização das cotações

No frontend, as cotações atuais são gerenciadas com TanStack Query.

A aplicação realiza atualização periódica das cotações a cada 30 segundos enquanto a interface está em uso.

O backend utiliza Redis com cache das cotações para impedir que cada atualização de cada cliente resulte necessariamente em uma nova chamada à AwesomeAPI.

Essa combinação permite manter a interface atualizada sem sobrecarregar desnecessariamente o serviço externo.

## Gerenciamento de estado

Estados relacionados a dados remotos são gerenciados principalmente através do **TanStack Query**.

Estados locais de interface permanecem nos próprios componentes e hooks React.

Essa abordagem evita a introdução de uma biblioteca global de estado sem necessidade.

## Build

Para gerar o build do backend:

```bash
npm run build:api
```

Para gerar o build do frontend:

```bash
npm run build:web
```

## Testes

O projeto possui testes automatizados no backend e no frontend.

### Backend

O backend utiliza **Jest** e **Supertest**.

A suíte possui **45 testes**, sendo:

- 25 testes unitários;
- 20 testes E2E.

Os testes cobrem cenários relacionados a:

- autenticação;
- JWT e proteção de rotas;
- consulta de cotações;
- histórico de cotações;
- favoritos;
- validação de parâmetros e DTOs;
- comportamento dos principais serviços;
- integração entre controllers e serviços.

Para executar os testes unitários:

```bash
npm run test --workspace=api
```

Para executar os testes E2E:

```bash
npm run test:e2e --workspace=api
```

Para executar a cobertura:

```bash
npm run test:cov --workspace=api
```

### Frontend

O frontend utiliza **Vitest** e **React Testing Library**.

A suíte possui **14 testes**, cobrindo:

- persistência da sessão de autenticação;
- comportamento de rotas protegidas;
- consulta de cotações com TanStack Query;
- estados de carregamento, sucesso e erro;
- carregamento de favoritos;
- adição e remoção de favoritos;
- invalidação do cache do TanStack Query após mutations.

Para executar:

```bash
npm run test --workspace=web
```

### Total

Atualmente o projeto possui **59 testes automatizados**:

```text
Backend   45
Frontend  14
────────────
Total     59
```

## Decisões técnicas

### Por que Redis?

As cotações são consultadas por vários usuários, mas o dado retornado para uma mesma moeda é compartilhável.

Sem cache, cada usuário poderia provocar uma nova chamada à AwesomeAPI.

O Redis permite reutilizar resultados recentes e reduzir chamadas externas.

### Por que não armazenar todas as cotações no PostgreSQL?

A AwesomeAPI já é a fonte dos dados de mercado.

Persistir todas as cotações adicionaria complexidade de sincronização e crescimento do banco sem necessidade para o escopo atual.

O Redis é utilizado para armazenamento temporário, enquanto o PostgreSQL permanece responsável pelos dados persistentes da aplicação.

### Por que monólito modular?

O escopo da aplicação não exige a complexidade operacional de uma arquitetura de microserviços.

O monólito modular mantém separação entre responsabilidades sem adicionar comunicação distribuída, múltiplos deployments ou infraestrutura desnecessária.

### Por que o frontend não acessa diretamente a AwesomeAPI?

Centralizar a integração no backend permite:

- utilizar cache;
- controlar concorrência;
- implementar timeout e retry;
- alterar o provedor externo sem modificar o frontend;
- manter as regras de integração em um único lugar.

### Por que TanStack Query no frontend?

As cotações e os favoritos representam principalmente estado remoto.

O TanStack Query permite controlar cache, atualização periódica, estados de carregamento e erro e invalidação após mutations sem introduzir uma biblioteca global de estado sem necessidade.

## Melhorias futuras

Algumas evoluções possíveis incluem:

- observabilidade, métricas e tracing;
- rate limiting por usuário/IP;
- tratamento específico de conflitos concorrentes no cadastro e nos favoritos;
- pipeline de CI/CD;
- deploy automatizado;
- otimização do bundle do frontend com code splitting.
