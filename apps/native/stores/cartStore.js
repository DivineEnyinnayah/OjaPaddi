import { create } from "zustand";
import {} from "../hooks/useProducts";
import {} from "../hooks/useCustomers";
export const useCartStore = create((set, get) => ({
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
            if (existingItem.quantity >= product.quantity)
                return;
            set({
                items: get().items.map((i) => i.product.id === product.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i),
            });
        }
        else {
            set({ items: [...get().items, { product, quantity: 1 }] });
        }
    },
    removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
    },
    updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(productId);
        }
        else {
            const item = get().items.find((i) => i.product.id === productId);
            if (item && quantity > item.product.quantity)
                return;
            set({
                items: get().items.map((i) => i.product.id === productId ? { ...i, quantity } : i),
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
