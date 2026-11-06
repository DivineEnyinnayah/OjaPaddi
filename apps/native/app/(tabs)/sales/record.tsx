import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Container } from '@/components/container';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  ArrowRight,
  Bank,
  Calendar,
  CaretRight,
  CreditCard,
  MagnifyingGlass,
  Minus,
  Money,
  Plus,
  ShoppingCart,
  Storefront,
  User,
  UserPlus,
  X,
} from 'phosphor-react-native';
import { useCartStore } from '@/stores/cartStore';
import { StyledView, StyledText, StyledTextInput, StyledTouchableOpacity, StyledScrollView, StyledImage } from '@/components/ui/styled';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';
import { imageUri } from '@/lib/image';
import { colorTokens, radius, typeScale, controlHeight } from '@/constants/tokens';

type OrderType = 'customer' | 'supermarket';
type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'cheque' | 'other';
type PaymentStatus = 'paid' | 'partial' | 'unpaid';

const CUSTOMER_PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'cash', label: 'Cash', icon: CreditCard },
  { key: 'transfer', label: 'Transfer', icon: Bank },
  { key: 'pos', label: 'POS', icon: CreditCard },
  { key: 'other', label: 'Other', icon: Money },
];

const SUPERMARKET_PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'transfer', label: 'Bank Transfer', icon: Bank },
  { key: 'cheque', label: 'Cheque', icon: Money },
];

const PAYMENT_STATUSES: { key: PaymentStatus; label: string }[] = [
  { key: 'paid', label: 'Paid' },
  { key: 'partial', label: 'Partial' },
  { key: 'unpaid', label: 'Unpaid' },
];

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function SkeletonProductCard({ opacity }: { opacity: Animated.Value }) {
  return (
    <Animated.View style={{ opacity }} className="mb-3">
      <StyledView className="flex-row items-center gap-3 rounded-card border border-border bg-card p-3">
        <StyledView className="h-14 w-14 rounded-card bg-border" />
        <StyledView className="flex-1 gap-2">
          <StyledView className="h-4 w-44 rounded-md bg-border" />
          <StyledView className="h-3 w-24 rounded-md bg-border" />
        </StyledView>
        <StyledView className="h-9 w-24 rounded-md bg-border" />
      </StyledView>
    </Animated.View>
  );
}

/**
 * FigCraft `04.1 — Checkout` (frame 827), 390×844.
 *
 * The product basket owns the screen; the till (line items, discount, customer,
 * payment method, totals, settle CTA) lives in the checkout sheet and follows
 * the frame's card / pill / mono-ledger language. All cart, order-type,
 * payment and totals logic is preserved from the previous implementation.
 */
