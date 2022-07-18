import React, { useState } from "react";

import { Button, Submit } from "components";

export default {
  title: "Submit",
  parameters: {
    info: { inline: true },
  },
  args: {
    title: "Submit title",
    text: "Do you really want to submit?",
  },
};

export const DefaultSubmit = ({ ...args }) => {
  const [showSubmit, setShowSubmit] = useState(false);
  return (
    <>
      <Button label="Show submit!" onClick={() => setShowSubmit(true)} />
      <Submit
        {...args}
        onSubmit={() => {
          alert("You've submitted!");
          setShowSubmit(false);
        }}
        onCancel={() => setShowSubmit(false)}
        show={showSubmit}
      />
    </>
  );
};
