import { Container } from "@/components/container";
import { Text, View } from "react-native";
import { Surface } from "@/components/ui/surface";
import { withUniwind } from "uniwind";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);

export default function TabTwo() {
	return (
		<Container className="p-6">
			<StyledView className="flex-1 justify-center items-center">
				<Surface variant="secondary" className="p-8 items-center">
					<StyledText className="text-3xl mb-2 text-on-surface font-bold">Tab Two</StyledText>
				</Surface>
			</StyledView>
		</Container>
	);
}

