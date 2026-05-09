import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function WelcomeScreen() {
  const bgColor = useThemeColor("background");
  const primaryColor = "#005129"; // Deep Green

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          {/* Placeholder for OjaPaddi Logo */}
          <View style={[styles.logo, { backgroundColor: primaryColor }]}>
            <Text style={styles.logoText}>Oja</Text>
          </View>
          <Text style={styles.title}>OjaPaddi</Text>
          <Text style={styles.tagline}>Your Market Friend — Manage, Sell & Grow Your Business.</Text>
        </View>

        <View style={styles.footer}>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={[styles.button, { backgroundColor: primaryColor }]}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>I already have an account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#181d19",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#404940",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  footer: {
    paddingBottom: 40,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#005129",
    fontSize: 16,
    fontWeight: "500",
  },
});
