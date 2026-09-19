# Fidari Pizza / Harper FDE Coding Challenge

## Gemini Build Handoff for Justin Hall

**Prepared:** September 18, 2026  
**Purpose:** Give Gemini the context, scope, architecture, execution order, and guardrails needed to help Justin build and deploy the Fidari Pizza vertical slice as a Harper application.

---

## 1. Your Role

Act as Justin's technical pair, implementation assistant, and reviewer.

Help Justin build this project locally, prove each capability, deploy it to Harper Fabric, and prepare a concise live walkthrough. Do not replace Justin's judgment or silently make major architectural decisions. Explain material choices, surface uncertainty, and keep the project small enough to complete in a few focused hours.

Work one verified checkpoint at a time:

1. Inspect.
2. Explain what you found.
3. Propose the smallest next change.
4. Implement it with Justin's approval.
5. Run the relevant verification.
6. Report the result before expanding scope.

If a command fails, diagnose that failure before stacking more changes on top of it.

## 2. Truth Hierarchy

When information conflicts, use this order of authority:

1. The official Harper coding-challenge prompt.
2. Current official Harper documentation and the installed/generated Harper application.
3. The behavior of Justin's Harper Fabric cluster.
4. This handoff.
5. The older Fidari MVP document.
6. Assumptions or remembered examples.

Harper is evolving quickly. Verify Harper-specific syntax and commands against current official documentation before implementing them. Do not rely on old HarperDB tutorials when the Harper 5.x documentation or generated template differs.

## 3. Candidate and Interview Context

Justin is interviewing for a Forward Deployed Engineer role at Harper. His career throughline is not simply writing code. He repeatedly enters ambiguous situations, discovers the actual problem, brings stakeholders and systems together, architects a practical solution, builds it, and turns ambiguity into usable value.

This exercise should leave the interview panel with this impression:

> I would trust Justin to sit down with an enterprise customer, figure out what actually needs to be built, use Harper intelligently, ship it, explain it, and leave both the customer and the FDE practice better than he found them.

The coding challenge mirrors a small customer pilot. Harper wants a small working application, deployed to Fabric, followed by a conversation about why it was built, how Harper was used, what went wrong, what was surprising, and what Justin would change.

The panel is expected to include:

- Jeff, SVP of Customer Success
- Marianne Dillard, Lead Field Architect and hiring manager
- A Harper Forward Deployed Engineer

This is a software exercise and a customer-engagement simulation.

## 4. Authoritative Challenge Requirements

The official challenge asks Justin to build something small on Harper, deploy it to Fabric, and walk the panel through it.

At minimum, the application must:

- Define at least one table in Harper using a schema Justin wrote.
- Read and write through Harper's Resource API.
- Avoid using a separate database or ORM.
- Run as a Harper component on Fabric.
- Deploy the application itself to Harper, rather than hosting an external application that merely calls Harper.

Harper explicitly says:

- The idea is Justin's choice.
- The project should be finishable and explainable.
- Thought process matters more than visual polish.
- Using a coding assistant is encouraged because that reflects Harper's normal workflow.
- Extra Harper features should be used only when they help the application.
- The exercise should take a few hours, not an entire weekend.
- An unfinished project with a clear explanation is better than a polished but vague project.

The submission itself is only:

1. The link to the deployed Fabric application.
2. Justin's availability during the following week.

The final interview is 45 minutes:

- Approximately 15 minutes for Justin's presentation.
- Approximately 15 minutes for panel questions.
- Approximately 15 minutes for Justin's questions.

The presentation should include:

- A live walkthrough of the deployed application.
- Why Justin built it.
- What went wrong.
- What surprised him.
- What he would do differently.

No slide deck is required.

## 5. Why Fidari Is the Right Project

The Fidari Pizza document is an older, broad customer-discovery and MVP artifact. It contains personas, goals, stories, workflows, architecture ideas, multiple technology stacks, many integrations, and far more scope than this challenge permits.

That makes it useful discovery input.

The FDE story is:

> I started with a real discovery artifact containing a broad and sometimes contradictory MVP. I treated it as customer input rather than a literal implementation specification, returned to the primary user outcome, and redefined the smallest useful pilot around Harper.

