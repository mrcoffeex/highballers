import { Platform } from "react-native";
import {
  deepLinkToSubscriptions,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type ProductSubscription,
  type Purchase,
} from "expo-iap";

import {
  ALL_STAR_SUBSCRIPTION_ID,
  ANDROID_PACKAGE_NAME,
  isIapSupportedEnvironment,
} from "./iapConfig";
import { syncAllStarPurchase } from "./supabaseSync";
import { SubscriptionError } from "./subscription";

let connectionPromise: Promise<boolean> | null = null;

async function ensureStoreConnection(): Promise<boolean> {
  if (!isIapSupportedEnvironment()) {
    throw new SubscriptionError(
      "Subscriptions are available in the iOS and Android apps. Build and install the native app to subscribe.",
    );
  }

  if (!connectionPromise) {
    connectionPromise = initConnection().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

function isAllStarProduct(productId: string | null | undefined): boolean {
  return productId === ALL_STAR_SUBSCRIPTION_ID;
}

async function applyPurchaseEntitlement(purchase: Purchase): Promise<void> {
  await syncAllStarPurchase({
    productId: purchase.productId,
    transactionId: purchase.transactionId ?? purchase.id,
    purchaseToken: purchase.purchaseToken ?? null,
    platform: purchase.platform ?? Platform.OS,
    transactionDate: purchase.transactionDate ?? Date.now(),
  });
}

async function finalizePurchase(purchase: Purchase): Promise<void> {
  await applyPurchaseEntitlement(purchase);
  await finishTransaction({ purchase, isConsumable: false });
}

export async function fetchAllStarSubscription(): Promise<ProductSubscription | null> {
  if (!isIapSupportedEnvironment()) return null;

  await ensureStoreConnection();
  const products = await fetchProducts({
    skus: [ALL_STAR_SUBSCRIPTION_ID],
    type: "subs",
  });

  const match = (products ?? []).find(
    (product) => product.id === ALL_STAR_SUBSCRIPTION_ID,
  );

  return (match as ProductSubscription | undefined) ?? null;
}

function getAndroidOfferToken(subscription: ProductSubscription | null): string | undefined {
  if (!subscription || subscription.platform !== "android") return undefined;
  const offer = subscription.subscriptionOfferDetailsAndroid?.[0];
  return offer?.offerToken ?? undefined;
}

export async function purchaseAllStarSubscription(): Promise<void> {
  if (!isIapSupportedEnvironment()) {
    throw new SubscriptionError(
      "Subscriptions are available in the iOS and Android apps.",
    );
  }

  const subscription = await fetchAllStarSubscription();
  const offerToken = getAndroidOfferToken(subscription);

  await new Promise<void>((resolve, reject) => {
    const removeUpdated = purchaseUpdatedListener(async (purchase) => {
      removeUpdated.remove();
      removeError.remove();

      if (!isAllStarProduct(purchase.productId)) {
        reject(new SubscriptionError("Unexpected purchase product."));
        return;
      }

      try {
        await finalizePurchase(purchase);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    const removeError = purchaseErrorListener((error) => {
      removeUpdated.remove();
      removeError.remove();

      if (error.code === "user-cancelled") {
        reject(new SubscriptionError("Purchase canceled."));
        return;
      }

      reject(
        new SubscriptionError(
          error.message || "Could not complete the purchase. Try again.",
        ),
      );
    });

    void requestPurchase({
      type: "subs",
      request: {
        apple: { sku: ALL_STAR_SUBSCRIPTION_ID },
        google: {
          skus: [ALL_STAR_SUBSCRIPTION_ID],
          ...(offerToken
            ? {
                subscriptionOffers: [
                  {
                    sku: ALL_STAR_SUBSCRIPTION_ID,
                    offerToken,
                  },
                ],
              }
            : {}),
        },
      },
    }).catch((error) => {
      removeUpdated.remove();
      removeError.remove();
      reject(
        error instanceof Error
          ? error
          : new SubscriptionError("Could not start the purchase flow."),
      );
    });
  });
}

export async function restoreAllStarSubscription(): Promise<boolean> {
  if (!isIapSupportedEnvironment()) {
    throw new SubscriptionError(
      "Restore purchases is available in the iOS and Android apps.",
    );
  }

  await ensureStoreConnection();
  await restorePurchases();
  const active = await getActiveSubscriptions([ALL_STAR_SUBSCRIPTION_ID]);
  const entitlement = active.find(
    (item) => item.isActive && isAllStarProduct(item.productId),
  );

  if (!entitlement) {
    return false;
  }

  await syncAllStarPurchase({
    productId: entitlement.productId,
    transactionId: entitlement.transactionId,
    purchaseToken: entitlement.purchaseToken ?? null,
    platform: Platform.OS,
    transactionDate: entitlement.transactionDate,
    restored: true,
  });

  return true;
}

export async function openSubscriptionManagement(): Promise<void> {
  if (!isIapSupportedEnvironment()) {
    throw new SubscriptionError(
      "Manage your subscription from the App Store or Google Play on your device.",
    );
  }

  await ensureStoreConnection();
  await deepLinkToSubscriptions({
    skuAndroid: ALL_STAR_SUBSCRIPTION_ID,
    packageNameAndroid: ANDROID_PACKAGE_NAME,
  });
}

export async function syncActiveAllStarEntitlement(): Promise<boolean> {
  if (!isIapSupportedEnvironment()) return false;

  try {
    await ensureStoreConnection();
    const active = await getActiveSubscriptions([ALL_STAR_SUBSCRIPTION_ID]);
    const entitlement = active.find(
      (item) => item.isActive && isAllStarProduct(item.productId),
    );
    if (!entitlement) return false;

    await syncAllStarPurchase({
      productId: entitlement.productId,
      transactionId: entitlement.transactionId,
      purchaseToken: entitlement.purchaseToken ?? null,
      platform: Platform.OS,
      transactionDate: entitlement.transactionDate,
      restored: true,
    });
    return true;
  } catch {
    return false;
  }
}
