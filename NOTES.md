# Fidari Pizza / Harper FDE Project Work Log (NOTES.md)

**Start Time:** September 19, 2026 ~14:30 EDT  
**Candidate:** Justin Hall  
**Role:** Forward Deployed Engineer (FDE)  
**Project:** Fidari Pizza Vertical Slice on Harper Fabric

---

## 1. Initial Assumptions & Context
- **Candidate Perspective:** FDE exercise demonstrating how to enter an ambiguous customer situation, reduce a sprawling discovery artifact (36-page Fidari MVP) to one core customer outcome, and build a working, reliable vertical slice on Harper.
- **Primary Story:** Older customer pizza ordering journey (clear, simple, low uncertainty, no cognitive overload).
- **Environment:**
  - Host: macOS, Node v25.3.0, npm 11.7.0, Docker 29.8.0.
  - Harper Version: 5.2.13.
  - Target Cloud: Harper Fabric cluster (`fidari.2819-studios.harperfabric.com` on `fabric.harper.fast`).

---

## 2. Explicit Non-Goals (Scope Discipline)
- No user authentication or login flows.
- No third-party payment gateways (Stripe) or compliance overhead.
- No third-party delivery dispatch (DoorDash/UberEats).
- No generic AI chatbots / LLM chat wrappers that distract from Harper's core data & application runtime capabilities.
- No external relational databases (PostgreSQL/MySQL) or ORMs (Prisma/Drizzle)—Harper handles persistence, indexing, and APIs natively.
- No separate backend tier (FastAPI/Express)—Harper handles REST and business logic via custom Resources.
- No complex multi-page cart systems—linear single-page guided checkout.

---

## 3. Key Decisions & Rationales
1. **Integer Cents Pricing:**
   - Money is handled in integer cents (`basePriceCents`, `toppingTotalCents`, `totalCents`) to completely avoid IEEE-754 floating-point rounding bugs.
2. **Server-Authoritative Calculation:**
   - Any client-supplied price or total is ignored. Custom Resource `PlaceOrder` re-fetches the authoritative menu prices from `tables.Pizza` and `tables.Topping` to compute the total.
3. **Historical Order Snapshots:**
   - The `Order` record persists snapshot arrays of names and prices. If menu items or prices change tomorrow, historical customer orders and revenue reports remain accurate.
4. **DevOps Architecture (Docker + Host CLI):**
   - **Local Dev:** Run inside a containerized Docker Compose environment for deterministic, isolated execution with hot reload.
   - **Fabric Deployment:** Run `npx harper login` and `npx harper deploy` from the macOS host, preserving clean credentials handling (`~/.harper`) and zero-friction cloud pushes.
5. **Graphic-Novel Pizza Art as Static Assets:**
   - Generated once via AI based on database seed IDs (`margherita`, `pepperoni`, `garden`) and stored in Harper's static asset directory (`public/images/pizzas/`).
   - The application does not do dynamic image synthesis at runtime; `Pizza.imageUrl` cleanly points to static files served by Harper.

---

## 4. Snags & Resolutions Log
*(Updated dynamically as checkpoints are executed)*

- **Initial Inspection:** Verified Node v25.3.0, npm 11.7.0, Docker 29.8.0. No port conflicts on default Harper ports 9925/9926.
- **Scaffold Findings (Checkpoint 1):**
  - Generated Harper 5.2.13 `vanilla-ts` template.
  - Template structure nuances discovered:
    - Schemas are loaded from `schemas/*.graphql` (configured via `graphqlSchema: files: 'schemas/*.graphql'` in `config.yaml`).
    - Static web assets are served from `web/*` via `static: files: 'web/*'`.
    - Codegen is configured via `@harperfast/schema-codegen` writing to `schemas/globalTypes.d.ts` and `schemas/types.ts`.
    - Generated `.agents/skills/harper-best-practices/` containing official Harper 5.x rules.
- **Dockerization Snag & Resolution (Checkpoint 2):**
  - *Snag:* When starting the container for the first time, Harper's first-run installer prompted for interactive inputs (`Please enter a destination for Harper...`), which crashed in Docker with `[ERR_USE_AFTER_CLOSE]`.
  - *Resolution:* Inspected Harper's `utility/install/installer.js` and discovered that passing `HDB_ADMIN_USERNAME`, `HDB_ADMIN_PASSWORD`, `ROOTPATH=/root/harper`, `TC_AGREEMENT=yes`, and `DEFAULTS_MODE=dev` triggers non-interactive unattended installation. Executed `RUN harper install` inside `Dockerfile`. Container now boots directly into `harper dev .` in under 1 second.
