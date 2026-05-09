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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native';
import { useProducts } from '../../../hooks/useProducts';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, fetchProducts, adjustStock, deleteProduct } = useProducts();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      await fetchProducts();
      const found = products.find(p => p.id === id);
      if (found) {
        setProduct(found);
      } else {
        // If not found in local list (maybe due to pagination), 
        // we should ideally have a fetchById in useProducts.
        // For now, let's assume it's in the list.
      }
      setIsLoading(false);
    };
    loadProduct();
  }, [id]);

  const handleStockAdd = async () => {
    try {
      await adjustStock(id as string, 1);
      // Refresh list and product
      await fetchProducts();
      setProduct((prev: any) => ({ ...prev, quantity: prev.quantity + 1 }));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleStockRemove = async () => {
    if (product?.quantity <= 0) return;
    try {
      await adjustStock(id as string, -1);
      await fetchProducts();
      setProduct((prev: any) => ({ ...prev, quantity: prev.quantity - 1 }));
    } catch (err: any) {
      Alert.alert('Error', err.message);
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
            await deleteProduct(id as string);
            router.back();
          } 
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found</Text>
      </View>
    );
  }

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
            <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
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
            {product.quantity <= product.lowStockThreshold && (
              <Text style={styles.lowStockText}>⚠️ Low stock alert!</Text>
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
             // Implement WhatsApp sharing
             const msg = `*${product.name}* 🛍️\nPrice: ₦${product.price.toLocaleString()}\n\nTap to view & order 👇\nstore.ojapaddi.com/${product.id}`;
             const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
             // In a real app, use Linking.openURL(url)
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
    color: '#F59E0B',
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
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
