import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  ArrowRight,
  Bank,
  Calendar,
  CaretRight,
  CreditCard,
  DotsThree,
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
import { withUniwind } from 'uniwind';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTextInput = withUniwind(TextInput);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledScrollView = withUniwind(ScrollView);
const StyledImage = withUniwind(Image);

type OrderType = 'customer' | 'supermarket';
type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'cheque' | 'other';
type PaymentStatus = 'paid' | 'partial' | 'unpaid';

const CUSTOMER_PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'cash', label: 'Cash', icon: CreditCard },
  { key: 'transfer', label: 'Transfer', icon: Bank },
  { key: 'pos', label: 'POS', icon: CreditCard },
  { key: 'other', label: 'Other', icon: DotsThree },
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
      <StyledView className="flex-row items-center gap-3 bg-surface-container-lowest rounded-card p-3 border border-outline-variant/20">
        <StyledView className="w-14 h-14 rounded-card bg-surface-container" />
        <StyledView className="flex-1 gap-2">
          <StyledView className="h-4 w-44 bg-surface-container rounded-md" />
          <StyledView className="h-3 w-24 bg-surface-container rounded-md" />
        </StyledView>
        <StyledView className="w-24 h-9 bg-surface-container rounded-md" />
      </StyledView>
    </Animated.View>
  );
}

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
        expectedPaymentPeriodDays: orderType === 'supermarket' ? parseInt(expectedPaymentDays) || 14 : undefined,
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
  }, [newCustomerName, newCustomerPhone, newCustomerAddress, orderType, expectedPaymentDays, createCustomer, setSelectedCustomer]);

  const handleCompleteSale = useCallback(async () => {
    if (isCartEmpty) return;

    const amountPaidValue = parseFloat(amountPaid) || 0;
    const discountAmount = parseFloat(discount) || 0;

    if (paymentStatus !== 'unpaid' && amountPaidValue <= 0) {
      toast.error('Please enter the amount paid.');
      return;
    }

    if (paymentStatus === 'paid' && amountPaidValue < total) {
      toast.error(
        'Amount paid must equal or exceed the total for paid orders.',
      );
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

  const renderProductCard = useCallback(
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
            'flex-row items-center gap-3 bg-surface-container-lowest rounded-card p-3 mb-2 border',
            isOutOfStock ? 'border-outline-variant/30 opacity-60' : 'border-outline-variant/20',
            cartQty > 0 && 'border-primary/30 bg-primary/5',
          )}
        >
          <StyledView className="w-14 h-14 rounded-card bg-primary/10 items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <StyledImage source={{ uri: product.imageUrl }} className="w-full h-full" />
            ) : (
              <StyledText className="text-body-lg font-bold text-primary">
                {getInitials(product.name)}
              </StyledText>
            )}
          </StyledView>

          <StyledView className="flex-1 gap-0.5">
            <StyledView className="flex-row items-center gap-2">
              <StyledText className="text-body-sm font-semibold text-on-surface flex-1" numberOfLines={1}>
                {product.name}
              </StyledText>
              {product.category && (
                <StyledView className="bg-surface-container rounded-full px-2 py-0.5">
                  <StyledText className="text-label-sm font-medium text-on-surface-variant">
                    {product.category}
                  </StyledText>
                </StyledView>
              )}
            </StyledView>
            <StyledText className="text-body-lg font-bold text-primary">
              {formatCurrency(price)}
            </StyledText>
            {isLowStock && (
              <StyledText className="text-label-sm text-error font-medium">
                Only {product.quantity} left
              </StyledText>
            )}
            {isOutOfStock && (
              <StyledView className="bg-error/10 self-start rounded-full px-2 py-0.5">
                <StyledText className="text-label-sm text-error font-semibold">
                  Out of Stock
                </StyledText>
              </StyledView>
            )}
          </StyledView>

          {isOutOfStock ? (
            <StyledView
              className="w-24 h-9 bg-surface-container rounded-md items-center justify-center"
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${product.name} is unavailable`}
            >
              <StyledText className="text-label-bold text-on-surface-variant font-medium">
                Unavailable
              </StyledText>
            </StyledView>
          ) : cartQty > 0 ? (
            <StyledView className="flex-row items-center">
              <StyledTouchableOpacity
                className="size-11 rounded-full bg-primary items-center justify-center active:opacity-80"
                onPress={() => updateQuantity(product.id, cartQty - 1)}
                accessibilityRole="button"
                accessibilityLabel={`Decrease quantity of ${product.name}`}
                accessibilityHint={`Currently ${cartQty} in cart. Removes the item at a quantity of one.`}
              >
                <Minus size={18} color="#FFFFFF" />
              </StyledTouchableOpacity>
              <StyledText
                className="min-w-[36px] text-body-sm font-bold text-on-surface text-center"
                numberOfLines={1}
              >
                {cartQty}
              </StyledText>
              <StyledTouchableOpacity
                className={cn(
                  'size-11 rounded-full items-center justify-center active:opacity-80',
                  atMaxStock ? 'bg-outline/30' : 'bg-primary/15',
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
                <Plus
                  size={18}
                  color={atMaxStock ? colors.outline : colors.primary}
                />
              </StyledTouchableOpacity>
            </StyledView>
          ) : (
            <StyledTouchableOpacity
              className="size-11 rounded-button bg-primary items-center justify-center active:opacity-80"
              onPress={() => addToCart(product)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              <Plus size={22} color="#FFFFFF" />
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
      icon={<User size={20} color={colors.onPrimaryContainer} />}
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
      <StyledView className="flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-card px-4 h-11 mb-2">
        <MagnifyingGlass size={20} color={colors.outline} />
        <StyledTextInput
          className="flex-1 ml-2 text-body-md text-on-surface"
          placeholder="Search customers..."
          placeholderTextColor={colors.outline}
          value={customerSearch}
          onChangeText={setCustomerSearch}
          returnKeyType="search"
          accessibilityLabel="Search customers"
        />
      </StyledView>

      {!showAddCustomer ? (
        <>
          <StyledTouchableOpacity
            className="py-3.5 border-b border-outline-variant/10 flex-row items-center gap-3"
            onPress={() => {
              setSelectedCustomer(null);
              setCustomerModalVisible(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Walk-in Customer"
            accessibilityHint="Records the sale without customer details"
            accessibilityState={{ selected: selectedCustomer === null }}
          >
            <StyledView className="w-10 h-10 rounded-full bg-surface-container items-center justify-center">
              <User size={20} color={colors.outline} />
            </StyledView>
            <StyledView>
              <StyledText className="text-body-sm font-semibold text-on-surface">
                Walk-in Customer
              </StyledText>
              <StyledText className="text-label-bold text-on-surface-variant">
                No customer details
              </StyledText>
            </StyledView>
          </StyledTouchableOpacity>

          {filteredCustomers.map((customer) => (
            <StyledTouchableOpacity
              key={customer.id}
              className="py-3.5 border-b border-outline-variant/10 flex-row items-center gap-3"
              onPress={() => {
                setSelectedCustomer(customer);
                setCustomerModalVisible(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Select customer ${customer.name}`}
              accessibilityState={{ selected: selectedCustomer?.id === customer.id }}
            >
              <StyledView className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <StyledText className="text-body-sm font-bold text-primary">
                  {getInitials(customer.name)}
                </StyledText>
              </StyledView>
              <StyledView className="flex-1">
                <StyledText className="text-body-sm font-semibold text-on-surface">
                  {customer.name}
                </StyledText>
                {customer.phone && (
                  <StyledText className="text-label-bold text-on-surface-variant">
                    {customer.phone}
                  </StyledText>
                )}
              </StyledView>
              {selectedCustomer?.id === customer.id && (
                <StyledText className="text-label-bold text-primary">✓</StyledText>
              )}
            </StyledTouchableOpacity>
          ))}

          <StyledTouchableOpacity
            className="py-4 items-center"
            onPress={() => setShowAddCustomer(true)}
            accessibilityRole="button"
            accessibilityLabel={
              orderType === 'supermarket' ? 'Add a new supermarket' : 'Add a new customer'
            }
          >
            <StyledView className="flex-row items-center gap-2">
              <UserPlus size={20} color={colors.primary} />
              <StyledText className="text-body-sm font-semibold text-primary">
                Add New Customer
              </StyledText>
            </StyledView>
          </StyledTouchableOpacity>
        </>
      ) : (
        <StyledView className="pt-2 gap-4">
          <StyledView className="flex-row items-center justify-between">
            <StyledText className="text-body-sm font-semibold text-on-surface">
              {orderType === 'supermarket' ? 'New Supermarket' : 'New Customer'}
            </StyledText>
            <StyledTouchableOpacity
              onPress={() => {
                setShowAddCustomer(false);
                setNewCustomerName('');
                setNewCustomerPhone('');
                setNewCustomerAddress('');
              }}
              className="flex-row items-center justify-center min-h-[44px] px-3 -mr-3 rounded-button"
              accessibilityRole="button"
              accessibilityLabel="Cancel adding a customer"
            >
              <StyledText className="text-body-sm text-on-surface-variant">Cancel</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
          <StyledTextInput
            className="bg-surface-container-lowest border border-outline-variant rounded-card px-4 h-12 text-body-lg text-on-surface"
            placeholder={orderType === 'supermarket' ? 'Supermarket name *' : 'Customer name *'}
            placeholderTextColor={colors.outline}
            value={newCustomerName}
            onChangeText={setNewCustomerName}
            accessibilityLabel={
              orderType === 'supermarket' ? 'Supermarket name, required' : 'Customer name, required'
            }
          />
          <StyledTextInput
            className="bg-surface-container-lowest border border-outline-variant rounded-card px-4 h-12 text-body-lg text-on-surface"
            placeholder="Phone number"
            placeholderTextColor={colors.outline}
            keyboardType="phone-pad"
            value={newCustomerPhone}
            onChangeText={setNewCustomerPhone}
            accessibilityLabel="Phone number"
          />
          <StyledTextInput
            className="bg-surface-container-lowest border border-outline-variant rounded-card px-4 h-12 text-body-lg text-on-surface"
            placeholder="Store / Delivery Address"
            placeholderTextColor={colors.outline}
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
      icon={<CreditCard size={20} color={colors.onPrimaryContainer} />}
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
          {isSubmitting ? 'Recording...' : 'Complete Sale'}
        </Button>
      }
    >
      <Surface variant="primary" className="mb-4">
        <StyledText className="text-body-sm font-semibold text-on-surface mb-3">
          Order Summary
        </StyledText>
        {cartItems.map((item) => {
          const lineTotal = parseFloat(item.product.price) * item.quantity;
          return (
            <StyledView
              key={item.product.id}
              className="flex-row items-center justify-between py-2.5 border-b border-outline-variant/10"
            >
              <StyledView className="flex-1 mr-2">
                <StyledText className="text-body-sm font-medium text-on-surface" numberOfLines={1}>
                  {item.product.name}
                </StyledText>
                <StyledText className="text-label-bold text-on-surface-variant mt-0.5">
                  {formatCurrency(parseFloat(item.product.price))} × {item.quantity}
                </StyledText>
              </StyledView>
              <StyledView className="flex-row items-center">
                <StyledText className="text-body-sm font-bold text-on-surface">
                  {formatCurrency(lineTotal)}
                </StyledText>
                <StyledTouchableOpacity
                  onPress={() => updateQuantity(item.product.id, 0)}
                  className="size-11 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.product.name} from the order`}
                >
                  <StyledView className="size-7 rounded-full bg-error/10 items-center justify-center">
                    <X size={14} color={colors.error} />
                  </StyledView>
                </StyledTouchableOpacity>
              </StyledView>
            </StyledView>
          );
        })}
      </Surface>

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
        <Surface variant="primary" className="flex-row items-center justify-between">
          <StyledView className="flex-row items-center gap-3">
            <StyledView className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <User size={20} color={colors.primary} />
            </StyledView>
            <StyledView>
              <StyledText className="text-body-sm font-semibold text-on-surface">
                {selectedCustomer?.name || 'Walk-in Customer'}
              </StyledText>
              <StyledText className="text-label-bold text-on-surface-variant">
                {selectedCustomer?.phone || 'Tap to select customer'}
              </StyledText>
            </StyledView>
          </StyledView>
          <CaretRight size={20} color={colors.outline} />
        </Surface>
      </StyledTouchableOpacity>

      <StyledText className="text-body-sm font-semibold text-on-surface mb-2">
        Payment Method
      </StyledText>
      <StyledView className="flex-row gap-2 mb-4">
        {(orderType === 'supermarket' ? SUPERMARKET_PAYMENT_METHODS : CUSTOMER_PAYMENT_METHODS).map((method) => {
          const isSelected = selectedPayment === method.key;
          const IconComponent = method.icon;
          return (
            <StyledTouchableOpacity
              key={method.key}
              className={cn(
                'flex-1 items-center py-3 rounded-card border',
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-surface-container-lowest border-outline-variant',
              )}
              onPress={() => setSelectedPayment(method.key)}
              accessibilityRole="button"
              accessibilityLabel={`Pay by ${method.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <IconComponent
                size={20}
                color={isSelected ? '#FFFFFF' : colors.onSurfaceVariant}
              />
              <StyledText
                className={cn(
                  'text-label-bold font-semibold mt-1 text-center',
                  isSelected ? 'text-on-primary' : 'text-on-surface-variant',
                )}
              >
                {method.label}
              </StyledText>
            </StyledTouchableOpacity>
          );
        })}
      </StyledView>

      {orderType === 'supermarket' && (
        <Surface variant="outline" className="mb-4 p-3 bg-surface-container-lowest border-outline-variant rounded-card">
          <StyledView className="flex-row items-center gap-2 mb-2">
            <Calendar size={18} color={colors.primary} />
            <StyledText className="text-body-sm font-bold text-on-surface">
              Supermarket Supply Terms
            </StyledText>
          </StyledView>
          <StyledText className="text-label-bold text-on-surface-variant mb-1">
            Expected Payment Period (Days)
          </StyledText>
          <StyledTextInput
            className="bg-surface-container rounded-input px-3 py-2 text-body-sm text-on-surface font-semibold mb-3 border border-outline-variant/30 min-h-[44px]"
            keyboardType="numeric"
            value={expectedPaymentDays}
            onChangeText={setExpectedPaymentDays}
            placeholder="e.g. 14"
            placeholderTextColor={colors.outline}
            accessibilityLabel="Expected payment period in days"
          />
          <StyledText className="text-label-bold text-on-surface-variant mb-1">
            Invoice Number
          </StyledText>
          <StyledTextInput
            className="bg-surface-container rounded-input px-3 py-2 text-body-sm text-on-surface font-semibold border border-outline-variant/30 min-h-[44px]"
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            placeholder="e.g. INV-001"
            placeholderTextColor={colors.outline}
            accessibilityLabel="Invoice number"
          />
        </Surface>
      )}

      <StyledText className="text-body-sm font-semibold text-on-surface mb-2">
        Payment Status
      </StyledText>
      <StyledView className="flex-row gap-2 mb-4">
        {PAYMENT_STATUSES.map((status) => {
          const isSelected = paymentStatus === status.key;
          return (
            <StyledTouchableOpacity
              key={status.key}
              className={cn(
                'flex-1 py-2.5 rounded-card border items-center min-h-[44px]',
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-surface-container-lowest border-outline-variant',
              )}
              onPress={() => setPaymentStatus(status.key)}
              accessibilityRole="button"
              accessibilityLabel={`Payment status ${status.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <StyledText
                className={cn(
                  'text-body-sm font-semibold',
                  isSelected ? 'text-on-primary' : 'text-on-surface-variant',
                )}
              >
                {status.label}
              </StyledText>
            </StyledTouchableOpacity>
          );
        })}
      </StyledView>

      {paymentStatus !== 'unpaid' && (
        <StyledView className="mb-4">
          <StyledText className="text-body-sm font-semibold text-on-surface mb-2">
            Amount Paid
          </StyledText>
          <StyledView className="flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-card px-4 h-12">
            <StyledText className="text-body-lg font-semibold text-on-surface-variant mr-1">
              ₦
            </StyledText>
            <StyledTextInput
              className="flex-1 text-body-lg text-on-surface"
              placeholder="0"
              placeholderTextColor={colors.outline}
              keyboardType="numeric"
              value={amountPaid}
              onChangeText={setAmountPaid}
              accessibilityLabel="Amount paid in naira"
            />
          </StyledView>
        </StyledView>
      )}

      <StyledView className="mb-4">
        <StyledText className="text-body-sm font-semibold text-on-surface mb-2">
          Discount (optional)
        </StyledText>
        <StyledView className="flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-card px-4 h-12">
          <StyledText className="text-body-lg font-semibold text-on-surface-variant mr-1">
            ₦
          </StyledText>
          <StyledTextInput
            className="flex-1 text-body-lg text-on-surface"
            placeholder="0"
            placeholderTextColor={colors.outline}
            keyboardType="numeric"
            value={discount}
            onChangeText={setDiscount}
            accessibilityLabel="Discount in naira"
          />
        </StyledView>
      </StyledView>

      <StyledView className="mb-4">
        <StyledText className="text-body-sm font-semibold text-on-surface mb-2">
          Notes (optional)
        </StyledText>
        <StyledTextInput
          className="bg-surface-container-lowest border border-outline-variant rounded-card px-4 py-3 text-body-lg text-on-surface min-h-[80px]"
          placeholder="Add any notes..."
          placeholderTextColor={colors.outline}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
          accessibilityLabel="Order notes"
        />
      </StyledView>

      <Surface variant="primary" className="mb-2">
        <StyledView className="flex-row justify-between items-center py-1">
          <StyledText className="text-body-sm text-on-surface-variant">Subtotal</StyledText>
          <StyledText className="text-body-sm font-semibold text-on-surface">
            {formatCurrency(subtotal)}
          </StyledText>
        </StyledView>
        {(parseFloat(discount) || 0) > 0 && (
          <StyledView className="flex-row justify-between items-center py-1">
            <StyledText className="text-body-sm text-on-surface-variant">Discount</StyledText>
            <StyledText className="text-body-sm font-semibold text-error">
              -{formatCurrency(parseFloat(discount) || 0)}
            </StyledText>
          </StyledView>
        )}
        <StyledView className="flex-row justify-between items-center pt-3 mt-2 border-t border-outline-variant/30">
          <StyledText className="text-body-lg font-bold text-on-surface">Total</StyledText>
          <StyledText className="text-h2 font-bold text-primary">
            {formatCurrency(total)}
          </StyledText>
        </StyledView>
      </Surface>
    </BottomSheet>
  );

  return (
    <Container isScrollable={false} withTabBar>
      <StyledView className="flex-1">
        <StyledView className="px-5 pt-14 pb-2">
          <StyledView className="flex-row items-center gap-3 mb-4">
            <StyledTouchableOpacity
              className="size-11 rounded-full bg-surface-container items-center justify-center active:opacity-70"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color={colors.onSurface} />
            </StyledTouchableOpacity>
            <StyledText className="text-h2 font-black text-on-surface text-balance">
              Record Sale
            </StyledText>
          </StyledView>

          {/* Order Type Toggle: Customer vs Supermarket */}
          <StyledView className="flex-row bg-surface-container rounded-card p-1 mb-4 border border-outline-variant/30">
            <StyledTouchableOpacity
              className={cn(
                'flex-1 flex-row items-center justify-center py-2.5 rounded-button gap-2 min-h-[44px]',
                orderType === 'customer' ? 'bg-primary shadow-sm' : 'bg-transparent'
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
              <User size={18} color={orderType === 'customer' ? '#FFFFFF' : colors.onSurfaceVariant} />
              <StyledText
                className={cn(
                  'text-label-bold font-bold',
                  orderType === 'customer' ? 'text-on-primary' : 'text-on-surface-variant'
                )}
              >
                Customer Order
              </StyledText>
            </StyledTouchableOpacity>

            <StyledTouchableOpacity
              className={cn(
                'flex-1 flex-row items-center justify-center py-2.5 rounded-button gap-2 min-h-[44px]',
                orderType === 'supermarket' ? 'bg-primary shadow-sm' : 'bg-transparent'
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
              <Storefront size={18} color={orderType === 'supermarket' ? '#FFFFFF' : colors.onSurfaceVariant} />
              <StyledText
                className={cn(
                  'text-label-bold font-bold',
                  orderType === 'supermarket' ? 'text-on-primary' : 'text-on-surface-variant'
                )}
              >
                Supermarket Supply
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>

          <StyledView className="flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-card px-4 h-11">
            <MagnifyingGlass size={20} color={colors.outline} />
            <StyledTextInput
              className="flex-1 ml-2 text-body-md text-on-surface"
              placeholder="Search products..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search products"
            />
            {searchQuery.length > 0 && (
              <StyledTouchableOpacity
                onPress={() => setSearchQuery('')}
                className="size-11 items-center justify-center -mr-3"
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel="Clear product search"
              >
                <X size={18} color={colors.outline} />
              </StyledTouchableOpacity>
            )}
          </StyledView>
        </StyledView>

        {categories.length > 0 && !searchQuery && (
          <StyledView className="px-5 pb-3">
            <StyledScrollView horizontal showsHorizontalScrollIndicator={false} contentInsetAdjustmentBehavior="never">
              <StyledView className="flex-row gap-2">
                <StyledTouchableOpacity
                  className={cn(
                    'rounded-full px-4 border min-h-[44px] justify-center',
                    !selectedCategory
                      ? 'bg-primary border-primary'
                      : 'bg-surface-container-lowest border-outline-variant',
                  )}
                  onPress={() => setSelectedCategory(null)}
                  accessibilityRole="button"
                  accessibilityLabel="All categories"
                  accessibilityState={{ selected: !selectedCategory }}
                >
                  <StyledText
                    className={cn(
                      'text-label-bold font-semibold',
                      !selectedCategory ? 'text-on-primary' : 'text-on-surface-variant',
                    )}
                  >
                    All
                  </StyledText>
                </StyledTouchableOpacity>
                {categories.map((cat) => (
                  <StyledTouchableOpacity
                    key={cat}
                    className={cn(
                      'rounded-full px-4 border min-h-[44px] justify-center',
                      selectedCategory === cat
                        ? 'bg-primary border-primary'
                        : 'bg-surface-container-lowest border-outline-variant',
                    )}
                    onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${cat}`}
                    accessibilityState={{ selected: selectedCategory === cat }}
                  >
                    <StyledText
                      className={cn(
                        'text-label-bold font-semibold',
                        selectedCategory === cat ? 'text-on-primary' : 'text-on-surface-variant',
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

        {isLoading && products.length === 0 ? (
          <StyledScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonProductCard key={i} opacity={pulsingOpacity} />
            ))}
          </StyledScrollView>
        ) : filteredProducts.length === 0 ? (
          <StyledView className="flex-1 items-center justify-center px-6">
            <MagnifyingGlass size={48} color={colors.emptyStateIcon} />
            <StyledText className="text-body-lg text-on-surface-variant mt-4 text-center">
              {searchQuery
                ? 'No products match your search'
                : selectedCategory
                  ? `No products in "${selectedCategory}"`
                  : 'No products available'}
            </StyledText>
          </StyledView>
        ) : (
          <StyledScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: cartItemCount > 0 ? TAB_BAR_OFFSET + 80 : TAB_BAR_OFFSET + 20 }}
            contentInsetAdjustmentBehavior="never"
          >
            {filteredProducts.map(renderProductCard)}
          </StyledScrollView>
        )}

        {cartItemCount > 0 && (
          <StyledView
            className="absolute left-0 right-0 px-5 py-3 bg-surface/95 border-t border-outline-variant/20 shadow-lg z-10"
            style={{ bottom: TAB_BAR_OFFSET }}
          >
            <StyledView className="flex-row items-center justify-between">
              <StyledView className="flex-row items-center gap-3">
                <StyledView className="relative">
                  <ShoppingCart size={24} color={colors.primary} />
                  <StyledView className="absolute -top-1.5 -right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-primary items-center justify-center">
                    <StyledText className="text-label-sm font-bold text-on-primary">
                      {cartItemCount}
                    </StyledText>
                  </StyledView>
                </StyledView>
                <StyledView>
                  <StyledText className="text-body-sm text-on-surface-variant">
                    {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                  </StyledText>
                  <StyledText className="text-h3 font-bold text-primary">
                    {formatCurrency(subtotal)}
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledTouchableOpacity
                className="bg-primary rounded-button px-6 py-3.5 flex-row items-center gap-2 active:opacity-80"
                onPress={() => setCheckoutVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={`Review order, ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}, ${formatCurrency(subtotal)}`}
              >
                <StyledText className="text-body-sm font-bold text-on-primary">
                  Review
                </StyledText>
                <ArrowRight size={18} color="#FFFFFF" />
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        )}
      </StyledView>

      {renderCustomerSheet()}
      {renderCheckoutSheet()}

      {isSubmitting && (
        <StyledView className="absolute inset-0 bg-black/40 items-center justify-center z-[var(--z-modal)]">
          <StyledView className="bg-surface-container-lowest rounded-card p-8 items-center gap-3">
            <StyledView className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <StyledView className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
            </StyledView>
            <StyledText className="text-body-lg font-semibold text-on-surface">
              Recording sale...
            </StyledText>
          </StyledView>
        </StyledView>
      )}
    </Container>
  );
}