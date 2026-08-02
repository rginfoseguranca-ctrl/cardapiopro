# Regras de Desenvolvimento — CardápioPro

## ⚠️ LEMBRETE CRÍTICO: Tudo deve ser feito para TODAS as plataformas

Sempre que implementar uma funcionalidade, ela DEVE funcionar em:

| Plataforma | Stack | Como verificar |
|---|---|---|
| **Web** | React SPA (Vite) | Rotas em `client/src/App.tsx` |
| **Mobile** | React SPA responsivo | CSS media queries (breakpoints: 768px, 480px) |
| **Servidor** | Express (Node.js) | Rotas em `server/src/routes/` |
| **Desktop** | Electron | Fallbacks em `client/src/api/client.ts` com `if (isDesktop) return electronApi.xxx` |

### Checklist obrigatório para cada feature:
- [ ] Servidor: rota REST em `server/src/routes/`
- [ ] Servidor: registrar rota em `server/src/index.ts`
- [ ] Cliente: função API em `client/src/api/client.ts` com fallback desktop
- [ ] Cliente: hook/componente em `client/src/`
- [ ] Web: rota ou tab no dashboard em `client/src/App.tsx` ou `client/src/pages/Dashboard.tsx`
- [ ] Mobile: layout responsivo (testar ≤768px)
- [ ] TypeScript: `npx tsc --noEmit` em client/ e server/
- [ ] Lint: `npx oxlint` em client/

---

## Histórico de Conversas

### 2026-07-28 — Sessão 1: Implementação do PDV

**O que foi feito:**
- Servidor: `routes/pdv.ts` — GET /api/pdv/products (categorias + produtos + complementos mapeados), GET /api/pdv/customers
- Servidor: `routes/tables-ext.ts` — PATCH /api/tables-ext/:id/occupy, PATCH /api/tables-ext/:id/release
- Servidor: rotas registradas em `index.ts`
- Cliente: `hooks/usePdvCart.ts` — Zustand store do carrinho PDV
- Cliente: `api/client.ts` — funções `pdvGetProducts()`, `pdvSearchCustomers()`, `occupyTable()`, `releaseTable()` com fallback desktop
- Cliente: `pages/PDV.tsx` — Página PDV completa com grade de produtos, complementos, carrinho, cliente, descontos, pagamento, pedidos suspensos
- Cliente: `components/DashboardSidebar.tsx` — item "PDV" no menu
- Cliente: `pages/Dashboard.tsx` — tab `pdv` renderiza `<PDV />`
- Cliente: `App.tsx` — rota `/pdv` standalone (acesso direto)
- Mobile: PDV responsivo com toggle "Produtos | Carrinho" em telas ≤768px

**Arquivos criados/modificados:**
- `server/src/routes/pdv.ts` (criado)
- `server/src/routes/tables-ext.ts` (criado)
- `server/src/index.ts` (modificado)
- `client/src/hooks/usePdvCart.ts` (criado)
- `client/src/api/client.ts` (modificado)
- `client/src/pages/PDV.tsx` (criado)
- `client/src/components/DashboardSidebar.tsx` (modificado)
- `client/src/pages/Dashboard.tsx` (modificado)
- `client/src/App.tsx` (modificado)
- `server/src/database.ts` (modificado — migration colunas `is_occupied`, `customer_name`, `customer_phone` em `tables`)

**Correções pós-review:**
- Rota `/pdv` envolta em `ProtectedRoute` para evitar 401 no carregamento
- Servidores agora persistem além do timeout do bash (Start-Process independente)
- Adicionadas colunas faltantes `is_occupied`, `customer_name`, `customer_phone` na tabela `tables` (migration com try/catch)
- `pdvSearchCustomers()`, `occupyTable()`, `releaseTable()` com fallback desktop (electron)
- PDV responsivo com toggle Produtos/Carrinho em ≤768px
- Tratamento de erro no `useQuery` do PDV — mostra mensagem de erro com botão "Tentar novamente" ao invés de "Carregando..." infinito

### 2026-07-31 — Sessão 2: Multi-tenancy (Fases 2 e 3) + adaptação Desktop

**Fase 2 — Isolamento por `store_id` no reescritor SQL (`store-scope.ts`):**
- Bug do INSERT corrigido: `valuesMatch` passou a ser computado sobre `newSql` (e não `trimmed`) e **após** a construção de `newSql` — antes causava `near "(": syntax error` (índices desalinhados) e depois `ReferenceError` (referência antes da declaração)
- Correção acidental: corpo do `adminMiddleware` removido por engano numa edição e restaurado junto com o `resolveStoreScope`
- Escrita sem contexto cai em `store_id 'main'` (design aceito para POSTs públicos sem auth)
- Verificação: 60/60 testes, `tsc --noEmit` limpo (client e server)

