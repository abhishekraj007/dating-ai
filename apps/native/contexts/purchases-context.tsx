import React, { createContext, useContext, useEffect, useState } from "react";
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@convex-starter/backend";

interface PurchasesContextType {
  customerInfo: CustomerInfo | null;
  packages: PurchasesPackage[];
  isLoading: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(
  undefined
);

const getAPIKey = () => {
  if (Platform.isTesting) {
    return "test_mHJtxhsPexcuNLkkFpMgaqkfTqh";
  }

  if (Platform.OS === "ios") {
    return "";
  }

  return "";
};

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addCredits = useMutation(api.purchases.addCredits);
  const upgradeToPremium = useMutation(api.purchases.upgradeToPremium);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      // TODO: Replace with your actual RevenueCat API keys
      const apiKey = getAPIKey();

      await Purchases.configure({ apiKey });

      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setPackages(offerings.current.availablePackages);
      }
    } catch (error) {
      console.error("Error initializing purchases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);

      // Handle different product types
      const productId = pkg.product.identifier;

      if (productId.includes("premium")) {
        // Premium subscription
        const expiresAt = info.entitlements.active["premium"]?.expirationDate;
        await upgradeToPremium({
          expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
        });
      } else if (productId.includes("credits")) {
        // Credits purchase
        const creditsAmount = parseInt(productId.match(/\d+/)?.[0] || "0", 10);
        await addCredits({ amount: creditsAmount });
      }

      return true;
    } catch (error) {
      console.error("Error purchasing package:", error);
      return false;
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      // Check if user has active premium subscription
      if (info.entitlements.active["premium"]) {
        const expiresAt = info.entitlements.active["premium"].expirationDate;
        await upgradeToPremium({
          expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
        });
      }
    } catch (error) {
      console.error("Error restoring purchases:", error);
    }
  };

  return (
    <PurchasesContext.Provider
      value={{
        customerInfo,
        packages,
        isLoading,
        purchasePackage,
        restorePurchases,
      }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (!context) {
    throw new Error("usePurchases must be used within PurchasesProvider");
  }
  return context;
}
