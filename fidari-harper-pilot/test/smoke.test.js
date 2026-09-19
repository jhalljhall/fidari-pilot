import test from 'node:test';
import assert from 'node:assert/strict';

const TARGET_URL = process.env.HARPER_TARGET || 'http://localhost:9926';

test('Fidari Pizza Smoke Test Suite', async (t) => {
  await t.test('1. Public Menu & Static Assets', async () => {
    // Pizzas
    const pizzaRes = await fetch(`${TARGET_URL}/Pizza/`);
    assert.equal(pizzaRes.status, 200, 'GET /Pizza/ must return 200');
    const pizzas = await pizzaRes.json();
    assert.ok(Array.isArray(pizzas), 'Pizzas must be an array');
    assert.ok(pizzas.length >= 3, 'Must have at least 3 pizzas seeded');

    const margherita = pizzas.find((p) => p.id === 'margherita');
    assert.ok(margherita, 'Margherita pizza must exist');
    assert.equal(margherita.basePriceCents, 1200, 'Margherita base price must be 1200 cents');

    // Toppings
    const toppingRes = await fetch(`${TARGET_URL}/Topping/`);
    assert.equal(toppingRes.status, 200, 'GET /Topping/ must return 200');
    const toppings = await toppingRes.json();
    assert.ok(Array.isArray(toppings), 'Toppings must be an array');
    assert.ok(toppings.length >= 5, 'Must have at least 5 toppings seeded');

    // Static Asset
    const imageRes = await fetch(`${TARGET_URL}/images/pizzas/margherita.jpg`);
    assert.equal(imageRes.status, 200, 'Pizza static image must return 200');
    const imageBuffer = await imageRes.arrayBuffer();
    assert.ok(imageBuffer.byteLength > 10000, 'Pizza image must have valid size');
  });

  await t.test('2. Table Access Protection', async () => {
    // Unauthenticated GET /Order/ must return 401
    const orderGetRes = await fetch(`${TARGET_URL}/Order/`);
    assert.equal(orderGetRes.status, 401, 'Direct GET /Order/ must be 401 Unauthorized');

    // Unauthenticated direct POST /Order/ must return 401
    const orderPostRes = await fetch(`${TARGET_URL}/Order/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'Hacker', totalCents: 1 }),
    });
    assert.equal(orderPostRes.status, 401, 'Direct POST /Order/ must be 401 Unauthorized');
  });

  await t.test('3. Input Validation & Error Handling', async () => {
    // Missing customerName
    const missingNameRes = await fetch(`${TARGET_URL}/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: '   ', pizzaId: 'margherita' }),
    });
    assert.equal(missingNameRes.status, 400, 'Empty customerName must return 400');
    const missingNameBody = await missingNameRes.json();
    assert.match(missingNameBody.title || missingNameBody.message, /Customer name is required/i);

    // Missing pizzaId
    const missingPizzaRes = await fetch(`${TARGET_URL}/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'Ronnie' }),
    });
    assert.equal(missingPizzaRes.status, 400, 'Missing pizzaId must return 400');

    // Non-existent pizzaId
    const invalidPizzaRes = await fetch(`${TARGET_URL}/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'Ronnie', pizzaId: 'non-existent-pie' }),
    });
    assert.equal(invalidPizzaRes.status, 404, 'Non-existent pizzaId must return 404');

    // Non-existent toppingId
    const invalidToppingRes = await fetch(`${TARGET_URL}/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'Ronnie', pizzaId: 'margherita', toppingIds: ['gold-leaf'] }),
    });
    assert.equal(invalidToppingRes.status, 404, 'Non-existent toppingId must return 404');
  });

  await t.test('4. Server-Authoritative Pricing & Order Snapshots', async () => {
    const payload = {
      customerName: 'Ronnie Taylor',
      pizzaId: 'margherita',
      toppingIds: ['extra-cheese', 'mushrooms'],
      // Attempt to spoof prices from the client
      basePriceCents: 10,
      toppingTotalCents: 5,
      totalCents: 15,
    };

    const res = await fetch(`${TARGET_URL}/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200, 'POST /place-order must return 200');
    const order = await res.json();

    // Verify order ID
    assert.ok(order.id, 'Order must return a generated ID');

    // Verify customer snapshot
    assert.equal(order.customerName, 'Ronnie Taylor', 'Customer name must match');

    // Verify pizza snapshot
    assert.equal(order.pizzaId, 'margherita');
    assert.equal(order.pizzaName, 'Margherita');

    // Verify toppings snapshot
    assert.deepEqual(order.toppingIds, ['extra-cheese', 'mushrooms']);
    assert.deepEqual(order.toppingNames, ['Extra cheese', 'Mushrooms']);

    // Verify server-calculated prices in integer cents
    assert.equal(order.basePriceCents, 1200, 'Base price must be 1200 cents ($12.00)');
    assert.equal(order.toppingTotalCents, 250, 'Toppings total must be 250 cents ($2.50)');
    assert.equal(order.totalCents, 1450, 'Total price must be 1450 cents ($14.50), ignoring client spoof');

    // Verify status
    assert.equal(order.status, 'placed', 'Initial status must be placed');
    assert.ok(order.createdAt, 'Order must have a timestamp');
  });

  await t.test('5. Deduplication of Topping Selections', async () => {
    const res = await fetch(`${TARGET_URL}/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Ronnie Taylor',
        pizzaId: 'margherita',
        toppingIds: ['extra-cheese', 'extra-cheese', 'extra-cheese'],
      }),
    });

    assert.equal(res.status, 200);
    const order = await res.json();
    assert.equal(order.toppingIds.length, 1, 'Duplicate toppings must be deduplicated');
    assert.equal(order.toppingTotalCents, 150, 'Deduplicated topping must be priced only once');
    assert.equal(order.totalCents, 1350, 'Total must accurately reflect deduplicated pricing');
  });
});
