import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface CartStore {
  isOpen: boolean;
  itemCount: number;
  items: CartItem[];
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setItemCount: (count: number) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  isOpen: false,
  itemCount: 0,
  items: [],
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  setItemCount: (count) => set({ itemCount: count }),
  addToCart: (item) => set((state) => {
    const existingItem = state.items.find(i => i.id === item.id);
    if (existingItem) {
      const updatedItems = state.items.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
      );
      return { 
        items: updatedItems,
        itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
      };
    } else {
      const newItems = [...state.items, item];
      return { 
        items: newItems,
        itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0)
      };
    }
  }),
  removeFromCart: (id) => set((state) => {
    const updatedItems = state.items.filter(i => i.id !== id);
    return { 
      items: updatedItems,
      itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
    };
  }),
  updateQuantity: (id, quantity) => set((state) => {
    if (quantity <= 0) {
      const updatedItems = state.items.filter(i => i.id !== id);
      return { 
        items: updatedItems,
        itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
      };
    } else {
      const updatedItems = state.items.map(i => 
        i.id === id ? { ...i, quantity } : i
      );
      return { 
        items: updatedItems,
        itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
      };
    }
  }),
}));
