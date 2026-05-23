import React, { createContext, useContext, useEffect, useState } from "react";
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesStoreProduct,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend";
import { getAPIKey, isDevelopment } from "@/utils/payment";

const DEFAULT_CREDIT_PRODUCT_IDS: Array<string> = [
  "feelchat.rc_credit_1999",
  "feelchat.rc_credit_3900",
  "feelchat.rc_credit_4999",
  "feelchat.rc_credit_8999",
];

const TEST_CREDIT_PRODUCT_IDS: Array<string> = [
  "credits_1000",
  "credits_2500",
  "credits_5000",
];

type RuntimeAppConfig = {
  revenueCatCreditProductIds?: Array<string>;
};

interface PurchasesContextType {
  customerInfo: CustomerInfo | null;
  packages: PurchasesPackage[];
  subscriptionPackages: PurchasesPackage[];
  creditPackages: PurchasesStoreProduct[];
  isLoading: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  purchaseStoreProduct: (product: PurchasesStoreProduct) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  presentPaywall: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(
  undefined,
);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [subscriptionPackages, setSubscriptionPackages] = useState<
    PurchasesPackage[]
  >([]);
  const [creditPackages, setCreditPackages] = useState<PurchasesStoreProduct[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const userAndProfile = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );
  const appConfig = useQuery(
    api.features.appConfig.queries.getPublicAppConfig,
  ) as RuntimeAppConfig | undefined;
  const authenticatedUserId = isAuthenticated
    ? userAndProfile?.userMetadata?._id
    : undefined;
  const authenticatedUserEmail = isAuthenticated
    ? userAndProfile?.userMetadata?.email
    : undefined;
  const authenticatedUserName = isAuthenticated
    ? userAndProfile?.userMetadata?.name
    : undefined;

  const configuredCreditProductIds = appConfig?.revenueCatCreditProductIds;

  const creditProductIds = __DEV__
    ? TEST_CREDIT_PRODUCT_IDS
    : configuredCreditProductIds && configuredCreditProductIds.length > 0
      ? configuredCreditProductIds
      : DEFAULT_CREDIT_PRODUCT_IDS;
  const creditProductIdKey = creditProductIds.join("|");

  useEffect(() => {
    // console.log("customerInfo changed:", JSON.stringify(customerInfo, null, 2));
  }, [customerInfo]);

  // Initialize RevenueCat once on mount (anonymously)
  useEffect(() => {
    if (!isInitialized) {
      initializePurchases();
    }
  }, [isInitialized]);

  // Log in to RevenueCat when user authenticates
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const loginToRevenueCat = async () => {
      if (authenticatedUserId) {
        try {
          await identifyRevenueCatUser("auth effect");
        } catch (error) {
          console.error("Error logging in to RevenueCat:", error);
        }
      }
    };

    void loginToRevenueCat();
    void getSubscriptions();

