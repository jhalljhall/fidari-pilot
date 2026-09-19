# Fidari Pizza &bull; Harper Fabric Vertical Slice

> A production-ready, accessible single-page pizza ordering application built on **Harper 5.x** and deployed to **Harper Fabric**. Developed as a Forward Deployed Engineer (FDE) pilot demonstration.

* **Production URL:** [https://fidari-pilot.2819-studios.harperfabric.com/](https://fidari-pilot.2819-studios.harperfabric.com/)
* **Local Environment:** [http://localhost:9926/](http://localhost:9926/)
* **Repository:** [github.com/jhalljhall/fidari-pilot](https://github.com/jhalljhall/fidari-pilot) (`main`)

---

## 1. Project Intent & Customer Outcome

This vertical slice is an FDE implementation demonstrating how to enter an ambiguous discovery engagement (a sprawling 36-page MVP spec covering driver dispatch, franchise portals, payment processors, and AI chatbots) and reduce it to the **single highest-value customer outcome**:

* **Primary Persona ("Ronnie"):** An older customer who values visual clarity, large tap targets, transparent pricing, and zero cognitive clutter.
* **Core User Journey:** Select an artisan pie &rarr; customize optional toppings with live price updates &rarr; enter name &rarr; place order &rarr; receive an immediate, itemized order receipt with estimated pickup time.
* **Scope Discipline (Explicit Non-Goals):**
  * No customer registration or login friction.
  * No external database tiers (PostgreSQL/MySQL) or ORMs—persistence, queries, and APIs are handled natively by Harper.
  * No third-party payment gateway or delivery dispatch compliance overhead.
  * No multi-page cart redirects or confusing modal overlays.

---

## 2. Architecture & Key Engineering Decisions

```
+----------------------------------------------------------------------------------+
|                             HARPER 5.x UNIFIED RUNTIME                           |
|                                                                                  |
|   +--------------------------+    +-------------------+   +------------------+   |
|   |  Static Web Server       |    |  REST & Custom    |   |  Storage Engine  |   |
|   |  (web/**)                |    |  Resources        |   |  (LMDB / In-Mem) |   |
|   |                          |    |                   |   |                  |   |
|   |  - HTML5 & Vanilla CSS   |    |  - GET /Pizza/    |   |  - tables.Pizza  |   |
|   |  - Vanilla JS App        |--->|  - GET /Topping/  |-->|  - tables.Topping|   |
|   |  - Graphic Novel Art     |    |  - POST           |   |  - tables.Order  |   |
|   |    (/images/pizzas/*.jpg)|    |    /place-order   |   |                  |   |
|   +--------------------------+    +-------------------+   +------------------+   |
|                                                                                  |
|             Zero Network Hops: Database and API share the same memory space       |
+----------------------------------------------------------------------------------+
                                        |
                             Replicated Across Nodes
                                        v
                    +----------------------------------------+
                    |        HARPER FABRIC CLOUD CLUSTER      |
                    |  fidari-pilot.2819-studios.harperfabric |
                    +----------------------------------------+
```

### Architectural Highlights

1. **Unified In-Process Engine:**
   * Harper embeds the database storage engine (LMDB), HTTP/REST server, static asset host, and application runtime in the **same process**. Internal database reads like `tables.Pizza.get(id)` execute with **zero network latency**.
2. **Server-Authoritative Integer Cents Pricing:**
   * All prices are stored and calculated strictly in **integer cents** (`basePriceCents`, `toppingTotalCents`, `totalCents`), completely eliminating IEEE-754 floating-point rounding errors.
   * Client-supplied prices or totals are strictly ignored. The custom Resource recalculates authoritative prices directly from `tables.Pizza` and `tables.Topping`.
3. **Immutable Order Snapshots:**
   * Each order record in `tables.Order` captures historical snapshots of item names and prices at the moment of purchase. Future menu price updates will never alter historical revenue records or receipts.
4. **Declarative CRUD vs Custom Business Logic:**
   * `Pizza` and `Topping` tables are extended via `resources/Pizza.ts` and `resources/Topping.ts` with `allowRead() { return true; }`, allowing public guest menu inspection while keeping mutations 401-protected.
   * Direct access to `tables.Order` is strictly admin-only. Customer orders can only be placed through the validated `POST /place-order` custom Resource (`resources/PlaceOrder.ts`).
5. **AI Graphic-Novel Pizza Art as Static Assets:**
   * High-resolution graphic novel illustrations are pre-generated based on seed IDs and served directly from `web/images/pizzas/` via Harper's static files plugin.

---

## 3. Step-by-Step Checkpoint Completion Walkthrough

The project was executed incrementally through 10 disciplined checkpoints:

### Checkpoint 0: Work Log & Git Setup
* **Objective:** Establish the audit trail, initialize the repository, and configure the GitHub remote.
* **Outcome:** Created [`NOTES.md`](./NOTES.md) tracking assumptions, scope guardrails, snags, and rationales.
* **Snippet:**
  ```sh
  git init
  git branch -M main
  git remote add origin git@github.com:jhalljhall/fidari-pilot.git
  git push -u origin main
  ```

---

### Checkpoint 1: Scaffold & Template Inspection
* **Objective:** Scaffold a pristine Harper 5.2.13 application and inspect the component layout.
* **Outcome:** Scaffolding with `create-harper@latest` revealed:
  * Schemas are defined in `schemas/*.graphql`.
  * Dynamic endpoints are authored in `resources/*.ts`.
  * Static web assets are served from `web/`.
  * Codegen is powered by `@harperfast/schema-codegen`.
* **Snippet (`config.yaml`):**
  ```yaml
  rest: true
  graphqlSchema:
    files: 'schemas/*.graphql'
  jsResource:
    files: 'resources/*.ts'
  static:
    files: 'web/**'
  ```

---

### Checkpoint 2: Local Docker Runtime
* **Objective:** Containerize Harper for local development with hot reloading.
* **Snag & Fix:** Harper's first-run installer prompted for interactive input in Docker (`[ERR_USE_AFTER_CLOSE]`). Resolved by passing unattended installation flags and executing `RUN harper install` inside the `Dockerfile`.
* **Snippet (`Dockerfile` & `docker-compose.yml`):**
  ```dockerfile
  # Unattended non-interactive installation
  ENV HDB_ADMIN_USERNAME=admin \
      HDB_ADMIN_PASSWORD=Password123! \
      ROOTPATH=/root/harper \
      TC_AGREEMENT=yes \
      DEFAULTS_MODE=dev
  RUN harper install
  CMD ["harper", "dev", "."]
  ```
  ```yaml
  services:
    app:
      build: .
      ports:
        - "9926:9926"
      volumes:
        - .:/app
  ```

---

### Checkpoint 3: Early Fabric Deployment
* **Objective:** Authenticate against Harper Fabric and deploy the initial skeleton to the cloud.
* **Snag & Fix:** Origin node deployed, but peer node `ocp-us-east1-b-1` failed because `@harperfast/schema-codegen` was in `devDependencies`. Moving it into `dependencies` in `package.json` resolved production peer replication.
* **Snippet:**
  ```sh
  # Deploy with multi-node replication and auto-restart
  harper deploy restart=true replicated=true
  ```

---

### Checkpoint 4: Add Schema & Prove CRUD
* **Objective:** Model `Pizza`, `Topping`, and `Order` tables in GraphQL and configure access controls.
* **Outcome:** Implemented **Option A**: omitted `@export` from `Pizza` and `Topping` in `schema.graphql` and created TypeScript classes in `resources/` with `allowRead() { return true; }`. Public guests can view the menu unauthenticated, while direct write mutations and direct order access remain strictly 401-protected.
* **Snippet (`schemas/schema.graphql` & `resources/Pizza.ts`):**
  ```graphql
  type Pizza @table {
    id: ID @primaryKey
    name: String!
    description: String
    basePriceCents: Int!
    available: Boolean!
    imageUrl: String
  }
  ```
  ```typescript
  import { tables } from 'harper';

  export class Pizza extends tables.Pizza {
    allowRead() {
      return true; // Public menu inspection
    }
  }
  ```

---

### Checkpoint 5: Menu Seeding & Graphic Novel Art
* **Objective:** Add AI graphic-novel pizza illustrations and an idempotent seed script.
* **Outcome:** Pre-generated artwork saved to `web/images/pizzas/` (`margherita.jpg`, `pepperoni.jpg`, `garden.jpg`). Built `scripts/seed.mjs` using `PUT /{Table}/{id}` upserts to allow safe re-runs without key collisions.
* **Snippet (`scripts/seed.mjs`):**
  ```javascript
  const PIZZAS = [
    { id: 'margherita', name: 'Margherita', basePriceCents: 1200, imageUrl: '/images/pizzas/margherita.jpg' },
    { id: 'pepperoni',  name: 'Pepperoni',  basePriceCents: 1400, imageUrl: '/images/pizzas/pepperoni.jpg' },
    { id: 'garden',     name: 'Garden Veggie', basePriceCents: 1300, imageUrl: '/images/pizzas/garden.jpg' }
  ];

  async function upsert(table, record) {
    await fetch(`${TARGET_URL}/${table}/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(record)
    });
  }
  ```

---

### Checkpoint 6: Custom `PlaceOrder` Resource
* **Objective:** Implement server-authoritative checkout logic, integer cents calculation, and historical snapshots.
* **Snag & Fix:** In Harper, incoming REST requests carry `context.authorize = true`. Overriding `static async post` replaces the default wrapper, so clearing `context.authorize = false` within the method allows internal database reads/writes (`tables.Pizza.get`, `tables.Order.create`) to execute without triggering 401s for guest callers.
* **Snippet (`resources/PlaceOrder.ts`):**
  ```typescript
  import { Resource, tables } from 'harper';
  import crypto from 'node:crypto';

  export class PlaceOrder extends Resource {
    allowCreate() { return true; }
    allowRead() { return true; }

    static async post(target: any, data: any, context: any) {
      if (context) context.authorize = false; // Mark internal lookups as trusted
      const body = (await data) ?? {};

      // 1. Validation
      const customerName = body.customerName?.trim();
      if (!customerName) {
        const err = new Error('Customer name is required');
        err.statusCode = 400;
        throw err;
      }

      // 2. Fetch & verify Pizza
      const pizza = await tables.Pizza.get(body.pizzaId);
      if (!pizza || !pizza.available) {
        const err = new Error(`Pizza not available: ${body.pizzaId}`);
        err.statusCode = 404;
        throw err;
      }

      // 3. Toppings verification & deduplication
      const uniqueToppingIds = [...new Set(body.toppingIds || [])];
      let toppingTotalCents = 0;
      const toppings = [];
      for (const tid of uniqueToppingIds) {
        const topping = await tables.Topping.get(tid);
        if (!topping || !topping.available) {
          const err = new Error(`Topping not found: ${tid}`);
          err.statusCode = 404;
          throw err;
        }
        toppings.push(topping);
        toppingTotalCents += topping.priceCents;
      }

      // 4. Server-authoritative calculation
      const totalCents = pizza.basePriceCents + toppingTotalCents;

      // 5. Immutable snapshot order record
      const order = {
        id: crypto.randomUUID(),
        customerName,
        pizzaId: pizza.id,
        pizzaName: pizza.name,
        toppingIds: toppings.map(t => t.id),
        toppingNames: toppings.map(t => t.name),
        basePriceCents: pizza.basePriceCents,
        toppingTotalCents,
        totalCents,
        status: 'placed',
        createdAt: new Date()
      };

      await tables.Order.create(order);
      return order;
    }
  }

  export class place_order extends PlaceOrder {
    static path = '/place-order';
  }
  ```

---

### Checkpoint 7: Accessible One-Page UI
* **Objective:** Design and build an accessible, senior-friendly single-page interface with high visual contrast.
* **Outcome:** Built `web/index.html`, `web/styles.css`, and `web/index.js` featuring:
  * **Step 1:** Large pizza cards with graphic novel art, description, and base price.
  * **Step 2:** Big checkbox tiles with min 54px touch targets and clear price deltas (`+$1.50`).
  * **Step 3:** Simple customer name input with inline validation.
  * **Live Summary & Total:** Sticky bar updating live total in dollars/cents with polite ARIA announcements (`aria-live="polite"`).
  * **Confirmation Receipt:** Instant receipt view with order reference UUID, itemized breakdown, and total paid.
* **Snippet (`web/index.js` live calculation):**
  ```javascript
  function updateSummary() {
    const baseCents = state.selectedPizza ? state.selectedPizza.basePriceCents : 0;
    let toppingCents = 0;
    state.selectedToppingIds.forEach(id => {
      const topping = state.toppings.find(t => t.id === id);
      if (topping) toppingCents += topping.priceCents;
    });

    const totalCents = baseCents + toppingCents;
    elements.summaryTotalPrice.textContent = `$${(totalCents / 100).toFixed(2)}`;
    elements.placeOrderBtn.disabled = !state.selectedPizza;
  }
  ```

---

### Checkpoint 8: Automated Smoke Test
* **Objective:** Build an end-to-end automated test suite verifying security, calculation, and input validation.
* **Outcome:** Created `test/smoke.test.js` using Node 25's native test runner (`node:test`, `node:assert/strict`).
* **Snippet (`test/smoke.test.js`):**
  ```javascript
  test('Server-Authoritative Pricing & Order Snapshots', async () => {
    const payload = {
      customerName: 'Ronnie Taylor',
      pizzaId: 'margherita',
      toppingIds: ['extra-cheese', 'mushrooms'],
      // Client spoof attempt
      basePriceCents: 10,
      totalCents: 15
    };

    const res = await fetch(`${TARGET_URL}/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 200);
    const order = await res.json();
    assert.equal(order.basePriceCents, 1200);
    assert.equal(order.toppingTotalCents, 250);
    assert.equal(order.totalCents, 1450, 'Client price spoof successfully ignored');
  });
  ```

---

### Checkpoint 9: Deploy Slice to Fabric
* **Objective:** Ship the complete vertical slice to Harper Fabric and verify against the multi-node cloud cluster.
* **Outcome:** Deployed via `npm run deploy`. Seeded Fabric using Bearer token authentication. Executed automated smoke tests directly against `https://fidari-pilot.2819-studios.harperfabric.com/` (6/6 tests passed in 1.1s). Verified live browser flow with browser subagent.
* **Snippet:**
  ```sh
  # Deploy to Fabric cluster
  npm run deploy

  # Seed Fabric cloud
  HARPER_TARGET=https://fidari-pilot.2819-studios.harperfabric.com npm run seed

  # Test Fabric cloud
  HARPER_TARGET=https://fidari-pilot.2819-studios.harperfabric.com npm test
  ```

---

### Checkpoint 10: Documentation & Presentation Notes
* **Objective:** Deliver production-ready documentation and interview walkthrough talking points.
* **Outcome:** Completed `README.md`, `walkthrough.md` with visual artifacts, and `NOTES.md` containing engineering snags, design rationales, and FDE presentation talking points.

---

## 4. Quickstart Guide

### Run Locally with Docker
```sh
cd fidari-harper-pilot

# 1. Start Harper dev container
docker compose up --build -d

# 2. Seed menu
npm run seed

# 3. Run automated tests
npm test
```
Open **[http://localhost:9926/](http://localhost:9926/)** in your browser.

### Test Against Fabric Cloud
```sh
HARPER_TARGET=https://fidari-pilot.2819-studios.harperfabric.com npm test
```

---

## 5. Automated Test Matrix

| Test Suite | Target | Conditions Verified | Result |
| :--- | :--- | :--- | :--- |
| **1. Public Menu & Assets** | `/Pizza/`, `/Topping/`, `/images/...` | Unauthenticated GET returns 200 with full menu and image bytes | **PASS** |
| **2. Access Protection** | `/Order/` | Direct unauthenticated GET/POST returns 401 Unauthorized | **PASS** |
| **3. Input Validation** | `/place-order` | Empty name returns 400; missing/invalid pizza returns 400/404 | **PASS** |
| **4. Authoritative Pricing** | `/place-order` | Spoofed client prices ignored; server calculates exact integer cents | **PASS** |
| **5. Deduplication** | `/place-order` | Duplicate topping IDs deduplicated; price billed only once | **PASS** |

---

## 6. What to Change Next (Production Roadmap)

1. **Real-Time Order Lifecycle:** Transition order status (`placed` &rarr; `baking` &rarr; `ready`) backed by Harper's native WebSocket subscriptions (`Resource.subscribe()`) without client polling.
2. **Multi-Store Inventory:** Introduce a `Store` table with location-based availability and store operating hours.
3. **Formal WCAG 2.1 AA Screen Reader Audit:** Conduct automated axe-core accessibility auditing and VoiceOver testing on iOS/macOS.
4. **CI/CD Promotion Pipeline:** Implement GitHub Actions release workflows with sealed cluster secrets for automated pull deploys.

---

## 7. License & Credits

* **Author:** Justin Hall (Forward Deployed Engineer Candidate)
* **Client:** Fidari Pizza / Harper FDE Evaluation
* **License:** MIT
