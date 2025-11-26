import { Redirect } from "expo-router";

export default function HomeRoute() {
  // Redirect to tabs as the default screen
  return <Redirect href="/(root)/(main)/(tabs)/for-you" />;
}
