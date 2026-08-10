/**
 * Mock API Handler — Routes requests to the in-memory mock data store.
 *
 * This module is only ever imported when `env.IS_DEV_MODE` is true.
 * It mirrors the shape of the real HonoJS API responses so the hooks
 * and UI components cannot tell the difference.
 *
 * Every handler simulates realistic network latency (200-500ms) so the
 * loading states in the app still trigger visually.
 */

import type { Product } from '../hooks/useProducts';
import type { Sale, SaleItem } from '../hooks/useSales';
import type { Customer } from '../hooks/useCustomers';
import type { Expense } from '../hooks/useExpenses';
import type { AnalyticsSummary } from '../hooks/useAnalytics';
import {
  mockProducts,
  mockSales,
  mockCustomers,
  mockExpenses,
  generateProductId,
  generateSaleId,
  generateCustomerId,
  generateExpenseId,
  generateSaleReference,
  MOCK_BUSINESS,
} from './mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// ─── Mutable Business State ───────────────────────────────────────────────────

const mockBusiness = { ...MOCK_BUSINESS };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simulate realistic network latency */
async function simulateLatency(): Promise<void> {
  const ms = 200 + Math.random() * 300;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse pagination query params from a URL query string */
function parsePagination(endpoint: string): { page: number; limit: number } {
  const queryString = endpoint.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  return {
    page: parseInt(params.get('page') || '1', 10),
    limit: parseInt(params.get('limit') || '20', 10),
  };
}

/** Extract the clean path without query string */
function getPath(endpoint: string): string {
  return endpoint.split('?')[0];
}

/** Safely parse JSON body from RequestInit */
function parseBody<T>(options: RequestInit): T {
  if (typeof options.body === 'string') {
    return JSON.parse(options.body) as T;
  }
  return {} as T;
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

// -- Products --

function handleGetProducts(endpoint: string): ApiResponse<{ products: Product[]; pagination: { total: number; page: number; limit: number } }> {
  const { page, limit } = parsePagination(endpoint);
  const queryString = endpoint.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  const search = params.get('search')?.toLowerCase();
  const category = params.get('category');

  let filtered = mockProducts.filter((p) => p.isActive);

  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (p.description?.toLowerCase().includes(search) ?? false) ||
        (p.sku?.toLowerCase().includes(search) ?? false)
    );
  }

  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return {
    success: true,
    data: {
      products: paginated,
      pagination: { total: filtered.length, page, limit },
    },
  };
}

function handleGetProductById(productId: string): ApiResponse<Product> {
  const product = mockProducts.find((p) => p.id === productId && p.isActive);
  if (!product) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } };
  }
  return { success: true, data: product };
}

function handleCreateProduct(options: RequestInit): ApiResponse<Product> {
  const body = parseBody<{
    name: string;
    description?: string;
    sku?: string;
    category?: string;
    price: number;
    costPrice?: number;
    quantity: number;
    lowStockThreshold?: number;
  }>(options);

  const newProduct: Product = {
    id: generateProductId(),
    businessId: MOCK_BUSINESS.id,
    name: body.name,
    description: body.description,
    sku: body.sku,
    category: body.category,
    price: String(body.price),
    costPrice: body.costPrice ? String(body.costPrice) : undefined,
    quantity: body.quantity || 0,
    lowStockThreshold: body.lowStockThreshold ?? 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockProducts.push(newProduct);
  return { success: true, data: newProduct };
}

function handleUpdateProduct(productId: string, options: RequestInit): ApiResponse<Product> {
  const idx = mockProducts.findIndex((p) => p.id === productId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } };
  }

  const body = parseBody<Partial<Product>>(options);
  const updated: Product = {
    ...mockProducts[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  mockProducts[idx] = updated;
  return { success: true, data: updated };
}

function handleDeleteProduct(productId: string): ApiResponse<null> {
  const idx = mockProducts.findIndex((p) => p.id === productId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } };
  }
  // Soft delete per AGENTS.md rules
  mockProducts[idx] = { ...mockProducts[idx], isActive: false, updatedAt: new Date().toISOString() };
  return { success: true, data: null };
}

