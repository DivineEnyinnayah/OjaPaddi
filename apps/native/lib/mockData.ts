/**
 * Mock Data Store — In-Memory Database for Dev Mode
 *
 * Contains realistic seed data for a Nigerian general retail seller.
 * All arrays are mutable — the mock API handler (mockApi.ts) reads and
 * writes to them so CRUD operations feel interactive in the running app.
 *
 * Data shapes match the interfaces defined in hooks/use*.ts exactly.
 */

import type { Product } from '../hooks/useProducts';
import type { Sale, SaleItem } from '../hooks/useSales';
import type { Customer } from '../hooks/useCustomers';
import type { Expense } from '../hooks/useExpenses';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_BUSINESS_ID = 'biz-dev-001';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

let nextProductId = 100;
let nextSaleId = 100;
let nextCustomerId = 100;
let nextExpenseId = 100;

export function generateProductId(): string {
  return `prod-${++nextProductId}`;
}
export function generateSaleId(): string {
  return `sale-${++nextSaleId}`;
}
export function generateCustomerId(): string {
  return `cust-${++nextCustomerId}`;
}
export function generateExpenseId(): string {
  return `exp-${++nextExpenseId}`;
}

export function generateSaleReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'OJA-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// ─── Mock User ────────────────────────────────────────────────────────────────

export const MOCK_USER = {
  id: 'dev-seller-001',
  email: 'chinedu.market@gmail.com',
  plan: 'free' as const,
  fullName: 'Chinedu Alao',
};

export const MOCK_BUSINESS = {
  id: MOCK_BUSINESS_ID,
  userId: 'dev-seller-001',
  name: "Chinedu's General Store",
  slug: 'chinedus-store',
  description: 'Your one-stop shop for quality provisions, household items, and everyday essentials at fair prices.',
  category: 'General Retail',
  logoUrl: undefined as string | undefined,
  phone: '08012345678',
  email: 'chinedu.market@gmail.com',
  address: '12 Broad Street, Lagos Island',
  city: 'Lagos',
  state: 'Lagos',
  country: 'Nigeria',
  currency: 'NGN',
  whatsappNumber: '2348012345678',
  isPublished: false,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    businessId: MOCK_BUSINESS_ID,
    name: 'Indomie Onion Chicken 70g (Carton)',
    description: 'Carton of 40 packs',
    sku: 'IND-OC-70',
    category: 'Provisions',
    price: '7200.00',
    costPrice: '6100.00',
    quantity: 14,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
  },
  {
    id: 'prod-2',
    businessId: MOCK_BUSINESS_ID,
    name: 'Power Oil 1L',
    description: 'Vegetable cooking oil, 1 litre',
    sku: 'PO-1L',
    category: 'Provisions',
    price: '3800.00',
    costPrice: '3200.00',
    quantity: 4,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: daysAgo(28),
    updatedAt: daysAgo(1),
  },
  {
    id: 'prod-3',
    businessId: MOCK_BUSINESS_ID,
    name: 'Golden Penny Semovita 2kg',
    description: '2kg pack of semolina',
    sku: 'GP-SEM-2K',
    category: 'Provisions',
    price: '2800.00',
    costPrice: '2300.00',
    quantity: 22,
    lowStockThreshold: 8,
    imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
  },
  {
    id: 'prod-4',
    businessId: MOCK_BUSINESS_ID,
    name: 'Peak Milk 400g Tin',
    description: 'Evaporated full cream milk',
    sku: 'PK-400',
    category: 'Dairy',
    price: '2200.00',
    costPrice: '1850.00',
    quantity: 36,
    lowStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
  },
  {
    id: 'prod-5',
    businessId: MOCK_BUSINESS_ID,
    name: 'Dangote Sugar 500g',
    description: 'Refined white sugar',
    sku: 'DG-SUG-500',
    category: 'Provisions',
    price: '1100.00',
    costPrice: '850.00',
    quantity: 48,
    lowStockThreshold: 15,
    imageUrl: 'https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: daysAgo(18),
    updatedAt: daysAgo(4),
  },
  {
    id: 'prod-6',
    businessId: MOCK_BUSINESS_ID,
    name: 'Morning Fresh Dishwashing Liquid 450ml',
    description: 'Lemon-scented dishwashing liquid',
    sku: 'MF-DWL-450',
    category: 'Household',
    price: '1500.00',
    costPrice: '1100.00',
    quantity: 18,
    lowStockThreshold: 6,
    imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
  },
  {
    id: 'prod-7',
    businessId: MOCK_BUSINESS_ID,
    name: 'Dettol Antiseptic 250ml',
    description: 'Original antiseptic liquid',
    sku: 'DET-250',
    category: 'Health',
    price: '2500.00',
    costPrice: '2050.00',
    quantity: 2,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
  },
  {
    id: 'prod-8',
    businessId: MOCK_BUSINESS_ID,
    name: 'Bigi Cola 60cl PET (Pack of 12)',
    description: 'Carbonated soft drink, 12 bottles',
    sku: 'BIGI-C-12',
    category: 'Beverages',
    price: '2400.00',
    costPrice: '1900.00',
    quantity: 10,
    lowStockThreshold: 4,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(0),
  },
];

