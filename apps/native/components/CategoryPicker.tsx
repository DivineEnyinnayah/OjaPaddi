import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { withUniwind } from "uniwind";
import { useProducts } from "../hooks/useProducts";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledScrollView = withUniwind(ScrollView);

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
}

/** Category chips — FigCraft `03 — Components` (chips), reusing the Chip treatment. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { products, fetchProducts } = useProducts();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    setCategories(Array.from(cats).sort());
  }, [products]);

  return (
    <StyledView className="mb-4">
      <StyledText className="mb-2 ml-1 font-label text-micro uppercase tracking-wide text-muted">
        Category
      </StyledText>
      {categories.length > 0 ? (
        <StyledScrollView horizontal showsHorizontalScrollIndicator={false}>
          <StyledView className="flex-row gap-2 py-1">
            {categories.map((cat) => {
              const isActive = value === cat;
              return (
                <StyledTouchableOpacity
                  key={cat}
                  onPress={() => onChange(cat)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={cat}
                  className={`min-h-[32px] justify-center rounded-pill border px-3 py-2 ${
                    isActive ? "border-brand bg-brand" : "border-border bg-card"
                  }`}
                >
                  <StyledText
                    className={`font-label text-label ${isActive ? "text-card" : "text-muted"}`}
                  >
                    {cat}
                  </StyledText>
                </StyledTouchableOpacity>
              );
            })}
          </StyledView>
        </StyledScrollView>
      ) : null}
    </StyledView>
  );
}
