import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IResponseEntity } from "@inkvisitor/shared/types";
import { IcoCaretDown } from "Theme/icons";
import { TypeBar } from "components";
import React, { useState } from "react";
import { getEntityLabel } from "utils/utils";
import {
  StyledOverflowButton,
  StyledOverflowCount,
  StyledOverflowLabel,
  StyledOverflowList,
  StyledOverflowRow,
  StyledOverflowRowClose,
} from "./EntityDetailTabOverflowStyles";

interface EntityDetailTabOverflow {
  entities: IResponseEntity[];
  selectedDetailId: string;
  onSelect: (entityId: string) => void;
  onClose: (entityId: string) => void;
}
export const EntityDetailTabOverflow: React.FC<EntityDetailTabOverflow> = ({
  entities,
  selectedDetailId,
  onSelect,
  onClose,
}) => {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    middleware: [offset(2), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const hasSelected = entities.some((entity) => entity.id === selectedDetailId);

  return (
    <>
      <StyledOverflowButton
        ref={refs.setReference}
        type="button"
        $hasSelected={hasSelected}
        {...getReferenceProps()}
      >
        <StyledOverflowCount>{`+${entities.length}`}</StyledOverflowCount>
        <IcoCaretDown size={11} />
      </StyledOverflowButton>

      {open && (
        <FloatingPortal id="page-content">
          <StyledOverflowList
            ref={refs.setFloating}
            style={{ zIndex: 200, ...floatingStyles }}
            {...getFloatingProps()}
          >
            {entities.map((entity) => (
              <StyledOverflowRow
                key={entity.id}
                $isSelected={entity.id === selectedDetailId}
                onClick={() => {
                  setOpen(false);
                  onSelect(entity.id);
                }}
              >
                <TypeBar
                  entityLetter={entity.class}
                  isTemplate={entity.isTemplate}
                  noMargin
                  dimColor={entity.id !== selectedDetailId}
                />
                <StyledOverflowLabel
                  $isItalic={entity.class === EntityEnums.Class.Statement && !entity.labels[0]}
                >
                  {getEntityLabel(entity)}
                </StyledOverflowLabel>
                <StyledOverflowRowClose
                  size={13}
                  strokeWidth={0.5}
                  onClick={(event: React.MouseEvent) => {
                    // the row click would open the tab this click removes
                    event.stopPropagation();
                    onClose(entity.id);
                  }}
                />
              </StyledOverflowRow>
            ))}
          </StyledOverflowList>
        </FloatingPortal>
      )}
    </>
  );
};
