/**
 Generated from HarperDB schema
 Manual changes will be lost!
 > harper dev .
 */
export interface Order {
	id: string;
	customerName: string;
	pizzaId: string;
	pizzaName: string;
	toppingIds?: string[];
	toppingNames?: string[];
	basePriceCents: number;
	toppingTotalCents: number;
	totalCents: number;
	status: string;
	createdAt?: string;
}

export type NewOrder = Omit<Order, 'id'>;
export type { Order as OrderRecord };
export type OrderRecords = Order[];
export type NewOrderRecord = Omit<Order, 'id'>;

export interface Pizza {
	id: string;
	name: string;
	description?: string;
	basePriceCents: number;
	available: boolean;
	imageUrl?: string;
}

export type NewPizza = Omit<Pizza, 'id'>;
export type { Pizza as PizzaRecord };
export type PizzaRecords = Pizza[];
export type NewPizzaRecord = Omit<Pizza, 'id'>;

export interface Topping {
	id: string;
	name: string;
	priceCents: number;
	available: boolean;
}

export type NewTopping = Omit<Topping, 'id'>;
export type { Topping as ToppingRecord };
export type ToppingRecords = Topping[];
export type NewToppingRecord = Omit<Topping, 'id'>;
