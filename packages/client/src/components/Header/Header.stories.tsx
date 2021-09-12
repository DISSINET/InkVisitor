import * as React from "react";
import { Header, Button } from "components";

export default {
  title: "Header",
  component: Header,
  parameters: {
    info: { inline: true },
  },
  argTypes: {
    color: {
      options: ["primary", "info", "success", "danger", "warning", "black"],
      control: { type: "select" },
    },
    left: {
      control: false,
    },
    right: {
      control: false,
    },
  },
};

export const DefaultHeader = ({ ...args }) => {
  return <Header {...args} />;
};

export const LeftButtonContentHeader = ({ ...args }) => {
  return (
    <Header
      {...args}
      left={<Button label="button on the left side" color="success" />}
    />
  );
};
LeftButtonContentHeader.args = {
  color: "info",
};

export const LeftLabelContentHeader = ({ ...args }) => {
  return (
    <Header
      {...args}
      left={
        <div>
          <h1>h1 - Header title</h1>
          <h2>h2 - Header title</h2>
          <h3>h3 - Header title</h3>
          <h4>h4 - Header title</h4>
          <h5>h5 - Header title</h5>
          <h6>h6 - Header title</h6>
        </div>
      }
    />
  );
};

export const RightSimpleContentHeader = ({ ...args }) => {
  return (
    <Header
      {...args}
      right={<Button color="danger" label="button on the right side" />}
    />
  );
};
export const RightAndLeftSimpleContentHeader = ({ ...args }) => {
  return (
    <Header
      {...args}
      paddingY={40}
      left={<div className="text-5xl">header</div>}
      right={<Button label="button on the right side" inverted />}
    />
  );
};
RightAndLeftSimpleContentHeader.args = {
  color: "info",
};

export const RightAndLeftTextContentHeader = ({ ...args }) => {
  return (
    <Header
      {...args}
      left={<div className="text-5xl">very very long and big header</div>}
      right={<div className="text-sm">logged as admin</div>}
    />
  );
};

export const VariousSizesHeader = () => {
  return (
    <div>
      <Header
        left={<div>header with auto height</div>}
        right={<div>right content</div>}
      />
      <br />

      <Header
        height={50}
        color="info"
        left={<div className="text-xl">header with 50pxs</div>}
        right={<div className="text-sm">right content</div>}
      />
      <br />

      <Header
        height={100}
        color="warning"
        left={<div className="text-xl">header with 100pxs</div>}
        right={<div className="text-sm">right content</div>}
      />
      <br />

      <Header
        height={250}
        color="danger"
        left={<div className="text-xl">header with 250pxs</div>}
        right={<div className="text-sm">right content</div>}
      />
      <br />

      <Header
        height={50}
        color="success"
        left={
          <div className="text-xl">
            Very long text that would probably wrap and the user does not see
            the full length while the header is too narrow
          </div>
        }
        right={<div className="text-sm">right content</div>}
      />
    </div>
  );
};

export const CustomPaddingHeader = () => {
  return (
    <div>
      <Header
        paddingX={80}
        paddingY={0}
        left={<div className="text-xl">no Y padding</div>}
        right={<div className="text-sm">right content</div>}
      />

      <br />
      <Header
        color="info"
        paddingX={0}
        paddingY={80}
        left={<div className="text-xl">no X padding</div>}
        right={<div className="text-sm">right content</div>}
      />
    </div>
  );
};
