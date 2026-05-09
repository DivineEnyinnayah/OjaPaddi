import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { useCreateProduct } from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";

export default function AddProductScreen() {
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129";
  const createProduct = useCreateProduct();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert("Error", "Product name and price are required");
      return;
    }

    try {
      await createProduct.mutateAsync({
        name,
        category,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : undefined,
        quantity: parseInt(quantity),
        lowStockThreshold: parseInt(lowStockThreshold),
        sku,
        description,
      });
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to create product");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.imagePickerContainer}>
        <TouchableOpacity style={styles.imagePicker}>
          <Ionicons name="camera-outline" size={40} color="#404940" />
          <Text style={styles.imagePickerText}>Add Product Image</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ankara Top"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Clothing"
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Selling Price (₦) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Cost Price (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={costPrice}
              onChangeText={setCostPrice}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Stock Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Low Stock Alert</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              keyboardType="numeric"
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>SKU (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ANK-001"
            value={sku}
            onChangeText={setSku}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top", paddingVertical: 12 }]}
            placeholder="Describe your product..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor, opacity: createProduct.isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={createProduct.isPending}
        >
          <Text style={styles.buttonText}>{createProduct.isPending ? "Saving..." : "Save Product"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imagePickerContainer: {
    padding: 24,
    alignItems: "center",
  },
  imagePicker: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    backgroundColor: "#f7faf3",
    borderWidth: 2,
    borderColor: "#bfc9be",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: "#404940",
    fontWeight: "500",
  },
  form: {
    padding: 24,
    paddingTop: 0,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#181d19",
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#181d19",
    borderWidth: 1,
    borderColor: "#bfc9be",
  },
  row: {
    flexDirection: "row",
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 40,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
