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
      <Button label="Trigger toast!" onClick={() => toast("Ahoj!")} />
      <Toast />
    </>
  );
};

export const DarkToast = () => {
  return (
    <>
      <Button label="Trigger toast!" onClick={() => toast.dark("Ahoj!")} />
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
        onClick={() => toast.success("Success!")}
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
      <Button label="Trigger toast!" onClick={() => toast.error("Error!")} />
      <Toast />
    </>
  );
};
