import api from "api";
import { ToastWithLink } from "components";
import React, { useEffect } from "react";
import { toast } from "react-toastify";

const CHECK_INTERVAL = 10 * 60 * 1000;
const TOAST_ID = "new-version-available";

/**
 * Watches the buildTimestamp reported by /health. A change mid-session means a
 * new image was deployed and the bundles this tab is running no longer exist
 * on the server. Offers a reload via toast rather than forcing one, so
 * unsaved work survives.
 *
 * The first reported value is taken as the baseline instead of comparing
 * against the client's own baked-in timestamp — the client bundle and the
 * server image are stamped at different moments of the same build, so the two
 * never match exactly.
 */
export function useNewVersionCheck() {
  useEffect(() => {
    let baseline: string | undefined;
    let disposed = false;

    const check = async () => {
      let buildTimestamp: string | undefined;
      try {
        const response = await api.health({ ignoreErrorToast: true });
        buildTimestamp = response.data.buildTimestamp;
      } catch {
        // server unreachable (mid-deploy restart) — the next tick will see it
        return;
      }
      // empty outside the container (local dev), where there is nothing to watch
      if (disposed || !buildTimestamp) {
        return;
      }
      if (!baseline) {
        baseline = buildTimestamp;
        return;
      }
      if (baseline !== buildTimestamp) {
        toast.info(
          <ToastWithLink
            children={"A new version was deployed. This tab still runs the previous one — reload when convenient."}
            linkText={"Reload"}
            onLinkClick={() => window.location.reload()}
          />,
          {
            toastId: TOAST_ID,
            autoClose: false,
            closeOnClick: false,
          }
        );
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => {
      disposed = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}
