import { AsymmetricalAnchor } from "@inkvisitor/annotator/src/lib";
import { ButtonGroup, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { Button } from "components/basic/Button/Button";
import { EntityTagById } from "components/advanced/EntityTag/EntityTagById";
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { FaScissors } from "react-icons/fa6";
import { TbAnchor } from "react-icons/tb";
import { ButtonSize } from "types";
import {
  StyledWarningInfo,
  StyledWarningKind,
  StyledWarningRow,
  StyledWarningsChip,
  StyledWarningsList,
  StyledWarningsListHeader,
} from "./AnnotatorStyles";

const warningsTitle = (count: number): string => `asymmetrical anchor${count === 1 ? "" : "s"}`;

const issuesFoundLabel = (count: number): string =>
  `${count} issue${count === 1 ? "" : "s"} found in the document`;

/**
 * Compact, always-visible trigger: a small warning icon + count. Clicking it
 * opens the warnings modal. Exported so it can be rendered next to the document
 * title (outside the annotator) while the modal stays inside the annotator.
 */
export const WarningsChip: React.FC<{ count: number; onClick: () => void }> = ({
  count,
  onClick,
}) => (
  <StyledWarningsChip type="button" onClick={onClick} title={warningsTitle(count)}>
    <FaExclamationTriangle size={13} />
    {count}
  </StyledWarningsChip>
);

interface AnnotatorWarningsModalProps {
  anchors: AsymmetricalAnchor[];
  onUnlink: (tagName: string, position: number, segmentIndex: number) => void;
  onScrollTo: (tagName: string, position: number, segmentIndex: number) => void;
  /** Controlled open state of the description modal. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Render the inline chip trigger here too (false when it lives elsewhere). */
  showChip?: boolean;
  isLoading?: boolean;
}

const kindLabel = (type: AsymmetricalAnchor["type"]): string =>
  type === "orphaned-opening" ? "orphaned opening" : "orphaned closing";

/**
 * Surfaces asymmetrical (broken) anchors detected by the annotator (#2601).
 * The full description (entity by EntityTag + unlink + scroll-to) opens in a
 * modal; the always-visible footprint is just the WarningsChip. Renders nothing
 * when there are no issues.
 */
export const AnnotatorWarningsModal: React.FC<AnnotatorWarningsModalProps> = ({
  anchors,
  onUnlink,
  onScrollTo,
  open,
  onOpenChange,
  showChip = true,
  isLoading = false,
}) => {
  if (anchors.length === 0) {
    return null;
  }

  return (
    <>
      {showChip && <WarningsChip count={anchors.length} onClick={() => onOpenChange(true)} />}

      <Modal width="auto" showModal={open} onClose={() => onOpenChange(false)}>
        <ModalHeader
          title={"Asymmetrical anchors"}
          icon={<FaExclamationTriangle />}
          iconColor="warning"
          onClose={() => onOpenChange(false)}
        />
        <ModalContent column enableScroll isLoading={isLoading}>
          <StyledWarningsListHeader>{issuesFoundLabel(anchors.length)}</StyledWarningsListHeader>
          <StyledWarningsList>
            {anchors.map((anchor, index) => (
              <StyledWarningRow
                key={`${anchor.tagName}-${anchor.segmentIndex}-${anchor.position}-${index}`}
              >
                <Button
                  icon={<TbAnchor />}
                  size={ButtonSize.Large}
                  color="success"
                  inverted
                  noBorder
                  radiusLeft
                  radiusRight
                  tooltipLabel="scroll to anchor in text (RAW mode)"
                  onClick={() => {
                    onScrollTo(anchor.tagName, anchor.position, anchor.segmentIndex);
                    // Close so the (now RAW-mode, scrolled) text is visible.
                    onOpenChange(false);
                  }}
                />
                <StyledWarningInfo>
                  <StyledWarningKind>{kindLabel(anchor.type)}</StyledWarningKind>
                  <EntityTagById
                    entityId={anchor.tagName}
                    disableToast
                    fullWidth
                    disableTooltip={false}
                  />
                </StyledWarningInfo>
                <ButtonGroup>
                  {/* <Button
                    icon={<TbAnchor />}
                    label="locate anchor"
                    color="info"
                    // inverted
                    tooltipLabel="locate anchor in text (RAW mode)"
                    onClick={() => {
                      onScrollTo(anchor.tagName, anchor.position, anchor.segmentIndex);
                      onOpenChange(false);
                    }}
                  /> */}
                  <Button
                    icon={<FaScissors />}
                    label="remove"
                    color="success"
                    // inverted
                    tooltipLabel="unlink broken anchor"
                    onClick={() => onUnlink(anchor.tagName, anchor.position, anchor.segmentIndex)}
                  />
                </ButtonGroup>
              </StyledWarningRow>
            ))}
          </StyledWarningsList>
        </ModalContent>
        <ModalFooter note="Anchors must have matching opening and closing tags">
          <Button label="close" color="primary" inverted onClick={() => onOpenChange(false)} />
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AnnotatorWarningsModal;
