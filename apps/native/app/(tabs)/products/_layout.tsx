import { Stack } from 'expo-router';

export default function ProductsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Products' }} />
      <Stack.Screen name="add" options={{ title: 'Add Product', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Product Details', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
