import { useCallback, useState } from "react";

import type { FloatingAlertVariant } from "../components/FloatingAlert";

interface FloatingAlertState {
  message: string;
  variant: FloatingAlertVariant;
}

export function useFloatingAlert() {
  const [alert, setAlert] = useState<FloatingAlertState | null>(null);

  const show = useCallback(
    (message: string, variant: FloatingAlertVariant = "success") => {
      setAlert({ message, variant });
    },
    [],
  );

  const dismiss = useCallback(() => {
    setAlert(null);
  }, []);

  return {
    message: alert?.message ?? null,
    variant: alert?.variant ?? "success",
    show,
    dismiss,
  };
}
