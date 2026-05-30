import { Platform } from "react-native";

export const isDevelopment = process.env.NODE_ENV === "development";
const simulateProd = process.env.EXPO_PUBLIC_SIMULATE_PROD === "true";

export const getAPIKey = () => {
  if (isDevelopment && !simulateProd) {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || "";
  }

  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
  }

  return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";
};
