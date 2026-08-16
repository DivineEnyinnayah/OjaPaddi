import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  ArrowRight,
  Bank,
  CaretRight,
  CreditCard,
  DotsThree,
  MagnifyingGlass,
  Minus,
  Plus,
  ShoppingCart,
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

type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'other';
type PaymentStatus = 'paid' | 'partial' | 'unpaid';

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ComponentType<any>> = {
  cash: CreditCard,
  transfer: Bank,
  pos: CreditCard,
  other: DotsThree,
};

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'pos', label: 'POS' },
  { key: 'other', label: 'Other' },
];

const PAYMENT_STATUSES: { key: PaymentStatus; label: string; color: string }[] = [
  { key: 'paid', label: 'Paid', color: 'text-success' },
  { key: 'partial', label: 'Partial', color: 'text-accent' },
  { key: 'unpaid', label: 'Unpaid', color: 'text-error' },
];

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
      <StyledView className="flex-row items-center gap-3 bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/20">
        <StyledView className="w-14 h-14 rounded-xl bg-surface-container" />
        <StyledView className="flex-1 gap-2">
          <StyledView className="h-4 w-44 bg-surface-container rounded-md" />
          <StyledView className="h-3 w-24 bg-surface-container rounded-md" />
        </StyledView>
        <StyledView className="w-24 h-9 bg-surface-container rounded-lg" />
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

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
    return customers.filter((c) => c.name.toLowerCase().includes(query));
  }, [customers, customerSearch]);

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
      });
      setSelectedCustomer(customer);
      setShowAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setCustomerModalVisible(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add customer');
    }
  }, [newCustomerName, newCustomerPhone, createCustomer, setSelectedCustomer]);

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

    setIsSubmitting(true);
    try {
      const sale = await createSale({
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
        notes: notes || undefined,
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
            'flex-row items-center gap-3 bg-surface-container-lowest rounded-xl p-3 mb-2 border',
            isOutOfStock ? 'border-outline-variant/30 opacity-60' : 'border-outline-variant/20',
            cartQty > 0 && 'border-primary/30 bg-primary/5',
          )}
        >
          <StyledView className="w-14 h-14 rounded-xl bg-primary/10 items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <StyledImage source={{ uri: product.imageUrl }} className="w-full h-full" />
            ) : (
              <StyledText className="text-base font-bold text-primary">
                {getInitials(product.name)}
              </StyledText>
            )}
          </StyledView>

          <StyledView className="flex-1 gap-0.5">
            <StyledView className="flex-row items-center gap-2">
              <StyledText className="text-sm font-semibold text-on-surface flex-1" numberOfLines={1}>
                {product.name}
              </StyledText>
              {product.category && (
                <StyledView className="bg-surface-container rounded-full px-2 py-0.5">
                  <StyledText className="text-[10px] font-medium text-on-surface-variant">
                    {product.category}
                  </StyledText>
                </StyledView>
              )}
            </StyledView>
            <StyledText className="text-base font-bold text-primary">
              {formatCurrency(price)}
            </StyledText>
            {isLowStock && (
              <StyledText className="text-[11px] text-error font-medium">
                Only {product.quantity} left
              </StyledText>
            )}
            {isOutOfStock && (
              <StyledView className="bg-error/10 self-start rounded-full px-2 py-0.5">
                <StyledText className="text-[11px] text-error font-semibold">
                  Out of Stock
                </StyledText>
              </StyledView>
            )}
          </StyledView>

          {isOutOfStock ? (
            <StyledView className="w-24 h-9 bg-surface-container rounded-lg items-center justify-center">
              <StyledText className="text-xs text-on-surface-variant font-medium">
                Unavailable
              </StyledText>
            </StyledView>
          ) : cartQty > 0 ? (
            <StyledView className="flex-row items-center gap-1">
              <StyledTouchableOpacity
                className="w-8 h-8 rounded-full bg-primary items-center justify-center active:opacity-80"
                onPress={() => updateQuantity(product.id, cartQty - 1)}
              >
                <Minus size={16} color="#FFFFFF" />
              </StyledTouchableOpacity>
              <StyledView className="w-8 h-8 items-center justify-center">
                <StyledText className="text-sm font-bold text-on-surface">
                  {cartQty}
                </StyledText>
              </StyledView>
              <StyledTouchableOpacity
                className={cn(
                  'w-8 h-8 rounded-full items-center justify-center active:opacity-80',
                  atMaxStock ? 'bg-outline/30' : 'bg-primary/15',
                )}
                onPress={() => addToCart(product)}
                disabled={atMaxStock}
              >
                <Plus
                  size={16}
                  color={atMaxStock ? colors.outline : colors.primary}
                />
              </StyledTouchableOpacity>
            </StyledView>
          ) : (
            <StyledTouchableOpacity
              className="w-9 h-9 rounded-lg bg-primary items-center justify-center active:opacity-80"
              onPress={() => addToCart(product)}
            >
              <Plus size={20} color="#FFFFFF" />
            </StyledTouchableOpacity>
          )}
        </StyledView>
      );
    },
    [getCartQuantity, updateQuantity, addToCart, colors],
  );

  const renderCustomerModal = () => (
    <Modal
      visible={customerModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setCustomerModalVisible(false)}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={() => setCustomerModalVisible(false)}
      >
        <StyledView
          className="bg-background rounded-t-2xl max-h-[80%] min-h-[50%]"
          onStartShouldSetResponder={() => true}
        >
          <StyledView className="items-center pt-2 pb-1">
            <StyledView className="w-10 h-1 rounded-full bg-outline/40" />
          </StyledView>
          <StyledView className="px-6 pb-3 border-b border-outline-variant/20">
            <StyledView className="flex-row justify-between items-center mb-3">
              <StyledText className="text-lg font-bold text-on-surface">
                Select Customer
              </StyledText>
              <StyledTouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <X size={24} color={colors.onSurface} />
              </StyledTouchableOpacity>
            </StyledView>
            <StyledView className="flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-11">
              <MagnifyingGlass size={20} color={colors.outline} />
              <StyledTextInput
                className="flex-1 ml-2 text-body-md text-on-surface"
                placeholder="Search customers..."
                placeholderTextColor={colors.outline}
                value={customerSearch}
                onChangeText={setCustomerSearch}
              />
            </StyledView>
          </StyledView>

          <StyledScrollView className="flex-1 px-6 pt-2" contentInsetAdjustmentBehavior="never">
            {!showAddCustomer ? (
              <>
                <StyledTouchableOpacity
                  className="py-3.5 border-b border-outline-variant/10 flex-row items-center gap-3"
                  onPress={() => {
                    setSelectedCustomer(null);
                    setCustomerModalVisible(false);
                  }}
                >
                  <StyledView className="w-10 h-10 rounded-full bg-surface-container items-center justify-center">
                    <User size={20} color={colors.outline} />
                  </StyledView>
                  <StyledView>
                    <StyledText className="text-sm font-semibold text-on-surface">
                      Walk-in Customer
                    </StyledText>
                    <StyledText className="text-xs text-on-surface-variant">
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
                  >
                    <StyledView className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                      <StyledText className="text-sm font-bold text-primary">
                        {getInitials(customer.name)}
                      </StyledText>
                    </StyledView>
                    <StyledView>
                      <StyledText className="text-sm font-semibold text-on-surface">
                        {customer.name}
                      </StyledText>
                      {customer.phone && (
                        <StyledText className="text-xs text-on-surface-variant">
                          {customer.phone}
                        </StyledText>
                      )}
                    </StyledView>
                  </StyledTouchableOpacity>
                ))}

                <StyledTouchableOpacity
                  className="py-4 items-center"
                  onPress={() => setShowAddCustomer(true)}
                >
                  <StyledView className="flex-row items-center gap-2">
                    <UserPlus size={20} color={colors.primary} />
                    <StyledText className="text-sm font-semibold text-primary">
                      Add New Customer
                    </StyledText>
                  </StyledView>
                </StyledTouchableOpacity>
              </>
            ) : (
              <StyledView className="py-4 gap-4">
                <StyledView className="flex-row items-center justify-between">
                  <StyledText className="text-sm font-semibold text-on-surface">
                    New Customer
                  </StyledText>
                  <StyledTouchableOpacity
                    onPress={() => {
                      setShowAddCustomer(false);
                      setNewCustomerName('');
                      setNewCustomerPhone('');
                    }}
                  >
                    <StyledText className="text-sm text-on-surface-variant">Cancel</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
                <StyledTextInput
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-12 text-base text-on-surface"
                  placeholder="Customer name *"
                  placeholderTextColor={colors.outline}
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                />
                <StyledTextInput
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-12 text-base text-on-surface"
                  placeholder="Phone number (optional)"
                  placeholderTextColor={colors.outline}
                  keyboardType="phone-pad"
                  value={newCustomerPhone}
                  onChangeText={setNewCustomerPhone}
                />
                <Button
                  isDisabled={!newCustomerName.trim()}
                  onPress={handleAddCustomer}
                  size="md"
                >
                  Add Customer
                </Button>
              </StyledView>
            )}
            <StyledView className="h-6" />
          </StyledScrollView>
        </StyledView>
      </Pressable>
    </Modal>
  );

  const renderCheckoutSheet = () => (
    <Modal
      visible={checkoutVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setCheckoutVisible(false)}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={() => setCheckoutVisible(false)}
      >
        <StyledView
          className="bg-background rounded-t-3xl max-h-[90%] w-full"
          onStartShouldSetResponder={() => true}
        >
          <StyledView className="items-center pt-3 pb-1">
            <StyledView className="w-12 h-1.5 rounded-full bg-outline/40" />
          </StyledView>

          <StyledScrollView
            className="px-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="never"
          >
            <StyledText className="text-xl font-bold text-on-surface mb-4">
              Checkout
            </StyledText>

            <Surface variant="primary" className="mb-4">
              <StyledText className="text-sm font-semibold text-on-surface mb-3">
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
                      <StyledText className="text-sm font-medium text-on-surface" numberOfLines={1}>
                        {item.product.name}
                      </StyledText>
                      <StyledText className="text-xs text-on-surface-variant mt-0.5">
                        {formatCurrency(parseFloat(item.product.price))} × {item.quantity}
                      </StyledText>
                    </StyledView>
                    <StyledView className="flex-row items-center gap-2">
                      <StyledText className="text-sm font-bold text-on-surface">
                        {formatCurrency(lineTotal)}
                      </StyledText>
                      <StyledTouchableOpacity
                        onPress={() => updateQuantity(item.product.id, 0)}
                        className="w-7 h-7 rounded-full bg-error/10 items-center justify-center active:opacity-70"
                      >
                        <X size={14} color={colors.error} />
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
            >
              <Surface variant="primary" className="flex-row items-center justify-between">
                <StyledView className="flex-row items-center gap-3">
                  <StyledView className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <User size={20} color={colors.primary} />
                  </StyledView>
                  <StyledView>
                    <StyledText className="text-sm font-semibold text-on-surface">
                      {selectedCustomer?.name || 'Walk-in Customer'}
                    </StyledText>
                    <StyledText className="text-xs text-on-surface-variant">
                      {selectedCustomer?.phone || 'Tap to select customer'}
                    </StyledText>
                  </StyledView>
                </StyledView>
                <CaretRight size={20} color={colors.outline} />
              </Surface>
            </StyledTouchableOpacity>

            <StyledText className="text-sm font-semibold text-on-surface mb-2">
              Payment Method
            </StyledText>
            <StyledView className="flex-row gap-2 mb-4">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedPayment === method.key;
                const IconComponent = PAYMENT_METHOD_ICONS[method.key];
                return (
                  <StyledTouchableOpacity
                    key={method.key}
                    className={cn(
                      'flex-1 items-center py-3 rounded-xl border',
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-surface-container-lowest border-outline-variant',
                    )}
                    onPress={() => setSelectedPayment(method.key)}
                  >
                    <IconComponent
                      size={20}
                      color={isSelected ? '#FFFFFF' : colors.onSurfaceVariant}
                    />
                    <StyledText
                      className={cn(
                        'text-xs font-semibold mt-1',
                        isSelected ? 'text-on-primary' : 'text-on-surface-variant',
                      )}
                    >
                      {method.label}
                    </StyledText>
                  </StyledTouchableOpacity>
                );
              })}
            </StyledView>

            <StyledText className="text-sm font-semibold text-on-surface mb-2">
              Payment Status
            </StyledText>
            <StyledView className="flex-row gap-2 mb-4">
              {PAYMENT_STATUSES.map((status) => {
                const isSelected = paymentStatus === status.key;
                return (
                  <StyledTouchableOpacity
                    key={status.key}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl border items-center',
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-surface-container-lowest border-outline-variant',
                    )}
                    onPress={() => setPaymentStatus(status.key)}
                  >
                    <StyledText
                      className={cn(
                        'text-sm font-semibold',
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
                <StyledText className="text-sm font-semibold text-on-surface mb-2">
                  Amount Paid
                </StyledText>
                <StyledView className="flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-12">
                  <StyledText className="text-base font-semibold text-on-surface-variant mr-1">
                    ₦
                  </StyledText>
                  <StyledTextInput
                    className="flex-1 text-base text-on-surface"
                    placeholder="0"
                    placeholderTextColor={colors.outline}
                    keyboardType="numeric"
                    value={amountPaid}
                    onChangeText={setAmountPaid}
                  />
                </StyledView>
              </StyledView>
            )}

            <StyledView className="mb-4">
              <StyledText className="text-sm font-semibold text-on-surface mb-2">
                Discount (optional)
              </StyledText>
              <StyledView className="flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-12">
                <StyledText className="text-base font-semibold text-on-surface-variant mr-1">
                  ₦
                </StyledText>
                <StyledTextInput
                  className="flex-1 text-base text-on-surface"
                  placeholder="0"
                  placeholderTextColor={colors.outline}
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
              </StyledView>
            </StyledView>

            <StyledView className="mb-4">
              <StyledText className="text-sm font-semibold text-on-surface mb-2">
                Notes (optional)
              </StyledText>
              <StyledTextInput
                className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface min-h-[80px]"
                placeholder="Add any notes..."
                placeholderTextColor={colors.outline}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </StyledView>

            <Surface variant="primary" className="mb-6">
              <StyledView className="flex-row justify-between items-center py-1">
                <StyledText className="text-sm text-on-surface-variant">Subtotal</StyledText>
                <StyledText className="text-sm font-semibold text-on-surface">
                  {formatCurrency(subtotal)}
                </StyledText>
              </StyledView>
              {(parseFloat(discount) || 0) > 0 && (
                <StyledView className="flex-row justify-between items-center py-1">
                  <StyledText className="text-sm text-on-surface-variant">Discount</StyledText>
                  <StyledText className="text-sm font-semibold text-error">
                    -{formatCurrency(parseFloat(discount) || 0)}
                  </StyledText>
                </StyledView>
              )}
              <StyledView className="flex-row justify-between items-center pt-3 mt-2 border-t border-outline-variant/30">
                <StyledText className="text-base font-bold text-on-surface">Total</StyledText>
                <StyledText className="text-xl font-bold text-primary">
                  {formatCurrency(total)}
                </StyledText>
              </StyledView>
            </Surface>

            <StyledView className="pb-6">
              <Button
                size="lg"
                isDisabled={isSubmitting || total <= 0}
                onPress={handleCompleteSale}
                className="w-full"
              >
                {isSubmitting ? 'Recording...' : 'Complete Sale'}
              </Button>
            </StyledView>
          </StyledScrollView>
        </StyledView>
      </Pressable>
    </Modal>
  );

  return (
    <Container isScrollable={false} withTabBar>
      <StyledView className="flex-1">
        <StyledView className="px-5 pt-14 pb-2">
          <StyledView className="flex-row items-center gap-3 mb-4">
            <StyledTouchableOpacity
              className="w-10 h-10 rounded-full bg-surface-container items-center justify-center active:opacity-70"
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color={colors.onSurface} />
            </StyledTouchableOpacity>
            <StyledText className="text-h2 font-black text-on-surface text-balance">
              Record Sale
            </StyledText>
          </StyledView>

          <StyledView className="flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-xl px-4 h-11">
            <MagnifyingGlass size={20} color={colors.outline} />
            <StyledTextInput
              className="flex-1 ml-2 text-body-md text-on-surface"
              placeholder="Search products..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <StyledTouchableOpacity onPress={() => setSearchQuery('')}>
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
                    'rounded-full px-4 py-2 border',
                    !selectedCategory
                      ? 'bg-primary border-primary'
                      : 'bg-surface-container-lowest border-outline-variant',
                  )}
                  onPress={() => setSelectedCategory(null)}
                >
                  <StyledText
                    className={cn(
                      'text-xs font-semibold',
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
                      'rounded-full px-4 py-2 border',
                      selectedCategory === cat
                        ? 'bg-primary border-primary'
                        : 'bg-surface-container-lowest border-outline-variant',
                    )}
                    onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    <StyledText
                      className={cn(
                        'text-xs font-semibold',
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
            <StyledText className="text-base text-on-surface-variant mt-4 text-center">
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
                  <StyledView className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary items-center justify-center">
                    <StyledText className="text-[10px] font-bold text-on-primary">
                      {cartItemCount}
                    </StyledText>
                  </StyledView>
                </StyledView>
                <StyledView>
                  <StyledText className="text-sm text-on-surface-variant">
                    {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                  </StyledText>
                  <StyledText className="text-lg font-bold text-primary">
                    {formatCurrency(subtotal)}
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledTouchableOpacity
                className="bg-primary rounded-xl px-6 py-3.5 flex-row items-center gap-2 active:opacity-80"
                onPress={() => setCheckoutVisible(true)}
              >
                <StyledText className="text-sm font-bold text-on-primary">
                  Review
                </StyledText>
                <ArrowRight size={18} color="#FFFFFF" />
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        )}
      </StyledView>

      {renderCustomerModal()}
      {renderCheckoutSheet()}

      {isSubmitting && (
        <StyledView className="absolute inset-0 bg-black/40 items-center justify-center z-[var(--z-modal)]">
          <StyledView className="bg-surface-container-lowest rounded-2xl p-8 items-center gap-3">
            <StyledView className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <StyledView className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
            </StyledView>
            <StyledText className="text-base font-semibold text-on-surface">
              Recording sale...
            </StyledText>
          </StyledView>
        </StyledView>
      )}
    </Container>
  );
}