- **Local Verification (Checkpoint 2):**
  - Tested `curl -i http://localhost:9926/` -> `HTTP/1.1 200 OK`.
  - Verified hot-reloading volume mounts from macOS to container.
  - Host Harper CLI verified at `/opt/homebrew/bin/harper` (v5.2.13).
- **Fabric Early Deployment (Checkpoint 3):**
  - *Snag 1 (Placeholder URL):* Template generated `.env` with placeholder `CLI_TARGET='YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE'`, which overrode the login session and failed with `getaddrinfo ENOTFOUND`. Resolved by setting `CLI_TARGET=https://fidari-pilot.2819-studios.harperfabric.com`.
  - *Snag 2 (Deploy Secrets):* Template had `by_ref=true credential=true` which looked for an encrypted cluster git secret. Switched to direct push deploy (`harper deploy restart=true replicated=true`), perfectly matching the FDE pilot strategy.
  - *Snag 3 (Replication Dependency Error):* Origin node deployed, but peer node `ocp-us-east1-b-1.fidari-pilot.2819-studios.harperfabric.com` failed with `Unable to find package @harperfast/schema-codegen`. Reason: `@harperfast/schema-codegen` was in `devDependencies` in `package.json`, which peer node production installs omit. Moved `@harperfast/schema-codegen` into `dependencies`.
  - *Result:* Deployment succeeded across all nodes (`deployment_id: 705171c4-ecf4-4bdd-9b84-a964574ba1fb`), Harper restarted on Fabric, and `curl -i https://fidari-pilot.2819-studios.harperfabric.com/` verified live with `HTTP/1.1 200 OK`!
- **Schema & CRUD Verification (Checkpoint 4):**
  - Added `Pizza`, `Topping`, and `Order` tables in `schemas/schema.graphql`.
  - Configured table extensions in `resources/Pizza.ts` and `resources/Topping.ts`:
    - Omitted `@export` from `Pizza` and `Topping` in `schema.graphql` so the TypeScript Resource classes own the routes.
    - Implemented `allowRead() { return true; }` to permit guest browser access for viewing the menu without credentials.
    - Preserved authentication protection on writes (unauthorized `DELETE` requests return `401 Unauthorized`).
    - `Order` retains `@export` and requires admin credentials for direct REST queries, ensuring customer order data is never publicly exposed.
  - Verified CRUD:
    - Created sample `Pizza` (`margherita`) and `Topping` (`extra-cheese`) via authenticated `POST`.
    - Verified unauthenticated reads on `GET /Pizza/`, `GET /Pizza/margherita`, `GET /Topping/`, and `GET /Topping/extra-cheese`.
    - Verified `GET /Order/` initialized and responding.