**Fase 3 — Contexto de loja nas rotas públicas:**
- `server/src/middleware.ts`: criado `resolveStoreScope` — precedência: JWT válido (não-bloqueante) → header `x-store-slug` → query `store_slug` → query `storeId` → sem escopo (global). `super_admin` recebe `storeId 'main'` mas **sem** `runWithStoreScope` (opera global)
- `server/src/index.ts`: `resolveStoreScope` montado nas rotas públicas (products, orders, promotions, reviews, chat, customers/public, store, coupons, complements, blog, stores); webhooks/notifications/viacep ficam sem escopo
- `server/src/routes/store.ts`: `GET /api/store` expõe `slug` real (nos dois caminhos de resposta)
- `server/src/__tests__/resolve-store.test.ts`: 9 testes via supertest (precedência JWT, super_admin global, token inválido cai para slug, slug/query desconhecidos, sem contexto)
- `server/vitest.config.ts`: `fileParallelism: false` — testes compartilham `data/cardapio.db` e a paralelização gerava `UNIQUE constraint failed`; limpezas defensivas (`DELETE` no `beforeAll`) em resolve-store e store-scope
- `client/src/api/client.ts`: `setActiveStoreSlug()` + header `x-store-slug` no interceptor **só sem token** (dashboard continua escopado por JWT); `StoreSettings.slug?: string`
- `client/src/App.tsx`: estado reativo `routeSlug` + query de settings keyed por slug; `useEffect` deriva o slug da URL e reseta para null fora de `/menu/:slug`; rota `"/menu/:slug"` adicionada (antes era 404 — link do VerMeusLinks quebrado); wrapper `MenuHome` repassa o slug ao `Home`
- `client/src/pages/Home.tsx` / `components/MenuView.tsx`: prop `storeSlug` nas query keys de products/categories/highlights/storeSettings/complementGroups (evita menu "stale" ao navegar entre lojas)
- `client/src/pages/VerMeusLinks.tsx`: usa `settings.slug` real em vez de derivar do nome
- Dashboard continua funcional: login sem restrição de role (qualquer role entra; JWT carrega `user.role`); `invalidateQueries(['storeSettings'])` casa por prefixo e invalida também os menus públicos

**Adaptação Desktop:**
- Schema desktop já tem `store_id`; `company_settings` **não tinha `slug`** — adicionada coluna via `addColumnIfMissing('company_settings', 'slug', "TEXT DEFAULT ''")` em `runMigrations()` (`desktop/src/main/database.ts`)
- `store:get`/`store:update` (ipc-handlers) continuam usando `SELECT *`/UPDATE dinâmico → já retornam `slug` automaticamente; `store:update` não tem mapeamento de slug (vem do servidor)
- Sync desktop autentica via `auth_token`/`server_url` de `sync_metadata` (`auth:login` em `ipc-handlers.ts` guarda token) → token do lojista escopa o sync à loja certa

**Verificação final (tudo verde):**
- Server: 69/69 testes (9 arquivos)
- `npx tsc --noEmit` limpo em server/, client/ e desktop/
- `npx oxlint` em client/: apenas os 2 warnings pré-existentes (`FiltrosAvancadosPanel.tsx:32:46` no-unused-expressions, `Toast.tsx:12:17` only-export-components)

### 2026-07-31 — Sessão 3: PDV arrumado + Tela "Venda Avulsa" (food market)

**Correções dos 3 bugs do PDV:**
- **Desconto manual agora persiste**: `PaymentModal.handleFinish` envia `discount` no `orderData`; `createOrder` ganhou campo `discount?: number`; `server/routes/orders.ts` soma `manualDiscount + couponDiscount` e faz `Math.min(..., subtotal)` (NaN-safe: `(Number(x)||0)`); destructuring renomeado para `manualDiscount` para não colidir com a const local
- **Cupom real (não fachada)**: `DiscountRow` do PDV valida via `validateCoupon(code, subtotal)` com debounce 400ms — aplica valor real (percentual ou fixo), mostra erro inline p/ cupom inválido e feedback "✅ Cupom aplicado"; `validateCoupon` ganhou fallback desktop (consulta local `coupons:list` + regras de ativo/validade/limite/valor mínimo)
- **Mesa obrigatória**: botão "Finalizar" desabilitado + aviso "Informe o número da mesa" quando `orderType==='mesa' && !tableNumber` (no painel e no handleFinish)

