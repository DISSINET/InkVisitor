import React, { useEffect } from "react";
import { theme, Toast, toast } from "dissinet.ddb.client";

// Toast is only the react-toastify container — it renders nothing on its own,
// and everything visible comes from a `toast.*()` call elsewhere in the app.
// The pair is what's real, so each cell mounts the container and raises the
// notifications it is meant to show. `autoClose: false` per call overrides the
// container's 4.5s dismissal, which would otherwise race the capture.
const Stage: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "relative",
      width: 480,
      height: 220,
      background: theme.color.white,
    }}
  >
    {children}
  </div>
);

const useToasts = (raise: () => void) => {
  useEffect(() => {
    toast.dismiss();
    raise();
    return () => toast.dismiss();
  }, []);
};

export const Success = () => {
  useToasts(() =>
    toast.success("Statement saved", { autoClose: false })
  );
  return (
    <Stage>
      <Toast />
    </Stage>
  );
};

export const Severities = () => {
  useToasts(() => {
    toast.info("Territory moved under Council of Trent", { autoClose: false });
    toast.success("Entity created", { autoClose: false });
    toast.warning("This territory has no statements", { autoClose: false });
    toast.error("Could not reach the server", { autoClose: false });
  });
  return (
    <Stage>
      <Toast />
    </Stage>
  );
};

export const LongMessage = () => {
  useToasts(() =>
    toast.warning(
      "Charles V is referenced by 24 statements — deleting it will leave them without a subject.",
      { autoClose: false }
    )
  );
  return (
    <Stage>
      <Toast />
    </Stage>
  );
};