The original document contains conflicting implementation ideas, including RedwoodJS/Node/GraphQL/PostgreSQL in one section and React/Tailwind/FastAPI/PostgreSQL/GraphQL in another. It also mixes a target audience over 70 with a 63-year-old persona. Do not try to reconcile every statement. These inconsistencies demonstrate why an FDE must distinguish customer outcomes from accumulated implementation ideas.

The old architecture also proposed a web app, separate database, AI chatbot, payment gateway, delivery service, logging service, analytics service, and admin dashboard. The Harper pilot intentionally tests how much of the necessary application surface can be collapsed into one coherent Harper component.

## 6. Selected User Story

Use the Fidari story:

> As a Grumpy Grandpa, I want to order a pizza with ease so that I can have a pleasant checkout and no one gets yelled at.

Use a respectful product description in the application and README:

> As an older customer, I want to customize and submit a pizza order through a simple, guided interface so that ordering requires minimal effort and little uncertainty.

"Grumpy Grandpa" can remain in the discovery notes because it is the original story, but the user-facing experience should not stereotype or patronize older customers.

## 7. Pilot Goal

Build one customer-visible vertical slice in which a guest customer can:

1. View available pizzas.
2. Choose one pizza.
3. Add or remove available toppings.
4. See a clear running total.
5. Enter a name.
6. Submit the order.
7. Receive an order confirmation.

An operator or reviewer must also be able to retrieve the saved order through Harper's Resource API.

The key proof is:

```text
Accessible browser UI
        -> custom Harper PlaceOrder Resource
        -> server-side validation and price calculation
        -> Harper Order table
        -> confirmation and retrievable record
```

## 8. Definition of Done

The pilot is done when all of the following are true:

- The application runs locally as a Harper application.
- The UI and backend behavior are part of the Harper component.
- Harper owns the data model and persistence.
- At least the `Pizza`, `Topping`, and `Order` tables exist in `schema.graphql`.
- The menu can be read through Harper Resources.
- Test menu records can be created or updated through Harper Resources.
- A custom Resource accepts an order request.
- The custom Resource validates the selected pizza and toppings.
- The custom Resource ignores any client-supplied price and calculates the authoritative total on the server.
- The order stores a price/name snapshot so later menu changes do not rewrite the historical order.
- The custom Resource writes the order through Harper's Resource/table API.
- The UI completes the selected story from menu through confirmation.
- The saved order can be retrieved through Harper's Resource API.
- At least one invalid-order path returns a clear client error without writing an order.
- The same application is deployed to Justin's Harper Fabric free-tier cluster.
- The public Fabric URL can complete the story.
- No credentials or secrets are committed or embedded in browser code.
- A short README explains local run, verification, deployment, architecture, scope, tradeoffs, and known limitations.

## 9. Explicit Non-Goals

Do not add these unless the core story is complete, deployed, verified, and there is a compelling Harper-specific reason:

- Authentication or user registration
- OAuth
- Stripe or any real payment processing
- DoorDash or delivery integration
- AI chatbot or voice ordering
- OpenAI integration
- HubSpot or marketing
- Email notifications
- Coupons or loyalty programs
- Cart subsystem
- Saved favorites or reorder history
- Order tracking workflow
- Analytics dashboard
- Admin dashboard
- Multiple stores
- Full inventory management
- Kafka, Redis, PostgreSQL, FastAPI, Express, Prisma, or another backend/data layer
- Complex CI/CD, GitFlow, Terraform, or separate dev/test/prod environments
- Microservices
- Elaborate artwork, animations, or a large component library
- Caching, replication, MCP, or pub/sub merely to claim feature coverage

These are deliberate scope decisions, not forgotten work.

## 10. Timebox and Priority Order

Aim for a healthy end-to-end result in approximately three to five focused hours after the local and Fabric setup is working.

Use this priority order:

1. A minimal Harper application starts locally.
2. A trivial application deploys to Fabric and responds.
3. The Fidari schema and menu data work through Resources.
4. Server-side order placement works.
5. The accessible UI completes the story.
6. Local smoke tests pass.
7. The final application deploys and passes the same smoke test on Fabric.
8. README and presentation notes are tightened.
9. Optional improvements only if time remains.

Do not spend the first several hours polishing a UI before proving Fabric deployment.

## 11. Environment Already Verified

Justin's Mac currently reports:

```text
Node: v25.3.0
npm: 11.7.0
git: 2.50.1 (Apple Git-155)
```

