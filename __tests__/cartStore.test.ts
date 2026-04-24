import { useCartStore } from '@/store';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  test('addItem, updateQuantity, removeItem and totals', () => {
    const item = { id: 'p1', name: 'Product 1', sku: 'sku1', price: 10, stock: 5 };
    useCartStore.getState().addItem(item);
    expect(useCartStore.getState().getTotalItems()).toBe(1);
    expect(useCartStore.getState().getSubtotal()).toBe(10);

    useCartStore.getState().addItem(item);
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getSubtotal()).toBe(20);

    useCartStore.getState().updateQuantity('p1', 5);
    expect(useCartStore.getState().getTotalItems()).toBe(5);
    expect(useCartStore.getState().getSubtotal()).toBe(50);

    useCartStore.getState().removeItem('p1');
    expect(useCartStore.getState().getTotalItems()).toBe(0);
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });
});
