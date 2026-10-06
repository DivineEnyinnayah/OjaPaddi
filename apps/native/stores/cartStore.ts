import { create } from "zustand";
import { type Product } from "../hooks/useProducts";
import { type Customer } from "../hooks/useCustomers";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  selectedCustomer: Customer | null;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'cheque' | 'other';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: string;
  discount: string;
  notes: string;
  
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  setCustomer: (customer: Customer | null) => void;
  setPaymentMethod: (method: 'cash' | 'transfer' | 'pos' | 'cheque' | 'other') => void;
  setPaymentStatus: (status: 'paid' | 'partial' | 'unpaid') => void;
  setAmountPaid: (amount: string) => void;
  setDiscount: (discount: string) => void;
  setNotes: (notes: string) => void;
  
  getSubtotal: () => number;
  getTotal: () => number;
  resetCheckout: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedCustomer: null,
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  amountPaid: '',
  discount: '',
  notes: '',

  addItem: (product) => {
    const existingItem = get().items.find((i) => i.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) return;
      set({
        items: get().items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ items: [...get().items, { product, quantity: 1 }] });
    }
  },
  
  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) });
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
    } else {
      const item = get().items.find((i) => i.product.id === productId);
      if (item && quantity > item.product.quantity) return;
      set({
        items: get().items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        ),
      });
    }
  },
  
  clearCart: () => set({
    items: [],
    selectedCustomer: null,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    amountPaid: '',
    discount: '',
    notes: '',
  }),

  setCustomer: (selectedCustomer) => set({ selectedCustomer }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
  setAmountPaid: (amountPaid) => set({ amountPaid }),
  setDiscount: (discount) => set({ discount }),
  setNotes: (notes) => set({ notes }),

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + parseFloat(item.product.price) * item.quantity, 0);
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discountVal = parseFloat(get().discount) || 0;
    return Math.max(0, subtotal - discountVal);
  },
  
  resetCheckout: () => set({
    selectedCustomer: null,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    amountPaid: '',
    discount: '',
    notes: '',
  }),
}));