Current Harper documentation supports Node Current, Active LTS, or Maintenance LTS. Node 25.3.0 is therefore acceptable unless the installed CLI or generated project reports a concrete incompatibility. Do not downgrade Node preemptively.

Justin has already created a Harper Fabric account.

## 12. Current Harper Mental Model

Use Harper 5.x and the current `HarperFast` ecosystem.

For this exercise, think of Harper as a unified application runtime containing the application and data layer rather than as a database placed beside a conventional backend.

Important concepts:

- `schema.graphql` declares Harper tables and their fields.
- `@table` defines a table.
- `@primaryKey` defines its primary key.
- `@export` exposes Harper's default table Resource when appropriate.
- `config.yaml` enables and configures plugins such as the GraphQL schema, REST, and JavaScript/TypeScript Resources.
- Table Resources provide the normal data behavior.
- Custom Resource classes provide business logic and can map methods such as `get`, `post`, `put`, `patch`, and `delete` to HTTP behavior.
- `@export` should not conflict with a custom class exported under the same Resource name.
- Harper can run `.ts` Resource files directly with Node's built-in type stripping on supported Node versions; TypeScript constructs requiring transformation should be avoided.
- `harper dev .` runs and watches a local application.
- Fabric supports push and pull deployment. Push deployment is appropriate for this timeboxed experiment; pull/tagged deployment would be preferable for a production workflow.

Official references to consult:

- Getting started: <https://docs.harperdb.io/learn/getting-started/install-and-connect-harper>
- First application: <https://docs.harperdb.io/learn/getting-started/create-your-first-application>
- Application depth: <https://docs.harperdb.io/learn/developers/harper-applications-in-depth>
- Schema reference: <https://docs.harperdb.io/reference/v5/database/schema>
- Resources overview: <https://docs.harperdb.io/reference/v5/resources/overview>
- JavaScript/TypeScript environment: <https://docs.harperdb.io/reference/v5/components/javascript-environment>
- Fabric: <https://fabric.harper.fast>

When examples and the generated project disagree, inspect the generated project and current docs before editing.

## 13. Recommended Project Shape

Recommended repository/application name:

```text
fidari-harper-pilot
```

Start with Harper's current TypeScript-capable vanilla template if it remains available:

```bash
npm create harper@latest fidari-harper-pilot -- --template vanilla-ts
```

Do not assume the generator's output. After scaffolding, inspect:

- `package.json`
- `config.yaml`
- `schema.graphql`
- all Resource files
- frontend/static/SSR entry points
- generated skill or agent-instruction files
- README and scripts

Preserve the template's intended method of serving the frontend. Do not create an external Vite deployment, separate API server, or second database.

The final structure should remain close to what the scaffold generates. A conceptual target is:

```text
fidari-harper-pilot/
├── config.yaml
├── schema.graphql
├── package.json
├── resources/
│   └── place-order.ts
├── src/ or public/              # follow the generated template
│   ├── application UI
│   └── styles
├── scripts/                     # only if useful
│   └── deterministic menu seed
├── README.md
└── NOTES.md                     # brief decision/learning log
```

Do not force this layout if the template uses a different current convention.

## 14. Target Data Model

Use money in integer cents. Do not use floating-point dollars for authoritative pricing.

### Pizza

Suggested fields:

```graphql
type Pizza @table @export {
  id: ID @primaryKey
  name: String!
  description: String
  basePriceCents: Int!
  available: Boolean!
}
```

### Topping

Suggested fields:

```graphql
type Topping @table @export {
  id: ID @primaryKey
  name: String!
  priceCents: Int!
  available: Boolean!
}
```

### Order

Suggested fields:

```graphql
type Order @table @export {
  id: ID @primaryKey
  customerName: String!
  pizzaId: ID!
  pizzaName: String!
  toppingIds: [ID]
  toppingNames: [String]
  basePriceCents: Int!
  toppingTotalCents: Int!
  totalCents: Int!
  status: String! @indexed
  createdAt: Date!
}
```

Validate the exact field syntax against the installed Harper version before committing it. Current Harper documentation uses `Date`, not `DateTime`, for a JavaScript Date value.

### Why Snapshot Order Data?

The order stores the selected IDs and snapshots of the names/prices. This is a small but meaningful business decision: if a menu item is renamed or repriced tomorrow, yesterday's order should still reflect what the customer bought and paid at the time.

