# CONTRATO DE INTEGRAÇÃO FRONT — FATIA 1: FUNDAÇÃO (auth de servidor no front)

> **Status:** RASCUNHO PARA REVISÃO — aguarda validação do orquestrador (e pareamento com A1) antes de qualquer código.
> **Fonte de verdade dos endpoints:** `docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md` (A1 Backend). Este documento não redefine nenhum endpoint, código de erro, cookie ou variável da API — apenas consome.
> **Escritor único:** só A2 (Front) toca `app/src`. Nenhum segredo, senha ou valor de variável aparece aqui — variáveis só por nome.
> **Fontes lidas:** contrato A1 (§5.1 endpoints, §5.5 envelope, §9 CORS, §10–13 env/deploy), `app/src/auth.ts`, `app/src/store.tsx`, `app/src/App.tsx`, `app/src/main.tsx`, `app/src/pages/Login.tsx`, `app/src/pages/ForgotPassword.tsx`, `app/src/components/Layout.tsx`, `app/src/pages/Overview.tsx`, `app/src/pages/Profile.tsx`, `app/vite.config.ts`, `app/package.json`, `docs/continuidade/06-INVENTARIO-ROTAS-SENDFLOW.md`, PM-GRUPOS v1.0 §1 (regras 3, 7, 9, 10), §6 (ENG-02, ENG-09), §4.1 (NAV-07), §7.

---

## 0. Decisões do coordenador aceitas (08/11/2026 — antes da implementação)

Decisões acatadas pelo orquestrador que **prevalecem** sobre o texto rascunho deste documento onde houver conflito:

1. **D2 (cookie / SameSite):** a API enviará o cookie de sessão com `SameSite=None; Secure; HttpOnly`. Em dev, o navegador fica same-origin via **proxy do Vite** (`/api` → API local); em produção, o front usa `VITE_API_URL` absoluta (cross-origin com `credentials:'include'`). O cliente HTTP **sempre** envia `credentials:'include'`. Isso **resolve o risco §7.1** (cookie `Lax` cross-site) — a pendência de integração fica encerrada pela decisão D2.
2. **Porta dev da API confirmada: `http://localhost:8787`** (deixa de ser "proposta" do §4.2/§7.3 — é a porta que o A1 implementa).
3. **Contrato de erros do backend confirmado (A1):** envelope `{error:{code,message,details?}}` com `AUTH_INVALID_CREDENTIALS` (401), `AUTH_RATE_LIMITED` (429 + header `Retry-After`), `AUTH_EMAIL_TAKEN` (409), `VALIDATION_ERROR` (400), `AUTH_UNAUTHENTICATED` (401). Detalhes finos no contrato do A1 (`docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md`, worktree `sendflow-wt-a1`).
4. **Ajuste no §4.2:** `changeOrigin: true` no proxy do Vite (o rascunho dizia `false`; a instrução do coordenador prevalece — ver §4.2 atualizado).
5. **Ajuste no mapa de erro do §3.5:** `AUTH_EMAIL_TAKEN` ganha mensagem própria ("Este e-mail já está cadastrado.") por decisão do coordenador (o código não ocorre no login; entra no mapa por clareza e para o fluxo futuro de registro).

---

## 1. Escopo e fora de escopo

### 1.1 Dentro do escopo (fechado)

