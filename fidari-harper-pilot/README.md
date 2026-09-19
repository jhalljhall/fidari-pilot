# Fidari Pizza &bull; Harper Fabric Vertical Slice

> A production-ready, accessible single-page pizza ordering application built on **Harper 5.x** and deployed to **Harper Fabric**. Developed as a Forward Deployed Engineer (FDE) pilot demonstration.

---

## 1. Project Overview & Customer Outcome

This project delivers a complete, verified vertical slice for **Fidari Pizza**, a neighborhood artisan pizzeria. Rather than building a generic proof-of-concept, this implementation focuses on a high-value, accessible customer outcome:

* **Primary Persona ("Ronnie"):** An older customer who values clarity, large touch targets, transparent pricing, and zero cognitive clutter.
* **Core Flow:** Pick an artisan pie &rarr; customize optional toppings with live price updates &rarr; enter name &rarr; place order &rarr; receive an immediate, itemized order receipt with estimated pickup time.
* **Explicit Non-Goals (Scope Discipline):**
  * No customer registration or login barriers.
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

## 3. Local Development (Docker Compose)

The local environment is fully containerized with Docker and hot-reload enabled.

### Prerequisites
* Docker & Docker Compose
* Node.js v20+ & npm (for running host test scripts)

### Running the Container

```sh
cd fidari-harper-pilot

# Start containerized Harper dev server on port 9926
docker compose up --build -d

# Check live container logs
docker compose logs -f
```

Open **[http://localhost:9926/](http://localhost:9926/)** in your browser.

---

## 4. Seeding the Menu

The seed script is idempotent using `PUT /{Table}/{id}` upserts:

```sh
# Seed local container (http://localhost:9926)
npm run seed

# Seed Harper Fabric Cloud cluster
HARPER_TARGET=https://fidari-pilot.2819-studios.harperfabric.com npm run seed
```

**Seeded Menu:**
* **Pizzas:**
  * Margherita &bull; `$12.00` &bull; `/images/pizzas/margherita.jpg`
  * Pepperoni &bull; `$14.00` &bull; `/images/pizzas/pepperoni.jpg`
  * Garden Veggie &bull; `$13.00` &bull; `/images/pizzas/garden.jpg`
* **Toppings:**
  * Extra cheese (`+$1.50`), Mushrooms (`+$1.00`), Pepperoni (`+$2.00`), Bell peppers (`+$1.00`), Black olives (`+$1.00`)

---

## 5. Automated Testing

The native Node test runner verifies security, validation, calculation, and static assets:

```sh
# Test against local container
npm test

# Test against live Harper Fabric cluster
HARPER_TARGET=https://fidari-pilot.2819-studios.harperfabric.com npm test
```

### Test Coverage Matrix
* [x] **Public Menu & Static Assets:** Verifies `/Pizza/`, `/Topping/`, and `/images/pizzas/margherita.jpg` return HTTP 200 unauthenticated.
* [x] **Access Protection:** Verifies unauthenticated direct requests to `GET /Order/` and `POST /Order/` return `401 Unauthorized`.
* [x] **Input Validation:** Confirms empty customer name returns `400`, missing pizza ID returns `400`, and non-existent IDs return `404`.
* [x] **Server Calculation:** Submits client-spoofed totals (`totalCents: 10`) and proves the server overrides client values with exact integer cents ($14.50).
* [x] **Deduplication:** Submits duplicate topping selections and confirms single-count billing.

---

## 6. Deploying to Harper Fabric

Deploying to the live multi-node Fabric cluster is performed directly from the macOS host:

```sh
# Deploy with cluster replication and auto-restart
npm run deploy
```

### Live Public URLs
* **Production App:** [https://fidari-pilot.2819-studios.harperfabric.com/](https://fidari-pilot.2819-studios.harperfabric.com/)
* **Public Menu API:** [https://fidari-pilot.2819-studios.harperfabric.com/Pizza/](https://fidari-pilot.2819-studios.harperfabric.com/Pizza/)
* **Custom Order Endpoint:** `POST https://fidari-pilot.2819-studios.harperfabric.com/place-order`

---

## 7. API Reference

### Public Endpoints

#### `GET /Pizza/`
Returns list of available pizzas with image paths and base price in cents.

#### `GET /Topping/`
Returns list of available toppings with price in cents.

#### `POST /place-order`
Places a validated order. Client submits choices only:

```json
{
  "customerName": "Ronnie Taylor",
  "pizzaId": "margherita",
  "toppingIds": ["extra-cheese", "mushrooms"]
}
```

**Response (200 OK):**
```json
{
  "id": "e290249f-fbe9-40e3-b5e1-a57a33d88baa",
  "customerName": "Ronnie Taylor",
  "pizzaId": "margherita",
  "pizzaName": "Margherita",
  "toppingIds": ["extra-cheese", "mushrooms"],
  "toppingNames": ["Extra cheese", "Mushrooms"],
  "basePriceCents": 1200,
  "toppingTotalCents": 250,
  "totalCents": 1450,
  "status": "placed",
  "createdAt": "2026-09-19T20:45:54.907Z"
}
```

---

## 8. License & Credits

* **Author:** Justin Hall (Forward Deployed Engineer Candidate)
* **Client:** Fidari Pizza / Harper FDE Evaluation
* **License:** MIT
