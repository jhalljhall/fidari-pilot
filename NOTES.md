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

---

## 5. What to Change Next / Production Roadmap
1. Multi-store location selector and inventory-level availability toggles.
2. Order lifecycle status progression (placed -> baking -> out for delivery -> completed) backed by Harper pub/sub or WebSockets.
3. WCAG 2.1 AA formal accessibility audit with screen-reader testing.
4. Promotion pipeline moving from development push deploys to Git-backed automated pull deploys.