function handleAdjustStock(productId: string, options: RequestInit): ApiResponse<Product> {
  const idx = mockProducts.findIndex((p) => p.id === productId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } };
  }

  const body = parseBody<{ quantity: number }>(options);
  const updated: Product = {
    ...mockProducts[idx],
    quantity: mockProducts[idx].quantity + body.quantity,
    updatedAt: new Date().toISOString(),
  };
  mockProducts[idx] = updated;
  return { success: true, data: updated };
}

function handleUploadProductImage(productId: string): ApiResponse<Product> {
  const idx = mockProducts.findIndex((p) => p.id === productId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } };
  }

  // Simulate image upload — just set a placeholder URL
  const updated: Product = {
    ...mockProducts[idx],
    imageUrl: `https://placehold.co/400x400/1A6B3C/FFFFFF?text=${encodeURIComponent(mockProducts[idx].name.slice(0, 10))}`,
    updatedAt: new Date().toISOString(),
  };
  mockProducts[idx] = updated;
  return { success: true, data: updated };
}

// -- Sales --

function handleGetSales(endpoint: string): ApiResponse<{ sales: Sale[]; pagination: { total: number; page: number; limit: number } }> {
  const { page, limit } = parsePagination(endpoint);
  const start = (page - 1) * limit;
  const paginated = mockSales.slice(start, start + limit);

  return {
    success: true,
    data: {
      sales: paginated,
      pagination: { total: mockSales.length, page, limit },
    },
  };
}

function handleGetSaleById(saleId: string): ApiResponse<Sale> {
  const sale = mockSales.find((s) => s.id === saleId);
  if (!sale) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } };
  }
  return { success: true, data: sale };
}

function handleCreateSale(options: RequestInit): ApiResponse<Sale> {
  const body = parseBody<{
    customerId?: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    discount?: number;
    paymentMethod: 'cash' | 'transfer' | 'pos' | 'other';
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    amountPaid: number;
    notes?: string;
  }>(options);

  const saleItems: SaleItem[] = body.items.map((item) => {
    const product = mockProducts.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      productName: product?.name || 'Unknown Product',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: item.unitPrice * item.quantity,
    };
  });

  const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
  const discount = body.discount ?? 0;

  const newSale: Sale = {
    id: generateSaleId(),
    reference: generateSaleReference(),
    customerId: body.customerId,
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    total: (subtotal - discount).toFixed(2),
    paymentMethod: body.paymentMethod,
    paymentStatus: body.paymentStatus,
    amountPaid: body.amountPaid.toFixed(2),
    notes: body.notes,
    soldAt: new Date().toISOString(),
    items: saleItems,
  };

  // Decrement stock for each sold item
  for (const item of body.items) {
    const pIdx = mockProducts.findIndex((p) => p.id === item.productId);
    if (pIdx !== -1) {
      mockProducts[pIdx] = {
        ...mockProducts[pIdx],
        quantity: Math.max(0, mockProducts[pIdx].quantity - item.quantity),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  mockSales.unshift(newSale);
  return { success: true, data: newSale };
}

function handleVoidSale(saleId: string): ApiResponse<null> {
  const idx = mockSales.findIndex((s) => s.id === saleId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } };
  }
  mockSales.splice(idx, 1);
  return { success: true, data: null };
}

// -- Customers --

function handleGetCustomers(endpoint: string): ApiResponse<{ customers: Customer[]; pagination: { total: number; page: number; limit: number } }> {
  const { page, limit } = parsePagination(endpoint);
  const start = (page - 1) * limit;
  const paginated = mockCustomers.slice(start, start + limit);

  return {
    success: true,
    data: {
      customers: paginated,
      pagination: { total: mockCustomers.length, page, limit },
    },
  };
}

function handleGetCustomerById(customerId: string): ApiResponse<Customer> {
  const customer = mockCustomers.find((c) => c.id === customerId);
  if (!customer) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } };
  }
  return { success: true, data: customer };
}