export default function RecordSaleScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const toast = useToast();
  const { products, isLoading, fetchProducts } = useProducts();
  const { customers, fetchCustomers, createCustomer } = useCustomers();
  const { createSale } = useSales();

  const {
    items: cartItems,
    selectedCustomer,
    paymentMethod: selectedPayment,
    paymentStatus,
    amountPaid,
    discount,
    notes,
    addItem: addToCart,
    updateQuantity,
    clearCart,
    setCustomer: setSelectedCustomer,
    setPaymentMethod: setSelectedPayment,
    setPaymentStatus,
    setAmountPaid,
    setDiscount,
    setNotes,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const [orderType, setOrderType] = useState<OrderType>('customer');
  const [expectedPaymentDays, setExpectedPaymentDays] = useState('14');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const pulsingOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsingOpacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulsingOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulsingOpacity]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(query);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.toLowerCase();
    return customers.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(query);
      const isSuper = (c.customerType || 'individual') === 'supermarket';
      return matchesSearch && (orderType === 'supermarket' ? isSuper : !isSuper);
    });
  }, [customers, customerSearch, orderType]);

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const subtotal = getSubtotal();
  const total = getTotal();
  const discountValue = parseFloat(discount) || 0;
  const isCartEmpty = cartItems.length === 0;

  const getCartQuantity = useCallback(
    (productId: string): number => {
      const item = cartItems.find((i) => i.product.id === productId);
      return item ? item.quantity : 0;
    },
    [cartItems],
  );

  const handleAddCustomer = useCallback(async () => {
    if (!newCustomerName.trim()) return;
    try {
      const customer = await createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined,
        address: newCustomerAddress.trim() || undefined,
        customerType: orderType === 'supermarket' ? 'supermarket' : 'individual',
        expectedPaymentPeriodDays:
          orderType === 'supermarket' ? parseInt(expectedPaymentDays) || 14 : undefined,
      });
      setSelectedCustomer(customer);
      setShowAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setCustomerModalVisible(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add customer');
    }
  }, [
    newCustomerName,
    newCustomerPhone,
    newCustomerAddress,
    orderType,
    expectedPaymentDays,
    createCustomer,
    setSelectedCustomer,
  ]);

  const handleCompleteSale = useCallback(async () => {
    if (isCartEmpty) return;

    const amountPaidValue = parseFloat(amountPaid) || 0;
    const discountAmount = parseFloat(discount) || 0;

    if (paymentStatus !== 'unpaid' && amountPaidValue <= 0) {
      toast.error('Please enter the amount paid.');
      return;
    }

    if (paymentStatus === 'paid' && amountPaidValue < total) {
      toast.error('Amount paid must equal or exceed the total for paid orders.');
      return;
    }

    if (paymentStatus === 'partial' && (amountPaidValue <= 0 || amountPaidValue >= total)) {
      toast.error(
        'Amount paid for partial payment must be greater than zero and less than the total.',
      );
      return;
    }

    if (orderType === 'supermarket' && !selectedCustomer) {
      toast.error('Please select or add a supermarket for supermarket orders.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const expectedDaysNum = parseInt(expectedPaymentDays) || 14;
      const expectedDate =
        orderType === 'supermarket'
          ? new Date(Date.now() + expectedDaysNum * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

      const orderNotes =
        orderType === 'supermarket'
          ? `[Invoice #${invoiceNumber}] Expected Payment in ${expectedDaysNum} days.${notes ? `\n${notes}` : ''}`
          : notes || undefined;

      const sale = await createSale({
        orderType,
        customerId: selectedCustomer?.id,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: parseFloat(item.product.price),
        })),
        discount: discountAmount || undefined,
        paymentMethod: selectedPayment,
        paymentStatus,
        amountPaid: amountPaidValue,
        expectedPaymentDate: expectedDate,
        notes: orderNotes,
      });

      clearCart();
      setCheckoutVisible(false);

      router.replace({
        pathname: '/receipt',
        params: { saleId: sale.id },
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    orderType,
    expectedPaymentDays,
    invoiceNumber,
    cartItems,
    selectedCustomer,
    selectedPayment,
    paymentStatus,
    amountPaid,
    discount,
    notes,
    total,
    isCartEmpty,
    createSale,
    router,
    clearCart,
  ]);

  useEffect(() => {
    if (paymentStatus === 'paid') {
      setAmountPaid(total > 0 ? total.toString() : '');
    } else if (paymentStatus === 'unpaid') {
      setAmountPaid('');
    }
  }, [paymentStatus, total, setAmountPaid]);

  const renderLineItem = useCallback(
    (product: Product) => {
      const cartQty = getCartQuantity(product.id);
      const isOutOfStock = product.quantity <= 0;
      const isLowStock = product.quantity <= 5 && product.quantity > 0;
      const price = parseFloat(product.price);
      const atMaxStock = cartQty >= product.quantity;

      return (
        <StyledView
          key={product.id}
          className={cn(
            'mb-3 flex-row items-center gap-3 rounded-card border bg-card p-3',
            isOutOfStock ? 'border-border opacity-60' : 'border-border',
            cartQty > 0 && 'border-brand',
          )}
        >
          <StyledView
            className="h-[66px] w-[66px] items-center justify-center overflow-hidden rounded-card"
            style={{ backgroundColor: isOutOfStock ? colorTokens.border.light : colors.accentSoft }}
          >
            {product.imageUrl ? (
              <StyledImage source={{ uri: imageUri(product.imageUrl) }} className="h-full w-full" />
            ) : (
              <StyledText className="font-display text-accent" style={{ fontSize: typeScale.section.fontSize }}>
                {getInitials(product.name)}
              </StyledText>
            )}
          </StyledView>

          <StyledView className="flex-1 gap-0.5">
            <StyledView className="flex-row items-center gap-2">
              <StyledText
                className="flex-1 font-label text-body-sm text-ink"
                numberOfLines={1}
              >
                {product.name}
              </StyledText>
              {product.category && (
                <StyledView className="rounded-pill bg-brand-soft px-2 py-0.5">
                  <StyledText className="font-body text-micro text-muted">
                    {product.category}
                  </StyledText>
                </StyledView>
              )}
            </StyledView>
            <StyledText className="font-label text-body-sm text-ink">
              {formatCurrency(price)}
            </StyledText>
            {isLowStock && (
              <StyledText className="font-label text-micro text-accent">
                Only {product.quantity} left
              </StyledText>
            )}
            {isOutOfStock && (
              <StyledView className="self-start rounded-pill bg-danger-soft px-2 py-0.5">
                <StyledText className="font-label text-micro text-danger">Out of stock</StyledText>
              </StyledView>
            )}
          </StyledView>

          {isOutOfStock ? (
            <StyledView
              className="h-11 w-24 items-center justify-center rounded-button bg-border"
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${product.name} is unavailable`}
            >
              <StyledText className="font-label text-label text-muted">Unavailable</StyledText>
            </StyledView>
          ) : cartQty > 0 ? (
            <StyledView className="flex-row items-center gap-1">
              <StyledTouchableOpacity
                className="h-11 w-11 items-center justify-center rounded-input bg-brand-soft active:opacity-80"
                onPress={() => updateQuantity(product.id, cartQty - 1)}
                accessibilityRole="button"
                accessibilityLabel={`Decrease quantity of ${product.name}`}
                accessibilityHint={`Currently ${cartQty} in cart. Removes the item at a quantity of one.`}
              >
                <Minus size={18} color={colors.brand} weight="bold" />
              </StyledTouchableOpacity>
              <StyledText
                className="min-w-[32px] text-center font-label text-body text-ink"
                numberOfLines={1}
              >
                {cartQty}
              </StyledText>
              <StyledTouchableOpacity
                className={cn(
                  'h-11 w-11 items-center justify-center rounded-input active:opacity-80',
                  atMaxStock ? 'bg-border' : 'bg-brand-soft',
                )}
                onPress={() => addToCart(product)}
                disabled={atMaxStock}
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${product.name}`}
                accessibilityHint={
                  atMaxStock
                    ? `No more stock available. ${product.quantity} in stock.`
                    : `Currently ${cartQty} in cart.`
                }
                accessibilityState={{ disabled: atMaxStock }}
              >
                <Plus size={18} color={atMaxStock ? colors.muted : colors.brand} weight="bold" />
              </StyledTouchableOpacity>
            </StyledView>
          ) : (
            <StyledTouchableOpacity
              className="h-11 w-11 items-center justify-center rounded-button bg-brand active:opacity-80"
              onPress={() => addToCart(product)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              <Plus size={22} color={colors.card} weight="bold" />
            </StyledTouchableOpacity>
          )}
        </StyledView>
      );
    },
    [getCartQuantity, updateQuantity, addToCart, colors],
  );

  const renderCustomerSheet = () => (
    <BottomSheet
      visible={customerModalVisible}
      onClose={() => setCustomerModalVisible(false)}
      icon={<User size={20} color={colors.brand} weight="bold" />}
      title="Select Customer"
      maxHeightRatio={0.8}
      contentClassName="pt-1 pb-2"
      footer={
        showAddCustomer ? (
          <Button
            isDisabled={!newCustomerName.trim()}
            onPress={handleAddCustomer}
            size="md"
            className="w-full"
          >
            {orderType === 'supermarket' ? 'Add Supermarket' : 'Add Customer'}
          </Button>
        ) : undefined
      }
    >
      <StyledView className="mb-2 h-12 flex-row items-center rounded-input border border-border bg-card px-4">
        <MagnifyingGlass size={20} color={colors.muted} />
        <StyledTextInput
          className="ml-2 flex-1 font-body text-body text-ink"
          placeholder="Search customers..."
          placeholderTextColor={colors.muted}
          value={customerSearch}
          onChangeText={setCustomerSearch}
          returnKeyType="search"
          accessibilityLabel="Search customers"
        />
      </StyledView>

      {!showAddCustomer ? (
        <>
          <StyledTouchableOpacity
            className="flex-row items-center gap-3 border-b border-border py-3.5"
            onPress={() => {
              setSelectedCustomer(null);
              setCustomerModalVisible(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Walk-in Customer"
            accessibilityHint="Records the sale without customer details"
            accessibilityState={{ selected: selectedCustomer === null }}
          >
            <StyledView className="h-10 w-10 items-center justify-center rounded-pill bg-border">
              <User size={20} color={colors.muted} />
            </StyledView>
            <StyledView>
              <StyledText className="font-label text-body-sm text-ink">Walk-in Customer</StyledText>
              <StyledText className="font-body text-micro text-muted">No customer details</StyledText>
            </StyledView>
          </StyledTouchableOpacity>

          {filteredCustomers.map((customer) => (
            <StyledTouchableOpacity
              key={customer.id}
              className="flex-row items-center gap-3 border-b border-border py-3.5"
              onPress={() => {
                setSelectedCustomer(customer);
                setCustomerModalVisible(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Select customer ${customer.name}`}
              accessibilityState={{ selected: selectedCustomer?.id === customer.id }}
            >
              <StyledView className="h-10 w-10 items-center justify-center rounded-pill bg-brand">
                <StyledText className="font-label text-body-sm text-card">
                  {getInitials(customer.name)}
                </StyledText>
              </StyledView>
              <StyledView className="flex-1">
                <StyledText className="font-label text-body-sm text-ink">{customer.name}</StyledText>
                {customer.phone && (
                  <StyledText className="font-body text-micro text-muted">{customer.phone}</StyledText>
                )}
              </StyledView>
              {selectedCustomer?.id === customer.id && (
                <StyledText className="font-label text-label text-brand">✓</StyledText>
              )}
            </StyledTouchableOpacity>
          ))}

          <StyledTouchableOpacity
            className="items-center py-4"
            onPress={() => setShowAddCustomer(true)}
            accessibilityRole="button"
            accessibilityLabel={
              orderType === 'supermarket' ? 'Add a new supermarket' : 'Add a new customer'
            }
          >
            <StyledView className="flex-row items-center gap-2">
              <UserPlus size={20} color={colors.brand} />
              <StyledText className="font-label text-body-sm text-brand">Add New Customer</StyledText>
            </StyledView>
          </StyledTouchableOpacity>
        </>
      ) : (
        <StyledView className="gap-4 pt-2">
          <StyledView className="flex-row items-center justify-between">
            <StyledText className="font-label text-body-sm text-ink">
              {orderType === 'supermarket' ? 'New Supermarket' : 'New Customer'}
            </StyledText>
            <StyledTouchableOpacity
              onPress={() => {
                setShowAddCustomer(false);
                setNewCustomerName('');
                setNewCustomerPhone('');
                setNewCustomerAddress('');
              }}
              className="-mr-3 min-h-11 flex-row items-center justify-center rounded-button px-3"
              accessibilityRole="button"
              accessibilityLabel="Cancel adding a customer"
            >
              <StyledText className="font-body text-body-sm text-muted">Cancel</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
          <StyledTextInput
            className="h-12 rounded-card border border-border bg-card px-4 font-body text-body text-ink"
            placeholder={orderType === 'supermarket' ? 'Supermarket name *' : 'Customer name *'}
            placeholderTextColor={colors.muted}
            value={newCustomerName}
            onChangeText={setNewCustomerName}
            accessibilityLabel={
              orderType === 'supermarket' ? 'Supermarket name, required' : 'Customer name, required'
            }
          />
          <StyledTextInput
            className="h-12 rounded-card border border-border bg-card px-4 font-body text-body text-ink"
            placeholder="Phone number"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            value={newCustomerPhone}
            onChangeText={setNewCustomerPhone}
            accessibilityLabel="Phone number"
          />
          <StyledTextInput
            className="h-12 rounded-card border border-border bg-card px-4 font-body text-body text-ink"
            placeholder="Store / Delivery Address"
            placeholderTextColor={colors.muted}
            value={newCustomerAddress}
            onChangeText={setNewCustomerAddress}
            accessibilityLabel="Store or delivery address"
          />
        </StyledView>
      )}
    </BottomSheet>
  );

  const renderCheckoutSheet = () => (
    <BottomSheet
      visible={checkoutVisible}
      onClose={() => setCheckoutVisible(false)}
      icon={<ShoppingCart size={20} color={colors.brand} weight="bold" />}
      title="Checkout"
      maxHeightRatio={0.9}
      contentClassName="pb-2"
      footer={
        <Button
          size="lg"
          isDisabled={isSubmitting || total <= 0}
          onPress={handleCompleteSale}
          className="w-full"
        >
          {isSubmitting ? 'Recording...' : 'Complete sale'}
        </Button>
      }
    >
      {/* Line items — frame 827 item cards */}
      <StyledView className="mb-4">
        {cartItems.map((item) => {
          const lineTotal = parseFloat(item.product.price) * item.quantity;
          return (
            <StyledView
              key={item.product.id}
              className="mb-2 flex-row items-center gap-3 rounded-card border border-border bg-card p-3"
            >
              <StyledView className="h-[52px] w-[52px] items-center justify-center rounded-card bg-accent-soft">
                <StyledText className="font-display text-accent" style={{ fontSize: typeScale.cardTitle.fontSize }}>
                  {getInitials(item.product.name)}
                </StyledText>
              </StyledView>
              <StyledView className="flex-1">
                <StyledText className="font-label text-body-sm text-ink" numberOfLines={1}>
                  {item.product.name}
                </StyledText>
                <StyledText className="font-body text-micro text-muted">
                  {item.quantity} × {formatCurrency(parseFloat(item.product.price))}
                </StyledText>
              </StyledView>
              <StyledText className="font-label text-body-sm text-ink">
                {formatCurrency(lineTotal)}
              </StyledText>
              <StyledTouchableOpacity
                onPress={() => updateQuantity(item.product.id, 0)}
                className="min-h-11 min-w-8 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.product.name} from the order`}
              >
                <X size={20} color={colors.muted} />
              </StyledTouchableOpacity>
            </StyledView>
          );
        })}
      </StyledView>

      {/* Discount — frame 827 accent-soft row */}
      <StyledView className="mb-4 rounded-card bg-accent-soft px-4 py-3">
        <StyledView className="flex-row items-center justify-between">
          <StyledText className="font-label text-label text-ink">Discount (optional)</StyledText>
          <StyledView className="flex-row items-center">
            <StyledText className="mr-1 font-label text-body-sm text-accent">₦</StyledText>
            <StyledTextInput
              className="min-w-[72px] text-right font-label text-body-sm text-accent"
              placeholder="0"
              placeholderTextColor={colors.accent}
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
              accessibilityLabel="Discount in naira"
            />
          </StyledView>
        </StyledView>
        <StyledText className="mt-0.5 font-body text-micro text-muted">
          Applied to the order total at the till
        </StyledText>
      </StyledView>

      {/* Customer — frame 827 customer card */}
      <StyledTouchableOpacity
        className="mb-4"
        activeOpacity={0.7}
        onPress={() => {
          setCustomerSearch('');
          setShowAddCustomer(false);
          setCustomerModalVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Customer: ${selectedCustomer?.name || 'Walk-in Customer'}. Tap to change.`}
      >
        <StyledView className="flex-row items-center gap-3 rounded-card border border-border bg-card px-4 py-3">
          <StyledView className="h-9 w-9 items-center justify-center rounded-pill bg-brand">
            <StyledText className="font-label text-micro text-card">
              {selectedCustomer ? getInitials(selectedCustomer.name) : <User size={16} color={colors.card} />}
            </StyledText>
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="font-label text-body-sm text-ink" numberOfLines={1}>
              {selectedCustomer?.name || 'Walk-in Customer'}
            </StyledText>
            <StyledText className="font-body text-micro text-muted" numberOfLines={1}>
              {selectedCustomer?.phone || 'Tap to select customer'}
            </StyledText>
          </StyledView>
          <CaretRight size={18} color={colors.brand} />
        </StyledView>
      </StyledTouchableOpacity>

      {/* Payment method — frame 827 "HOW ARE YOU GETTING PAID?" pills */}
      <StyledText
        className="mb-2 font-label uppercase tracking-[1.5px]"
        style={{ fontSize: typeScale.label.fontSize, color: colors.muted }}
      >
        HOW ARE YOU GETTING PAID?
      </StyledText>
      <StyledView className="mb-4 flex-row flex-wrap gap-2">
        {(orderType === 'supermarket' ? SUPERMARKET_PAYMENT_METHODS : CUSTOMER_PAYMENT_METHODS).map(
          (method) => {
            const isSelected = selectedPayment === method.key;
            const IconComponent = method.icon;
            return (
              <StyledTouchableOpacity
                key={method.key}
                className={cn(
                  'min-h-11 flex-row items-center justify-center gap-1.5 rounded-pill border px-4',
                  isSelected ? 'border-brand bg-brand' : 'border-border bg-card',
                )}
                onPress={() => setSelectedPayment(method.key)}
                accessibilityRole="button"
                accessibilityLabel={`Pay by ${method.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <IconComponent size={16} color={isSelected ? colors.card : colors.brand} />
                <StyledText
                  className={cn(
                    'font-label text-label',
                    isSelected ? 'text-card' : 'text-ink',
                  )}
                >
                  {method.label}
                </StyledText>
              </StyledTouchableOpacity>
            );
          },
        )}
      </StyledView>

      {/* Supermarket supply terms */}
      {orderType === 'supermarket' && (
        <StyledView className="mb-4 rounded-card border border-border bg-card p-3">
          <StyledView className="mb-2 flex-row items-center gap-2">
            <Calendar size={18} color={colors.brand} />
            <StyledText className="font-label text-body-sm text-ink">
              Supermarket Supply Terms
            </StyledText>
          </StyledView>
          <StyledText className="mb-1 font-label text-micro text-muted">
            Expected Payment Period (Days)
          </StyledText>
          <StyledTextInput
            className="mb-3 min-h-11 rounded-input border border-border bg-brand-soft px-3 py-2 font-label text-body-sm text-ink"
            keyboardType="numeric"
            value={expectedPaymentDays}
            onChangeText={setExpectedPaymentDays}
            placeholder="e.g. 14"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Expected payment period in days"
          />
          <StyledText className="mb-1 font-label text-micro text-muted">Invoice Number</StyledText>
          <StyledTextInput
            className="min-h-11 rounded-input border border-border bg-brand-soft px-3 py-2 font-label text-body-sm text-ink"
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            placeholder="e.g. INV-001"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Invoice number"
          />
        </StyledView>
      )}

      {/* Payment status */}
      <StyledText className="mb-2 font-label text-body-sm text-ink">Payment status</StyledText>
      <StyledView className="mb-4 flex-row gap-2">
        {PAYMENT_STATUSES.map((status) => {
          const isSelected = paymentStatus === status.key;
          return (
            <StyledTouchableOpacity
              key={status.key}
              className={cn(
                'min-h-11 flex-1 items-center justify-center rounded-button border',
                isSelected ? 'border-brand bg-brand' : 'border-border bg-card',
              )}
              onPress={() => setPaymentStatus(status.key)}
              accessibilityRole="button"
              accessibilityLabel={`Payment status ${status.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <StyledText
                className={cn('font-label text-body-sm', isSelected ? 'text-card' : 'text-muted')}
              >
                {status.label}
              </StyledText>
            </StyledTouchableOpacity>
          );
        })}
      </StyledView>

      {paymentStatus !== 'unpaid' && (
        <StyledView className="mb-4">
          <StyledText className="mb-2 font-label text-body-sm text-ink">Amount paid</StyledText>
          <StyledView className="h-12 flex-row items-center rounded-input border border-border bg-card px-4">
            <StyledText className="mr-1 font-label text-body text-muted">₦</StyledText>
            <StyledTextInput
              className="flex-1 font-body text-body text-ink"
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={amountPaid}
              onChangeText={setAmountPaid}
              accessibilityLabel="Amount paid in naira"
            />
          </StyledView>
        </StyledView>
      )}

      <StyledView className="mb-4">
        <StyledText className="mb-2 font-label text-body-sm text-ink">Notes (optional)</StyledText>
        <StyledTextInput
          className="min-h-[80px] rounded-card border border-border bg-card px-4 py-3 font-body text-body text-ink"
          placeholder="Add any notes..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
          accessibilityLabel="Order notes"
        />
      </StyledView>

      {/* Totals — frame 827 summary rule + mono total */}
      <StyledView className="h-px bg-border" />
      <StyledView className="mt-3 flex-row items-center justify-between">
        <StyledText className="font-body text-body-sm text-muted">Subtotal</StyledText>
        <StyledText className="font-ledger text-body-sm text-ink">{formatCurrency(subtotal)}</StyledText>
      </StyledView>
      {discountValue > 0 && (
        <StyledView className="mt-2 flex-row items-center justify-between">
          <StyledText className="font-body text-body-sm text-muted">Discount</StyledText>
          <StyledText className="font-ledger text-body-sm text-accent">
            −{formatCurrency(discountValue)}
          </StyledText>
        </StyledView>
      )}
      <StyledView className="mt-3 flex-row items-end justify-between border-t border-border pt-3">
        <StyledText className="font-label text-body-sm text-brand">TOTAL</StyledText>
        <StyledText className="font-display text-ink" style={{ fontSize: typeScale.title.fontSize }}>
          {formatCurrency(total)}
        </StyledText>
      </StyledView>
    </BottomSheet>
  );

  return (
    <Container isScrollable={false} withTabBar>
      <StyledView className="flex-1">
        {/* Header — frame 827: back button, title, customer chip */}
        <StyledView className="flex-row items-center px-6 pt-3">
          <StyledTouchableOpacity
            className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-card active:opacity-70"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color={colors.ink} weight="bold" />
          </StyledTouchableOpacity>
          <StyledText
            className="ml-4 flex-1 font-display tracking-[-0.26px] text-ink"
            style={{ fontSize: typeScale.title.fontSize, lineHeight: typeScale.title.lineHeight }}
          >
            Checkout
          </StyledText>
          <StyledView className="h-9 flex-row items-center gap-2 rounded-pill border border-border bg-card px-3">
            <StyledView className="h-3 w-3 rounded-pill bg-brand" />
            <StyledText className="font-label text-label text-ink" numberOfLines={1}>
              {selectedCustomer?.name.split(' ')[0] || 'Walk-in'}
            </StyledText>
          </StyledView>
        </StyledView>

        {/* Order type toggle */}
        <StyledView className="mt-4 flex-row gap-2 px-6">
          <StyledTouchableOpacity
            className={cn(
              'min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-button border',
              orderType === 'customer' ? 'border-brand bg-brand' : 'border-border bg-card',
            )}
            onPress={() => {
              setOrderType('customer');
              setSelectedPayment('cash');
              if (selectedCustomer?.customerType === 'supermarket') {
                setSelectedCustomer(null);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Customer Order"
            accessibilityState={{ selected: orderType === 'customer' }}
          >
            <User size={16} color={orderType === 'customer' ? colors.card : colors.muted} />
            <StyledText
              className={cn(
                'font-label text-label',
                orderType === 'customer' ? 'text-card' : 'text-muted',
              )}
            >
              Customer
            </StyledText>
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className={cn(
              'min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-button border',
              orderType === 'supermarket' ? 'border-brand bg-brand' : 'border-border bg-card',
            )}
            onPress={() => {
              setOrderType('supermarket');
              setSelectedPayment('transfer');
              if (selectedCustomer?.customerType !== 'supermarket') {
                setSelectedCustomer(null);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Supermarket Supply"
            accessibilityState={{ selected: orderType === 'supermarket' }}
          >
            <Storefront size={16} color={orderType === 'supermarket' ? colors.card : colors.muted} />
            <StyledText
              className={cn(
                'font-label text-label',
                orderType === 'supermarket' ? 'text-card' : 'text-muted',
              )}
            >
              Supermarket
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>

        {/* Search basket — frame 827 */}
        <StyledView className="mt-4 px-6">
          <StyledView className="h-11 flex-row items-center rounded-input border border-border bg-card px-4">
            <MagnifyingGlass size={18} color={colors.muted} />
            <StyledTextInput
              className="ml-2 flex-1 font-body text-body-sm text-ink"
              placeholder="Scan or type item…"
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search products"
            />
            {searchQuery.length > 0 && (
              <StyledTouchableOpacity
                onPress={() => setSearchQuery('')}
                className="-mr-3 min-h-11 min-w-8 items-center justify-center"
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel="Clear product search"
              >
                <X size={16} color={colors.muted} />
              </StyledTouchableOpacity>
            )}
          </StyledView>
        </StyledView>

        {categories.length > 0 && !searchQuery && (
          <StyledView className="mt-3">
            <StyledScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              contentInsetAdjustmentBehavior="never"
            >
              <StyledView className="flex-row gap-2">
                <StyledTouchableOpacity
                  className={cn(
                    'min-h-9 justify-center rounded-pill border px-4',
                    !selectedCategory ? 'border-brand bg-brand' : 'border-border bg-card',
                  )}
                  onPress={() => setSelectedCategory(null)}
                  accessibilityRole="button"
                  accessibilityLabel="All categories"
                  accessibilityState={{ selected: !selectedCategory }}
                >
                  <StyledText
                    className={cn(
                      'font-label text-label',
                      !selectedCategory ? 'text-card' : 'text-muted',
                    )}
                  >
                    All
                  </StyledText>
                </StyledTouchableOpacity>
                {categories.map((cat) => (
                  <StyledTouchableOpacity
                    key={cat}
                    className={cn(
                      'min-h-9 justify-center rounded-pill border px-4',
                      selectedCategory === cat ? 'border-brand bg-brand' : 'border-border bg-card',
                    )}
                    onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${cat}`}
                    accessibilityState={{ selected: selectedCategory === cat }}
                  >
                    <StyledText
                      className={cn(
                        'font-label text-label',
                        selectedCategory === cat ? 'text-card' : 'text-muted',
                      )}
                    >
                      {cat}
                    </StyledText>
                  </StyledTouchableOpacity>
                ))}
              </StyledView>
            </StyledScrollView>
          </StyledView>
        )}

        {/* Basket heading — frame 827 */}
        <StyledView className="flex-row items-center justify-between px-6 pb-2 pt-4">
          <StyledText
            className="font-label uppercase tracking-[1.5px]"
            style={{ fontSize: typeScale.label.fontSize, color: colors.muted }}
          >
            {cartItemCount > 0
              ? `IN BASKET · ${cartItemCount} ITEM${cartItemCount !== 1 ? 'S' : ''}`
              : 'ADD ITEMS'}
          </StyledText>
          {cartItemCount > 0 && (
            <StyledTouchableOpacity
              onPress={clearCart}
              className="min-h-11 justify-center"
              accessibilityRole="button"
              accessibilityLabel="Clear all items from the basket"
            >
              <StyledText className="font-label text-micro text-accent">Clear</StyledText>
            </StyledTouchableOpacity>
          )}
        </StyledView>

        {isLoading && products.length === 0 ? (
          <StyledScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonProductCard key={i} opacity={pulsingOpacity} />
            ))}
          </StyledScrollView>
        ) : filteredProducts.length === 0 ? (
          <StyledView className="flex-1 items-center justify-center px-6">
            <MagnifyingGlass size={48} color={colors.muted} />
            <StyledText className="mt-4 text-center font-body text-body text-muted">
              {searchQuery
                ? 'No products match your search'
                : selectedCategory
                  ? `No products in "${selectedCategory}"`
                  : 'No products available'}
            </StyledText>
          </StyledView>
        ) : (
          <StyledScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: cartItemCount > 0 ? TAB_BAR_OFFSET + 96 : TAB_BAR_OFFSET + 20,
            }}
            contentInsetAdjustmentBehavior="never"
          >
            {filteredProducts.map(renderLineItem)}
          </StyledScrollView>
        )}

        {cartItemCount > 0 && (
          <StyledView
            className="absolute left-0 right-0 z-10 border-t border-border bg-background px-6 py-3"
            style={{ bottom: TAB_BAR_OFFSET }}
          >
            <StyledView className="flex-row items-center justify-between">
              <StyledView className="flex-row items-center gap-3">
                <StyledView className="relative">
                  <ShoppingCart size={24} color={colors.brand} weight="bold" />
                  <StyledView className="absolute -right-2 -top-1.5 min-w-[20px] items-center justify-center rounded-pill bg-brand px-1.5">
                    <StyledText className="font-label text-micro text-card">{cartItemCount}</StyledText>
                  </StyledView>
                </StyledView>
                <StyledView>
                  <StyledText className="font-body text-micro text-muted">
                    {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                  </StyledText>
                  <StyledText className="font-ledger text-body text-ink">
                    {formatCurrency(subtotal)}
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledTouchableOpacity
                className="flex-row items-center gap-2 rounded-button bg-brand px-6"
                style={{ minHeight: controlHeight.control }}
                onPress={() => setCheckoutVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={`Review order, ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}, ${formatCurrency(subtotal)}`}
              >
                <StyledText className="font-label text-body text-card">Review</StyledText>
                <ArrowRight size={18} color={colors.card} weight="bold" />
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        )}
      </StyledView>

      {renderCustomerSheet()}
      {renderCheckoutSheet()}

      {isSubmitting && (
        <StyledView className="absolute inset-0 z-[60] items-center justify-center bg-brand-strong/60">
          <StyledView className="items-center gap-3 rounded-card bg-card p-8">
            <StyledView className="h-12 w-12 items-center justify-center rounded-pill bg-brand-soft">
              <StyledView className="h-8 w-8 rounded-pill bg-brand opacity-60" />
            </StyledView>
            <StyledText className="font-label text-body text-ink">Recording sale...</StyledText>
          </StyledView>
        </StyledView>
      )}
    </Container>
  );
}