### Why No OrderItem Table?

An `OrderItem` or normalized join table may be appropriate for a fuller commerce system. It is unnecessary for this single-pizza pilot and would add extra writes and presentation complexity without proving a new customer outcome. Document this as a conscious tradeoff.

### Seed Menu

Create a deterministic, small menu through Harper's Resource API. For example:

- Margherita - $12.00
- Pepperoni - $14.00
- Garden - $13.00

Toppings:

- Extra cheese - $1.50
- Mushrooms - $1.00
- Pepperoni - $2.00
- Bell peppers - $1.00
- Olives - $1.00

Use stable IDs such as `margherita`, `pepperoni`, `garden`, `extra-cheese`, and `mushrooms`. Seeding should be idempotent so it is safe to run again.

## 15. Custom PlaceOrder Resource

Straightforward menu and order inspection can use Harper's default exported table Resources. Add one custom Resource for domain behavior:

```text
POST /place-order
```

The implementation must use the current Harper Resource APIs and must be verified against the installed type definitions and official examples. Conceptually it should:

1. Await and parse the request body.
2. Normalize and validate `customerName`.
3. Require one `pizzaId`.
4. Load the pizza from `tables.Pizza`.
5. Reject a missing or unavailable pizza.
6. Normalize `toppingIds` to an array.
7. Reject duplicate topping IDs or deliberately deduplicate them and document the behavior.
8. Load every selected topping from `tables.Topping`.
9. Reject any missing or unavailable topping.
10. Calculate `basePriceCents`, `toppingTotalCents`, and `totalCents` on the server.
11. Generate an order ID, preferably with `crypto.randomUUID()` if available in the Resource environment.
12. Set a simple initial status such as `placed`.
13. Set `createdAt` on the server.
14. Write the order through `tables.Order` / Harper's Resource API.
15. Return a concise confirmation object containing the saved order.

The browser request should contain only customer choices, for example:

```json
{
  "customerName": "Ronnie",
  "pizzaId": "margherita",
  "toppingIds": ["mushrooms", "extra-cheese"]
}
```

Do not trust or accept an authoritative client-supplied total.

Use appropriate HTTP behavior:

- `400` for malformed input.
- `404` when a referenced menu item does not exist, if that distinction is easy to support.
- A successful created response using the mechanism current Harper Resources support.
- Clear, non-sensitive error messages.

In a Harper Resource, current documentation uses `error.statusCode`, not `error.status`, to influence an error response status. Verify that behavior before relying on it.

### Important Export Rule

The custom endpoint is separate from the default `Order` table Resource, so `Order @export` can remain. If Gemini instead extends `tables.Order` and exports the subclass using the same Resource name, remove the schema's `@export` for that table to prevent conflicting endpoints.

Prefer the separate `PlaceOrder` Resource because it makes the demo distinction clear:

- Harper-generated CRUD for direct resource operations.
- A custom Harper Resource for customer-specific business logic.

## 16. Accessible One-Page UI

The interface should be a single linear ordering journey. It should feel intentional, not elaborate.

Required states:

- Loading menu
- Menu load failure with retry
- Pizza selected
- Toppings selected/unselected
- Running total
- Submitting order
- Validation or server error
- Order confirmation

Design expectations:

- Semantic HTML.
- One clear page heading.
- Large readable text, approximately 18px body text where practical.
- Touch targets at least 44 by 44 CSS pixels.
- Strong color contrast.
- Visible keyboard focus.
- No interaction that requires a mouse.
- Pizza options grouped with a `fieldset` and `legend` or equivalent accessible semantics.
- Topping controls with visible labels.
- Currency formatted with `Intl.NumberFormat`.
- A clear primary `Place order` button.
- The button is disabled while required data is missing or a request is in flight.
- Errors are associated with the relevant control when possible.
- Submission errors and confirmation use an appropriate live region.
- No modal, carousel, hover-only help, tiny icons, or multi-page checkout.
- Avoid patronizing language about age.

The UI should fetch the menu and submit the order through same-origin Harper endpoints. Do not embed Fabric administrative credentials in frontend code. Configure only the public access required for the demo, and keep write exposure limited to what the pilot needs.

## 17. Implementation Sequence and Checkpoints

### Checkpoint 0 - Start a Minimal Work Log