1. **Remover o usuário com senha fixa** sem em `app/src/auth.ts` (credencial fixa em código-fonte público — risco registrado em 06-INVENTARIO §"Riscos" item 1 e A1 §1.1.6). O arquivo `auth.ts` atual é **substituído inteiramente** (vira provider de sessão; ver §3.2). A credencial não é reproduzida em documento algum.
2. **Cliente HTTP único** `app/src/lib/api.ts`: base URL por variável de build `VITE_API_URL` (por nome), `fetch` com `credentials: 'include'` (cookie httpOnly), parse do envelope de erro `{error:{code,message,details?}}` (A1 §5.5), timeout via `AbortController` e estado de rede/erro honesto — **nunca simular sucesso** (PM regra 3).
3. **Fluxos de auth conforme A1 §5.1:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`. Sessão controlada **pelo servidor** (cookie httpOnly; o front nunca lê nem persiste token).
4. **`RequireAuth` consulta o servidor:** bootstrap via `GET /me` com estados honestos de carregando/erro (NAV-07 como referência; PM regra 3). Sem "online" falso.
5. **Login com erro real do servidor** por código (`AUTH_INVALID_CREDENTIALS`, `AUTH_RATE_LIMITED` etc.), **sem nenhuma mudança de layout/estilo** — as telas continuam visualmente idênticas às aprovadas (o visual é de outra etapa, DIR-02/03).
6. **`ForgotPassword` honesto:** declara indisponibilidade (decisão justificada no §3.6). Sem envio externo real.
7. **Dev local com proxy do Vite** (`/api` → API local do A1), evitando CORS em desenvolvimento (§4).

### 1.2 Fora de escopo (explícito — não construir, mesmo que "pareça fácil")

- **Qualquer dado de produto vindo da API.** `store.tsx` continua 100% local (localStorage `orbit-data-v1` + `data/seed.ts`): contas, campanhas, grupos, ações, automações, leads, deeplinks, histórico, equipe, permissões, webhooks só migram para a API **nas respectivas fatias 2+**. Nesta fatia, **apenas** a sessão (usuário/organização do `me`/`login`) vem da API.
- **Telas novas** (incluindo tela de registro: não existe hoje e não será criada; `registerUser` atual não é usado por nenhuma página — verificado por busca em `app/src`).
- **Mudança de identidade visual**, novos estilos, novos componentes visuais, métricas (MET/DEC-14), mocks/dados de demonstração apresentados como reais (PM regra 3; DIR-04).
- Recuperação/verificação de e-mail, troca de senha, 2FA, papéis/permissões de auth (A1 §1.2 idem).
- Infra de teste automatizado no front (hoje não há script de teste no `app`; regressão desta fatia é portão de build + roteiro manual §6 — criar suíte é proposta futura, não extra silencioso).

### 1.3 Regras do PM aplicadas diretamente

| Regra | Aplicação nesta fatia |
|---|---|
| 3 (funções reais, nada fake) | Erro de rede/timeout/5xx aparece como erro honesto; `ForgotPassword` deixa de fingir envio; nenhum sucesso simulado. |
| 7 (distinções preservadas) | usuário ≠ sessão: a sessão é artefato do servidor (cookie); o front guarda só o snapshot `{user, organization}` devolvido por `login`/`me`; logout mata a sessão, não o usuário. |
| 9 (identidade própria) | Nenhuma mudança visual/marca — zero diff em estilos. |
| 10 (segredos/PII) | Senha nunca logada/persistida; token fica só no cookie httpOnly (JS não acessa); dados de teste 100% sintéticos; limpeza das chaves legadas de `localStorage`. |

---

## 2. Arquivos a tocar (lista exata) e propriedade

**Um escritor por arquivo: todos abaixo são de A2 (front). Nenhum outro agente edita `app/`.**

| # | Arquivo | Ação | Resumo |
|---|---|---|---|
| 1 | `app/src/lib/api.ts` | **NOVO** | Cliente HTTP único + tipos de transporte + endpoints de auth (§3.1). |
| 2 | `app/src/auth.ts` → `app/src/auth.tsx` | **SUBSTITUÍDO** | Antigo módulo local (seed de usuário, SHA-256 no cliente, sessão em localStorage) é apagado; vira `SessionProvider` + `useSession` (§3.2). |
| 3 | `app/src/main.tsx` | Editar | Monta `SessionProvider` junto ao `StoreProvider` (§3.3). |
| 4 | `app/src/App.tsx` | Editar | `RequireAuth` reescrito sobre `useSession` (§3.4). Rotas inalteradas. |
| 5 | `app/src/pages/Login.tsx` | Editar | Submit chama a API; mapa de erro por código; visual idêntico (§3.5). |
| 6 | `app/src/pages/ForgotPassword.tsx` | Editar | Declara indisponibilidade; sem envio simulado (§3.6). |
| 7 | `app/src/components/Layout.tsx` | Editar (mínimo) | Troca `currentUser()`/`logout()` por `useSession` (chip de usuário + botão "Sair") (§3.7). **Descoberta da leitura de código: o arquivo consome `auth.ts` hoje (linhas 5, 40, 178) e precisava estar na lista.** |
| 8 | `app/src/pages/Overview.tsx` | Editar (mínimo) | Idem: `currentUser()` → `useSession` (linha 4/14) (§3.7). |
| 9 | `app/src/pages/Profile.tsx` | Editar (mínimo) | Idem (linha 2/19) (§3.7). |
| 10 | `app/vite.config.ts` | Editar | `server.proxy` `/api` → API local (§4.2). |
| 11 | `app/.env.example` | **NOVO** | Somente o nome `VITE_API_URL` documentado (sem valor). |

**NÃO tocados (declaração de não-regressão):** `app/src/store.tsx` (produto continua local — §1.2), `app/src/types.ts` (tipos de auth ficam em `lib/api.ts`/`auth.tsx`, sem poluir tipos de produto), `app/src/data/seed.ts`, `app/src/i18n*`, `app/src/styles/**` (zero diff de CSS — verificável no diff do PR), todas as demais páginas e `components/Icons` etc.

**Desvio declarado da delegação original:** a lista recebida citava "store.tsx bootstrap". Decisão A2: a bootstrap da sessão vive no `SessionProvider` (`auth.tsx`), **não** no `store` — o `store.tsx` fica intocado, reduzindo a zero o risco de regressão nos dados de produto e mantendo auth fora do estado de produto. O intento da delegação ("apenas a bootstrap da sessão vem da API") é atendido. Em compensação, a leitura de código revelou 3 consumidores extras de `auth.ts` (Layout, Overview, Profile) que precisam do rewiring mínimo — incluídos acima.

**Sequenciamento com A1 (herdado do contrato A1 §1.1.6):** a remoção do seed e o rewiring do login entram juntos no PR coordenado da fatia; o front novo exige a API no ar (sem fallback local para login).

---

## 3. Contrato de cada mudança

### 3.1 `app/src/lib/api.ts` (novo) — cliente HTTP único

```ts
// Tipos de transporte
export type ApiErrorShape = { error: { code: string; message: string; details?: unknown } }

export class ApiError extends Error {
  readonly code: string      // código do servidor (A1 §5.5) OU código do cliente:
                             // 'NETWORK_ERROR' | 'TIMEOUT' | 'BAD_ERROR_BODY'
  readonly status: number    // HTTP status; 0 quando a requisição não completou
  readonly retryAfter?: number // segundos, do cabeçalho Retry-After (presente no 429)
  readonly details?: unknown
}

// Função única de transporte
export async function apiFetch<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T>

// Endpoints de auth (A1 §5.1) — únicos desta fatia
export type AuthUser = { id: string; email: string; name: string }
export type AuthOrganization = { id: string; name: string }
export type AuthSession = { user: AuthUser; organization: AuthOrganization }

export async function authRegister(input: { email: string; password: string; name?: string; organizationName?: string }): Promise<AuthSession> // POST /api/v1/auth/register → 201
export async function authLogin(input: { email: string; password: string }): Promise<AuthSession>                                              // POST /api/v1/auth/login    → 200
export async function authLogout(): Promise<void>                                                                                             // POST /api/v1/auth/logout   → 204 (idempotente)
export async function authMe(): Promise<AuthSession>                                                                                          // GET  /api/v1/auth/me       → 200
```

**Comportamento obrigatório de `apiFetch`:**

1. **URL:** `BASE + path`, onde `BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')` e todo `path` começa com `/api/v1/...`. `VITE_API_URL` vazio → caminhos relativos (dev com proxy, §4.2). Nenhuma outra URL é construída no app — **proibido** `fetch` avulso em páginas/componentes para API.
2. **Credenciais:** sempre `credentials: 'include'` (cookie httpOnly da sessão). Sem `credentials`, o cookie não atravessa — não negociável.
3. **Cabeçalhos:** `Accept: application/json`; `Content-Type: application/json` somente quando há corpo. Nada além disso (CORS do A1 só permite `content-type`).
4. **Timeout:** `AbortController` com `timeoutMs` padrão **15000 ms** (scrypt no login cabe com folga); expiração → `ApiError { code: 'TIMEOUT', status: 0 }`.
5. **Falha de rede** (fetch rejeita sem resposta): `ApiError { code: 'NETWORK_ERROR', status: 0 }` — é o estado "offline/API fora" honesto (PM regra 3).
6. **Resposta de erro (`!res.ok`):** faz parse do envelope `ApiErrorShape` e lança `ApiError` com `code`, `message`, `details`, `status` (e `retryAfter` do `Retry-After` quando houver). Corpo de erro ilegível/fora do envelope → `ApiError { code: 'BAD_ERROR_BODY', status: <http> }` com mensagem genérica — o front **nunca adivinha** um código que o servidor não mandou.
7. **Sucesso:** `204` → resolve `undefined`; `200/201` com corpo → `JSON.parse` e resolve como `T`. O cliente **não** valida o schema do corpo de sucesso nesta fatia (contrato A1 é a fonte; tipagem estrutural basta) — divergência de forma aparece como erro de parse/uso e é tratada como `BAD_ERROR_BODY`.
8. **Maiúsculas de código do servidor tratadas nesta fatia** (mapa completo de UI no §3.5): `VALIDATION_ERROR`, `AUTH_INVALID_CREDENTIALS`, `AUTH_UNAUTHENTICATED`, `AUTH_RATE_LIMITED`, `AUTH_EMAIL_TAKEN`, `INTERNAL_ERROR` (+ `NOT_FOUND`/`METHOD_NOT_ALLOWED` se rota errada — não esperado).

`authRegister` fica exposto no cliente **sem consumidor de UI** nesta fatia (não há tela de registro e não será criada — §1.2); existe para paridade com o contrato A1 e para o roteiro manual (§6, passo R1 via curl). Declaração explícita contra "código morto": função de contrato, usada na fatia seguinte que criar o fluxo de registro.

### 3.2 `app/src/auth.tsx` (substitui `app/src/auth.ts`) — sessão do servidor

O arquivo atual (seed `ensureSeedUser`, `sha256`, `readUsers`/`writeUsers`, `login` local, `currentUser`, `logout`, `registerUser`) é **apagado por inteiro**. Nada dele sobrevive: usuário/senha não existem mais no navegador.

```tsx
export type SessionState =
  | { status: 'loading' }                                              // bootstrap em curso
  | { status: 'authenticated'; session: AuthSession }                  // me/login OK
  | { status: 'unauthenticated' }                                      // me → 401
  | { status: 'error'; error: ApiError }                               // rede/5xx/inesperado

export function SessionProvider({ children }: { children: React.ReactNode }): JSX.Element
export function useSession(): {
  state: SessionState
  signIn: (email: string, password: string) => Promise<void>   // lança ApiError ao falhar
  signOut: () => Promise<void>                                  // lança ApiError ao falhar
  retryBootstrap: () => void                                    // reexecuta o me (tela de erro)
}
```

**Fluxo de bootstrap (montagem do provider):**

1. Estado inicial `'loading'`.
2. **Higiene de chaves legadas:** remove `localStorage['orbit.users']` e `localStorage['orbit.session']` (dados de credencial legados não ficam no navegador — PM regra 10). Idempotente.
3. `authMe()`:
   - `200` → `'authenticated'` com o `{user, organization}` do servidor;
   - `401` com `AUTH_UNAUTHENTICATED` → `'unauthenticated'` (caso normal, **não** é erro);
   - qualquer outro resultado (`NETWORK_ERROR`, `TIMEOUT`, `5xx`, `BAD_ERROR_BODY`) → `'error'` com o `ApiError`. **Nunca** degradar para "autenticado" ou "desautenticado" sem resposta do servidor.

**Operações:**

- `signIn` → `authLogin`; sucesso grava `'authenticated'` com a sessão da resposta (login já devolve `{user, organization}` — sem chamada extra a `me`). Falha **não** altera o estado global (só propaga o `ApiError` para a tela mapear).
- `signOut` → `authLogout` (204 idempotente por contrato A1); sucesso → `'unauthenticated'`. **Falha mantém o estado e propaga o erro** — logout silencioso só-local seria simular sucesso sobre sessão possivelmente ainda viva (PM regra 3); a UI mostra o erro e permite tentar de novo.
- `retryBootstrap` → volta a `'loading'` e reexecuta o passo 3.

**ENG-02 (front-side):** o front **nunca** envia `org_id` em corpo/query/cabeçalho; a organização só existe como snapshot da resposta do servidor. Não há seletor de organização, cache de org em localStorage, nem confiança em qualquer dado de tenant vindo do cliente. **ENG-09 (front-side):** senha só transita no corpo do POST (campo `type="password"` já existente); nada de senha/token/cookie em log, `localStorage` ou `console`. O token é inacessível ao JS (cookie httpOnly) por construção.

### 3.3 `app/src/main.tsx`

`SessionProvider` envolve a árvore junto aos providers existentes (fora do `BrowserRouter`, não precisa de router):

```tsx
<I18nProvider><SessionProvider><StoreProvider><BrowserRouter><App /></BrowserRouter></StoreProvider></SessionProvider></I18nProvider>
```

Nenhuma outra mudança.

### 3.4 `app/src/App.tsx` — `RequireAuth`

Hoje: `if (!currentUser()) return <Navigate to="/login" replace />` (verificação síncrona de localStorage — some com o auth.ts velho). Novo:

```tsx
function RequireAuth({ children }: { children: React.ReactElement }) {
  const { state, retryBootstrap } = useSession()
  if (state.status === 'loading') return <tela de carregando>   // §5
  if (state.status === 'error') return <tela de erro com retry> // §5 — nunca "online" falso
  if (state.status === 'unauthenticated') return <Navigate to="/login" replace />
  return children
}
```

- Autenticação passa a ser **afirmada pelo servidor** (bootstrap `me`), não por chave local.
- Rotas, redirecionamentos e o restante de `App.tsx` ficam idênticos.
- As telas de carregando/erro são marcação mínima e neutra (texto simples centrado), **sem criar nova identidade visual nem regras CSS novas** — reutilizam o que existe ou estilos inline mínimos; detalhe no §5.

### 3.5 `app/src/pages/Login.tsx` — erros reais, visual idêntico

- Submit passa a chamar `signIn(email, pass)`; sucesso → `nav('/whats/overview')` (comportamento atual preservado).
- Estado `busy` existente (botão desabilitado + "Entrando…") é o estado de carregando do login — **mantido como está**.
- O elemento de erro existente (`<p role="alert" className="sf-auth2-error">`) continua sendo o único veículo de erro — **mesmo elemento, mesmas classes, nenhum estilo novo**. Muda apenas a origem/fonte do texto: do fixo "E-mail ou senha inválidos." para o mapa por código:

| `ApiError.code` | Texto exibido (pt-BR, tom atual) |
|---|---|
| `AUTH_INVALID_CREDENTIALS` | "E-mail ou senha inválidos." *(idêntico ao atual — não distingue e-mail existente, espelhando A1 §5.5)* |
| `AUTH_RATE_LIMITED` | "Muitas tentativas. Aguarde {retryAfter} segundos e tente novamente." — sem `Retry-After`: "Muitas tentativas. Aguarde alguns minutos e tente novamente." |
| `VALIDATION_ERROR` | Mensagem honesta do servidor (ex.: senha fora do mínimo do A1 — política de senha é do servidor; o front **não** inventa regra própria nem duplica limite) |
| `NETWORK_ERROR` / `TIMEOUT` | "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente." |
| `BAD_ERROR_BODY` / `INTERNAL_ERROR` / qualquer outro | "Erro no servidor. Tente novamente em instantes." |

- Nenhuma mensagem de sucesso/estado é fabricada; sem credenciais pré-preenchidas; placeholder/labels/estrutura intocados.
- Política de senha mínima (A1 §15.2, proposto 8) **não** ganha texto novo nesta fatia: não há hoje texto de regra de senha na tela e o servidor responde `VALIDATION_ERROR` honesto. Ajuste de copy fica para a fatia que tratar do fluxo de registro (declarado, não decidido aqui).

### 3.6 `app/src/pages/ForgotPassword.tsx` — decisão: declarar indisponibilidade

**Escolha: a tela declara indisponibilidade.** Justificativa: o comportamento atual (`setSent(true)` → "Se o e-mail existir, enviaremos instruções…") **finge um envio que nunca acontece** — é exatamente o sucesso simulado que a PM regra 3 proíbe, e não há endpoint de recuperação no contrato A1 (§1.2: fora de escopo, sem e-mail real). "Manter o comportamento atual sem fingir envio" não é possível sem remover a mensagem de sucesso — que é o cerne do comportamento.

Implementação mínima, sem envio externo e sem mudança de layout:

- Mantém: `AuthBrandPanel`, `AuthCookieBanner`, heading, footer, classes `sf-auth2-*` existentes e o link "Voltar para login".
- Troca: o formulário + mensagem de "enviado" saem; no lugar, um parágrafo (reusando a classe de texto existente `sf-auth2-sent`) com aviso honesto, ex.: "A redefinição de senha por e-mail ainda não está disponível nesta versão. Fale com o administrador da sua organização."
- Nenhuma requisição parte desta tela (verificável na aba de rede no roteiro §6 R8).

### 3.7 Consumidores mínimos: `Layout.tsx`, `Overview.tsx`, `Profile.tsx`

Troca pontual e sem alteração visual (mesmos fallbacks atuais):

- `Layout.tsx`: `const user = currentUser()` → `const { state } = useSession(); const user = state.status === 'authenticated' ? state.session.user : null` (mantém `userName = user?.name || 'Usuário'` e `userEmail`). Botão "Sair": `onClick={() => { signOut().then(() => nav('/login')).catch(() => {}) }}` — em falha de logout o menu fica como está e o erro aparece no `console`? **Não:** falha de `signOut` mantém a sessão; para não criar UI nova, a falha é sinalizada reutilizando o elemento de alerta padrão do header se existir ou, no mínimo, não navega (ficar na página é honesto; navegar fingiria logout). Detalhe de execução decidido na implementação dentro deste limite: **nenhum texto de sucesso fabricado**.
- `Overview.tsx` e `Profile.tsx`: `currentUser()` → leitura equivalente de `useSession` (renderizam só sob `RequireAuth`, onde o estado é `authenticated`; fallbacks `'Usuário'`/`''` preservados).

Estes três arquivos não mudam marcação, estilo nem comportamento além da fonte do dado usuário/logout.

---

## 4. Variáveis de build e proxy de desenvolvimento

### 4.1 `VITE_API_URL` (produção — por nome)

- Única variável de build do front. Definida no serviço do front (Railway) com a **URL pública da API** (A1 §10 e §13.6 — deploy do front só depois da API saudável).
- Vazia/não definida → caminhos relativos (`/api/v1/...`) — é o modo dev (proxy) e servirá para hospedagem same-origin no futuro.
- Com valor → base absoluta: requisições cross-origin com `credentials:'include'`; o A1 **exige** `WEB_ORIGIN` contendo a origem exata do front (A1 §9) — dependência de configuração registrada no §7.
- Registrada em `app/.env.example` **somente por nome**.

### 4.2 Proxy do Vite (dev local)

Em `vite.config.ts`, adicionar ao `defineConfig`:

```ts
server: {
  proxy: {
    '/api': {
      target: process.env.API_PROXY_TARGET || 'http://localhost:8787', // porta local da API (A1, confirmada)
      changeOrigin: true, // decidido pelo coordenador (§0.4)
    },
  },
},
```

- O dev server (Vite 6, porta padrão 5173) encaminha `/api/*` para a API local do A1 → **mesma origem no navegador: sem CORS e o cookie de sessão (dev, sem `__Host-`) flui naturalmente**.
- `API_PROXY_TARGET` é **variável de ambiente do Node lida só no vite.config** (não é `VITE_*`, não vai para o bundle) para o caso da porta local do A1 ser outra. Porta padrão `8787` **confirmada pelo coordenador** (§0.2).
- Cookie de produção é `SameSite=None; Secure; HttpOnly` (decisão D2, §0.1) — irrelevante para o front (httpOnly, nunca lido pelo JS) — declarado para ninguém procurar o nome do cookie no código front.

---

## 5. Estados de UI honestos (PM regra 3; NAV-07 como referência)

Princípio NAV-07: carregando ≠ vazio ≠ erro ≠ desabilitado — nenhum estado assume o lugar do outro; nenhum sucesso é simulado.

| Tela/fluxo | carregando | erro | offline/rede |
|---|---|---|---|
| **Login** (submit) | `busy` existente: botão desabilitado + "Entrando…" (mantido) | `<p role="alert" class="sf-auth2-error">` com texto por código (§3.5) | `NETWORK_ERROR`/`TIMEOUT` → mensagem honesta de conectividade; sem "logado" falso |
| **Bootstrap (`RequireAuth`)** | Tela neutra "Carregando…" enquanto `me` responde | Tela neutra de erro **com ação de tentar novamente** (`retryBootstrap`) quando `me` falha por rede/5xx — nunca renderiza a área protegida nem finge sessão | Idem erro — offline é erro honesto, não "deslogado" nem "online" |
| **Logout** | Botão desabilitado durante a chamada (reuso do padrão existente) | Falha mantém a sessão e não navega para `/login` (§3.7) — sem logout fingido | Idem |
| **`me` 401** | — | Não é erro: estado `unauthenticated` → redireciona a `/login` (comportamento atual preservado) | — |
| **ForgotPassword** | — | — | Sempre honesto: indisponibilidade declarada, nenhuma requisição (§3.6) |

As telas de carregando/erro do `RequireAuth` são texto neutro centrado (português), sem animações, sem cores novas, sem logo — não são "telas novas" de produto; são estados mínimos exigidos pela regra 3 e não alteram nenhuma tela aprovada (aparecem apenas durante/falha do bootstrap).

---

## 6. Plano de regressão (REG-01 front-side)

### 6.1 Portões de build (executar depois do último diff, registrar exit code)

No diretório `app/`:
1. `npx tsc --noEmit` — zero erro.
2. `npm run build` — script atual já roda `tsc --noEmit && vite build`; saída registra o exit code.

Não há script de teste no front (06-INVENTARIO §"Fatos"); a suíte automatizada desta fatia é o roteiro manual abaixo — criação de infra de teste é proposta futura (§1.2), não incluída silenciosamente.

### 6.2 Roteiro manual contra a API local (dependência: API A1 no ar)

**Pré-condições (A2 depende do A1):** API do A1 rodando localmente na porta do proxy (§4.2), banco migrado, `GET /api/v1/health` → 200. Dados 100% sintéticos (PM regra 10) — ex.: `a2.sintetico@test.invalid` / senha sintética forte. **A credencial fixa antiga não é usada e não é reproduzida.**

| # | Passo | Esperado |
|---|---|---|
| R1 | `curl POST /api/v1/auth/register` (dados sintéticos) | `201` + `{user, organization}` (paridade com contrato A1; sem UI) |
| R2 | Login na UI com os dados de R1 | Erro nenhum; navega para `/whats/overview`; chip do usuário mostra nome/e-mail do servidor |
| R3 | `F5` em `/whats/overview` | Bootstrap `me` → 200; permanece logado (sessão sobrevive ao reload — cookie) |
| R4 | Menu → "Sair" | Volta a `/login`; digitar `/whats/overview` na barra → redirecionado a `/login` (`me` → 401) |
| R5 | Login com senha **errada** repetido até o limite (padrão proposto A1: 5) | Cada tentativa: "E-mail ou senha inválidos."; tentativa seguinte: mensagem de `AUTH_RATE_LIMITED` com tempo de espera |
| R6 | Esperar a janela de bloqueio (ou reiniciar a API local — contador em memória, A1 §5.3) | Login correto volta a funcionar |
| R7 | **Parar a API** e tentar login | Mensagem honesta de conectividade (sem sucesso simulado). Com sessão ativa + API parada: `F5` em `/whats/overview` → tela de erro com "tentar novamente"; subir a API → retry entra |
| R8 | `/forgot-password` | Aviso de indisponibilidade; **aba de rede sem nenhuma requisição** ao abrir/submeter |
| R9 | Semear manualmente `localStorage['orbit.users']`/`['orbit.session']` e recarregar | Chaves legadas removidas pelo bootstrap; sem usuário fantasma; login exige credenciais do servidor |
| R10 | Confirmar `VITE_API_URL` vazia em dev | Todas as requisições em `localhost:5173/api/v1/...` (proxy) — nenhuma direto a outra origem |

### 6.3 Não-regressão visual (UI-02)

- **Zero diff** em `app/src/styles/**` e em classes/estrutura das telas (verificável no diff do PR).
- Capturas antes/depois (build antigo × novo), nas larguras usadas pela Referência (473 e 1440; 360 para login): `/login` padrão, `/login` com erro, `/forgot-password`, header do Layout com usuário logado, saudação do Overview, cabeçalho do Profile. Comparação lado a lado: **idênticas**, exceto o *texto* de erro (mesma classe `sf-auth2-error`) e o conteúdo honesto do ForgotPassword (§3.6).
- Rotear por todas as rotas do inventário 06 e conferir que nada quebrou (dados de produto continuam locais e intactos — `store.tsx` intocado).

### 6.4 Evidência

Tabela esperado/real por passo (R1–R10), exit codes dos portões, capturas nomeadas — sem percentuais de "fidelidade" (PM regra 11).

---

## 7. Riscos e limitações declarados

1. **~~Cookie cross-origin em produção~~ — RESOLVIDO pela decisão D2 do coordenador (§0.1):** a API enviará `SameSite=None; Secure; HttpOnly`; dev usa proxy same-origin e produção usa `VITE_API_URL` absoluta com `credentials:'include'`. Mantido aqui como histórico da pendência encerrada.
2. **`VITE_API_URL` é valor de build:** muda a URL ⇒ rebuild e redeploy do front (A1 §13.6). URL errada ⇒ toda chamada falha (com erro honesto, mas produto inutilizável) — mitigado pelo smoke pós-deploy (A1 §13.7) e R10.
3. **~~Porta local da API proposta (8787)~~ — CONFIRMADA pelo coordenador (§0.2).** Sobrou dele: ajustar via `API_PROXY_TARGET` se o runbook do A1 mudar a porta.
4. **Rate limit em memória (A1 §5.3/§14.4):** o R5/R6 do roteiro pode exigir reinício da API ou espera do bloco proposto (900 s) — flakiness operacional conhecida e declarada.
5. **Quebra coordenada do login antigo:** usuários da sessão local legada (chave `orbit.session`) ficam deslogados e precisam se registrar/logar de novo (não há migração de credencial local → servidor; senha legada existia só como hash SHA-256 no navegador, insuficiente e fora de escopo). Entrada coordenada com a remoção do seed no mesmo PR da fatia (A1 §1.1.6).
6. **`authRegister` sem UI:** export sem consumidor nesta fatia (§3.1) — intencional e documentado; se lint futuro reclamar, resolver sem apagar a função de contrato.
7. **Sem teste automatizado no front:** não existe infra; a regressão desta fatia é build + roteiro manual. Declarado para a auditoria não procurar suíte que não existe (proposta futura registrada, não extra).
8. **Estados do `RequireAuth` não têm design:** são texto neutro (§5) — a etapa final de design (outro responsável, DIR-02/03) pode substituí-los; aqui só precisam ser honestos.
9. **Logout com API fora:** usuário fica logado com erro à vista (§3.7) — comportamento correto por honestidade, mas pode frustrar; registrar como limitação aceita da fatia.
10. **Repositório público:** nenhum valor de `VITE_API_URL`/ porta / credencial aparece em código ou docs (nomes só); `.env` fora do VCS (ENG-09; A1 §14.12).

---

## 8. Mapeamento com a matriz de validação (front-side)

| Critério | O que exige | Como esta fatia atende | Classe de evidência |
|---|---|---|---|
| **UI-01** (estados vazio/erro do login) | Estados distinguíveis e honestos na tela de login | §3.5 (erro por código do servidor com `role="alert"`), §5 (busy/erro/offline distintos; NAV-07); roteiro R5–R7 | E (capturas + roteiro) |
| **UI-02** (regressão home/login) | Não regredir o aprovado | §2 (zero diff em estilos; lista exata de arquivos), §6.3 (capturas antes/depois 360/473/1440 + varredura de rotas) | E+L (diff do PR + capturas) |
| **E2E-01** (login → operação → releitura) | Fluxo ponta a ponta com persistência | **Nesta fatia, limitado a login/logout/me**: R1–R4, R7, R9 (login → reload mantém sessão via `me`; logout → `me` 401 → redirect). "Operação + releitura" sobre dados de produto fica para as fatias com operação de produto (dados seguem locais — §1.2). Limitação declarada. | E (roteiro manual com API real) |
| **AUTH-01** (front-side) | Login aceita/recusa pelo servidor; logout invalida; sessão sobrevive a reload | §3.1–3.5: credenciais validadas **só** no servidor (seed removido); sessão = cookie httpOnly do servidor; `RequireAuth` deriva de `me`; sem papéis nesta fatia (acesso binário, igual ao contrato A1 §12) | E+L (roteiro R1–R7 + código) |

---

**Data:** 08/11/2026 · **Autor:** A2 Front · **Branch:** `a2/foundation` · **Status:** rascunho para revisão do orquestrador — nenhum código escrito nesta etapa, nenhum commit realizado.

---

## 9. Implementação (registro pós-código — 08/11/2026)

### 9.1 Arquivos tocados (lista final real)

| # | Arquivo | Ação |
|---|---|---|
| 1 | `app/src/lib/api.ts` | NOVO — `ApiError`, `apiFetch` (base `VITE_API_URL` relativa, `credentials:'include'`, timeout 15 s com `AbortController`, envelope de erro, códigos cliente `NETWORK_ERROR`/`TIMEOUT`/`BAD_ERROR_BODY`), `authRegister`/`authLogin`/`authLogout`/`authMe` tipados. |
| 2 | `app/src/auth.tsx` | NOVO — `SessionProvider` + `useSession` `{state, signIn, signOut, retryBootstrap}`; bootstrap via `me` (401 `AUTH_UNAUTHENTICATED` → `unauthenticated`; resto → `error`); higiene das chaves legadas `orbit.users`/`orbit.session`. |
| 3 | `app/src/auth.ts` | **APAGADO** — seed de usuário, SHA-256 no cliente e sessão em localStorage removidos por inteiro. |
| 4 | `app/src/main.tsx` | `SessionProvider` montado entre `I18nProvider` e `StoreProvider`. |
| 5 | `app/src/App.tsx` | `RequireAuth` reescrito sobre `useSession` (loading → texto neutro; error → texto + "Tentar novamente" via `retryBootstrap`; unauthenticated → `Navigate /login`). Rotas idênticas. |
| 6 | `app/src/pages/Login.tsx` | Submit via `signIn`; mapa de erro por código (§3.5 + §0.5: inclui `AUTH_EMAIL_TAKEN` → "Este e-mail já está cadastrado."); `VALIDATION_ERROR` usa a mensagem do servidor. Mesmo elemento `sf-auth2-error`, mesmo `busy`, visual idêntico. |
| 7 | `app/src/pages/ForgotPassword.tsx` | Formulário e promessa de envio removidos; parágrafo `sf-auth2-sent` com indisponibilidade declarada; link "Voltar para login" mantido (classe existente); **nenhuma requisição** parte da tela. |
| 8 | `app/src/components/Layout.tsx` | `currentUser()`/`logout()` → `useSession`; "Sair" via `signOut()` com botão desabilitado durante a chamada; falha mantém sessão/menu (sem navegação, sem sucesso simulado). |
| 9 | `app/src/pages/Overview.tsx` | `currentUser()` → `useSession` (fallbacks `'Usuário'`/`''` preservados). |
| 10 | `app/src/pages/Profile.tsx` | Idem. |
| 11 | `app/vite.config.ts` | `server.proxy['/api']` → `process.env.API_PROXY_TARGET \|\| 'http://localhost:8787'`, `changeOrigin: true`. `preview` intocado. |
| 12 | `app/.env.example` | NOVO — `VITE_API_URL=` (vazio) + comentário "em dev com proxy, deixar vazio". |
| 13 | `app/src/vite-env.d.ts` | **NOVO (não previsto na lista do §2 — acréscimo declarado):** referência a `vite/client` + tipagem de `VITE_API_URL`; sem este arquivo `import.meta.env` não passa no `tsc --noEmit` (não havia nenhum `.d.ts` de ambiente no projeto). Zero impacto em runtime. |

**NÃO tocados (confirmado):** `app/src/store.tsx`, `app/src/types.ts`, `app/src/data/seed.ts`, `app/src/i18n*`, `app/src/styles/**` (diff vazio — UI-02), demais páginas/componentes, `/api` (backend A1).

### 9.2 Gates (executados em `app/` após o último diff)

| Comando | Resultado |
|---|---|
| `npm install --no-audit --no-fund` | ✅ 74 pacotes, 5 s |
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run build` (`tsc --noEmit && vite build`) | ✅ 61 módulos, dist gerado (index.html 0,79 kB · CSS 63,23 kB · JS 294,43 kB) |

### 9.3 Verificação estática (no lugar do smoke — sem mocks)

- Único `fetch(` do `app/src` está em `lib/api.ts` (regra §3.1.1 — sem fetch avulso).
- Única referência a `orbit.users`/`orbit.session` é a remoção de higiene no `auth.tsx`.
- `git diff` em `app/src/styles` vazio; nenhuma classe/estrutura de tela alterada (exceções de conteúdo declaradas: texto do erro do login e conteúdo honesto do ForgotPassword, ambos em classes existentes; estados neutros de loading/erro do `RequireAuth` são texto simples, sem CSS novo).
- **Smoke E2E (R1–R10) fica para o orquestrador após o merge, com a API real do A1**: a API ainda não está implementada na worktree `sendflow-wt-a1` (`api/src/routes/auth/*.ts` ausente) e rodar o servidor exigiria `DATABASE_URL` — sem banco local, o servidor não sobe (limite declarado). Nenhum mock foi criado (PM regra 3).

### 9.4 Não-regressão visual

Sem capturas nesta etapa (a API não está disponível para produzir estados autenticados reais); a não-regressão é atestada por diff: zero mudanças em `styles/**` e zero mudanças de classes/estrutura nas telas. Capturas antes/depois (§6.3) ficam para o roteiro do orquestrador com a API no ar.