**Tela "Venda Avulsa" (novo modo no PDV):**
- `client/src/pages/PDV.tsx`: seletor no topo `[🛒 Venda Avulsa] [🧾 PDV Completo]` (estado `mode`); PDV Completo mantém a UI anterior (grade + carrinho + toggle mobile); conteúdo de loading/erro extraído para `renderContent()`
- `client/src/components/VendaAvulsa.tsx` (novo): grade de produtos estilo food market com foto/nome/preço, filtro por categoria (chips), **busca com leitor de código de barras** (campo autofocus; Enter com código → match exato por `barcode` → adiciona direto e refoca; senão busca por nome), adição rápida (produtos com complementos obrigatórios abrem modal), carrinho compacto com +/−/observação, cliente padrão "Avulso" com busca opcional, desconto %/R$ + cupom validado, pagamento com troco e `paymentStatus:'paid'`, limpa e refoca após finalizar; responsivo ≤768px com toggle Produtos/Carrinho
- `client/src/hooks/usePdvCart.ts`: `coupon` agora tem `couponId?: string`

**Campo código de barras (todas as plataformas):**
- Migração `addColumnIfMissing('products', 'barcode', "TEXT DEFAULT ''")` em `server/src/database.ts` e `desktop/src/main/database.ts`
- `server/routes/products.ts`: `barcode` no `mapProduct`, no POST (INSERT) e no PUT (mapeamento)
- `server/routes/pdv.ts`: já retorna `barcode` via `SELECT p.*`
- `client/src/pages/Dashboard.tsx`: campo "Código de barras (EAN)" no cadastro e edição de produto (envio no create/update)
- `desktop/ipc-handlers.ts`: `barcode` no INSERT e UPDATE de produtos; `orders:create` agora grava `payment_status` (antes caía em 'pending' mesmo com pagamento feito)
- `client/api/client.ts`: `barcode?: string` no tipo `Product` e no `createProduct`; `electron-adapter.mapProduct` mapeia `barcode`

**Verificação final (tudo verde):**
- Server: 74/74 testes (novos: cálculo combinado de desconto com cap/subtotal/NaN-safe no `orders.test.ts`; coluna `barcode` gravando/leitura no `database.test.ts`)
- `npx tsc --noEmit` limpo em server/, client/ e desktop/
- `npx oxlint` em client/: apenas os 2 warnings pré-existentes

### 2026-08-01 — Sessão 4: PDV "Venda Avulsa" minimalista + atalhos de teclado

**Motivação:** usuário achou o PDV anterior com campos demais. Redesenho focado em velocidade (fluxo de caixa/supermercado).

**O que mudou em `client/src/components/VendaAvulsa.tsx` (reescrito):**
- **Fluxo principal limpo**: busca/barcode autofocus + chips de categoria + grade de produtos + carrinho simples (nome, +/−, preço). Removidos do fluxo: observação por item, cliente, notas, desconto e cupom.
- **"Opções" recolhível**: desconto %/R$, cupom (validação mantida com debounce 400ms), cliente com busca rápida e observações do pedido ficam escondidos sob `⚙️ Opções` dentro do carrinho.
- **Barra de caixa fixa (tema escuro)**: sempre visível no rodapé com total grande + nº de itens + botão `💳 Finalizar (F8)`.
- **Atalhos de teclado**: `Enter` na busca = adiciona se for código de barras ou match único (senão bip de erro grave); `F8` = abre pagamento (global, mesmo fora do input); `Esc` = fecha modal/carrinho e refoca a busca; `Enter` no valor recebido = finaliza.
- **Beep via Web Audio** (sem assets): 1 bip curto ao adicionar produto, 2 bips ao finalizar, bip grave em erro (cupom/pedido).
- **Feedback visual na grade**: badge de contador verde no tile do produto (qtd no carrinho) e glow verde ~0.9s no último produto adicionado.
- **Checkout simplificado**: botões grandes 2x2 (Dinheiro em largura total, Pix, Débito, Crédito) + "Fiado" discreto; troco automático; banner verde "✅ Venda finalizada • total • método • nº itens (troco)" por ~3s após a venda.
- **Mobile ≤768px**: grade continua visível; barra de caixa com botão `🛒 n`; tocar abre o carrinho como **bottom sheet** (sem trocar de aba); `CartPanel` compartilhado entre painel desktop e sheet mobile.