Before coding, create a short `NOTES.md` with:

- Start time.
- Initial assumptions.
- Explicit non-goals.
- Decisions made.
- Snags and resolutions.
- What Justin would change next.

This is not a polished deliverable. It is raw material for the final interview discussion.

Initialize Git and use small, meaningful commits. A simple `main` branch is enough.

### Checkpoint 1 - Scaffold and Inspect

Run the current scaffold command. Do not immediately rewrite the generated application.

Report:

- What files were created.
- How the application serves its frontend.
- How Resources are registered.
- How the schema is loaded.
- Available npm scripts.
- Any Harper-provided agent skill/instruction files.
- Any differences from this handoff.

Commit the untouched scaffold or the smallest working baseline.

### Checkpoint 2 - Run the Generated Application Locally

Install Harper if it is not already available, following current official docs:

```bash
npm install -g harper
```

Run the application from its directory:

```bash
harper dev .
```

Verify the documented local URL and health/application behavior. Record the actual ports and URLs rather than assuming them.

Do not proceed until the generated application works locally.

### Checkpoint 3 - Prove Fabric Deployment Early

Before building the entire feature, deploy the smallest working scaffold or a trivial test Resource to Fabric.

Current official documentation shows a push flow conceptually like:

```bash
harper login <FABRIC_CLUSTER_URL>

harper deploy \
  target=<FABRIC_CLUSTER_URL> \
  project=fidari-harper-pilot \
  restart=true \
  replicated=true
```

Verify the current Fabric UI, CLI parameters, project name, authentication, and free-tier behavior before running the deploy. Never write credentials into scripts, source files, or chat transcripts.

Success criteria:

- Fabric receives the application.
- The cluster restarts successfully if required.
- A deployed endpoint or page responds.
- The public application URL is identified.

Record any deployment surprise in `NOTES.md`.

### Checkpoint 4 - Add Schema and Prove CRUD

Add the three tables to `schema.graphql` and ensure `config.yaml` enables the relevant current plugins.

Current docs use a shape similar to:

```yaml
graphqlSchema:
  files: 'schema.graphql'
rest: true
```

For TypeScript Resources, current docs use a shape similar to:

```yaml
jsResource:
  files: 'resources/*.ts'
```

Adapt this to the generated template instead of duplicating configuration blindly.

Restart/reload and verify:

- Harper recognizes all three tables.
- A Pizza record can be written through its Resource.
- The same Pizza can be read back.
- A Topping can be written and read.
- An Order Resource exists for later inspection.

Use the API behavior and ports reported by the running application. The current first-application guide typically exposes REST on port `9926`, but the actual generated configuration is authoritative.

Commit the schema and verified CRUD baseline.

### Checkpoint 5 - Add Deterministic Menu Data

Seed the small menu through Harper's Resource API. Do not bypass Harper by writing storage files directly.

Verify:

- Re-running the seed does not create duplicate records.
- Menu reads return only the expected fields.
- Availability can be represented.
- Prices are integer cents.

### Checkpoint 6 - Implement PlaceOrder

Implement the smallest custom Resource that satisfies the domain rules.

Test it directly before connecting the UI.

Required direct tests:

1. Valid pizza with no toppings.
2. Valid pizza with multiple toppings.
3. Unknown pizza.
4. Unknown topping.
5. Missing or blank customer name.
6. Duplicate topping behavior.
7. A deliberately fake client total is ignored if the payload contains one.
8. Successful order is retrievable from `Order`.
9. Failed order does not create an `Order` record.

Verify the arithmetic using exact integer totals.

Commit once the API slice works independently.

### Checkpoint 7 - Build the One-Page UI

Use the scaffold's frontend path and same-origin URLs.

The simplest UI flow is:

```text
Choose a pizza
    -> choose optional toppings
    -> enter name
    -> review total
    -> place order
    -> show confirmation number and summary
```

Do not add navigation or secondary pages. Do not spend time sourcing pizza photography. Clear hierarchy and usability matter more.

Test with keyboard-only navigation and at narrow and wide viewport widths.

### Checkpoint 8 - Add Focused Automated Verification

Use the existing project test setup if one is generated. If not, prefer a small number of low-dependency tests rather than introducing a large framework.

Highest-value automated tests:

