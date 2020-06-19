import * as React from "react";
import { Button, ButtonSet } from "components";

export default {
  title: "ButtonSet",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultButtonSet = () => {
  return (
    <ButtonSet
      buttons={[
        <Button label="button 1" color="primary" />,
        <Button label="button 2" color="warning" />,
        <Button label="button 3" color="danger" />,
        <Button label="button 4" color="info" />,
      ]}
    />
  );
};
