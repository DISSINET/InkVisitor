import api from "api";
import { ButtonGroup, Button, Submit } from "components";
import React, { useState } from "react";
import { FaTrashAlt, FaStar, FaPlus } from "react-icons/fa";

import {
  StyledContextButtonGroup,
  StyledFaChevronCircleDown,
  StyledWrapper,
} from "./ContextMenuStyles";

interface ContextMenu {
  actantId: string;
}
export const ContextMenu: React.FC<ContextMenu> = ({ actantId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <>
      <StyledWrapper
        onMouseOver={() => setShowMenu(true)}
        onMouseOut={() => setShowMenu(false)}
      >
        <StyledFaChevronCircleDown />

        <StyledContextButtonGroup showMenu={showMenu}>
          <Button
            key="add"
            icon={<FaPlus size={14} />}
            color="info"
            onClick={() => {
              // add child
            }}
          />
          <Button
            key="favorites"
            icon={<FaStar size={14} />}
            color="warning"
            onClick={() => {
              // add to favorites
            }}
          />
          <Button
            key="delete"
            icon={<FaTrashAlt size={14} />}
            color="danger"
            onClick={() => {
              setShowSubmit(true);
            }}
          />
        </StyledContextButtonGroup>
      </StyledWrapper>
      <Submit
        title={"Delete Territory"}
        text={`Do you really want do delete territory with ID [${actantId}]?`}
        show={showSubmit}
        onSubmit={() => {
          api.actantsDelete(actantId);
          setShowSubmit(false);
        }}
        onCancel={() => setShowSubmit(false)}
      />
    </>
  );
};
