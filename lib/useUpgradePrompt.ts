import { useCallback, useState } from "react";

import { SubscriptionError } from "../lib/subscription";

export function useUpgradePrompt() {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState<string | undefined>();

  const promptUpgrade = useCallback((message?: string) => {
    setReason(message);
    setVisible(true);
  }, []);

  const closeUpgrade = useCallback(() => {
    setVisible(false);
  }, []);

  const handleSubscriptionError = useCallback(
    (error: unknown, fallback?: string) => {
      if (error instanceof SubscriptionError) {
        promptUpgrade(error.message);
        return true;
      }
      if (fallback) {
        promptUpgrade(fallback);
        return true;
      }
      return false;
    },
    [promptUpgrade],
  );

  return {
    upgradeVisible: visible,
    upgradeReason: reason,
    promptUpgrade,
    closeUpgrade,
    handleSubscriptionError,
  };
}