- Total calculation.
- Rejection of unknown menu IDs.
- Rejection of blank customer name.
- Successful order shape and price snapshot.

A repeatable smoke-test script using the deployed HTTP endpoints is also valuable. Do not fake Harper calls in the only integration test; at least one test should exercise the real running Resource path.

### Checkpoint 9 - Deploy the Completed Slice

Push the same working application to Fabric.

Then test the deployed application as a reviewer would:

1. Open a private/incognito browser window.
2. Load the public application URL.
3. Complete a valid order.
4. Confirm the response.
5. Retrieve that order through the Resource API or Fabric tooling.
6. Try one invalid request.
7. Refresh and complete the flow again.
8. Inspect browser console and Fabric logs for errors.

Do not call deployment complete because the CLI exited successfully. The public story must work.

### Checkpoint 10 - Tighten Documentation and Stop

Update `README.md` with:

- Problem and selected story.
- Why Fidari was chosen.
- Scope and non-goals.
- Architecture.
- Data model.
- Generated Resources versus custom PlaceOrder Resource.
- Local setup and run commands.
- Seed and verification commands.
- Fabric deployment approach.
- Accessibility choices.
- Tradeoffs and limitations.
- What would come next in a real engagement.

Remove unused generated demo code, but do not start a broad refactor. Stop when the Definition of Done passes.

## 18. Verification Checklist

Use this as the final gate.

### Harper Usage

- [ ] `schema.graphql` contains Justin's data model.
- [ ] Tables are Harper tables.
- [ ] Menu data is read through Harper Resources.
- [ ] Menu data can be written through Harper Resources.
- [ ] Order is written through Harper's Resource/table API.
- [ ] No ORM or separate database exists.
- [ ] The custom business operation is a Harper Resource.
- [ ] The UI is served as part of the Harper application.

### Business Behavior

- [ ] Available pizzas display.
- [ ] Available toppings display.
- [ ] Customer can select exactly one pizza.
- [ ] Customer can toggle toppings.
- [ ] Displayed total updates correctly.
- [ ] Server recalculates total independently.
- [ ] Valid order is persisted.
- [ ] Confirmation includes order ID and summary.
- [ ] Stored price/name snapshot is correct.
- [ ] Invalid references are rejected.
- [ ] Failed submissions do not create records.

### Accessibility and UX

- [ ] Entire order can be completed with a keyboard.
- [ ] Focus is always visible.
- [ ] Labels and grouping are clear.
- [ ] Text and controls are comfortably sized.
- [ ] Color contrast is strong.
- [ ] Loading, error, submitting, and success states are visible.
- [ ] Confirmation is announced appropriately.
- [ ] Mobile and desktop layouts are usable.

### Deployment and Safety

- [ ] Local app works.
- [ ] Fabric app works from its public URL.
- [ ] No secrets are committed.
- [ ] No admin credential is embedded in browser code.
- [ ] Fabric logs contain no unexplained errors.
- [ ] README commands have been rerun from a clean terminal.
- [ ] Demo data is predictable.

## 19. Architecture and Scope Decisions to Explain

Justin should be ready to explain these choices in plain language:

### Why this story?

It is directly tied to a real customer need: reducing friction and uncertainty for an older, less technical user. It also forms a complete, visible workflow within the challenge's timebox.

### Why three tables?

Pizza and Topping model the menu. Order proves persistence and provides the customer outcome. More normalized commerce entities would add implementation surface without improving this pilot.

### Why a custom Resource?

Generated CRUD proves Harper's declarative productivity. `PlaceOrder` demonstrates where customer-specific business logic belongs: validation, authoritative pricing, snapshotting, and persistence.

### Why integer cents?

Money should not depend on floating-point arithmetic.

### Why server-side pricing?

The client is not trusted to determine what an order costs. The Resource reloads authoritative menu data and calculates the total.

### Why store snapshots?

Historical orders should not change when the current menu changes.

### Why no authentication or payment?

They are legitimate later requirements, but neither is needed to prove the primary user outcome or the Harper architecture. Payment would also create security/compliance work inappropriate for a few-hour pilot.

### Why no AI chatbot?

The old discovery document already treated the chatbot as timeline-dependent. It is not necessary to validate simple ordering, and adding generic chat would dilute the Harper-specific demonstration.

### Why push deployment?

It is a fast, appropriate workflow for an experiment. A production system would likely use a pull/tagged-repository deployment with controlled promotion.