**Verificação final (tudo verde):**
- `npx tsc --noEmit` limpo em server/ e client/
- `npx oxlint` em client/: apenas os 2 warnings pré-existentes
- Vite com HMR aplicado sem erros (servidor e client ainda rodando)

### 2026-08-01 — Sessão 5: Refatoração backend — repositories + services (Fases 1 e 2.1)

**Motivação:** eliminar o reescritor de SQL por regex (`store-scope.ts`) em favor de repositories com `storeId` explícito e services com a regra de negócio. Estratégia incremental (manter `server/`/`client/` como estão). Ordem: Fase 1 (fundação) → 2.1 (Catalog+Complement) → 2.2 (OrderService) → 2.5 (Auth) → 2.3/2.4 → 3 (auditoria) → 4 (deletar `store-scope.ts`) → 5 (testes) → 6 (limpeza).

**Fase 1 — Fundação de repositories:**
- `server/src/database.ts`: exportados `rawAll/rawGet/rawRun` (sem reescrita de escopo); `saveDb()` movido para dentro de `rawRun` (persistência centralizada; `dbRun` legado deixa de chamar `saveDb` direto)
- `server/src/repositories/db.ts` (novo): interface `DbHandle` + handle de produção (usa rawXxx)
- `server/src/repositories/base.ts` (novo): `createRepository(table, {allowedColumns})` — INSERT força `store_id` a partir do parâmetro (o payload não sobrescreve), UPDATE/DELETE/SELECT sempre filtram `store_id = ?`, whitelist de colunas protege `id`/`store_id`; `createGlobalRepository` para tabelas sem escopo
- `server/src/repositories/types.ts` (novo): interfaces de entidades
- 16 repositórios: products, categories, orders, customers, complements, coupons, promotions, combos, cash-register, finance, tables, inventory, supplies, loyalty, fixtures (menu público + company_settings/store_settings/stores), global (users/stores/subscriptions/token_blacklist/password_resets)
- Testes: `repositories/__tests__/base.test.ts` (20 testes via sql.js em memória com `DbHandle` injetado) + `isolation.test.ts` (loja B não vê/atualiza/remove dados da loja A)
- Sem mudança de schema nem das rotas legadas — 94/94 testes passando

**Fase 2.1 — CatalogService + ComplementService:**
- Helpers de JOIN nos repositories: `products.listCatalogProducts`/`findCatalogProductById`, `categories.getMaxOrder`, `complements.findAvailableComplementsByGroup`/`listGroupsWithProduct`/`findGroupById`/`findComplementsByIds`
- `server/src/services/CatalogService.ts` (novo): `mapProduct`, menu público (list/listAll/highlights), CRUD de produto e categoria (mesmos DTOs do `routes/products.ts` antigo, incluindo `barcode`)
- `server/src/services/ComplementService.ts` (novo): CRUD de grupos/complementos + `calculateComplementPrice` (maxFree = min do grupo; extraCount; cap em max)
- `server/src/routes/products.ts` e `routes/complements.ts` reescritas usando services (removido `dbAll/dbGet/dbRun` direto); helpers `storeId(req)` (cai em `'main'` quando não há contexto) e `param(req, name)` para o `req.params` do Express 5 (`string | string[]`); whitelist de products inclui `updated_at`
- Fix pré-existente: `planLimitMiddleware` usava `require('../database')` → "Cannot find module '../database'" fora do dist; trocado por imports ESM de `dbGet/dbRun` de `./database`
- `server/src/__tests__/catalog-routes.test.ts` (novo): 7 testes de integração supertest (token JWT por loja + `x-store-slug`); setup cria 1 categoria por loja porque `products.category_id` é `NOT NULL` (comportamento herdado do código original)
- `server/vitest.config.ts`: `fileParallelism: false` + `singleFork: true` (top-level no Vitest 4; `poolOptions` foi removido) — estabiliza OOM intermitente do wasm sql.js nos runs
- Comportamento herdado preservado: leitura pública sem contexto passa a cair em `store_id 'main'` (antes, sem escopo, via global) — mais seguro e sem impacto prático (menu público sempre é chamado com slug/JWT)

**Verificação final (tudo verde):**
- Server: 101/101 testes (12 arquivos; +7 novos de catálogo)
- `npx tsc --noEmit` limpo em server/
- Próxima fase: 2.2 — `OrderService` + migração de `routes/orders.ts` (510 linhas; `registerOrderFinancials`, `decrementInventory`, `validateItems`)

