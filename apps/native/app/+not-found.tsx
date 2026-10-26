import { Link, Stack } from "expo-router";
import { StyledText, StyledView } from "@/components/ui/styled";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

import { Container } from "@/components/container";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <Container>
        <StyledView className="flex-1 justify-center items-center p-4">
          <Surface variant="secondary" className="items-center p-6 max-w-sm rounded-card">
            <StyledText className="text-display mb-3">🤔</StyledText>
            <StyledText className="text-h3 font-bold text-on-surface mb-1">
              Page Not Found
            </StyledText>
            <StyledText className="text-body-sm text-on-surface-variant text-center mb-4">
              The page you&apos;re looking for doesn&apos;t exist.
            </StyledText>
            <Link href="/" asChild>
              <Button size="sm">Go Home</Button>
            </Link>
          </Surface>
        </StyledView>
      </Container>
    </>
  );
}
