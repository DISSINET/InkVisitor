import * as React from "react";
import { Arrow, Button, Tag } from "components";
import styled from "styled-components";

export default {
  title: "Arrow",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultArrow = () => {
  return <Arrow />;
};
export const TopArrow = () => {
  return <Arrow rotation="top" />;
};
export const BottomArrow = () => {
  return <Arrow rotation="bottom" />;
};
export const LeftArrow = () => {
  return <Arrow rotation="left" />;
};
export const RightArrow = () => {
  return <Arrow rotation="right" />;
};
export const ArrowWithButton = () => {
  const setStyle = {
    alignItems: "center",
    display: "flex",
  };
  return (
    <div>
      <div style={setStyle}>
        <Button label="primary right" color="primary" />
        <Arrow rotation="right" color="primary" />
        <Arrow rotation="right" color="primary" />
      </div>
      <div style={setStyle}>
        <Button label="info left" color="info" />
        <Arrow rotation="left" color="info" />
        <Arrow rotation="left" color="info" />
      </div>
      <div style={setStyle}>
        <Button label="warning top" color="warning" />
        <Arrow rotation="top" color="warning" />
        <Arrow rotation="top" color="warning" />
      </div>
      <div style={setStyle}>
        <Button label="danger bottom" color="danger" />
        <Arrow rotation="bottom" color="danger" />
        <Arrow rotation="bottom" color="danger" />
      </div>
    </div>
  );
};
export const AllArrows = () => {
  const size = 20;
  return (
    <>
      <RowBox>
        <BorderBox>
          <Arrow rotation="top" size={size} color="success" />
        </BorderBox>
        <BorderBox>
          <Arrow rotation="right" size={size} color="success" />
        </BorderBox>
        <BorderBox>
          <Arrow rotation="bottom" size={size} color="success" />
        </BorderBox>
        <BorderBox>
          <Arrow rotation="left" size={size} color="success" />
        </BorderBox>
      </RowBox>
      <ColumnBox>
        <BorderBox>
          <Arrow rotation="top" size={size} color="danger" />
          <Button label="Test" />
        </BorderBox>
        <BorderBox>
          <Arrow rotation="right" size={size} color="danger" />
          <Button label="Test" />
        </BorderBox>
        <BorderBox>
          <Arrow rotation="bottom" size={size} color="danger" />
          <Button label="Test" />
        </BorderBox>
        <BorderBox>
          <Arrow rotation="left" size={size} color="danger" />
          <Button label="Test" />
        </BorderBox>
      </ColumnBox>
    </>
  );
};
const BorderBox = styled.div`
  display: inline-flex;
  border: 1px solid black;
`;
const RowBox = styled.div`
  display: flex;
`;
const ColumnBox = styled.div`
  display: flex;
  flex-direction: column;
`;
