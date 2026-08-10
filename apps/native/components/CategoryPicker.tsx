import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { withUniwind } from 'uniwind';
import { useProducts } from '../hooks/useProducts';
import { useThemeColor } from '../hooks/useThemeColor';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledScrollView = withUniwind(ScrollView);

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { products, fetchProducts } = useProducts();
  const colors = useThemeColor();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    setCategories(Array.from(cats).sort());
  }, [products]);

  return (
    <StyledView className="mb-4">
      <StyledText className="text-body-sm text-on-surface font-semibold mb-2 ml-1">
        Category
      </StyledText>
      {categories.length > 0 && (
        <StyledScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <StyledView className="flex-row gap-2 py-1">
            {categories.map((cat) => (
              <StyledTouchableOpacity
                key={cat}
                onPress={() => onChange(cat)}
                className={`px-3 py-1.5 rounded-full border ${
                  value === cat
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container-lowest border-outline-variant'
                }`}
              >
                <StyledText
                  className={`text-xs font-semibold ${
                    value === cat ? 'text-on-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {cat}
                </StyledText>
              </StyledTouchableOpacity>
            ))}
          </StyledView>
        </StyledScrollView>
      )}
    </StyledView>
  );
}
