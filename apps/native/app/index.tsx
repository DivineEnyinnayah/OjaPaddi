import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function Index() {
  const accessToken = useAuthStore(state => state.accessToken);
  const sessionExpired = useAuthStore(state => state.sessionExpired);

  if (accessToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href={sessionExpired ? "/(auth)/login" : "/(auth)/welcome"} />;
}

