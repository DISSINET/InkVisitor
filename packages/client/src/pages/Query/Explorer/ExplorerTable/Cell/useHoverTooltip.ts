import { useEffect, useRef, useState } from "react";

/**
 * Visibility of a tooltip opened by hovering a trigger. Leaving the trigger
 * hides it after a short delay, which entering the tooltip cancels: Tooltip
 * fades out on `visible` alone, even while hovered.
 */
export const useHoverTooltip = (hideDelay = 150) => {
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  useEffect(() => clearHideTimeout, []);

  return {
    visible,
    onTriggerMouseEnter: () => {
      clearHideTimeout();
      setVisible(true);
    },
    onTriggerMouseLeave: () => {
      clearHideTimeout();
      hideTimeoutRef.current = window.setTimeout(() => {
        hideTimeoutRef.current = null;
        setVisible(false);
      }, hideDelay);
    },
    onTooltipMouseEnter: () => {
      clearHideTimeout();
      setVisible(true);
    },
    onTooltipMouseLeave: () => {
      clearHideTimeout();
      setVisible(false);
    },
  };
};
