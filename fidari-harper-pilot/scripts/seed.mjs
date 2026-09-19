#!/usr/bin/env node
/**
 * Idempotent Menu Seeding Script for Fidari Pizza
 * Populates Pizza and Topping tables with deterministic IDs, integer cents, and static image paths.
 */

const TARGET_URL = process.env.HARPER_TARGET || 'http://localhost:9926';
const USERNAME = process.env.HARPER_USERNAME || 'admin';
const PASSWORD = process.env.HARPER_PASSWORD || 'Password123!';

const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

const PIZZAS = [
  {
    id: 'margherita',
    name: 'Margherita',
    description: 'San Marzano tomato sauce, fresh mozzarella, fresh basil, extra virgin olive oil',
    basePriceCents: 1200,
    available: true,
    imageUrl: '/images/pizzas/margherita.jpg',
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni',
    description: 'Tomato sauce, whole-milk mozzarella, crispy artisan pepperoni cups',
    basePriceCents: 1400,
    available: true,
    imageUrl: '/images/pizzas/pepperoni.jpg',
  },
  {
    id: 'garden',
    name: 'Garden Veggie',
    description: 'Tomato sauce, mozzarella, bell peppers, crimini mushrooms, red onions, black olives',
    basePriceCents: 1300,
    available: true,
    imageUrl: '/images/pizzas/garden.jpg',
  },
];

const TOPPINGS = [
  {
    id: 'extra-cheese',
    name: 'Extra cheese',
    priceCents: 150,
    available: true,
  },
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    priceCents: 100,
    available: true,
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni',
    priceCents: 200,
    available: true,
  },
  {
    id: 'bell-peppers',
    name: 'Bell peppers',
    priceCents: 100,
    available: true,
  },
  {
    id: 'olives',
    name: 'Black olives',
    priceCents: 100,
    available: true,
  },
];

async function upsert(endpoint, record) {
  const url = `${TARGET_URL}/${endpoint}/${record.id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(record),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upsert ${endpoint}/${record.id} (${res.status}): ${errorText}`);
  }
}

async function runSeed() {
  console.log(`Starting deterministic menu seed against ${TARGET_URL}...`);

  console.log('Seeding Pizzas...');
  for (const pizza of PIZZAS) {
    await upsert('Pizza', pizza);
    console.log(`  ✓ Pizza [${pizza.id}] - ${pizza.name} ($${(pizza.basePriceCents / 100).toFixed(2)})`);
  }

  console.log('Seeding Toppings...');
  for (const topping of TOPPINGS) {
    await upsert('Topping', topping);
    console.log(`  ✓ Topping [${topping.id}] - ${topping.name} ($${(topping.priceCents / 100).toFixed(2)})`);
  }

  console.log('Menu seeding completed successfully!');
}

runSeed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