function handleCreateCustomer(options: RequestInit): ApiResponse<Customer> {
  const body = parseBody<{
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }>(options);

  const newCustomer: Customer = {
    id: generateCustomerId(),
    name: body.name,
    phone: body.phone,
    email: body.email,
    address: body.address,
    notes: body.notes,
    businessId: MOCK_BUSINESS.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockCustomers.push(newCustomer);
  return { success: true, data: newCustomer };
}

function handleUpdateCustomer(customerId: string, options: RequestInit): ApiResponse<Customer> {
  const idx = mockCustomers.findIndex((c) => c.id === customerId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } };
  }

  const body = parseBody<Partial<Customer>>(options);
  const updated: Customer = {
    ...mockCustomers[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  mockCustomers[idx] = updated;
  return { success: true, data: updated };
}

function handleDeleteCustomer(customerId: string): ApiResponse<null> {
  const idx = mockCustomers.findIndex((c) => c.id === customerId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } };
  }
  mockCustomers.splice(idx, 1);
  return { success: true, data: null };
}

// -- Expenses --

function handleGetExpenses(endpoint: string): ApiResponse<Expense[]> {
  // The useExpenses hook expects data to be the array directly (ExpensesResponse.data is Expense[])
  const queryString = endpoint.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  const category = params.get('category');

  let filtered = [...mockExpenses];
  if (category) {
    filtered = filtered.filter((e) => e.category === category);
  }

  return { success: true, data: filtered };
}

function handleGetExpenseById(expenseId: string): ApiResponse<Expense> {
  const expense = mockExpenses.find((e) => e.id === expenseId);
  if (!expense) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } };
  }
  return { success: true, data: expense };
}

function handleCreateExpense(options: RequestInit): ApiResponse<Expense> {
  const body = parseBody<{
    description: string;
    amount: number;
    category?: string;
    incurredAt: string;
  }>(options);

  const newExpense: Expense = {
    id: generateExpenseId(),
    description: body.description,
    amount: String(body.amount),
    category: body.category,
    incurredAt: body.incurredAt,
    businessId: MOCK_BUSINESS.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockExpenses.push(newExpense);
  return { success: true, data: newExpense };
}

function handleUpdateExpense(expenseId: string, options: RequestInit): ApiResponse<Expense> {
  const idx = mockExpenses.findIndex((e) => e.id === expenseId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } };
  }

  const body = parseBody<Partial<Expense>>(options);
  const updated: Expense = {
    ...mockExpenses[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  mockExpenses[idx] = updated;
  return { success: true, data: updated };
}

function handleDeleteExpense(expenseId: string): ApiResponse<null> {
  const idx = mockExpenses.findIndex((e) => e.id === expenseId);
  if (idx === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } };
  }
  mockExpenses.splice(idx, 1);
  return { success: true, data: null };
}

// -- Analytics --

function handleGetAnalytics(): ApiResponse<AnalyticsSummary> {
  const totalRevenue = mockSales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const totalExpensesAmount = mockExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Calculate top products from sale items
  const productRevenue: Record<string, { name: string; revenue: number; quantitySold: number }> = {};
  for (const sale of mockSales) {
    for (const item of sale.items) {
      if (!productRevenue[item.productId]) {
        productRevenue[item.productId] = { name: item.productName, revenue: 0, quantitySold: 0 };
      }
      productRevenue[item.productId].revenue += item.total;
      productRevenue[item.productId].quantitySold += item.quantity;
    }
  }

  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const lowStockCount = mockProducts.filter(
    (p) => p.isActive && p.quantity <= p.lowStockThreshold
  ).length;

  return {
    success: true,
    data: {
      totalRevenue,
      totalSalesCount: mockSales.length,
      totalExpenses: totalExpensesAmount,
      netProfit: totalRevenue - totalExpensesAmount,
      topProducts,
      lowStockCount,
      totalProducts: mockProducts.filter(p => p.isActive).length,
    },
  };
}

