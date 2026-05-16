import { Platform } from "react-native";

const isDevelopment = process.env.NODE_ENV === "development";
const simulateProd = process.env.EXPO_PUBLIC_SIMULATE_PROD === "true";

console.log("Payment config - simulateProd:", simulateProd);

export const getAPIKey = () => {
  console.log("getAPIKey - isDevelopment:", isDevelopment);
  if (isDevelopment && !simulateProd) {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || "";
  }

  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
  }

  return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";
};