### 2026-08-01 — Sessão 6: OrderService + Auth migrado + git organizado

**Fase 2.2 — OrderService (completada após Sessão 5):**
- `server/src/services/OrderService.ts` (novo, 506 linhas): `createOrder`, `listOrders`, `getOrderById`, `getOrderReceipt`, `updateOrderStatus`, `markPrinted`, `updatePaymentStatus`; move `registerOrderFinancials`, `decrementInventory`, `validateItems` para repositories (finance/supplies/loyalty/delivery/cash-register/printers/notifications)
- `server/src/routes/orders.ts` reescrita usando o service (sem `dbAll/dbGet/dbRun` direto)

**Fase 2.5 — Auth migrado para repositories (fase de alto valor):**
- `server/src/repositories/global.ts`: novos helpers `createSubscription`, `countUsersInStore`, `findUnusedPasswordReset` (filtra `used = 0`), `findUserByEmailInStore`
- `server/src/routes/auth.ts` reescrita sem `dbGet/dbRun`: register usa `storesRepository` + `companySettingsRepository` + `insertUser` + `createSubscription`; login usa `findUserByEmail` + `updateUser` (migração sha256→bcrypt); forgot/reset usam `createPasswordReset`/`findUnusedPasswordReset`/`markPasswordResetUsed`; change-password/me usam `findUserById`; invite usa `findUserByEmailInStore` + `findSubscriptionByStore` + `countUsersInStore`
- Rotas auth não passavam por scope (públicas / JWT inline) → migração sem mudança de comportamento
- `server/src/__tests__/auth-routes.test.ts` (novo): 10 testes supertest do fluxo completo (register/login/me/change-password/invite/forgot/reset)

**Status da refatoração (parada em fases de alto valor):**
- Migradas: products, complements, orders, auth (4 de 39 rotas)
- `store-scope.ts` **permanece** — 29 rotas ainda usam `dbAll/dbGet/dbRun` legado (auth, cash-register, finance, saas-admin, supplies...); só pode ser deletado após migração completa

**Git organizado:**
- Reset do index e commits lógicos por feature/sessão (docs, PDV, Venda Avulsa, tenant, refactor, limpeza+desktop)
- Arquivos compartilhados entre sessões (client.ts, App.tsx, Dashboard.tsx, database.ts, index.ts, middleware.ts) separados via `git add -p`

**Verificação final (tudo verde):**
- Server: 111/111 testes (13 arquivos; +10 novos de auth)
- `npx tsc --noEmit` limpo em server/, client/ e desktop/
- `npx oxlint` em client/: apenas os 2 warnings pré-existentes
- Próxima fase (futura): 2.3/2.4 → 3 (auditoria) → 5 (testes) → 6 (limpeza)

### 2026-08-02 — Sessão 7: `store-scope.ts` deletado (Fase 4 concluída)

**Fase 4 — Fim do reescritor de SQL por regex:**
- `server/src/store-scope.ts` **deletado** (214 linhas) — o isolamento por loja agora é 100% via repositories com `storeId` explícito; nenhuma rota usa mais `dbAll/dbGet/dbRun`
- `server/src/database.ts`: `dbAll/dbGet/dbRun` viram aliases de `rawAll/rawGet/rawRun` (sem reescrita); removido import de `applyStoreScope/getStoreScope`; seed/migrations continuam válidos pois as colunas têm `DEFAULT 'main'`
- `server/src/middleware.ts`: removido `runWithStoreScope` de `authMiddleware` e `resolveStoreScope` — o middleware apenas resolve `req.storeId`/`req.user`; a decisão de escopo (global p/ super_admin vs loja) fica nas rotas (padrão `storeScope()` do `dashboard.ts`)
- `server/src/middleware/plan-gate.ts`: `dbGet` → `findSubscriptionByStore()` de `repositories/global`
- `server/src/__tests__/store-scope.test.ts` deletado (testava o reescritor)
- `server/src/__tests__/resolve-store.test.ts`: reescrito sem `runWithStoreScope` — INSERTs com `store_id` explícito; handler simula rota migrada (`super_admin` → `sid null`, lojista → `storeId`); comportamento atualizado: sem contexto/slug desconhecido a rota migrada cai em `'main'` (não global) — já previsto na Sessão 5
- Commit `5c84220` — `refactor(server): remove store-scope em favor de repositories`

