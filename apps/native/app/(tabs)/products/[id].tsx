import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native';
import { useProducts, type Product } from '../../../hooks/useProducts';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchProductById, currentProduct, adjustStock, deleteProduct, isLoading } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (id) {
        const fetched = await fetchProductById(id as string);
        if (fetched) {
          setProduct(fetched);
        }
      }
    };
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (currentProduct && id) {
      setProduct(currentProduct);
    }
  }, [currentProduct, id]);

  const handleStockAdd = async () => {
    try {
      await adjustStock(id as string, 1);
      const updated = await fetchProductById(id as string);
      if (updated) {
        setProduct(updated);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to adjust stock');
    }
  };

  const handleStockRemove = async () => {
    if (!product || product.quantity <= 0) return;
    try {
      await adjustStock(id as string, -1);
      const updated = await fetchProductById(id as string);
      if (updated) {
        setProduct(updated);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to adjust stock');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id as string);
              router.back();
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete product');
            }
          }
        },
      ]
    );
  };

  if (isLoading && !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A6B3C" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const price = parseFloat(product.price);
  const lowStockThreshold = product.lowStockThreshold ?? 5;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={64} color="#D4D4D4" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.row}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>₦{price.toLocaleString()}</Text>
          </View>
          <Text style={styles.category}>{product.category || 'General'}</Text>
          <Text style={styles.sku}>{product.sku ? `SKU: ${product.sku}` : ''}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description || 'No description provided.'}</Text>

          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>Current Stock</Text>
            <View style={styles.stockControls}>
              <TouchableOpacity style={styles.stockButton} onPress={handleStockRemove}>
                <Ionicons name="remove" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.stockValue}>{product.quantity}</Text>
              <TouchableOpacity style={styles.stockButton} onPress={handleStockAdd}>
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            {product.quantity <= lowStockThreshold && (
              <Text style={styles.lowStockText}>Running Low!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
        <Button
          size="lg"
          style={styles.shareButton}
          onPress={() => {
            const msg = `*${product.name}* 🛍️\nPrice: ₦${price.toLocaleString()}\n\nTap to view & order 👇\nstore.ojapaddi.com/${product.id}`;
            const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
            alert('WhatsApp share link copied to clipboard (simulation)');
          }}
        >
          Share Product
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A6B3C',
  },
  category: {
    fontSize: 16,
    color: '#737373',
    marginBottom: 4,
  },
  sku: {
    fontSize: 14,
    color: '#A3A3A3',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#404040',
    lineHeight: 24,
    marginBottom: 32,
  },
  stockContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 16,
  },
  stockLabel: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 12,
  },
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  stockButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockValue: {
    fontSize: 24,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  lowStockText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
    gap: 16,
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  shareButton: {
    flex: 1,
    borderRadius: 16,
    height: 56,
    backgroundColor: '#1A6B3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#737373',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1A6B3C',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
