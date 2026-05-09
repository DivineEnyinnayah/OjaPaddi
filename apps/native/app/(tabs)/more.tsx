import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

export default function MoreScreen() {
  const bgColor = useThemeColor("background");
  const textColor = useThemeColor("foreground");

  const menuItems = [
    { title: "Business Profile", icon: "business-outline" },
    { title: "Subscription & Plan", icon: "card-outline" },
    { title: "Notifications", icon: "notifications-outline" },
    { title: "Share OjaPaddi", icon: "share-social-outline" },
    { title: "Help & Support", icon: "help-circle-outline" },
    { title: "Privacy Policy", icon: "shield-checkmark-outline" },
    { title: "Logout", icon: "log-out-outline", color: "#ba1a1a" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }}>
      <View style={{ padding: 16 }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#ebefe8",
            }}
          >
            <Ionicons name={item.icon as any} size={24} color={item.color || "#404940"} />
            <Text style={{ marginLeft: 16, fontSize: 16, color: item.color || textColor }}>
              {item.title}
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={20} color="#bfc9be" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