**Verificação final (tudo verde):**
- Server: 97/97 testes (13 arquivos; store-scope.test removido)
- `npx tsc --noEmit` limpo em server/, client/ e desktop/
- Próximas fases (futuras): 2.3/2.4 → 3 (auditoria) → 5 (testes) → 6 (limpeza)

### 2026-08-02 — Sessão 8: Auditoria de isolamento por loja (Fase 3) — correções R1–R9

**Auditoria (subagente explore):** isolamento básico confirmado OK em `base.ts`, services e rotas migradas; achados R1–R9 corrigidos:

- **R1 (crítico)** — `store_settings` tinha PK só por `key` → `INSERT OR REPLACE` sobrescrevia entre lojas. Migration `ensureStoreSettingsCompositeKey()` recria a tabela com `PRIMARY KEY (key, store_id)` (BEGIN/ROLLBACK); CREATE TABLE de novos bancos já com PK composta; `fixtures.ts setStoreSetting` → `INSERT ... ON CONFLICT(key, store_id) DO UPDATE`
- **R2 (crítico)** — webhook iFood (`routes/integrations.ts`) inseria pedido hardcoded em `'main'`. Agora deriva a loja por `store_settings.ifood_merchant_id` (raw), `404 'Merchant não encontrado'` se não achar, e insere com o `storeId` derivado
- **R3 (alto)** — `notifyAll` enviava payload não-sanitizado para streams de *todas* as lojas. `routes/notifications.ts` reescrito: `orderStreams: Map<string, { storeId?: string; set }>` e `globalClients: Map<Response, string>` (KDS escopado); `notifyOrder/notifyAll(data, storeId?)` filtram por loja e sanitizam TODOS os streams; `/stream` e `/order/:id/stream` usam `req.storeId`
- **R4 (médio)** — `processScheduledOrders` em `index.ts` usava `dbAll/dbRun` sem loja. Substituído por `OrderService.confirmScheduledOrders()` (lê via `ordersRepository.raw(null, ...)`, atualiza por `storeId`, `notifyAll(..., storeId)`); `index.ts` perdeu imports `dbAll/dbGet/dbRun`; `/api/notifications` ganhou `resolveStoreScope`
- **R5 (médio)** — UNIQUE globais em `tables.number`, `coupons.code`, `blog_posts.slug` (lojas não podiam repetir mesa #1/código/slug). Migration `rebuildTableWithStoreUnique(table, col)` recria cada tabela com `UNIQUE(col, store_id)` (guarda idempotente via regex no SQL); `auth.ts` catch de `UNIQUE` no invite → `409`
- **R6 (médio)** — refs cruzadas sem validação e JOINs sem filtro de loja: `CatalogService.createProduct/updateProduct` validam `categoryId` da loja; `ComplementService.createGroup/createComplement` validam `productId`/`groupId` (`httpError 400`); `reviews.ts` POST valida produto da loja; JOINs de `listCatalogProducts`/`findCatalogProductById`/`listGroupsWithProduct` ganharam `AND c.store_id = p.store_id` / `AND p.store_id = cg.store_id`
- **R7 (baixo)** — `calculateComplementPrice` usava `complementIds.length`; agora `extraCount = max(0, items.length - maxFree)` (só complementos existentes na loja)
- **R8 (médio)** — `orders.store_id DEFAULT ''` → migration `UPDATE orders SET store_id = 'main' WHERE store_id = ''`
- **R9 (médio)** — `chat.ts` usava `getStoreSetting(null, 'openai_api_key')`; agora `aiReply(storeId, ...)`/`getReply(storeId, ...)` com `req.storeId || 'main'`

**Detalhes técnicos:**
- Bug da rebuild de tabela: `PRAGMA table_info` devolve `dflt_value` como `datetime('now')` **sem** parênteses externos → `DEFAULT datetime('now')` quebrava o CREATE. Fix: `dflt = /\w+\s*\(/.test(v) ? \` DEFAULT (${v})\` : \` DEFAULT ${v}\``
- `server/src/__tests__/audit-isolation.test.ts` (novo, 7 testes): R1 coexistência por loja, R5 mesma mesa #1/cupom, R6 refs cruzadas x3, review cross-store → 400, review válido → 201 (cria stores `SLUG_A/B` p/ o `resolveStoreScope`; app de teste com `express.json()` — sem ele `req.body` fica undefined e a rota dá 500)

**Verificação final (tudo verde):**
- Server: 104/104 testes (14 arquivos; +7 novos de auditoria)
- `npx tsc --noEmit` limpo em server/, client/ e desktop/
- Próximas fases (futuras): 2.3/2.4 → 5 (testes) → 6 (limpeza)

### 2026-08-02 — Sessão 9: Fase 2.3/2.4 concluída + último legado de produção migrado (middleware.ts)

**Situação da Fase 2.3/2.4 (mapeada com subagente explore):**
- As 39 rotas já estavam migradas para repositories/services nos commits `3cd78ff` (12 triviais), `31d2170` (clientes/marketing), `da26ac0` (financeiras), `5815556` (logística/estoque) e `ce5fb35` (finais) — feitos entre as sessões 6 e 7, mas não registrados no AGENTS.md
- `storeId(req)`/`param(req, name)` estão **duplicados** localmente em ~25 rotas (candidato à centralização na Fase 6); SQL cru restante segue o padrão `.raw(storeId, ...)` escopado (correto)

**Desta sessão — `server/src/middleware.ts` migrado (último acesso legado em produção):**
- Removido `import { dbGet, dbRun } from './database'`
- `resolveStoreScope`: `dbGet('SELECT id FROM stores WHERE slug = ?')` → `findStoreBySlug(slug)` (`repositories/fixtures`)
- `planLimitMiddleware`: `dbGet` de subscription → `findSubscriptionByStore()`; contagens → `productsRepository.count(storeId)`, `ordersRepository.count(storeId, "created_at >= DATE('now','start of month')")` e `countUsersInStore(storeId)` (`repositories/global`) — comportamento idêntico, agora com tipos e sem SQL cru
- Resultado: **nenhum código de produção usa mais `dbAll/dbGet/dbRun`** — restam apenas o `database.ts` (aliases internos + migrations/seed) e os `__tests__/*` (setup/teardown)
- Sem dependência circular: repositories não importam `middleware` (só `db.ts` → `../database`)

**Verificação final (tudo verde):**
- Server: 104/104 testes (14 arquivos)
- `npx tsc --noEmit` limpo em server/
- Próximas fases (futuras): 5 (testes) → 6 (limpeza: aliases `dbAll/dbGet/dbRun` no `database.ts` + centralizar `storeId`/`param`)

### 2026-08-02 — Sessão 10: Fase 5 — testes de isolamento das rotas com agregações

**Lacuna coberta:** repositórios já tinham `base.test.ts`/`isolation.test.ts` (isolamento do `createRepository`) e `catalog-routes.test.ts`/`audit-isolation.test.ts` cobriam products/complements/reviews. Faltava validar as rotas que usam **SQL cru `.raw()` com agregações** (SUM/COUNT/JOIN/JSON) — onde um `store_id = ?` esquecido vazaria dados entre lojas.

**`server/src/__tests__/isolation-routes.test.ts` (novo, 11 testes):**
- App de teste com `authMiddleware` + routers (mesmo padrão do `index.ts`); tokens JWT `role:'owner'` por loja; `requireFeature('fiado')` passa pois as lojas de teste não têm assinatura
- **dashboard**: `/summary` (totalOrders/totalRevenue), `topProducts` (json_each de `items` não vaza produto da loja B) e `/recent-orders` isolados por JWT
- **cash-register**: `GET /` balance/totalIn/totalOut e `POST /` gravam só na loja do token
- **fiado**: `GET /` totalPending e lista isolados
- **finance**: `/accounts`, `/transactions` (com JOIN de account/category) e `/summary` (totalIncome) isolados
- **customers**: `GET /` e `/stats/segmentation` (total/highValue) isolados
- Setup cria 2 lojas (`isroute-a/b`) com dados distintos e limpa em `beforeAll`/`afterAll`; seeds via repositories

**Detalhes:**
- `fiado.customer_id` é `NOT NULL` → seeds precisam de `customer_id` (mesmo o POST da rota aceitando sem)
- `created_at` das tabelas usa `datetime('now')` → métricas de "hoje" do dashboard incluem os pedidos de teste (asserções comparam loja A vs B, não absolutos)

**Verificação final (tudo verde):**
- Server: 115/115 testes (15 arquivos; +11 novos de isolamento de rotas)
- `npx tsc --noEmit` limpo em server/
- Próxima fase (futura): 6 (limpeza: aliases `dbAll/dbGet/dbRun` no `database.ts` + centralizar `storeId`/`param`)

### 2026-08-02 — Sessão 11: Fase 6 — centralização dos helpers `storeId`/`param`

**Motivação:** os helpers `storeId(req)` (fallback `'main'`) e `param(req, name)` (Express 5 params `string | string[]`) estavam duplicados localmente em ~24 rotas (marcados como candidatos à centralização na Sessão 9), além de ~38 usos inline de `(req as AuthRequest).storeId || 'main'`.

**O que foi feito:**
- `server/src/routes/helpers.ts` (novo): `storeId(req): string` e `param(req, name): string` — mesmos corpos das versões locais, exportados de um único lugar
- **24 rotas** tiveram a `function storeId` local removida e passam a importar o helper (`abandoned`, `blog`, `campaigns`, `cash-register`, `cashback`, `complements`, `coupons`, `customers`, `customers-public`, `delivery`, `drivers`, `fiado`, `finance`, `inventory`, `invoices`, `loyalty`, `orders`, `printers`, `products`, `promotions`, `reviews`, `supplies`, `tables`, `tables-ext`)
- `products.ts`, `complements.ts`, `orders.ts` também tinham `param` local → removida, agora importam `{ storeId, param }`
- **6 rotas com `const storeId = (req as AuthRequest).storeId || 'main'` inline** passam a importar com alias `import { storeId as getStoreId } from './helpers'` e usam `getStoreId(req)` (evita colisão com a const local): `billing`, `chat`, `integrations`, `notifications`, `pdv`, `store`
- `dashboard.ts`: `const sid = (req as AuthRequest).storeId || 'main'` → `const sid = storeId(req)` (lógica de super_admin do `storeScope()` preservada)
- Imports `AuthRequest` órfãos removidos/limpos do `import ... from '../middleware'` (ex.: `customers-public`, `fiado`, `inventory`, `drivers`, `finance`, `cashback`, `abandoned`, `invoices`, `cash-register`, `printers`, `promotions`, `reviews`, `supplies`, `tables`, `chat`, `integrations`; `{ authMiddleware, ... }` mantém só o que usa)
- **`delivery-areas.ts` NÃO foi tocado** — sua versão tem fallback extra `|| (req.query.storeId as string)` (comportamento preservado, fica local por enquanto)
- `store.ts` também mantém a variante com `req.query.storeId` na rota GET (linha 64)

**Detalhes técnicos:**
- Transformação feita por script Node (`dedupe-helpers.js` em temp, descartável) com regex sobre os corpos exatos; arquivos normalizados para LF (git checkou CRLF após `git checkout`, quebrando as regexes na primeira tentativa)
- Bugs pegos na revisão: inserção de import no meio de bloco import multilinha (products/complements/orders) → o script caminha até o fim do import (`/[;']$/`) antes de inserir; double-space `import {  authMiddleware` vindo de `pre` com espaço inicial → `^\s*,?\s*` no cleanup do import

**Verificação final (tudo verde):**
- Server: 115/115 testes (15 arquivos — sem testes novos, refatoração puramente estrutural)
- `npx tsc --noEmit` limpo em server/
- Próximo item da Fase 6 (futuro): remover aliases `dbAll/dbGet/dbRun` do `database.ts` (linhas ~604–613; export na ~769; usados só internamente e em testes)

**Fim da Fase 6 — aliases `dbAll`/`dbGet`/`dbRun` removidos:**
- `server/src/database.ts`: bloco de aliases (604–615) deletado; usos internos migrados para `rawAll`/`rawGet`/`rawRun` (`addColumnIfMissing`, `runMigrations`, `rebuildTableWithStoreUnique`, `ensureStoreSettingsCompositeKey`, `seedData`); export agora `export { rawAll, rawGet, rawRun }`; `db.run(` diretos (transações/DDL) **não** foram tocados
- 9 arquivos de teste migrados para os nomes `raw*` (imports + usos): `audit-isolation`, `auth-routes`, `auth`, `billing`, `catalog-routes`, `database`, `isolation-routes`, `planGate`, `resolve-store`
- Resultado: **nenhuma referência a `dbAll`/`dbGet`/`dbRun` em todo `server/src`** — só os `raw*` reais (definidos em `database.ts`, usados pelos repositories via `repositories/db.ts`)
- Fase 6 concluída (Fase 4 + 6 já feitas; fases 2.3/2.4, 3 e 5 concluídas nas sessões 9/10 e 8)

**Verificação final (tudo verde):**
- Server: 115/115 testes (15 arquivos)
- `npx tsc --noEmit` limpo em server/
- Refatoração backend (Fases 1→6) concluída: `server/` sem reescritor SQL, sem aliases legados, sem SQL cru fora dos repositories/services/helpers
