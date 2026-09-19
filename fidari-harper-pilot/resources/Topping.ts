import { tables } from 'harper';

export class Topping extends tables.Topping {
  allowRead() {
    return true;
  }
}
