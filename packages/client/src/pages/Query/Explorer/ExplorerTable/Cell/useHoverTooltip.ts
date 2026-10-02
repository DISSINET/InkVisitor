import { useEffect, useRef, useState } from "react";

/**
 * Visibility of a tooltip opened by hovering a trigger. Leaving the trigger
 * hides it after a short delay, long enough for the cursor to cross into the
 * tooltip, which Tooltip keeps open for as long as it is hovered.
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
    onTooltipMouseLeave: () => {
      clearHideTimeout();
      setVisible(false);
    },
  };
};
