import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "react-toastify";

import { Entities } from "types";
import {
  Box,
  Button,
  ButtonGroup,
  Input,
  Submit,
  Tag,
  Toast,
  Toggle,
} from "components";
import styled from "styled-components";
import { useState } from "react";

export default {
  title: "Layout",
  parameters: {
    info: { inline: true },
  },
};

export const Layout1 = () => {
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <DndProvider backend={HTML5Backend}>
      <ButtonGroup>
        <Button
          label="Submit!"
          color="danger"
          onClick={() => setShowSubmit(true)}
        />
        <Button label="warning" color="warning" />
        <Button label="Toast!" color="info" onClick={() => toast.dark("Hi!")} />
        <Toast />
      </ButtonGroup>

      <Tag
        propId="0"
        category={Entities["T"].id}
        color={Entities["T"].color}
        label="entity label"
        button={<Button label="x" color="danger" />}
      />
      <Tag
        propId="1"
        category={Entities["T"].id}
        color={Entities["T"].color}
        label="selected entity label"
        invertedLabel
        button={<Button label="x" color="danger" />}
      />
      <Input value="default input" onChangeFn={() => {}} />
      <Box label="default box" width={500} height={700}>
        <div>
          <Toggle
            optionList={[
              { value: "0", label: "This text is too long to handle" },
              { value: "1", label: "Another long which is too long to handle" },
              { value: "2", label: "Masarykova" },
              { value: "3", label: "Univerzita" },
            ]}
            selectedValue={"0"}
            color="danger"
          />
        </div>
        <>
          <FontXs>FontXs</FontXs>
          <FontSm>FontSm</FontSm>
          <FontBase>FontBase</FontBase>
          <FontLg>FontLg</FontLg>
          <FontXl>FontXl</FontXl>
          <Font2Xl>Font2Xl</Font2Xl>
          <Font3Xl>Font3Xl</Font3Xl>
          <Font4Xl>Font4Xl</Font4Xl>
          <Font5Xl>Font5Xl</Font5Xl>
          <Font6Xl>Font6Xl</Font6Xl>
        </>
      </Box>
      <Submit
        title="Submit title"
        text="Do you really want to submit?"
        onSubmit={() => {
          alert("You've submitted!");
          setShowSubmit(false);
        }}
        onCancel={() => setShowSubmit(false)}
        show={showSubmit}
      />
    </DndProvider>
  );
};

const FontXs = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
const FontSm = styled.p`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
const FontBase = styled.p`
  font-size: ${({ theme }) => theme.fontSize["base"]};
`;
const FontLg = styled.p`
  font-size: ${({ theme }) => theme.fontSize["lg"]};
`;
const FontXl = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xl"]};
`;
const Font2Xl = styled.p`
  font-size: ${({ theme }) => theme.fontSize["2xl"]};
`;
const Font3Xl = styled.p`
  font-size: ${({ theme }) => theme.fontSize["3xl"]};
`;
const Font4Xl = styled.p`
  font-size: ${({ theme }) => theme.fontSize["4xl"]};
`;
const Font5Xl = styled.p`
  font-size: ${({ theme }) => theme.fontSize["5xl"]};
`;
const Font6Xl = styled.p`
  font-size: ${({ theme }) => theme.fontSize["6xl"]};
`;