// ─── Customers ────────────────────────────────────────────────────────────────

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Mama Titi',
    phone: '08034567890',
    email: undefined,
    address: 'Shop 4, Balogun Market, Lagos Island',
    notes: 'Buys provisions in bulk every Monday',
    customerType: 'individual',
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
  },
  {
    id: 'cust-2',
    name: 'Emeka Obi',
    phone: '08098765432',
    email: 'emeka.obi@yahoo.com',
    address: '15 Ogunlana Drive, Surulere',
    notes: 'Restaurant owner, orders weekly',
    customerType: 'individual',
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
  },
  {
    id: 'cust-3',
    name: 'Iya Basira',
    phone: '07012345678',
    email: undefined,
    address: 'Oke-Odo Market, Agege',
    notes: undefined,
    customerType: 'individual',
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(7),
  },
  {
    id: 'cust-4',
    name: 'Blessing Eze',
    phone: '09087654321',
    email: 'blessingeze@gmail.com',
    address: undefined,
    notes: 'Prefers to pay via transfer',
    customerType: 'individual',
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    id: 'cust-5',
    name: 'Prince Ebeano Supermarket',
    phone: '08022233445',
    email: 'procurement@ebeano.com',
    address: 'Admiralty Way, Lekki Phase 1, Lagos',
    notes: 'Payment scheduled every 14 days by Cheque or Transfer',
    customerType: 'supermarket',
    expectedPaymentPeriodDays: 14,
    suppliedProductIds: ['prod-1', 'prod-2', 'prod-3', 'prod-4'],
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
  {
    id: 'cust-6',
    name: 'Hubmart Stores',
    phone: '08077788990',
    email: 'vendor@hubmart.com',
    address: 'Adeola Odeku St, Victoria Island, Lagos',
    notes: 'Supplied dairy and beverages bi-weekly',
    customerType: 'supermarket',
    expectedPaymentPeriodDays: 7,
    suppliedProductIds: ['prod-4', 'prod-8'],
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(28),
    updatedAt: daysAgo(4),
  },
];

// ─── Sales ────────────────────────────────────────────────────────────────────

const saleItems1: SaleItem[] = [
  { productId: 'prod-1', productName: 'Indomie Onion Chicken 70g (Carton)', unitPrice: 7200, quantity: 2, total: 14400 },
  { productId: 'prod-5', productName: 'Dangote Sugar 500g', unitPrice: 1100, quantity: 5, total: 5500 },
];

const saleItems2: SaleItem[] = [
  { productId: 'prod-4', productName: 'Peak Milk 400g Tin', unitPrice: 2200, quantity: 3, total: 6600 },
  { productId: 'prod-2', productName: 'Power Oil 1L', unitPrice: 3800, quantity: 1, total: 3800 },
];

const saleItems3: SaleItem[] = [
  { productId: 'prod-6', productName: 'Morning Fresh Dishwashing Liquid 450ml', unitPrice: 1500, quantity: 2, total: 3000 },
  { productId: 'prod-7', productName: 'Dettol Antiseptic 250ml', unitPrice: 2500, quantity: 1, total: 2500 },
  { productId: 'prod-8', productName: 'Bigi Cola 60cl PET (Pack of 12)', unitPrice: 2400, quantity: 1, total: 2400 },
];

const saleItems4: SaleItem[] = [
  { productId: 'prod-3', productName: 'Golden Penny Semovita 2kg', unitPrice: 2800, quantity: 4, total: 11200 },
];

const saleItems5: SaleItem[] = [
  { productId: 'prod-1', productName: 'Indomie Onion Chicken 70g (Carton)', unitPrice: 7200, quantity: 1, total: 7200 },
  { productId: 'prod-2', productName: 'Power Oil 1L', unitPrice: 3800, quantity: 1, total: 3800 },
];

const saleItems6: SaleItem[] = [
  { productId: 'prod-1', productName: 'Indomie Onion Chicken 70g (Carton)', unitPrice: 7200, quantity: 1, total: 7200 },
  { productId: 'prod-2', productName: 'Power Oil 1L', unitPrice: 3800, quantity: 2, total: 7600 },
  { productId: 'prod-3', productName: 'Golden Penny Semovita 2kg', unitPrice: 2800, quantity: 1, total: 2800 },
];

const saleItems7: SaleItem[] = [
  { productId: 'prod-4', productName: 'Peak Milk 400g Tin', unitPrice: 2200, quantity: 2, total: 4400 },
  { productId: 'prod-5', productName: 'Dangote Sugar 500g', unitPrice: 1100, quantity: 2, total: 2200 },
];

const saleItems8: SaleItem[] = [
  { productId: 'prod-4', productName: 'Peak Milk 400g Tin', unitPrice: 2200, quantity: 1, total: 2200 },
  { productId: 'prod-5', productName: 'Dangote Sugar 500g', unitPrice: 1100, quantity: 1, total: 1100 },
  { productId: 'prod-8', productName: 'Bigi Cola 60cl PET (Pack of 12)', unitPrice: 2400, quantity: 1, total: 2400 },
];

