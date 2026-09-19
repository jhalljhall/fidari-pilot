import { tables } from 'harper';

export class Pizza extends tables.Pizza {
  allowRead() {
    return true;
  }
}
