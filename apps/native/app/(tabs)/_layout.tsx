import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";

export default function TabLayout() {
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	return (
		<Tabs
			screenOptions={{
				headerShown: true,
				headerStyle: {
					backgroundColor: themeColorBackground,
				},
				headerTintColor: themeColorForeground,
				headerTitleStyle: {
					color: themeColorForeground,
					fontWeight: "600",
				},
				tabBarStyle: {
					backgroundColor: themeColorBackground,
					height: 60,
					paddingBottom: 8,
				},
				tabBarActiveTintColor: "#1A6B3C", // Deep Green from design tokens
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="home-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="products/index"
				options={{
					title: "Products",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="cube-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="sales/index"
				options={{
					title: "Sales",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="receipt-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="customers/index"
				options={{
					title: "Customers",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="people-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="more"
				options={{
					title: "More",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="ellipsis-horizontal" size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
