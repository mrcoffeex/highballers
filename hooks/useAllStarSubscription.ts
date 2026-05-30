import { useCallback, useEffect, useState } from "react";

import {
  fetchAllStarSubscription,
  openSubscriptionManagement,
  purchaseAllStarSubscription,
  restoreAllStarSubscription,
} from "@/lib/allStarPurchase";
import { isIapSupportedEnvironment, SUBSCRIPTION_DISCLOSURE } from "@/lib/iapConfig";
import { SubscriptionError } from "@/lib/subscription";
import type { ProductSubscription } from "expo-iap";

export function useAllStarSubscription() {
  const [subscription, setSubscription] = useState<ProductSubscription | null>(
    null,
  );
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const storeAvailable = isIapSupportedEnvironment();

  const loadProduct = useCallback(async () => {
    if (!storeAvailable) return;
    setLoadingProduct(true);
    try {
      const product = await fetchAllStarSubscription();
      setSubscription(product);
    } catch {
      setSubscription(null);
    } finally {
      setLoadingProduct(false);
    }
  }, [storeAvailable]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const purchase = useCallback(async () => {
    setPurchasing(true);
    try {
      await purchaseAllStarSubscription();
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setRestoring(true);
    try {
      const restored = await restoreAllStarSubscription();
      if (!restored) {
        throw new SubscriptionError(
          "No active All-Star subscription was found for this account.",
        );
      }
      return true;
    } finally {
      setRestoring(false);
    }
  }, []);

  const manageSubscription = useCallback(async () => {
    await openSubscriptionManagement();
  }, []);

  const priceLabel = subscription?.displayPrice ?? null;

  return {
    storeAvailable,
    subscription,
    priceLabel,
    loadingProduct,
    purchasing,
    restoring,
    purchase,
    restore,
    manageSubscription,
    disclosure: SUBSCRIPTION_DISCLOSURE,
    reloadProduct: loadProduct,
  };
}
