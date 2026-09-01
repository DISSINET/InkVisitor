import React from "react";
import { theme, ToastWithLink } from "dissinet.ddb.client";

// ToastWithLink itself is plain markup (a flex row + a styled link) with no
// react-toastify dependency of its own — the toast chrome (background color,
// padding, icon) comes from the Toastify classes the Toast container styles,
// which only exist once react-toastify actually mounts the content this
// renders inside a real toast() call. Every real call site uses toast.info(),
// so this card approximates that context with the same background/padding
// the Toast component's styles apply to `.Toastify__toast--info`.
const ToastChrome: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "flex",
      color: theme.color.white,
      background: theme.color.info,
      borderRadius: theme.borderRadius.default,
      padding: `${theme.space[5]} ${theme.space[6]}`,
      width: 360,
    }}
  >
    {children}
  </div>
);

export const Default = () => (
  <ToastChrome>
    <ToastWithLink linkText="Restore" onLinkClick={() => {}}>
      Statement deleted!
    </ToastWithLink>
  </ToastChrome>
);

export const LongMessage = () => (
  <ToastChrome>
    <ToastWithLink linkText="Reload" onLinkClick={() => {}}>
      A new version was deployed. This tab still runs the previous one — reload when convenient.
    </ToastWithLink>
  </ToastChrome>
);

export const EntityRestore = () => (
  <ToastChrome>
    <ToastWithLink linkText="Restore" onLinkClick={() => {}}>
      Territory [Council of Trent] deleted!
    </ToastWithLink>
  </ToastChrome>
);
