import * as React from "react";
import { toast } from "react-toastify";

import { Toast, Button } from "components";

export default {
  title: "Toast",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultToast = () => {
  return (
    <>
      <Button
        label="Trigger toast!"
        onClick={() =>
          toast(
            "Default toast! This message is a bit long. Though you can see that it still looks fine."
          )
        }
      />
      <Toast />
    </>
  );
};

export const DarkToast = () => {
  return (
    <>
      <Button label="Trigger toast!" onClick={() => toast.dark("I'm dark!")} />
      <Toast />
    </>
  );
};
export const InfoToast = () => {
  return (
    <>
      <Button label="Trigger toast!" onClick={() => toast.info("Info")} />
      <Toast />
    </>
  );
};
export const SuccessToast = () => {
  return (
    <>
      <Button
        label="Trigger toast!"
        onClick={() => toast.success("Entity saved!")}
      />
      <Toast />
    </>
  );
};
export const WarningToast = () => {
  return (
    <>
      <Button
        label="Trigger toast!"
        onClick={() => toast.warning("Warning!")}
      />
      <Toast />
    </>
  );
};
export const ErrorToast = () => {
  return (
    <>
      <Button
        label="Trigger toast!"
        onClick={() =>
          toast.error(
            "Error! When something is broken, you can see it instantly."
          )
        }
      />
      <Toast />
    </>
  );
};
