import type { CartItem, ServiceOptions } from './types';

type Serializable = null | boolean | number | string | Serializable[] | { [key: string]: Serializable };

const sortValue = (value: unknown): Serializable => {
  if (Array.isArray(value)) return value.map(sortValue).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, Serializable>>((result, key) => {
        const next = (value as Record<string, unknown>)[key];
        if (next !== undefined) result[key] = sortValue(next);
        return result;
      }, {});
  }
  return value === undefined ? null : value as Serializable;
};

export const stableSerializeOptions = (options?: ServiceOptions) => JSON.stringify(sortValue(options || {}));

export const getCartSelectionKey = (item: Pick<CartItem, 'id' | 'options'>) =>
  `${item.id}:${stableSerializeOptions(item.options)}`;

export const getSelectionTotal = (cart: CartItem[], reference: Pick<CartItem, 'id' | 'options'>) => {
  const key = getCartSelectionKey(reference);
  return cart
    .filter(item => getCartSelectionKey(item) === key)
    .reduce((total, item) => total + item.qty, 0);
};
