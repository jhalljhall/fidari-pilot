import { Resource, tables } from 'harper';
import crypto from 'node:crypto';

export class PlaceOrder extends Resource {
  allowCreate() {
    return true;
  }

  allowRead() {
    return true;
  }

  static async post(target: any, data: any, context: any) {
    if (context) {
      context.authorize = false;
    }
    const body = (await data) ?? {};

    // 1. Validate customerName
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
    if (!customerName) {
      const err = new Error('Customer name is required');
      (err as any).statusCode = 400;
      throw err;
    }

    // 2. Validate pizzaId
    const pizzaId = typeof body.pizzaId === 'string' ? body.pizzaId.trim() : '';
    if (!pizzaId) {
      const err = new Error('A valid pizzaId is required');
      (err as any).statusCode = 400;
      throw err;
    }

    // 3. Load pizza from tables.Pizza
    const pizza = await tables.Pizza.get(pizzaId);
    if (!pizza) {
      const err = new Error(`Pizza not found: ${pizzaId}`);
      (err as any).statusCode = 404;
      throw err;
    }
    if (!pizza.available) {
      const err = new Error(`Pizza is currently unavailable: ${pizza.name}`);
      (err as any).statusCode = 400;
      throw err;
    }

    // 4. Validate and deduplicate toppings
    const rawToppingIds = Array.isArray(body.toppingIds) ? body.toppingIds : [];
    const uniqueToppingIds = [...new Set(rawToppingIds.filter((t: any) => typeof t === 'string' && t.trim()))];

    const toppings: any[] = [];
    let toppingTotalCents = 0;

    for (const tid of uniqueToppingIds) {
      const topping = await tables.Topping.get(tid);
      if (!topping) {
        const err = new Error(`Topping not found: ${tid}`);
        (err as any).statusCode = 404;
        throw err;
      }
      if (!topping.available) {
        const err = new Error(`Topping is currently unavailable: ${topping.name}`);
        (err as any).statusCode = 400;
        throw err;
      }
      toppings.push(topping);
      toppingTotalCents += topping.priceCents;
    }

    // 5. Calculate authoritative pricing
    const basePriceCents = pizza.basePriceCents;
    const totalCents = basePriceCents + toppingTotalCents;

    // 6. Assemble Order record
    const orderId = crypto.randomUUID();
    const orderRecord = {
      id: orderId,
      customerName,
      pizzaId: pizza.id,
      pizzaName: pizza.name,
      toppingIds: toppings.map((t) => t.id),
      toppingNames: toppings.map((t) => t.name),
      basePriceCents,
      toppingTotalCents,
      totalCents,
      status: 'placed',
      createdAt: new Date(),
    };

    // 7. Persist to tables.Order
    await tables.Order.create(orderRecord);

    // 8. Return confirmation
    return orderRecord;
  }
}

export class place_order extends PlaceOrder {
  static path = '/place-order';
}