    void getProducts(creditProductIds);
  }, [authenticatedUserId, isInitialized, creditProductIdKey]);

  const initializePurchases = async () => {
    try {
      const apiKey = getAPIKey();

      // Configure RevenueCat without a user ID (creates anonymous ID)

      Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);

      await Purchases.configure({ apiKey });

      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      setIsInitialized(true);
      console.log("revenuecat-> Initialized successfully with anonymous ID");
    } catch (error) {
      console.error("Error initializing purchases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptions = async () => {
    const offerings = await Purchases.getOfferings();

    // console.log(
    //   "revenuecat-> Fetched offerings:",
    //   JSON.stringify(offerings, null, 2)
    // );

    if (offerings.current) {
      const allPackages = offerings.current.availablePackages;
      setPackages(allPackages);

      // Separate subscription packages from consumable (credit) packages
      const subscriptions = allPackages.filter(
        (pkg) =>
          pkg.product.productType === "AUTO_RENEWABLE_SUBSCRIPTION" ||
          pkg.product.productCategory === "SUBSCRIPTION",
      );

      setSubscriptionPackages(subscriptions);
    }
  };

  const getProducts = async (productIds: Array<string>) => {
    console.log("fetching revenue products...");

    try {
      const products = await Purchases.getProducts(
        productIds,
        Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION,
      );

      setCreditPackages(products);

      return products;
    } catch (error) {
      console.error("Error fetching credit products:", error);
      return [];
    }
  };

  const syncRevenueCatAttributes = async (userId: string) => {
    await Purchases.setAttributes({ authUserId: userId });

    if (authenticatedUserEmail) {
      await Purchases.setEmail(authenticatedUserEmail);
    }

    if (authenticatedUserName) {
      await Purchases.setDisplayName(authenticatedUserName);
    }
  };

  const identifyRevenueCatUser = async (source: string) => {
    if (!authenticatedUserId) {
      console.warn(
        `[RevenueCat] Cannot ${source}: authenticated user is not ready`,
      );
      return false;
    }

    const isConfigured = await Purchases.isConfigured();

    if (!isConfigured) {
      console.warn(`[RevenueCat] Cannot ${source}: purchases is not ready`);
      return false;
    }

    const currentAppUserId = await Purchases.getAppUserID();

    if (currentAppUserId !== authenticatedUserId) {
      console.log("revenuecat-> Logging in user:", authenticatedUserId);

      const { customerInfo: info } = await Purchases.logIn(authenticatedUserId);
      setCustomerInfo(info);

      console.log("revenuecat-> User logged in successfully");
    }

    await syncRevenueCatAttributes(authenticatedUserId);
    return true;
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const isIdentified = await identifyRevenueCatUser("purchase package");

      if (!isIdentified) {
        return false;
      }

      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
      return true;
    } catch (error) {
      console.error("Error purchasing package:", error);
      return false;
    }
  };

  const purchaseStoreProduct = async (
    product: PurchasesStoreProduct,
  ): Promise<boolean> => {
    try {
      const isIdentified = await identifyRevenueCatUser("purchase product");

      if (!isIdentified) {
        return false;
      }

      const { customerInfo: info } =
        await Purchases.purchaseStoreProduct(product);
      setCustomerInfo(info);
      return true;
    } catch (error) {
      console.error("Error purchasing product:", error);
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const isIdentified = await identifyRevenueCatUser("restore purchases");

      if (!isIdentified) {
        return false;
      }

      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return Object.keys(info.entitlements.active).length > 0;
    } catch (error) {
      console.error("Error restoring purchases:", error);
      return false;
    }
  };

  const presentPaywall = async () => {
    try {
      console.log("[RevenueCat] Presenting paywall...");

      const isIdentified = await identifyRevenueCatUser("present paywall");

      if (!isIdentified) {
        return;
      }

      // Present RevenueCat's native paywall UI
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

      console.log("[RevenueCat] Paywall result:", paywallResult);

      switch (paywallResult) {
        case PAYWALL_RESULT.RESTORED:
          console.log(
            "[RevenueCat] Purchase restored, refreshing customer info...",
          );
          const restoredInfo = await Purchases.getCustomerInfo();
          setCustomerInfo(restoredInfo);
          console.log("[RevenueCat] Restored customer info:", {
            activeEntitlements: Object.keys(restoredInfo.entitlements.active),
            allEntitlements: Object.keys(restoredInfo.entitlements.all),
          });
          break;

        case PAYWALL_RESULT.PURCHASED:
          console.log(
            "[RevenueCat] Purchase successful, refreshing customer info...",
          );
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
          console.log("[RevenueCat] Customer info:", {
            activeEntitlements: Object.keys(info.entitlements.active),
            allEntitlements: Object.keys(info.entitlements.all),
          });
          break;

        case PAYWALL_RESULT.CANCELLED:
          console.log("[RevenueCat] User cancelled the paywall");
          break;

        case PAYWALL_RESULT.NOT_PRESENTED:
          console.warn(
            "[RevenueCat] Paywall was not presented - user may already have access",
          );
          break;

        case PAYWALL_RESULT.ERROR:
          console.error("[RevenueCat] Error presenting paywall");
          break;

        default:
          console.warn("[RevenueCat] Unknown paywall result:", paywallResult);
      }
    } catch (error) {
      console.error("[RevenueCat] Error presenting paywall:", error);
      if (error instanceof Error) {
        console.error("[RevenueCat] Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
    }
  };

  return (
    <PurchasesContext.Provider
      value={{
        customerInfo,
        packages,
        subscriptionPackages,
        creditPackages,
        isLoading,
        purchasePackage,
        purchaseStoreProduct,
        restorePurchases,
        presentPaywall,
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
