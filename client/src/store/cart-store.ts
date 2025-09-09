import { create } from 'zustand';

interface CartStore {
  isOpen: boolean;
  itemCount: number;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setItemCount: (count: number) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  isOpen: false,
  itemCount: 0,
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  setItemCount: (count) => set({ itemCount: count }),
}));