export const mockSales: Sale[] = [
  {
    id: 'sale-1',
    reference: 'OJA-A1B2C3',
    orderType: 'customer',
    customerId: 'cust-1',
    subtotal: '19900.00',
    discount: '0.00',
    returnedAmount: '0.00',
    total: '19900.00',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    amountPaid: '19900.00',
    notes: undefined,
    soldAt: daysAgo(1),
    items: saleItems1,
  },
  {
    id: 'sale-2',
    reference: 'OJA-D4E5F6',
    orderType: 'customer',
    customerId: 'cust-2',
    subtotal: '10400.00',
    discount: '400.00',
    returnedAmount: '0.00',
    total: '10000.00',
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    amountPaid: '10000.00',
    notes: 'Gave small discount for bulk',
    soldAt: daysAgo(2),
    items: saleItems2,
  },
  {
    id: 'sale-3',
    reference: 'OJA-G7H8I9',
    orderType: 'customer',
    customerId: undefined,
    subtotal: '7900.00',
    discount: '0.00',
    returnedAmount: '0.00',
    total: '7900.00',
    paymentMethod: 'pos',
    paymentStatus: 'paid',
    amountPaid: '7900.00',
    notes: 'Walk-in customer',
    soldAt: daysAgo(3),
    items: saleItems3,
  },
  {
    id: 'sale-4',
    reference: 'OJA-J1K2L3',
    orderType: 'customer',
    customerId: 'cust-3',
    subtotal: '11200.00',
    discount: '0.00',
    returnedAmount: '0.00',
    total: '11200.00',
    paymentMethod: 'cash',
    paymentStatus: 'partial',
    amountPaid: '7000.00',
    notes: 'Will pay balance next week',
    soldAt: daysAgo(5),
    items: saleItems4,
  },
  {
    id: 'sale-5',
    reference: 'OJA-K1L2M3',
    orderType: 'customer',
    customerId: 'cust-4',
    subtotal: '11000.00',
    discount: '0.00',
    returnedAmount: '0.00',
    total: '11000.00',
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    amountPaid: '11000.00',
    notes: undefined,
    soldAt: daysAgo(6),
    items: saleItems5,
  },
  {
    id: 'sale-6',
    reference: 'OJA-N1O2P3',
    orderType: 'supermarket',
    customerId: 'cust-5',
    expectedPaymentDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    subtotal: '17600.00',
    discount: '0.00',
    returnedAmount: '0.00',
    total: '17600.00',
    paymentMethod: 'cheque',
    paymentStatus: 'unpaid',
    amountPaid: '0.00',
    notes: 'Supplied stock. Invoice generated.',
    soldAt: daysAgo(7),
    items: saleItems6,
  },
  {
    id: 'sale-7',
    reference: 'OJA-Q1R2S3',
    orderType: 'supermarket',
    customerId: 'cust-6',
    expectedPaymentDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    subtotal: '6600.00',
    discount: '0.00',
    returnedAmount: '0.00',
    total: '6600.00',
    paymentMethod: 'transfer',
    paymentStatus: 'unpaid',
    amountPaid: '0.00',
    notes: 'Expected payment yesterday. Reminder sent.',
    soldAt: daysAgo(8),
    items: saleItems7,
  },
  {
    id: 'sale-8',
    reference: 'OJA-T1U2V3',
    orderType: 'customer',
    customerId: 'cust-2',
    subtotal: '5700.00',
    discount: '0.00',
    returnedAmount: '0.00',
    total: '5700.00',
    paymentMethod: 'pos',
    paymentStatus: 'paid',
    amountPaid: '5700.00',
    notes: undefined,
    soldAt: daysAgo(9),
    items: saleItems8,
  },
];

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    description: 'NEPA bill for shop',
    amount: '8500.00',
    category: 'Utilities',
    isRecurring: true,
    recurringFrequency: 'monthly',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), // Due in 2 days!
    isPaid: false,
    reminderDaysBefore: 3,
    incurredAt: daysAgo(5),
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: 'exp-2',
    description: 'Transport for goods from Mile 12',
    amount: '4000.00',
    category: 'Transport',
    isRecurring: false,
    isPaid: true,
    incurredAt: daysAgo(3),
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 'exp-3',
    description: 'Shop boy salary (weekly)',
    amount: '15000.00',
    category: 'Staff',
    isRecurring: true,
    recurringFrequency: 'weekly',
    dueDate: new Date(Date.now() + 1 * 86400000).toISOString(), // Due tomorrow!
    isPaid: false,
    reminderDaysBefore: 2,
    incurredAt: daysAgo(7),
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: 'exp-4',
    description: 'New price label stickers',
    amount: '1200.00',
    category: 'Supplies',
    isRecurring: false,
    isPaid: true,
    incurredAt: daysAgo(2),
    businessId: MOCK_BUSINESS_ID,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];
