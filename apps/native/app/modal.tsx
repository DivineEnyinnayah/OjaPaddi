import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { useThemeColor } from "@/hooks/useThemeColor";

function Modal() {
	const colors = useThemeColor();

	function handleClose() {
		router.back();
	}

	return (
		<Container>
			<View className="flex-1 justify-center items-center p-4">
				<Surface variant="secondary" className="p-5 w-full max-w-sm rounded-lg">
					<View className="items-center">
						<View className="w-12 h-12 bg-primary rounded-lg items-center justify-center mb-3">
							<Ionicons name="checkmark" size={24} color={colors.onPrimary} />
						</View>
						<Text className="text-on-surface font-medium text-lg mb-1">Modal Screen</Text>
						<Text className="text-on-surface-variant text-sm text-center mb-4">
							This is an example modal screen for dialogs and confirmations.
						</Text>
					</View>
					<Button onPress={handleClose} className="w-full" size="sm">
						Close
					</Button>
				</Surface>
			</View>
		</Container>
	);
}

export default Modal;

