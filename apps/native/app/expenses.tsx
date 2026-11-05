import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { BottomSheet } from '@/components/ui/bottom-sheet';
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
      <StyledView className="bg-card border-b border-border/30 h-14 px-margin flex-row justify-between items-center z-10">
        <StyledView className="flex-row items-center gap-3">
          <StyledTouchableOpacity
            onPress={() => router.back()}
            className="size-10 rounded-full bg-card justify-center items-center active:scale-95"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.ink} />
          </StyledTouchableOpacity>
          <StyledText className="text-h2 font-bold text-ink">Expenses</StyledText>
        </StyledView>
        <StyledTouchableOpacity
          onPress={openCreateModal}
          className="flex-row items-center gap-1.5 bg-brand px-3.5 py-2 rounded-full active:scale-95"
        >
          <Plus size={18} color={colors.card} />
          <StyledText className="text-body-sm font-bold text-card">Add Expense</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <StyledScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[colors.brand]} />
        }
      >
        {/* Payment Reminders Alert Banner if expenses are due soon */}
        {dueSoonExpenses.length > 0 && (
          <StyledView className="px-5 pt-3">
            <Surface variant="primary" className="p-4 rounded-2xl bg-accent-soft border border-accent/30 gap-2">
              <StyledView className="flex-row items-center gap-2">
                <Bell size={20} color={colors.accent} weight="fill" />
                <StyledText className="text-body-sm font-bold text-accent flex-1">
                  {dueSoonExpenses.length} Payment Reminder{dueSoonExpenses.length > 1 ? 's' : ''} Due Soon!
                </StyledText>
              </StyledView>
              {dueSoonExpenses.map((exp) => {
                const dueStatus = getDueStatusText(exp.dueDate);
                return (
                  <StyledView
                    key={exp.id}
                    className="flex-row justify-between items-center bg-card p-3 rounded-xl border border-accent/20 mt-1"
                  >
                    <StyledView className="flex-1 mr-2">
                      <StyledText className="text-label-bold font-bold text-ink">
                        {exp.description} ({formatCurrency(parseFloat(exp.amount))})
                      </StyledText>
                      <StyledText className="text-label-bold font-semibold text-accent">
                        {dueStatus?.text}
                      </StyledText>
                    </StyledView>
                    <StyledTouchableOpacity
                      onPress={() => handleTogglePaid(exp)}
                      className="bg-brand px-3 py-1.5 rounded-lg"
                    >
                      <StyledText className="text-label-bold font-bold text-card">Mark Paid</StyledText>
                    </StyledTouchableOpacity>
                  </StyledView>
                );
              })}
            </Surface>
          </StyledView>
        )}

        {/* Financial Summary & Profit Deduction Calculation Cards */}
        <StyledView className="px-5 pt-4 pb-2 gap-3">
          <Surface variant="primary" className="p-5 rounded-2xl bg-card border border-border/40">
            <StyledView className="flex-row justify-between items-start mb-2">
              <StyledView className="flex-row items-center gap-2">
                <StyledView className="size-10 rounded-xl bg-danger/15 items-center justify-center">
                  <TrendDown size={22} color={colors.danger} />
                </StyledView>
                <StyledView>
                  <StyledText className="text-label-bold font-semibold text-muted uppercase tracking-wider">
                    Total Expenses
                  </StyledText>
                  <StyledText className="text-2xl font-extrabold text-danger tabular-nums mt-0.5">
                    -{formatCurrency(totalExpenseAmount)}
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledView className="bg-card px-2.5 py-1 rounded-md">
                <StyledText className="text-label-bold font-bold text-muted">
                  {filteredExpenses.length} record{filteredExpenses.length !== 1 ? 's' : ''}
                </StyledText>
              </StyledView>
            </StyledView>

            {/* Financial Calculation Breakdown */}
            <StyledView className="mt-3 pt-3 border-t border-border/30 flex-row justify-between items-center">
              <StyledView className="flex-1">
                <StyledText className="text-label-bold font-medium text-muted">Gross Revenue</StyledText>
                <StyledText className="text-body-sm font-bold text-brand tabular-nums">
                  {formatCurrency(totalRevenue)}
                </StyledText>
              </StyledView>
              <StyledView className="w-px h-8 bg-border/40 mx-3" />
              <StyledView className="flex-1">
                <StyledText className="text-label-bold font-medium text-muted">Net Profit (after Expenses)</StyledText>
                <StyledText className="text-body-sm font-bold text-accent tabular-nums">
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
                      ? 'bg-brand'
                      : 'bg-card border border-border/40'
                  }`}
                >
                  <StyledText
                    className={`text-label-bold font-bold ${
                      isActive ? 'text-card' : 'text-muted'
                    }`}
                  >
                    {period.label}
                  </StyledText>
                </StyledTouchableOpacity>
              );
            })}
          </StyledView>

          {/* Search Bar */}
          <StyledView className="flex-row items-center bg-card rounded-xl border border-border px-4 h-11 mt-1">
            <MagnifyingGlass size={18} color={colors.muted} />
            <StyledTextInput
              className="flex-1 text-body-sm text-ink ml-2"
              placeholder="Search expenses by description..."
              placeholderTextColor={colors.muted}
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
                        ? 'bg-brand border-brand'
                        : 'bg-card border-border/40'
                    }`}
                  >
                    <StyledText
                      className={`text-label-bold font-semibold ${
                        isActive ? 'text-card' : 'text-muted'
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
                <Surface key={i} variant="primary" className="p-4 rounded-xl">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Surface>
              ))}
            </StyledView>
          ) : filteredExpenses.length === 0 ? (
            <StyledView className="py-12 items-center justify-center text-center">
              <StyledView className="size-16 rounded-full bg-card items-center justify-center mb-3">
                <Receipt size={32} color={colors.muted} />
              </StyledView>
              <StyledText className="text-base font-bold text-ink mb-1">
                No Expenses Recorded
              </StyledText>
              <StyledText className="text-label-bold text-muted text-center px-8 mb-4">
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
                    variant="primary"
                    className="p-4 rounded-xl border border-border/30 bg-cardest"
                  >
                    <StyledView className="flex-row justify-between items-start mb-2">
                      <StyledView className="flex-1 mr-3">
                        <StyledView className="flex-row flex-wrap items-center gap-1.5 mb-1">
                          <StyledView className="bg-danger-soft px-2 py-0.5 rounded-md">
                            <StyledText className="text-label-bold font-bold text-danger">
                              {expense.category || 'General'}
                            </StyledText>
                          </StyledView>
                          {expense.isRecurring && (
                            <StyledView className="bg-brand-soft px-2 py-0.5 rounded-md flex-row items-center gap-1">
                              <Repeat size={12} color={colors.brand} />
                              <StyledText className="text-label-bold font-bold text-brand capitalize">
                                {expense.recurringFrequency || 'Recurring'}
                              </StyledText>
                            </StyledView>
                          )}
                          <StyledText className="text-label-bold text-muted font-medium">
                            {formatDate(expense.incurredAt)}
                          </StyledText>
                        </StyledView>
                        <StyledText className="text-base font-bold text-ink leading-snug">
                          {expense.description}
                        </StyledText>

                        {/* Payment Due Reminder Badge */}
                        {dueStatus && !expense.isPaid && (
                          <StyledView className="flex-row items-center gap-1 mt-1 bg-accent-soft px-2 py-0.5 rounded-md self-start">
                            <Clock size={12} color={colors.accent} />
                            <StyledText className="text-label-bold font-bold text-accent">
                              {dueStatus.text}
                            </StyledText>
                          </StyledView>
                        )}
                      </StyledView>
                      <StyledView className="items-end">
                        <StyledText className="text-base font-extrabold text-danger tabular-nums">
                          -{formatCurrency(amt)}
                        </StyledText>
                        <StyledTouchableOpacity
                          onPress={() => handleTogglePaid(expense)}
                          className={`flex-row items-center gap-1 px-2 py-0.5 rounded-md mt-1 ${
                            expense.isPaid ? 'bg-brand-soft' : 'bg-accent-soft'
                          }`}
                        >
                          <CheckCircle
                            size={12}
                            color={expense.isPaid ? colors.brand : colors.muted}
                            weight={expense.isPaid ? 'fill' : 'regular'}
                          />
                          <StyledText
                            className={`text-label-bold ${
                              expense.isPaid ? 'text-ink' : 'text-ink'
                            }`}
                          >
                            {expense.isPaid ? 'Paid' : 'Pending'}
                          </StyledText>
                        </StyledTouchableOpacity>
                      </StyledView>
                    </StyledView>

                    {/* Action buttons */}
                    <StyledView className="flex-row justify-end items-center gap-2 mt-3 pt-2 border-t border-border/20">
                      <StyledTouchableOpacity
                        onPress={() => openEditModal(expense)}
                        className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-card active:opacity-80"
                      >
                        <PencilSimple size={15} color={colors.ink} />
                        <StyledText className="text-label-bold font-semibold text-ink">Edit</StyledText>
                      </StyledTouchableOpacity>
                      <StyledTouchableOpacity
                        onPress={() => confirmDeleteExpense(expense.id)}
                        className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-danger-soft active:opacity-80"
                      >
                        <Trash size={15} color={colors.danger} />
                        <StyledText className="text-label-bold font-semibold text-danger">Delete</StyledText>
                      </StyledTouchableOpacity>
                    </StyledView>
                  </Surface>
                );
              })}
            </StyledView>
          )}
        </StyledView>
      </StyledScrollView>

      {/* Record / Edit Expense */}
      <BottomSheet
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Record Expense'}
        subtitle={editingExpense ? 'Update this expense record.' : 'Log a cost so your profit stays honest.'}
        icon={<Receipt size={20} color={colors.ink} />}
        maxHeightRatio={0.9}
        contentClassName="pt-4"
        footer={
          <Button size="lg" onPress={handleSaveExpense} isDisabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : editingExpense
                ? 'Update Expense'
                : 'Save Expense Record'}
          </Button>
        }
      >
        <StyledView className="gap-4 pb-4">
          {/* Amount */}
          <StyledView>
            <StyledText className="text-label-bold font-semibold text-muted mb-1.5">
              Amount (₦) *
            </StyledText>
            <StyledView className="flex-row items-center bg-card border border-border rounded-xl px-4 h-12">
              <StyledText className="text-lg font-bold text-brand mr-2">₦</StyledText>
              <StyledTextInput
                className="flex-1 text-base font-bold text-ink"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={amountInput}
                onChangeText={setAmountInput}
              />
            </StyledView>
          </StyledView>

          {/* Description */}
          <StyledView>
            <StyledText className="text-label-bold font-semibold text-muted mb-1.5">
              Description *
            </StyledText>
            <StyledTextInput
              className="bg-card border border-border rounded-xl px-4 py-3 text-body-sm text-ink"
              placeholder="e.g. NEPA light bill, Transport to market, Staff wages"
              placeholderTextColor={colors.muted}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
            />
          </StyledView>

          {/* Category Selection */}
          <StyledView>
            <StyledText className="text-label-bold font-semibold text-muted mb-1.5">
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
                        ? 'bg-brand border-brand'
                        : 'bg-card border-border/40'
                    }`}
                  >
                    <StyledText
                      className={`text-label-bold font-bold ${
                        isSelected ? 'text-card' : 'text-muted'
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
          <StyledView className="bg-card p-4 rounded-xl border border-border/40 gap-3">
            <StyledView className="flex-row justify-between items-center">
              <StyledView className="flex-row items-center gap-2.5 flex-1 pr-2">
                <Repeat size={20} color={colors.brand} />
                <StyledView className="flex-1">
                  <StyledText className="text-body-sm font-bold text-ink">
                    Recurring Expense
                  </StyledText>
                </StyledView>
              </StyledView>
              <Switch
                value={isRecurringInput}
                onValueChange={setIsRecurringInput}
                trackColor={{ false: colors.border, true: colors.brand }}
              />
            </StyledView>

            {isRecurringInput && (
              <StyledView className="pt-2 border-t border-border/30 gap-3">
                <StyledText className="text-label-bold font-semibold text-muted">
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
                            ? 'bg-brand border-brand'
                            : 'bg-card border-border/40'
                        }`}
                      >
                        <StyledText
                          className={`text-label-bold font-bold capitalize ${
                            isSelected ? 'text-card' : 'text-muted'
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
          <StyledView className="bg-card p-4 rounded-xl border border-border/40 gap-3">
            <StyledView className="flex-row justify-between items-center">
              <StyledView className="flex-row items-center gap-2">
                <CheckCircle size={20} color={isPaidInput ? colors.brand : colors.muted} />
                <StyledText className="text-body-sm font-bold text-ink">
                  Payment Status
                </StyledText>
              </StyledView>
              <StyledTouchableOpacity
                onPress={() => setIsPaidInput(!isPaidInput)}
                accessibilityRole="button"
                accessibilityState={{ selected: isPaidInput }}
                className={`px-3 py-1.5 rounded-lg border ${
                  isPaidInput
                    ? 'bg-brand-soft border-brand'
                    : 'bg-accent-soft border-accent'
                }`}
              >
                <StyledText
                  className={`text-label-bold ${
                    isPaidInput ? 'text-ink' : 'text-ink'
                  }`}
                >
                  {isPaidInput ? 'Paid' : 'Pending / Due'}
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            {!isPaidInput && (
              <StyledView className="pt-2 border-t border-border/30 gap-2">
                <StyledText className="text-label-bold font-semibold text-muted">
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
                            ? 'bg-brand border-brand'
                            : 'bg-card border-border/40'
                        }`}
                      >
                        <StyledText
                          className={`text-label-bold font-bold ${
                            isSelected ? 'text-card' : 'text-muted'
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
      </BottomSheet>
    </Container>
  );
}
