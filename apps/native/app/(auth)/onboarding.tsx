import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function OnboardingScreen() {
  const router = useRouter();
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129";

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!businessName || !category || !city || !state) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    // In a real app, we would call the backend to create the business
    // For now, we'll just simulate it and navigate to tabs
    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(tabs)");
    }, 1000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Setup Business</Text>
        <Text style={styles.subtitle}>Tell us about your business to get started.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tope's Fashion Hub"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Business Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Clothing & Accessories"
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>WhatsApp Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 08012345678"
            keyboardType="phone-pad"
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ikeja"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lagos"
              value={state}
              onChangeText={setState}
            />
          </View>
        </View>

        <View style={styles.logoUploadContainer}>
          <TouchableOpacity style={styles.logoUpload}>
            <Ionicons name="camera-outline" size={32} color="#404940" />
            <Text style={styles.logoUploadText}>Upload Logo (Optional)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor, opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleComplete}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? "Saving..." : "Finish Setup"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#181d19",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#404940",
  },
  form: {
    padding: 24,
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
    backgroundColor: "#f1f5ee",
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
  logoUploadContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoUpload: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#bfc9be",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7faf3",
  },
  logoUploadText: {
    marginTop: 8,
    fontSize: 14,
    color: "#404940",
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
