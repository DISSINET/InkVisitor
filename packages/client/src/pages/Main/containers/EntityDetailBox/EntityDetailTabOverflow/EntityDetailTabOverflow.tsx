import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { IResponseEntity } from "@inkvisitor/shared/types";
import { IcoCaretDown } from "Theme/icons";
import { EntityTag } from "components/advanced";
import React, { useState } from "react";
import { CgClose } from "react-icons/cg";
import {
  StyledOverflowButton,
  StyledOverflowCount,
  StyledOverflowList,
  StyledOverflowRow,
  StyledOverflowTagWrap,
} from "./EntityDetailTabOverflowStyles";

/** Gap (px) the list keeps from the edge of the page. */
const PANEL_VIEWPORT_PADDING = 8;

interface EntityDetailTabOverflow {
  entities: IResponseEntity[];
  onSelect: (entityId: string) => void;
  onClose: (entityId: string) => void;
}
export const EntityDetailTabOverflow: React.FC<EntityDetailTabOverflow> = ({
  entities,
  onSelect,
  onClose,
}) => {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    middleware: [
      offset(2),
      flip({ padding: PANEL_VIEWPORT_PADDING }),
      shift({ padding: PANEL_VIEWPORT_PADDING }),
      // the list runs as far down the page as there is room for it
      size({
        padding: PANEL_VIEWPORT_PADDING,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${availableHeight}px`;
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <>
      <StyledOverflowButton ref={refs.setReference} type="button" {...getReferenceProps()}>
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
                onClick={() => {
                  setOpen(false);
                  onSelect(entity.id);
                }}
              >
                <StyledOverflowTagWrap>
                  <EntityTag
                    entity={entity}
                    fullWidth
                    disableDrag
                    disableDoubleClick
                    tooltipPosition="left"
                    unlinkButton={{
                      onClick: () => onClose(entity.id),
                      tooltipLabel: "close tab",
                      icon: <CgClose />,
                    }}
                  />
                </StyledOverflowTagWrap>
              </StyledOverflowRow>
            ))}
          </StyledOverflowList>
        </FloatingPortal>
      )}
    </>
  );
};