function handleGetMba(endpoint: string): ApiResponse<any[]> {
  const queryString = endpoint.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  const minSupport = parseFloat(params.get('minSupport') || '0.1');
  const minConfidence = parseFloat(params.get('minConfidence') || '0.5');

  // Build transactions list and product name mapping
  const transactions: string[][] = [];
  const productNameMap: Record<string, string> = {};

  for (const sale of mockSales) {
    const basket: string[] = [];
    for (const item of sale.items) {
      basket.push(item.productId);
      productNameMap[item.productId] = item.productName;
    }
    if (basket.length > 0) {
      transactions.push(Array.from(new Set(basket)));
    }
  }

  const totalTx = transactions.length;
  if (totalTx === 0) {
    return { success: true, data: [] };
  }

  const itemsetKey = (itemset: string[]) => [...itemset].sort().join(",");

  // 1. Frequent itemsets of size 1
  const itemCounts: Record<string, number> = {};
  for (const tx of transactions) {
    for (const item of tx) {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    }
  }

  const frequentItemsets: Record<string, number> = {};
  const supportMap: Record<string, number> = {};

  for (const [item, count] of Object.entries(itemCounts)) {
    const support = count / totalTx;
    if (support >= minSupport) {
      frequentItemsets[item] = support;
      supportMap[item] = support;
    }
  }

  const allFrequent: Record<string, number> = { ...supportMap };
  let currentFrequent = Object.keys(frequentItemsets).map(item => [item]);
  let k = 2;

  while (currentFrequent.length > 0) {
    const candidates: string[][] = [];
    for (let i = 0; i < currentFrequent.length; i++) {
      for (let j = i + 1; j < currentFrequent.length; j++) {
        const itemsetA = currentFrequent[i];
        const itemsetB = currentFrequent[j];
        
        let canJoin = true;
        for (let l = 0; l < k - 2; l++) {
          if (itemsetA[l] !== itemsetB[l]) {
            canJoin = false;
            break;
          }
        }
        if (canJoin) {
          const candidate = Array.from(new Set([...itemsetA, ...itemsetB])).sort();
          if (candidate.length === k) {
            candidates.push(candidate);
          }
        }
      }
    }

    const uniqueCandidates: string[][] = [];
    const seenCandidates = new Set<string>();
    for (const cand of candidates) {
      const key = itemsetKey(cand);
      if (!seenCandidates.has(key)) {
        seenCandidates.add(key);
        uniqueCandidates.push(cand);
      }
    }

    const candCounts: Record<string, number> = {};
    for (const tx of transactions) {
      const txSet = new Set(tx);
      for (const cand of uniqueCandidates) {
        let containsAll = true;
        for (const item of cand) {
          if (!txSet.has(item)) {
            containsAll = false;
            break;
          }
        }
        if (containsAll) {
          const key = itemsetKey(cand);
          candCounts[key] = (candCounts[key] || 0) + 1;
        }
      }
    }

    const nextFrequent: string[][] = [];
    for (const cand of uniqueCandidates) {
      const key = itemsetKey(cand);
      const count = candCounts[key] || 0;
      const support = count / totalTx;
      if (support >= minSupport) {
        nextFrequent.push(cand);
        allFrequent[key] = support;
        supportMap[key] = support;
      }
    }

    currentFrequent = nextFrequent;
    k++;
  }

  function getSubsets(arr: string[]): string[][] {
    const results: string[][] = [[]];
    for (const value of arr) {
      const len = results.length;
      for (let i = 0; i < len; i++) {
        results.push([...results[i], value]);
      }
    }
    return results.filter(s => s.length > 0 && s.length < arr.length);
  }

  const rules: any[] = [];

  for (const [key, support] of Object.entries(allFrequent)) {
    const items = key.split(",");
    if (items.length < 2) continue;

    const subsets = getSubsets(items);
    for (const antecedent of subsets) {
      const consequent = items.filter(x => !antecedent.includes(x));
      const antKey = itemsetKey(antecedent);
      const consKey = itemsetKey(consequent);

      const antSupport = supportMap[antKey] || 0;
      const consSupport = supportMap[consKey] || 0;

      if (antSupport > 0) {
        const confidence = support / antSupport;
        if (confidence >= minConfidence) {
          const lift = consSupport > 0 ? confidence / consSupport : 0;
          rules.push({
            antecedent,
            consequent,
            antecedentNames: antecedent.map(id => productNameMap[id] || "Unknown Product"),
            consequentNames: consequent.map(id => productNameMap[id] || "Unknown Product"),
            support,
            confidence,
            lift,
          });
        }
      }
    }
  }

  rules.sort((a, b) => b.lift - a.lift || b.confidence - a.confidence);

  return {
    success: true,
    data: rules,
  };
}

