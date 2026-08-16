import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  MagnifyingGlass,
  Receipt,
  Trash,
  PencilSimple,
  TrendDown,
  Clock,
  CheckCircle,
  Repeat,
  Bell,
  WarningCircle,
} from 'phosphor-react-native';
import { withUniwind } from 'uniwind';
import { useExpenses, type Expense } from '../hooks/useExpenses';
import { useAnalytics } from '../hooks/useAnalytics';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);
const StyledScrollView = withUniwind(ScrollView);

const CATEGORIES = [
  'All',
  'Utilities',
  'Transport',
  'Staff',
  'Rent',
  'Marketing',
  'Repairs',
  'Supplies',
  'Miscellaneous',
];

const PERIODS = [
  { label: 'All Time', key: 'all' },
  { label: 'Today', key: 'today' },
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
];

const RECURRING_FREQUENCIES: Array<'weekly' | 'monthly' | 'yearly'> = ['weekly', 'monthly', 'yearly'];

export default function ExpensesScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const toast = useToast();
  const { expenses, isLoading, fetchExpenses, createExpense, updateExpense, deleteExpense } =
    useExpenses();
  const { summary, fetchSummary } = useAnalytics();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Utilities');
  const [isRecurringInput, setIsRecurringInput] = useState(false);
  const [frequencyInput, setFrequencyInput] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dueDateInput, setDueDateInput] = useState('');
  const [isPaidInput, setIsPaidInput] = useState(true);
  const [reminderDaysInput, setReminderDaysInput] = useState('3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(() => {
    fetchExpenses();
    fetchSummary();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Upcoming Payment Reminders Check (Expenses due soon or unpaid)
  const dueSoonExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      if (e.isPaid) return false;
      if (!e.dueDate) return false;
      const due = new Date(e.dueDate);
      const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 3600 * 24);
      const reminderDays = e.reminderDaysBefore ?? 3;
      return daysUntilDue <= reminderDays;
    });
  }, [expenses]);

  // Calculations & Filters
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    const now = new Date();
    if (selectedPeriod === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      result = result.filter((e) => e.incurredAt.startsWith(todayStr));
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      result = result.filter((e) => new Date(e.incurredAt) >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      result = result.filter((e) => new Date(e.incurredAt) >= monthAgo);
    }

    if (selectedCategory !== 'All') {
      result = result.filter(
        (e) => e.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [expenses, selectedPeriod, selectedCategory, searchQuery]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
  }, [filteredExpenses]);

  const netProfit = summary?.netProfit ?? 0;
  const totalRevenue = summary?.totalRevenue ?? 0;

  const openCreateModal = () => {
    setEditingExpense(null);
    setAmountInput('');
    setDescriptionInput('');
    setCategoryInput('Utilities');
    setIsRecurringInput(false);
    setFrequencyInput('monthly');
    setDueDateInput('');
    setIsPaidInput(true);
    setReminderDaysInput('3');
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setAmountInput(expense.amount);
    setDescriptionInput(expense.description);
    setCategoryInput(expense.category || 'Utilities');
    setIsRecurringInput(!!expense.isRecurring);
    setFrequencyInput(expense.recurringFrequency || 'monthly');
    setDueDateInput(expense.dueDate ? expense.dueDate.split('T')[0] : '');
    setIsPaidInput(expense.isPaid ?? true);
    setReminderDaysInput(String(expense.reminderDaysBefore ?? 3));
    setIsModalOpen(true);
  };

  const handleSaveExpense = async () => {
    const numAmount = parseFloat(amountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid expense amount.', 'Invalid Amount');
      return;
    }
    if (!descriptionInput.trim()) {
      toast.error('Please provide an expense description.', 'Description Required');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedDueDate = dueDateInput.trim()
        ? new Date(dueDateInput.trim()).toISOString()
        : isRecurringInput
        ? new Date(Date.now() + 7 * 86400000).toISOString()
        : undefined;

      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          amount: String(numAmount),
          description: descriptionInput.trim(),
          category: categoryInput,
          isRecurring: isRecurringInput,
          recurringFrequency: isRecurringInput ? frequencyInput : undefined,
          dueDate: parsedDueDate,
          isPaid: isPaidInput,
          reminderDaysBefore: parseInt(reminderDaysInput) || 3,
        });
        toast.success('Expense updated successfully.', 'Updated');
      } else {
        await createExpense({
          amount: numAmount,
          description: descriptionInput.trim(),
          category: categoryInput,
          isRecurring: isRecurringInput,
          recurringFrequency: isRecurringInput ? frequencyInput : undefined,
          dueDate: parsedDueDate,
          isPaid: isPaidInput,
          reminderDaysBefore: parseInt(reminderDaysInput) || 3,
          incurredAt: new Date().toISOString(),
        });
        toast.success('Expense recorded successfully.', 'Recorded');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePaid = async (expense: Expense) => {
    try {
      await updateExpense(expense.id, { isPaid: !expense.isPaid });
      toast.success(
        expense.isPaid ? 'Expense marked as unpaid/due.' : 'Expense marked as Paid!',
        'Status Updated'
      );
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };

  const confirmDeleteExpense = (id: string) => {
    toast.confirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to remove this expense record?',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteExpense(id);
          toast.success('Expense record deleted.', 'Deleted');
          loadData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
        }
      },
    });
  };

  const getDueStatusText = (dueDateStr?: string | null) => {
    if (!dueDateStr) return null;
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, isUrgent: true };
    if (diffDays === 0) return { text: 'Due Today', isUrgent: true };
    if (diffDays === 1) return { text: 'Due Tomorrow', isUrgent: true };
    return { text: `Due in ${diffDays} days`, isUrgent: diffDays <= 3 };
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Container isScrollable={false} withTabBar={false} className="bg-background flex-1">
      {/* Header */}
      <StyledView className="bg-surface border-b border-outline-variant/30 h-14 px-margin flex-row justify-between items-center z-10">
        <StyledView className="flex-row items-center gap-3">
          <StyledTouchableOpacity
            onPress={() => router.back()}
            className="size-10 rounded-full bg-surface-container justify-center items-center active:scale-95"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.onSurface} />
          </StyledTouchableOpacity>
          <StyledText className="text-h2 font-bold text-on-surface">Expenses</StyledText>
        </StyledView>
        <StyledTouchableOpacity
          onPress={openCreateModal}
          className="flex-row items-center gap-1.5 bg-primary px-3.5 py-2 rounded-full active:scale-95"
        >
          <Plus size={18} color={colors.onPrimary} />
          <StyledText className="text-sm font-bold text-onPrimary">Add Expense</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <StyledScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[colors.primary]} />
        }
      >
        {/* Payment Reminders Alert Banner if expenses are due soon */}
        {dueSoonExpenses.length > 0 && (
          <StyledView className="px-5 pt-3">
            <Surface variant="primary" className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 gap-2">
              <StyledView className="flex-row items-center gap-2">
                <Bell size={20} color="#D97706" weight="fill" />
                <StyledText className="text-sm font-bold text-amber-700 dark:text-amber-400 flex-1">
                  {dueSoonExpenses.length} Payment Reminder{dueSoonExpenses.length > 1 ? 's' : ''} Due Soon!
                </StyledText>
              </StyledView>
              {dueSoonExpenses.map((exp) => {
                const dueStatus = getDueStatusText(exp.dueDate);
                return (
                  <StyledView
                    key={exp.id}
                    className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-amber-500/20 mt-1"
                  >
                    <StyledView className="flex-1 mr-2">
                      <StyledText className="text-xs font-bold text-on-surface">
                        {exp.description} ({formatCurrency(parseFloat(exp.amount))})
                      </StyledText>
                      <StyledText className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        {dueStatus?.text}
                      </StyledText>
                    </StyledView>
                    <StyledTouchableOpacity
                      onPress={() => handleTogglePaid(exp)}
                      className="bg-primary px-3 py-1.5 rounded-lg"
                    >
                      <StyledText className="text-xs font-bold text-onPrimary">Mark Paid</StyledText>
                    </StyledTouchableOpacity>
                  </StyledView>
                );
              })}
            </Surface>
          </StyledView>
        )}

        {/* Financial Summary & Profit Deduction Calculation Cards */}
        <StyledView className="px-5 pt-4 pb-2 gap-3">
          <Surface variant="primary" className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/40">
            <StyledView className="flex-row justify-between items-start mb-2">
              <StyledView className="flex-row items-center gap-2">
                <StyledView className="size-10 rounded-xl bg-error/15 items-center justify-center">
                  <TrendDown size={22} color={colors.error} />
                </StyledView>
                <StyledView>
                  <StyledText className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Total Expenses
                  </StyledText>
                  <StyledText className="text-2xl font-extrabold text-error tabular-nums mt-0.5">
                    -{formatCurrency(totalExpenseAmount)}
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledView className="bg-surface-container px-2.5 py-1 rounded-md">
                <StyledText className="text-xs font-bold text-on-surface-variant">
                  {filteredExpenses.length} record{filteredExpenses.length !== 1 ? 's' : ''}
                </StyledText>
              </StyledView>
            </StyledView>

            {/* Financial Calculation Breakdown */}
            <StyledView className="mt-3 pt-3 border-t border-outline-variant/30 flex-row justify-between items-center">
              <StyledView className="flex-1">
                <StyledText className="text-[11px] font-medium text-on-surface-variant">Gross Revenue</StyledText>
                <StyledText className="text-sm font-bold text-primary tabular-nums">
                  {formatCurrency(totalRevenue)}
                </StyledText>
              </StyledView>
              <StyledView className="w-px h-8 bg-outline-variant/40 mx-3" />
              <StyledView className="flex-1">
                <StyledText className="text-[11px] font-medium text-on-surface-variant">Net Profit (after Expenses)</StyledText>
                <StyledText className="text-sm font-bold text-secondary tabular-nums">
                  {formatCurrency(netProfit)}
                </StyledText>
              </StyledView>
            </StyledView>
          </Surface>

          {/* Time Period Filter */}
          <StyledView className="flex-row gap-2 mt-1">
            {PERIODS.map((period) => {
              const isActive = selectedPeriod === period.key;
              return (
                <StyledTouchableOpacity
                  key={period.key}
                  onPress={() => setSelectedPeriod(period.key)}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    isActive
                      ? 'bg-primary'
                      : 'bg-surface-container-low border border-outline-variant/40'
                  }`}
                >
                  <StyledText
                    className={`text-xs font-bold ${
                      isActive ? 'text-onPrimary' : 'text-on-surface-variant'
                    }`}
                  >
                    {period.label}
                  </StyledText>
                </StyledTouchableOpacity>
              );
            })}
          </StyledView>

          {/* Search Bar */}
          <StyledView className="flex-row items-center bg-surface-container-low rounded-xl border border-outline-variant px-4 h-11 mt-1">
            <MagnifyingGlass size={18} color={colors.outline} />
            <StyledTextInput
              className="flex-1 text-sm text-on-surface ml-2"
              placeholder="Search expenses by description..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </StyledView>

          {/* Category Filter Pills */}
          <StyledScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            <StyledView className="flex-row gap-2 pr-4">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <StyledTouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full border ${
                      isActive
                        ? 'bg-primary border-primary'
                        : 'bg-surface-container border-outline-variant/40'
                    }`}
                  >
                    <StyledText
                      className={`text-xs font-semibold ${
                        isActive ? 'text-onPrimary' : 'text-on-surface-variant'
                      }`}
                    >
                      {cat}
                    </StyledText>
                  </StyledTouchableOpacity>
                );
              })}
            </StyledView>
          </StyledScrollView>
        </StyledView>

        {/* Expenses List */}
        <StyledView className="px-5 pt-2">
          {isLoading && expenses.length === 0 ? (
            <StyledView className="gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Surface key={i} variant="outline" className="p-4 rounded-xl">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Surface>
              ))}
            </StyledView>
          ) : filteredExpenses.length === 0 ? (
            <StyledView className="py-12 items-center justify-center text-center">
              <StyledView className="size-16 rounded-full bg-surface-container-high items-center justify-center mb-3">
                <Receipt size={32} color={colors.outline} />
              </StyledView>
              <StyledText className="text-base font-bold text-on-surface mb-1">
                No Expenses Recorded
              </StyledText>
              <StyledText className="text-xs text-on-surface-variant text-center px-8 mb-4">
                Record services, wages, fuel, supplies, or shop bills to keep track of profit deductions.
              </StyledText>
              <Button size="md" onPress={openCreateModal}>
                Record Expense
              </Button>
            </StyledView>
          ) : (
            <StyledView className="gap-3">
              {filteredExpenses.map((expense) => {
                const amt = parseFloat(expense.amount || '0');
                const dueStatus = getDueStatusText(expense.dueDate);
                return (
                  <Surface
                    key={expense.id}
                    variant="outline"
                    className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest"
                  >
                    <StyledView className="flex-row justify-between items-start mb-2">
                      <StyledView className="flex-1 mr-3">
                        <StyledView className="flex-row flex-wrap items-center gap-1.5 mb-1">
                          <StyledView className="bg-error/10 px-2 py-0.5 rounded-md">
                            <StyledText className="text-[11px] font-bold text-error">
                              {expense.category || 'General'}
                            </StyledText>
                          </StyledView>
                          {expense.isRecurring && (
                            <StyledView className="bg-primary/10 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                              <Repeat size={12} color={colors.primary} />
                              <StyledText className="text-[11px] font-bold text-primary capitalize">
                                {expense.recurringFrequency || 'Recurring'}
                              </StyledText>
                            </StyledView>
                          )}
                          <StyledText className="text-xs text-on-surface-variant font-medium">
                            {formatDate(expense.incurredAt)}
                          </StyledText>
                        </StyledView>
                        <StyledText className="text-base font-bold text-on-surface leading-snug">
                          {expense.description}
                        </StyledText>

                        {/* Payment Due Reminder Badge */}
                        {dueStatus && !expense.isPaid && (
                          <StyledView className="flex-row items-center gap-1 mt-1 bg-amber-500/10 px-2 py-0.5 rounded-md self-start">
                            <Clock size={12} color="#D97706" />
                            <StyledText className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              {dueStatus.text}
                            </StyledText>
                          </StyledView>
                        )}
                      </StyledView>
                      <StyledView className="items-end">
                        <StyledText className="text-base font-extrabold text-error tabular-nums">
                          -{formatCurrency(amt)}
                        </StyledText>
                        <StyledTouchableOpacity
                          onPress={() => handleTogglePaid(expense)}
                          className={`flex-row items-center gap-1 px-2 py-0.5 rounded-md mt-1 ${
                            expense.isPaid ? 'bg-secondary/15' : 'bg-amber-500/15'
                          }`}
                        >
                          <CheckCircle
                            size={12}
                            color={expense.isPaid ? colors.secondary : '#D97706'}
                            weight={expense.isPaid ? 'fill' : 'regular'}
                          />
                          <StyledText
                            className={`text-[11px] font-bold ${
                              expense.isPaid ? 'text-secondary' : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {expense.isPaid ? 'Paid' : 'Pending'}
                          </StyledText>
                        </StyledTouchableOpacity>
                      </StyledView>
                    </StyledView>

                    {/* Action buttons */}
                    <StyledView className="flex-row justify-end items-center gap-2 mt-3 pt-2 border-t border-outline-variant/20">
                      <StyledTouchableOpacity
                        onPress={() => openEditModal(expense)}
                        className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container active:opacity-80"
                      >
                        <PencilSimple size={15} color={colors.onSurface} />
                        <StyledText className="text-xs font-semibold text-on-surface">Edit</StyledText>
                      </StyledTouchableOpacity>
                      <StyledTouchableOpacity
                        onPress={() => confirmDeleteExpense(expense.id)}
                        className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-error/10 active:opacity-80"
                      >
                        <Trash size={15} color={colors.error} />
                        <StyledText className="text-xs font-semibold text-error">Delete</StyledText>
                      </StyledTouchableOpacity>
                    </StyledView>
                  </Surface>
                );
              })}
            </StyledView>
          )}
        </StyledView>
      </StyledScrollView>

      {/* Modal for Record / Edit Expense */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <StyledView className="flex-1 bg-black/60 justify-end">
          <StyledView className="bg-surface rounded-t-3xl p-6 border-t border-outline-variant/30 max-h-[90%]">
            <StyledView className="flex-row justify-between items-center mb-5">
              <StyledText className="text-xl font-bold text-on-surface">
                {editingExpense ? 'Edit Expense' : 'Record Expense'}
              </StyledText>
              <StyledTouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="size-8 rounded-full bg-surface-container justify-center items-center"
              >
                <StyledText className="text-base font-bold text-on-surface-variant">✕</StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            <ScrollView showsVerticalScrollIndicator={false}>
              <StyledView className="gap-4 mb-6">
                {/* Amount */}
                <StyledView>
                  <StyledText className="text-xs font-semibold text-on-surface-variant mb-1.5">
                    Amount (₦) *
                  </StyledText>
                  <StyledView className="flex-row items-center bg-surface-container-low border border-outline-variant rounded-xl px-4 h-12">
                    <StyledText className="text-lg font-bold text-primary mr-2">₦</StyledText>
                    <StyledTextInput
                      className="flex-1 text-base font-bold text-on-surface"
                      placeholder="0.00"
                      placeholderTextColor={colors.outline}
                      keyboardType="decimal-pad"
                      value={amountInput}
                      onChangeText={setAmountInput}
                    />
                  </StyledView>
                </StyledView>

                {/* Description */}
                <StyledView>
                  <StyledText className="text-xs font-semibold text-on-surface-variant mb-1.5">
                    Description *
                  </StyledText>
                  <StyledTextInput
                    className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface"
                    placeholder="e.g. NEPA light bill, Transport to market, Staff wages"
                    placeholderTextColor={colors.outline}
                    value={descriptionInput}
                    onChangeText={setDescriptionInput}
                  />
                </StyledView>

                {/* Category Selection */}
                <StyledView>
                  <StyledText className="text-xs font-semibold text-on-surface-variant mb-1.5">
                    Expense Category
                  </StyledText>
                  <StyledView className="flex-row flex-wrap gap-2">
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => {
                      const isSelected = categoryInput === cat;
                      return (
                        <StyledTouchableOpacity
                          key={cat}
                          onPress={() => setCategoryInput(cat)}
                          className={`px-3 py-2 rounded-xl border ${
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'bg-surface-container-low border-outline-variant/40'
                          }`}
                        >
                          <StyledText
                            className={`text-xs font-bold ${
                              isSelected ? 'text-onPrimary' : 'text-on-surface-variant'
                            }`}
                          >
                            {cat}
                          </StyledText>
                        </StyledTouchableOpacity>
                      );
                    })}
                  </StyledView>
                </StyledView>

                {/* Recurring Expense Checkbox */}
                <StyledView className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 gap-3">
                  <StyledView className="flex-row justify-between items-center">
                    <StyledView className="flex-row items-center gap-2.5 flex-1 pr-2">
                      <Repeat size={20} color={colors.primary} />
                      <StyledView className="flex-1">
                        <StyledText className="text-sm font-bold text-on-surface">
                          Recurring Expense
                        </StyledText>
                      </StyledView>
                    </StyledView>
                    <Switch
                      value={isRecurringInput}
                      onValueChange={setIsRecurringInput}
                      trackColor={{ false: colors.surfaceContainer, true: colors.primary }}
                    />
                  </StyledView>

                  {isRecurringInput && (
                    <StyledView className="pt-2 border-t border-outline-variant/30 gap-3">
                      <StyledText className="text-xs font-semibold text-on-surface-variant">
                        Recurring Frequency
                      </StyledText>
                      <StyledView className="flex-row gap-2">
                        {RECURRING_FREQUENCIES.map((freq) => {
                          const isSelected = frequencyInput === freq;
                          return (
                            <StyledTouchableOpacity
                              key={freq}
                              onPress={() => setFrequencyInput(freq)}
                              className={`flex-1 py-2 rounded-xl border items-center ${
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'bg-surface-container border-outline-variant/40'
                              }`}
                            >
                              <StyledText
                                className={`text-xs font-bold capitalize ${
                                  isSelected ? 'text-onPrimary' : 'text-on-surface-variant'
                                }`}
                              >
                                {freq}
                              </StyledText>
                            </StyledTouchableOpacity>
                          );
                        })}
                      </StyledView>
                    </StyledView>
                  )}
                </StyledView>

                {/* Payment Status & Reminder Lead Time */}
                <StyledView className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 gap-3">
                  <StyledView className="flex-row justify-between items-center">
                    <StyledView className="flex-row items-center gap-2">
                      <CheckCircle size={20} color={isPaidInput ? colors.secondary : '#D97706'} />
                      <StyledText className="text-sm font-bold text-on-surface">
                        Payment Status
                      </StyledText>
                    </StyledView>
                    <StyledTouchableOpacity
                      onPress={() => setIsPaidInput(!isPaidInput)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        isPaidInput
                          ? 'bg-secondary/15 border-secondary'
                          : 'bg-amber-500/15 border-amber-500'
                      }`}
                    >
                      <StyledText
                        className={`text-xs font-bold ${
                          isPaidInput ? 'text-secondary' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isPaidInput ? 'Paid' : 'Pending / Due'}
                      </StyledText>
                    </StyledTouchableOpacity>
                  </StyledView>

                  {!isPaidInput && (
                    <StyledView className="pt-2 border-t border-outline-variant/30 gap-2">
                      <StyledText className="text-xs font-semibold text-on-surface-variant">
                        Reminder Lead Time
                      </StyledText>
                      <StyledView className="flex-row gap-2">
                        {['1', '3', '7'].map((days) => {
                          const isSelected = reminderDaysInput === days;
                          return (
                            <StyledTouchableOpacity
                              key={days}
                              onPress={() => setReminderDaysInput(days)}
                              className={`flex-1 py-1.5 rounded-lg border items-center ${
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'bg-surface-container border-outline-variant/40'
                              }`}
                            >
                              <StyledText
                                className={`text-xs font-bold ${
                                  isSelected ? 'text-onPrimary' : 'text-on-surface-variant'
                                }`}
                              >
                                {days} Days Before
                              </StyledText>
                            </StyledTouchableOpacity>
                          );
                        })}
                      </StyledView>
                    </StyledView>
                  )}
                </StyledView>
              </StyledView>

              <Button
                size="lg"
                onPress={handleSaveExpense}
                isDisabled={isSubmitting}
                className="mb-4"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingExpense
                  ? 'Update Expense'
                  : 'Save Expense Record'}
              </Button>
            </ScrollView>
          </StyledView>
        </StyledView>
      </Modal>
    </Container>
  );
}