- **Menu Seeding & Graphic Novel Art (Checkpoint 5):**
  - Generated AI graphic-novel pizza illustrations for all three pizzas (`margherita.jpg`, `pepperoni.jpg`, `garden.jpg`) and stored them in `web/images/pizzas/`.
  - Configured Harper's static file handler in `config.yaml` to `static: files: 'web/**'` to recursively serve nested directories.
  - *Harper Static Server Nuance:* Harper's static plugin serves `GET` requests; standard `curl -I` (which sends a `HEAD` request) returns 404. Verified static images with `curl -s -o /dev/null -w "%{http_code}"` confirming HTTP 200 and ~1.2MB payloads.
  - Created idempotent seed script `scripts/seed.mjs` using `PUT /{Table}/{id}` upserts to allow clean re-runs without duplicate keys or constraint errors.
  - Added `"seed": "node scripts/seed.mjs"` to `package.json`.
  - Executed `npm run seed`:
    - 3 Pizzas seeded: Margherita ($12.00), Pepperoni ($14.00), Garden Veggie ($13.00) with image URLs.
    - 5 Toppings seeded: Extra cheese ($1.50), Mushrooms ($1.00), Pepperoni ($2.00), Bell peppers ($1.00), Black olives ($1.00).
  - Verified unauthenticated `GET /Pizza/` and `GET /Topping/` return the full seeded menu in JSON with prices strictly in integer cents.
- **Custom PlaceOrder Resource & Server-Authoritative Pricing (Checkpoint 6):**
  - Created `resources/PlaceOrder.ts` extending `Resource` to handle domain checkout logic.
  - *Harper Context Authorization Nuance Discovered:*
    - In Harper REST requests, `request.authorize = true` is initialized on incoming requests. Overriding `static async post(target, data, context)` replaces the default wrapper. The first internal database lookup within the override inherits `context.authorize = true` and would trigger access control against unauthenticated callers for internal table reads.
    - Setting `context.authorize = false` at the top of the custom handler marks internal lookups within the trusted method execution as privileged, while keeping direct table endpoints (`GET/POST /Order/`) protected behind 401 authentication.
  - Added `allowCreate() { return true; }` and `allowRead() { return true; }` to `PlaceOrder` to allow guest access.
  - Implemented both `/place-order` and `/PlaceOrder` routes cleanly.
  - Implemented authoritative business logic:
    - Input validation: Trims and verifies `customerName` (rejects whitespace/empty with 400).
    - Pizza verification: Loads from `tables.Pizza`, validates `available`, returns 404 if not found or 400 if unavailable.
    - Topping verification: Deduplicates IDs, loads each from `tables.Topping`, validates `available`, returns 404 if invalid.
    - Server calculation: `totalCents = basePriceCents + toppingTotalCents` strictly calculated server-side; ignores any spoofed client totals.
    - Snapshot persistence: Writes immutable order snapshot to `tables.Order` with `status: 'placed'`, customer name, and item names.
  - Verification & Test Results:
    - Tested missing customer name &rarr; `400 Bad Request`.
    - Tested missing pizzaId &rarr; `400 Bad Request`.
    - Tested non-existent pizzaId &rarr; `404 Not Found`.
    - Tested non-existent toppingId &rarr; `404 Not Found`.
    - Tested duplicate toppings &rarr; Deduplicated, prices counted once.
    - Tested spoofed client total &rarr; Client values ignored, server computed exact integer cents ($14.00).
    - Direct `GET /Order/` verified protected with `401 Unauthorized`.
- **Accessible One-Page UI (Checkpoint 7):**
  - Designed and implemented a senior-friendly, high-contrast, linear single-page ordering experience in `web/index.html`, `web/styles.css`, and `web/index.js`.
  - Accessible & Cognitive-Load Design Features:
    - Step 1: Select Your Pizza — large interactive cards with graphic-novel pizza illustrations, ingredients description, base price in dollars/cents, keyboard navigation (Tab, Space, Enter), and aria-checked radio states.
    - Step 2: Add Extra Toppings — large checkbox tiles with min 54px touch targets, clear price deltas (+$1.50, +$1.00), and visible active checkmarks.
    - Step 3: Customer Information — single prominent text input for customer name with inline validation and clear error cues.
    - Live Order Summary & Total — sticky order summary dynamically recalculating running total in dollars/cents as items are clicked/toggled, with submit button reflecting live total (`Place Order • $14.50`).
    - Live Screen Reader Announcements — polite live region announcing pizza selection, toppings added/removed, price updates, and order placement.
    - Confirmation Receipt View — clean transition upon order placement displaying order reference UUID, customer name, status badge (`Baking (Placed)`), estimated ready time (~20 minutes), itemized breakdown, total paid, and a "Place Another Order" reset button.
  - End-to-End Automated Browser Subagent Verification:
    - Successfully navigated to `http://localhost:9926/`.
    - Verified all 3 pizzas loaded with graphic novel art.
    - Verified selecting Margherita ($12.00) updated summary.
    - Verified selecting Extra cheese (+$1.50) and Mushrooms (+$1.00) updated total to $14.50.
    - Entered customer name "Ronnie Taylor", submitted order, verified order created in Harper (`tables.Order`), and confirmation receipt displayed with total $14.50 and UUID `342e0e49-b9a1-4f86-b714-5f48823c18a3`.
    - Clicked "Place Another Order" and verified form reset cleanly to initial state.
    - Zero browser console errors throughout entire flow.
- **Automated Smoke Test Suite (Checkpoint 8):**
  - Created native `test/smoke.test.js` exercising the full vertical slice using Node 25's built-in test runner (`node:test`) and assertions (`node:assert/strict`).
  - Automated assertions covering:
    1. Public Menu & Static Assets: Validates `/Pizza/` returns $\ge 3$ pizzas, `/Topping/` returns $\ge 5$ toppings, and static asset `/images/pizzas/margherita.jpg` returns HTTP 200 with non-empty payload.
    2. Table Access Protection: Confirms unauthenticated direct requests to `GET /Order/` and `POST /Order/` return `401 Unauthorized`.
    3. Input Validation & Error Handling: Confirms empty customer name returns `400 Bad Request`, missing pizzaId returns `400 Bad Request`, non-existent pizzaId returns `404 Not Found`, and non-existent toppingId returns `404 Not Found`.
    4. Server-Authoritative Pricing & Snapshots: Submits order with intentional client-spoofed prices (`basePriceCents: 10, totalCents: 15`), verifies server ignores client values, calculates exact integer cents ($14.50), snapshots pizza name & topping names, and sets initial status `placed`.
    5. Deduplication: Submits duplicate toppings in an order, verifies deduplication to 1 topping and prices counted only once.
  - Test Suite execution: 6 tests pass in 203ms with 0 failures (`npm test`). Removed stale counter template files.
- **Deploy Completed Vertical Slice to Harper Fabric (Checkpoint 9):**
  - Executed `npm run deploy` (`harper deploy restart=true replicated=true`):
    - Uploaded application package, static assets, schemas, and custom resources.
    - Successfully built and replicated across Fabric cluster nodes (`fidari-pilot.2819-studios.harperfabric.com` and `ocp-us-east1-b-1.fidari-pilot.2819-studios.harperfabric.com`).
    - Deployment ID: `c95e7834-79b0-450b-bc8f-d24176c9cb1a`.
  - Updated `scripts/seed.mjs` to auto-read Bearer `operation_token` from `~/.harperdb/credentials.json` for Fabric targets.
  - Executed `HARPER_TARGET=https://fidari-pilot.2819-studios.harperfabric.com npm run seed` successfully seeding all 3 pizzas and 5 toppings.
  - Executed full automated smoke test suite against live Fabric:
    `HARPER_TARGET=https://fidari-pilot.2819-studios.harperfabric.com npm test` &rarr; 6 passed in 1069ms!
  - Executed live browser subagent test against public HTTPS URL:
    `https://fidari-pilot.2819-studios.harperfabric.com/`
    - Verified Pepperoni + Bell peppers order for "Justin Hall" placed cleanly with total $15.00.
    - Verified instant receipt view with order reference UUID.
    - Confirmed 0 console errors in cloud production.

---

## 5. What to Change Next / Production Roadmap
1. **Real-Time Order Lifecycle (Harper Pub/Sub / WebSockets):**
   - Status progression (`placed` &rarr; `baking` &rarr; `out_for_delivery` &rarr; `completed`).
   - Subscribe browser client directly to `/Order/:id` via Harper's native WebSocket / SSE subscription (`Resource.subscribe()`) for live kitchen progress without polling.
2. **Multi-Store & Inventory Management:**
   - Add `Store` table with store-specific inventory and active availability toggles.
   - Geographic store finder and delivery radius validation.
3. **Formal WCAG 2.1 AA Audit & Localization:**
   - Formal axe-core automated audit and voiceover screen reader testing on mobile/tablet.
   - Multi-language support (English / Spanish) for neighborhood demographics.
4. **Automated CI/CD Promotion:**
   - Switch from CLI push deployments to Git-backed automated pull deployments triggered on release tags (`v*.*.*`) using GitHub Actions and Harper's encrypted sealed-secret store.

---

## 6. FDE Presentation Walkthrough & Key Talking Points

### Narrative & Customer Alignment
* **Entering Ambiguity:** The original Fidari discovery document was a sprawling 36-page MVP spec covering driver dispatch, multi-store franchise portals, Stripe processing, and chatbot interfaces. An effective FDE cuts through the noise: what is the single highest-value transaction? A customer ordering pizza.
* **Persona Ronnie:** Focus on an older customer where high contrast, clear visual feedback, large tap targets, and lack of unexpected friction build trust immediately.
* **Why Not an External DB/ORM?** In traditional stacks, you set up PostgreSQL, Prisma, Redis, Express/FastAPI, and Nginx. Harper replaces that entire multi-tier complexity with one unified engine where storage, caching, APIs, and business logic live in the same runtime.

### Technical Deep-Dive & Architecture Choices
1. **Integer Cents vs IEEE-754 Floats:**
   * Money is never represented as floats (`12.00`). All storage and calculations use integer cents (`1200`). Prevents cumulative precision errors in commerce systems.
2. **Server-Authoritative Calculation vs Trusting the Client:**
   * Any client-sent totals or prices are discarded. `PlaceOrder.post` loads fresh menu prices from LMDB storage and computes the authoritative order total server-side.
3. **Historical Snapshot Arrays:**
   * Instead of only storing foreign keys to menu items, `Order` persists name and price snapshots. If menu prices change next week, past orders and financial auditing remain 100% accurate.
4. **Table Extensions vs Custom Resources:**
   * **Extended Tables (`Pizza.ts`, `Topping.ts`):** Used for domain entities that map to tables, extending them to customize authorization (`allowRead() { return true; }`) while inheriting Harper's declarative REST engine.
   * **Custom Resource (`PlaceOrder.ts`):** Used for transactional workflows that coordinate multiple models, enforce business rules, calculate totals, and record snapshots.
5. **Harper Fabric Clustering:**
   * Built-in peer replication across geographically distributed nodes with zero manual database clustering or replication software needed.
