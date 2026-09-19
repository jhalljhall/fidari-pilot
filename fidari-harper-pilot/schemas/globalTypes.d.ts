/**
 Generated from your schema files
 Manual changes will be lost!
 > harper dev .
 */
import type { Table } from 'harper';
import type { Order, Pizza, Topping } from './types.ts';

declare module 'harper' {
	export const tables: {
		Order: { new(...args: any[]): Table<Order> };
		Pizza: { new(...args: any[]): Table<Pizza> };
		Topping: { new(...args: any[]): Table<Topping> };
	};

	export const databases: {
		data: {
			Order: { new(...args: any[]): Table<Order> };
			Pizza: { new(...args: any[]): Table<Pizza> };
			Topping: { new(...args: any[]): Table<Topping> };
		};
	};
}