## 20. Known Tradeoffs and Likely Next Steps

If this became a real pilot after the interview, likely next steps would be:

1. Conduct usability testing with actual target customers rather than assuming age alone defines their needs.
2. Refine accessibility against WCAG criteria and test with assistive technology.
3. Add an explicit store/location and a richer menu model.
4. Add order items if multiple pizzas and quantities are introduced.
5. Introduce authentication only when saved history or operator access requires it.
6. Design payment as a separate security/compliance workstream.
7. Add order lifecycle/status transitions.
8. Decide which Resources should be public and add production-grade authorization.
9. Move from development push deployment to repository/tag-based deployment.
10. Add monitoring, structured operational logging, and production test coverage.
11. Consider Harper caching, pub/sub, replication, or MCP only for concrete customer or operational requirements.

## 21. Presentation Outline

Target 12 to 13 minutes so there is room for interruptions.

### 0:00-2:00 - Discovery

- Briefly explain the older Fidari discovery artifact.
- Point out that it contained broad goals, multiple personas, conflicting stacks, and many integrations.
- Explain that this resembles real customer discovery: valuable but not a build specification.

### 2:00-3:30 - Define

- State the chosen older-customer ordering story.
- State the acceptance criteria.
- Name the deliberate non-goals.

### 3:30-5:00 - Design

- Show the compact architecture.
- Explain three Harper tables.
- Contrast generated CRUD Resources with the custom PlaceOrder Resource.
- Explain server-side cents and order snapshots.

### 5:00-10:00 - Live Development Result

- Complete an order through the public Fabric app.
- Show the confirmation.
- Retrieve the saved order.
- Briefly show `schema.graphql` and `place-order.ts` in Fabric or the local editor.
- Demonstrate one invalid request if the flow is quick and reliable.

### 10:00-12:30 - Deployment and Learning

- Explain that the application itself runs on Fabric.
- Describe one real snag and how it was resolved.
- State what was surprising about Harper.
- State what Justin would do differently or build next.

End with:

> The point of the exercise was not to rebuild a 36-page MVP. It was to show how I reduce discovery ambiguity to one useful outcome, use the platform intentionally, and leave a clear path for the next customer decision.

## 22. Rules for Gemini While Pairing

- Do not build the entire application in one unreviewed pass.
- Do not invent Harper APIs when the docs or installed types can be inspected.
- Do not silently switch stacks.
- Do not add a separate server or database.
- Do not add dependencies without explaining why the generated platform/browser/Node capability is insufficient.
- Do not expose, print, or commit Fabric credentials.
- Do not put a cluster admin password into frontend JavaScript.
- Do not use `any` merely to suppress unknown Harper types without first inspecting the installed API.
- Do not add features outside the non-goals until all Definition of Done items pass.
- Do not spend time on perfect abstraction or exhaustive testing.
- Prefer readable, customer-maintainable code over clever code.
- Keep business rules on the server.
- Keep a running record of genuine surprises and decisions for Justin's presentation.
- After each checkpoint, tell Justin exactly what works, what remains uncertain, and the next smallest step.

## 23. First Prompt for Gemini

Paste this handoff into the project conversation, then use this prompt:

> We are starting the Fidari Harper FDE pilot described in this handoff. Work as my technical pair and follow the truth hierarchy, scope, and checkpoint sequence exactly. Do not build the full application yet.
>
> First, help me scaffold the current Harper TypeScript vanilla application as `fidari-harper-pilot`. Before changing generated code, inspect the complete generated structure, `package.json`, `config.yaml`, `schema.graphql`, Resource files, frontend-serving mechanism, and any Harper-provided skill or agent instruction files. Compare what is actually generated with this handoff and current official Harper documentation.
>
> Report what you found, identify any outdated assumptions in the handoff, and give me only the smallest next step needed to run the untouched application locally. Explain commands before running them, preserve secrets, and stop after the local baseline is verified.

## 24. Inputs Available to Justin

Source documents used to form this handoff:

- `FDE Candidate Coding Challenge Prompt 1.pdf`
- `MVP-Example-FidariPizzaProject-CodingChallenge.pdf`
- `harper_fde_coding_challenge_context(1).md`

The official challenge prompt remains authoritative. The Fidari document is discovery input. This handoff is the execution guide.