// -- Business --

function handleGetBusiness(): ApiResponse<typeof mockBusiness> {
  return { success: true, data: { ...mockBusiness } };
}

function handleUpdateBusiness(options: RequestInit): ApiResponse<typeof mockBusiness> {
  const body = parseBody<Partial<typeof mockBusiness>>(options);
  Object.assign(mockBusiness, body, { updatedAt: new Date().toISOString() });
  return { success: true, data: { ...mockBusiness } };
}

function handleUploadBusinessLogo(): ApiResponse<{ logoUrl: string }> {
  const logoUrl = `https://placehold.co/200x200/1A6B3C/FFFFFF?text=${encodeURIComponent(mockBusiness.name.slice(0, 8))}`;
  mockBusiness.logoUrl = logoUrl;
  mockBusiness.updatedAt = new Date().toISOString();
  return { success: true, data: { logoUrl } };
}

// ─── Main Router ──────────────────────────────────────────────────────────────

/**
 * Route an API request to the appropriate mock handler.
 * Called from api.ts when dev mode is active.
 */
export async function getMockResponse<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  await simulateLatency();

  const method = (options.method || 'GET').toUpperCase();
  const path = getPath(endpoint);

  // ── Products ──
  const productByIdMatch = path.match(/^\/products\/([^/]+)$/);
  const productStockMatch = path.match(/^\/products\/([^/]+)\/stock$/);
  const productImageMatch = path.match(/^\/products\/([^/]+)\/image$/);

  if (productStockMatch && method === 'PATCH') {
    return handleAdjustStock(productStockMatch[1], options) as ApiResponse<T>;
  }
  if (productImageMatch && method === 'POST') {
    return handleUploadProductImage(productImageMatch[1]) as ApiResponse<T>;
  }
  if (path === '/products' && method === 'GET') {
    return handleGetProducts(endpoint) as ApiResponse<T>;
  }
  if (path === '/products' && method === 'POST') {
    return handleCreateProduct(options) as ApiResponse<T>;
  }
  if (productByIdMatch && method === 'GET') {
    return handleGetProductById(productByIdMatch[1]) as ApiResponse<T>;
  }
  if (productByIdMatch && method === 'PUT') {
    return handleUpdateProduct(productByIdMatch[1], options) as ApiResponse<T>;
  }
  if (productByIdMatch && method === 'DELETE') {
    return handleDeleteProduct(productByIdMatch[1]) as ApiResponse<T>;
  }

  // ── Sales ──
  const saleByIdMatch = path.match(/^\/sales\/([^/]+)$/);

  if (path === '/sales' && method === 'GET') {
    return handleGetSales(endpoint) as ApiResponse<T>;
  }
  if (path === '/sales' && method === 'POST') {
    return handleCreateSale(options) as ApiResponse<T>;
  }
  if (saleByIdMatch && method === 'GET') {
    return handleGetSaleById(saleByIdMatch[1]) as ApiResponse<T>;
  }
  if (saleByIdMatch && method === 'DELETE') {
    return handleVoidSale(saleByIdMatch[1]) as ApiResponse<T>;
  }

  // ── Customers ──
  const customerByIdMatch = path.match(/^\/customers\/([^/]+)$/);

  if (path === '/customers' && method === 'GET') {
    return handleGetCustomers(endpoint) as ApiResponse<T>;
  }
  if (path === '/customers' && method === 'POST') {
    return handleCreateCustomer(options) as ApiResponse<T>;
  }
  if (customerByIdMatch && method === 'GET') {
    return handleGetCustomerById(customerByIdMatch[1]) as ApiResponse<T>;
  }
  if (customerByIdMatch && method === 'PUT') {
    return handleUpdateCustomer(customerByIdMatch[1], options) as ApiResponse<T>;
  }
  if (customerByIdMatch && method === 'DELETE') {
    return handleDeleteCustomer(customerByIdMatch[1]) as ApiResponse<T>;
  }

  // ── Expenses ──
  const expenseByIdMatch = path.match(/^\/expenses\/([^/]+)$/);

  if (path === '/expenses' && method === 'GET') {
    return handleGetExpenses(endpoint) as ApiResponse<T>;
  }
  if (path === '/expenses' && method === 'POST') {
    return handleCreateExpense(options) as ApiResponse<T>;
  }
  if (expenseByIdMatch && method === 'GET') {
    return handleGetExpenseById(expenseByIdMatch[1]) as ApiResponse<T>;
  }
  if (expenseByIdMatch && method === 'PUT') {
    return handleUpdateExpense(expenseByIdMatch[1], options) as ApiResponse<T>;
  }
  if (expenseByIdMatch && method === 'DELETE') {
    return handleDeleteExpense(expenseByIdMatch[1]) as ApiResponse<T>;
  }

  // ── Analytics ──
  if (path === '/analytics/mba' && method === 'GET') {
    return handleGetMba(endpoint) as ApiResponse<T>;
  }

  if (path === '/analytics/summary' && method === 'GET') {
    return handleGetAnalytics() as ApiResponse<T>;
  }

  if (path === '/analytics/revenue-chart' && method === 'GET') {
    const summary = handleGetAnalytics();
    const data = summary.data as AnalyticsSummary;
    const revenueData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().slice(0, 10),
        revenue: Math.round((data.totalRevenue / 7) * (0.7 + Math.random() * 0.6)),
        count: Math.max(1, Math.round(data.totalSalesCount / 7)),
      };
    });
    return { success: true, data: revenueData } as ApiResponse<T>;
  }

  if (path === '/analytics/top-customers' && method === 'GET') {
    const topCustomers = mockCustomers.slice(0, 5).map((c) => ({
      customerId: c.id,
      name: c.name,
      phone: c.phone,
      totalSpent: Math.round(Math.random() * 500000 + 50000),
      orderCount: Math.floor(Math.random() * 15 + 2),
    }));
    return { success: true, data: topCustomers } as ApiResponse<T>;
  }

  // ── Business ──
  if (path === '/business/logo' && method === 'POST') {
    return handleUploadBusinessLogo() as ApiResponse<T>;
  }

  if (path === '/business' && method === 'GET') {
    return handleGetBusiness() as ApiResponse<T>;
  }

  if (path === '/business' && method === 'PUT') {
    return handleUpdateBusiness(options) as ApiResponse<T>;
  }

  // ── Fallback ──
  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `[DEV MODE] No mock handler for ${method} ${path}`,
    },
  };
}

/**
 * Handle FormData requests in dev mode (e.g., image uploads).
 * Called from api.ts for multipart/form-data requests.
 */
export async function getMockFormDataResponse<T>(
  endpoint: string,
  _formData: FormData,
  method: string = 'POST'
): Promise<ApiResponse<T>> {
  await simulateLatency();

  const path = getPath(endpoint);
  const productImageMatch = path.match(/^\/products\/([^/]+)\/image$/);

  if (productImageMatch && method === 'POST') {
    return handleUploadProductImage(productImageMatch[1]) as ApiResponse<T>;
  }

  if (path === '/business/logo' && method === 'POST') {
    return handleUploadBusinessLogo() as ApiResponse<T>;
  }

  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `[DEV MODE] No mock handler for FormData ${method} ${path}`,
    },
  };
}
