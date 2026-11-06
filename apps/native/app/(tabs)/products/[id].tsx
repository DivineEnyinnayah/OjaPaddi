import React, { useEffect, useState } from "react";
import { ScrollView, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { withUniwind } from "uniwind";
import { ArrowLeft, ShareNetwork, Minus, Plus, Trash, Warning } from "phosphor-react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { StyledView, StyledText, StyledTouchableOpacity } from "@/components/ui/styled";
import { useProducts, type Product } from "../../../hooks/useProducts";
import { buildProductShareMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { radius, spacing } from "@/constants/tokens";
import { formatCurrency } from "@/lib/currency";
import { imageUri } from "@/lib/image";

const StyledImage = withUniwind(Image);
const StyledScrollView = withUniwind(ScrollView);

/** Drawn rice-bag illustration — frame 688 (x149 y24, 92×150). */
function RiceBagIllustration() {
  const colors = useThemeColor();
  return (
    <StyledView className="items-center justify-center">
      {/* Fold — frame y24, 68×34 */}
      <StyledView
        className="items-center bg-brand-strong"
        style={{ width: 68, height: 34, borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
      >
        <StyledView className="mt-3 h-0.5 w-[68px] bg-accent" />
      </StyledView>
      {/* Body — frame y40, 92×150 */}
      <StyledView
        className="items-center justify-center border bg-card"
        style={{ width: 92, height: 150, borderRadius: 16, borderColor: colors.brandStrong }}
      >
        <StyledText className="font-display text-brand-strong" style={{ fontSize: 34, lineHeight: 34 }}>
          RICE
        </StyledText>
        <StyledText
          className="mt-4 font-label uppercase tracking-[2px] text-brand"
          style={{ fontSize: 8, lineHeight: 10 }}
        >
          LONG GRAIN
        </StyledText>
      </StyledView>
    </StyledView>
  );
}

/**
 * FigCraft `03.3 — Product detail` (frame 688), 390×844.
 *
 * Presentation follows the frame: brand-soft image area with a drawn rice-bag
 * placeholder, low-stock pill, ledger meta, price block, stock stepper and a
 * Record sale / Stock in action pair. All product logic is unchanged —
 * `handleStockAdd` / `handleStockRemove` / `handleDelete` / `handleShare` are
 * the same handlers the previous screen used.
 */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchProductById, adjustStock, deleteProduct, isLoading } = useProducts();
  const colors = useThemeColor();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProductById(id as string).then((fetched) => {
      if (fetched) setProduct(fetched);
    });
  }, [id]);

  const handleStockAdd = async () => {
    try {
      await adjustStock(id as string, 1);
      const updated = await fetchProductById(id as string);
      if (updated) setProduct(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust stock");
    }
  };

  const handleStockRemove = async () => {
    if (!product || product.quantity <= 0) return;
    try {
      await adjustStock(id as string, -1);
      const updated = await fetchProductById(id as string);
      if (updated) setProduct(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust stock");
    }
  };

  const handleDelete = () => {
    toast.confirm({
      title: "Delete Product",
      message: "Are you sure you want to delete this product?",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteProduct(id as string);
          toast.success("Product has been removed.", "Deleted");
          router.back();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed to delete product");
        }
      },
    });
  };

  const handleShare = () => {
    if (!product) return;
    const message = buildProductShareMessage(product);
    shareViaWhatsApp(message);
  };

  if (isLoading && !product) {
    return (
      <Container isScrollable={false} className="bg-background">
        <Skeleton className="h-[260px] w-full" />
        <StyledView className="px-gutter pt-6">
          <Skeleton className="mb-3 h-7 w-40" />
          <Skeleton className="mb-4 h-4 w-56" />
          <Skeleton className="mb-4 h-9 w-40" />
          <Skeleton className="h-[82px] rounded-card" />
        </StyledView>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container isScrollable={false} className="items-center justify-center bg-background">
        <StyledText className="mb-4 font-body text-bodySm text-muted">
          Product not found
        </StyledText>
        <Button onPress={() => router.back()}>Go Back</Button>
      </Container>
    );
  }

  const price = parseFloat(product.price);
  const cost = parseFloat(product.costPrice ?? "0");
  const hasCost = !isNaN(cost) && cost > 0;
  const margin = hasCost ? price - cost : 0;
  const lowStockThreshold = product.lowStockThreshold ?? 5;
  const isLow = product.quantity <= lowStockThreshold;
  const hasPhoto = !!product.imageUrl && !imageError;

  const meta = [product.category, product.sku ? `SKU ${product.sku}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Container isScrollable={false} className="bg-background">
      <StyledView className="relative flex-1">
        <StyledScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Image area — frame y0, 390×260 */}
          <StyledView
            className="w-full items-center justify-center overflow-hidden bg-brand-soft"
            style={{ height: 260 }}
          >
            {hasPhoto ? (
              <StyledImage
                source={{ uri: imageUri(product.imageUrl) }}
                className="h-full w-full"
                resizeMode="cover"
                onError={() => setImageError(true)}
                accessible
                accessibilityLabel={product.name}
              />
            ) : (
              <RiceBagIllustration />
            )}
          </StyledView>

          {/* Back + share — frame y18 */}
          <StyledTouchableOpacity
            onPress={() => router.back()}
            className="absolute items-center justify-center rounded-pill bg-background"
            style={{ top: 18, left: 18, height: 40, width: 40, borderRadius: radius.pill }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            onPress={handleShare}
            className="absolute items-center justify-center rounded-pill bg-background"
            style={{ top: 18, right: 18, height: 40, width: 40, borderRadius: radius.pill }}
            accessibilityRole="button"
            accessibilityLabel="Share product"
          >
            <ShareNetwork size={18} color={colors.ink} />
          </StyledTouchableOpacity>

          <StyledView
            style={{ paddingHorizontal: spacing.gutter, paddingTop: spacing.gutter }}
          >
            {/* Low stock pill — frame y276 */}
            {isLow ? (
              <StyledView className="mb-3 h-[30px] flex-row items-center justify-center self-start rounded-pill border border-accent bg-accent-soft px-4">
                <Warning size={13} color={colors.accent} weight="bold" />
                <StyledText
                  className="ml-1.5 font-label uppercase tracking-[1.5px] text-accent"
                  style={{ fontSize: 10, lineHeight: 13 }}
                >
                  LOW STOCK — {product.quantity} LEFT
                </StyledText>
              </StyledView>
            ) : null}

            {/* Title — frame y324 */}
            <StyledText
              className="font-display text-ink"
              style={{ fontSize: 30, lineHeight: 32, letterSpacing: -0.3 }}
            >
              {product.name}
            </StyledText>

            {/* Ledger meta — frame y360 */}
            {meta ? (
              <StyledText
                className="mt-2 font-ledger text-muted"
                style={{ fontSize: 12, lineHeight: 16 }}
              >
                {meta}
              </StyledText>
            ) : null}

            {/* Price + margin chip — frame y386 */}
            <StyledView className="mt-4 flex-row items-start justify-between">
              <StyledView className="flex-1">
                <StyledText
                  className="font-display text-ink"
                  style={{ fontSize: 32, lineHeight: 35 }}
                >
                  {formatCurrency(price)}
                </StyledText>
                <StyledText
                  className="mt-3 font-label uppercase tracking-[1.5px] text-muted"
                  style={{ fontSize: 9, lineHeight: 12 }}
                >
                  PER UNIT
                </StyledText>
              </StyledView>

              {hasCost ? (
                <StyledView className="items-center justify-center rounded-pill bg-brand-soft px-4 py-2">
                  <StyledText
                    className="font-label text-brand"
                    style={{ fontSize: 13, lineHeight: 17 }}
                  >
                    make {formatCurrency(margin)}
                  </StyledText>
                </StyledView>
              ) : null}
            </StyledView>

            {/* Stock stepper — frame y476 */}
            <StyledView className="mt-6 flex-row items-center rounded-card border border-border bg-card p-4">
              <StyledView className="flex-1">
                <StyledText
                  className="font-label uppercase tracking-[1.5px] text-muted"
                  style={{ fontSize: 9, lineHeight: 12 }}
                >
                  STOCK ON HAND
                </StyledText>
                <StyledText
                  className="mt-2 font-body text-muted"
                  style={{ fontSize: 11, lineHeight: 14 }}
                >
                  Alert at {lowStockThreshold} units
                </StyledText>
              </StyledView>

              <StyledTouchableOpacity
                className="items-center justify-center bg-accent-soft"
                style={{ height: 32, width: 32, borderRadius: 10 }}
                onPress={handleStockRemove}
                accessibilityRole="button"
                accessibilityLabel="Decrease stock"
              >
                <Minus size={18} color={colors.ink} weight="bold" />
              </StyledTouchableOpacity>

              <StyledText
                className="w-12 text-center font-display text-ink"
                style={{ fontSize: 26, lineHeight: 34 }}
              >
                {product.quantity}
              </StyledText>

              <StyledTouchableOpacity
                className="items-center justify-center bg-brand-soft"
                style={{ height: 32, width: 32, borderRadius: 10 }}
                onPress={handleStockAdd}
                accessibilityRole="button"
                accessibilityLabel="Increase stock"
              >
                <Plus size={18} color={colors.brand} weight="bold" />
              </StyledTouchableOpacity>
            </StyledView>

            {/* Actions — frame y582 */}
            <StyledView className="mt-4 flex-row gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onPress={() =>
                  router.push({
                    pathname: "/products/add",
                    params: { editId: id as string },
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="lg"
                variant="primary"
                className="flex-1"
                onPress={handleStockAdd}
                isDisabled={isLoading}
              >
                Stock in
              </Button>
            </StyledView>

            <StyledTouchableOpacity
              className="mt-3 flex-row items-center justify-center rounded-button border border-border bg-card"
              style={{ minHeight: 48 }}
              onPress={() => router.push("/sales/record")}
              accessibilityRole="button"
              accessibilityLabel="Record a sale"
            >
              <StyledText className="font-label text-brand" style={{ fontSize: 16, lineHeight: 21 }}>
                Record sale
              </StyledText>
            </StyledTouchableOpacity>

            <StyledTouchableOpacity
              className="mt-3 flex-row items-center justify-center"
              style={{ minHeight: 48 }}
              onPress={handleDelete}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Delete product"
              accessibilityState={{ disabled: isLoading }}
            >
              <Trash size={16} color={colors.danger} />
              <StyledText
                className="ml-2 font-label text-danger"
                style={{ fontSize: 12, lineHeight: 16 }}
              >
                Delete product
              </StyledText>
            </StyledTouchableOpacity>

            {/* Recent sales — frame y674 */}
            <StyledView className="mt-6">
              <StyledText
                className="font-label uppercase tracking-[1.5px] text-muted"
                style={{ fontSize: 9, lineHeight: 12 }}
              >
                RECENT SALES
              </StyledText>
              <StyledView className="mt-3 rounded-card border border-border bg-card px-4 py-3">
                <StyledView className="flex-row items-center justify-between py-2">
                  <StyledText className="font-title text-ink" style={{ fontSize: 13, lineHeight: 17 }}>
                    Total sold
                  </StyledText>
                  <StyledText className="font-extrabold text-ink" style={{ fontSize: 13, lineHeight: 17 }}>
                    {product.quantity > 0 ? `${product.quantity} in stock` : "OUT"}
                  </StyledText>
                </StyledView>
                <StyledView className="h-px w-full bg-border" />
                <StyledView className="flex-row items-center justify-between py-2">
                  <StyledText className="font-body text-ink" style={{ fontSize: 13, lineHeight: 17 }}>
                    Unit price
                  </StyledText>
                  <StyledText className="font-label text-ink" style={{ fontSize: 13, lineHeight: 17 }}>
                    {formatCurrency(price)}
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledScrollView>
      </StyledView>
    </Container>
  );
}
